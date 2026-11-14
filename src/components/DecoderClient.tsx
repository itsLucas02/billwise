"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, ChevronDown, ClipboardPaste, FileText, History, ListPlus, LoaderCircle, Plus, ScanText, Trash2, Wand2 } from "lucide-react";
import { api } from "@/lib/client";
import type { Analysis } from "@/lib/decoder";
import { rm, relativeTime, toNum } from "@/lib/format";
import { PROVIDERS, PROVIDER_IDS, type ProviderId } from "@/lib/providers";
import { SAMPLE_BILLS, type SampleBill } from "@/lib/samples";
import { AnalysisView } from "./AnalysisView";
import { Badge, Card, ProviderBadge, SimTag, btn, btnSm, cn } from "./ui";

type Mode = "paste" | "sample" | "manual";
interface Row { id: number; label: string; amount: string }
interface HistoryItem { id: string; title: string; provider: string | null; total: number; score: number; createdAt: string }
interface Result { id: string; title: string; createdAt: string; analysis: Analysis }

const GLOSSARY = [
  { t: "SST (Service tax)", d: "Government tax on your bill. For telco services it's 6%." },
  { t: "Rebate", d: "A discount for a set number of months. When it ends, your bill rises." },
  { t: "Prorated", d: "Charged only for part of a month, e.g. after installation or a plan change." },
  { t: "Commitment / contract", d: "The months you agreed to stay. Leaving early can mean a penalty." },
  { t: "Content / VAS", d: "Third-party services (games, ringtones) billed through your line." },
  { t: "Roaming & IDD", d: "Using your line abroad (roaming) or calling overseas numbers (IDD)." },
  { t: "Share / supplementary line", d: "An extra SIM on your account for family or another device." },
];

const QUICK_ROWS = ["Monthly plan fee", "Service Tax 6%", "Late payment charge", "Device instalment", "Roaming data", "Supplementary line", "Promotional rebate"];

