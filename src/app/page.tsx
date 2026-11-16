import Link from "next/link";
import {
  ArrowRight, BadgeCheck, Eye, LifeBuoy, RadioTower, ScanText, ShieldCheck, Sparkles, ChevronDown,
} from "lucide-react";
import { HomeActivity } from "@/components/HomeActivity";
import { BillLoupe } from "@/components/figures/BillLoupe";
import { SeeItWork } from "@/components/figures/SeeItWork";
import { ProviderBadge, SimTag, btn } from "@/components/ui";
import { PLANS, PLANS_REVIEWED } from "@/lib/plans";
import { PROVIDER_IDS } from "@/lib/providers";

const TOOLS = [
  {
    href: "/decoder",
    icon: ScanText,
    title: "Bill Decoder",
    ms: "Fahami bil anda",
    text: "Paste your bill and see every charge explained in plain language — with tax checks, duplicate detection and ways to save.",
    cta: "Decode a bill",
    color: "bg-kunyit",
  },
  {
    href: "/plans",
    icon: Sparkles,
    title: "Plan Finder",
    ms: "Cari pelan terbaik",
    text: `Answer a few simple questions and compare ${PLANS.length} real fibre and mobile plans matched to your budget and household.`,
    cta: "Find a plan",
    color: "bg-pandan-soft",
  },
  {
    href: "/coverage",
    icon: RadioTower,
    title: "Coverage Discovery",
    ms: "Semak liputan",
    text: "Check what's available at your address using official checkers, track the answers, and test your signal and speed.",
    cta: "Check my area",
    color: "bg-sky-soft",
  },
  {
    href: "/help",
    icon: LifeBuoy,
    title: "Billing Assistance",
    ms: "Bantuan bil",
    text: "Dispute a charge step by step: ready-to-send messages in English or BM, the right contacts, and case tracking.",
    cta: "Get help",
    color: "bg-sambal-soft",
  },
];

const FAQ = [
  { q: "Is BillWise free? Do I need to sign up?", a: "Yes, it's free and there's no sign-up. Your analyses and cases are saved to this browser so you can come back to them." },
  { q: "Will you ask for my telco password or IC number?", a: "Never. Just paste the charges from your bill. You can remove your name and address before pasting — we only need the line items." },
  { q: "Are the plan prices up to date?", a: `Prices come from each provider's own published plan pages and were last checked ${PLANS_REVIEWED}. Telcos change prices and promotions often, so confirm on their site before signing up — treat BillWise as a starting point, not an offer.` },
  { q: "Can you tell me if fibre is available at my house?", a: "We won't guess. We point you to each provider's official coverage checker and help you record and compare what they tell you." },
];

