"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, LoaderCircle, ScanText, Trash2 } from "lucide-react";
import { api } from "@/lib/client";
import type { Analysis } from "@/lib/decoder";
import { AnalysisView } from "./AnalysisView";
import { EmptyState, SimTag, btn, btnSm, cn } from "./ui";

interface Saved { id: string; title: string; source: string; createdAt: string; rawText: string; analysis: Analysis }

export function SavedAnalysis({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<Saved | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Saved>(`/api/decoder/${id}`).then(setData).catch((e: Error) => setError(e.message));
  }, [id]);

  async function remove() {
    if (!confirm("Delete this decoded bill?")) return;
    await api(`/api/decoder/${id}`, { method: "DELETE" }).catch(() => {});
    router.push("/decoder");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/decoder" className={cn(btn.ghost, btnSm)}><ArrowLeft className="h-4 w-4" /> Back to Bill Decoder</Link>
        {data && (
          <div className="flex items-center gap-2">
            {data.source === "sample" && <SimTag label="Specimen sample" />}
            <button type="button" onClick={remove} className={cn(btn.danger, btnSm)}><Trash2 className="h-4 w-4" /> Delete</button>
          </div>
        )}
      </div>
      {error ? (
        <EmptyState icon={<ScanText className="h-7 w-7" />} title="We couldn't find this bill" text="It may have been deleted, or it was decoded on a different browser." action={<Link href="/decoder" className={btn.primary}>Decode a bill</Link>} />
      ) : !data ? (
        <div className="grid place-items-center py-24 text-muted"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
      ) : (
        <>
          <AnalysisView analysis={data.analysis} id={data.id} title={data.title} createdAt={data.createdAt} />
          <details className="mt-6 rounded-2xl border border-line bg-white">
            <summary className="flex items-center justify-between px-5 py-4 font-semibold">Show the original text <ChevronDown className="rotate-on-open h-5 w-5 transition" /></summary>
            <pre className="overflow-x-auto whitespace-pre-wrap px-5 pb-5 font-mono text-sm text-ink-soft">{data.rawText}</pre>
          </details>
        </>
      )}
    </div>
  );
}
