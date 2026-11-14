import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { coverageChecks } from "@/db/schema";
import { emptyStatuses, stateFromPostcode } from "@/lib/coverage";
import { ensureSchema, getUserId, jsonError, readJson, str } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureSchema();
  const userId = await getUserId(req);
  const items = await db
    .select()
    .from(coverageChecks)
    .where(eq(coverageChecks.userId, userId))
    .orderBy(desc(coverageChecks.updatedAt));
  return Response.json({ items });
}

export async function POST(req: Request) {
  await ensureSchema();
  const userId = await getUserId(req);
  const body = await readJson(req);
  const postcode = typeof body.postcode === "string" ? body.postcode.trim() : "";
  if (!/^\d{5}$/.test(postcode)) return jsonError("Please enter a 5-digit Malaysian postcode.");
  const propertyType = ["highrise", "landed", "shop"].includes(String(body.propertyType)) ? String(body.propertyType) : "landed";
  const label = str(body.label, 60) ?? "My address";
  const [row] = await db
    .insert(coverageChecks)
    .values({ userId, label, postcode, state: stateFromPostcode(postcode), propertyType, statuses: emptyStatuses(), notes: "" })
    .returning();
  return Response.json({ item: row });
}
