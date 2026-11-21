import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Trophy } from "lucide-react";
import { Spot } from "@/components/stickers/Spot";
import { EmptyState, ProviderBadge, btn, btnSm, cn } from "@/components/ui";
import { PLANS_REVIEWED, contractLabel, dataLabel, getPlan, type Plan } from "@/lib/plans";
import { rmShort, speedLabel, withSST } from "@/lib/format";

export const metadata: Metadata = { title: "Compare plans" };

type Row = { label: string; value: (p: Plan) => string; best?: (plans: Plan[]) => string | undefined };

const lowest = (f: (p: Plan) => number) => (plans: Plan[]) => {
  const min = Math.min(...plans.map(f));
  const winners = plans.filter((p) => f(p) === min);
  return winners.length === plans.length ? undefined : winners[0]?.id;
};
const highest = (f: (p: Plan) => number) => (plans: Plan[]) => {
  const max = Math.max(...plans.map(f));
  const winners = plans.filter((p) => f(p) === max);
  return winners.length === plans.length || max <= 0 ? undefined : winners[0]?.id;
};
const dataNum = (p: Plan) => (p.dataGB === "unlimited" ? 99999 : typeof p.dataGB === "number" ? p.dataGB : 0);

export default async function ComparePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const ids = (typeof sp.ids === "string" ? sp.ids : "").split(",").filter(Boolean).slice(0, 4);
  const plans = ids.map(getPlan).filter((p): p is Plan => Boolean(p));
  const mixed = new Set(plans.map((p) => p.kind)).size > 1;

  const rows: Row[] = [
    { label: "Monthly price", value: (p) => `${rmShort(p.price)}`, best: lowest((p) => p.price) },
    { label: "With 6% SST", value: (p) => rmShort(withSST(p.price)) },
    { label: "Normal price", value: (p) => (p.listPrice ? rmShort(p.listPrice) : "Same") },
    { label: "Price notes", value: (p) => p.priceNote ?? "—" },
    { label: "Bundle price", value: (p) => (p.bundlePrice ? `${rmShort(p.bundlePrice)} — ${p.bundleNote}` : "—") },
    ...(plans.some((p) => p.kind === "fibre")
      ? [
          { label: "Download speed", value: (p: Plan) => (p.down ? speedLabel(p.down) : "—"), best: highest((p) => p.down ?? 0) },
          { label: "Upload speed", value: (p: Plan) => (p.up ? speedLabel(p.up) : p.kind === "fibre" ? "Not stated" : "—"), best: highest((p) => p.up ?? 0) },
          { label: "Router", value: (p: Plan) => p.router ?? "—" },
        ]
      : []),
    ...(plans.some((p) => p.kind === "mobile")
      ? [
          { label: "Data", value: (p: Plan) => (p.kind === "mobile" ? `${dataLabel(p)}${p.dataNote ? ` — ${p.dataNote}` : ""}` : "—"), best: highest(dataNum) },
          { label: "Hotspot", value: (p: Plan) => p.hotspot ?? "—" },
          { label: "Calls", value: (p: Plan) => p.calls ?? "—" },
          { label: "Lines", value: (p: Plan) => (p.includedLines && p.includedLines > 1 ? `${p.includedLines} included` : p.maxExtraLines ? `1 + up to ${p.maxExtraLines} extra${p.extraLineCost ? ` (${rmShort(p.extraLineCost)} each)` : ""}` : "1") },
          { label: "Roaming", value: (p: Plan) => p.roaming ?? "Pay per use / passes" },
        ]
      : []),
    { label: "Contract", value: (p) => `${contractLabel(p)}${p.contractNote ? ` — ${p.contractNote}` : ""}` },
    { label: "Perks", value: (p) => p.perks.join(" · ") || "—" },
    { label: "24-month cost (incl. SST)", value: (p) => rmShort(Math.round(withSST(p.price) * 24)), best: lowest((p) => p.price) },
    { label: "Source", value: (p) => (p.status === "official" ? "Provider's own plan page" : "Dealer / press listing pending re-check") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/plans" className={cn(btn.ghost, btnSm)}><ArrowLeft className="h-4 w-4" /> Back to Plan Finder</Link>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">Side-by-side comparison</h1>
      <p className="mt-2 text-muted">Prices are monthly before 6% SST unless shown. Reviewed {PLANS_REVIEWED} — confirm on the provider&apos;s site before signing up.</p>
      {mixed && <p className="mt-3 rounded-2xl bg-kunyit-soft px-4 py-3 text-[0.95rem]">You&apos;re comparing a home fibre plan with a mobile plan — some rows won&apos;t apply to both.</p>}

      {plans.length === 0 ? (
        <div className="mt-8"><EmptyState art={<Spot name="coins" />} title="Nothing to compare yet" text="Choose up to 3 plans in Plan Finder and tap “Compare now”." action={<Link href="/plans?tab=browse" className={btn.primary}>Browse plans</Link>} /></div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-3xl border border-line bg-white shadow-card">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">Plan comparison</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="sticky left-0 z-10 w-44 bg-white p-4 text-sm font-semibold text-muted">Plan</th>
                {plans.map((p) => (
                  <th key={p.id} scope="col" className="p-4 align-top">
                    <ProviderBadge id={p.provider} size="sm" />
                    <p className="mt-2 font-display text-lg font-bold leading-tight">{p.name}</p>
                    <a href={p.source} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-pandan-dark hover:underline">Provider source <ExternalLink className="h-3.5 w-3.5" /></a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const winner = r.best?.(plans);
                return (
                  <tr key={r.label} className="border-b border-line last:border-0">
                    <th scope="row" className="sticky left-0 z-10 bg-white p-4 text-sm font-semibold text-muted">{r.label}</th>
                    {plans.map((p) => (
                      <td key={p.id} className={cn("p-4 align-top text-[0.95rem]", winner === p.id && "bg-pandan-soft/60 font-semibold")}>
                        <span className="inline-flex items-start gap-1.5">
                          {winner === p.id && <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-pandan-dark" aria-label="Best" />}
                          {r.value(p)}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/coverage" className={btn.secondary}>Check coverage at my address</Link>
        <Link href="/plans" className={btn.ghost}>Get personalised recommendations</Link>
      </div>
    </div>
  );
}
