import { isProviderId, type ProviderId } from "@/lib/providers";
import { recommend, type Activity, type Prefs } from "@/lib/recommend";
import { num, readJson } from "@/lib/server";

export const dynamic = "force-dynamic";

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const providers = (v: unknown): ProviderId[] => (Array.isArray(v) ? v.filter(isProviderId) : []);
const pick = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
  options.includes(v as T) ? (v as T) : fallback;

export async function POST(req: Request) {
  const body = await readJson(req);
  let prefs: Prefs;
  if (body.kind === "mobile") {
    prefs = {
      kind: "mobile",
      budget: clamp(num(body.budget) ?? 80, 20, 600),
      usage: pick(body.usage, ["light", "moderate", "heavy", "max"] as const, "moderate"),
      lines: clamp(Math.round(num(body.lines) ?? 1), 1, 6),
      hotspot: Boolean(body.hotspot),
      roaming: pick(body.roaming, ["never", "sometimes", "often"] as const, "sometimes"),
      goodSignal: providers(body.goodSignal),
    };
  } else {
    const allowed: Activity[] = ["streaming", "gaming", "wfh", "uploads", "smarthome"];
    prefs = {
      kind: "fibre",
      budget: clamp(num(body.budget) ?? 150, 40, 800),
      people: clamp(Math.round(num(body.people) ?? 2), 1, 12),
      activities: Array.isArray(body.activities) ? body.activities.filter((a): a is Activity => allowed.includes(a as Activity)) : [],
      homeSize: pick(body.homeSize, ["small", "medium", "large"] as const, "medium"),
      flexible: Boolean(body.flexible),
      postpaidWith: isProviderId(body.postpaidWith) ? body.postpaidWith : "",
      available: providers(body.available),
    };
  }
  return Response.json(recommend(prefs));
}
