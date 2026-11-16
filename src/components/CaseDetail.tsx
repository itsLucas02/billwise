"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, CalendarDays, Check, CircleCheck, Clock, Copy, ExternalLink, ListChecks, LoaderCircle, Mail, MessageCircle, Phone, Scale, Send, Sparkles, Trash2, TriangleAlert, Undo2,
} from "lucide-react";
import { REWRITE_ACTIONS, type RewriteAction } from "@/lib/ai";
import { api } from "@/lib/client";
import { ISSUES, STATUS_INFO, draftMessage, type CaseStatus, type Channel, type IssueType } from "@/lib/cases";
import { ESCALATION, PROVIDERS, isProviderId, type ProviderId } from "@/lib/providers";
import { daysSince, fmtDate, rm } from "@/lib/format";
import { Badge, Card, EmptyState, ProviderBadge, btn, btnSm, cn } from "./ui";

interface CaseRow {
  id: string;
  provider: string;
  issueType: string;
  title: string;
  chargeLabel: string | null;
  amount: number | null;
  billMonth: string | null;
  accountRef: string | null;
  description: string;
  desiredOutcome: string | null;
  promisedPrice: number | null;
  contactName: string | null;
  status: string;
  providerRef: string | null;
  followUpOn: string | null;
  contactedAt: string | null;
  resolvedAmount: number | null;
  analysisId: string | null;
  createdAt: string;
}
interface EventRow { id: string; kind: string; text: string; createdAt: string }

const FLOW: CaseStatus[] = ["open", "contacted", "awaiting", "resolved"];
const EVENT_ICON: Record<string, typeof Clock> = { created: Send, status: CircleCheck, note: MessageCircle, contact: Phone, reply: Mail, followup: CalendarDays, ai: Sparkles };

