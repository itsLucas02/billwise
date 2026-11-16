// Pure prompt building for the AI enquiry rewrite. No app imports, so `node --test` can run it directly.

export type RewriteAction = "firmer" | "shorter" | "notes";

export const REWRITE_ACTIONS: Record<RewriteAction, { label: string; instruction: string }> = {
  firmer: { label: "Make it firmer", instruction: "Make the tone firmer and more direct, while staying polite and professional. Make the request and the expected next step unmistakable." },
  shorter: { label: "Make it shorter", instruction: "Make it noticeably shorter. Keep the bill month, the charge, the amount, the request and the reference-number ask; cut repetition." },
  notes: { label: "Add my notes", instruction: "Work the customer's timeline notes into the message as brief, factual context (what they already tried and what they were told). Leave out anything in the notes that is not relevant to the enquiry." },
};

export interface RewriteInput {
  action: RewriteAction;
  lang: "en" | "ms";
  draft: string;
  facts: {
    provider: string;
    issue: string;
    chargeLabel?: string | null;
    amount?: number | null;
    billMonth?: string | null;
    promisedPrice?: number | null;
  };
  notes: string[];
}

const SYSTEM = `You are the enquiry-writing assistant inside BillWise, an independent consumer tool for Malaysian telco customers. BillWise was built for the "Build For Better Connectivity" challenge: a useful tool for the people who use, support, or improve connectivity.

BillWise helps an ordinary customer whose broadband or mobile bill is higher than expected, or has charges they do not understand. It decodes the bill with deterministic rules, flags what is worth asking about, and drafts a billing enquiry the customer sends to their provider themselves. BillWise is not affiliated with any provider and never contacts providers on the customer's behalf.

Your only job is to rewrite the customer's draft enquiry as asked. Rules:
- Use only the facts in the case details, the draft and (when given) the customer's notes. Do not add or invent charges, amounts, dates, names, reference numbers, promises or contract terms.
- Keep every amount exactly as written (RM, two decimals). Keep placeholders such as [Your name] as they are.
- Keep the reference to the General Consumer Code of Practice (clause 7.3) and its timelines if the draft has it; do not add other laws or regulations.
- Stay polite and factual. No threats, no legal ultimatums, no accusations of fraud. Where the bill alone cannot prove something, phrase it as a question for the provider to confirm.
- Never say or imply the message has already been sent, or that BillWise is involved.
- Keep the same format as the draft: an email keeps its "Subject:" line, a chat message stays a single short paragraph, a call script stays a script.
- Reply with the rewritten message only: no preamble, no explanation, no quotation marks or code fences.`;

const rm = (n: number) => `RM${n.toFixed(2)}`;

export function buildRewriteMessages(input: RewriteInput): { role: "system" | "user"; content: string }[] {
  const f = input.facts;
  const facts = [
    `Provider: ${f.provider}`,
    `Issue: ${f.issue}`,
    f.chargeLabel && `Charge on the bill: ${f.chargeLabel}`,
    f.amount != null && `Amount in question: ${rm(f.amount)}`,
    f.promisedPrice != null && `Price the customer says they were promised: ${rm(f.promisedPrice)} a month`,
    f.billMonth && `Bill month: ${f.billMonth}`,
  ].filter(Boolean).join("\n");
  const notes = input.action === "notes" && input.notes.length ? `\n\nCustomer's timeline notes (oldest first):\n${input.notes.map((n) => `- ${n}`).join("\n")}` : "";
  const language = input.lang === "ms" ? "Write in Bahasa Malaysia, as the draft is." : "Write in English, as the draft is.";
  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: `Case details:\n${facts}${notes}\n\nTask: ${REWRITE_ACTIONS[input.action].instruction} ${language}\n\nDraft:\n${input.draft}` },
  ];
}

/** Tidy the model's reply; null means "unusable, keep the original draft". */
export function cleanRewrite(raw: string, draft: string): string | null {
  let t = raw.trim().replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
  if (/^["“][\s\S]*["”]$/.test(t)) t = t.slice(1, -1).trim();
  if (!t || t.length > draft.length * 2 + 1000) return null;
  return t;
}
