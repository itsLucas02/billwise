import type { Metadata } from "next";
import { CoverageClient } from "@/components/CoverageClient";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Coverage Discovery" };

export default async function CoveragePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const check = typeof sp.check === "string" ? sp.check : undefined;
  return (
    <>
      <PageHeader
        eyebrow="Coverage Discovery · Semak liputan"
        title={<>What can I <span className="mark">really</span> get at my address?</>}
        intro="Check every provider the right way, keep track of what their coverage checkers say, and understand your mobile signal and internet speed."
      />
      <CoverageClient initialCheck={check} />
    </>
  );
}
