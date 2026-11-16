import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Idempotent DDL mirroring src/db/schema.ts, so a fresh database works even
 * before `drizzle-kit push` has been run.
 */
const DDL = [
  `CREATE TABLE IF NOT EXISTS "bill_analyses" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL,
    "title" text NOT NULL,
    "provider" text,
    "source" text DEFAULT 'paste' NOT NULL,
    "raw_text" text NOT NULL,
    "inputs" jsonb,
    "result" jsonb NOT NULL,
    "total" double precision DEFAULT 0 NOT NULL,
    "score" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "bill_analyses_user_idx" ON "bill_analyses" USING btree ("user_id")`,
  `CREATE TABLE IF NOT EXISTS "cases" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL,
    "provider" text NOT NULL,
    "issue_type" text NOT NULL,
    "title" text NOT NULL,
    "charge_label" text,
    "amount" double precision,
    "bill_month" text,
    "account_ref" text,
    "description" text DEFAULT '' NOT NULL,
    "desired_outcome" text,
    "promised_price" double precision,
    "contact_name" text,
    "status" text DEFAULT 'open' NOT NULL,
    "provider_ref" text,
    "follow_up_on" text,
    "contacted_at" timestamp with time zone,
    "resolved_amount" double precision,
    "analysis_id" uuid,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "cases_user_idx" ON "cases" USING btree ("user_id")`,
  `CREATE TABLE IF NOT EXISTS "case_events" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "case_id" uuid NOT NULL,
    "kind" text NOT NULL,
    "text" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "case_events_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action
  )`,
  `CREATE INDEX IF NOT EXISTS "case_events_case_idx" ON "case_events" USING btree ("case_id")`,
  `CREATE TABLE IF NOT EXISTS "coverage_checks" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL,
    "label" text NOT NULL,
    "postcode" text NOT NULL,
    "state" text,
    "property_type" text DEFAULT 'landed' NOT NULL,
    "statuses" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "notes" text DEFAULT '' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "coverage_checks_user_idx" ON "coverage_checks" USING btree ("user_id")`,
  `CREATE TABLE IF NOT EXISTS "saved_plans" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL,
    "plan_id" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "saved_plans_user_plan_unique" UNIQUE("user_id","plan_id")
  )`,
  `CREATE TABLE IF NOT EXISTS "ai_usage" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL,
    "feature" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "ai_usage_user_idx" ON "ai_usage" USING btree ("user_id","created_at")`,
];

const g = globalThis as typeof globalThis & { __billwiseSchema?: Promise<void> };

export function ensureSchema(): Promise<void> {
  if (!g.__billwiseSchema) {
    g.__billwiseSchema = (async () => {
      for (const statement of DDL) await db.execute(sql.raw(statement));
    })().catch((err) => {
      g.__billwiseSchema = undefined;
      throw err;
    });
  }
  return g.__billwiseSchema;
}

const ID_RE = /^[A-Za-z0-9_-]{8,80}$/;

/** Anonymous identity: header from the browser (localStorage), falling back to a cookie. */
export async function getUserId(req: Request): Promise<string> {
  const header = req.headers.get("x-bw-user");
  if (header && ID_RE.test(header)) return header;
  const store = await cookies();
  const existing = store.get("bw_uid")?.value;
  if (existing && ID_RE.test(existing)) return existing;
  const id = crypto.randomUUID();
  store.set("bw_uid", id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 400 });
  return id;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

export function str(v: unknown, max = 500): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

export function num(v: unknown, min = -1_000_000, max = 1_000_000): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return Math.round(n * 100) / 100;
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
