"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { House, LifeBuoy, RadioTower, ScanText, Sparkles } from "lucide-react";
import { Logo, cn } from "./ui";
import { PLANS_REVIEWED } from "@/lib/plans";

const NAV = [
  { href: "/", label: "Home", short: "Home", icon: House },
  { href: "/decoder", label: "Bill Decoder", short: "Decode", icon: ScanText },
  { href: "/plans", label: "Plan Finder", short: "Plans", icon: Sparkles },
  { href: "/coverage", label: "Coverage", short: "Coverage", icon: RadioTower },
  { href: "/help", label: "Billing Help", short: "Help", icon: LifeBuoy },
];

type TextSize = "md" | "lg" | "xl";

const TEXT_EVENT = "bw-textsize";
function subscribeText(cb: () => void) {
  window.addEventListener(TEXT_EVENT, cb);
  return () => window.removeEventListener(TEXT_EVENT, cb);
}
function readText(): TextSize {
  const s = document.documentElement.getAttribute("data-text");
  return s === "lg" || s === "xl" ? s : "md";
}

function TextSizeControl() {
  const size = useSyncExternalStore(subscribeText, readText, () => "md" as TextSize);
  const change = (s: TextSize) => {
    if (s === "md") document.documentElement.removeAttribute("data-text");
    else document.documentElement.setAttribute("data-text", s);
    try {
      localStorage.setItem("bw_text", s);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(TEXT_EVENT));
  };
  const options: { id: TextSize; label: string; cls: string }[] = [
    { id: "md", label: "Normal text", cls: "text-[0.8rem]" },
    { id: "lg", label: "Large text", cls: "text-[1rem]" },
    { id: "xl", label: "Extra large text", cls: "text-[1.2rem]" },
  ];
  return (
    <div role="group" aria-label="Text size" className="flex items-center rounded-full border border-line bg-white p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => change(o.id)}
          aria-pressed={size === o.id}
          aria-label={o.label}
          title={o.label}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full font-display font-bold leading-none transition",
            o.cls,
            size === o.id ? "bg-ink text-paper" : "text-ink-soft hover:bg-cream",
          )}
        >
          A
        </button>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2.5 rounded-xl" aria-label="BillWise home">
            <Logo />
            <span className="font-display text-[1.35rem] font-extrabold tracking-tight">
              Bill<span className="text-pandan">Wise</span>
            </span>
          </Link>
          <nav aria-label="Main" className="ml-3 hidden items-center gap-1 md:flex lg:ml-6">
            {NAV.slice(1).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-[0.9rem] font-semibold transition lg:px-3.5 lg:text-[0.95rem]",
                  isActive(n.href) ? "bg-ink text-paper" : "text-ink-soft hover:bg-cream",
                )}
              >
                <n.icon className="hidden h-4 w-4 lg:block" aria-hidden />
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm font-medium text-muted lg:inline">Text size</span>
            <TextSizeControl />
          </div>
        </div>
      </header>

      <main id="main" className="min-h-[70vh] pb-14 md:pb-12">
        {children}
      </main>

      <footer className="border-t border-line bg-cream/60 pb-28 md:pb-0">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 text-ink">
              <Logo className="h-7 w-7" />
              <span className="font-display text-lg font-extrabold">BillWise</span>
            </div>
            <p className="mt-3 max-w-sm leading-relaxed">
              An independent consumer tool for Malaysian telco customers. Not affiliated with any provider. Guidance only — always confirm
              details with your provider.
            </p>
          </div>
          <div>
            <p className="font-bold text-ink">About our data</p>
            <ul className="mt-2 space-y-1.5 leading-relaxed">
              <li>Providers, plans and prices are fictional demo data, reviewed {PLANS_REVIEWED}.</li>
              <li>Prices exclude 6% service tax unless shown.</li>
              <li>Sample bills are simulated. Coverage is never guessed.</li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-ink">Quick links</p>
            <ul className="mt-2 space-y-1.5">
              <li><Link className="underline-offset-4 hover:underline" href="/providers">Provider contacts directory</Link></li>
              <li><Link className="underline-offset-4 hover:underline" href="/help">How to escalate a complaint</Link></li>
              <li><a className="underline-offset-4 hover:underline" href="https://aduan.skmm.gov.my" target="_blank" rel="noreferrer">MCMC / CFM complaint portal ↗</a></li>
            </ul>
          </div>
        </div>
      </footer>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-18px_rgba(15,27,45,0.35)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-5">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex min-h-[4.1rem] flex-col items-center justify-center gap-1 text-[0.72rem] font-bold", active ? "text-ink" : "text-muted")}
                >
                  <span className={cn("grid h-8 w-12 place-items-center rounded-full transition", active ? "bg-kunyit text-ink" : "")}>
                    <n.icon className="h-5 w-5" aria-hidden />
                  </span>
                  {n.short}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
