import { PLANS, costForLines, type Plan } from "./plans.ts";
import { PROVIDERS, isProviderId, type ProviderId } from "./providers.ts";
import { round2, rmShort, speedLabel, withSST } from "./format.ts";

export type Activity = "streaming" | "gaming" | "wfh" | "uploads" | "smarthome";

export interface FibrePrefs {
  kind: "fibre";
  budget: number;
  people: number;
  activities: Activity[];
  homeSize: "small" | "medium" | "large";
  flexible: boolean;
  postpaidWith?: ProviderId | "";
  available?: ProviderId[];
}

export interface MobilePrefs {
  kind: "mobile";
  budget: number;
  usage: "light" | "moderate" | "heavy" | "max";
  lines: number;
  hotspot: boolean;
  roaming: "never" | "sometimes" | "often";
  goodSignal?: ProviderId[];
}

export type Prefs = FibrePrefs | MobilePrefs;

export interface Recommendation {
  planId: string;
  score: number;
  label: "Top pick" | "Great match" | "Good match" | "Worth a look" | "Not ideal";
  monthly: number;
  monthlyWithSST: number;
  reasons: string[];
  cautions: string[];
}

export interface RecommendResult {
  kind: "fibre" | "mobile";
  needSummary: string;
  recommendedSpeed?: number;
  recommendedData?: number;
  results: Recommendation[];
}

const TIERS = [100, 200, 300, 500, 600, 1000, 2000];
const ACTIVITY_MBPS: Record<Activity, number> = { streaming: 60, gaming: 50, wfh: 50, uploads: 100, smarthome: 30 };
export const ACTIVITY_LABEL: Record<Activity, string> = {
  streaming: "streaming TV & video",
  gaming: "online gaming",
  wfh: "working or studying from home",
  uploads: "uploading videos & backups",
  smarthome: "smart home & CCTV",
};
export const USAGE_GB: Record<MobilePrefs["usage"], number> = { light: 20, moderate: 60, heavy: 150, max: 400 };

