import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { billAnalyses } from "@/db/schema";
import { UUID_RE, ensureSchema, getUserId, jsonError } from "@/lib/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return jsonError("Analysis not found", 404);
  await ensureSchema();
  const userId = await getUserId(req);
  const [row] = await db
    .select()
    .from(billAnalyses)
    .where(and(eq(billAnalyses.id, id), eq(billAnalyses.userId, userId)))
    .limit(1);
  if (!row) return jsonError("Analysis not found", 404);
  return Response.json({
    id: row.id,
    title: row.title,
    source: row.source,
    createdAt: row.createdAt,
    rawText: row.rawText,
    inputs: row.inputs,
    analysis: row.result,
  });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return jsonError("Analysis not found", 404);
  await ensureSchema();
  const userId = await getUserId(req);
  await db.delete(billAnalyses).where(and(eq(billAnalyses.id, id), eq(billAnalyses.userId, userId)));
  return Response.json({ ok: true });
}
