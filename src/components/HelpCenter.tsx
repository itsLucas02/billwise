"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, ExternalLink, HandCoins, Landmark, LifeBuoy, LoaderCircle, Phone, Plus, Scale } from "lucide-react";
import { api } from "@/lib/client";
import { ISSUES, ISSUE_TYPES, STATUS_INFO, type CaseStatus, type IssueType } from "@/lib/cases";
import { ESCALATION, PROVIDERS, PROVIDER_IDS, primaryContact } from "@/lib/providers";
import { fmtDate, relativeTime, rm } from "@/lib/format";
import { Badge, Card, EmptyState, ProviderBadge, SectionTitle, Stat, btn, cn } from "./ui";

interface CaseItem {
  id: string;
  title: string;
  provider: string;
  issueType: string;
  status: string;
  amount: number | null;
  followUpOn: string | null;
  updatedAt: string;
  createdAt: string;
}

export function HelpCenter() {
  const [data, setData] = useState<{ items: CaseItem[]; stats: { open: number; resolved: number; recovered: number } } | null>(null);

  useEffect(() => {
    api<{ items: CaseItem[]; stats: { open: number; resolved: number; recovered: number } }>("/api/cases")
      .then(setData)
      .catch(() => setData({ items: [], stats: { open: 0, resolved: 0, recovered: 0 } }));
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <section className="relative overflow-hidden rounded-3xl bg-ink p-6 text-paper shadow-lift md:p-8">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-kunyit/20 blur-3xl" aria-hidden />
        <div className="relative">
          <h2 className="font-display text-3xl font-bold tracking-tight">Got a billing problem?</h2>
          <p className="mt-2 max-w-2xl text-lg text-paper/80">Tell us what happened. We&apos;ll draft your message (English or Bahasa Malaysia), show you who to contact, and help you track it until it&apos;s fixed.</p>
          <Link href="/help/new" className={cn(btn.yellow, "mt-5")}><Plus className="h-5 w-5" /> Start a new case</Link>
          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-paper/60">Or jump straight to a common problem</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ISSUE_TYPES.filter((t) => t !== "other").map((t: IssueType) => (
              <Link key={t} href={`/help/new?issue=${t}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-paper/20 bg-white/5 px-3.5 text-sm font-semibold transition hover:bg-white/15">
                <span aria-hidden>{ISSUES[t].emoji}</span> {ISSUES[t].label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="cases-title">
        <SectionTitle title={<span id="cases-title">My cases</span>} sub="Saved on this browser — come back any time to update them." />
        {!data ? (
          <div className="grid place-items-center py-16 text-muted"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-3 gap-3">
              <Stat label="Open cases" value={data.stats.open} />
              <Stat label="Resolved" value={data.stats.resolved} tone={data.stats.resolved ? "green" : "neutral"} />
              <Stat label="Money recovered" value={rm(data.stats.recovered)} tone={data.stats.recovered ? "green" : "neutral"} />
            </div>
            {data.items.length ? (
              <ul className="grid gap-4 md:grid-cols-2">
                {data.items.map((c) => {
                  const info = STATUS_INFO[c.status as CaseStatus] ?? STATUS_INFO.open;
                  const overdue = c.followUpOn && c.followUpOn <= today && c.status !== "resolved" && c.status !== "closed";
                  return (
                    <li key={c.id}>
                      <Link href={`/help/${c.id}`} className="group block h-full rounded-3xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
                        <div className="flex flex-wrap items-center gap-2">
                          <ProviderBadge id={c.provider} size="sm" />
                          <Badge tone={info.tone}>{info.label}</Badge>
                          {overdue && <Badge tone="red"><CalendarDays className="h-3.5 w-3.5" /> Follow up today</Badge>}
                        </div>
                        <p className="mt-3 font-display text-lg font-bold leading-snug">{c.title}</p>
                        <p className="mt-1 text-sm text-muted">
                          {ISSUES[c.issueType as IssueType]?.emoji} {c.amount ? `${rm(c.amount)} · ` : ""}Updated {relativeTime(c.updatedAt)}
                          {c.followUpOn && !overdue ? ` · Follow up ${fmtDate(c.followUpOn)}` : ""}
                        </p>
                        <span className="mt-3 inline-flex items-center gap-1 font-semibold text-pandan-dark">Open case <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={<LifeBuoy className="h-7 w-7" />} title="No cases yet" text="When you start a case, it's saved here so you can track replies, reference numbers and follow-ups." action={<Link href="/help/new" className={btn.primary}>Start a case</Link>} />
            )}
          </>
        )}
      </section>

      <section aria-labelledby="escalate-title">
        <SectionTitle title={<span id="escalate-title">If your provider doesn&apos;t fix it</span>} sub="The official path for telco complaints in Malaysia." />
        <ol className="grid gap-4 md:grid-cols-4">
          {[
            { icon: Phone, t: "1. Contact your provider", d: "Always start here. Get a reference number and note the agent's name and what they promised." },
            { icon: CalendarDays, t: "2. Give them time", d: `Under the General Consumer Code, providers should ${ESCALATION.gcc.map((g) => g.text.toLowerCase().replace(/^./, (c) => c)).join("; ")}.` },
            { icon: Scale, t: "3. Escalate to CFM", d: `Not resolved or unhappy with the answer? Lodge a complaint with the Consumer Forum via ${ESCALATION.cfm.portal.replace("https://", "")}, the ${ESCALATION.cfm.app}, or ${ESCALATION.cfm.hotline}.` },
            { icon: Landmark, t: "4. MCMC", d: `CFM works with the regulator, MCMC, on unresolved or serious issues. MCMC Consumer Care: ${ESCALATION.mcmc.hotline}.` },
          ].map((s) => (
            <li key={s.t} className="rounded-3xl border border-line bg-white p-5">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-kunyit-soft"><s.icon className="h-5 w-5" /></span>
              <p className="mt-3 font-display text-lg font-bold">{s.t}</p>
              <p className="mt-1 text-[0.95rem] leading-relaxed text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={ESCALATION.cfm.portal} target="_blank" rel="noreferrer" className={btn.secondary}>MCMC / CFM complaint portal <ExternalLink className="h-4 w-4" /></a>
          <a href={ESCALATION.cfm.site} target="_blank" rel="noreferrer" className={btn.ghost}>About CFM <ExternalLink className="h-4 w-4" /></a>
        </div>
      </section>

      <section aria-labelledby="contacts-title">
        <SectionTitle title={<span id="contacts-title">Provider contacts</span>} action={<Link href="/providers" className="inline-flex items-center gap-1 font-semibold text-pandan-dark hover:underline">Full directory <ArrowRight className="h-4 w-4" /></Link>} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROVIDER_IDS.map((id) => {
            const c = primaryContact(id);
            return (
              <Card key={id} className="!p-4">
                <div className="flex items-center justify-between gap-2">
                  <ProviderBadge id={id} />
                  <span className="text-sm text-muted">{PROVIDERS[id].app}</span>
                </div>
                {c && (
                  <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="mt-3 flex items-center gap-2 font-display text-xl font-bold hover:underline">
                    <Phone className="h-5 w-5 text-pandan" /> {c.value}
                  </a>
                )}
                {c?.note && <p className="text-sm text-muted">{c.label} · {c.note}</p>}
              </Card>
            );
          })}
        </div>
      </section>
      <p className="flex items-center gap-2 text-sm text-muted"><HandCoins className="h-4 w-4" /> Contact details are compiled from providers&apos; public channels — check the provider&apos;s website if a number doesn&apos;t connect.</p>
    </div>
  );
}
