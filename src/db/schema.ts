import { doublePrecision, index, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import type { Analysis } from "@/lib/decoder";

export const billAnalyses = pgTable(
  "bill_analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    provider: text("provider"),
    source: text("source").notNull().default("paste"),
    rawText: text("raw_text").notNull(),
    inputs: jsonb("inputs").$type<Record<string, unknown>>(),
    result: jsonb("result").$type<Analysis>().notNull(),
    total: doublePrecision("total").notNull().default(0),
    score: integer("score").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("bill_analyses_user_idx").on(t.userId)],
);

export const cases = pgTable(
  "cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    provider: text("provider").notNull(),
    issueType: text("issue_type").notNull(),
    title: text("title").notNull(),
    chargeLabel: text("charge_label"),
    amount: doublePrecision("amount"),
    billMonth: text("bill_month"),
    accountRef: text("account_ref"),
    description: text("description").notNull().default(""),
    desiredOutcome: text("desired_outcome"),
    promisedPrice: doublePrecision("promised_price"),
    contactName: text("contact_name"),
    status: text("status").notNull().default("open"),
    providerRef: text("provider_ref"),
    followUpOn: text("follow_up_on"),
    contactedAt: timestamp("contacted_at", { withTimezone: true }),
    resolvedAmount: doublePrecision("resolved_amount"),
    analysisId: uuid("analysis_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("cases_user_idx").on(t.userId)],
);

export const caseEvents = pgTable(
  "case_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("case_events_case_idx").on(t.caseId)],
);

export const coverageChecks = pgTable(
  "coverage_checks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    label: text("label").notNull(),
    postcode: text("postcode").notNull(),
    state: text("state"),
    propertyType: text("property_type").notNull().default("landed"),
    statuses: jsonb("statuses").$type<Record<string, string>>().notNull().default({}),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("coverage_checks_user_idx").on(t.userId)],
);

export const savedPlans = pgTable(
  "saved_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    planId: text("plan_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("saved_plans_user_plan_unique").on(t.userId, t.planId)],
);

/** One row per AI call outside a case (e.g. the Plan Finder assistant), for the per-browser daily cap. */
export const aiUsage = pgTable(
  "ai_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    feature: text("feature").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ai_usage_user_idx").on(t.userId, t.createdAt)],
);
