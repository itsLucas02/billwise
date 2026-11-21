import type { ReactNode } from "react";
import { PROVIDERS, type ProviderId } from "@/lib/providers";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 min-h-12 px-5 py-3 text-center";

export const btn = {
  primary: `${btnBase} bg-ink text-paper shadow-[0_5px_0_-1px_rgba(15,27,45,0.22)] hover:-translate-y-0.5 hover:bg-ink-soft active:translate-y-0`,
  accent: `${btnBase} bg-pandan text-white shadow-[0_5px_0_-1px_rgba(6,105,74,0.35)] hover:-translate-y-0.5 hover:bg-pandan-dark active:translate-y-0`,
  yellow: `${btnBase} bg-kunyit text-ink shadow-[0_5px_0_-1px_rgba(15,27,45,0.25)] hover:-translate-y-0.5 active:translate-y-0`,
  secondary: `${btnBase} border-2 border-ink/15 bg-white text-ink hover:border-ink/40`,
  ghost: `${btnBase} text-ink hover:bg-ink/5`,
  danger: `${btnBase} border-2 border-sambal/30 bg-white text-sambal hover:bg-sambal-soft`,
};
export const btnSm = "!min-h-10 !px-4 !py-2 text-sm";

export function Card({ className, children, id }: { className?: string; children: ReactNode; id?: string }) {
  return (
    <div id={id} className={cn("rounded-3xl border border-line bg-white p-5 shadow-card md:p-6", className)}>
      {children}
    </div>
  );
}

type Tone = "neutral" | "green" | "yellow" | "red" | "blue" | "ink";
const TONES: Record<Tone, string> = {
  neutral: "bg-cream text-ink-soft border-line",
  green: "bg-pandan-soft text-pandan-dark border-pandan/20",
  yellow: "bg-kunyit-soft text-[#7a5200] border-kunyit/40",
  red: "bg-sambal-soft text-[#a1260f] border-sambal/25",
  blue: "bg-sky-soft text-[#1d4fb3] border-sky/20",
  ink: "bg-ink text-paper border-ink",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.8rem] font-semibold leading-6", TONES[tone], className)}>
      {children}
    </span>
  );
}

export function ProviderBadge({ id, size = "md", className }: { id: ProviderId | string | null | undefined; size?: "sm" | "md"; className?: string }) {
  const p = id && id in PROVIDERS ? PROVIDERS[id as ProviderId] : null;
  if (!p) return <Badge className={className}>Unknown provider</Badge>;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold tracking-tight",
        size === "sm" ? "px-2.5 py-0.5 text-[0.78rem]" : "px-3 py-1 text-sm",
        p.logo && "border border-line",
        className,
      )}
      // with a logo the pill is white so the transparent logo keeps its own colours and stays readable on dark sections too
      style={p.logo ? { backgroundColor: "#fff", color: "var(--color-ink)" } : { backgroundColor: p.color, color: p.ink }}
    >
      {p.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.logo} alt="" aria-hidden className={cn("w-auto object-contain", size === "sm" ? "h-4" : "h-[1.15rem]")} />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.ink, opacity: 0.8 }} aria-hidden />
      )}
      {p.name}
    </span>
  );
}

export function SimTag({ label = "Simulated" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-teh/60 bg-[#fbf1e6] px-2 py-0.5 text-[0.72rem] font-bold uppercase tracking-wider text-teh">
      {label}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  intro,
  art,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  art?: ReactNode; // decorative art in the empty right half on wide screens
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-cream/70">
      <div className="dotgrid absolute inset-0 opacity-70" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 py-9 md:py-14">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-pandan-dark">{eyebrow}</p>
        <h1 className={cn("mt-3 max-w-3xl font-display text-[clamp(2.1rem,5.4vw,3.6rem)] font-bold leading-[1.02] tracking-tight text-ink", !!art && "lg:max-w-[38rem]")}>
          {title}
        </h1>
        {intro && <p className={cn("mt-4 max-w-2xl text-lg leading-relaxed text-muted", !!art && "lg:max-w-[36rem]")}>{intro}</p>}
        {children}
        {art}
      </div>
    </section>
  );
}

export function SectionTitle({ title, sub, action }: { title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight md:text-[1.7rem]">{title}</h2>
        {sub && <p className="mt-1 text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, art, title, text, action }: { icon?: ReactNode; art?: ReactNode; title: string; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-line bg-white/60 px-6 py-10 text-center">
      {art ? <div className="-mt-4 mb-1 w-28">{art}</div> : icon && <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-cream text-ink-soft">{icon}</div>}
      <p className="font-display text-lg font-bold">{title}</p>
      {text && <p className="mt-1 max-w-md text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="#0f1b2d" />
      <path d="M11.5 8.5h15v22.2l-2.5-1.7-2.5 1.7-2.5-1.7-2.5 1.7-2.5-1.7-2.5 1.7z" fill="#fbf8f2" />
      <path d="M15 14.5h8M15 18.5h5" stroke="#0f1b2d" strokeWidth="2" strokeLinecap="round" />
      <circle cx="27.6" cy="27.4" r="6.6" fill="#ffc23d" stroke="#0f1b2d" strokeWidth="2.2" />
      <path d="m24.9 27.5 1.8 1.8 3.5-3.7" stroke="#0f1b2d" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Stat({ label, value, hint, tone = "neutral" }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "neutral" | "green" | "red" | "ink" }) {
  const toneClass =
    tone === "green" ? "bg-pandan-soft border-pandan/20" : tone === "red" ? "bg-sambal-soft border-sambal/20" : tone === "ink" ? "bg-ink text-paper border-ink" : "bg-white border-line";
  return (
    <div className={cn("rounded-2xl border p-4", toneClass)}>
      <p className={cn("text-sm font-semibold", tone === "ink" ? "text-paper/70" : "text-muted")}>{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className={cn("mt-0.5 text-sm", tone === "ink" ? "text-paper/70" : "text-muted")}>{hint}</p>}
    </div>
  );
}
