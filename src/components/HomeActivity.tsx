"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, LifeBuoy, MapPin, ScanText } from "lucide-react";
import { api } from "@/lib/client";
import { rm, relativeTime } from "@/lib/format";
import { STATUS_INFO, type CaseStatus } from "@/lib/cases";
import { Badge, ProviderBadge } from "./ui";

interface HistoryItem { id: string; title: string; provider: string | null; total: number; score: number; createdAt: string }
interface CaseItem { id: string; title: string; provider: string; status: string; updatedAt: string; amount: number | null }
interface CoverageItem { id: string; label: string; postcode: string; state: string | null; statuses: Record<string, string> }

export function HomeActivity() {
  const [data, setData] = useState<{ history: HistoryItem[]; cases: CaseItem[]; coverage: CoverageItem[] } | null>(null);

  useEffect(() => {
    Promise.all([
      api<{ items: HistoryItem[] }>("/api/decoder").catch(() => ({ items: [] as HistoryItem[] })),
      api<{ items: CaseItem[] }>("/api/cases").catch(() => ({ items: [] as CaseItem[] })),
      api<{ items: CoverageItem[] }>("/api/coverage").catch(() => ({ items: [] as CoverageItem[] })),
    ]).then(([h, c, v]) => setData({ history: h.items.slice(0, 3), cases: c.items.filter((x) => x.status !== "closed").slice(0, 3), coverage: v.items.slice(0, 2) }));
  }, []);

  if (!data || (!data.history.length && !data.cases.length && !data.coverage.length)) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10" aria-labelledby="resume-title">
      <div className="rounded-3xl border border-line bg-white p-5 shadow-card md:p-7">
        <h2 id="resume-title" className="font-display text-2xl font-bold tracking-tight">Pick up where you left off</h2>
        <p className="text-muted">Saved on this browser — no account needed.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted"><ScanText className="h-4 w-4" /> Decoded bills</p>
            <ul className="space-y-2">
              {data.history.length ? data.history.map((h) => (
                <li key={h.id}>
                  <Link href={`/decoder/${h.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-line px-3 py-2.5 hover:border-ink/30">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{h.title}</span>
                      <span className="text-sm text-muted">{rm(h.total)} · {relativeTime(h.createdAt)}</span>
                    </span>
                    <Badge tone={h.score >= 85 ? "green" : h.score >= 60 ? "yellow" : "red"}>{h.score}</Badge>
                  </Link>
                </li>
              )) : <li className="text-sm text-muted">None yet.</li>}
            </ul>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted"><LifeBuoy className="h-4 w-4" /> Billing cases</p>
            <ul className="space-y-2">
              {data.cases.length ? data.cases.map((c) => (
                <li key={c.id}>
                  <Link href={`/help/${c.id}`} className="block rounded-2xl border border-line px-3 py-2.5 hover:border-ink/30">
                    <span className="flex items-center gap-2"><ProviderBadge id={c.provider} size="sm" /><Badge tone={STATUS_INFO[c.status as CaseStatus]?.tone ?? "neutral"}>{STATUS_INFO[c.status as CaseStatus]?.label ?? c.status}</Badge></span>
                    <span className="mt-1 block truncate font-semibold">{c.title}</span>
                  </Link>
                </li>
              )) : <li className="text-sm text-muted">No open cases.</li>}
            </ul>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted"><MapPin className="h-4 w-4" /> Coverage checks</p>
            <ul className="space-y-2">
              {data.coverage.length ? data.coverage.map((v) => {
                const done = Object.values(v.statuses).filter((s) => s !== "unchecked").length;
                const yes = Object.values(v.statuses).filter((s) => s === "available").length;
                return (
                  <li key={v.id}>
                    <Link href={`/coverage?check=${v.id}`} className="block rounded-2xl border border-line px-3 py-2.5 hover:border-ink/30">
                      <span className="block font-semibold">{v.label} · {v.postcode}</span>
                      <span className="text-sm text-muted">{done}/6 checked · {yes} available</span>
                    </Link>
                  </li>
                );
              }) : <li className="text-sm text-muted">None yet.</li>}
            </ul>
          </div>
        </div>
        <Link href="/help" className="mt-5 inline-flex items-center gap-1 font-semibold text-pandan-dark hover:underline">Go to my cases <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </section>
  );
}
