"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Send } from "lucide-react";
import { api } from "@/lib/client";
import { ISSUES, ISSUE_TYPES, type IssueType } from "@/lib/cases";
import { PROVIDERS, PROVIDER_IDS, type ProviderId } from "@/lib/providers";
import { Card, btn, cn } from "./ui";

export interface CasePrefill {
  provider?: ProviderId;
  issue?: IssueType;
  amount?: string;
  label?: string;
  analysis?: string;
}

const PLACEHOLDERS: Partial<Record<IssueType, string>> = {
  unknown_charge: "e.g. My October bill has a RM22 charge called “GameZone Daily”. I never subscribed to it.",
  promo: "e.g. I signed up in March for RM129/month for 24 months, but since September I'm billed RM139.",
  double: "e.g. The monthly fee appears twice on my November bill.",
  after_cancel: "e.g. I terminated on 3 August (ref 1-2345678) and returned the router, but I'm still billed.",
  content: "e.g. Two charges of RM22 for a game subscription I never signed up for.",
  roaming: "e.g. I was in Bangkok 2–6 Sept. I thought roaming was off, but I was charged RM186.",
  late_fee: "e.g. I paid two days late because of a bank transfer delay. First time this has happened.",
  penalty: "e.g. My contract started Jan 2024 so it ended Jan 2026, but I was charged a penalty when I cancelled.",
  speed: "e.g. My 300Mbps plan gives 40–60Mbps on a LAN cable every evening for the past 3 weeks.",
};

