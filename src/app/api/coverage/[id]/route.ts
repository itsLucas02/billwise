import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { coverageChecks } from "@/db/schema";
import { isProviderId } from "@/lib/providers";
import { UUID_RE, ensureSchema, getUserId, jsonError, readJson, str } from "@/lib/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const STATUSES = ["unchecked", "available", "unavailable", "waitlist"];

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return jsonError("Not found", 404);
  await ensureSchema();
  const userId = await getUserId(req);
  const where = and(eq(coverageChecks.id, id), eq(coverageChecks.userId, userId));
  const [current] = await db.select().from(coverageChecks).where(where).limit(1);
  if (!current) return jsonError("Not found", 404);

  const body = await readJson(req);
  const statuses = { ...(current.statuses ?? {}) };
  if (body.statuses && typeof body.statuses === "object") {
    for (const [k, v] of Object.entries(body.statuses as Record<string, unknown>)) {
      if (isProviderId(k) && typeof v === "string" && STATUSES.includes(v)) statuses[k] = v;
    }
  }
  const [row] = await db
    .update(coverageChecks)
    .set({
      statuses,
      notes: typeof body.notes === "string" ? body.notes.slice(0, 2000) : current.notes,
      label: str(body.label, 60) ?? current.label,
      updatedAt: new Date(),
    })
    .where(where)
    .returning();
  return Response.json({ item: row });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return jsonError("Not found", 404);
  await ensureSchema();
  const userId = await getUserId(req);
  await db.delete(coverageChecks).where(and(eq(coverageChecks.id, id), eq(coverageChecks.userId, userId)));
  return Response.json({ ok: true });
}