export function DecoderClient({ initialSample }: { initialSample?: string }) {
  const [mode, setMode] = useState<Mode>(initialSample ? "sample" : "paste");
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([
    { id: 1, label: "Monthly plan fee", amount: "" },
    { id: 2, label: "Service Tax 6%", amount: "" },
  ]);
  const [provider, setProvider] = useState<ProviderId | "">("");
  const [promised, setPromised] = useState("");
  const [usual, setUsual] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const loadHistory = useCallback(() => {
    api<{ items: HistoryItem[] }>("/api/decoder").then((d) => setHistory(d.items)).catch(() => {});
  }, []);

  const analyse = useCallback(
    async (payload: { text: string; provider: string; promisedPrice: number | null; usualAmount: number | null; source: string; title?: string }, key: string) => {
      setBusy(key);
      setError("");
      try {
        const d = await api<Result>("/api/decoder", { method: "POST", json: payload });
        setResult(d);
        loadHistory();
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setBusy(null);
      }
    },
    [loadHistory],
  );

  const runSample = useCallback(
    (s: SampleBill) => {
      setText(s.text);
      setProvider(s.provider);
      setPromised(s.promised ? String(s.promised) : "");
      setUsual(s.usual ? String(s.usual) : "");
      analyse({ text: s.text, provider: s.provider, promisedPrice: s.promised ?? null, usualAmount: s.usual ?? null, source: "sample", title: `Sample: ${s.title}` }, s.id);
    },
    [analyse],
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const s = initialSample ? SAMPLE_BILLS.find((x) => x.id === initialSample) : undefined;
    if (!s || started.current) return;
    const t = setTimeout(() => {
      started.current = true;
      runSample(s);
    }, 0);
    return () => clearTimeout(t);
  }, [initialSample, runSample]);

  function submit() {
    const body =
      mode === "manual"
        ? rows
            .filter((r) => r.label.trim() && r.amount.trim() && Number.isFinite(Number(r.amount)))
            .map((r) => `${r.label.trim()}    ${Number(r.amount).toFixed(2)}`)
            .join("\n")
        : text;
    if (body.trim().length < 6) {
      setError(mode === "manual" ? "Add at least one charge with an amount." : "Paste your bill text first — or try a sample bill.");
      return;
    }
    analyse({ text: body, provider, promisedPrice: toNum(promised), usualAmount: toNum(usual), source: mode === "manual" ? "manual" : "paste" }, "main");
  }

  async function pasteClipboard() {
    try {
      const t = await navigator.clipboard.readText();
      if (t) setText(t);
    } catch {
      setError("Your browser blocked clipboard access. Long-press (or Ctrl+V) inside the box to paste instead.");
    }
  }

  const tabs: { id: Mode; label: string; icon: typeof FileText }[] = [
    { id: "paste", label: "Paste bill text", icon: FileText },
    { id: "sample", label: "Try a sample", icon: Wand2 },
    { id: "manual", label: "Type charges", icon: ListPlus },
  ];

  return (
    <>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_330px]">
        <Card className="!p-0 overflow-hidden">
          <div role="tablist" aria-label="How do you want to add your bill?" className="scrollbar-none flex gap-1 overflow-x-auto border-b border-line bg-cream/50 p-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={mode === t.id}
                onClick={() => setMode(t.id)}
                className={cn(
                  "flex min-h-12 shrink-0 items-center gap-2 rounded-2xl px-4 font-semibold transition",
                  mode === t.id ? "bg-white text-ink shadow-card" : "text-muted hover:text-ink",
                )}
              >
                <t.icon className="h-5 w-5" aria-hidden /> {t.label}
              </button>
            ))}
          </div>

          <div className="p-5 md:p-6" role="tabpanel">
            {mode === "paste" && (
              <div>
                <label htmlFor="bill-text" className="font-display text-lg font-bold">Paste the charges from your bill</label>
                <p className="mt-1 text-muted">Open your e-bill (PDF or app), select the charges, copy, and paste here. You don&apos;t need to include your name or address.</p>
                <textarea
                  id="bill-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={11}
                  spellCheck={false}
                  placeholder={"For example:\nUnifi Home 300Mbps Monthly Fee     139.00\nLate Payment Charge                 10.00\nService Tax 6%                      8.94\nTotal Current Charges              157.94"}
                  className="field mt-4 font-mono text-[0.95rem] leading-relaxed"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={pasteClipboard} className={cn(btn.secondary, btnSm)}><ClipboardPaste className="h-4 w-4" /> Paste from clipboard</button>
                  {text && <button type="button" onClick={() => setText("")} className={cn(btn.ghost, btnSm)}><Trash2 className="h-4 w-4" /> Clear</button>}
                </div>
              </div>
            )}

            {mode === "sample" && (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-lg font-bold">Pick a sample bill to see BillWise in action</p>
                  <SimTag />
                </div>
                <p className="mt-1 text-muted">These bills are simulated (invented accounts and amounts) but use real plan names and Malaysia&apos;s 6% telco service tax.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {SAMPLE_BILLS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => runSample(s)}
                      disabled={busy !== null}
                      className="group flex flex-col items-start rounded-2xl border-2 border-line bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-ink/40 disabled:opacity-60"
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        <ProviderBadge id={s.provider} size="sm" />
                        {busy === s.id ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ScanText className="h-5 w-5 text-muted group-hover:text-ink" />}
                      </span>
                      <span className="mt-2 font-display text-lg font-bold leading-snug">{s.title}</span>
                      <span className="mt-1 text-[0.95rem] text-muted">{s.scenario}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === "manual" && (
              <div>
                <p className="font-display text-lg font-bold">Type each charge and its amount</p>
                <p className="mt-1 text-muted">Use a minus sign for discounts or rebates (e.g. −10).</p>
                <div className="mt-4 space-y-2">
                  {rows.map((r, i) => (
                    <div key={r.id} className="flex items-center gap-2">
                      <label className="sr-only" htmlFor={`row-l-${r.id}`}>Charge {i + 1} description</label>
                      <input id={`row-l-${r.id}`} className="field flex-1" placeholder="e.g. Monthly plan fee" value={r.label} onChange={(e) => setRows(rows.map((x) => (x.id === r.id ? { ...x, label: e.target.value } : x)))} />
                      <label className="sr-only" htmlFor={`row-a-${r.id}`}>Charge {i + 1} amount in RM</label>
                      <div className="relative w-32 shrink-0">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">RM</span>
                        <input id={`row-a-${r.id}`} inputMode="decimal" className="field !pl-11 text-right font-mono" placeholder="0.00" value={r.amount} onChange={(e) => setRows(rows.map((x) => (x.id === r.id ? { ...x, amount: e.target.value } : x)))} />
                      </div>
                      <button type="button" aria-label={`Remove charge ${i + 1}`} onClick={() => setRows(rows.filter((x) => x.id !== r.id))} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-muted hover:bg-sambal-soft hover:text-sambal">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className={cn(btn.secondary, btnSm)} onClick={() => setRows([...rows, { id: Date.now(), label: "", amount: "" }])}><Plus className="h-4 w-4" /> Add a charge</button>
                  {QUICK_ROWS.map((q) => (
                    <button key={q} type="button" className="chip !min-h-10 text-sm" onClick={() => setRows([...rows, { id: Date.now(), label: q, amount: "" }])}>+ {q}</button>
                  ))}
                </div>
              </div>
            )}

            {mode !== "sample" && (
              <details className="mt-6 rounded-2xl border border-line bg-cream/40">
                <summary className="flex items-center justify-between gap-3 px-4 py-3 font-semibold">
                  <span>Add details for a sharper check <span className="font-normal text-muted">(optional)</span></span>
                  <ChevronDown className="rotate-on-open h-5 w-5 transition" />
                </summary>
                <div className="grid gap-4 px-4 pb-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-semibold">Provider</span>
                    <select className="field mt-1" value={provider} onChange={(e) => setProvider(e.target.value as ProviderId | "")}>
                      <option value="">Detect automatically</option>
                      {PROVIDER_IDS.map((id) => <option key={id} value={id}>{PROVIDERS[id].name}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold">Price you were promised</span>
                    <input className="field mt-1" inputMode="decimal" placeholder="RM / month" value={promised} onChange={(e) => setPromised(e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold">What you usually pay</span>
                    <input className="field mt-1" inputMode="decimal" placeholder="RM / month" value={usual} onChange={(e) => setUsual(e.target.value)} />
                  </label>
                </div>
              </details>
            )}

            {error && <p role="alert" className="mt-4 rounded-2xl bg-sambal-soft px-4 py-3 font-medium text-[#a1260f]">{error}</p>}

            {mode !== "sample" && (
              <button type="button" onClick={submit} disabled={busy !== null} className={cn(btn.primary, "mt-5 w-full text-lg sm:w-auto")}>
                {busy === "main" ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ScanText className="h-5 w-5" />}
                {busy === "main" ? "Decoding…" : "Decode my bill"}
              </button>
            )}
          </div>
        </Card>

        <aside className="space-y-5">
          <Card>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold"><History className="h-5 w-5" /> Your decoded bills</h2>
            {history.length ? (
              <ul className="mt-3 space-y-2">
                {history.slice(0, 6).map((h) => (
                  <li key={h.id}>
                    <Link href={`/decoder/${h.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-line px-3 py-2.5 transition hover:border-ink/30">
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{h.title}</span>
                        <span className="text-sm text-muted">{rm(h.total)} · {relativeTime(h.createdAt)}</span>
                      </span>
                      <Badge tone={h.score >= 85 ? "green" : h.score >= 60 ? "yellow" : "red"}>{h.score}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-muted">Bills you decode are saved here on this browser.</p>
            )}
          </Card>
          <Card className="bg-cream/50">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold"><BookOpen className="h-5 w-5" /> Bill words, explained</h2>
            <dl className="mt-3 space-y-3">
              {GLOSSARY.map((g) => (
                <div key={g.t}>
                  <dt className="font-semibold">{g.t}</dt>
                  <dd className="text-[0.95rem] leading-relaxed text-muted">{g.d}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </aside>
      </div>

      <div ref={resultRef} className="mx-auto max-w-6xl scroll-mt-20 px-4">
        {result && <AnalysisView analysis={result.analysis} id={result.id} title={result.title} createdAt={result.createdAt} />}
      </div>
    </>
  );
}
