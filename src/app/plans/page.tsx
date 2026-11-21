import type { Metadata } from "next";
import { HeaderArt } from "@/components/stickers/Spot";
import { PlanFinder, type FinderInitial } from "@/components/PlanFinder";
import { PageHeader } from "@/components/ui";
import { PLANS } from "@/lib/plans";
import { isProviderId } from "@/lib/providers";

export const metadata: Metadata = { title: "Plan Finder" };

export default async function PlansPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const kind = get("kind") === "mobile" ? "mobile" : get("kind") === "fibre" ? "fibre" : undefined;
  const tab = get("tab");
  const initial: FinderInitial = {
    kind,
    tab: tab === "browse" || tab === "saved" ? tab : undefined,
    budget: get("budget") ? Number(get("budget")) || undefined : undefined,
    lines: get("lines") ? Math.min(5, Math.max(1, Number(get("lines")) || 1)) : undefined,
    available: (get("available") ?? "").split(",").filter(isProviderId),
    auto: Boolean(kind && get("budget")),
  };
  return (
    <>
      <PageHeader
        art={<HeaderArt scene="plans" />}
        eyebrow="Plan Finder · Cari pelan terbaik"
        title={<>Find a plan that fits your <span className="mark">home</span> and your budget</>}
        intro={`Answer a few simple questions and we'll rank ${PLANS.length} real fibre and mobile plans from Unifi, Maxis, CelcomDigi, TIME, Allo, U Mobile and Yes — with honest reasons for each. Prices are hand-checked and linked to each provider's own site.`}
      />
      <PlanFinder initial={initial} />
    </>
  );
}
