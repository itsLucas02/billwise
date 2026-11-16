"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, ChevronRight, MapPin } from "lucide-react";
import { api } from "@/lib/client";
import { rm, relativeTime } from "@/lib/format";
import { STATUS_INFO, type CaseStatus } from "@/lib/cases";
import { ProviderBadge, cn } from "./ui";
import { Sticker } from "./stickers/Sticker";
import { bills, coveragePin, enquiry } from "./stickers/icons";
import type { Icon, Palette } from "./stickers/fun";

interface HistoryItem { id: string; title: string; provider: string | null; total: number; score: number; createdAt: string }
interface CaseItem { id: string; title: string; provider: string; status: string; updatedAt: string; amount: number | null }
interface CoverageItem { id: string; label: string; postcode: string; state: string | null; statuses: Record<string, string> }
interface Activity { history: HistoryItem[]; cases: CaseItem[]; coverage: CoverageItem[] }

// each pocket has one house colour: its ground, its sticker and its count
const POCKETS = {
  bills: { ground: "bg-kunyit-soft", ring: "ring-kunyit/30", palette: { main: "#ffc23d", deep: "#0f1b2d" } },
  cases: { ground: "bg-sky-soft", ring: "ring-sky/20", palette: { main: "#2f6fe4", deep: "#0f1b2d", hot: "#e0442a" } },
  coverage: { ground: "bg-pandan-soft", ring: "ring-pandan/20", palette: { main: "#0b8f63" } },
} satisfies Record<string, { ground: string; ring: string; palette: Partial<Palette> }>;

// the case's path, in order; escalation is a step on it, not a detour
const CASE_STEPS: CaseStatus[] = ["open", "contacted", "awaiting", "escalated", "resolved"];

export function HomeActivity() {
  const [data, setData] = useState<Activity | null>(null);

  useEffect(() => {
    Promise.all([
      api<{ items: HistoryItem[] }>("/api/decoder").catch(() => ({ items: [] as HistoryItem[] })),
      api<{ items: CaseItem[] }>("/api/cases").catch(() => ({ items: [] as CaseItem[] })),
      api<{ items: CoverageItem[] }>("/api/coverage").catch(() => ({ items: [] as CoverageItem[] })),
    ]).then(([h, c, v]) => setData({ history: h.items, cases: c.items.filter((x) => x.status !== "closed"), coverage: v.items }));
  }, []);

  if (!data || (!data.history.length && !data.cases.length && !data.coverage.length)) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10" aria-labelledby="resume-title">
      <div className="rounded-[32px] border border-line bg-white p-4 shadow-card md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 px-1 pb-4 md:px-2">
          <div>
            <h2 id="resume-title" className="font-display text-2xl font-bold tracking-tight md:text-[1.75rem] md:leading-tight">Pick up where you left off</h2>
            <p className="text-muted">Saved on this browser — no account needed.</p>
          </div>
          <Link href="/help" className="group inline-flex items-center gap-1 font-semibold text-pandan-dark">
            Go to my cases <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Pocket kind="bills" icon={bills} enter={0.1} title="Decoded bills" count={data.history.length} unit={["bill", "bills"]}
            empty={{ text: "Upload a bill and see every charge explained.", href: "/decoder", cta: "Decode a bill" }}>
            {data.history.slice(0, 3).map((h) => (
              <Row key={h.id} href={`/decoder/${h.id}`} lead={<ScoreRing score={h.score} />}
                title={h.title} meta={`${rm(h.total)} · ${relativeTime(h.createdAt)}`} />
            ))}
          </Pocket>

          <Pocket kind="cases" icon={enquiry} enter={0.25} title="Billing cases" count={data.cases.length} unit={["open case", "open cases"]}
            empty={{ text: "Dispute a charge with a ready-to-send enquiry.", href: "/help/new", cta: "Start a case" }}>
            {data.cases.slice(0, 3).map((c) => (
              <Row key={c.id} href={`/help/${c.id}`} lead={<ProviderBadge id={c.provider} size="sm" />}
                title={c.title} meta={<CaseProgress status={c.status} />} stacked />
            ))}
          </Pocket>

          <Pocket kind="coverage" icon={coveragePin} enter={0.4} title="Coverage checks" count={data.coverage.length} unit={["address", "addresses"]}
            empty={{ text: "See which providers reach your address.", href: "/coverage", cta: "Check an address" }}>
            {data.coverage.slice(0, 3).map((v) => (
              <Row key={v.id} href={`/coverage?check=${v.id}`} lead={<PinDot />}
                title={`${v.label} · ${v.postcode}`} meta={<CoverageDots statuses={v.statuses} />} />
            ))}
          </Pocket>
        </div>
      </div>
    </section>
  );
}