export function neededSpeed(p: Pick<FibrePrefs, "people" | "activities">): number {
  const need = p.people * 40 + p.activities.reduce((s, a) => s + ACTIVITY_MBPS[a], 0);
  return TIERS.find((t) => t >= need) ?? 2000;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

function priceScore(cost: number, budget: number, reasons: string[], cautions: string[]): number {
  if (cost <= budget) {
    reasons.push(`Fits your ${rmShort(budget)} budget at ${rmShort(cost)}/month`);
    return 25 + 10 * ((budget - cost) / budget);
  }
  const over = (cost - budget) / budget;
  cautions.push(`${rmShort(round2(cost - budget))} over your budget`);
  return Math.max(0, 25 - over * 90);
}

function labelFor(score: number, rank: number): Recommendation["label"] {
  if (rank === 0 && score >= 70) return "Top pick";
  if (score >= 75) return "Great match";
  if (score >= 60) return "Good match";
  if (score >= 45) return "Worth a look";
  return "Not ideal";
}

function scoreFibre(p: FibrePrefs): RecommendResult {
  const need = neededSpeed(p);
  const candidates = PLANS.filter((x) => x.kind === "fibre");
  const effective = (x: Plan) => (p.postpaidWith && x.provider === p.postpaidWith && x.bundlePrice ? x.bundlePrice : x.price);
  const bestValue = Math.max(...candidates.map((x) => Math.min(x.down ?? 0, need * 3) / effective(x)));

  const scored = candidates.map((x) => {
    const reasons: string[] = [];
    const cautions: string[] = [];
    const speed = x.down ?? 0;
    const cost = effective(x);
    let s = 0;

    if (speed >= need) {
      const ratio = speed / need;
      s += ratio <= 2.5 ? 40 : ratio <= 5 ? 33 : 26;
      reasons.push(`${speedLabel(speed)} comfortably covers your household (we suggest ~${speedLabel(need)})`);
      if (ratio > 5) cautions.push("Much faster than you need — a slower tier could save money");
    } else {
      s += Math.max(0, 40 * (speed / need) - 8);
      cautions.push(`Slower than the ~${speedLabel(need)} we suggest for your household`);
    }

    s += priceScore(cost, p.budget, reasons, cautions);
    s += 15 * Math.sqrt(Math.min(speed, need * 3) / cost / bestValue);

    if (p.postpaidWith && x.provider === p.postpaidWith && x.bundlePrice) {
      reasons.push(`Your ${PROVIDERS[x.provider].name} postpaid unlocks the ${rmShort(x.bundlePrice)} bundle price (normally ${rmShort(x.price)})`);
      s += 4;
    }
    if (p.activities.includes("uploads") || p.activities.includes("wfh")) {
      if (x.up && x.up >= speed * 0.8) {
        s += 6;
        reasons.push("Symmetrical upload — great for video calls, uploads and backups");
      } else if (x.up && x.up >= 300) {
        s += 3;
        reasons.push(`Strong ${speedLabel(x.up)} upload speed`);
      }
    }
    const meshy = /mesh|2 ×|wi-fi 7/i.test(x.router ?? "");
    if (p.homeSize === "large") {
      if (meshy) {
        s += 5;
        reasons.push("Includes mesh / Wi-Fi 7 for better coverage in a bigger home");
      } else cautions.push("Bigger home: you may need a mesh add-on for full coverage");
    }
    if (p.flexible) {
      if (/no-contract/i.test(x.contractNote ?? "")) {
        s += 5;
        reasons.push("Has a no-contract option (one-time charge applies)");
      } else {
        s -= 6;
        cautions.push(`${x.contractMonths}-month contract`);
      }
    }
    if (p.available && p.available.length) {
      if (p.available.includes(x.provider)) {
        s += 8;
        reasons.unshift("You confirmed it's available at your address");
      } else {
        s -= 20;
        cautions.unshift("Not confirmed at your address yet — check coverage first");
      }
    }
    if (x.listPrice && x.listPrice > x.price && !/rebate × 24/i.test(x.priceNote ?? "")) cautions.push(`Promo price — normal price is ${rmShort(x.listPrice)}`);
    if (/first 6 months/i.test(x.priceNote ?? "")) reasons.push(x.priceNote as string);

    return { x, s: clamp(Math.round(s)), cost, reasons, cautions };
  });

  // A budget is a limit: every affordable plan ranks above every plan over it; score orders each group.
  scored.sort((a, b) => Number(b.cost <= p.budget) - Number(a.cost <= p.budget) || b.s - a.s || a.cost - b.cost);
  const results: Recommendation[] = scored.map((r, i) => ({
    planId: r.x.id,
    score: r.s,
    label: labelFor(r.s, i),
    monthly: r.cost,
    monthlyWithSST: withSST(r.cost),
    reasons: r.reasons.slice(0, 4),
    cautions: r.cautions.slice(0, 3),
  }));
  const acts = p.activities.map((a) => ACTIVITY_LABEL[a]);
  return {
    kind: "fibre",
    recommendedSpeed: need,
    needSummary: `For ${p.people} ${p.people === 1 ? "person" : "people"}${acts.length ? ` with ${acts.join(", ")}` : ""}, around ${speedLabel(need)} is plenty.`,
    results,
  };
}

function scoreMobile(p: MobilePrefs): RecommendResult {
  const needGB = USAGE_GB[p.usage];
  const candidates = PLANS.filter((x) => x.kind === "mobile")
    .map((x) => ({ x, cost: costForLines(x, p.lines) }))
    .filter((r): r is { x: Plan; cost: number } => r.cost !== null);
  const gbOf = (x: Plan) => (x.dataGB === "unlimited" ? 1500 : typeof x.dataGB === "number" ? x.dataGB : 0);
  const bestValue = Math.max(...candidates.map((r) => Math.min(gbOf(r.x), needGB * 4) / r.cost));

  const scored = candidates.map(({ x, cost }) => {
    const reasons: string[] = [];
    const cautions: string[] = [];
    let s = 0;
    const shared = (x.includedLines ?? 1) > 1 || p.lines > 1;
    const effectiveNeed = shared ? needGB * Math.max(1, p.lines * 0.75) : needGB;

    if (x.dataGB === "unlimited") {
      s += 40;
      reasons.push("Unlimited data — no surprise charges for extra usage");
    } else if (typeof x.dataGB === "number" && x.dataGB >= effectiveNeed) {
      s += x.dataGB > effectiveNeed * 10 ? 36 : 40;
      reasons.push(`${x.dataGB >= 1000 ? `${x.dataGB / 1000}TB` : `${x.dataGB}GB`} covers your ~${Math.round(effectiveNeed)}GB a month`);
    } else if (typeof x.dataGB === "number") {
      s += Math.max(0, 40 * (x.dataGB / effectiveNeed) - 10);
      cautions.push(`Only ${x.dataGB}GB — below the ~${Math.round(effectiveNeed)}GB you're likely to use`);
    }

    s += priceScore(cost, p.budget, reasons, cautions);
    s += 10 * Math.sqrt(Math.min(gbOf(x), needGB * 4) / cost / bestValue);

    if (p.lines > 1) {
      if ((x.includedLines ?? 1) >= p.lines) reasons.push(`${x.includedLines} lines included in one price`);
      else reasons.push(`${p.lines} lines for about ${rmShort(cost)} in total`);
      if (/estimated/i.test(x.extraLineNote ?? "")) cautions.push("Extra-line price is an estimate — confirm with the provider");
    }
    if (p.hotspot) {
      if (/up to|within/i.test(x.hotspot ?? "")) {
        s += 2;
        cautions.push(`Hotspot is capped (${x.hotspot?.toLowerCase()})`);
      } else {
        s += 5;
        if (x.hotspot) reasons.push(x.hotspot);
      }
    }
    if (p.roaming !== "never") {
      if (x.roaming && /free|included|30gb/i.test(x.roaming)) {
        s += p.roaming === "often" ? 10 : 5;
        reasons.push(x.roaming);
      } else if (p.roaming === "often") cautions.push("No free roaming — buy passes before you travel");
    }
    if (p.goodSignal && p.goodSignal.length) {
      if (p.goodSignal.includes(x.provider)) {
        s += 6;
        reasons.unshift(`You said ${PROVIDERS[x.provider].name} signal is good where you are`);
      } else {
        s -= 6;
        cautions.push("Check the signal at home and work before switching");
      }
    }
    if (x.contractNote) cautions.push(x.contractNote);
    return { x, s: clamp(Math.round(s)), cost, reasons, cautions };
  });

  // A budget is a limit: every affordable plan ranks above every plan over it; score orders each group.
  scored.sort((a, b) => Number(b.cost <= p.budget) - Number(a.cost <= p.budget) || b.s - a.s || a.cost - b.cost);
  const results: Recommendation[] = scored.map((r, i) => ({
    planId: r.x.id,
    score: r.s,
    label: labelFor(r.s, i),
    monthly: r.cost,
    monthlyWithSST: withSST(r.cost),
    reasons: r.reasons.slice(0, 4),
    cautions: r.cautions.slice(0, 3),
  }));
  const usageText = { light: "light use", moderate: "moderate use", heavy: "heavy use", max: "very heavy use" }[p.usage];
  return {
    kind: "mobile",
    recommendedData: needGB,
    needSummary: `For ${usageText}${p.lines > 1 ? ` across ${p.lines} lines` : ""}, look for at least ~${needGB}GB a month${p.lines > 1 ? " per line" : ""}.`,
    results,
  };
}

export function recommend(prefs: Prefs): RecommendResult {
  return prefs.kind === "fibre" ? scoreFibre(prefs) : scoreMobile(prefs);
}

const between = (v: unknown, lo: number, hi: number, fallback: number) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : fallback;
};
const providerList = (v: unknown): ProviderId[] => (Array.isArray(v) ? v.filter(isProviderId) : []);
const pick = <T extends string>(v: unknown, options: readonly T[], fallback: T): T => (options.includes(v as T) ? (v as T) : fallback);
const ACTIVITIES = Object.keys(ACTIVITY_LABEL) as Activity[];

