"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  ArrowRight, ChevronDown, CircleAlert, CircleCheck, Info, LifeBuoy, Lightbulb, PiggyBank, Printer, ScanText, Sparkles, TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_INFO, type Analysis, type Finding, type Severity } from "@/lib/decoder";
import { getPlan } from "@/lib/plans";
import { PROVIDERS, primaryContact } from "@/lib/providers";
import { fmtDate, rm, rmShort } from "@/lib/format";
import { Badge, Card, ProviderBadge, Stat, btn, btnSm, cn } from "./ui";

const SEV: Record<Severity, { label: string; icon: LucideIcon; box: string; dot: string }> = {
  high: { label: "Act on this", icon: TriangleAlert, box: "border-sambal/30 bg-sambal-soft/60", dot: "bg-sambal text-white" },
  medium: { label: "Worth checking", icon: CircleAlert, box: "border-kunyit/60 bg-kunyit-soft/60", dot: "bg-kunyit text-ink" },
  low: { label: "Good to know", icon: Info, box: "border-line bg-white", dot: "bg-sky-soft text-sky" },
  good: { label: "Looks fine", icon: CircleCheck, box: "border-pandan/25 bg-pandan-soft/60", dot: "bg-pandan text-white" },
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 85 ? "#2fd39a" : score >= 60 ? "#ffc23d" : "#ff6a4d";
  const c = 2 * Math.PI * 42;
  return (
    <div className="relative h-32 w-32 shrink-0" role="img" aria-label={`Bill health score ${score} out of 100`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(251,248,242,0.14)" strokeWidth="10" />
        <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} className="animate-ring" style={{ "--ring-len": (score / 100) * c } as React.CSSProperties} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display text-4xl font-bold leading-none">{score}</p>
          <p className="mt-1 text-xs text-paper/70">out of 100</p>
        </div>
      </div>
    </div>
  );
}