function Pocket({ kind, icon, enter, title, count, unit, empty, children }: {
  kind: keyof typeof POCKETS; icon: Icon; enter: number; title: string; count: number; unit: [string, string];
  empty: { text: string; href: string; cta: string }; children: ReactNode;
}) {
  const look = POCKETS[kind];
  return (
    <div className={cn("relative flex flex-col rounded-[24px] p-3 ring-1 ring-inset", look.ground, look.ring)}>
      <div className="flex items-start justify-between gap-2 pl-2 pt-1">
        <div className="pt-1">
          <h3 className="text-[0.8rem] font-bold uppercase tracking-[0.08em] text-ink-soft">{title}</h3>
          <p className="mt-0.5 flex items-baseline gap-1.5">
            <span className="font-display text-[2.5rem] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">{count}</span>
            <span className="text-sm text-muted">{count === 1 ? unit[0] : unit[1]}</span>
          </p>
        </div>
        {/* decorative: the heading already names the pocket */}
        <div aria-hidden className="-mr-1 -mt-5 w-28 shrink-0">
          <Sticker icon={icon} palette={look.palette} loop={false} enter={enter} replayOnHover label="" />
        </div>
      </div>
      {count ? (
        <ul className="mt-2 space-y-1.5">{children}</ul>
      ) : (
        <div className="mt-2 flex flex-col gap-3 rounded-2xl bg-white/60 p-3">
          <p className="text-sm text-ink-soft">{empty.text}</p>
          <Link href={empty.href} className="group inline-flex items-center gap-1 text-sm font-semibold text-ink">
            {empty.cta} <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

function Row({ href, lead, title, meta, stacked }: { href: string; lead: ReactNode; title: string; meta: ReactNode; stacked?: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-[0_1px_0_rgba(15,27,45,0.06)] transition-[transform,box-shadow] duration-150 ease-out hover:shadow-card active:scale-[0.98] active:duration-75"
      >
        {!stacked && <span className="shrink-0">{lead}</span>}
        <span className="min-w-0 flex-1">
          {stacked && <span className="mb-1 block">{lead}</span>}
          <span className="block truncate font-semibold text-ink">{title}</span>
          <span className="block text-sm text-muted">{meta}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
      </Link>
    </li>
  );
}

// the bill health score as a small gauge, coloured like the decoder's
function ScoreRing({ score }: { score: number }) {
  const r = 15, c = 2 * Math.PI * r;
  const colour = score >= 85 ? "#0b8f63" : score >= 60 ? "#e0a100" : "#e0442a";
  return (
    <span className="relative grid h-10 w-10 place-items-center" role="img" aria-label={`Bill health ${score} out of 100`}>
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r={r} fill="none" stroke="#efe7d8" strokeWidth="3.5" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={colour} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(c * score) / 100} ${c}`} />
      </svg>
      <span className="text-[0.8rem] font-bold tabular-nums text-ink">{score}</span>
    </span>
  );
}

function CaseProgress({ status }: { status: string }) {
  const info = STATUS_INFO[status as CaseStatus];
  const at = CASE_STEPS.indexOf(status as CaseStatus);
  return (
    <span className="flex items-center gap-2">
      <span className="flex gap-0.5" aria-hidden>
        {CASE_STEPS.map((s, i) => (
          <span key={s} className={cn("h-1.5 w-4 rounded-full", i <= at ? (status === "escalated" ? "bg-sambal" : status === "resolved" ? "bg-pandan" : "bg-sky") : "bg-line")} />
        ))}
      </span>
      <span>{info?.label ?? status}</span>
    </span>
  );
}

function PinDot() {
  return <span className="grid h-10 w-10 place-items-center rounded-full bg-pandan-soft text-pandan-dark" aria-hidden><MapPin className="h-[1.1rem] w-[1.1rem]" /></span>;
}

// one dot per provider: green covered, amber waitlist, red not covered, outline not checked yet
function CoverageDots({ statuses }: { statuses: Record<string, string> }) {
  const all = Object.values(statuses);
  const yes = all.filter((s) => s === "available").length;
  const done = all.filter((s) => s !== "unchecked").length;
  return (
    <span className="flex items-center gap-2">
      <span className="flex gap-1" aria-hidden>
        {all.map((s, i) => (
          <span key={i} className={cn("h-2 w-2 rounded-full", s === "available" ? "bg-pandan" : s === "waitlist" ? "bg-kunyit" : s === "unavailable" ? "bg-sambal" : "border border-muted/40")} />
        ))}
      </span>
      <span>{yes} available · {done}/{all.length} checked</span>
    </span>
  );
}
