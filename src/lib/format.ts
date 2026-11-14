/** Malaysian service tax rate for telecommunication services (unchanged at 6%). */
export const SST_RATE = 0.06;

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function withSST(n: number): number {
  return round2(n * (1 + SST_RATE));
}

export function rm(n: number | null | undefined, opts: { sign?: boolean; decimals?: number } = {}): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const decimals = opts.decimals ?? 2;
  const abs = Math.abs(n).toLocaleString("en-MY", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const sign = n < -0.004 ? "−" : opts.sign && n > 0.004 ? "+" : "";
  return `${sign}RM${abs}`;
}

/** Whole ringgit when possible: RM129, RM99.50 */
export function rmShort(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return rm(n, { decimals: Number.isInteger(round2(n)) ? 0 : 2 });
}

export function speedLabel(mbps: number): string {
  return mbps >= 1000 ? `${mbps / 1000}Gbps` : `${mbps}Mbps`;
}

export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

export function daysSince(value: string | Date | null | undefined): number {
  if (!value) return 0;
  const d = typeof value === "string" ? new Date(value) : value;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
}

export function relativeTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  const days = daysSince(value);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return fmtDate(value);
}

export function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