export function AnalysisView({ analysis, id, title, createdAt }: { analysis: Analysis; id?: string; title?: string; createdAt?: string }) {
  const a = analysis;
  const m = a.meta;
  // Printed copies should show every explanation, not collapsed rows.
  useEffect(() => {
    const openAll = () => document.querySelectorAll<HTMLDetailsElement>("details[data-print-open]").forEach((d) => (d.open = true));
    window.addEventListener("beforeprint", openAll);
    return () => window.removeEventListener("beforeprint", openAll);
  }, []);
  const provider = m.provider && m.provider in PROVIDERS ? m.provider : null;
  const contact = provider ? primaryContact(provider) : undefined;

  const disputeHref = (f?: Finding) => {
    const q = new URLSearchParams();
    if (provider) q.set("provider", provider);
    if (f?.issueType) q.set("issue", f.issueType);
    if (f?.amount) q.set("amount", String(f.amount));
    if (f) {
      const labels = [...new Set(a.items.filter((i) => f.itemIds?.includes(i.id)).map((i) => i.label))];
      q.set("label", (labels.length ? labels.join(", ") : f.title).replace(/[“”]/g, "\""));
    }
    const d = (m.period ?? m.billDate)?.match(/\b\d{1,2}[/.-](\d{1,2})[/.-](\d{4})\b/);
    if (d) q.set("month", `${d[2]}-${d[1].padStart(2, "0")}`);
    if (f?.issueType === "promo" && m.promisedPrice) q.set("promised", String(m.promisedPrice));
    if (id) q.set("analysis", id);
    return `/help/new?${q.toString()}`;
  };
  const catTotal = (c: string) => a.breakdown.find((b) => b.category === c)?.total ?? 0;
  const plansHref = () => {
    const q = new URLSearchParams({ kind: m.service === "mobile" ? "mobile" : "fibre" });
    // budget = what the service itself costs (plan + rebates, plus extra lines for mobile) — not devices or TV add-ons
    const budget = Math.round(catTotal("plan") + catTotal("rebate") + (m.service === "mobile" ? catTotal("addon") : 0));
    if (budget > 0) q.set("budget", String(budget));
    if (m.lines && m.lines > 1) q.set("lines", String(m.lines));
    return `/plans?${q.toString()}`;
  };

  const positives = a.breakdown.filter((b) => b.total > 0 && b.category !== "rounding");
  const posTotal = positives.reduce((s, b) => s + b.total, 0) || 1;
  const credits = a.breakdown.filter((b) => b.total < 0);
  const issues = a.findings.filter((f) => f.severity !== "good");
  const goods = a.findings.filter((f) => f.severity === "good");
  const matched = m.matchedPlanId ? getPlan(m.matchedPlanId) : undefined;

  return (
    <div className="animate-rise space-y-6" aria-live="polite">
      {/* Hero summary */}
      <section className="relative overflow-hidden rounded-3xl bg-ink p-6 text-paper shadow-lift md:p-8">
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {provider ? <ProviderBadge id={provider} /> : <Badge>Provider not detected</Badge>}
              {matched && <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">{matched.name}</span>}
              {createdAt && <span className="text-sm text-paper/60">Decoded {fmtDate(createdAt)} · checked by rules, not AI</span>}
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">{title ?? "Your bill, decoded"}</h2>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-paper/75">
              {m.period && <div><dt className="inline">Period: </dt><dd className="inline font-semibold text-paper">{m.period}</dd></div>}
              {m.dueDate && <div><dt className="inline">Due: </dt><dd className="inline font-semibold text-paper">{m.dueDate}</dd></div>}
              {m.account && <div><dt className="inline">Account: </dt><dd className="inline font-semibold text-paper">{m.account}</dd></div>}
            </dl>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-paper/90">{a.summary}</p>
          </div>
          <div className="flex items-center gap-5 rounded-3xl bg-white/5 p-4 md:flex-col md:p-5">
            <ScoreRing score={a.score} />
            <div className="md:text-center">
              <p className="text-sm uppercase tracking-wider text-paper/60">Bill health</p>
              <p className="font-display text-xl font-bold">{a.verdict}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:animate-rise [&>*:nth-child(2)]:[animation-delay:50ms] [&>*:nth-child(3)]:[animation-delay:100ms] [&>*:nth-child(4)]:[animation-delay:150ms]">
        <Stat label="This bill" value={rm(a.totals.total)} hint={m.statedTotal !== undefined ? `Bill states ${rm(m.statedTotal)}` : "Sum of charges"} />
        <Stat label="Regular monthly" value={rm(a.totals.regular)} hint="Plan, add-ons, device, rebates" />
        <Stat label="Usage & one-offs" value={rm(a.totals.variable)} hint="Shouldn't repeat every month" tone={a.totals.variable > 0 ? "red" : "neutral"} />
        <Stat label="Could save" value={a.potentialYearly > 0 ? `${rmShort(Math.round(a.potentialYearly))}/yr` : "—"} hint={a.potentialYearly > 0 ? "If you act on the tips below" : "No obvious savings"} tone={a.potentialYearly > 0 ? "green" : "neutral"} />
      </div>

      {/* Breakdown */}
      <Card>
        <h3 className="font-display text-xl font-bold">Where your money goes</h3>
        <div className="mt-4 flex h-6 w-full origin-left animate-grow overflow-hidden rounded-full bg-cream" role="img" aria-label="Bill breakdown by category">
          {positives.map((b) => (
            <div key={b.category} style={{ width: `${(b.total / posTotal) * 100}%`, backgroundColor: CATEGORY_INFO[b.category].color }} title={`${CATEGORY_INFO[b.category].label}: ${rm(b.total)}`} />
          ))}
        </div>
        <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {[...positives, ...credits].map((b) => (
            <li key={b.category} className="flex items-center gap-2 text-[0.95rem]">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_INFO[b.category].color }} aria-hidden />
              <span className="flex-1">{CATEGORY_INFO[b.category].label}</span>
              <span className={cn("font-mono font-semibold tabular-nums", b.total < 0 && "text-pandan-dark")}>{rm(b.total)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-2xl bg-cream/70 px-4 py-3 text-[0.95rem]">
          <strong>Next month estimate:</strong> about {rm(a.totals.nextBill)} if nothing changes (regular charges + 6% tax, excluding usage and one-offs).
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        {/* Findings */}
        <section aria-labelledby="findings-title">
          <h3 id="findings-title" className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
            <ScanText className="h-5 w-5" /> Things we checked
            {issues.length > 0 && <Badge tone={issues.some((f) => f.severity === "high") ? "red" : "yellow"}>{issues.length} to review</Badge>}
          </h3>
          <ul className="space-y-3">
            {[...issues, ...goods].map((f, i) => {
              const s = SEV[f.severity];
              return (
                <li key={f.id} className={cn("animate-rise rounded-2xl border p-4", s.box)} style={{ animationDelay: `${200 + i * 50}ms` }}>
                  <div className="flex gap-3">
                    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", s.dot)}>
                      <s.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted">{s.label}</p>
                      <p className="mt-0.5 font-display text-lg font-bold leading-snug">{f.title}</p>
                      <p className="mt-1 leading-relaxed text-ink-soft">{f.detail}</p>
                      {(f.action === "dispute" || f.action === "plans") && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {f.action === "dispute" && (
                            <Link href={disputeHref(f)} className={cn(btn.primary, btnSm)}>
                              <LifeBuoy className="h-4 w-4" /> Help me dispute this
                            </Link>
                          )}
                          {f.action === "plans" && (
                            <Link href={plansHref()} className={cn(btn.secondary, btnSm)}>
                              <Sparkles className="h-4 w-4" /> Compare plans
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                    {f.amount ? <span className="shrink-0 font-mono font-bold tabular-nums">{rm(f.amount)}</span> : null}
                  </div>
                </li>
              );
            })}
            {!a.findings.length && <li className="rounded-2xl border border-line bg-white p-4 text-muted">No issues found.</li>}
          </ul>
        </section>

        {/* Savings */}
        <section aria-labelledby="savings-title">
          <h3 id="savings-title" className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
            <PiggyBank className="h-5 w-5" /> Ways to save
          </h3>
          {a.savings.length ? (
            <ul className="space-y-3">
              {a.savings.map((s) => {
                const plan = s.planId ? getPlan(s.planId) : undefined;
                const compareIds = [m.matchedPlanId, s.planId].filter(Boolean).join(",");
                return (
                  <li key={s.id} className="rounded-2xl border border-pandan/20 bg-white p-4 shadow-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {plan && <ProviderBadge id={plan.provider} size="sm" />}
                        <p className="mt-1.5 font-display text-lg font-bold leading-snug">{s.title}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-display text-xl font-bold text-pandan-dark">{rmShort(Math.round(s.oneOff ? s.monthly : s.yearly))}</p>
                        <p className="text-xs font-semibold text-muted">{s.oneOff ? "each time" : s.kind === "avoid" ? "a year (up to)" : "a year"}</p>
                      </div>
                    </div>
                    <p className="mt-1.5 leading-relaxed text-ink-soft">{s.detail}</p>
                    {plan && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href={`/plans/compare?ids=${compareIds}`} className={cn(btn.secondary, btnSm)}>
                          Compare side by side <ArrowRight className="h-4 w-4" />
                        </Link>
                        {s.kind === "switch" && (
                          <Link href={`/coverage`} className={cn(btn.ghost, btnSm)}>Check coverage</Link>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl border border-line bg-white p-5 text-muted">
              <p className="font-semibold text-ink">You&apos;re on a competitive price.</p>
              <p className="mt-1">We didn&apos;t find a cheaper plan with the same speed or data in our catalogue.</p>
              <Link href={plansHref()} className="mt-3 inline-flex items-center gap-1 font-semibold text-pandan-dark hover:underline">Explore plans anyway <ArrowRight className="h-4 w-4" /></Link>
            </div>
          )}
        </section>
      </div>

      {/* Line by line */}
      <Card>
        <h3 className="font-display text-xl font-bold">Line by line, in plain language</h3>
        <p className="text-muted">Tap any charge to see what it means.</p>
        <ul className="mt-4 divide-y divide-line">
          {a.items.map((it) => (
            <li key={it.id}>
              <details data-print-open className="group py-1">
                <summary className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-cream/60">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_INFO[it.category].color }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-snug">{it.label}</span>
                    <span className="text-sm text-muted">{CATEGORY_INFO[it.category].label}</span>
                  </span>
                  {it.flagged && <Badge tone="red">Check</Badge>}
                  <span className={cn("font-mono font-bold tabular-nums", it.amount < 0 && "text-pandan-dark")}>{rm(it.amount)}</span>
                  <ChevronDown className="rotate-on-open h-5 w-5 shrink-0 text-muted transition" aria-hidden />
                </summary>
                <div className="mb-4 ml-7 mt-2 border-l-2 border-line py-1 pl-4 pr-2 leading-relaxed text-ink-soft">
                  <p>{it.explanation}</p>
                  {it.note && <p className="mt-2 font-semibold text-pandan-dark">→ {it.note}</p>}
                </div>
              </details>
            </li>
          ))}
        </ul>
        {a.notCounted.length > 0 && (
          <p className="mt-4 text-sm text-muted">
            Not counted as charges: {a.notCounted.map((n) => `${n.label} (${rm(n.amount)})`).join(" · ")}
          </p>
        )}
      </Card>

      {/* Next steps */}
      <Card className="border-kunyit/50 bg-kunyit-soft/40">
        <h3 className="flex items-center gap-2 font-display text-xl font-bold"><Lightbulb className="h-5 w-5" /> What to do next</h3>
        <ol className="mt-3 space-y-2.5">
          {a.nextSteps.map((s, i) => (
            <li key={i} className="flex gap-3 leading-relaxed">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-paper">{i + 1}</span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
        <div className="no-print mt-5 flex flex-wrap gap-2">
          {issues.some((f) => f.action === "dispute") && (
            <Link href={disputeHref(issues.find((f) => f.action === "dispute"))} className={btn.primary}>
              <LifeBuoy className="h-5 w-5" /> Start a billing case
            </Link>
          )}
          <Link href={plansHref()} className={btn.secondary}>
            <Sparkles className="h-5 w-5" /> Find a better plan
          </Link>
          <button type="button" onClick={() => window.print()} className={btn.ghost}>
            <Printer className="h-5 w-5" /> Print / save PDF
          </button>
        </div>
        {provider && contact && (
          <p className="mt-4 text-sm text-ink-soft">
            {PROVIDERS[provider].name} customer service: <a className="font-semibold underline" href={contact.href}>{contact.value}</a>
            {contact.note ? ` (${contact.note.toLowerCase()})` : ""} · <Link className="font-semibold underline" href="/providers">all contacts</Link>
          </p>
        )}
      </Card>

      <p className="text-sm leading-relaxed text-muted">
        BillWise&apos;s analysis is guidance based on the text you provided — not a final ruling. Plan comparisons use publicly listed prices; your provider may
        offer different terms. Always confirm with your provider before acting.
      </p>
    </div>
  );
}
