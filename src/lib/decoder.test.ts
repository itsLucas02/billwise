import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeBill } from "./decoder.ts";

// Redacted from a real Unifi customer's bills (Aug and Sep 2026): account one bill behind, reconnection fee each month.
const AUG = `Unifi bill — Bill Date: 07 Aug 2026
Due Date: 28 Aug 2026
Previous Balance 262.90
Payment - FPX B2C 13/07/2026 -126.15
Unifi Home 500Mbps (ST) 159.00
Promo Discount (ST) -40.00
Fixed Line Reconnection Fee (ST) 10.00
Service Tax 6% 7.74
Rounding Amount 0.01
Total Amount Payable 273.50`;

const SEP = `Unifi bill — Bill Date: 07 Sep 2026
Due Date: 28 Sep 2026
Previous Balance 273.50
Payment - FPX B2C 12/08/2026 -136.75
Payment - FPX B2C 03/09/2026 -136.75
Unifi Home 500Mbps (ST) 159.00
Promo Discount (ST) -40.00
Fixed Line Reconnection Fee (ST) 10.00
Service Tax 6% 7.74
Rounding Amount 0.01
Total Amount Payable 136.75`;

const titles = (text: string) => decodeBill({ text, provider: "unifi" }).findings.map((f) => f.title);

test("a reconnection fee is explained as a suspension, not a plain late fee", () => {
  const a = decodeBill({ text: SEP, provider: "unifi" });
  const f = a.findings.find((x) => /reconnection fee/i.test(x.title));
  assert.ok(f, `no reconnection finding in: ${titles(SEP).join(" | ")}`);
  assert.match(f.detail, /suspend|cut off|barred/i);
  assert.ok(!titles(SEP).some((t) => /late payment charge/i.test(t)));
  const item = a.items.find((i) => /reconnection/i.test(i.label));
  assert.match(item!.explanation, /suspend|cut off|barred/i);
});

test("an unpaid balance carried from earlier bills is flagged with its amount", () => {
  assert.ok(titles(AUG).some((t) => /unpaid/i.test(t) && /RM136\.75/.test(t)), titles(AUG).join(" | "));
});

test("no carried-balance warning once earlier bills are fully paid", () => {
  assert.ok(!titles(SEP).some((t) => /unpaid/i.test(t)), titles(SEP).join(" | "));
});

test("an ordinary late payment charge keeps its late-fee wording", () => {
  const t = titles("Unifi Home 300Mbps Monthly Fee 139.00\nLate Payment Charge 10.00\nService Tax 6% 8.34\nTotal 157.34");
  assert.ok(t.some((x) => /late payment charge/i.test(x)), t.join(" | "));
});

// Full statements (uploaded PDFs) — shapes seen in real Unifi e-bills, values redacted/simplified.
test("dash placeholder columns are not read as a minus sign", () => {
  const a = decodeBill({ text: "Previous Balance - - 273.40\nPayment - FPX B2C 13/04/2026 -136.65\nUnifi Home 500Mbps (ST) 159.00", provider: "unifi" });
  assert.equal(a.meta.previousBalance, 273.4);
});

test("category summary rows don't double-count detailed charges", () => {
  const a = decodeBill({ text: "Monthly Charges 159.00 -40.00 119.00\nOther Charges 10.00 0.00 10.00\nUnifi Home 500Mbps (ST) 07/09/2026 06/10/2026 159.00 0.00 159.00\nPromo Discount (ST) 07/09/2026 06/10/2026 -40.00 0.00 -40.00\nFixed Line Reconnection Fee 12/08/2026 12/08/2026 10.00 0.00 10.00", provider: "unifi" });
  assert.equal(a.totals.total, 129);
});

test("summary rows are used when the detailed rows carry no amounts", () => {
  const a = decodeBill({ text: "Monthly Charges 159.00 -40.00 119.00\nUnifi Home 500Mbps (ST) 07/11/2026 06/12/2026 user@unifi\nService Tax - ST 119.00 7.14", provider: "unifi" });
  assert.equal(a.totals.total, 126.14);
});

test("a stated pre-tax 'this month's charges' is not a mismatch; odd apostrophes still match", () => {
  const t = decodeBill({ text: "This month · s charges RM 129.00\nUnifi Home 500Mbps (ST) 119.00\nReconnection Fee (ST) 10.00\nService Tax - ST 129.00 7.74", provider: "unifi" }).findings.map((f) => f.title);
  assert.ok(!t.some((x) => /doesn't match/.test(x)), t.join(" | "));
});
