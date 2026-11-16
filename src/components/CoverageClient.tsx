"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2, CircleCheck, ExternalLink, Gauge, House, Info, LifeBuoy, LoaderCircle, MapPin, Plus, RadioTower, ShieldCheck, Signal, Smartphone, Sparkles, Store, Trash2, Wifi,
} from "lucide-react";
import { api } from "@/lib/client";
import {
  PROPERTY_LABEL, STATUS_LABEL, areaNotes, isEastMalaysia, rateRSRP, rateSINR, rateSpeed, stateFromPostcode,
  type CoverageStatus, type PropertyType,
} from "@/lib/coverage";
import { PROVIDERS, PROVIDER_IDS, type ProviderId } from "@/lib/providers";

// The address checklist is about fibre; mobile-only providers (Yes) are covered by the signal section.
const FIBRE_IDS = PROVIDER_IDS.filter((id) => PROVIDERS[id].services.includes("fibre"));
import { relativeTime, speedLabel } from "@/lib/format";
import { Badge, Card, EmptyState, ProviderBadge, btn, btnSm, cn } from "./ui";

interface Check {
  id: string;
  label: string;
  postcode: string;
  state: string | null;
  propertyType: string;
  statuses: Record<string, string>;
  notes: string;
  updatedAt: string;
}

type Tab = "fibre" | "signal" | "speed";

const STATUS_STYLE: Record<CoverageStatus, string> = {
  unchecked: "!border-ink !bg-ink !text-paper",
  available: "!border-pandan !bg-pandan !text-white",
  unavailable: "!border-sambal !bg-sambal !text-white",
  waitlist: "!border-kunyit !bg-kunyit !text-ink",
};

