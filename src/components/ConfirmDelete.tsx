"use client";

import { useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { btn, btnSm, cn } from "./ui";

/**
 * In-page delete confirmation. Native confirm() is silently blocked in some embedded browsers
 * (it returns false without showing anything), which made Delete do nothing.
 */
export function ConfirmDelete({ label = "Delete", question, onConfirm }: { label?: string; question: string; onConfirm: () => Promise<void> }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!asking) {
    return (
      <button type="button" onClick={() => { setAsking(true); setError(""); }} className={cn(btn.danger, btnSm)}>
        <Trash2 className="h-4 w-4" aria-hidden /> {label}
      </button>
    );
  }
  return (
    <div role="group" aria-label={question} className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold">{question}</span>
      <button
        type="button"
        autoFocus
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await onConfirm();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Couldn't delete. Try again.");
            setBusy(false);
          }
        }}
        className={cn(btn.danger, btnSm, "!border-sambal !bg-sambal !text-white disabled:opacity-60")}
      >
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />} Yes, delete
      </button>
      <button type="button" disabled={busy} onClick={() => setAsking(false)} className={cn(btn.ghost, btnSm)}>Cancel</button>
      {error && <p role="alert" className="w-full text-sm font-semibold text-[#a1260f]">{error}</p>}
    </div>
  );
}
