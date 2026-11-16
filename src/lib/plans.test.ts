import { test } from "node:test";
import assert from "node:assert/strict";
import { getPlan, planFacts } from "./plans.ts";

const facts = (id: string) => Object.fromEntries(planFacts(getPlan(id)!).map((f) => [f.label, f.value]));

test("mobile cards show the hotspot cap and data caveats that set 'unlimited' plans apart (owner report)", () => {
  const ai30 = facts("yes-ai30");
  assert.equal(ai30.Hotspot, "12GB hotspot");
  assert.match(ai30.Data, /4G up to 7Mbps/);
  assert.equal(ai30.Lines, "1 line");
  assert.notEqual(facts("yes-inf58").Hotspot, facts("yes-inf88").Hotspot);
});

test("family and share-line plans say how lines work", () => {
  assert.equal(facts("uni-fam129").Lines, "2 lines included");
  assert.match(facts("maxis-pp139").Lines, /up to 2 extra lines at RM48 each/);
});

test("fibre cards show speeds, router and contract", () => {
  const f = facts("allo-300");
  assert.match(f.Speed, /300Mbps/);
  assert.ok(f.Contract);
});
