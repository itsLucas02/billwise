import type { ProviderId } from "./providers.ts";
import { round2, speedLabel } from "./format.ts";

export type PlanKind = "fibre" | "mobile";

export interface Plan {
  id: string;
  provider: ProviderId;
  kind: PlanKind;
  name: string;
  /** What a new customer typically pays per month (RM, before 6% SST), incl. standard rebates. */
  price: number;
  /** Normal / recommended retail price when `price` is promotional. */
  listPrice?: number;
  priceNote?: string;
  bundlePrice?: number;
  bundleNote?: string;
  down?: number;
  up?: number;
  dataGB?: number | "unlimited";
  dataNote?: string;
  hotspot?: string;
  calls?: string;
  includedLines?: number;
  maxExtraLines?: number;
  extraLineCost?: number;
  extraLineNote?: string;
  roaming?: string;
  contractMonths: number;
  contractNote?: string;
  router?: string;
  perks: string[];
  source: string;
  /** official = seen on the provider's own site; listing = from authorised dealer / press listings */
  status: "official" | "listing";
}

/** Date the prices below were last checked against each provider's own site. */
export const PLANS_REVIEWED = "Nov 2026";

type FibreSeed = Omit<Plan, "kind" | "perks" | "contractMonths" | "status"> &
  Partial<Pick<Plan, "perks" | "contractMonths" | "status">>;
const fibre = (p: FibreSeed): Plan => ({ kind: "fibre", perks: [], contractMonths: 24, status: "listing", ...p });
type MobileSeed = Omit<Plan, "kind" | "perks" | "contractMonths" | "status"> &
  Partial<Pick<Plan, "perks" | "contractMonths" | "status">>;
const mobile = (p: MobileSeed): Plan => ({ kind: "mobile", perks: [], contractMonths: 0, status: "official", ...p });

/**
 * Source URLs point at each provider's own published plan pages. Prices are
 * hand-checked, not crawled — confirm on the provider's site before switching.
 */
const UNIFI = "https://unifi.com.my/fibre-broadband";
const UNIFI_MOBILE = "https://unifi.com.my/mobile/postpaid";
const MAXIS_FIBRE = "https://www.maxis.com.my/en/broadband/";
const MAXIS_MOBILE = "https://www.maxis.com.my/en/postpaid/";
const CD_FIBRE = "https://www.celcomdigi.com/fibre/home-fibre";
const CD_MOBILE = "https://www.celcomdigi.com/postpaid";
const TIME = "https://www.time.com.my";
const ALLO = "https://www.allo.my";
const UM_FIBRE = "https://www.u.com.my/en/personal/broadband/fibre";
const UM_MOBILE = "https://www.u.com.my/en/personal/mobile-plans/postpaid/postpaid-plans";
const YES_MOBILE = "https://www.yes.my/yes-postpaid-plans/";

