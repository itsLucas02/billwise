import type { ProviderId } from "./providers";

export type CoverageStatus = "unchecked" | "available" | "unavailable" | "waitlist";
export type PropertyType = "highrise" | "landed" | "shop";

export const STATUS_LABEL: Record<CoverageStatus, string> = {
  unchecked: "Not checked",
  available: "Available",
  unavailable: "Not available",
  waitlist: "Waitlist / soon",
};

export const PROPERTY_LABEL: Record<PropertyType, string> = {
  highrise: "Condo / apartment",
  landed: "Landed house",
  shop: "Shop lot / office",
};

/** Approximate Malaysian postcode ranges → state. Boundaries are simplified. */
const RANGES: [number, number, string][] = [
  [1000, 2999, "Perlis"],
  [5000, 9999, "Kedah"],
  [10000, 14999, "Pulau Pinang"],
  [15000, 18999, "Kelantan"],
  [20000, 24999, "Terengganu"],
  [25000, 28999, "Pahang"],
  [30000, 36999, "Perak"],
  [39000, 39999, "Pahang"],
  [40000, 48999, "Selangor"],
  [49000, 49999, "Pahang"],
  [50000, 60999, "Kuala Lumpur"],
  [62000, 62999, "Putrajaya"],
  [63000, 64999, "Selangor"],
  [68000, 68199, "Selangor"],
  [69000, 69999, "Pahang"],
  [70000, 73999, "Negeri Sembilan"],
  [75000, 78999, "Melaka"],
  [79000, 86999, "Johor"],
  [87000, 87999, "Labuan"],
  [88000, 91999, "Sabah"],
  [93000, 98999, "Sarawak"],
];

export function stateFromPostcode(postcode: string): string | null {
  if (!/^\d{5}$/.test(postcode)) return null;
  const n = parseInt(postcode, 10);
  return RANGES.find(([lo, hi]) => n >= lo && n <= hi)?.[2] ?? null;
}

export function isEastMalaysia(state: string | null | undefined): boolean {
  return state === "Sabah" || state === "Sarawak" || state === "Labuan";
}

export function areaNotes(state: string | null, property: PropertyType): string[] {
  const notes: string[] = [];
  if (property === "highrise") {
    notes.push("Many condos and apartments are pre-wired by one or more fibre networks. Ask your management office which providers are installed in the building — it's the quickest way to know your options.");
  } else if (property === "landed") {
    notes.push("Landed homes are connected street by street. Neighbours on the same road and the official checkers are your best guide.");
  } else {
    notes.push("Business premises may be served by business fibre plans with different prices. Home plans here are for residential addresses.");
  }
  if (isEastMalaysia(state)) {
    notes.push("In Sabah, Sarawak and Labuan, fibre is concentrated in major towns. If fibre isn't available, 5G/4G home broadband or a mobile plan with hotspot can be the practical option.");
  } else if (state === "Kuala Lumpur" || state === "Selangor" || state === "Putrajaya" || state === "Pulau Pinang") {
    notes.push("Dense urban areas usually have more than one fibre network — it's worth checking every provider, not just the biggest.");
  }
  return notes;
}

export function emptyStatuses(): Record<ProviderId, CoverageStatus> {
  return { unifly: "unchecked", maxon: "unchecked", telcomdigi: "unchecked", tide: "unchecked", helo: "unchecked", vmobile: "unchecked" };
}

/* ───────── signal & speed helpers (interpret the user's own readings) ───────── */

export interface Rating {
  level: "excellent" | "good" | "fair" | "poor" | "very poor";
  bars: number;
  title: string;
  text: string;
}

export function rateRSRP(dbm: number): Rating {
  if (dbm >= -80) return { level: "excellent", bars: 5, title: "Excellent signal", text: "Strong 4G/5G signal. Calls and data should work smoothly here." };
  if (dbm >= -90) return { level: "good", bars: 4, title: "Good signal", text: "Reliable for calls, streaming and video calls." };
  if (dbm >= -100) return { level: "fair", bars: 3, title: "Fair signal", text: "Usable, but speeds can drop at busy times or deeper indoors." };
  if (dbm >= -110) return { level: "poor", bars: 2, title: "Weak signal", text: "Expect slow data and occasional dropped calls. Try near a window, or turn on Wi-Fi calling at home." };
  return { level: "very poor", bars: 1, title: "Very weak signal", text: "Service will be unreliable here. Compare other providers' coverage before committing to a plan." };
}

export function rateSINR(db: number): string {
  if (db >= 20) return "Very clean signal (little interference).";
  if (db >= 13) return "Clean signal — good for fast data.";
  if (db >= 0) return "Some interference — speeds may vary.";
  return "Heavy interference — speeds will suffer even with good strength.";
}

export function rateSpeed(planMbps: number, measured: number, method: "cable" | "wifi-near" | "wifi-far") {
  const pct = planMbps > 0 ? Math.round((measured / planMbps) * 100) : 0;
  const tips: string[] = [];
  if (method !== "cable") tips.push("Wi-Fi is often the bottleneck. For a fair test, plug a laptop into the router with a LAN cable.");
  if (method === "wifi-far") tips.push("Walls and floors weaken Wi-Fi a lot. A mesh node or moving the router to a central spot helps.");
  if (planMbps >= 500) tips.push("Older phones and laptops may not reach 500Mbps+ over Wi-Fi even when the line is fine.");
  tips.push("Test 3 times at different hours (including evening peak) and save screenshots.");
  let verdict: "great" | "ok" | "low";
  let text: string;
  if (pct >= 80) {
    verdict = "great";
    text = "You're getting what you pay for.";
  } else if (pct >= 50) {
    verdict = "ok";
    text = method === "cable" ? "Below your plan speed. Retest at different times; if it persists, report it." : "Probably your Wi-Fi rather than the line. Try the tips below before contacting your provider.";
  } else {
    verdict = "low";
    text = method === "cable" ? "Well below your plan speed on a cable test — worth reporting to your provider." : "Much slower than your plan. Do a cable test; if it's still under half your plan speed, raise it with your provider.";
  }
  return { pct, verdict, text, tips };
}
