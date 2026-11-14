import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { caseEvents, cases } from "@/db/schema";
import { CASE_STATUSES, STATUS_INFO, type CaseStatus } from "@/lib/cases";
import { fmtDate, rm } from "@/lib/format";
import { UUID_RE, ensureSchema, getUserId, jsonError, num, readJson, str } from "@/lib/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function load(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return null;
  await ensureSchema();
  const userId = await getUserId(req);
  const [row] = await db.select().from(cases).where(and(eq(cases.id, id), eq(cases.userId, userId))).limit(1);
  return row ?? null;
}

export async function GET(req: Request, ctx: Ctx) {
  const row = await load(req, ctx);
  if (!row) return jsonError("Case not found", 404);
  const events = await db.select().from(caseEvents).where(eq(caseEvents.caseId, row.id)).orderBy(asc(caseEvents.createdAt));
  return Response.json({ item: row, events });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const row = await load(req, ctx);
  if (!row) return jsonError("Case not found", 404);
  const body = await readJson(req);
  const updates: Partial<typeof cases.$inferInsert> = { updatedAt: new Date() };
  const events: { kind: string; text: string }[] = [];

  if (typeof body.status === "string" && CASE_STATUSES.includes(body.status as CaseStatus) && body.status !== row.status) {
    const status = body.status as CaseStatus;
    updates.status = status;
    if ((status === "contacted" || status === "awaiting") && !row.contactedAt) updates.contactedAt = new Date();
    let text = `Status changed to “${STATUS_INFO[status].label}”.`;
    if (status === "resolved") {
      const recovered = num(body.resolvedAmount, 0, 100000);
      updates.resolvedAmount = recovered;
      if (recovered) text = `Resolved — ${rm(recovered)} refunded or credited.`;
      else text = "Marked as resolved.";
    }
    events.push({ kind: "status", text });
  }
  if ("providerRef" in body) {
    const ref = str(body.providerRef, 60);
    if (ref !== row.providerRef) {
      updates.providerRef = ref;
      if (ref) events.push({ kind: "note", text: `Provider reference number saved: ${ref}` });
    }
  }
  if ("followUpOn" in body) {
    const date = typeof body.followUpOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.followUpOn) ? body.followUpOn : null;
    if (date !== row.followUpOn) {
      updates.followUpOn = date;
      events.push({ kind: "followup", text: date ? `Follow-up reminder set for ${fmtDate(date)}.` : "Follow-up reminder cleared." });
    }
  }
  for (const key of ["description", "desiredOutcome", "chargeLabel", "contactName", "title"] as const) {
    if (key in body) {
      const value = str(body[key], key === "description" ? 3000 : 400);
      if (key === "description") updates.description = value ?? "";
      else if (key === "title") updates.title = value ?? row.title;
      else updates[key] = value;
    }
  }
  if ("amount" in body) updates.amount = num(body.amount, 0, 100000);

  const [updated] = await db.update(cases).set(updates).where(eq(cases.id, row.id)).returning();
  if (events.length) await db.insert(caseEvents).values(events.map((e) => ({ ...e, caseId: row.id })));
  return Response.json({ item: updated });
}

export async function POST(req: Request, ctx: Ctx) {
  const row = await load(req, ctx);
  if (!row) return jsonError("Case not found", 404);
  const body = await readJson(req);
  const text = str(body.text, 1500);
  if (!text) return jsonError("Write a short note first.");
  const kind = ["note", "contact", "reply"].includes(String(body.kind)) ? String(body.kind) : "note";
  const [event] = await db.insert(caseEvents).values({ caseId: row.id, kind, text }).returning();
  await db.update(cases).set({ updatedAt: new Date() }).where(eq(cases.id, row.id));
  return Response.json({ event });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const row = await load(req, ctx);
  if (!row) return jsonError("Case not found", 404);
  await db.delete(cases).where(eq(cases.id, row.id));
  return Response.json({ ok: true });
}
