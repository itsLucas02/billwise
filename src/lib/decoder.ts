import { PLANS, costForLines, type Plan } from "./plans.ts";
import { PROVIDERS, detectProvider, isProviderId, primaryContact, type ProviderId } from "./providers.ts";
import { SST_RATE, rm, round2, speedLabel } from "./format.ts";

export type Category =
  | "plan" | "addon" | "device" | "usage" | "roaming" | "idd" | "vas" | "one_time"
  | "late_fee" | "penalty" | "prorated" | "rebate" | "tax" | "rounding" | "other";

export const CATEGORY_INFO: Record<Category, { label: string; color: string }> = {
  plan: { label: "Monthly plan", color: "#0b8f63" },
  addon: { label: "Add-ons & extra lines", color: "#2f6fe4" },
  device: { label: "Device instalment", color: "#6b5bd6" },
  usage: { label: "Extra usage", color: "#f08a24" },
  roaming: { label: "Roaming", color: "#e5452b" },
  idd: { label: "International calls", color: "#c2410c" },
  vas: { label: "Third-party content", color: "#c2255c" },
  one_time: { label: "One-time charges", color: "#8d6e4c" },
  late_fee: { label: "Late payment fee", color: "#b42318" },
  penalty: { label: "Penalty", color: "#7a1f1f" },
  prorated: { label: "Partial-month charge", color: "#0b7285" },
  rebate: { label: "Rebates & discounts", color: "#2b8a3e" },
  tax: { label: "Service tax (SST)", color: "#5a6577" },
  rounding: { label: "Rounding", color: "#9aa3b2" },
  other: { label: "Unclear charge", color: "#a61e4d" },
};

export type Severity = "high" | "medium" | "low" | "good";

export interface LineItem {
  id: string;
  label: string;
  amount: number;
  category: Category;
  explanation: string;
  note?: string;
  flagged?: boolean;
}

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  amount?: number;
  itemIds?: string[];
  action?: "dispute" | "plans" | "none";
  issueType?: string;
}

export interface Saving {
  id: string;
  kind: "switch" | "ask" | "remove" | "avoid";
  title: string;
  detail: string;
  monthly: number;
  yearly: number;
  oneOff?: boolean;
  planId?: string;
}

export interface BillMeta {
  provider: ProviderId | null;
  providerName: string;
  account?: string;
  billDate?: string;
  period?: string;
  dueDate?: string;
  service: "fibre" | "mobile" | "unknown";
  speedMbps?: number;
  dataGB?: number | "unlimited";
  lines?: number;
  matchedPlanId?: string;
  statedTotal?: number;
  previousBalance?: number;
  promisedPrice?: number;
}

export interface Analysis {
  version: 1;
  meta: BillMeta;
  items: LineItem[];
  breakdown: { category: Category; total: number }[];
  totals: { charges: number; credits: number; tax: number; total: number; regular: number; variable: number; nextBill: number };
  findings: Finding[];
  savings: Saving[];
  potentialYearly: number;
  score: number;
  verdict: string;
  summary: string;
  nextSteps: string[];
  notCounted: { label: string; amount: number }[];
}

export interface DecodeInput {
  text: string;
  provider?: ProviderId | "" | null;
  promisedPrice?: number | null;
  usualAmount?: number | null;
}

/* ───────────────────────── parsing ───────────────────────── */

const AMOUNT_RE = /(\()?(-)?(?:RM|MYR)?\s?(-)?(\d{1,3}(?:,\d{3})+|\d+)\.(\d{2})(\))?(\s?CR\b)?/gi;

function findAmount(line: string): { value: number; index: number; length: number } | null {
  AMOUNT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  let found: { value: number; index: number; length: number } | null = null;
  while ((m = AMOUNT_RE.exec(line)) !== null) {
    if (m[0].length === 0) {
      AMOUNT_RE.lastIndex++;
      continue;
    }
    const end = m.index + m[0].length;
    const after = line.slice(end, end + 2);
    const start = m.index + m[0].length - m[0].trimStart().length; // a match can begin with a space: look before that
    const before = start > 0 ? line[start - 1] : "";
    // skip dates (01.10.2026), percentages, quantities (2.50GB) and times
    if (/^[.\/:]\d/.test(after) || /^\s?%/.test(after) || /^[A-Za-z]/.test(after) || /[.\/\d]/.test(before)) continue;
    const value = parseFloat(`${m[4].replace(/,/g, "")}.${m[5]}`);
    const negative = Boolean(m[2] || m[3] || (m[1] && m[6]) || m[7]);
    found = { value: negative ? -value : value, index: m.index, length: m[0].length };
  }
  return found;
}

