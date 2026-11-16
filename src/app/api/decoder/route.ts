import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { billAnalyses } from "@/db/schema";
import { decodeBill } from "@/lib/decoder";
import { isProviderId } from "@/lib/providers";
import { ensureSchema, getUserId, jsonError, num, readJson, str } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureSchema();
  const userId = await getUserId(req);
  const items = await db
    .select({
      id: billAnalyses.id,
      title: billAnalyses.title,
      provider: billAnalyses.provider,
      total: billAnalyses.total,
      score: billAnalyses.score,
      source: billAnalyses.source,
      createdAt: billAnalyses.createdAt,
    })
    .from(billAnalyses)
    .where(eq(billAnalyses.userId, userId))
    .orderBy(desc(billAnalyses.createdAt))
    .limit(30);
  return Response.json({ items });
}

export async function POST(req: Request) {
  await ensureSchema();
  const userId = await getUserId(req);
  const body = await readJson(req);
  const text = typeof body.text === "string" ? body.text.slice(0, 20000) : "";
  if (text.trim().length < 6) return jsonError("Please paste your bill text or add some charges first.");

  const provider = isProviderId(body.provider) ? body.provider : "";
  const promisedPrice = num(body.promisedPrice, 0, 10000);
  const usualAmount = num(body.usualAmount, 0, 100000);
  const analysis = decodeBill({ text, provider, promisedPrice, usualAmount });
  if (!analysis.items.length) {
    return jsonError("We couldn't find any charges. Make sure each line has a description and an amount, like “Monthly fee 139.00”.", 422);
  }

  const source = ["paste", "sample", "manual"].includes(String(body.source)) ? String(body.source) : "paste";
  const name = analysis.meta.provider ? analysis.meta.providerName : "Telco";
  const title = str(body.title, 120) ?? `${name} bill${analysis.meta.billDate ? ` · ${analysis.meta.billDate}` : ""}`;

  // Decoding the same text with the same answers again refreshes the existing entry instead of saving a duplicate.
  const inputs = { provider, promisedPrice, usualAmount };
  const same = await db
    .select({ id: billAnalyses.id, inputs: billAnalyses.inputs })
    .from(billAnalyses)
    .where(and(eq(billAnalyses.userId, userId), eq(billAnalyses.rawText, text)));
  // Compare field by field: Postgres jsonb reorders keys, so stringified JSON never matches.
  const dup = same.find((r) => {
    const i = (r.inputs ?? {}) as Partial<typeof inputs>;
    return (i.provider ?? "") === inputs.provider && (i.promisedPrice ?? null) === inputs.promisedPrice && (i.usualAmount ?? null) === inputs.usualAmount;
  });
  if (dup) {
    const [row] = await db
      .update(billAnalyses)
      .set({ title, provider: analysis.meta.provider, source, result: analysis, total: analysis.totals.total, score: analysis.score, createdAt: new Date() })
      .where(eq(billAnalyses.id, dup.id))
      .returning({ id: billAnalyses.id, createdAt: billAnalyses.createdAt });
    return Response.json({ id: row.id, title, createdAt: row.createdAt, analysis, reused: true });
  }

  const [row] = await db
    .insert(billAnalyses)
    .values({
      userId,
      title,
      provider: analysis.meta.provider,
      source,
      rawText: text,
      inputs,
      result: analysis,
      total: analysis.totals.total,
      score: analysis.score,
    })
    .returning({ id: billAnalyses.id, createdAt: billAnalyses.createdAt });

  return Response.json({ id: row.id, title, createdAt: row.createdAt, analysis });
}