export function CoverageClient({ initialCheck }: { initialCheck?: string }) {
  const [tab, setTab] = useState<Tab>("fibre");
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialCheck ?? null);
  const [label, setLabel] = useState("Home");
  const [postcode, setPostcode] = useState("");
  const [property, setProperty] = useState<PropertyType>("highrise");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const [rsrp, setRsrp] = useState(-95);
  const [sinr, setSinr] = useState("");
  const [planSpeed, setPlanSpeed] = useState(300);
  const [measured, setMeasured] = useState("");
  const [method, setMethod] = useState<"cable" | "wifi-near" | "wifi-far">("wifi-near");

  useEffect(() => {
    api<{ items: Check[] }>("/api/coverage")
      .then((d) => {
        setChecks(d.items);
        setSelectedId((cur) => cur ?? d.items[0]?.id ?? null);
      })
      .catch(() => setChecks([]));
  }, []);

  const selected = checks?.find((c) => c.id === selectedId) ?? null;
  const previewState = stateFromPostcode(postcode);

  async function create() {
    setError("");
    if (!/^\d{5}$/.test(postcode)) {
      setError("Please enter a 5-digit postcode, e.g. 47301.");
      return;
    }
    setCreating(true);
    try {
      const d = await api<{ item: Check }>("/api/coverage", { method: "POST", json: { label, postcode, propertyType: property } });
      setChecks((c) => [d.item, ...(c ?? [])]);
      setSelectedId(d.item.id);
      setPostcode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setCreating(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>, key: string) {
    setSaving(key);
    try {
      const d = await api<{ item: Check }>(`/api/coverage/${id}`, { method: "PATCH", json: body });
      setChecks((c) => (c ?? []).map((x) => (x.id === id ? d.item : x)));
    } finally {
      setSaving(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this address and its results?")) return;
    await api(`/api/coverage/${id}`, { method: "DELETE" }).catch(() => {});
    setChecks((c) => (c ?? []).filter((x) => x.id !== id));
    setSelectedId(null);
  }

  const confirmed = useMemo(
    () => (selected ? PROVIDER_IDS.filter((id) => selected.statuses[id] === "available") : []),
    [selected],
  );
  const checkedCount = selected ? FIBRE_IDS.filter((id) => (selected.statuses[id] ?? "unchecked") !== "unchecked").length : 0;

  const signal = rateRSRP(rsrp);
  const sinrNum = sinr.trim() === "" ? null : Number(sinr);
  const speed = measured.trim() && Number(measured) > 0 ? rateSpeed(planSpeed, Number(measured), method) : null;

  const tabs: { id: Tab; label: string; icon: typeof Wifi }[] = [
    { id: "fibre", label: "Fibre at my address", icon: Wifi },
    { id: "signal", label: "Mobile signal check", icon: Signal },
    { id: "speed", label: "Is my internet slow?", icon: Gauge },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Card className="border-pandan/25 bg-pandan-soft/40">
        <div className="flex gap-4">
          <ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-pandan-dark" aria-hidden />
          <div>
            <p className="font-display text-lg font-bold">How BillWise handles coverage</p>
            <p className="mt-1 leading-relaxed text-ink-soft">
              We <strong>never guess</strong> whether a service reaches your home. Availability can differ from one block or street to the next, so only each
              provider&apos;s official checker can confirm it. We help you check every provider, record their answers, and compare plans that are actually available to you.
            </p>
          </div>
        </div>
      </Card>

      <div role="tablist" aria-label="Coverage tools" className="scrollbar-none mt-6 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cn("chip shrink-0", tab === t.id && "!border-ink !bg-ink !text-paper")}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "fibre" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="space-y-5">
            <Card>
              <h2 className="font-display text-lg font-bold">Add an address to check</h2>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold">Name it</span>
                  <input className="field mt-1" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Home, Mum's house, new condo…" maxLength={60} />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">Postcode</span>
                  <input className="field mt-1 font-mono text-lg tracking-widest" inputMode="numeric" maxLength={5} value={postcode} onChange={(e) => setPostcode(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 47301" />
                  {postcode.length === 5 && (
                    <span className={cn("mt-1 block text-sm font-semibold", previewState ? "text-pandan-dark" : "text-sambal")}>
                      {previewState ? `📍 ${previewState}${isEastMalaysia(previewState) ? " (East Malaysia)" : ""}` : "We don't recognise this postcode"}
                    </span>
                  )}
                </label>
                <div>
                  <span className="text-sm font-semibold">Property type</span>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    {([["highrise", Building2], ["landed", House], ["shop", Store]] as const).map(([v, Icon]) => (
                      <button key={v} type="button" aria-pressed={property === v} onClick={() => setProperty(v)} className={cn("flex flex-col items-center gap-1 rounded-2xl border-2 p-2.5 text-center text-sm font-semibold transition", property === v ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink/40")}>
                        <Icon className="h-5 w-5" /> {PROPERTY_LABEL[v]}
                      </button>
                    ))}
                  </div>
                </div>
                {error && <p role="alert" className="rounded-xl bg-sambal-soft px-3 py-2 text-sm text-[#a1260f]">{error}</p>}
                <button type="button" onClick={create} disabled={creating} className={cn(btn.primary, "w-full")}>
                  {creating ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />} Start checking
                </button>
              </div>
            </Card>

            {checks && checks.length > 0 && (
              <Card>
                <h2 className="font-display text-lg font-bold">Your addresses</h2>
                <ul className="mt-3 space-y-2">
                  {checks.map((c) => {
                    const done = FIBRE_IDS.filter((id) => (c.statuses[id] ?? "unchecked") !== "unchecked").length;
                    const yes = PROVIDER_IDS.filter((id) => c.statuses[id] === "available").length;
                    return (
                      <li key={c.id}>
                        <button type="button" onClick={() => setSelectedId(c.id)} aria-current={c.id === selectedId} className={cn("w-full rounded-2xl border-2 px-3 py-2.5 text-left transition", c.id === selectedId ? "border-ink" : "border-line hover:border-ink/30")}>
                          <span className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4" /> {c.label} · {c.postcode}</span>
                          <span className="text-sm text-muted">{c.state ?? "Unknown state"} · {done}/{FIBRE_IDS.length} checked · {yes} available</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
          </div>

          <div>
            {checks === null ? (
              <div className="grid place-items-center py-24 text-muted"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
            ) : !selected ? (
              <EmptyState icon={<MapPin className="h-7 w-7" />} title="Add your postcode to begin" text="We'll set up a checklist of every provider, with links to their official coverage checkers." />
            ) : (
              <div className="space-y-5">
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wider text-muted">{PROPERTY_LABEL[selected.propertyType as PropertyType] ?? "Address"}</p>
                      <h2 className="font-display text-3xl font-bold tracking-tight">{selected.label}</h2>
                      <p className="mt-1 text-lg text-ink-soft">{selected.postcode} · {selected.state ?? "Unknown state"}{isEastMalaysia(selected.state) ? " · East Malaysia" : selected.state ? " · Peninsular Malaysia" : ""}</p>
                    </div>
                    <button type="button" onClick={() => remove(selected.id)} className={cn(btn.danger, btnSm)}><Trash2 className="h-4 w-4" /> Delete</button>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm font-semibold"><span>{checkedCount} of {FIBRE_IDS.length} fibre providers checked</span><span>{confirmed.length} available</span></div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full bg-pandan transition-all" style={{ width: `${(checkedCount / FIBRE_IDS.length) * 100}%` }} /></div>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {areaNotes(selected.state, selected.propertyType as PropertyType).map((n) => (
                      <li key={n} className="flex gap-2 text-[0.95rem] leading-relaxed text-ink-soft"><Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" /> {n}</li>
                    ))}
                  </ul>
                </Card>

                <section aria-labelledby="checklist-title">
                  <h3 id="checklist-title" className="mb-1 font-display text-xl font-bold">Check each provider</h3>
                  <p className="mb-3 text-muted">Open the official checker, enter your full address (with unit number), then record what it says.</p>
                  <ul className="space-y-3">
                    {FIBRE_IDS.map((id) => {
                      const p = PROVIDERS[id];
                      const status = (selected.statuses[id] ?? "unchecked") as CoverageStatus;
                      return (
                        <li key={id} className="rounded-3xl border border-line bg-white p-4 shadow-card">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2"><ProviderBadge id={id} />{saving === id && <LoaderCircle className="h-4 w-4 animate-spin text-muted" />}</div>
                              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{p.fibreNetwork}</p>
                            </div>
                            <a href={p.fibreCheckUrl} target="_blank" rel="noreferrer" className={cn(btn.secondary, btnSm)}>
                              Official checker <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`${p.name} result`}>
                            {(Object.keys(STATUS_LABEL) as CoverageStatus[]).map((s) => (
                              <button
                                key={s}
                                type="button"
                                aria-pressed={status === s}
                                onClick={() => patch(selected.id, { statuses: { [id]: s } }, id)}
                                className={cn("chip !min-h-10 text-sm", status === s && STATUS_STYLE[s])}
                              >
                                {STATUS_LABEL[s]}
                              </button>
                            ))}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                <Card className={confirmed.length ? "border-pandan/30" : ""}>
                  {confirmed.length ? (
                    <>
                      <p className="flex items-center gap-2 font-display text-xl font-bold"><CircleCheck className="h-6 w-6 text-pandan" /> You can choose from {confirmed.length} provider{confirmed.length > 1 ? "s" : ""}</p>
                      <div className="mt-3 flex flex-wrap gap-2">{confirmed.map((id) => <ProviderBadge key={id} id={id} />)}</div>
                      <Link href={`/plans?kind=fibre&available=${confirmed.join(",")}`} className={cn(btn.accent, "mt-4")}>
                        <Sparkles className="h-5 w-5" /> See plans available here
                      </Link>
                    </>
                  ) : checkedCount === FIBRE_IDS.length ? (
                    <>
                      <p className="font-display text-xl font-bold">No fibre confirmed at this address yet</p>
                      <p className="mt-1 leading-relaxed text-muted">Options: register interest with providers (networks do expand), consider 5G/4G home broadband from mobile providers, or a mobile plan with generous hotspot data.</p>
                      <Link href="/plans?kind=mobile&tab=browse" className={cn(btn.secondary, "mt-4")}><Smartphone className="h-5 w-5" /> Browse mobile plans with hotspot</Link>
                    </>
                  ) : (
                    <>
                      <p className="font-display text-xl font-bold">Your results will appear here</p>
                      <p className="mt-1 text-muted">Mark providers as “Available” once their checker confirms it — then we&apos;ll show only plans you can actually get.</p>
                    </>
                  )}
                  <label className="mt-5 block">
                    <span className="text-sm font-semibold">Notes (e.g. “TIME installed in Block B”, “Unifi said 2–3 weeks”)</span>
                    <textarea
                      key={selected.id}
                      className="field mt-1"
                      rows={3}
                      defaultValue={selected.notes}
                      onBlur={(e) => e.target.value !== selected.notes && patch(selected.id, { notes: e.target.value }, "notes")}
                    />
                  </label>
                  <p className="mt-2 text-sm text-muted">Last updated {relativeTime(selected.updatedAt)}. Saved on this browser.</p>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "signal" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="font-display text-xl font-bold">1. Find your signal reading</h2>
            <p className="mt-1 text-muted">Bars on your phone are vague. The real number is called <strong>RSRP</strong> (in dBm, always negative).</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-cream/60 p-4">
                <p className="font-bold">Android</p>
                <p className="mt-1 leading-relaxed text-ink-soft">Settings → About phone → SIM status (or Status) → look for “Signal strength”, e.g. <span className="font-mono">-92 dBm</span>. Menu names vary by brand.</p>
              </div>
              <div className="rounded-2xl bg-cream/60 p-4">
                <p className="font-bold">iPhone</p>
                <p className="mt-1 leading-relaxed text-ink-soft">Open the Phone app and dial <span className="font-mono font-bold">*3001#12345#</span> then press call to open Field Test mode. Look for <span className="font-mono">rsrp</span> under the serving cell info. (Availability depends on your iOS version.)</p>
              </div>
              <p className="text-sm text-muted">Measure where you actually use your phone — bedroom, living room, office desk.</p>
            </div>
          </Card>
          <Card>
            <h2 className="font-display text-xl font-bold">2. What your reading means</h2>
            <label className="mt-4 block">
              <span className="flex items-baseline justify-between text-sm font-semibold"><span>RSRP</span><span className="font-mono text-2xl font-bold">{rsrp} dBm</span></span>
              <input type="range" min={-140} max={-60} value={rsrp} onChange={(e) => setRsrp(Number(e.target.value))} className="mt-2 w-full" aria-label="RSRP in dBm" />
              <span className="flex justify-between text-xs text-muted"><span>-140 (weak)</span><span>-60 (strong)</span></span>
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-semibold">SINR / RSSNR in dB <span className="font-normal text-muted">(optional)</span></span>
              <input className="field mt-1 max-w-[10rem] font-mono" inputMode="numeric" value={sinr} onChange={(e) => setSinr(e.target.value.replace(/[^\d.-]/g, ""))} placeholder="e.g. 12" />
            </label>
            <div className={cn("mt-5 rounded-2xl p-4", signal.bars >= 4 ? "bg-pandan-soft" : signal.bars === 3 ? "bg-kunyit-soft" : "bg-sambal-soft")} aria-live="polite">
              <div className="flex items-center gap-4">
                <div className="flex h-10 items-end gap-1" aria-hidden>
                  {[1, 2, 3, 4, 5].map((b) => (
                    <span key={b} className={cn("w-2.5 rounded-sm", b <= signal.bars ? "bg-ink" : "bg-ink/15")} style={{ height: `${b * 20}%` }} />
                  ))}
                </div>
                <div>
                  <p className="font-display text-xl font-bold">{signal.title}</p>
                  <p className="leading-relaxed text-ink-soft">{signal.text}</p>
                </div>
              </div>
              {sinrNum !== null && Number.isFinite(sinrNum) && <p className="mt-3 text-ink-soft"><strong>Signal quality:</strong> {rateSINR(sinrNum)}</p>}
            </div>
            <p className="mt-3 text-sm text-muted">This interprets the number you enter — it isn&apos;t a coverage prediction.</p>
          </Card>
          <Card className="lg:col-span-2">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold"><RadioTower className="h-5 w-5" /> Official mobile coverage information</h2>
            <p className="mt-1 text-muted">Check each network&apos;s own coverage map for your area, and ask neighbours which network works indoors.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PROVIDER_IDS.filter((id) => PROVIDERS[id].services.includes("mobile")).map((id) => (
                <a key={id} href={PROVIDERS[id].mobileMapUrl ?? PROVIDERS[id].website} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl border-2 border-line p-3 font-semibold transition hover:border-ink/40">
                  <ProviderBadge id={id} size="sm" /> <ExternalLink className="h-4 w-4 text-muted" />
                </a>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted">Weak signal indoors? Turn on Wi-Fi calling (if your phone and plan support it) so calls use your home internet.</p>
          </Card>
        </div>
      )}

      {tab === "speed" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card>
            <h2 className="font-display text-xl font-bold">Check your speed test result</h2>
            <p className="mt-1 text-muted">Run a speed test (your provider&apos;s app, or any speed test website), then enter the download result here.</p>
            <div className="mt-5">
              <span className="text-sm font-semibold">Your plan speed</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {[100, 200, 300, 500, 600, 1000, 2000].map((v) => (
                  <button key={v} type="button" className="chip !min-h-10" aria-pressed={planSpeed === v} onClick={() => setPlanSpeed(v)}>{speedLabel(v)}</button>
                ))}
              </div>
            </div>
            <label className="mt-5 block">
              <span className="text-sm font-semibold">Measured download speed (Mbps)</span>
              <input className="field mt-1 max-w-[12rem] font-mono text-lg" inputMode="decimal" value={measured} onChange={(e) => setMeasured(e.target.value.replace(/[^\d.]/g, ""))} placeholder="e.g. 142" />
            </label>
            <div className="mt-5">
              <span className="text-sm font-semibold">How did you test?</span>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {([["cable", "LAN cable"], ["wifi-near", "Wi-Fi, near router"], ["wifi-far", "Wi-Fi, other room"]] as const).map(([v, l]) => (
                  <button key={v} type="button" className="chip" aria-pressed={method === v} onClick={() => setMethod(v)}>{l}</button>
                ))}
              </div>
            </div>
          </Card>
          <Card className={speed ? (speed.verdict === "great" ? "border-pandan/30" : speed.verdict === "ok" ? "border-kunyit/60" : "border-sambal/40") : ""}>
            {speed ? (
              <div aria-live="polite">
                <p className="text-sm font-bold uppercase tracking-wider text-muted">Result</p>
                <p className="mt-1 font-display text-5xl font-bold">{speed.pct}%</p>
                <p className="text-muted">of your {speedLabel(planSpeed)} plan</p>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-cream">
                  <div className={cn("h-full rounded-full", speed.verdict === "great" ? "bg-pandan" : speed.verdict === "ok" ? "bg-kunyit" : "bg-sambal")} style={{ width: `${Math.min(100, speed.pct)}%` }} />
                </div>
                <p className="mt-4 text-lg font-semibold">{speed.text}</p>
                <ul className="mt-3 space-y-2">
                  {speed.tips.map((t) => <li key={t} className="flex gap-2 leading-relaxed text-ink-soft"><Info className="mt-1 h-4 w-4 shrink-0 text-sky" /> {t}</li>)}
                </ul>
                {speed.verdict === "low" && (
                  <Link href="/help/new?issue=speed" className={cn(btn.primary, "mt-5")}><LifeBuoy className="h-5 w-5" /> Report slow speed to my provider</Link>
                )}
              </div>
            ) : (
              <EmptyState icon={<Gauge className="h-7 w-7" />} title="Enter your result" text="We'll tell you whether it's your line or your Wi-Fi, and what to do next." />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
