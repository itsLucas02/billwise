import type { Metadata } from "next";
import { NewCaseWizard, type CasePrefill } from "@/components/NewCaseWizard";
import { PageHeader } from "@/components/ui";
import { isIssueType } from "@/lib/cases";
import { isProviderId } from "@/lib/providers";

export const metadata: Metadata = { title: "Start a billing case" };

export default async function NewCasePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const provider = get("provider");
  const issue = get("issue");
  const amount = get("amount");
  const promised = get("promised");
  const prefill: CasePrefill = {
    provider: isProviderId(provider) ? provider : undefined,
    issue: isIssueType(issue) ? issue : undefined,
    amount: amount && /^\d+(\.\d+)?$/.test(amount) ? amount : undefined,
    promised: promised && /^\d+(\.\d+)?$/.test(promised) ? promised : undefined,
    label: get("label")?.slice(0, 140),
    month: /^\d{4}-(0[1-9]|1[0-2])$/.test(get("month") ?? "") ? get("month") : undefined,
    analysis: get("analysis"),
  };
  return (
    <>
      <PageHeader eyebrow="Billing Assistance · New case" title="Let's get this sorted" intro="Three quick steps. We'll turn your answers into a clear, polite message your provider can act on." />
      <NewCaseWizard prefill={prefill} />
    </>
  );
}