function cleanLabel(s: string): string {
  return s
    .replace(/\b(RM|MYR)\s*$/i, "")
    .replace(/[\s:|·•\-–—_.=]+$/g, "")
    .replace(/^[\s:|·•\-–—_.*=]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

type AccountKind = "current" | "due" | "previous" | "payment" | "subtotal" | "total";
const ACCOUNT_RULES: [AccountKind, RegExp][] = [
  ["current", /total current charges|current charges|caj semasa|charges for this (month|bill)|jumlah caj/i],
  ["due", /amount due|total due|total payable|jumlah (perlu dibayar|tertunggak)|please pay/i],
  ["previous", /previous (balance|bill)|balance (brought|b\/f)|\bbaki\b|outstanding (balance|amount)|opening balance/i],
  ["payment", /payments? (received|thank)|thank you for your payment|bayaran diterima|^payment\b/i],
  ["subtotal", /sub\s*-?\s*total/i],
  ["total", /^total\b|\btotal\b/i],
];

function accountKind(label: string): AccountKind | null {
  for (const [kind, re] of ACCOUNT_RULES) if (re.test(label)) return kind;
  return null;
}

const RULES: [Category, RegExp][] = [
  ["tax", /\b(sst|service tax|cukai|tax)\b/i],
  ["rounding", /rounding|pembundaran/i],
  ["late_fee", /late\s*(payment)?\s*(charge|fee)|late payment|overdue (charge|fee)|caj lewat|reconnection/i],
  ["penalty", /early termination|termination (fee|charge)|penalt|contract breach|\betf\b/i],
  ["prorated", /pro-?rat|partial month|pro rata/i],
  ["rebate", /rebate|discount|diskaun|waiver|promo(tional)? (credit|rebate|discount)|credit adj|loyalty|goodwill|cashback/i],
  ["roaming", /roam|overseas data|international data|travel pass|\bir pass/i],
  ["idd", /\bidd\b|international call|overseas call|antarabangsa/i],
  ["vas", /content|\bvas\b|value.?added|third.?party|carrier billing|\bdcb\b|google play|app store|itunes|apple services|\bgames?\b|gamezone|ringback|caller ?tunes?|horoscope|\bquiz\b|premium sms|on-?demand sms|digital content/i],
  ["device", /device|instal+ment|handset|\bphone\b|iphone|samsung|galaxy|oppo|vivo|honor|xiaomi|huawei|tablet|ipad|zerolution|easyphone|gadget/i],
  ["one_time", /installation|activation|registration|processing|replacement|admin(istration)? (fee|charge)|paper bill|printed bill|bill statement|itemi[sz]ed|relocation|deposit|advance payment|one.?time|courier|delivery|service visit|technician/i],
  ["usage", /excess|usage|overage|chargeable|local call|calls? to|\bsms\b|\bmms\b|data pass|extra data|top.?up|pay.?per.?use|per minute|outgoing|non-?local/i],
  ["addon", /add-?on|addon|supplementary|share ?line|family line|extra line|gadgetsim|\btv\b|sooka|netflix|disney|hotstar|\bviu\b|iqiyi|\bhbo\b|spotify|youtube|prime video|astro|mesh|voice (plan|unlimited|line)|home phone|webshield|mobileshield|protect|insurance|priority pass|static ip/i],
  ["plan", /monthly|plan|package|pakej|subscription|commitment|postpaid|prepaid|fibre|fiber|broadband|internet|mbps|gbps|rate plan|uni5g|\b5g\b|\b4g\b/i],
];

function categorize(label: string): Category {
  for (const [cat, re] of RULES) if (re.test(label)) return cat;
  return "other";
}

function maskAccount(raw: string): string {
  const clean = raw.replace(/[^A-Za-z0-9]/g, "");
  return clean.length <= 4 ? clean : `••••${clean.slice(-4)}`;
}

function tidy(s: string): string {
  return s.split(/\s{2,}/)[0].trim().slice(0, 40);
}

function extractMeta(lines: string[]): Partial<BillMeta> {
  const meta: Partial<BillMeta> = {};
  for (const line of lines) {
    let m: RegExpMatchArray | null;
    if (!meta.account && (m = line.match(/(?:account|acct|akaun)\s*(?:no\.?|number|num|#)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\- ]{4,24})/i))) meta.account = maskAccount(m[1]);
    if (!meta.billDate && (m = line.match(/(?:bill|statement|invoice)\s*date\s*[:\-]?\s*(.{6,30})/i))) meta.billDate = tidy(m[1]);
    if (!meta.period && (m = line.match(/(?:billing\s*period|bill\s*period|bill(?:ing)?\s*cycle|^period)\s*[:\-]?\s*(.{6,40})/i))) meta.period = tidy(m[1]);
    if (!meta.dueDate && (m = line.match(/(?:due\s*date|payment\s*due|pay\s*by|tarikh\s*akhir)\s*[:\-]?\s*(.{6,30})/i))) meta.dueDate = tidy(m[1]);
  }
  return meta;
}

function parseSpeed(s: string): number | undefined {
  const g = s.match(/(\d(?:\.\d)?)\s*gbps/i);
  if (g) return Math.round(parseFloat(g[1]) * 1000);
  const m = s.match(/(\d{2,4})\s*mbps/i);
  return m ? parseInt(m[1], 10) : undefined;
}

function progress(label: string): { current: number; total: number } | null {
  const m = label.match(/(?:month\s*)?(\d{1,2})\s*(?:of|\/)\s*(\d{1,2})\b/i);
  if (!m) return null;
  const current = +m[1];
  const total = +m[2];
  return total >= current && total > 1 ? { current, total } : null;
}

function explain(it: LineItem, service: BillMeta["service"], providerName: string): string {
  const what = service === "fibre" ? "home internet" : service === "mobile" ? "mobile" : "";
  switch (it.category) {
    case "plan":
      return `Your regular monthly fee for the ${what} plan. It should be the same every month unless a promotion ended or you changed plans.`;
    case "addon":
      return /line/i.test(it.label)
        ? "An extra SIM/line on your account (for family or a second device), billed every month."
        : "An optional extra on top of your main plan — such as TV, streaming, mesh Wi-Fi or security. Check that you still use it.";
    case "device":
      return "A monthly payment for a phone or gadget you took with your plan. You keep paying it until the instalments are done, even if you change plans.";
    case "usage":
      return "Pay-per-use charges for things outside your plan's quota — extra data passes, calls or SMS.";
    case "roaming":
      return "Charges for using your line outside Malaysia. Without a roaming pass, data abroad is billed per use and adds up quickly.";
    case "idd":
      return "Calls from Malaysia to overseas numbers. These are usually not covered by “unlimited calls”.";
    case "vas":
      return "A content or third-party service billed through your phone account (games, ringtones, app purchases). These are often signed up by accident through ads or SMS.";
    case "one_time":
      return "A one-off charge (e.g. installation, replacement or paper bill fee). It should not repeat next month.";
    case "late_fee":
      if (/reconnect/i.test(it.label)) return "A fee to restore your line after it was suspended (barred) because an earlier bill was still unpaid after its due date. It is usually charged again each time this happens.";
      return `A fee for paying after the due date. ${providerName === "Your provider" ? "Providers" : providerName} may waive a first-time late fee if you ask.`;
    case "penalty":
      return "A fee for ending a contract early. Check your contract dates — you may not owe it if the contract had ended or the service was faulty.";
    case "prorated":
      return "A partial-month charge: you pay only for the days you had the service, usually after installation or a plan change. It should not repeat.";
    case "rebate":
      return "A discount taken off your bill. Promotional rebates usually last a fixed number of months — when they end, your bill goes up by this amount.";
    case "tax":
      return "Service tax (SST) collected for the government. Telecommunication services are taxed at 6%.";
    case "rounding":
      return "A tiny adjustment so the total rounds to the nearest 5 sen. Completely normal.";
    default:
      return "We couldn't confidently identify this charge. It's worth asking your provider what it is for.";
  }
}

/* ───────────────────────── analysis ───────────────────────── */

export function decodeBill(input: DecodeInput): Analysis {
  const text = (input.text || "").replace(/\r/g, "").slice(0, 20000);
  const lines = text.split("\n").map((l) => l.replace(/\t/g, "  ").trim()).filter(Boolean);
  const provider: ProviderId | null = isProviderId(input.provider) ? input.provider : detectProvider(text);
  const providerName = provider ? PROVIDERS[provider].name : "Your provider";
  const meta: BillMeta = { provider, providerName, service: "unknown", ...extractMeta(lines) };
  if (input.promisedPrice && input.promisedPrice > 0) meta.promisedPrice = input.promisedPrice;

  const items: LineItem[] = [];
  const notCounted: { label: string; amount: number }[] = [];
  let statedCurrent: number | undefined;
  let statedDue: number | undefined;
  let statedTotal: number | undefined;
  let paid = 0;

  for (const line of lines) {
    const amt = findAmount(line);
    if (!amt) continue;
    const label = cleanLabel(`${line.slice(0, amt.index)} ${line.slice(amt.index + amt.length)}`);
    if (!label || !/[a-z]/i.test(label)) continue;
    const acct = accountKind(label);
    if (acct) {
      if (acct === "current") statedCurrent = amt.value;
      else if (acct === "due") statedDue = amt.value;
      else if (acct === "previous") meta.previousBalance = amt.value;
      else if (acct === "payment") paid = round2(paid + Math.abs(amt.value));
      else if (acct === "total" && statedTotal === undefined) statedTotal = amt.value;
      notCounted.push({ label, amount: amt.value });
      continue;
    }
    if (/^(bill|statement|invoice)\s*date|due date|account/i.test(label)) continue;
    let category = categorize(label);
    let amount = amt.value;
    if (category === "rebate" && amount > 0) amount = -amount;
    if (amount < 0 && category !== "tax" && category !== "rounding") category = "rebate";
    items.push({ id: `i${items.length + 1}`, label: label.slice(0, 120), amount: round2(amount), category, explanation: "" });
  }

  const by = (c: Category) => items.filter((i) => i.category === c);
  const sum = (arr: LineItem[]) => round2(arr.reduce((s, i) => s + i.amount, 0));
  const totalOf = (c: Category) => sum(by(c));

  // service type, speed, plan matching
  const planText = items.filter((i) => i.category === "plan" || i.category === "prorated").map((i) => i.label).join(" ");
  const speed = parseSpeed(planText);
  if (speed || /fibre|fiber|broadband|home/i.test(planText)) meta.service = "fibre";
  else if (/postpaid|prepaid|\b5g\b|mobile|uni5g|u mobile|umobile|ultra postpaid/i.test(planText) || /share ?line|supplementary|roaming|\bidd\b/i.test(text)) meta.service = "mobile";
  if (speed) meta.speedMbps = speed;

  let matched: Plan | undefined;
  if (provider && meta.service === "fibre" && speed) {
    matched = PLANS.find((p) => p.kind === "fibre" && p.provider === provider && p.down === speed);
  } else if (provider && meta.service === "mobile") {
    matched = PLANS.filter((p) => p.kind === "mobile" && p.provider === provider).find((p) => {
      const num = p.name.match(/(\d+)\s*$/)?.[1];
      return Boolean(num && new RegExp(`\\b${num}\\b`).test(planText));
    });
  }
  if (matched) meta.matchedPlanId = matched.id;
  if (meta.service === "mobile") {
    if (matched?.dataGB !== undefined) meta.dataGB = matched.dataGB;
    else {
      const g = planText.match(/(\d{2,4})\s*GB/i);
      if (g) meta.dataGB = parseInt(g[1], 10);
      else if (/unlimited/i.test(planText)) meta.dataGB = "unlimited";
    }
  }

  const lineItems = by("addon").filter((i) => /share ?line|supplementary|family line|extra line/i.test(i.label));
  const extraLines = lineItems.reduce((n, i) => n + (Number(i.label.match(/x\s?(\d)\b/i)?.[1]) || 1), 0);
  if (meta.service === "mobile") meta.lines = 1 + extraLines;

  for (const it of items) it.explanation = explain(it, meta.service, providerName);

  const findings: Finding[] = [];
  const add = (f: Omit<Finding, "id">) => findings.push({ id: `f${findings.length + 1}`, ...f });

  // 1. duplicates
  const groups = new Map<string, LineItem[]>();
  for (const it of items) {
    if (it.amount <= 0 || it.category === "tax" || it.category === "rounding") continue;
    const key = `${it.label.toLowerCase().replace(/\s+/g, " ")}|${it.amount.toFixed(2)}`;
    groups.set(key, [...(groups.get(key) ?? []), it]);
  }
  let duplicatePlanExtra = 0;
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.forEach((g) => (g.flagged = true));
    const first = group[0];
    const extra = round2(first.amount * (group.length - 1));
    if (first.category === "plan") duplicatePlanExtra += extra;
    const soft = first.category === "addon" || first.category === "device";
    add({
      severity: soft ? "medium" : "high",
      title: `“${first.label}” appears ${group.length} times`,
      detail: soft
        ? `You're billed ${rm(first.amount)} ${group.length} times. That's fine if you really have ${group.length} of these — otherwise ask ${providerName} to remove the extra.`
        : `You were charged ${rm(first.amount)} ${group.length} times for what looks like the same thing. Unless you really have ${group.length} of these, ask ${providerName} to reverse ${group.length === 2 ? "the extra charge" : "the extra charges"}.`,
      amount: extra,
      itemIds: group.map((g) => g.id),
      action: "dispute",
      issueType: "double",
    });
  }

  // 2. service tax check
  const taxItems = by("tax");
  const tax = totalOf("tax");
  const coreCats: Category[] = ["plan", "addon", "usage", "vas", "one_time", "prorated", "rebate", "penalty", "other"];
  const extraCats: Category[] = ["roaming", "idd", "late_fee"];
  const coreBase = sum(items.filter((i) => coreCats.includes(i.category)));
  const allBase = round2(coreBase + sum(items.filter((i) => extraCats.includes(i.category))));
  if (taxItems.length && tax > 0) {
    const lo = round2(coreBase * SST_RATE);
    const hi = round2(allBase * SST_RATE);
    const tol = Math.max(0.1, hi * 0.03);
    const statedRate = taxItems.map((i) => i.label.match(/(\d+(?:\.\d+)?)\s*%/)?.[1]).find(Boolean);
    const near8 = Math.abs(tax - coreBase * 0.08) <= tol || Math.abs(tax - allBase * 0.08) <= tol;
    if (statedRate === "8" || (near8 && tax > hi + tol)) {
      const expected = Math.abs(tax - coreBase * 0.08) <= Math.abs(tax - allBase * 0.08) ? lo : hi;
      const over = round2(tax - expected);
      taxItems.forEach((i) => (i.flagged = true));
      add({
        severity: "medium",
        title: "Service tax looks like 8% — telco services are usually 6%",
        detail: `Your bill shows ${rm(tax)} in service tax. At the 6% rate for telecommunication services it would be about ${rm(expected)}. The 8% rate from March 2024 generally doesn't apply to telco services, but some non-telco items on a bill can be taxed differently. Ask ${providerName} which rate applies to each line, and to correct it and refund ${rm(over)} if it should be 6%.`,
        amount: over > 0 ? over : undefined,
        itemIds: taxItems.map((i) => i.id),
        action: "dispute",
        issueType: "unknown_charge",
      });
    } else if (tax >= lo - tol && tax <= hi + tol) {
      add({ severity: "good", title: "Service tax looks right", detail: `${rm(tax)} is in line with the 6% service tax on telecommunication services.` });
    } else if (tax > hi + tol) {
      add({
        severity: "medium",
        title: "Service tax is higher than expected",
        detail: `We expected about ${rm(hi)} (6% of your taxable charges), but the bill shows ${rm(tax)}. Ask ${providerName} to explain how it was calculated.`,
        amount: round2(tax - hi),
        itemIds: taxItems.map((i) => i.id),
        action: "dispute",
        issueType: "unknown_charge",
      });
    } else {
      add({ severity: "low", title: "Service tax is a little lower than we estimated", detail: "Some items (like device instalments or certain fees) may not be taxable, so this is usually nothing to worry about." });
    }
  } else if (!taxItems.length && coreBase > 30) {
    add({ severity: "low", title: "No service tax line found", detail: "Most postpaid and broadband bills add 6% service tax. It may be shown elsewhere on your bill, or the prices may already include it." });
  }

  // 3. totals add up?
  const computed = round2(items.reduce((s, i) => s + i.amount, 0));
  const compareTo = statedCurrent ?? (meta.previousBalance === undefined ? statedDue ?? statedTotal : undefined);
  if (compareTo !== undefined) {
    meta.statedTotal = compareTo;
    const diff = round2(compareTo - computed);
    if (Math.abs(diff) > 0.5) {
      add({
        severity: "medium",
        title: "The bill's total doesn't match its charges",
        detail: `The charges we read add up to ${rm(computed)}, but the bill says ${rm(compareTo)} — a ${rm(Math.abs(diff))} difference. Some lines may not have been pasted in, or there may be an error worth asking about.`,
        amount: Math.abs(diff),
        action: "dispute",
        issueType: "unknown_charge",
      });
    }
  }

  // 4. promised price
  const planNet = round2(totalOf("plan") - duplicatePlanExtra + totalOf("rebate"));
  let promisedFlagged = false;
  if (input.promisedPrice && input.promisedPrice > 0 && totalOf("plan") > 0) {
    const p = input.promisedPrice;
    if (planNet > p + 0.99 && round2(planNet * (1 + SST_RATE)) > p + 0.99) {
      const over = round2(planNet - p);
      promisedFlagged = true;
      add({
        severity: "high",
        title: `You're paying ${rm(over)} more than the price you signed up for`,
        detail: `Your plan charges come to ${rm(planNet)} a month before tax, but you said you were promised ${rm(p)}. Over a year that's ${rm(over * 12)}. A promotional price may simply have ended — check your contract or offer letter. If it shows ${rm(p)} for this period, ask ${providerName} to apply it and credit the difference; if not, ask whether a current offer can bring it back down.`,
        amount: over,
        itemIds: by("plan").map((i) => i.id),
        action: "dispute",
        issueType: "promo",
      });
    } else {
      add({ severity: "good", title: "Your plan price matches what you were promised", detail: `Plan charges of ${rm(planNet)} (before tax) are in line with the ${rm(p)} you signed up for.` });
    }
  }

  // 5. compare with today's price for the same plan
  if (matched && !promisedFlagged && planNet > matched.price + 0.99) {
    const hasRebate = by("rebate").length > 0;
    add({
      severity: "medium",
      title: hasRebate ? `You pay more than today's price for ${matched.name}` : `Looks like you're paying full price for ${matched.name}`,
      detail: `New customers currently pay about ${rm(matched.price)}/month${matched.listPrice ? ` (normal price ${rm(matched.listPrice)})` : ""}, while you pay ${rm(planNet)}. ${hasRebate ? "" : "If you had a promotional rebate, it may have ended. "}Ask ${providerName} whether you can move to the current price or get a loyalty offer.`,
      amount: round2(planNet - matched.price),
      action: "dispute",
      issueType: "promo",
    });
  }

  // 6. rebates running out
  let rebateEnding = false;
  const endingRebateIds = new Set<string>();
  for (const r of by("rebate")) {
    const pr = progress(r.label);
    const value = -r.amount;
    if (pr) {
      const left = pr.total - pr.current;
      r.note = left === 0 ? "This is the last month of this rebate" : `${left} more month${left > 1 ? "s" : ""} of this rebate`;
      if (left === 0) endingRebateIds.add(r.id);
      rebateEnding = true;
      add({
        severity: left <= 1 ? "medium" : "low",
        title: left === 0 ? `Your ${rm(value)} rebate ends after this bill` : `Your ${rm(value)} rebate ends in ${left} month${left > 1 ? "s" : ""}`,
        detail: `When it ends, your bill goes up by about ${rm(round2(value * (1 + SST_RATE)))} a month (including tax). Set a reminder — it's a good moment to ask for a new promotion or compare plans.`,
        itemIds: [r.id],
        action: "plans",
      });
    } else if (/final|last month|ends?\b|expir/i.test(r.label)) {
      endingRebateIds.add(r.id);
      rebateEnding = true;
      add({ severity: "medium", title: `Your ${rm(value)} rebate is ending`, detail: "Expect your bill to rise once it stops. Ask about current promotions before it ends.", itemIds: [r.id], action: "plans" });
    }
  }

  // 7. device instalments
  for (const d of by("device")) {
    const pr = progress(d.label);
    if (!pr) continue;
    const left = pr.total - pr.current;
    d.note = `Instalment ${pr.current} of ${pr.total} — ${left} more to go`;
    add({
      severity: "low",
      title: `Device instalment: ${left} month${left === 1 ? "" : "s"} left`,
      detail: `About ${rm(d.amount * left)} still to pay. Ending your plan before the last instalment usually means paying the balance or a penalty — factor this in before switching.`,
      itemIds: [d.id],
      action: "none",
    });
  }

  // 8. third-party content
  const vas = totalOf("vas");
  if (vas > 0) {
    by("vas").forEach((i) => (i.flagged = true));
    add({
      severity: "high",
      title: `${rm(vas)} in third-party content charges`,
      detail: `These are subscriptions billed through your line, often triggered by tapping an ad or replying to an SMS. If you didn't knowingly sign up, ask ${providerName} to cancel them, refund the charges and block content billing on your line.`,
      amount: vas,
      itemIds: by("vas").map((i) => i.id),
      action: "dispute",
      issueType: "content",
    });
  }

  // 9. roaming & IDD
  const roam = totalOf("roaming");
  if (roam > 0) {
    add({
      severity: roam >= 50 ? "high" : "medium",
      title: `${rm(roam)} in roaming charges`,
      detail: `Using data overseas without a roaming pass is billed per use and adds up fast. Ask ${providerName} whether a roaming-pass rate can be applied as a goodwill adjustment, and buy a pass before your next trip.`,
      amount: roam,
      itemIds: by("roaming").map((i) => i.id),
      action: "dispute",
      issueType: "roaming",
    });
  }
  const idd = totalOf("idd");
  if (idd >= 5) {
    add({
      severity: idd >= 30 ? "medium" : "low",
      title: `${rm(idd)} on international calls`,
      detail: "“Unlimited calls” usually covers local numbers only. For regular overseas calls, an IDD add-on or internet calling (WhatsApp, Messenger) over Wi-Fi is usually far cheaper.",
      amount: idd,
      itemIds: by("idd").map((i) => i.id),
      action: "none",
    });
  }

  // 10. extra usage
  const usage = totalOf("usage");
  if (usage >= 10) {
    add({
      severity: "medium",
      title: `${rm(usage)} spent on extra usage`,
      detail: "You paid for data, calls or SMS beyond your plan. If this happens most months, a plan with a bigger quota is often cheaper than paying for extras.",
      amount: usage,
      itemIds: by("usage").map((i) => i.id),
      action: "plans",
    });
  }

  // 11. late fees & penalties
  const late = totalOf("late_fee");
  const reconnectItems = by("late_fee").filter((i) => /reconnect/i.test(i.label));
  const reconnect = sum(reconnectItems);
  const plainLate = round2(late - reconnect);
  if (reconnect > 0) {
    add({
      severity: "high",
      title: `${rm(reconnect)} reconnection fee — your line was cut off for an overdue balance`,
      detail: `${providerName} suspended (barred) the line because an earlier bill was still unpaid after its due date, then charged this fee to restore it. If your previous balance keeps being about two bills, you are one bill behind and this can repeat every month. Paying the full total amount payable before the due date stops it. You can also ask ${providerName} to waive past reconnection fees as a goodwill gesture.`,
      amount: reconnect,
      itemIds: reconnectItems.map((i) => i.id),
      action: "dispute",
      issueType: "late_fee",
    });
  }
  if (plainLate > 0) {
    add({
      severity: "medium",
      title: `${rm(plainLate)} late payment charge`,
      detail: `Added because a bill was paid after the due date. If it's a first time, ask ${providerName} for a one-time waiver — many agree. Auto-debit or a reminder before the due date prevents it.`,
      amount: plainLate,
      itemIds: by("late_fee").filter((i) => !/reconnect/i.test(i.label)).map((i) => i.id),
      action: "dispute",
      issueType: "late_fee",
    });
  }
  // 11b. unpaid balance carried in from earlier bills (the account is running behind)
  const carried = meta.previousBalance !== undefined ? round2(meta.previousBalance - paid) : 0;
  if (carried > 1) {
    add({
      severity: "high",
      title: `${rm(carried)} unpaid from earlier bills is carried into this one`,
      detail: `Your previous balance was ${rm(meta.previousBalance!)} and the bill shows ${paid > 0 ? `${rm(paid)} paid since` : "no payment since"}, so ${rm(carried)} is still owed on top of this month's charges. Paying only this month's charges leaves the older amount overdue, which can lead to suspension and reconnection fees. Pay the full total amount payable before the due date to catch up.`,
      amount: carried,
    });
  }
  const pen = totalOf("penalty");
  if (pen > 0) {
    add({
      severity: "high",
      title: `${rm(pen)} early termination penalty`,
      detail: "Check your contract start date. If the contract period had already ended, the service was faulty, or you moved somewhere the provider can't serve, ask for the penalty to be reviewed.",
      amount: pen,
      itemIds: by("penalty").map((i) => i.id),
      action: "dispute",
      issueType: "penalty",
    });
  }

  // 12. one-time charges
  const paper = items.filter((i) => i.amount > 0 && /paper|printed|itemi[sz]ed|bill statement/i.test(i.label));
  const paperTotal = sum(paper);
  if (paperTotal > 0) {
    add({ severity: "low", title: `${rm(paperTotal)} paper / itemised bill fee`, detail: "Switching to an e-bill (email or app) usually removes this fee.", amount: paperTotal, itemIds: paper.map((i) => i.id), action: "none" });
  }
  const otherOneTime = by("one_time").filter((i) => !paper.includes(i));
  const oneTimeTotal = sum(otherOneTime);
  if (oneTimeTotal > 0) {
    add({
      severity: "low",
      title: `${rm(oneTimeTotal)} in one-time charges`,
      detail: `${otherOneTime.map((i) => `“${i.label}”`).join(", ")} should not repeat next month. If you didn't request ${otherOneTime.length > 1 ? "these" : "this"}, ask ${providerName} to explain.`,
      amount: oneTimeTotal,
      itemIds: otherOneTime.map((i) => i.id),
      action: "dispute",
      issueType: "unknown_charge",
    });
  }
  const pro = totalOf("prorated");
  if (pro !== 0) {
    add({ severity: "low", title: "Includes a partial-month charge", detail: `${rm(pro)} covers only part of a month — usually after a new installation, plan change or upgrade. It's normal and should not repeat next month.`, itemIds: by("prorated").map((i) => i.id), action: "none" });
  }

  // 13. unidentified
  const unknown = by("other").filter((i) => i.amount > 0);
  if (unknown.length) {
    unknown.forEach((i) => (i.flagged = true));
    add({
      severity: "medium",
      title: `${unknown.length} charge${unknown.length > 1 ? "s" : ""} we couldn't identify`,
      detail: `${unknown.map((i) => `“${i.label}”`).join(", ")} — ask ${providerName} what ${unknown.length > 1 ? "these are" : "this is"} for.`,
      amount: sum(unknown),
      itemIds: unknown.map((i) => i.id),
      action: "dispute",
      issueType: "unknown_charge",
    });
  }

  // 14. add-ons review
  const addon = totalOf("addon");
  if (addon >= 20) {
    add({ severity: "low", title: `${rm(addon)} a month on add-ons & extra lines`, detail: `That's ${rm(addon * 12)} a year. Keep the ones you use — cancelling unused extras is the easiest saving there is.`, amount: addon, itemIds: by("addon").map((i) => i.id), action: "none" });
  }

  // 15. compared with usual
  if (input.usualAmount && input.usualAmount > 0 && computed > input.usualAmount * 1.15 && computed - input.usualAmount >= 5) {
    const drivers = (["roaming", "idd", "vas", "usage", "late_fee", "one_time", "prorated", "penalty", "other"] as Category[])
      .map((c) => [c, totalOf(c)] as const)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c, v]) => `${CATEGORY_INFO[c].label.toLowerCase()} (${rm(v)})`);
    add({
      severity: "medium",
      title: `This bill is ${rm(computed - input.usualAmount)} higher than usual`,
      detail: `You usually pay about ${rm(input.usualAmount)}. ${drivers.length ? `The biggest contributors: ${drivers.join(", ")}.` : "Your regular charges seem to have gone up — check for price changes or ended promotions."}`,
      amount: round2(computed - input.usualAmount),
      action: "none",
    });
  }

  /* ───────── savings ───────── */
  const savings: Saving[] = [];
  const addS = (s: Omit<Saving, "id">) => {
    if (s.monthly > 0.5) savings.push({ id: `s${savings.length + 1}`, ...s });
  };

  if (planNet > 0 && meta.service === "fibre") {
    const minSpeed = meta.speedMbps ?? 100;
    const candidates = PLANS.filter((p) => p.kind === "fibre" && (p.down ?? 0) >= minSpeed && p.price < planNet - 4).sort((a, b) => a.price - b.price);
    const same = provider ? candidates.find((p) => p.provider === provider) : undefined;
    if (same) {
      const m = round2(planNet - same.price);
      addS({ kind: "ask", title: `Ask ${PROVIDERS[same.provider].name} for its current ${speedLabel(same.down ?? 0)} price`, detail: `${same.name} is ${rm(same.price)}/month for new sign-ups — ${rm(m)} less than you pay. Existing customers can often get a similar deal by asking or recontracting.`, monthly: m, yearly: round2(m * 12), planId: same.id });
    }
    const seen = new Set<string>();
    for (const p of candidates) {
      if (p.provider === provider || seen.has(p.provider) || seen.size >= 2) continue;
      seen.add(p.provider);
      const m = round2(planNet - p.price);
      addS({ kind: "switch", title: `Switch to ${p.name}`, detail: `${speedLabel(p.down ?? 0)}${p.up ? ` / ${speedLabel(p.up)} upload` : ""} for ${rm(p.price)}/month${p.priceNote ? ` (${p.priceNote.toLowerCase()})` : ""}. Only if it's available at your address — check coverage first.`, monthly: m, yearly: round2(m * 12), planId: p.id });
    }
  }

  if (planNet > 0 && meta.service === "mobile") {
    const lines = 1 + extraLines;
    const currentCost = round2(planNet + sum(lineItems));
    const need = meta.dataGB;
    const dataOk = (p: Plan) => {
      if (need === undefined) return true;
      if (p.dataGB === "unlimited") return true;
      if (typeof p.dataGB !== "number") return false;
      return need === "unlimited" ? p.dataGB >= 500 : p.dataGB >= need;
    };
    const candidates = PLANS.filter((p) => p.kind === "mobile" && dataOk(p))
      .map((p) => ({ p, cost: costForLines(p, lines) }))
      .filter((x): x is { p: Plan; cost: number } => x.cost !== null && x.cost < currentCost - 4 && x.p.id !== matched?.id)
      .sort((a, b) => a.cost - b.cost);
    const same = provider ? candidates.find((x) => x.p.provider === provider) : undefined;
    const linesText = lines > 1 ? ` for all ${lines} lines` : "";
    if (same) {
      const m = round2(currentCost - same.cost);
      addS({ kind: "ask", title: `Ask about ${same.p.name}`, detail: `It would cost about ${rm(same.cost)}/month${linesText} with ${providerName}, versus ${rm(currentCost)} now, with ${dataLabelOf(same.p)} data.`, monthly: m, yearly: round2(m * 12), planId: same.p.id });
    }
    const seen = new Set<string>();
    for (const x of candidates) {
      if (x.p.provider === provider || seen.has(x.p.provider) || seen.size >= 2) continue;
      seen.add(x.p.provider);
      const m = round2(currentCost - x.cost);
      addS({ kind: "switch", title: `Switch to ${x.p.name}`, detail: `About ${rm(x.cost)}/month${linesText} with ${dataLabelOf(x.p)} data. Check the signal where you live and work before porting your number.`, monthly: m, yearly: round2(m * 12), planId: x.p.id });
    }
  }

  if (vas > 0) addS({ kind: "remove", title: "Cancel unwanted content subscriptions", detail: "Ask for a refund and a block on content billing so they can't come back.", monthly: vas, yearly: round2(vas * 12) });
  if (paperTotal > 0) addS({ kind: "remove", title: "Switch to an e-bill", detail: "Get your bill by email or in the app instead of on paper.", monthly: paperTotal, yearly: round2(paperTotal * 12) });
  if (idd >= 5) addS({ kind: "avoid", title: "Call overseas over the internet", detail: "WhatsApp or Messenger calls on Wi-Fi cost nothing extra. Savings shown assume you call this much every month.", monthly: idd, yearly: round2(idd * 12) });
  if (late > 0) addS({ kind: "avoid", title: "Avoid late payment charges", detail: "Set up auto-debit or a reminder a few days before the due date.", monthly: late, yearly: late, oneOff: true });

  const planSaving = Math.max(0, ...savings.filter((s) => s.kind === "switch" || s.kind === "ask").map((s) => s.yearly));
  const otherSaving = savings.filter((s) => (s.kind === "remove" || s.kind === "avoid") && !s.oneOff).reduce((n, s) => n + s.yearly, 0);
  const potentialYearly = round2(planSaving + otherSaving);

  /* ───────── totals, score, summary ───────── */
  const charges = round2(items.filter((i) => i.amount > 0 && i.category !== "tax" && i.category !== "rounding").reduce((s, i) => s + i.amount, 0));
  const credits = round2(items.filter((i) => i.amount < 0 && i.category !== "tax").reduce((s, i) => s + i.amount, 0));
  const ongoingRebates = sum(by("rebate").filter((r) => !endingRebateIds.has(r.id)));
  const regular = round2(totalOf("plan") - duplicatePlanExtra + totalOf("addon") + totalOf("device") + ongoingRebates);
  const variable = round2(["usage", "roaming", "idd", "vas", "one_time", "late_fee", "penalty", "prorated", "other"].reduce((s, c) => s + totalOf(c as Category), 0) + duplicatePlanExtra);
  const nextBill = round2(regular + Math.max(0, regular - totalOf("device")) * SST_RATE);

  const breakdownMap = new Map<Category, number>();
  for (const it of items) breakdownMap.set(it.category, round2((breakdownMap.get(it.category) ?? 0) + it.amount));
  const breakdown = [...breakdownMap.entries()].map(([category, total]) => ({ category, total })).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

  const order: Record<Severity, number> = { high: 0, medium: 1, low: 2, good: 3 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  savings.sort((a, b) => b.yearly - a.yearly);

  const hasHigh = findings.some((f) => f.severity === "high");
  let score = 100;
  for (const f of findings) score -= f.severity === "high" ? 18 : f.severity === "medium" ? 8 : f.severity === "low" ? 2 : 0;
  score = Math.max(8, Math.min(hasHigh ? 69 : 100, Math.round(score)));
  const verdict = hasHigh ? (score >= 50 ? "Needs your attention" : "Act on this bill") : score >= 85 ? "Looks healthy" : "A few things to check";

  const parts = [`${rm(regular)} is your regular monthly service`];
  if (variable > 0) parts.push(`${rm(variable)} is usage or one-off charges`);
  if (tax > 0) parts.push(`${rm(tax)} is service tax`);
  const summary = items.length
    ? `This ${provider ? `${providerName} ` : ""}bill comes to ${rm(computed)}. ${parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0]}.`
    : "We couldn't find any charges in this text.";

  const steps: string[] = [];
  const disputes = findings.filter((f) => f.action === "dispute");
  const contact = provider ? primaryContact(provider) : undefined;
  if (disputes.length) steps.push(`Contact ${providerName}${contact ? ` (${contact.value})` : ""} about ${disputes.length === 1 ? "the issue flagged above" : `the ${disputes.length} issues flagged above`}. Start a billing case and BillWise will draft the message for you.`);
  if (vas > 0) steps.push("Ask for third-party content billing to be blocked on your line.");
  if (carried > 1) steps.push(`Pay the full total amount payable (including the ${rm(carried)} carried over) before the due date, so your line isn't suspended again.`);
  if (late > 0) steps.push("Set up auto-debit or a calendar reminder a few days before the due date.");
  if (savings.some((s) => s.kind === "switch" || s.kind === "ask")) steps.push("Compare the cheaper options in Plan Finder — and check coverage at your address before switching.");
  if (rebateEnding) steps.push("Diarise when your promo rebate ends — it's the best moment to renegotiate.");
  if (!disputes.length && !savings.length) steps.push("Nothing urgent. Keep this analysis and compare it with next month's bill.");
  steps.push("Keep a PDF copy of this bill — you'll need it if you raise a dispute.");

  return {
    version: 1,
    meta,
    items,
    breakdown,
    totals: { charges, credits, tax, total: computed, regular, variable, nextBill },
    findings,
    savings,
    potentialYearly,
    score,
    verdict,
    summary,
    nextSteps: steps,
    notCounted,
  };
}

function dataLabelOf(p: Plan): string {
  if (p.dataGB === "unlimited") return "unlimited";
  if (typeof p.dataGB === "number") return p.dataGB >= 1000 ? `${p.dataGB / 1000}TB` : `${p.dataGB}GB`;
  return "similar";
}
