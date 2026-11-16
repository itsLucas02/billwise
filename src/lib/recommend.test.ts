import { test } from "node:test";
import assert from "node:assert/strict";
import { describePrefs, parsePrefs, proposeChange, recommend } from "./recommend.ts";

test("parsePrefs keeps valid fibre answers", () => {
  const p = parsePrefs({ kind: "fibre", budget: 150, people: 3, activities: ["wfh", "streaming"], homeSize: "large", flexible: true, postpaidWith: "maxis", available: ["allo"] });
  assert.deepEqual(p, { kind: "fibre", budget: 150, people: 3, activities: ["wfh", "streaming"], homeSize: "large", flexible: true, postpaidWith: "maxis", available: ["allo"] });
});

test("parsePrefs clamps numbers and drops unknown options", () => {
  const p = parsePrefs({ kind: "mobile", budget: "9999", lines: 40, usage: "insane", roaming: "x", goodSignal: ["maxis", "starlink"] });
  assert.deepEqual(p, { kind: "mobile", budget: 600, usage: "moderate", lines: 6, hotspot: false, roaming: "sometimes", goodSignal: ["maxis"] });
  const f = parsePrefs({ kind: "fibre", budget: 5, people: 0, activities: ["mining"], postpaidWith: "nope" });
  assert.equal(f?.budget, 40);
  assert.equal(f?.kind === "fibre" && f.people, 1);
  assert.deepEqual(f?.kind === "fibre" && f.activities, []);
});

test("parsePrefs rejects missing or invalid answers", () => {
  assert.equal(parsePrefs({}), null);
  assert.equal(parsePrefs({ kind: "fibre" }), null);
  assert.equal(parsePrefs({ kind: "satellite", budget: 100 }), null);
  assert.equal(parsePrefs({ kind: "mobile", budget: "abc" }), null);
  assert.equal(parsePrefs({ kind: "mobile", budget: "" }), null);
});

test("describePrefs states the answers and what the customer confirmed themselves", () => {
  const fibre = describePrefs(parsePrefs({ kind: "fibre", budget: 150, people: 3, activities: ["wfh"], available: ["allo"] })!);
  assert.ok(fibre.includes("Budget: RM150/month"));
  assert.ok(fibre.includes("People at home: 3"));
  assert.ok(fibre.some((l) => /Confirmed available.*Allo/.test(l)));
  const mobile = describePrefs(parsePrefs({ kind: "mobile", budget: 80, lines: 2 })!);
  assert.ok(mobile.includes("Lines: 2"));
  assert.ok(mobile.includes("Signal: not given"));
});

test("recommend ranks parsed answers deterministically", () => {
  const prefs = parsePrefs({ kind: "fibre", budget: 150, people: 3, activities: ["wfh"] })!;
  assert.deepEqual(recommend(prefs).results.map((r) => r.planId), recommend(prefs).results.map((r) => r.planId));
});

test("plans within the budget rank above plans over it (owner report: RM100 budget, RM139 top pick)", () => {
  const prefs = parsePrefs({ kind: "fibre", budget: 100, people: 3, activities: ["wfh", "streaming"] })!;
  const res = recommend(prefs).results;
  const firstOver = res.findIndex((r) => r.monthly > 100);
  const lastWithin = res.map((r) => r.monthly <= 100).lastIndexOf(true);
  assert.ok(res[0].monthly <= 100, `top pick costs RM${res[0].monthly}`);
  assert.ok(firstOver === -1 || lastWithin < firstOver, "an over-budget plan ranks above an affordable one");
});

test("proposeChange applies an assistant proposal and lists what changed", () => {
  const current = parsePrefs({ kind: "fibre", budget: 100, people: 3, activities: ["wfh"] })!;
  const out = proposeChange(current, { budget: 130, activities: ["wfh", "gaming"] });
  assert.ok(out);
  assert.equal(out.prefs.budget, 130);
  assert.deepEqual(out.prefs.kind === "fibre" && out.prefs.activities, ["wfh", "gaming"]);
  assert.ok(out.changes.some((c) => /Budget: RM100\/month → RM130\/month/.test(c)), out.changes.join(" | "));
  assert.equal(out.changes.length, 2);
});

test("proposeChange ignores no-ops, junk and kind switches", () => {
  const current = parsePrefs({ kind: "fibre", budget: 100, people: 3, activities: ["wfh"] })!;
  assert.equal(proposeChange(current, { budget: 100 }), null);
  assert.equal(proposeChange(current, { colour: "blue" }), null);
  assert.equal(proposeChange(current, "budget=200"), null);
  assert.equal(proposeChange(current, { kind: "mobile", budget: 100 }), null);
  assert.equal(proposeChange(current, { budget: 99999 })?.prefs.budget, 800);
});
