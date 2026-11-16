"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bookmark, BookmarkCheck, Briefcase, Camera, Check, Columns3, ExternalLink, Gamepad2, LoaderCircle, Smartphone, Sparkles, TriangleAlert, Tv, Upload, Wifi, X,
} from "lucide-react";
import { api } from "@/lib/client";
import { PLANS, PLANS_REVIEWED, contractLabel, dataLabel, getPlan, headline, type Plan, type PlanKind } from "@/lib/plans";
import { PROVIDERS, PROVIDER_IDS, type ProviderId } from "@/lib/providers";
import type { Activity, RecommendResult, Recommendation } from "@/lib/recommend";
import { rmShort, speedLabel, withSST } from "@/lib/format";
import { Badge, Card, EmptyState, ProviderBadge, btn, btnSm, cn } from "./ui";

export interface FinderInitial {
  tab?: "recommend" | "browse" | "saved";
  kind?: PlanKind;
  budget?: number;
  lines?: number;
  available?: ProviderId[];
  auto?: boolean;
}

type Tab = "recommend" | "browse" | "saved";

function MatchRing({ score }: { score: number }) {
  const c = 2 * Math.PI * 16;
  const color = score >= 75 ? "#0b8f63" : score >= 55 ? "#e0a100" : "#e0442a";
  return (
    <div className="relative h-14 w-14 shrink-0" role="img" aria-label={`${score}% match`}>
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="20" cy="20" r="16" fill="none" stroke="#f3ecdf" strokeWidth="5" />
        <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-bold">{score}%</span>
    </div>
  );
}

