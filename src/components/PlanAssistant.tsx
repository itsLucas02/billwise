"use client";

import { useRef, useState, type FormEvent } from "react";
import { LoaderCircle, MessageCircleQuestion, Send } from "lucide-react";
import { api } from "@/lib/client";
import type { ChatTurn } from "@/lib/ai";
import { PLANS_REVIEWED } from "@/lib/plans";
import { Card, btn, btnSm, cn } from "./ui";

const SUGGESTIONS = ["Why is the top pick ranked first?", "Is a cheaper plan good enough for us?", "Kenapa pelan pertama paling sesuai?"];

/** Optional Q&A about the current ranking (ADR 0002). Remount with a new key when the results change. */
export function PlanAssistant({ prefs }: { prefs: Record<string, unknown> }) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function ask(q: string) {
    q = q.trim();
    if (q.length < 3 || busy) return;
    setBusy(true);
    setError("");
    setAnnounce("");
    try {
      const d = await api<{ text: string; remaining: number }>("/api/plans/ask", { method: "POST", json: { question: q, history: turns, prefs } });
      setTurns([...turns, { role: "user", content: q }, { role: "assistant", content: d.text }]);
      setRemaining(d.remaining);
      setAnnounce(`Assistant: ${d.text}`);
      setQuestion("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The assistant couldn't answer just now.");
    } finally {
      setBusy(false);
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(question);
  };

  return (
    <Card className="mt-8">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold"><MessageCircleQuestion className="h-5 w-5" /> Ask about these matches</h2>
      <p className="mt-1 text-muted">Ask why a plan ranks where it does, or what to change for your situation. English or Bahasa Malaysia.</p>

      {turns.length > 0 && (
        <ol className="mt-5 space-y-3" aria-busy={busy}>
          {turns.map((t, i) => (
            <li key={i} className={cn("max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3", t.role === "user" ? "ml-auto bg-ink text-paper" : "bg-paper")}>
              <span className="sr-only">{t.role === "user" ? "You: " : "Assistant: "}</span>
              {t.content}
            </li>
          ))}
        </ol>
      )}

      {turns.length === 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" disabled={busy} onClick={() => { inputRef.current?.focus(); ask(s); }} className={cn(btn.secondary, btnSm, "disabled:opacity-60")}>{s}</button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="plan-question">Your question</label>
        <input
          id="plan-question"
          ref={inputRef}
          aria-busy={busy}
          className="field flex-1"
          value={question}
          maxLength={500}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. We work from home and game. Is the top pick enough?"
        />
        <button type="submit" disabled={busy || question.trim().length < 3} className={cn(btn.primary, "disabled:opacity-60")}>
          {busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          <span className="sr-only sm:not-sr-only">Ask</span>
        </button>
      </form>
      {/* Always mounted so the first answer is announced too. */}
      <p role="status" className="sr-only">{busy ? "Waiting for the assistant…" : announce}</p>
      {error && <p role="alert" className="mt-3 rounded-2xl bg-sambal-soft px-4 py-3 text-[#a1260f]">{error}</p>}
      <p className="mt-3 text-xs text-muted">
        Sends your question and Plan Finder answers to an AI service. It only explains BillWise&apos;s ranking and plan list (prices checked {PLANS_REVIEWED}); it can&apos;t check coverage or change the order. The cards above are the source of truth; confirm prices with the provider before switching.
        {remaining !== null && ` ${remaining} question${remaining === 1 ? "" : "s"} left today.`}
      </p>
    </Card>
  );
}
