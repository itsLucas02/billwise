import type { Metadata } from "next";
import { HeaderArt } from "@/components/stickers/Spot";
import { HelpCenter } from "@/components/HelpCenter";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Billing Assistance" };

export default function HelpPage() {
  return (
    <>
      <PageHeader
        art={<HeaderArt scene="help" />}
        eyebrow="Billing Assistance · Bantuan bil"
        title={<>Sort out a billing problem, <span className="mark">step by step</span></>}
        intro="Investigate a questionable charge, get a ready-to-send message, reach the right people, and keep track of every reply until it's resolved."
      />
      <HelpCenter />
    </>
  );
}
