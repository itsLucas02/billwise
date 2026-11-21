import type { Metadata } from "next";
import { HeaderArt } from "@/components/stickers/Spot";
import { DecoderClient } from "@/components/DecoderClient";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Bill Decoder" };

export default async function DecoderPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const sample = typeof sp.sample === "string" ? sp.sample : undefined;
  return (
    <>
      <PageHeader
        art={<HeaderArt scene="decoder" />}
        eyebrow="Bill Decoder · Fahami bil anda"
        title={<>What am I <span className="mark">actually</span> paying for?</>}
        intro="Paste your bill and BillWise explains every charge in plain language, checks the 6% service tax, spots duplicates and ended promotions, and shows you how to save."
      />
      <DecoderClient initialSample={sample} />
    </>
  );
}
