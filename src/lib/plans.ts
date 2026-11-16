import type { ProviderId } from "./providers";
import { round2, speedLabel } from "./format";

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

export const PLANS_REVIEWED = "Nov 2026";

type FibreSeed = Omit<Plan, "kind" | "perks" | "contractMonths" | "status"> &
  Partial<Pick<Plan, "perks" | "contractMonths" | "status">>;
const fibre = (p: FibreSeed): Plan => ({ kind: "fibre", perks: [], contractMonths: 24, status: "listing", ...p });
type MobileSeed = Omit<Plan, "kind" | "perks" | "contractMonths" | "status"> &
  Partial<Pick<Plan, "perks" | "contractMonths" | "status">>;
const mobile = (p: MobileSeed): Plan => ({ kind: "mobile", perks: [], contractMonths: 0, status: "official", ...p });

/**
 * All plans below describe fictional providers. Source URLs point at the
 * reserved example.com domain and are illustrative only.
 */
const UNIFLY = "https://example.com/unifly/plans";
const MAXON_FIBRE = "https://example.com/maxon/plans/fibre";
const MAXON_MOBILE = "https://example.com/maxon/plans/mobile";
const TELCOMDIGI = "https://example.com/telcomdigi/plans";
const TIDE = "https://example.com/tide/plans";
const HELO = "https://example.com/helo-fibre/plans";
const VM_FIBRE = "https://example.com/v-mobile/plans/fibre";
const VM_MOBILE = "https://example.com/v-mobile/plans/mobile";