function HeroReceipt() {
  const rows = [
    { label: "Unifi Home 300Mbps", amount: "139.00", note: "Promised RM129 — ask if the promo ended", tone: "bg-kunyit text-ink" },
    { label: "Unifi TV Add-on Pack", amount: "49.00" },
    { label: "Mesh Wi-Fi Add-on (2 units)", amount: "20.00" },
    { label: "Late payment charge", amount: "10.00", note: "Ask for a one-time waiver", tone: "bg-sambal text-white" },
    { label: "Service tax 6%", amount: "12.48", note: "Matches 6% telco service tax", tone: "bg-pandan text-white" },
    { label: "Rounding adjustment", amount: "0.02" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-md lg:mr-0">
      <div className="absolute -inset-4 rotate-3 rounded-[2.5rem] bg-kunyit/35" aria-hidden />
      <div className="receipt-shadow relative -rotate-[1.5deg]">
        <div className="receipt relative overflow-hidden rounded-t-3xl bg-white px-6 pt-6">
          <div className="pointer-events-none absolute inset-x-0 top-24 h-10 animate-scan bg-gradient-to-b from-transparent via-kunyit/30 to-transparent" aria-hidden />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-lg font-bold">unifi · Oct 2026</p>
              <p className="text-sm text-muted">Account ••••6789</p>
            </div>
            <SimTag label="Example" />
          </div>
          <dl className="mt-5 space-y-3.5">
            {rows.map((r) => (
              <div key={r.label}>
                <div className="flex items-baseline text-[0.95rem]">
                  <dt className="font-medium">{r.label}</dt>
                  <span className="leader" aria-hidden />
                  <dd className="font-mono font-semibold tabular-nums">{r.amount}</dd>
                </div>
                {r.note && <p className={`mt-1 inline-block rounded-lg px-2 py-0.5 text-[0.8rem] font-bold ${r.tone}`}>↳ {r.note}</p>}
              </div>
            ))}
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t-2 border-dashed border-line pt-3 pb-2">
            <span className="font-bold">Total due</span>
            <span className="font-display text-2xl font-bold">RM230.50</span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-7 -left-3 flex items-center gap-3 rounded-2xl bg-ink p-3.5 pr-5 text-paper shadow-lift md:-left-10">
        <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90" aria-hidden>
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(251,248,242,0.15)" strokeWidth="4" />
          <circle cx="18" cy="18" r="15" fill="none" stroke="#ffc23d" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${0.69 * 94.2} 94.2`} />
        </svg>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-paper/70">Bill health</p>
          <p className="font-display text-xl font-bold">69 / 100</p>
        </div>
      </div>
      <div className="absolute -right-2 -top-5 rotate-3 rounded-2xl bg-pandan px-4 py-2.5 text-white shadow-lift md:-right-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Could save up to</p>
        <p className="font-display text-lg font-bold">RM480/yr</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const counts = PROVIDER_IDS.map((id) => ({ id, n: PLANS.filter((p) => p.provider === id).length }));
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="dotgrid absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-10 md:pt-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-sm font-semibold text-ink-soft">
              <span className="h-2 w-2 rounded-full bg-pandan" aria-hidden /> For every Malaysian who pays a telco bill
            </p>
            <h1 className="mt-5 font-display text-[clamp(2.5rem,6.6vw,4.6rem)] font-extrabold leading-[0.98] tracking-tight">
              Understand your <span className="mark">telco bill</span>. Pay only for what you need.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted md:text-xl">
              BillWise explains confusing charges in plain language, spots overcharges, compares plans from seven Malaysian telcos, and
              walks you through fixing billing problems — step by step.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/decoder" className={btn.primary}>
                <ScanText className="h-5 w-5" /> Decode my bill
              </Link>
              <Link href="/decoder?sample=unifi-promo" className={btn.secondary}>
                Try a sample bill <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[0.95rem] font-medium text-ink-soft">
              <li className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-pandan" /> Free, no sign-up</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-pandan" /> No passwords or IC needed</li>
              <li className="flex items-center gap-2"><Eye className="h-5 w-5 text-pandan" /> Honest about sources</li>
            </ul>
          </div>
          <HeroReceipt />
        </div>
      </section>

      <HomeActivity />

      <section className="mx-auto max-w-4xl px-4 pt-14" aria-labelledby="see-title">
        <p className="text-sm font-bold uppercase tracking-wider text-pandan-dark">See it work</p>
        <h2 id="see-title" className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">From a confusing bill to a message you can send</h2>
        <div className="mt-6">
          <SeeItWork />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="tools-title">
        <h2 id="tools-title" className="font-display text-3xl font-bold tracking-tight md:text-4xl">Four tools. One goal: no more bill surprises.</h2>
        <p className="mt-2 max-w-2xl text-lg text-muted">Start anywhere — each tool links to the next step when you need it.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {TOOLS.map((t, i) => (
            <Link
              key={t.href}
              href={t.href}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift md:p-7"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <span className={`grid h-14 w-14 place-items-center rounded-2xl ${t.color}`}>
                  <t.icon className="h-7 w-7" aria-hidden />
                </span>
                <span className="text-sm font-semibold italic text-muted">{t.ms}</span>
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold tracking-tight">{t.title}</h3>
              <p className="mt-2 flex-1 leading-relaxed text-muted">{t.text}</p>
              <span className="mt-5 inline-flex items-center gap-2 font-bold text-ink">
                {t.cta} <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-ink text-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
          {[
            { n: "1", t: "Upload, paste or pick a bill", d: "Upload your e-bill PDF (read on your device), paste the charges, or try one of our simulated sample bills." },
            { n: "2", t: "See what's normal — and what's not", d: "Every line explained. We check the 6% service tax, duplicates, ended promos, roaming and content charges." },
            { n: "3", t: "Act with confidence", d: "Switch to a better plan, ask for a refund with a ready-made message, or simply relax knowing your bill is right." },
          ].map((s) => (
            <div key={s.n}>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-kunyit font-display text-xl font-extrabold text-ink">{s.n}</span>
              <h3 className="mt-4 font-display text-xl font-bold">{s.t}</h3>
              <p className="mt-2 leading-relaxed text-paper/75">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pt-14" aria-labelledby="inside-title">
        <p className="text-sm font-bold uppercase tracking-wider text-pandan-dark">Inside the decoder</p>
        <h2 id="inside-title" className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Rules, not guesswork</h2>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-soft">
          BillWise reads your bill one line at a time and checks each charge against fixed rules, the same way every time. Lines that are normal get a tick; anything worth questioning gets flagged with a plain reason. AI only helps word your enquiry afterwards.
        </p>
        <div className="mt-6">
          <BillLoupe />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="honest-title">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 id="honest-title" className="font-display text-3xl font-bold tracking-tight md:text-4xl">Honest by design</h2>
            <p className="mt-3 text-lg leading-relaxed text-muted">
              Money advice is only useful if you can trust it. So we tell you exactly where information comes from — and what&apos;s just an example.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {counts.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-sm font-semibold">
                  <ProviderBadge id={c.id} size="sm" /> {c.n} plans
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { t: "Real plans, with sources", d: `${PLANS.length} plans from Unifi, Maxis, CelcomDigi, TIME, Allo, U Mobile and Yes — each linked to the provider's own plan page (checked ${PLANS_REVIEWED}).` },
              { t: "No invented coverage", d: "We never claim a service is available at your address. Only the provider checkers — and what you record — count." },
              { t: "Sample bills are labelled", d: "Provider names, plans and contact details are real. Sample bills use invented account numbers and carry a clear “Specimen” tag, so you always know what's what." },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-line bg-white p-5">
                <p className="flex items-center gap-2 font-display text-lg font-bold"><BadgeCheck className="h-5 w-5 text-pandan" /> {x.t}</p>
                <p className="mt-1.5 leading-relaxed text-muted">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16" aria-labelledby="faq-title">
        <h2 id="faq-title" className="font-display text-3xl font-bold tracking-tight">Common questions</h2>
        <div className="mt-5 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-line bg-white p-5">
              <summary className="flex items-center justify-between gap-4 font-semibold">
                {f.q}
                <span className="rotate-on-open grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream transition" aria-hidden><ChevronDown className="h-5 w-5" /></span>
              </summary>
              <p className="mt-3 leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