function PlanCard({
  plan, rec, rank, compared, saved, onCompare, onSave,
}: {
  plan: Plan; rec?: Recommendation; rank?: number; compared: boolean; saved: boolean; onCompare: () => void; onSave: () => void;
}) {
  const price = rec?.monthly ?? plan.price;
  const isBundle = rec && plan.bundlePrice !== undefined && rec.monthly === plan.bundlePrice && plan.bundlePrice !== plan.price;
  return (
    <article className={cn("relative flex flex-col rounded-3xl border bg-white p-5 shadow-card", rank === 0 ? "border-ink/40 ring-2 ring-kunyit" : "border-line")}>
      {rec && (
        <span className={cn("absolute -top-3 left-5 rounded-full px-3 py-0.5 text-sm font-bold", rank === 0 ? "bg-kunyit text-ink" : "bg-ink text-paper")}>
          {rank !== undefined ? `#${rank + 1} · ` : ""}{rec.label}
        </span>
      )}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <ProviderBadge id={plan.provider} size="sm" />
          <h3 className="mt-2 font-display text-xl font-bold leading-tight">{plan.name}</h3>
          <p className="font-semibold text-muted">{headline(plan)}</p>
        </div>
        {rec && <MatchRing score={rec.score} />}
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-x-2">
        <span className="font-display text-3xl font-bold tracking-tight">{rmShort(price)}</span>
        <span className="pb-1 text-muted">/month</span>
        {plan.listPrice && price < plan.listPrice && <s className="pb-1 text-muted">{rmShort(plan.listPrice)}</s>}
      </div>
      <p className="text-sm text-muted">
        {rmShort(withSST(price))} incl. 6% SST
        {isBundle ? ` · ${plan.bundleNote}` : plan.priceNote ? ` · ${plan.priceNote}` : ""}
      </p>

      {rec ? (
        <ul className="mt-4 space-y-1.5 text-[0.95rem]">
          {rec.reasons.map((r) => (
            <li key={r} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-pandan" aria-hidden /> <span>{r}</span></li>
          ))}
          {rec.cautions.map((c) => (
            <li key={c} className="flex gap-2 text-[#7a5200]"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> <span>{c}</span></li>
          ))}
        </ul>
      ) : (
        <ul className="mt-4 space-y-1.5 text-[0.95rem] text-ink-soft">
          <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-pandan" aria-hidden />{contractLabel(plan)}</li>
          {plan.kind === "fibre" && plan.router && <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-pandan" aria-hidden />{plan.router}</li>}
          {plan.kind === "mobile" && plan.calls && <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-pandan" aria-hidden />{plan.calls}</li>}
          {plan.kind === "mobile" && plan.roaming && <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-pandan" aria-hidden />{plan.roaming}</li>}
          {plan.bundlePrice && <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-pandan" aria-hidden />{rmShort(plan.bundlePrice)} {plan.bundleNote?.toLowerCase()}</li>}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <button type="button" aria-pressed={compared} onClick={onCompare} className={cn(btn.secondary, btnSm, compared && "!border-ink !bg-ink !text-paper")}>
          <Columns3 className="h-4 w-4" /> {compared ? "Comparing" : "Compare"}
        </button>
        <button type="button" aria-pressed={saved} onClick={onSave} className={cn(btn.ghost, btnSm)}>
          {saved ? <BookmarkCheck className="h-4 w-4 text-pandan" /> : <Bookmark className="h-4 w-4" />} {saved ? "Saved" : "Save"}
        </button>
        <a href={plan.source} target="_blank" rel="noreferrer" className={cn(btn.ghost, btnSm)}>
          Source <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <p className="mt-2 text-xs text-muted">{plan.status === "official" ? "Simulated provider listing" : "Simulated partner listing"} · reviewed {PLANS_REVIEWED}</p>
    </article>
  );
}

function Q({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-5">
      <legend className="flex items-center gap-3 font-display text-lg font-bold">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-sm text-paper">{n}</span>
        {title}
      </legend>
      {hint && <p className="mt-1 pl-11 text-[0.95rem] text-muted">{hint}</p>}
      <div className="mt-3 flex flex-wrap gap-2 pl-0 sm:pl-11">{children}</div>
    </fieldset>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="chip" aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

const ACTIVITIES: { id: Activity; label: string; icon: typeof Tv }[] = [
  { id: "streaming", label: "Streaming / TV", icon: Tv },
  { id: "gaming", label: "Online gaming", icon: Gamepad2 },
  { id: "wfh", label: "Work / study from home", icon: Briefcase },
  { id: "uploads", label: "Uploading videos", icon: Upload },
  { id: "smarthome", label: "CCTV / smart home", icon: Camera },
];

export function PlanFinder({ initial }: { initial: FinderInitial }) {
  const [tab, setTab] = useState<Tab>(initial.tab ?? "recommend");
  const [kind, setKind] = useState<PlanKind>(initial.kind ?? "fibre");

  const [fBudget, setFBudget] = useState(initial.kind !== "mobile" && initial.budget ? Math.min(400, Math.max(50, initial.budget)) : 150);
  const [people, setPeople] = useState(3);
  const [activities, setActivities] = useState<Activity[]>(["streaming"]);
  const [homeSize, setHomeSize] = useState<"small" | "medium" | "large">("medium");
  const [flexible, setFlexible] = useState(false);
  const [postpaidWith, setPostpaidWith] = useState<ProviderId | "">("");
  const [available, setAvailable] = useState<ProviderId[]>(initial.available ?? []);
  const [fromCoverage, setFromCoverage] = useState(false);

  const [mBudget, setMBudget] = useState(initial.kind === "mobile" && initial.budget ? Math.min(300, Math.max(30, initial.budget)) : 80);
  const [usage, setUsage] = useState<"light" | "moderate" | "heavy" | "max">("moderate");
  const [lines, setLines] = useState(initial.lines ?? 1);
  const [hotspot, setHotspot] = useState(false);
  const [roaming, setRoaming] = useState<"never" | "sometimes" | "often">("sometimes");
  const [goodSignal, setGoodSignal] = useState<ProviderId[]>([]);

  const [result, setResult] = useState<RecommendResult | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [compare, setCompare] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);

  const [bKind, setBKind] = useState<PlanKind>(initial.kind ?? "fibre");
  const [bProviders, setBProviders] = useState<ProviderId[]>([]);
  const [bMax, setBMax] = useState(400);
  const [bMin, setBMin] = useState(0);
  const [bSort, setBSort] = useState<"price" | "speed" | "value">("price");

  const resultsRef = useRef<HTMLDivElement>(null);
  const autoRan = useRef(false);

  const run = useCallback(async () => {
    setLoading(true);
    setError("");
    setShowAll(false);
    try {
      const body =
        kind === "fibre"
          ? { kind, budget: fBudget, people, activities, homeSize, flexible, postpaidWith, available }
          : { kind, budget: mBudget, usage, lines, hotspot, roaming, goodSignal };
      const r = await api<RecommendResult>("/api/plans/recommend", { method: "POST", json: body });
      setResult(r);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load recommendations.");
    } finally {
      setLoading(false);
    }
  }, [kind, fBudget, people, activities, homeSize, flexible, postpaidWith, available, mBudget, usage, lines, hotspot, roaming, goodSignal]);

  useEffect(() => {
    api<{ planIds: string[] }>("/api/shortlist").then((d) => setSaved(d.planIds)).catch(() => {});
    if (!initial.available?.length) {
      api<{ items: { statuses: Record<string, string> }[] }>("/api/coverage")
        .then((d) => {
          const found = new Set<ProviderId>();
          for (const c of d.items) for (const [k, v] of Object.entries(c.statuses)) if (v === "available" && k in PROVIDERS) found.add(k as ProviderId);
          if (found.size) {
            setAvailable([...found]);
            setFromCoverage(true);
          }
        })
        .catch(() => {});
    }
  }, [initial.available]);

  useEffect(() => {
    if (initial.auto && !autoRan.current) {
      autoRan.current = true;
      run();
    }
  }, [initial.auto, run]);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  function toggleCompare(id: string) {
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? [...c.slice(1), id] : [...c, id]));
  }
  async function toggleSave(id: string) {
    const on = saved.includes(id);
    setSaved((s) => (on ? s.filter((x) => x !== id) : [id, ...s]));
    try {
      if (on) await api(`/api/shortlist?planId=${encodeURIComponent(id)}`, { method: "DELETE" });
      else await api("/api/shortlist", { method: "POST", json: { planId: id } });
    } catch {
      setSaved((s) => (on ? [id, ...s] : s.filter((x) => x !== id)));
    }
  }

  const browsePlans = useMemo(() => {
    const list = PLANS.filter(
      (p) =>
        p.kind === bKind &&
        p.price <= bMax &&
        (!bProviders.length || bProviders.includes(p.provider)) &&
        (bKind === "fibre" ? (p.down ?? 0) >= bMin : bMin === 0 || p.dataGB === "unlimited" || (typeof p.dataGB === "number" && p.dataGB >= bMin)),
    );
    const metric = (p: Plan) => (p.kind === "fibre" ? p.down ?? 0 : p.dataGB === "unlimited" ? 5000 : (p.dataGB as number) ?? 0);
    return list.sort((a, b) => (bSort === "price" ? a.price - b.price : bSort === "speed" ? metric(b) - metric(a) : metric(b) / b.price - metric(a) / a.price));
  }, [bKind, bMax, bMin, bProviders, bSort]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "recommend", label: "Recommend for me" },
    { id: "browse", label: `Browse all ${PLANS.length}` },
    { id: "saved", label: `Saved (${saved.length})` },
  ];

  const recs = result?.results ?? [];
  const shown = showAll ? recs : recs.slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div role="tablist" aria-label="Plan Finder" className="scrollbar-none mb-6 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cn("chip shrink-0", tab === t.id && "!border-ink !bg-ink !text-paper")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "recommend" && (
        <>
          <Card className="md:p-8">
            <h2 className="font-display text-2xl font-bold">What are you looking for?</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {([
                { k: "fibre", icon: Wifi, t: "Home internet", s: "Fibre broadband" },
                { k: "mobile", icon: Smartphone, t: "Mobile plan", s: "Postpaid SIM" },
              ] as const).map((o) => (
                <button
                  key={o.k}
                  type="button"
                  aria-pressed={kind === o.k}
                  onClick={() => { setKind(o.k); setResult(null); }}
                  className={cn("flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition", kind === o.k ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink/40")}
                >
                  <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl", kind === o.k ? "bg-kunyit text-ink" : "bg-cream")}><o.icon className="h-6 w-6" /></span>
                  <span><span className="block font-display text-lg font-bold">{o.t}</span><span className={cn("text-sm", kind === o.k ? "text-paper/70" : "text-muted")}>{o.s}</span></span>
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-6">
              {kind === "fibre" ? (
                <>
                  <Q n={1} title="Monthly budget" hint="Before 6% service tax.">
                    <div className="w-full max-w-lg">
                      <div className="flex items-baseline justify-between"><span className="font-display text-3xl font-bold">{rmShort(fBudget)}</span><span className="text-muted">per month</span></div>
                      <input aria-label="Monthly budget" type="range" min={50} max={400} step={10} value={fBudget} onChange={(e) => setFBudget(Number(e.target.value))} className="mt-2 w-full" />
                      <div className="mt-2 flex flex-wrap gap-2">{[80, 100, 150, 200, 300].map((v) => <Chip key={v} on={fBudget === v} onClick={() => setFBudget(v)}>RM{v}</Chip>)}</div>
                    </div>
                  </Q>
                  <Q n={2} title="How many people use the internet at home?">
                    {[1, 2, 3, 4, 5, 6].map((v) => <Chip key={v} on={people === v} onClick={() => setPeople(v)}>{v === 6 ? "6+" : v}</Chip>)}
                  </Q>
                  <Q n={3} title="What do you do online?" hint="Pick all that apply — or none if it's mostly WhatsApp and browsing.">
                    {ACTIVITIES.map((a) => (
                      <Chip key={a.id} on={activities.includes(a.id)} onClick={() => setActivities(toggle(activities, a.id))}><a.icon className="h-4 w-4" /> {a.label}</Chip>
                    ))}
                  </Q>
                  <Q n={4} title="How big is your home?">
                    {([["small", "Small / apartment"], ["medium", "Medium / terrace"], ["large", "Large / multi-storey"]] as const).map(([v, l]) => (
                      <Chip key={v} on={homeSize === v} onClick={() => setHomeSize(v)}>{l}</Chip>
                    ))}
                  </Q>
                  <Q n={5} title="Contract">
                    <Chip on={!flexible} onClick={() => setFlexible(false)}>24 months is fine</Chip>
                    <Chip on={flexible} onClick={() => setFlexible(true)}>I prefer flexibility</Chip>
                  </Q>
                  <Q n={6} title="Already have a postpaid line with…" hint="Some providers give big fibre discounts to their mobile customers.">
                    <Chip on={postpaidWith === ""} onClick={() => setPostpaidWith("")}>None of these</Chip>
                    {(["maxon", "telcomdigi"] as ProviderId[]).map((id) => <Chip key={id} on={postpaidWith === id} onClick={() => setPostpaidWith(id)}>{PROVIDERS[id].name}</Chip>)}
                  </Q>
                  <Q n={7} title="Providers confirmed at your address" hint={fromCoverage ? "Pre-filled from your saved coverage check. Leave empty if you haven't checked yet." : "Optional. Only select providers whose official checker said yes."}>
                    {PROVIDER_IDS.map((id) => <Chip key={id} on={available.includes(id)} onClick={() => setAvailable(toggle(available, id))}>{PROVIDERS[id].name}</Chip>)}
                    <Link href="/coverage" className="chip !border-dashed">Check coverage →</Link>
                  </Q>
                </>
              ) : (
                <>
                  <Q n={1} title="Monthly budget" hint="For all lines together, before 6% service tax.">
                    <div className="w-full max-w-lg">
                      <div className="flex items-baseline justify-between"><span className="font-display text-3xl font-bold">{rmShort(mBudget)}</span><span className="text-muted">per month</span></div>
                      <input aria-label="Monthly budget" type="range" min={30} max={300} step={5} value={mBudget} onChange={(e) => setMBudget(Number(e.target.value))} className="mt-2 w-full" />
                      <div className="mt-2 flex flex-wrap gap-2">{[40, 60, 80, 120, 180].map((v) => <Chip key={v} on={mBudget === v} onClick={() => setMBudget(v)}>RM{v}</Chip>)}</div>
                    </div>
                  </Q>
                  <Q n={2} title="How do you use your phone?">
                    {([
                      ["light", "Light", "WhatsApp & browsing"],
                      ["moderate", "Moderate", "Social media & some video"],
                      ["heavy", "Heavy", "Lots of video & streaming"],
                      ["max", "Very heavy", "Hotspot for laptop / work"],
                    ] as const).map(([v, l, d]) => (
                      <button key={v} type="button" aria-pressed={usage === v} onClick={() => setUsage(v)} className="chip !h-auto !flex-col !items-start !rounded-2xl !py-2.5 text-left">
                        <span className="font-bold">{l}</span><span className="text-sm opacity-75">{d}</span>
                      </button>
                    ))}
                  </Q>
                  <Q n={3} title="How many lines (SIMs) do you need?" hint="Include family members you pay for.">
                    {[1, 2, 3, 4, 5].map((v) => <Chip key={v} on={lines === v} onClick={() => setLines(v)}>{v}</Chip>)}
                  </Q>
                  <Q n={4} title="Do you share data to other devices (hotspot)?">
                    <Chip on={!hotspot} onClick={() => setHotspot(false)}>Rarely</Chip>
                    <Chip on={hotspot} onClick={() => setHotspot(true)}>Yes, often</Chip>
                  </Q>
                  <Q n={5} title="How often do you travel overseas?">
                    {([["never", "Rarely"], ["sometimes", "1–3 times a year"], ["often", "Often"]] as const).map(([v, l]) => <Chip key={v} on={roaming === v} onClick={() => setRoaming(v)}>{l}</Chip>)}
                  </Q>
                  <Q n={6} title="Which networks have good signal where you live & work?" hint="Optional — skip if you're not sure.">
                    {(["unifly", "maxon", "telcomdigi", "vmobile"] as ProviderId[]).map((id) => <Chip key={id} on={goodSignal.includes(id)} onClick={() => setGoodSignal(toggle(goodSignal, id))}>{PROVIDERS[id].name}</Chip>)}
                  </Q>
                </>
              )}
            </div>
            {error && <p role="alert" className="mt-5 rounded-2xl bg-sambal-soft px-4 py-3 text-[#a1260f]">{error}</p>}
            <button type="button" onClick={run} disabled={loading} className={cn(btn.primary, "mt-7 w-full text-lg sm:w-auto")}>
              {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />} Show my best matches
            </button>
          </Card>

          <div ref={resultsRef} className="scroll-mt-20">
            {result && (
              <section className="mt-8 animate-rise" aria-live="polite">
                <div className="rounded-3xl bg-ink p-6 text-paper md:p-7">
                  <p className="text-sm font-bold uppercase tracking-wider text-kunyit">Your matches</p>
                  <p className="mt-1 font-display text-2xl font-bold md:text-3xl">{result.needSummary}</p>
                  <p className="mt-2 text-paper/70">Ranked by fit with your answers: speed or data, budget, value and preferences. Prices are monthly, before 6% SST unless shown.</p>
                </div>
                <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {shown.map((r, i) => {
                    const plan = getPlan(r.planId);
                    if (!plan) return null;
                    return <PlanCard key={r.planId} plan={plan} rec={r} rank={i} compared={compare.includes(plan.id)} saved={saved.includes(plan.id)} onCompare={() => toggleCompare(plan.id)} onSave={() => toggleSave(plan.id)} />;
                  })}
                </div>
                {recs.length > 6 && (
                  <button type="button" onClick={() => setShowAll(!showAll)} className={cn(btn.secondary, "mt-6")}>
                    {showAll ? "Show top 6 only" : `Show all ${recs.length} ranked plans`}
                  </button>
                )}
              </section>
            )}
          </div>
        </>
      )}

      {tab === "browse" && (
        <>
          <Card className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Chip on={bKind === "fibre"} onClick={() => { setBKind("fibre"); setBMin(0); }}><Wifi className="h-4 w-4" /> Home fibre</Chip>
              <Chip on={bKind === "mobile"} onClick={() => { setBKind("mobile"); setBMin(0); }}><Smartphone className="h-4 w-4" /> Mobile postpaid</Chip>
            </div>
            <div className="flex flex-wrap gap-2">
              {PROVIDER_IDS.filter((id) => PLANS.some((p) => p.provider === id && p.kind === bKind)).map((id) => (
                <Chip key={id} on={bProviders.includes(id)} onClick={() => setBProviders(toggle(bProviders, id))}>{PROVIDERS[id].name}</Chip>
              ))}
              {bProviders.length > 0 && <button type="button" className="chip !border-dashed" onClick={() => setBProviders([])}><X className="h-4 w-4" /> Clear</button>}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-semibold">Max price: {rmShort(bMax)}/month</span>
                <input type="range" min={40} max={400} step={10} value={bMax} onChange={(e) => setBMax(Number(e.target.value))} className="mt-2 w-full" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">{bKind === "fibre" ? "Minimum speed" : "Minimum data"}</span>
                <select className="field mt-1" value={bMin} onChange={(e) => setBMin(Number(e.target.value))}>
                  <option value={0}>Any</option>
                  {(bKind === "fibre" ? [100, 300, 500, 1000] : [30, 100, 500]).map((v) => (
                    <option key={v} value={v}>{bKind === "fibre" ? speedLabel(v) : `${v}GB`}+</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Sort by</span>
                <select className="field mt-1" value={bSort} onChange={(e) => setBSort(e.target.value as typeof bSort)}>
                  <option value="price">Lowest price</option>
                  <option value="speed">{bKind === "fibre" ? "Fastest" : "Most data"}</option>
                  <option value="value">Best value per ringgit</option>
                </select>
              </label>
            </div>
          </Card>
          <p className="mt-5 font-semibold text-muted">{browsePlans.length} plans</p>
          <div className="mt-3 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {browsePlans.map((p) => (
              <PlanCard key={p.id} plan={p} compared={compare.includes(p.id)} saved={saved.includes(p.id)} onCompare={() => toggleCompare(p.id)} onSave={() => toggleSave(p.id)} />
            ))}
          </div>
          {!browsePlans.length && <EmptyState title="No plans match these filters" text="Try raising the maximum price or clearing provider filters." />}
        </>
      )}

      {tab === "saved" && (
        saved.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {saved.map((id) => getPlan(id)).filter((p): p is Plan => Boolean(p)).map((p) => (
              <PlanCard key={p.id} plan={p} compared={compare.includes(p.id)} saved onCompare={() => toggleCompare(p.id)} onSave={() => toggleSave(p.id)} />
            ))}
          </div>
        ) : (
          <EmptyState icon={<Bookmark className="h-7 w-7" />} title="No saved plans yet" text="Tap “Save” on any plan to keep a shortlist here." action={<button type="button" className={btn.primary} onClick={() => setTab("recommend")}>Get recommendations</button>} />
        )
      )}

      <p className="mt-10 rounded-2xl border border-line bg-white p-4 text-sm leading-relaxed text-muted">
        <strong className="text-ink">About these prices:</strong> all providers and plans shown are fictional, with illustrative source links, reviewed {PLANS_REVIEWED}. Prices are monthly,
        before 6% service tax, and include standard rebates where noted. Treat every figure as demo data rather than an offer.
        Mobile data shown as “{dataLabel(PLANS.find((p) => p.dataGB === "unlimited") as Plan)}” is subject to the provider&apos;s fair usage policy.
      </p>

      {compare.length > 0 && (
        <div className="fixed inset-x-3 bottom-[5.2rem] z-40 mx-auto max-w-3xl rounded-3xl border border-ink/20 bg-white p-3 shadow-lift md:bottom-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 font-semibold">Compare ({compare.length}/3):</span>
            {compare.map((id) => {
              const p = getPlan(id);
              return p ? (
                <button key={id} type="button" onClick={() => toggleCompare(id)} className="inline-flex items-center gap-1 rounded-full bg-cream px-3 py-1.5 text-sm font-semibold" aria-label={`Remove ${p.name} from comparison`}>
                  {p.name} <X className="h-3.5 w-3.5" />
                </button>
              ) : null;
            })}
            <Link href={`/plans/compare?ids=${compare.join(",")}`} className={cn(btn.accent, btnSm, "ml-auto", compare.length < 2 && "pointer-events-none opacity-50")} aria-disabled={compare.length < 2}>
              <Columns3 className="h-4 w-4" /> Compare now
            </Link>
          </div>
          {compare.length < 2 && <p className="mt-1 px-2 text-sm text-muted">Pick at least one more plan.</p>}
        </div>
      )}
    </div>
  );
}