export function CaseDetail({ id }: { id: string }) {
  const router = useRouter();
  const [item, setItem] = useState<CaseRow | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [error, setError] = useState("");
  const [channel, setChannel] = useState<Channel>("email");
  const [lang, setLang] = useState<"en" | "ms">("en");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [aiBusy, setAiBusy] = useState<RewriteAction | null>(null);
  const [aiError, setAiError] = useState("");
  const [undo, setUndo] = useState<{ key: string; text: string } | null>(null);
  const [aiDone, setAiDone] = useState("");
  const [note, setNote] = useState("");
  const [noteKind, setNoteKind] = useState("contact");
  const [ref, setRef] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [resolving, setResolving] = useState(false);
  const [recovered, setRecovered] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  // The checklist only renders after the case loads, so reading storage lazily is hydration-safe.
  const [checked, setChecked] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const v: unknown = JSON.parse(localStorage.getItem(`bw_case_${id}`) ?? "[]");
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  });

  const load = useCallback(
    () =>
      api<{ item: CaseRow; events: EventRow[] }>(`/api/cases/${id}`)
        .then((d) => {
          setItem(d.item);
          setEvents(d.events);
          setRef(d.item.providerRef ?? "");
          setFollowUp(d.item.followUpOn ?? "");
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : "Case not found")),
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const provider: ProviderId | null = item && isProviderId(item.provider) ? item.provider : null;
  const issueType = (item?.issueType ?? "other") as IssueType;
  const issue = ISSUES[issueType] ?? ISSUES.other;

  const generated = useMemo(() => {
    if (!item || !provider) return "";
    return draftMessage(
      {
        provider,
        issueType,
        chargeLabel: item.chargeLabel,
        amount: item.amount,
        billMonth: item.billMonth,
        accountRef: item.accountRef,
        description: item.description,
        desiredOutcome: lang === "en" ? item.desiredOutcome : null,
        promisedPrice: item.promisedPrice,
        providerRef: item.providerRef,
        name: item.contactName,
      },
      lang,
      channel,
    );
  }, [item, provider, issueType, lang, channel]);

  // Drafts are derived from the case; manual edits are remembered per channel/language variant.
  const draft = edits[generated] ?? generated;
  const setDraft = (value: string) => setEdits((m) => ({ ...m, [generated]: value }));

  async function rewrite(action: RewriteAction) {
    setAiBusy(action);
    setAiError("");
    setAiDone("");
    try {
      const d = await api<{ text: string; remaining: number }>(`/api/cases/${id}/rewrite`, { method: "POST", json: { action, lang, draft } });
      // Keep the pre-AI text across several rewrites so Undo returns to the original.
      setUndo((u) => (u?.key === generated ? u : { key: generated, text: draft }));
      setDraft(d.text);
      setAiDone(`Draft rewritten. ${d.remaining} AI rewrite${d.remaining === 1 ? "" : "s"} left today.`);
      load();
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "The AI couldn't rewrite this just now. Your draft is unchanged.");
    } finally {
      setAiBusy(null);
    }
  }

  async function update(body: Record<string, unknown>, key: string) {
    setBusy(key);
    try {
      await api(`/api/cases/${id}`, { method: "PATCH", json: body });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function addNote() {
    if (!note.trim()) return;
    setBusy("note");
    try {
      await api(`/api/cases/${id}`, { method: "POST", json: { text: note, kind: noteKind } });
      setNote("");
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (permissions, non-HTTPS, embedded views): select the text so the user can copy by hand.
      setCopied(false);
      setCopyFailed(true);
      const el = document.getElementById("draft") as HTMLTextAreaElement | null;
      el?.focus();
      el?.select();
    }
  }

  function toggleCheck(e: string) {
    const next = checked.includes(e) ? checked.filter((x) => x !== e) : [...checked, e];
    setChecked(next);
    try {
      localStorage.setItem(`bw_case_${id}`, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  async function remove() {
    if (!confirm("Delete this case and its history?")) return;
    await api(`/api/cases/${id}`, { method: "DELETE" }).catch(() => {});
    router.push("/help");
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState title="We couldn't find this case" text="It may have been deleted, or it was created on a different browser." action={<Link href="/help" className={btn.primary}>Back to Billing Help</Link>} />
      </div>
    );
  }
  if (!item || !provider) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          title="We couldn't find this case"
          text="It was saved under an older set of provider names. Delete it and start a new case to see it in the current directory."
          action={<Link href="/help" className={btn.primary}>Back to Billing Help</Link>}
        />
      </div>
    );
  }

  const p = PROVIDERS[provider];
  const status = item.status as CaseStatus;
  const info = STATUS_INFO[status] ?? STATUS_INFO.open;
  const days = item.contactedAt ? daysSince(item.contactedAt) : null;
  const active = status !== "resolved" && status !== "closed";
  const flowIndex = status === "escalated" ? 2 : status === "closed" ? 3 : FLOW.indexOf(status);
  const today = new Date().toISOString().slice(0, 10);
  const emailChannel = p.channels.find((c) => c.kind === "email");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/help" className={cn(btn.ghost, btnSm)}><ArrowLeft className="h-4 w-4" /> All cases</Link>

      <section className="mt-4 rounded-3xl border border-line bg-white p-5 shadow-card md:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <ProviderBadge id={provider} />
          <Badge tone={info.tone}>{info.label}</Badge>
          <span className="text-sm text-muted">Opened {fmtDate(item.createdAt)}</span>
          {item.analysisId && <Link href={`/decoder/${item.analysisId}`} className="text-sm font-semibold text-pandan-dark underline">View decoded bill</Link>}
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">{issue.emoji} {item.title}</h1>
        <p className="mt-1 text-lg text-ink-soft">
          {item.amount ? <>Amount in question: <strong>{rm(item.amount)}</strong></> : "No amount recorded"}
          {item.resolvedAmount ? <> · Recovered: <strong className="text-pandan-dark">{rm(item.resolvedAmount)}</strong></> : null}
        </p>

        <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Case progress">
          {["Prepare", "Raise it", "Wait for reply", "Resolved"].map((s, i) => (
            <li key={s} className="text-center">
              <div className={cn("h-2 rounded-full", i <= flowIndex ? (status === "escalated" && i === 2 ? "bg-sambal" : "bg-pandan") : "bg-cream")} />
              <p className={cn("mt-2 text-xs font-semibold sm:text-sm", i <= flowIndex ? "text-ink" : "text-muted")}>{status === "escalated" && i === 2 ? "Escalated" : s}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-wrap gap-2">
          {status === "open" && <button type="button" onClick={() => update({ status: "contacted" }, "s")} className={btn.primary}><Phone className="h-5 w-5" /> I&apos;ve contacted {p.name}</button>}
          {status === "contacted" && <button type="button" onClick={() => update({ status: "awaiting" }, "s")} className={btn.primary}><Clock className="h-5 w-5" /> Now waiting for their reply</button>}
          {active && status !== "open" && status !== "escalated" && <button type="button" onClick={() => update({ status: "escalated" }, "s")} className={btn.danger}><Scale className="h-5 w-5" /> I escalated to CFM</button>}
          {active && <button type="button" onClick={() => setResolving(!resolving)} className={btn.accent}><CircleCheck className="h-5 w-5" /> Mark resolved</button>}
          {!active && <button type="button" onClick={() => update({ status: "awaiting" }, "s")} className={btn.secondary}>Reopen case</button>}
          {active && <button type="button" onClick={() => update({ status: "closed" }, "s")} className={btn.ghost}>Close without resolution</button>}
          {busy === "s" && <LoaderCircle className="h-6 w-6 animate-spin self-center text-muted" />}
        </div>
        {resolving && (
          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl bg-pandan-soft/60 p-4">
            <label className="block">
              <span className="text-sm font-semibold">Amount refunded or credited (RM)</span>
              <input className="field mt-1 max-w-[12rem]" inputMode="decimal" value={recovered} onChange={(e) => setRecovered(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0.00" />
            </label>
            <button type="button" className={btn.accent} onClick={() => { update({ status: "resolved", resolvedAmount: recovered }, "s"); setResolving(false); }}><Check className="h-5 w-5" /> Confirm resolved</button>
          </div>
        )}

        {active && days !== null && (
          <div className={cn("mt-5 rounded-2xl p-4", days > 22 ? "bg-sambal-soft" : days > 6 ? "bg-kunyit-soft" : "bg-sky-soft")}>
            <p className="flex items-center gap-2 font-semibold"><Clock className="h-5 w-5" /> {days === 0 ? "Raised today" : `Raised ${days} day${days > 1 ? "s" : ""} ago`}</p>
            <ul className="mt-2 grid gap-1 sm:grid-cols-3">
              {ESCALATION.gcc.map((g) => (
                <li key={g.days} className="flex items-start gap-2 text-sm">
                  {days >= g.days ? <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#a1260f]" /> : <Check className="mt-0.5 h-4 w-4 shrink-0 text-pandan-dark" />}
                  <span>{g.text}</span>
                </li>
              ))}
            </ul>
            {days > 6 && status !== "escalated" && <p className="mt-2 text-sm font-semibold">Not happy with their answer, or no proposed resolution in time? You can escalate to CFM — details below.</p>}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-xl font-bold">Your message, ready to send</h2>
            <p className="text-muted">Edit anything before copying. Use it by email, live chat, or as a script when you call.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div role="tablist" aria-label="Channel" className="flex flex-wrap gap-2">
                {([["email", "Email / letter", Mail], ["chat", "Live chat / WhatsApp", MessageCircle], ["call", "Phone call script", Phone]] as const).map(([v, l, Icon]) => (
                  <button key={v} role="tab" type="button" aria-selected={channel === v} onClick={() => setChannel(v)} className={cn("chip !min-h-10 text-sm", channel === v && "!border-ink !bg-ink !text-paper")}>
                    <Icon className="h-4 w-4" /> {l}
                  </button>
                ))}
              </div>
              <div role="group" aria-label="Language" className="ml-auto flex rounded-full border-2 border-line p-0.5">
                {([["en", "English"], ["ms", "Bahasa Malaysia"]] as const).map(([v, l]) => (
                  <button key={v} type="button" aria-pressed={lang === v} onClick={() => setLang(v)} className={cn("rounded-full px-3 py-1.5 text-sm font-semibold", lang === v ? "bg-kunyit text-ink" : "text-muted")}>{l}</button>
                ))}
              </div>
            </div>
            <label className="sr-only" htmlFor="draft">Message draft</label>
            <textarea id="draft" aria-busy={aiBusy !== null} className="field mt-4 font-mono text-[0.92rem] leading-relaxed" rows={channel === "chat" ? 7 : 16} value={draft} onChange={(e) => { setDraft(e.target.value); setUndo(null); setAiDone(""); }} />
            <div className="mt-3 rounded-2xl bg-cream/60 p-3">
              <div role="group" aria-label="AI rewrite" className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm font-semibold"><Sparkles className="h-4 w-4" /> AI rewrite</span>
                {(Object.keys(REWRITE_ACTIONS) as RewriteAction[]).map((a) => (
                  <button key={a} type="button" disabled={aiBusy !== null} onClick={() => rewrite(a)} className={cn(btn.secondary, btnSm, "disabled:opacity-60")}>
                    {aiBusy === a && <LoaderCircle className="h-4 w-4 animate-spin" />} {REWRITE_ACTIONS[a].label}
                  </button>
                ))}
                {undo?.key === generated && (
                  <button type="button" disabled={aiBusy !== null} onClick={() => { setDraft(undo.text); setUndo(null); setAiDone("Original draft restored."); }} className={cn(btn.ghost, btnSm, "disabled:opacity-60")}>
                    <Undo2 className="h-4 w-4" /> Undo
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-muted">Sends this draft and the case details (plus your timeline notes, for Add my notes) to an AI service. It only rewords what&apos;s here; check the result before you send it.</p>
              <p role="status" className="mt-1 text-sm font-semibold empty:hidden">{aiDone}</p>
              {aiError && <p role="alert" className="mt-2 text-sm font-semibold text-[#a1260f]">{aiError}</p>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={copy} className={btn.primary}>{copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />} {copied ? "Copied!" : "Copy message"}</button>
              {channel === "email" && emailChannel && (
                <a className={btn.secondary} href={`${emailChannel.href}?subject=${encodeURIComponent(draft.split("\n")[0].replace(/^(Subject|Subjek):\s*/, ""))}&body=${encodeURIComponent(draft.split("\n").slice(2).join("\n"))}`}>
                  <Mail className="h-5 w-5" /> Open in email app
                </a>
              )}
              {status === "open" && <button type="button" onClick={() => update({ status: "contacted" }, "s")} className={btn.ghost}>I&apos;ve sent it</button>}
            </div>
            {copyFailed && <p role="status" className="mt-2 text-sm font-semibold">Your browser blocked copying. The message is selected — press Ctrl+C (or ⌘C on Mac) to copy it.</p>}
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 font-display text-xl font-bold"><ListChecks className="h-5 w-5" /> Before you contact them</h2>
            <p className="mt-3 font-semibold">Have these ready:</p>
            <ul className="mt-2 space-y-2">
              {issue.evidence.map((e) => (
                <li key={e}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-1.5 hover:bg-cream/60">
                    <input type="checkbox" className="mt-1 h-5 w-5" checked={checked.includes(e)} onChange={() => toggleCheck(e)} />
                    <span className={cn(checked.includes(e) && "text-muted line-through")}>{e}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-semibold">Questions to ask:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-ink-soft">{issue.ask.map((a) => <li key={a}>{a}</li>)}</ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-xl font-bold">Contact {p.name}</h2>
            <ul className="mt-3 space-y-2">
              {p.channels.map((c) => (
                <li key={c.label + c.value}>
                  <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex items-center gap-3 rounded-2xl border-2 border-line px-3 py-2.5 transition hover:border-ink/40">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream">
                      {c.kind === "phone" ? <Phone className="h-5 w-5" /> : c.kind === "email" ? <Mail className="h-5 w-5" /> : c.kind === "web" ? <ExternalLink className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold">{c.value}</span>
                      <span className="text-sm text-muted">{c.label}{c.note ? ` · ${c.note}` : ""}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted">Self-service: {p.app}</p>
          </Card>

          <Card>
            <h2 className="font-display text-xl font-bold">Reference &amp; reminders</h2>
            <label className="mt-3 block">
              <span className="text-sm font-semibold">Provider&apos;s reference / ticket number</span>
              <div className="mt-1 flex gap-2">
                <input className="field" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. 1-23456789" maxLength={60} />
                <button type="button" className={cn(btn.secondary, btnSm, "!min-h-12 shrink-0")} disabled={ref === (item.providerRef ?? "")} onClick={() => update({ providerRef: ref }, "ref")}>Save</button>
              </div>
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-semibold">Remind me to follow up on</span>
              <div className="mt-1 flex gap-2">
                <input type="date" className="field" value={followUp} min={today} onChange={(e) => setFollowUp(e.target.value)} />
                <button type="button" className={cn(btn.secondary, btnSm, "!min-h-12 shrink-0")} disabled={followUp === (item.followUpOn ?? "")} onClick={() => update({ followUpOn: followUp || null }, "fu")}>Save</button>
              </div>
            </label>
            {item.followUpOn && item.followUpOn <= today && active && <p className="mt-2 rounded-xl bg-sambal-soft px-3 py-2 text-sm font-semibold text-[#a1260f]">Follow-up is due — time to chase {p.name}.</p>}
          </Card>

          <Card>
            <h2 className="font-display text-xl font-bold">Timeline</h2>
            <ol className="mt-4 space-y-4 border-l-2 border-line pl-5">
              {events.map((e) => {
                const Icon = EVENT_ICON[e.kind] ?? MessageCircle;
                return (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[2.05rem] grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-cream"><Icon className="h-3.5 w-3.5" /></span>
                    <p className="leading-relaxed">{e.text}</p>
                    <p className="text-sm text-muted">{fmtDate(e.createdAt)} · {new Date(e.createdAt).toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" })}</p>
                  </li>
                );
              })}
            </ol>
            <div className="mt-5 rounded-2xl bg-cream/60 p-3">
              <label className="text-sm font-semibold" htmlFor="note">Add an update</label>
              <select className="field mt-1 !min-h-10 !py-1.5" value={noteKind} onChange={(e) => setNoteKind(e.target.value)} aria-label="Update type">
                <option value="contact">I contacted them</option>
                <option value="reply">They replied</option>
                <option value="note">General note</option>
              </select>
              <textarea id="note" className="field mt-2" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Called 100, spoke to Aina, promised refund in 5 working days." />
              <button type="button" onClick={addNote} disabled={!note.trim() || busy === "note"} className={cn(btn.primary, btnSm, "mt-2")}>
                {busy === "note" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Add to timeline
              </button>
            </div>
          </Card>

          <Card className={status === "escalated" || (days ?? 0) > 7 ? "border-sambal/30" : ""}>
            <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Scale className="h-5 w-5" /> Escalating to CFM</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">If {p.name} doesn&apos;t resolve it, lodge a complaint with the {ESCALATION.cfm.name}.</p>
            <ul className="mt-3 space-y-1.5 text-[0.95rem]">
              <li>• Portal: <a className="font-semibold underline" href={ESCALATION.cfm.portal} target="_blank" rel="noreferrer">aduan.skmm.gov.my</a></li>
              <li>• App: {ESCALATION.cfm.app}</li>
              <li>• CFM hotline: <a className="font-semibold underline" href={`tel:${ESCALATION.cfm.hotline.replace(/-/g, "")}`}>{ESCALATION.cfm.hotline}</a></li>
              <li>• MCMC Consumer Care: <a className="font-semibold underline" href={`tel:${ESCALATION.mcmc.hotline.replace(/-/g, "")}`}>{ESCALATION.mcmc.hotline}</a></li>
            </ul>
            <p className="mt-3 text-sm text-muted">Include your provider reference number{item.providerRef ? ` (${item.providerRef})` : ""}, the timeline above, and copies of your bills.</p>
          </Card>

          <button type="button" onClick={remove} className={cn(btn.danger, btnSm)}><Trash2 className="h-4 w-4" /> Delete case</button>
        </div>
      </div>
    </div>
  );
}