export const PLANS: Plan[] = [
  // ───────── Unifly Home ─────────
  fibre({ id: "unifly-100", provider: "unifly", name: "Unifly Home 100Mbps", price: 89, listPrice: 99, priceNote: "Promotional price", down: 100, up: 50, router: "Wi-Fi 6 router", perks: ["Free Wi-Fi 6 router"], source: UNIFLY }),
  fibre({ id: "unifly-300", provider: "unifly", name: "Unifly Home 300Mbps", price: 129, listPrice: 139, priceNote: "Promotional price", down: 300, up: 50, router: "Wi-Fi 6 router", perks: ["Free Wi-Fi 6 router"], source: UNIFLY }),
  fibre({ id: "unifly-500", provider: "unifly", name: "Unifly Home 500Mbps", price: 149, listPrice: 159, priceNote: "Promotional price", down: 500, up: 100, router: "Wi-Fi 6 router", perks: ["Free Wi-Fi 6 router"], source: UNIFLY }),
  fibre({ id: "unifly-1g", provider: "unifly", name: "Unifly Home 1Gbps", price: 249, listPrice: 289, priceNote: "Promotional price", down: 1000, up: 500, router: "Wi-Fi 6 router", perks: ["Free Wi-Fi 6 router", "600 free call minutes"], source: UNIFLY }),
  fibre({ id: "unifly-2g", provider: "unifly", name: "Unifly Home 2Gbps", price: 319, down: 2000, up: 1000, router: "Wi-Fi 6 router", perks: ["Free Wi-Fi 6 router", "600 free call minutes"], source: UNIFLY }),

  // ───────── Maxon Home Fibre ─────────
  fibre({ id: "maxon-100", provider: "maxon", name: "Maxon Home Fibre 100Mbps", price: 89, listPrice: 99, priceNote: "RM10 rebate × 24 months", down: 100, router: "Wi-Fi 6 router (EasyMesh)", perks: ["Wi-Fi 6 certified router"], source: MAXON_FIBRE }),
  fibre({ id: "maxon-300", provider: "maxon", name: "Maxon Home Fibre 300Mbps", price: 129, listPrice: 139, priceNote: "RM10 rebate × 24 months", bundlePrice: 99, bundleNote: "With Maxon Postpaid RM69 and above", down: 300, router: "Wi-Fi 6 router (EasyMesh)", perks: ["Wi-Fi 6 certified router"], source: MAXON_FIBRE }),
  fibre({ id: "maxon-500", provider: "maxon", name: "Maxon Home Fibre 500Mbps", price: 149, listPrice: 159, priceNote: "RM10 rebate × 24 months", bundlePrice: 139, bundleNote: "With Maxon Postpaid RM69 and above", down: 500, router: "Wi-Fi 6 router (EasyMesh)", perks: ["Wi-Fi 6 certified router"], source: MAXON_FIBRE }),
  fibre({ id: "maxon-1g", provider: "maxon", name: "Maxon Home Fibre 1Gbps", price: 249, bundlePrice: 159, bundleNote: "With Maxon Postpaid RM69 and above", down: 1000, router: "Wi-Fi 7 tri-band router", perks: ["Premium Wi-Fi 7 router"], source: MAXON_FIBRE }),
  fibre({ id: "maxon-2g", provider: "maxon", name: "Maxon Home Fibre 2Gbps", price: 319, down: 2000, router: "Wi-Fi 7 tri-band router", perks: ["Premium Wi-Fi 7 router", "Voice add-on available"], source: MAXON_FIBRE }),

  // ───────── TelcomDigi Home Fibre ─────────
  fibre({ id: "td-100", provider: "telcomdigi", name: "TelcomDigi Home Fibre 100Mbps", price: 89, listPrice: 99, priceNote: "RM10 rebate × 24 months", down: 100, router: "Wi-Fi 6 router", perks: ["Free Wi-Fi 6 router & installation"], source: TELCOMDIGI }),
  fibre({ id: "td-300", provider: "telcomdigi", name: "TelcomDigi Home Fibre 300Mbps", price: 129, listPrice: 139, priceNote: "RM10 rebate × 24 months", bundlePrice: 99, bundleNote: "With eligible TelcomDigi Postpaid 60 and above", down: 300, router: "Wi-Fi 7 router", perks: ["Free Wi-Fi 7 router & installation"], source: TELCOMDIGI }),
  fibre({ id: "td-500", provider: "telcomdigi", name: "TelcomDigi Home Fibre 500Mbps", price: 149, listPrice: 159, priceNote: "RM10 rebate × 24 months", bundlePrice: 139, bundleNote: "With eligible TelcomDigi Postpaid", down: 500, router: "Wi-Fi 7 router + mesh node", perks: ["Free Wi-Fi 7 router", "Mesh node included"], source: TELCOMDIGI }),
  fibre({ id: "td-1g", provider: "telcomdigi", name: "TelcomDigi Home Fibre 1Gbps", price: 239, listPrice: 249, priceNote: "RM10 rebate × 24 months", bundlePrice: 189, bundleNote: "With eligible TelcomDigi Postpaid", down: 1000, router: "Premium Wi-Fi 7 router + mesh node", perks: ["Premium Wi-Fi 7 router", "Mesh node included"], source: TELCOMDIGI }),
  fibre({ id: "td-2g", provider: "telcomdigi", name: "TelcomDigi Home Fibre 2Gbps", price: 309, listPrice: 319, priceNote: "RM10 rebate × 24 months", bundlePrice: 259, bundleNote: "With eligible TelcomDigi Postpaid", down: 2000, router: "Premium Wi-Fi 7 router + mesh node", perks: ["Premium Wi-Fi 7 router", "Mesh node included"], source: TELCOMDIGI }),

  // ───────── TIDE ─────────
  fibre({ id: "tide-200", provider: "tide", name: "TIDE Fibre 200Mbps", price: 99, down: 200, up: 200, router: "Wi-Fi 6 router", contractNote: "No-contract option: RM400 one-time charge", perks: ["Symmetrical upload", "Free Wi-Fi 6 router"], source: TIDE, status: "official" }),
  fibre({ id: "tide-600", provider: "tide", name: "TIDE Fibre 600Mbps", price: 139, priceNote: "RM99/month for the first 6 months", down: 600, up: 500, router: "Wi-Fi 7 router", contractNote: "No-contract option: RM650 one-time charge", perks: ["Free Wi-Fi 7 router", "500Mbps upload"], source: TIDE, status: "official" }),
  fibre({ id: "tide-1g", provider: "tide", name: "TIDE Fibre 1Gbps", price: 199, down: 1000, up: 500, router: "Wi-Fi 7 router", contractNote: "No-contract option available (one-time charge)", perks: ["Free Wi-Fi 7 router", "500Mbps upload"], source: TIDE, status: "official" }),
  fibre({ id: "tide-2g", provider: "tide", name: "TIDE Fibre 2Gbps", price: 379, down: 2000, up: 500, router: "High-performance Wi-Fi router", perks: ["High-performance router"], source: TIDE, status: "official" }),

  // ───────── Helo Fibre ─────────
  fibre({ id: "helo-100", provider: "helo", name: "Helo Fibre 100Mbps", price: 69, down: 100, up: 100, router: "Wi-Fi 6 router", contractNote: "12-month option carries a one-time charge", perks: ["Symmetrical upload", "Free Wi-Fi 6 router"], source: HELO, status: "official" }),
  fibre({ id: "helo-300", provider: "helo", name: "Helo Fibre 300Mbps", price: 99, down: 300, up: 300, router: "Wi-Fi 6 router", contractNote: "12-month option carries a one-time charge", perks: ["Symmetrical upload", "Free Wi-Fi 6 router"], source: HELO, status: "official" }),
  fibre({ id: "helo-500", provider: "helo", name: "Helo Fibre 500Mbps", price: 139, down: 500, up: 500, router: "Wi-Fi 6 router", contractNote: "12-month option carries a one-time charge", perks: ["Symmetrical upload", "Free Wi-Fi 6 router"], source: HELO, status: "official" }),
  fibre({ id: "helo-1g", provider: "helo", name: "Helo Fibre 1Gbps", price: 199, down: 1000, up: 500, router: "2 × Wi-Fi 6 routers (EasyMesh)", contractNote: "12-month option carries a one-time charge", perks: ["Two Wi-Fi 6 routers for mesh"], source: HELO, status: "official" }),

  // ───────── V Mobile Home Fibre ─────────
  fibre({ id: "vm-100", provider: "vmobile", name: "V Home Fibre 100Mbps", price: 79, listPrice: 99, priceNote: "Limited-time promo price", down: 100, router: "Wi-Fi 6 router", contractNote: "Confirm contract length at sign-up", perks: ["Free Wi-Fi 6 & installation"], source: VM_FIBRE, status: "official" }),
  fibre({ id: "vm-300", provider: "vmobile", name: "V Home Fibre 300Mbps", price: 119, listPrice: 139, priceNote: "Limited-time promo price", down: 300, router: "Wi-Fi 6 router", contractNote: "Confirm contract length at sign-up", perks: ["Free Wi-Fi 6 & installation"], source: VM_FIBRE, status: "official" }),
  fibre({ id: "vm-500", provider: "vmobile", name: "V Home Fibre 500Mbps", price: 139, listPrice: 159, priceNote: "Limited-time promo price", down: 500, router: "Wi-Fi 6 router", contractNote: "Confirm contract length at sign-up", perks: ["Free Wi-Fi 6 & installation"], source: VM_FIBRE, status: "official" }),
  fibre({ id: "vm-1g", provider: "vmobile", name: "V Home Fibre 1Gbps", price: 269, listPrice: 289, priceNote: "Limited-time promo price", down: 1000, router: "Wi-Fi 6 router", contractNote: "Confirm contract length at sign-up", perks: ["Free Wi-Fi 6 & installation"], source: VM_FIBRE, status: "official" }),

  // ───────── Maxon Postpaid ─────────
  mobile({ id: "maxon-pp89", provider: "maxon", name: "Maxon Postpaid 89", price: 89, dataGB: "unlimited", dataNote: "Unlimited 5G/4G (fair usage policy applies)", calls: "Unlimited calls & SMS", maxExtraLines: 0, roaming: "5G roaming passes from RM29/day", perks: ["Unlimited 5G/4G data", "Best for single users"], source: MAXON_MOBILE }),
  mobile({ id: "maxon-pp109", provider: "maxon", name: "Maxon Postpaid 109", price: 109, priceNote: "Promo: save RM10/month for 6 months", dataGB: "unlimited", dataNote: "Unlimited 5G/4G (fair usage policy applies)", calls: "Unlimited calls & SMS", maxExtraLines: 1, extraLineCost: 48, extraLineNote: "Share Lines RM48/month each; allowance varies by campaign", roaming: "5G roaming passes from RM29/day", perks: ["Unlimited 5G/4G data", "Share Lines available"], source: MAXON_MOBILE }),
  mobile({ id: "maxon-pp139", provider: "maxon", name: "Maxon Postpaid 139", price: 139, priceNote: "Promo: save RM10/month for 6 months", dataGB: "unlimited", dataNote: "Unlimited 5G/4G (fair usage policy applies)", calls: "Unlimited calls & SMS", maxExtraLines: 2, extraLineCost: 48, extraLineNote: "Share Lines RM48/month each; allowance varies by campaign", roaming: "5G roaming passes from RM29/day", perks: ["Unlimited 5G/4G data", "Free streaming subscription (limited time)"], source: MAXON_MOBILE }),
  mobile({ id: "maxon-pp169", provider: "maxon", name: "Maxon Postpaid 169", price: 169, priceNote: "Promo: save RM10/month for 6 months", dataGB: "unlimited", dataNote: "Unlimited 5G/4G (fair usage policy applies)", calls: "Unlimited calls & SMS", maxExtraLines: 3, extraLineCost: 48, extraLineNote: "Share Lines RM48/month each; allowance varies by campaign", roaming: "5G roaming passes from RM29/day", perks: ["Unlimited 5G/4G data", "Better device deals"], source: MAXON_MOBILE }),
  mobile({ id: "maxon-pp199", provider: "maxon", name: "Maxon Postpaid 199", price: 199, dataGB: "unlimited", dataNote: "Unlimited 5G/4G (fair usage policy applies)", calls: "Unlimited calls & SMS", maxExtraLines: 4, extraLineCost: 48, extraLineNote: "Share Lines RM48/month each; allowance varies by campaign", roaming: "5G roaming passes from RM29/day", perks: ["Unlimited 5G/4G data", "Most Share Lines"], source: MAXON_MOBILE }),

  // ───────── TelcomDigi Postpaid 5G ─────────
  mobile({ id: "td-pp80", provider: "telcomdigi", name: "TelcomDigi Postpaid 5G 80", price: 80, dataGB: 600, dataNote: "600GB 5G/4G (as listed on the provider's site)", calls: "Unlimited calls", maxExtraLines: 3, extraLineCost: 45, extraLineNote: "Supplementary line price estimated", perks: ["RM120 port-in rebate"], source: TELCOMDIGI }),
  mobile({ id: "td-pp120", provider: "telcomdigi", name: "TelcomDigi Postpaid 5G 120", price: 120, dataGB: "unlimited", dataNote: "Unlimited 5G/4G", calls: "Unlimited calls", maxExtraLines: 6, extraLineCost: 40.5, extraLineNote: "Up to 6 supplementary lines at 10% off", perks: ["RM120 port-in rebate"], source: TELCOMDIGI }),
  mobile({ id: "td-pp140", provider: "telcomdigi", name: "TelcomDigi Postpaid 5G 140", price: 140, dataGB: "unlimited", dataNote: "Unlimited 5G/4G", calls: "Unlimited calls", maxExtraLines: 6, extraLineCost: 22.5, extraLineNote: "Up to 6 supplementary lines at 50% off (from RM22.50)", perks: ["50% off supplementary lines", "RM120 port-in rebate"], source: TELCOMDIGI }),
  mobile({ id: "td-pp190", provider: "telcomdigi", name: "TelcomDigi Postpaid 5G 190", price: 190, dataGB: "unlimited", dataNote: "Unlimited 5G/4G at uncapped speed", calls: "Unlimited calls", maxExtraLines: 6, extraLineCost: 22.5, extraLineNote: "Up to 6 supplementary lines at 50% off (from RM22.50)", roaming: "30GB roaming in Singapore, Indonesia & Thailand; 50% off roaming passes", perks: ["Streaming subscriptions included", "Web protection", "Roaming data included"], source: TELCOMDIGI }),

  // ───────── V Mobile ULTRA ─────────
  mobile({ id: "vm-pp45", provider: "vmobile", name: "V Mobile 45", price: 45, priceNote: "Promo: RM35/month via rebate (limited time)", dataGB: 500, dataNote: "500GB 5G/4G, then 512kbps — no extra charges", hotspot: "Hotspot shares your main data", calls: "Unlimited local calls", maxExtraLines: 0, contractNote: "90-day minimum before downgrading", perks: ["1× V5G Priority Pass monthly"], source: VM_MOBILE }),
  mobile({ id: "vm-pp68", provider: "vmobile", name: "V Mobile 68", price: 68, priceNote: "Promo: RM58/month via rebate (limited time)", dataGB: 1000, dataNote: "1,000GB 5G/4G, then 512kbps — no extra charges", hotspot: "Hotspot shares your main data", calls: "Unlimited local calls", maxExtraLines: 2, extraLineCost: 38, extraLineNote: "Up to 2 supplementary lines at RM38 each", roaming: "15GB free roaming in Singapore, Indonesia & Thailand", contractNote: "90-day minimum before downgrading", perks: ["Free roaming data (SG/ID/TH)", "2× V5G Priority Passes"], source: VM_MOBILE }),
  mobile({ id: "vm-global98", provider: "vmobile", name: "V Mobile Global 98", price: 98, priceNote: "Promo: RM88/month via rebate (limited time)", dataGB: 1000, dataNote: "1,000GB 5G/4G, then 512kbps — no extra charges", hotspot: "Hotspot shares your main data", calls: "Unlimited local calls", maxExtraLines: 6, extraLineCost: 38, extraLineNote: "Up to 6 supplementary lines at RM38 each", roaming: "15GB free roaming in 60+ destinations", contractNote: "90-day minimum before downgrading", perks: ["Global roaming data included", "3× V5G Priority Passes"], source: VM_MOBILE }),
  mobile({ id: "vm-family128", provider: "vmobile", name: "V Mobile Family 128", price: 128, priceNote: "Promo: RM118/month via rebate (limited time)", dataGB: 1000, dataNote: "1,000GB shared across 4 lines", hotspot: "Hotspot shares your main data", calls: "Unlimited local calls", includedLines: 4, maxExtraLines: 0, roaming: "15GB global roaming, shareable across all lines", contractNote: "90-day minimum before downgrading", perks: ["4 lines included", "Shared global roaming"], source: VM_MOBILE }),

  // ───────── Unifly Mobile ─────────
  mobile({ id: "unifly-pp39", provider: "unifly", name: "Unifly 5G Postpaid 39", price: 39, dataGB: 30, dataNote: "30GB 5G/4G (RM1 add-on promo adds 200GB 5G)", hotspot: "Hotspot within your quota", calls: "Unlimited calls", maxExtraLines: 0, perks: ["No contract"], source: UNIFLY, status: "listing" }),
  mobile({ id: "unifly-pp69", provider: "unifly", name: "Unifly 5G Postpaid 69", price: 69, dataGB: "unlimited", dataNote: "Unlimited 5G (promo upgrade from 60GB)", hotspot: "Hotspot up to 60GB", calls: "Unlimited calls", maxExtraLines: 0, perks: ["No contract"], source: UNIFLY, status: "listing" }),
  mobile({ id: "unifly-pp99", provider: "unifly", name: "Unifly 5G Postpaid 99", price: 99, dataGB: "unlimited", dataNote: "Unlimited 5G/4G (promo upgrade from 100GB)", hotspot: "Hotspot up to 100GB", calls: "Unlimited calls", maxExtraLines: 0, perks: ["No contract"], source: UNIFLY, status: "listing" }),
  mobile({ id: "unifly-fam129", provider: "unifly", name: "Unifly 5G Postpaid Family 129", price: 129, dataGB: "unlimited", dataNote: "Unlimited 5G/4G", hotspot: "150GB principal, 30GB per family line", calls: "Unlimited calls", includedLines: 2, maxExtraLines: 0, perks: ["2 lines included", "No contract"], source: UNIFLY, status: "listing" }),
  mobile({ id: "unifly-fam159", provider: "unifly", name: "Unifly 5G Postpaid Family 159", price: 159, dataGB: "unlimited", dataNote: "Unlimited 5G/4G", hotspot: "200GB principal, 30GB per family line", calls: "Unlimited calls", includedLines: 3, maxExtraLines: 0, perks: ["3 lines included", "No contract"], source: UNIFLY, status: "listing" }),
  mobile({ id: "unifly-fam189", provider: "unifly", name: "Unifly 5G Postpaid Family 189", price: 189, dataGB: "unlimited", dataNote: "Unlimited 5G/4G", calls: "Unlimited calls", includedLines: 4, maxExtraLines: 0, perks: ["4 lines included", "No contract"], source: UNIFLY, status: "listing" }),
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
