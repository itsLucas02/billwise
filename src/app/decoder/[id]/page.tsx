import type { Metadata } from "next";
import { SavedAnalysis } from "@/components/SavedAnalysis";

export const metadata: Metadata = { title: "Decoded bill" };

export default async function SavedAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SavedAnalysis id={id} />;
}
