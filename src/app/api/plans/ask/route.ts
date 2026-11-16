import { and, count, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { aiUsage } from "@/db/schema";
import { buildPlanChatMessages, cleanChatReply, type ChatTurn } from "@/lib/ai";
import { PLANS_REVIEWED, getPlan } from "@/lib/plans";
import { PROVIDERS } from "@/lib/providers";
import { describePrefs, parsePrefs, recommend } from "@/lib/recommend";
import { ensureSchema, getUserId, jsonError, readJson } from "@/lib/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAILY_LIMIT = 10; // protects the shared AI budget once the app is public

export async function POST(req: Request) {
  const { LITELLM_API_KEY: key, LITELLM_BASE_URL: base, AI_MODEL: model = "gpt-5.4-mini" } = process.env;
  if (!key || !base) return jsonError("The plan assistant isn't available right now. Your matches above still apply.", 503);

  const body = await readJson(req);
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (question.length < 3) return jsonError("Type a question first.");
  if (question.length > 500) return jsonError("Keep the question under 500 characters.");
  const history: ChatTurn[] = (Array.isArray(body.history) ? body.history : [])
    .filter((t): t is ChatTurn => (t?.role === "user" || t?.role === "assistant") && typeof t.content === "string")
    .slice(-6)
    .map((t) => ({ role: t.role, content: t.content.slice(0, 3000) }));
  const prefs = parsePrefs(body.prefs && typeof body.prefs === "object" ? (body.prefs as Record<string, unknown>) : {});

  await ensureSchema();
  const userId = await getUserId(req);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [{ used }] = await db.select({ used: count() }).from(aiUsage).where(and(eq(aiUsage.userId, userId), gt(aiUsage.createdAt, since)));
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
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: 800 }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) throw new Error(`AI provider returned ${res.status}`);
    const data = await res.json();
    text = cleanChatReply(String(data?.choices?.[0]?.message?.content ?? ""));
  } catch (err) {
    console.error("[plans/ask]", err instanceof Error ? err.message : err);
  }
  if (!text) return jsonError("The assistant couldn't answer just now. Try again in a moment.", 502);

  await db.insert(aiUsage).values({ userId, feature: "plan-chat" });
  return Response.json({ text, remaining: DAILY_LIMIT - used - 1 });
}
