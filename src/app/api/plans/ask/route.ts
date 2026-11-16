import { and, count, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { aiUsage } from "@/db/schema";
import { PROPOSE_ANSWERS_TOOL, buildPlanChatMessages, cleanChatReply, extractProposal, proposalFromMessage, trimHistory } from "@/lib/ai";
import { PLANS_REVIEWED, getPlan } from "@/lib/plans";
import { PROVIDERS } from "@/lib/providers";
import { describePrefs, parsePrefs, proposeChange, recommend } from "@/lib/recommend";
import { ensureSchema, getUserId, jsonError, readJson } from "@/lib/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAILY_LIMIT = 10; // protects the shared AI budget once the app is public; separate from the rewrite cap
const FEATURE = "plan-chat";

export async function POST(req: Request) {
  const { LITELLM_API_KEY: key, LITELLM_BASE_URL: base, AI_MODEL: model = "gpt-5.4-mini" } = process.env;
  if (!key || !base) return jsonError("The plan assistant isn't available right now. Your matches above still apply.", 503);

  const body = await readJson(req);
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (question.length < 3) return jsonError("Type a question first.");
  if (question.length > 500) return jsonError("Keep the question under 500 characters.");
  const history = trimHistory(body.history);
  const prefs = parsePrefs(body.prefs && typeof body.prefs === "object" ? (body.prefs as Record<string, unknown>) : {});
  if (!prefs) return jsonError("Run the Plan Finder first, then ask about the results.");

  await ensureSchema();
  const userId = await getUserId(req);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [{ used }] = await db.select({ used: count() }).from(aiUsage).where(and(eq(aiUsage.userId, userId), eq(aiUsage.feature, FEATURE), gt(aiUsage.createdAt, since)));
  if (used >= DAILY_LIMIT) return jsonError(`You've asked today's ${DAILY_LIMIT} questions. The match cards above still explain each plan.`, 429);

  // Re-rank on the server: scores from the browser are never trusted.
  const result = recommend(prefs);
  const messages = buildPlanChatMessages({
    question,
    history,
    answers: describePrefs(prefs),
    needSummary: result.needSummary,
    reviewed: PLANS_REVIEWED,
    ranked: result.results.flatMap((rec) => {
      const plan = getPlan(rec.planId);
      return plan ? [{ rec, plan, providerName: PROVIDERS[plan.provider].name }] : [];
    }),
  });

  let text: string | null = null;
  let toolPatch: Record<string, unknown> | null = null;
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: 800, tools: [PROPOSE_ANSWERS_TOOL], tool_choice: "auto" }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) throw new Error(`AI provider returned ${res.status}`);
    const data = await res.json();
    const message = data?.choices?.[0]?.message;
    toolPatch = proposalFromMessage(message);
    // A tool call can come without text; give the card a short lead-in rather than failing.
    text = cleanChatReply(String(message?.content ?? "")) ?? (toolPatch ? "Here's what I'd change in your answers:" : null);
  } catch (err) {
    console.error("[plans/ask]", err instanceof Error ? err.message : err);
  }
  if (!text) return jsonError("The assistant couldn't answer just now. Try again in a moment.", 502);

  // The model may propose new answers; they are validated like form input and only applied when the customer taps "Update my matches".
  const { text: reply, patch: tagPatch } = extractProposal(text);
  if (!reply) return jsonError("The assistant couldn't answer just now. Try again in a moment.", 502);
  const patch = toolPatch ?? tagPatch;
  const proposal = patch ? proposeChange(prefs, patch) : null;

  await db.insert(aiUsage).values({ userId, feature: FEATURE });
  return Response.json({ text: reply, proposal, remaining: DAILY_LIMIT - used - 1 });
}
