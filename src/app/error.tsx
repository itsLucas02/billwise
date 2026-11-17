"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Home, RotateCcw } from "lucide-react";
import { btn } from "@/components/ui";

// Shown when a page crashes. Saved bills and cases live on the server, so nothing the person entered earlier is lost.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 pb-6 pt-16 text-center md:pt-24">
      <span aria-hidden className="grid h-16 w-16 place-items-center rounded-2xl bg-sambal-soft text-3xl font-black text-sambal">!</span>
      <h1 className="mt-5 font-display text-4xl font-bold tracking-tight">Something went wrong on our side</h1>
      <p className="mt-3 text-lg text-muted">
        Your saved bills and cases are safe. Try again, and if it keeps happening, come back in a few minutes.
      </p>
      {error.digest && <p className="mt-2 text-sm text-muted">Reference: <code>{error.digest}</code></p>}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reset} className={btn.primary}>
          <RotateCcw className="h-5 w-5" aria-hidden /> Try again
        </button>
        <Link href="/" className={btn.secondary}>
          <Home className="h-5 w-5" aria-hidden /> Back to home
        </Link>
      </div>
    </section>
  );
}
