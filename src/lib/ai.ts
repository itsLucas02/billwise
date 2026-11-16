// Pure prompt building for the AI features. Only type imports (erased at runtime), so `node --test` can run it directly.
import type { Plan } from "./plans";
import type { Recommendation } from "./recommend";

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

// ───────── Plan Finder assistant (ADR 0002) ─────────

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * Earlier turns come from the browser, so they are untrusted: keep only complete user→assistant
 * pairs, the last 3 of them, each turn cut to 600 characters.
 */
export function trimHistory(raw: unknown): ChatTurn[] {
  const items = Array.isArray(raw) ? raw : [];
  const ok = (t: unknown, role: ChatTurn["role"]): t is ChatTurn =>
    typeof t === "object" && t !== null && (t as ChatTurn).role === role && typeof (t as ChatTurn).content === "string" && (t as ChatTurn).content.trim() !== "";
  const pairs: ChatTurn[][] = [];
  for (let i = 0; i < items.length; i++) {
    if (ok(items[i], "user") && ok(items[i + 1], "assistant")) pairs.push([items[i], items[++i]]);
  }
  return pairs.slice(-3).flat().map((t) => ({ role: t.role, content: t.content.trim().slice(0, 600) }));
}

export interface PlanChatInput {
  question: string;
  history: ChatTurn[];
  /** The Plan Finder answers that produced this ranking, as readable lines. */
  answers: string[];
  needSummary: string;
  /** Already ranked by `recommend()`, best first. */
  ranked: { rec: Recommendation; plan: Plan; providerName: string }[];
  reviewed: string;
}

const PLAN_SYSTEM = `You are the Plan Finder assistant inside BillWise, an independent consumer tool that helps Malaysian telco customers compare home fibre and mobile postpaid plans. BillWise is not affiliated with any provider.

BillWise has already ranked the plans below with deterministic rules from the customer's Plan Finder answers. Your job is to explain that ranking and help the customer decide, in plain words. Rules:
- Use only the facts in the context below: the customer's answers, the ranked plans, their scores, reasons and cautions, and the catalogue details. Do not mention any plan, price, promotion, speed, data amount, perk or provider that is not in the context. If asked about something that is not there, say BillWise doesn't list it and suggest checking the provider's own site.
- Do not re-rank, reorder or re-score plans, and do not invent your own score. When you say why a plan is ranked where it is, use its listed reasons and cautions.
- If the customer describes needs that differ from their answers (a different budget, household size or activity), say which Plan Finder answer to change and to press "Show my best matches" again for an updated ranking. You may point out which listed plans already fit the new need, using only the listed facts.
- Never say or imply a plan is available at the customer's address. BillWise does not know coverage: point them to the Coverage page and the provider's own coverage checker.
- Quote prices exactly as listed, as "RMx/month before 6% SST" (in Bahasa Malaysia: "RMx sebulan sebelum SST 6%"), and mention once that prices were checked in the review month given and should be confirmed on the provider's site before switching. Point out promo prices, bundle conditions and contract terms when they matter. A price marked "dealer or press listing" was not seen on the provider's own site; say so if it matters.
- Be brief: at most about 150 words, short paragraphs or a few bullet points, no tables, no markdown headings. If one more detail would change the advice, end with one short follow-up question.
- Reply in the language of the customer's latest message: Bahasa Malaysia if they write in Malay, otherwise English.
- Only offer follow-ups this data can answer.
- You give general consumer information, not financial advice. Stay friendly and neutral about providers.`;

const money = (n: number) => `RM${n.toFixed(2)}`;

function planLine(rank: number, { rec, plan: p, providerName }: PlanChatInput["ranked"][number]): string {
  const facts = [
    `provider ${providerName}`,
    `you pay ${money(rec.monthly)}/month before SST (${money(rec.monthlyWithSST)} with SST)`,
    p.listPrice && `normal price ${money(p.listPrice)}`,
    p.priceNote,
    p.bundlePrice && `bundle price ${money(p.bundlePrice)}${p.bundleNote ? ` (${p.bundleNote})` : ""}`,
    p.down && `${p.down}Mbps down${p.up ? ` / ${p.up}Mbps up` : ""}`,
    p.dataGB && `data ${p.dataGB === "unlimited" ? "unlimited" : `${p.dataGB}GB`}${p.dataNote ? ` (${p.dataNote})` : ""}`,
    p.hotspot && `hotspot: ${p.hotspot}`,
    p.calls,
    p.includedLines && p.includedLines > 1 && `${p.includedLines} lines included`,
    p.extraLineCost !== undefined && `extra line ${money(p.extraLineCost)}${p.extraLineNote ? ` (${p.extraLineNote})` : ""}`,
    p.roaming && `roaming: ${p.roaming}`,
    p.contractMonths > 0 ? `${p.contractMonths}-month contract` : "no contract",
    p.contractNote,
    p.router && `router: ${p.router}`,
    p.perks.length && `perks: ${p.perks.join(", ")}`,
    p.status === "official" ? "price from the provider's own site" : "price from a dealer or press listing",
    `source ${p.source}`,
  ].filter(Boolean).join("; ");
  const why = [
    rec.reasons.length && `  Reasons: ${rec.reasons.join("; ")}`,
    rec.cautions.length && `  Cautions: ${rec.cautions.join("; ")}`,
  ].filter(Boolean).join("\n");
  return `#${rank} ${p.name} (${rec.label}, score ${rec.score}/100): ${facts}${why ? `\n${why}` : ""}`;
}

export function buildPlanChatMessages(input: PlanChatInput): { role: "system" | "user" | "assistant"; content: string }[] {
  const context = [
    `Customer's Plan Finder answers:\n${input.answers.map((a) => `- ${a}`).join("\n")}`,
    `BillWise's summary of their need: ${input.needSummary}`,
    `Ranked plans, best first (prices checked ${input.reviewed}):\n${input.ranked.map((r, i) => planLine(i + 1, r)).join("\n")}`,
  ].join("\n\n");
  return [
    { role: "system", content: `${PLAN_SYSTEM}\n\nContext:\n${context}` },
    ...input.history,
    { role: "user", content: input.question },
  ];
}

/** Tidy the assistant's reply; null means "unusable". */
export function cleanChatReply(raw: string): string | null {
  const t = raw.trim().replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
  return t && t.length <= 3000 ? t : null;
}
