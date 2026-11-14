import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { caseEvents, cases } from "@/db/schema";
import { ISSUES, isIssueType } from "@/lib/cases";
import { rm } from "@/lib/format";
import { PROVIDERS, isProviderId } from "@/lib/providers";
import { UUID_RE, ensureSchema, getUserId, jsonError, num, readJson, str } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureSchema();
  const userId = await getUserId(req);
  const items = await db.select().from(cases).where(eq(cases.userId, userId)).orderBy(desc(cases.updatedAt));
  const open = items.filter((c) => c.status !== "resolved" && c.status !== "closed").length;
  const resolved = items.filter((c) => c.status === "resolved").length;
  const recovered = items.reduce((s, c) => s + (c.status === "resolved" ? c.resolvedAmount ?? 0 : 0), 0);
  return Response.json({ items, stats: { open, resolved, recovered: Math.round(recovered * 100) / 100 } });
}

export async function POST(req: Request) {
  await ensureSchema();
  const userId = await getUserId(req);
  const body = await readJson(req);
  if (!isProviderId(body.provider)) return jsonError("Please choose your provider.");
  const provider = body.provider;
  const issueType = isIssueType(body.issueType) ? body.issueType : "other";
  const amount = num(body.amount, 0, 100000);
  const billMonth = typeof body.billMonth === "string" && /^\d{4}-\d{2}$/.test(body.billMonth) ? body.billMonth : null;
  const accountRef = str(body.accountRef, 12)?.replace(/[^A-Za-z0-9]/g, "").slice(-4) || null;
  const analysisId = typeof body.analysisId === "string" && UUID_RE.test(body.analysisId) ? body.analysisId : null;
  const title = str(body.title, 140) ?? `${ISSUES[issueType].label} — ${PROVIDERS[provider].name}`;

  const [row] = await db
    .insert(cases)
    .values({
      userId,
      provider,
      issueType,
      title,
      chargeLabel: str(body.chargeLabel, 140),
      amount,
      billMonth,
      accountRef,
      description: str(body.description, 3000) ?? "",
      desiredOutcome: str(body.desiredOutcome, 400),
      promisedPrice: num(body.promisedPrice, 0, 10000),
      contactName: str(body.contactName, 80),
      analysisId,
    })
    .returning({ id: cases.id });

  await db.insert(caseEvents).values({
    caseId: row.id,
    kind: "created",
    text: `Case created${amount ? ` for ${rm(amount)}` : ""}${analysisId ? " from a Bill Decoder analysis" : ""}.`,
  });
  return Response.json({ id: row.id });
}