/** Validate untrusted Plan Finder answers (request body) into Prefs; null without a plan kind and numeric budget. */
export function parsePrefs(body: Record<string, unknown>): Prefs | null {
  if ((body.kind !== "fibre" && body.kind !== "mobile") || !Number.isFinite(Number(body.budget)) || body.budget === "" || body.budget == null) return null;
  if (body.kind === "mobile") {
    return {
      kind: "mobile",
      budget: Math.round(between(body.budget, 20, 600, 80) * 100) / 100,
      usage: pick(body.usage, ["light", "moderate", "heavy", "max"] as const, "moderate"),
      lines: Math.round(between(body.lines, 1, 6, 1)),
      hotspot: Boolean(body.hotspot),
      roaming: pick(body.roaming, ["never", "sometimes", "often"] as const, "sometimes"),
      goodSignal: providerList(body.goodSignal),
    };
  }
  return {
    kind: "fibre",
    budget: Math.round(between(body.budget, 40, 800, 150) * 100) / 100,
    people: Math.round(between(body.people, 1, 12, 2)),
    activities: Array.isArray(body.activities) ? body.activities.filter((a): a is Activity => ACTIVITIES.includes(a as Activity)) : [],
    homeSize: pick(body.homeSize, ["small", "medium", "large"] as const, "medium"),
    flexible: Boolean(body.flexible),
    postpaidWith: isProviderId(body.postpaidWith) ? body.postpaidWith : "",
    available: providerList(body.available),
  };
}

/** The answers behind a ranking, as readable lines for the Plan Finder assistant. */
export function describePrefs(p: Prefs): string[] {
  const names = (ids?: ProviderId[]) => (ids ?? []).map((id) => PROVIDERS[id].name).join(", ");
  if (p.kind === "mobile") {
    return [
      "Looking for: mobile postpaid",
      `Budget: ${rmShort(p.budget)}/month in total`,
      `Usage: ${p.usage} (about ${USAGE_GB[p.usage]}GB a month per line)`,
      `Lines: ${p.lines}`,
      `Needs hotspot: ${p.hotspot ? "yes" : "no"}`,
      `Travels abroad: ${p.roaming}`,
      p.goodSignal?.length ? `Good signal where they are (their own report): ${names(p.goodSignal)}` : "Signal: not given",
    ];
  }
  return [
    "Looking for: home fibre",
    `Budget: ${rmShort(p.budget)}/month`,
    `People at home: ${p.people}`,
    `Activities: ${p.activities.length ? p.activities.map((a) => ACTIVITY_LABEL[a]).join(", ") : "none picked"}`,
    `Home size: ${p.homeSize}`,
    `Wants no contract: ${p.flexible ? "yes" : "no"}`,
    p.postpaidWith ? `Already has postpaid with: ${PROVIDERS[p.postpaidWith].name}` : "No existing postpaid bundle",
    p.available?.length ? `Confirmed available at their address (their own check): ${names(p.available)}` : "Coverage at their address: not confirmed",
  ];
}
