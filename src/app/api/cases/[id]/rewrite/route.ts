import { and, count, desc, eq, gt, inArray } from "drizzle-orm";
import { db } from "@/db";
import { caseEvents, cases } from "@/db/schema";
import { REWRITE_ACTIONS, buildRewriteMessages, cleanRewrite, type RewriteAction } from "@/lib/ai";
import { ISSUES } from "@/lib/cases";
import { PROVIDERS } from "@/lib/providers";
import { UUID_RE, ensureSchema, getUserId, jsonError, readJson } from "@/lib/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAILY_LIMIT = 10; // protects the shared AI budget once the app is public

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return jsonError("Case not found", 404);
  const { LITELLM_API_KEY: key, LITELLM_BASE_URL: base, AI_MODEL: model = "gpt-5.4-mini" } = process.env;
  if (!key || !base) return jsonError("AI rewrite isn't available right now. Your draft is unchanged.", 503);

  const body = await readJson(req);
  const action = String(body.action) as RewriteAction;
  if (!Object.hasOwn(REWRITE_ACTIONS, action)) return jsonError("Unknown rewrite option.");
  const lang = body.lang === "ms" ? "ms" : "en";
  const draft = typeof body.draft === "string" ? body.draft.trim() : "";
  if (draft.length < 20) return jsonError("Write a little more in the draft first.");
  if (draft.length > 6000) return jsonError("The draft is too long to rewrite. Shorten it a little first.");

  await ensureSchema();
  const userId = await getUserId(req);
  const [row] = await db.select().from(cases).where(and(eq(cases.id, id), eq(cases.userId, userId))).limit(1);
  if (!row) return jsonError("Case not found", 404);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [{ used }] = await db
    .select({ used: count() })
    .from(caseEvents)
    .innerJoin(cases, eq(caseEvents.caseId, cases.id))
    .where(and(eq(cases.userId, userId), eq(caseEvents.kind, "ai"), gt(caseEvents.createdAt, since)));
  if (used >= DAILY_LIMIT) return jsonError(`You've used today's ${DAILY_LIMIT} AI rewrites. You can still edit the draft yourself.`, 429);

  const notes = action === "notes"
    ? (await db.select({ text: caseEvents.text }).from(caseEvents)
        .where(and(eq(caseEvents.caseId, row.id), inArray(caseEvents.kind, ["note", "contact", "reply"])))
        .orderBy(desc(caseEvents.createdAt)).limit(15)).map((e) => e.text).reverse()
    : [];
  if (action === "notes" && !notes.length) return jsonError("Add a note to the timeline first, then try again.");

  const messages = buildRewriteMessages({
    action,
    lang,
    draft,
    notes,
    facts: {
      provider: PROVIDERS[row.provider as keyof typeof PROVIDERS]?.name ?? row.provider,
      issue: ISSUES[row.issueType as keyof typeof ISSUES]?.label ?? row.issueType,
      chargeLabel: row.chargeLabel,
      amount: row.amount,
      billMonth: row.billMonth,
      promisedPrice: row.promisedPrice,
    },
  });

  let text: string | null = null;
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: 1500 }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) throw new Error(`AI provider returned ${res.status}`);
    const data = await res.json();
    text = cleanRewrite(String(data?.choices?.[0]?.message?.content ?? ""), draft);
  } catch (err) {
    console.error("[rewrite]", err instanceof Error ? err.message : err);
  }
  if (!text) return jsonError("The AI couldn't rewrite this just now. Your draft is unchanged — try again in a moment.", 502);

  await db.insert(caseEvents).values({ caseId: row.id, kind: "ai", text: `AI rewrite: ${REWRITE_ACTIONS[action].label.toLowerCase()}` });
  return Response.json({ text, remaining: DAILY_LIMIT - used - 1 });
}
