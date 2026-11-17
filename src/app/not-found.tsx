import Link from "next/link";
import { ArrowRight, Home, LifeBuoy, ScanText, Sparkles } from "lucide-react";
import { btn } from "@/components/ui";
import { Sticker } from "@/components/stickers/Sticker";
import { bills } from "@/components/stickers/icons";

export const metadata = { title: "Page not found" };

const WAYS = [
  { href: "/decoder", icon: ScanText, label: "Decode a bill", hint: "See every charge explained" },
  { href: "/plans", icon: Sparkles, label: "Find a plan", hint: "Compare plans from seven telcos" },
  { href: "/help", icon: LifeBuoy, label: "Billing help", hint: "Dispute a charge, step by step" },
];

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-6 pt-14 text-center md:pt-20">
      <div aria-hidden className="w-36">
        <Sticker icon={bills} palette={{ main: "#ffc23d", deep: "#0f1b2d" }} loop={false} enter={0.1} replayOnHover label="" />
      </div>
      <p className="mt-2 text-sm font-bold uppercase tracking-[0.08em] text-muted">Error 404</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">This page isn&rsquo;t on the bill</h1>
      <p className="mt-3 max-w-md text-lg text-muted">The link may be old or mistyped. Here&rsquo;s where most people are headed:</p>

      <ul className="mt-8 grid w-full gap-3 text-left sm:grid-cols-3">
        {WAYS.map(({ href, icon: Icon, label, hint }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full flex-col gap-2 rounded-2xl border border-line bg-white p-4 transition-[transform,box-shadow] duration-150 ease-out hover:shadow-card active:scale-[0.98]"
            >
              <Icon className="h-5 w-5 text-pandan-dark" aria-hidden />
              <span className="flex items-center gap-1 font-semibold">
                {label} <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              </span>
              <span className="text-sm text-muted">{hint}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/" className={`${btn.secondary} mt-8`}>
        <Home className="h-5 w-5" aria-hidden /> Back to home
      </Link>
    </section>
  );
}