export function NewCaseWizard({ prefill }: { prefill: CasePrefill }) {
  const router = useRouter();
  const initialStep = prefill.provider && prefill.issue ? 3 : prefill.provider ? 2 : 1;
  const [step, setStep] = useState(initialStep);
  const [provider, setProvider] = useState<ProviderId | null>(prefill.provider ?? null);
  const [issue, setIssue] = useState<IssueType | null>(prefill.issue ?? null);
  const [billMonth, setBillMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [chargeLabel, setChargeLabel] = useState(prefill.label ?? "");
  const [amount, setAmount] = useState(prefill.amount ?? "");
  const [accountRef, setAccountRef] = useState("");
  const [promised, setPromised] = useState("");
  const [description, setDescription] = useState("");
  const [outcome, setOutcome] = useState(prefill.issue ? ISSUES[prefill.issue].outcomeEn : "");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function chooseIssue(t: IssueType) {
    setIssue(t);
    setOutcome(ISSUES[t].outcomeEn);
    setStep(3);
  }

  async function submit() {
    if (!provider || !issue) return;
    setBusy(true);
    setError("");
    try {
      const d = await api<{ id: string }>("/api/cases", {
        method: "POST",
        json: { provider, issueType: issue, billMonth, chargeLabel, amount, accountRef, promisedPrice: promised, description, desiredOutcome: outcome, contactName: name, analysisId: prefill.analysis },
      });
      router.push(`/help/${d.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the case.");
      setBusy(false);
    }
  }

  const steps = ["Provider", "Problem", "Details"];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <ol className="mb-6 flex items-center gap-2" aria-label="Progress">
        {steps.map((s, i) => {
          const n = i + 1;
          const done = step > n;
          return (
            <li key={s} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => n < step && setStep(n)}
                disabled={n >= step}
                aria-current={step === n ? "step" : undefined}
                className={cn("flex items-center gap-2 font-semibold", step === n ? "text-ink" : done ? "text-pandan-dark" : "text-muted")}
              >
                <span className={cn("grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-bold", step === n ? "border-ink bg-ink text-paper" : done ? "border-pandan bg-pandan text-white" : "border-line bg-white")}>
                  {done ? <Check className="h-4 w-4" /> : n}
                </span>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {n < steps.length && <span className={cn("h-0.5 flex-1 rounded", done ? "bg-pandan" : "bg-line")} aria-hidden />}
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <Card className="md:p-8">
          <h2 className="font-display text-2xl font-bold">Which provider is this about?</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PROVIDER_IDS.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={provider === id}
                onClick={() => { setProvider(id); setStep(issue ? 3 : 2); }}
                className={cn("relative overflow-hidden rounded-2xl border-2 bg-white p-4 text-left transition hover:-translate-y-0.5", provider === id ? "border-ink" : "border-line hover:border-ink/40")}
              >
                <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: PROVIDERS[id].color }} aria-hidden />
                <span className="block font-display text-xl font-bold">{PROVIDERS[id].name}</span>
                <span className="text-sm text-muted">{PROVIDERS[id].services.map((s) => (s === "fibre" ? "Home fibre" : "Mobile")).join(" · ")}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="md:p-8">
          <h2 className="font-display text-2xl font-bold">What&apos;s the problem?</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {ISSUE_TYPES.map((t) => (
              <button key={t} type="button" aria-pressed={issue === t} onClick={() => chooseIssue(t)} className={cn("flex gap-3 rounded-2xl border-2 bg-white p-4 text-left transition hover:-translate-y-0.5", issue === t ? "border-ink" : "border-line hover:border-ink/40")}>
                <span className="text-2xl" aria-hidden>{ISSUES[t].emoji}</span>
                <span>
                  <span className="block font-display text-lg font-bold leading-snug">{ISSUES[t].label}</span>
                  <span className="text-[0.95rem] text-muted">{ISSUES[t].hint}</span>
                </span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setStep(1)} className={cn(btn.ghost, "mt-5")}><ArrowLeft className="h-5 w-5" /> Back</button>
        </Card>
      )}

      {step === 3 && provider && issue && (
        <Card className="md:p-8">
          <p className="text-sm font-bold uppercase tracking-wider text-muted">{PROVIDERS[provider].name} · {ISSUES[issue].label}</p>
          <h2 className="mt-1 font-display text-2xl font-bold">A few details</h2>
          <p className="mt-1 text-muted">Only what&apos;s needed for your message. Fill in what you know — you can edit everything later.</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="font-semibold">Which bill?</span>
              <input type="month" className="field mt-1" value={billMonth} onChange={(e) => setBillMonth(e.target.value)} />
            </label>
            <label className="block">
              <span className="font-semibold">Amount in question (RM)</span>
              <input className="field mt-1" inputMode="decimal" placeholder="e.g. 44.00" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
            </label>
            <label className="block sm:col-span-2">
              <span className="font-semibold">Name of the charge on your bill</span>
              <input className="field mt-1" placeholder="e.g. Content Subscription - GameZone Daily" value={chargeLabel} onChange={(e) => setChargeLabel(e.target.value)} maxLength={140} />
            </label>
            <label className="block">
              <span className="font-semibold">Account number — last 4 digits only</span>
              <input className="field mt-1 font-mono tracking-widest" inputMode="numeric" maxLength={4} placeholder="e.g. 6789" value={accountRef} onChange={(e) => setAccountRef(e.target.value.replace(/[^A-Za-z0-9]/g, ""))} />
              <span className="mt-1 block text-sm text-muted">For your privacy we never store full account numbers.</span>
            </label>
            {issue === "promo" ? (
              <label className="block">
                <span className="font-semibold">Price you were promised (RM/month)</span>
                <input className="field mt-1" inputMode="decimal" placeholder="e.g. 129" value={promised} onChange={(e) => setPromised(e.target.value.replace(/[^\d.]/g, ""))} />
              </label>
            ) : (
              <label className="block">
                <span className="font-semibold">Your name <span className="font-normal text-muted">(optional, for the letter)</span></span>
                <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              </label>
            )}
            <label className="block sm:col-span-2">
              <span className="font-semibold">What happened?</span>
              <textarea className="field mt-1" rows={4} placeholder={PLACEHOLDERS[issue] ?? "Describe the problem in a sentence or two."} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={3000} />
            </label>
            <label className="block sm:col-span-2">
              <span className="font-semibold">What would you like them to do?</span>
              <textarea className="field mt-1" rows={2} value={outcome} onChange={(e) => setOutcome(e.target.value)} maxLength={400} />
            </label>
            {issue === "promo" && (
              <label className="block">
                <span className="font-semibold">Your name <span className="font-normal text-muted">(optional)</span></span>
                <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              </label>
            )}
          </div>
          {error && <p role="alert" className="mt-5 rounded-2xl bg-sambal-soft px-4 py-3 text-[#a1260f]">{error}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep(2)} className={btn.ghost}><ArrowLeft className="h-5 w-5" /> Back</button>
            <button type="button" onClick={submit} disabled={busy} className={cn(btn.primary, "text-lg")}>
              {busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />} Create case &amp; draft my message <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