export const PLANS: Plan[] = [
  // ───────── Unifi Home ─────────
  fibre({ id: "unifi-100", provider: "unifi", name: "Unifi Home 100Mbps", price: 89, listPrice: 99, priceNote: "Promotional price", down: 100, up: 50, router: "Wi-Fi 6 router", perks: ["Free Wi-Fi 6 router"], source: UNIFI }),
  fibre({ id: "unifi-300", provider: "unifi", name: "Unifi Home 300Mbps", price: 129, listPrice: 139, priceNote: "Promotional price", down: 300, up: 50, router: "Wi-Fi 6 router", perks: ["Free Wi-Fi 6 router"], source: UNIFI }),
  fibre({ id: "unifi-500", provider: "unifi", name: "Unifi Home 500Mbps", price: 149, listPrice: 159, priceNote: "Promotional price", down: 500, up: 100, router: "Wi-Fi 6 router", perks: ["Free Wi-Fi 6 router"], source: UNIFI }),
  fibre({ id: "unifi-1g", provider: "unifi", name: "Unifi Home 1Gbps", price: 249, listPrice: 289, priceNote: "Promotional price", down: 1000, up: 500, router: "Wi-Fi 6 router", perks: ["Free Wi-Fi 6 router", "600 free call minutes"], source: UNIFI }),
  fibre({ id: "unifi-2g", provider: "unifi", name: "Unifi Home 2Gbps", price: 319, down: 2000, up: 1000, router: "Wi-Fi 6 router", perks: ["Free Wi-Fi 6 router", "600 free call minutes"], source: UNIFI }),

  // ───────── Maxis Home Fibre ─────────
  fibre({ id: "maxis-100", provider: "maxis", name: "Maxis Home Fibre 100Mbps", price: 89, listPrice: 99, priceNote: "RM10 rebate × 24 months", down: 100, router: "Wi-Fi 6 router (EasyMesh)", perks: ["Wi-Fi 6 certified router"], source: MAXIS_FIBRE }),
  fibre({ id: "maxis-300", provider: "maxis", name: "Maxis Home Fibre 300Mbps", price: 129, listPrice: 139, priceNote: "RM10 rebate × 24 months", bundlePrice: 99, bundleNote: "With Maxis Postpaid RM69 and above", down: 300, router: "Wi-Fi 6 router (EasyMesh)", perks: ["Wi-Fi 6 certified router"], source: MAXIS_FIBRE }),
  fibre({ id: "maxis-500", provider: "maxis", name: "Maxis Home Fibre 500Mbps", price: 149, listPrice: 159, priceNote: "RM10 rebate × 24 months", bundlePrice: 139, bundleNote: "With Maxis Postpaid RM69 and above", down: 500, router: "Wi-Fi 6 router (EasyMesh)", perks: ["Wi-Fi 6 certified router"], source: MAXIS_FIBRE }),
  fibre({ id: "maxis-1g", provider: "maxis", name: "Maxis Home Fibre 1Gbps", price: 249, bundlePrice: 159, bundleNote: "With Maxis Postpaid RM69 and above", down: 1000, router: "Wi-Fi 7 tri-band router", perks: ["Premium Wi-Fi 7 router"], source: MAXIS_FIBRE }),
  fibre({ id: "maxis-2g", provider: "maxis", name: "Maxis Home Fibre 2Gbps", price: 319, down: 2000, router: "Wi-Fi 7 tri-band router", perks: ["Premium Wi-Fi 7 router", "Voice add-on available"], source: MAXIS_FIBRE }),

  // ───────── CelcomDigi Home Fibre ─────────
  fibre({ id: "cd-100", provider: "celcomdigi", name: "CelcomDigi Home Fibre 100Mbps", price: 99, down: 100, router: "Wi-Fi 6 router", perks: ["Free Wi-Fi 6 router & installation"], source: CD_FIBRE }),
  fibre({ id: "cd-300", provider: "celcomdigi", name: "CelcomDigi Home Fibre 300Mbps", price: 139, bundlePrice: 129, bundleNote: "With eligible CelcomDigi Postpaid 60 and above", down: 300, router: "Wi-Fi 7 router", perks: ["Free Wi-Fi 7 router & installation"], source: CD_FIBRE }),
  fibre({ id: "cd-500", provider: "celcomdigi", name: "CelcomDigi Home Fibre 500Mbps", price: 159, bundlePrice: 149, bundleNote: "With eligible CelcomDigi Postpaid", down: 500, router: "Wi-Fi 7 router + mesh node", perks: ["Free Wi-Fi 7 router", "Mesh node included"], source: CD_FIBRE }),
  fibre({ id: "cd-1g", provider: "celcomdigi", name: "CelcomDigi Home Fibre 1Gbps", price: 249, bundlePrice: 239, bundleNote: "With eligible CelcomDigi Postpaid", down: 1000, router: "Premium Wi-Fi 7 router + mesh node", perks: ["Premium Wi-Fi 7 router", "Mesh node included"], source: CD_FIBRE }),
  fibre({ id: "cd-2g", provider: "celcomdigi", name: "CelcomDigi Home Fibre 2Gbps", price: 319, bundlePrice: 309, bundleNote: "With eligible CelcomDigi Postpaid", down: 2000, router: "Premium Wi-Fi 7 router + mesh node", perks: ["Premium Wi-Fi 7 router", "Mesh node included"], source: CD_FIBRE }),

  // ───────── TIME ─────────
  fibre({ id: "time-200", provider: "time", name: "TIME Fibre 200Mbps", price: 99, down: 200, up: 200, router: "Wi-Fi 6 router", contractNote: "No-contract option: RM400 one-time charge", perks: ["Symmetrical upload", "Free Wi-Fi 6 router"], source: TIME, status: "official" }),
  fibre({ id: "time-600", provider: "time", name: "TIME Fibre 600Mbps", price: 139, priceNote: "RM99/month for the first 6 months", down: 600, up: 500, router: "Wi-Fi 7 router", contractNote: "No-contract option: RM650 one-time charge", perks: ["Free Wi-Fi 7 router", "500Mbps upload"], source: TIME, status: "official" }),
  fibre({ id: "time-1g", provider: "time", name: "TIME Fibre 1Gbps", price: 199, down: 1000, up: 500, router: "Wi-Fi 7 router", contractNote: "No-contract option: RM800 one-time charge", perks: ["Free Wi-Fi 7 router", "500Mbps upload"], source: TIME, status: "official" }),
  fibre({ id: "time-2g", provider: "time", name: "TIME Fibre 2Gbps", price: 379, down: 2000, up: 500, router: "High-performance Wi-Fi router", contractNote: "Only available in selected locations", perks: ["High-performance router"], source: TIME, status: "official" }),

  // ───────── Allo ─────────
  fibre({ id: "allo-100", provider: "allo", name: "Allo Fibre 100Mbps", price: 69, down: 100, up: 100, router: "Wi-Fi 6 router", contractNote: "12-month option carries a one-time charge", perks: ["Symmetrical upload", "Free Wi-Fi 6 router"], source: ALLO, status: "official" }),
  fibre({ id: "allo-300", provider: "allo", name: "Allo Fibre 300Mbps", price: 99, down: 300, up: 300, router: "Wi-Fi 6 router", contractNote: "12-month option carries a one-time charge", perks: ["Symmetrical upload", "Free Wi-Fi 6 router"], source: ALLO, status: "official" }),
  fibre({ id: "allo-500", provider: "allo", name: "Allo Fibre 500Mbps", price: 139, down: 500, up: 500, router: "Wi-Fi 6 router", contractNote: "12-month option carries a one-time charge", perks: ["Symmetrical upload", "Free Wi-Fi 6 router"], source: ALLO, status: "official" }),
  fibre({ id: "allo-1g", provider: "allo", name: "Allo Fibre 1Gbps", price: 199, down: 1000, up: 500, router: "2 × Wi-Fi 6 routers (EasyMesh)", contractNote: "12-month option carries a one-time charge", perks: ["Two Wi-Fi 6 routers for mesh"], source: ALLO, status: "official" }),

  // ───────── U Mobile Home Fibre ─────────
  fibre({ id: "um-100", provider: "umobile", name: "U Home Fibre 100Mbps", price: 79, listPrice: 99, priceNote: "Limited-time promo price", down: 100, router: "Wi-Fi 6 router", contractNote: "Confirm contract length at sign-up", perks: ["Free Wi-Fi 6 & installation"], source: UM_FIBRE, status: "official" }),
  fibre({ id: "um-300", provider: "umobile", name: "U Home Fibre 300Mbps", price: 119, listPrice: 139, priceNote: "Limited-time promo price", down: 300, router: "Wi-Fi 6 router", contractNote: "Confirm contract length at sign-up", perks: ["Free Wi-Fi 6 & installation"], source: UM_FIBRE, status: "official" }),
  fibre({ id: "um-500", provider: "umobile", name: "U Home Fibre 500Mbps", price: 139, listPrice: 159, priceNote: "Limited-time promo price", down: 500, router: "Wi-Fi 6 router", contractNote: "Confirm contract length at sign-up", perks: ["Free Wi-Fi 6 & installation"], source: UM_FIBRE, status: "official" }),
  fibre({ id: "um-1g", provider: "umobile", name: "U Home Fibre 1Gbps", price: 269, listPrice: 289, priceNote: "Limited-time promo price", down: 1000, router: "Wi-Fi 6 router", contractNote: "Confirm contract length at sign-up", perks: ["Free Wi-Fi 6 & installation"], source: UM_FIBRE, status: "official" }),

  // ───────── Maxis Postpaid ─────────
  mobile({ id: "maxis-pp89", provider: "maxis", name: "Maxis Postpaid 89", price: 89, dataGB: "unlimited", dataNote: "Unlimited 5G/4G (fair usage policy applies)", calls: "Unlimited calls & SMS", maxExtraLines: 0, roaming: "5G roaming passes from RM29/day", perks: ["Unlimited 5G/4G data", "Best for single users"], source: MAXIS_MOBILE, status: "listing" }),
  mobile({ id: "maxis-pp109", provider: "maxis", name: "Maxis Postpaid 109", price: 109, priceNote: "Promo: save RM10/month for 6 months", dataGB: "unlimited", dataNote: "Unlimited 5G/4G (fair usage policy applies)", calls: "Unlimited calls & SMS", maxExtraLines: 1, extraLineCost: 48, extraLineNote: "Share Lines RM48/month each; allowance varies by campaign", roaming: "5G roaming passes from RM29/day", perks: ["Unlimited 5G/4G data", "Share Lines available"], source: MAXIS_MOBILE, status: "listing" }),
  mobile({ id: "maxis-pp139", provider: "maxis", name: "Maxis Postpaid 139", price: 139, priceNote: "Promo: save RM10/month for 6 months", dataGB: "unlimited", dataNote: "Unlimited 5G/4G (fair usage policy applies)", calls: "Unlimited calls & SMS", maxExtraLines: 2, extraLineCost: 48, extraLineNote: "Share Lines RM48/month each; allowance varies by campaign", roaming: "5G roaming passes from RM29/day", perks: ["Unlimited 5G/4G data", "Free sooka Premium (limited time)"], source: MAXIS_MOBILE, status: "listing" }),
  mobile({ id: "maxis-pp169", provider: "maxis", name: "Maxis Postpaid 169", price: 169, priceNote: "Promo: save RM10/month for 6 months", dataGB: "unlimited", dataNote: "Unlimited 5G/4G (fair usage policy applies)", calls: "Unlimited calls & SMS", maxExtraLines: 3, extraLineCost: 48, extraLineNote: "Share Lines RM48/month each; allowance varies by campaign", roaming: "5G roaming passes from RM29/day", perks: ["Unlimited 5G/4G data", "Better device deals"], source: MAXIS_MOBILE, status: "listing" }),
  mobile({ id: "maxis-pp199", provider: "maxis", name: "Maxis Postpaid 199", price: 199, dataGB: "unlimited", dataNote: "Unlimited 5G/4G (fair usage policy applies)", calls: "Unlimited calls & SMS", maxExtraLines: 4, extraLineCost: 48, extraLineNote: "Share Lines RM48/month each; allowance varies by campaign", roaming: "5G roaming passes from RM29/day", perks: ["Unlimited 5G/4G data", "Most Share Lines"], source: MAXIS_MOBILE, status: "listing" }),

  // ───────── CelcomDigi Postpaid 5G ─────────
  mobile({ id: "cd-pp80", provider: "celcomdigi", name: "CelcomDigi Postpaid 5G 80", price: 80, dataGB: 600, dataNote: "600GB 5G/4G, unlimited speed", calls: "Unlimited calls", maxExtraLines: 3, extraLineCost: 72, extraLineNote: "Up to 3 supplementary lines at 10% off (from RM72)", perks: ["RM120 port-in rebate"], source: CD_MOBILE }),
  mobile({ id: "cd-pp120", provider: "celcomdigi", name: "CelcomDigi Postpaid 5G 120", price: 120, dataGB: "unlimited", dataNote: "Unlimited 5G/4G", calls: "Unlimited calls", maxExtraLines: 6, extraLineCost: 108, extraLineNote: "Up to 6 supplementary lines at 10% off (from RM108)", perks: ["RM120 port-in rebate", "Viu Premium", "WebSHIELD"], source: CD_MOBILE }),
  mobile({ id: "cd-pp140", provider: "celcomdigi", name: "CelcomDigi Postpaid 5G 140", price: 140, dataGB: "unlimited", dataNote: "Unlimited 5G/4G", calls: "Unlimited calls", maxExtraLines: 6, extraLineCost: 70, extraLineNote: "Up to 6 supplementary lines at 50% off (from RM70)", perks: ["50% off supplementary lines", "RM120 port-in rebate", "Viu Premium", "WebSHIELD"], source: CD_MOBILE }),
  mobile({ id: "cd-pp190", provider: "celcomdigi", name: "CelcomDigi Postpaid 5G 190", price: 190, dataGB: "unlimited", dataNote: "Unlimited 5G/4G at uncapped speed", calls: "Unlimited calls", maxExtraLines: 6, extraLineCost: 95, extraLineNote: "Up to 6 supplementary lines at 50% off (from RM95)", roaming: "Unlimited worldwide roaming; 50% off roaming passes", perks: ["Prime Video & Viu Premium", "WebSHIELD", "Roaming data included"], source: CD_MOBILE }),

  // ───────── U Mobile ULTRA ─────────
  mobile({ id: "um-ultra45", provider: "umobile", name: "ULTRA Postpaid 45", price: 45, priceNote: "Promo: RM35/month via rebate (limited time)", dataGB: 500, dataNote: "500GB 5G/4G, then 512kbps — no extra charges", hotspot: "Hotspot shares your main data", calls: "Unlimited local calls", maxExtraLines: 0, contractNote: "90-day minimum before downgrading", perks: ["1× ULTRA5G Priority Pass monthly"], source: UM_MOBILE }),
  mobile({ id: "um-ultra68", provider: "umobile", name: "ULTRA Postpaid 68", price: 68, priceNote: "Promo: RM58/month via rebate (limited time)", dataGB: 1000, dataNote: "1,000GB 5G/4G, then 512kbps — no extra charges", hotspot: "Hotspot shares your main data", calls: "Unlimited local calls", maxExtraLines: 2, extraLineCost: 38, extraLineNote: "Up to 2 supplementary lines at RM38 each", roaming: "15GB free roaming in Singapore, Indonesia & Thailand", contractNote: "90-day minimum before downgrading", perks: ["Free roaming data (SG/ID/TH)", "2× ULTRA5G Priority Passes"], source: UM_MOBILE }),
  // Yes (YTL): no-contract postpaid tab, checked on yes.my 17 Nov 2026. Supplementary-line prices aren't listed, so these rank as single-line plans.
  mobile({ id: "yes-ai30", provider: "yes", name: "Yes AI 30", price: 30, priceNote: "Promo: RM20/month for the first 6 months (RM20 rebate)", dataGB: "unlimited", dataNote: "Uncapped 5G data and speed; 4G up to 7Mbps", hotspot: "12GB hotspot", calls: "Unlimited calls, unlimited on-net SMS", maxExtraLines: 0, perks: ["Free ILMUchat Pro"], source: YES_MOBILE }),
  mobile({ id: "yes-power35", provider: "yes", name: "Yes Power 35", price: 35, dataGB: 150, dataNote: "150GB 5G/4G data with uncapped speed", hotspot: "Hotspot shares your main data", calls: "Unlimited calls, unlimited on-net SMS", maxExtraLines: 0, perks: ["Free ILMUchat Pro"], source: YES_MOBILE }),
  mobile({ id: "yes-inf58", provider: "yes", name: "Yes Infinite Basic", price: 58, dataGB: "unlimited", dataNote: "Uncapped 5G/4G data and speed", hotspot: "20GB hotspot", calls: "Unlimited calls, unlimited on-net SMS", maxExtraLines: 0, roaming: "Free unlimited roaming in Singapore", perks: ["Free ILMUchat Pro", "Supplementary lines available (price not listed)"], source: YES_MOBILE }),
  mobile({ id: "yes-inf88", provider: "yes", name: "Yes Infinite Standard", price: 88, dataGB: "unlimited", dataNote: "Uncapped 5G/4G data and speed", hotspot: "50GB hotspot", calls: "Unlimited calls, unlimited on-net SMS", maxExtraLines: 0, roaming: "Free unlimited roaming in Singapore", perks: ["Free ILMUchat Pro", "Supplementary lines available (price not listed)"], source: YES_MOBILE }),
  mobile({ id: "yes-inf118", provider: "yes", name: "Yes Infinite Premium", price: 118, dataGB: "unlimited", dataNote: "Uncapped 5G/4G data and speed", hotspot: "80GB hotspot", calls: "Unlimited calls, unlimited on-net SMS", maxExtraLines: 0, roaming: "Free unlimited roaming in Singapore", perks: ["Free ILMUchat Pro", "Supplementary lines available (price not listed)"], source: YES_MOBILE }),
  mobile({ id: "yes-inf178", provider: "yes", name: "Yes Infinite Ultra", price: 178, dataGB: "unlimited", dataNote: "Uncapped 5G/4G data and speed", hotspot: "110GB hotspot", calls: "Unlimited calls, unlimited on-net SMS", maxExtraLines: 0, roaming: "Free unlimited roaming in Singapore", perks: ["Free ILMUchat Pro", "Supplementary lines available (price not listed)"], source: YES_MOBILE }),
  mobile({ id: "um-global98", provider: "umobile", name: "ULTRA Global 98", price: 98, priceNote: "Promo: RM88/month via rebate (limited time)", dataGB: 1000, dataNote: "1,000GB 5G/4G, then 512kbps — no extra charges", hotspot: "Hotspot shares your main data", calls: "Unlimited local calls", maxExtraLines: 6, extraLineCost: 38, extraLineNote: "Up to 6 supplementary lines at RM38 each", roaming: "15GB free roaming in 60+ destinations", contractNote: "90-day minimum before downgrading", perks: ["Global roaming data included", "3× ULTRA5G Priority Passes"], source: UM_MOBILE }),
  mobile({ id: "um-family128", provider: "umobile", name: "ULTRA Family 128", price: 128, priceNote: "Promo: RM118/month via rebate (limited time)", dataGB: 1000, dataNote: "1,000GB shared across 4 lines", hotspot: "Hotspot shares your main data", calls: "Unlimited local calls", includedLines: 4, maxExtraLines: 0, roaming: "15GB global roaming, shareable across all lines", contractNote: "90-day minimum before downgrading", perks: ["4 lines included", "Shared global roaming"], source: UM_MOBILE }),

  // ───────── Unifi Mobile ─────────
  mobile({ id: "uni-pp39", provider: "unifi", name: "UNI5G Postpaid 39", price: 39, dataGB: 50, dataNote: "50GB 5G/4G, free upgrade to 250GB", hotspot: "Hotspot up to 50GB", calls: "Unlimited calls", maxExtraLines: 0, perks: ["No contract"], source: UNIFI_MOBILE, status: "listing" }),
  mobile({ id: "uni-pp69", provider: "unifi", name: "UNI5G Postpaid 69", price: 69, dataGB: 500, dataNote: "500GB 5G/4G, free upgrade to 500GB", hotspot: "Hotspot up to 500GB", calls: "Unlimited calls", maxExtraLines: 0, perks: ["No contract"], source: UNIFI_MOBILE, status: "listing" }),
  mobile({ id: "uni-pp99", provider: "unifi", name: "UNI5G Postpaid 99", price: 99, dataGB: "unlimited", dataNote: "Unlimited 5G/4G, free upgrade of 100GB", hotspot: "Hotspot up to 100GB", calls: "Unlimited calls", maxExtraLines: 0, perks: ["No contract"], source: UNIFI_MOBILE, status: "listing" }),
  mobile({ id: "uni-fam129", provider: "unifi", name: "UNI5G Postpaid Family 129", price: 129, dataGB: "unlimited", dataNote: "Unlimited 5G/4G", hotspot: "150GB principal, 30GB per family line", calls: "Unlimited calls", includedLines: 2, maxExtraLines: 0, perks: ["2 lines included", "No contract"], source: UNIFI_MOBILE, status: "listing" }),
  mobile({ id: "uni-fam159", provider: "unifi", name: "UNI5G Postpaid Family 159", price: 159, dataGB: "unlimited", dataNote: "Unlimited 5G/4G", hotspot: "200GB principal, 30GB per family line", calls: "Unlimited calls", includedLines: 3, maxExtraLines: 0, perks: ["3 lines included", "No contract"], source: UNIFI_MOBILE, status: "listing" }),
  mobile({ id: "uni-fam189", provider: "unifi", name: "UNI5G Postpaid Family 189", price: 189, dataGB: "unlimited", dataNote: "Unlimited 5G/4G", hotspot: "250GB principal, 30GB per family line", calls: "Unlimited calls", includedLines: 4, maxExtraLines: 0, perks: ["4 lines included", "No contract"], source: UNIFI_MOBILE, status: "listing" }),
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function plansOf(kind: PlanKind): Plan[] {
  return PLANS.filter((p) => p.kind === kind);
}

/** Monthly cost (before SST) for a given number of lines, or null if the plan can't support them. */
export function costForLines(p: Plan, lines: number): number | null {
  const included = p.includedLines ?? 1;
  if (lines <= included) return p.price;
  const extra = lines - included;
  if ((p.maxExtraLines ?? 0) >= extra && p.extraLineCost !== undefined) return round2(p.price + extra * p.extraLineCost);
  return null;
}

export function dataLabel(p: Plan): string {
  if (p.dataGB === "unlimited") return "Unlimited";
  if (typeof p.dataGB === "number") return p.dataGB >= 1000 ? `${(p.dataGB / 1000).toLocaleString("en-MY")}TB` : `${p.dataGB}GB`;
  return "—";
}

export function headline(p: Plan): string {
  if (p.kind === "fibre") return `${speedLabel(p.down ?? 0)}${p.up ? ` / ${speedLabel(p.up)} up` : ""}`;
  return `${dataLabel(p)} data`;
}

export function contractLabel(p: Plan): string {
  return p.contractMonths > 0 ? `${p.contractMonths}-month contract` : "No contract";
}

/** The facts that set plans apart, shown on every plan card (browse and ranked) so "unlimited" plans can be told apart. */
export function planFacts(p: Plan): { label: string; value: string }[] {
  const money = (n: number) => `RM${Number.isInteger(n) ? n : n.toFixed(2)}`;
  const extras = p.perks.filter((x) => !/^no contract$/i.test(x) && !/lines? included/i.test(x));
  const contract = `${contractLabel(p)}${p.contractNote ? ` · ${p.contractNote}` : ""}`;
  const rows: [string, string | undefined][] =
    p.kind === "fibre"
      ? [
          ["Speed", `${speedLabel(p.down ?? 0)} down${p.up ? ` / ${speedLabel(p.up)} up` : ""}`],
          ["Router", p.router],
          ["Contract", contract],
          ["Bundle", p.bundlePrice !== undefined ? `${money(p.bundlePrice)}${p.bundleNote ? ` ${p.bundleNote.toLowerCase()}` : ""}` : undefined],
        ]
      : [
          ["Data", p.dataNote ?? `${dataLabel(p)} data`],
          ["Hotspot", p.hotspot ?? "Not listed by the provider"],
          [
            "Lines",
            (p.includedLines ?? 1) > 1
              ? `${p.includedLines} lines included`
              : (p.maxExtraLines ?? 0) > 0 && p.extraLineCost !== undefined
                ? `1 line, up to ${p.maxExtraLines} extra line${p.maxExtraLines === 1 ? "" : "s"} at ${money(p.extraLineCost)} each`
                : "1 line",
          ],
          ["Roaming", p.roaming ?? "No free roaming listed"],
          ["Contract", contract],
        ];
  if (extras.length) rows.push(["Extras", extras.join(", ")]);
  return rows.filter((r): r is [string, string] => Boolean(r[1])).map(([label, value]) => ({ label, value }));
}
