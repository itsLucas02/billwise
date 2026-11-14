import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { savedPlans } from "@/db/schema";
import { getPlan } from "@/lib/plans";
import { ensureSchema, getUserId, jsonError, readJson } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureSchema();
  const userId = await getUserId(req);
  const rows = await db
    .select({ planId: savedPlans.planId })
    .from(savedPlans)
    .where(eq(savedPlans.userId, userId))
    .orderBy(desc(savedPlans.createdAt));
  return Response.json({ planIds: rows.map((r) => r.planId).filter((id) => getPlan(id)) });
}

export async function POST(req: Request) {
  await ensureSchema();
  const userId = await getUserId(req);
  const body = await readJson(req);
  const planId = typeof body.planId === "string" ? body.planId : "";
  if (!getPlan(planId)) return jsonError("Unknown plan");
  await db.insert(savedPlans).values({ userId, planId }).onConflictDoNothing();
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  await ensureSchema();
  const userId = await getUserId(req);
  const planId = new URL(req.url).searchParams.get("planId") ?? "";
  await db.delete(savedPlans).where(and(eq(savedPlans.userId, userId), eq(savedPlans.planId, planId)));
  return Response.json({ ok: true });
}
