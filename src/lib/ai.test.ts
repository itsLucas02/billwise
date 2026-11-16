import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRewriteMessages, cleanRewrite, type RewriteInput } from "./ai.ts";

const base: RewriteInput = {
  action: "firmer",
  lang: "en",
  draft: "Dear Unifi Customer Care,\nI am writing about my October 2026 bill.",
  facts: { provider: "Unifi", issue: "Promo price or rebate not applied", chargeLabel: "Unifi Home 300Mbps Monthly Fee", amount: 10, billMonth: "2026-10", promisedPrice: 129 },
  notes: [],
};

test("system prompt knows BillWise and forbids inventing facts", () => {
  const [system] = buildRewriteMessages(base);
  assert.equal(system.role, "system");
  assert.match(system.content, /BillWise/);
  assert.match(system.content, /Malaysia/);
  assert.match(system.content, /do not (add|invent)/i);
  assert.match(system.content, /7\.3/);
});

test("user message carries the case facts, the draft and the requested action", () => {
  const user = buildRewriteMessages(base)[1];
  assert.equal(user.role, "user");
  assert.match(user.content, /Unifi Home 300Mbps Monthly Fee/);
  assert.match(user.content, /RM10\.00/);
  assert.match(user.content, /RM129\.00/);
  assert.match(user.content, /I am writing about my October 2026 bill\./);
  assert.match(user.content, /firmer/i);
});

test("Bahasa Malaysia drafts are rewritten in Bahasa Malaysia", () => {
  const user = buildRewriteMessages({ ...base, lang: "ms" })[1];
  assert.match(user.content, /Bahasa Malaysia/);
});

test("'add my notes' passes the case timeline notes; other actions don't", () => {
  const notes = ["Called 100, agent said promo ended in September"];
  assert.match(buildRewriteMessages({ ...base, action: "notes", notes })[1].content, /promo ended in September/);
  assert.doesNotMatch(buildRewriteMessages({ ...base, action: "shorter", notes })[1].content, /promo ended in September/);
});

test("cleanRewrite strips code fences and wrapping quotes the model sometimes adds", () => {
  assert.equal(cleanRewrite("```\nHello Unifi,\nPlease check.\n```", base.draft), "Hello Unifi,\nPlease check.");
  assert.equal(cleanRewrite("\"Hello Unifi, please check.\"", base.draft), "Hello Unifi, please check.");
});

test("cleanRewrite rejects empty or runaway replies", () => {
  assert.equal(cleanRewrite("   ", base.draft), null);
  assert.equal(cleanRewrite("x".repeat(5000), base.draft), null);
});
