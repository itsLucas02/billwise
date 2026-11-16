import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Globe, LifeBuoy, Mail, MessageCircle, Phone, RadioTower, Scale, Sparkles } from "lucide-react";
import { Card, PageHeader, ProviderBadge, btn, btnSm, cn } from "@/components/ui";
import { PLANS } from "@/lib/plans";
import { ESCALATION, PROVIDERS, PROVIDER_IDS, type ChannelKind } from "@/lib/providers";

export const metadata: Metadata = { title: "Provider contacts" };

const ICONS: Record<ChannelKind, typeof Phone> = { phone: Phone, whatsapp: MessageCircle, chat: MessageCircle, web: Globe, email: Mail };

export default function ProvidersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Provider directory · Direktori penyedia"
        title={<>Who to contact, and <span className="mark">how</span></>}
        intro="Customer service channels, self-service apps and coverage checkers for seven Malaysian telcos. Details come from each provider's own site — confirm anything time-sensitive directly with them."
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {PROVIDER_IDS.map((id) => {
            const p = PROVIDERS[id];
            const fibre = PLANS.filter((x) => x.provider === id && x.kind === "fibre").length;
            const mobile = PLANS.filter((x) => x.provider === id && x.kind === "mobile").length;
            return (
              <Card key={id} className="flex flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <ProviderBadge id={id} />
                  <span className="text-sm text-muted">{p.company}</span>
                </div>
                <p className="mt-3 leading-relaxed text-ink-soft">{p.blurb}</p>
                <h2 className="mt-5 text-sm font-bold uppercase tracking-wider text-muted">Customer service</h2>
                <ul className="mt-2 space-y-2">
                  {p.channels.map((c) => {
                    const Icon = ICONS[c.kind];
                    return (
                      <li key={c.label + c.value}>
                        <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex items-center gap-3 rounded-2xl border-2 border-line px-3 py-2.5 transition hover:border-ink/40">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream"><Icon className="h-5 w-5" /></span>
                          <span>
                            <span className="block break-all font-display text-lg font-bold leading-tight">{c.value}</span>
                            <span className="text-sm text-muted">{c.label}{c.note ? ` · ${c.note}` : ""}</span>
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-cream/60 p-4 text-[0.95rem]">
                  <div><dt className="text-muted">Self-service</dt><dd className="font-semibold">{p.app}</dd></div>
                  <div><dt className="text-muted">Plans in BillWise</dt><dd className="font-semibold">{[fibre && `${fibre} fibre`, mobile && `${mobile} mobile`].filter(Boolean).join(" · ")}</dd></div>
                </dl>
                <ul className="mt-4 space-y-1.5 text-[0.95rem] leading-relaxed text-ink-soft">
                  {p.tips.map((t) => <li key={t}>💡 {t}</li>)}
                </ul>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <a href={p.website} target="_blank" rel="noreferrer" className={cn(btn.secondary, btnSm)}>Official site <ExternalLink className="h-4 w-4" /></a>
                  <a href={p.fibreCheckUrl} target="_blank" rel="noreferrer" className={cn(btn.ghost, btnSm)}><RadioTower className="h-4 w-4" /> Coverage checker</a>
                  <Link href={`/plans?tab=browse`} className={cn(btn.ghost, btnSm)}><Sparkles className="h-4 w-4" /> Plans</Link>
                  <Link href={`/help/new?provider=${id}`} className={cn(btn.ghost, btnSm)}><LifeBuoy className="h-4 w-4" /> Start a case</Link>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 border-sambal/25">
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><Scale className="h-6 w-6" /> When your provider doesn&apos;t resolve it</h2>
          <p className="mt-2 max-w-3xl leading-relaxed text-ink-soft">
            Contact your provider first and keep the reference number. If the problem isn&apos;t resolved, lodge a complaint with the {ESCALATION.cfm.name} through the MCMC
            complaint portal or the {ESCALATION.cfm.app}.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={ESCALATION.cfm.portal} target="_blank" rel="noreferrer" className={btn.primary}>aduan.skmm.gov.my <ExternalLink className="h-4 w-4" /></a>
            <a href={`tel:${ESCALATION.cfm.hotline.replace(/-/g, "")}`} className={btn.secondary}><Phone className="h-4 w-4" /> CFM {ESCALATION.cfm.hotline}</a>
            <a href={`tel:${ESCALATION.mcmc.hotline.replace(/-/g, "")}`} className={btn.secondary}><Phone className="h-4 w-4" /> MCMC {ESCALATION.mcmc.hotline}</a>
          </div>
        </Card>
        <p className="mt-6 text-sm text-muted">Contact details and coverage checker links are taken from each provider&apos;s official site and can change without notice. BillWise is independent and not affiliated with any of these providers; the CFM and MCMC escalation details are real public information.</p>
      </div>
    </>
  );
}
