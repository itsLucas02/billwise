import { PROVIDERS, type ProviderId } from "./providers";
import { rm } from "./format";

export type IssueType =
  | "unknown_charge" | "promo" | "double" | "after_cancel" | "content"
  | "roaming" | "late_fee" | "penalty" | "speed" | "other";

export type CaseStatus = "open" | "contacted" | "awaiting" | "escalated" | "resolved" | "closed";

export const STATUS_INFO: Record<CaseStatus, { label: string; tone: "neutral" | "blue" | "yellow" | "red" | "green" | "ink" }> = {
  open: { label: "Preparing", tone: "neutral" },
  contacted: { label: "Raised with provider", tone: "blue" },
  awaiting: { label: "Waiting for reply", tone: "yellow" },
  escalated: { label: "Escalated to CFM", tone: "red" },
  resolved: { label: "Resolved", tone: "green" },
  closed: { label: "Closed", tone: "ink" },
};

export const CASE_STATUSES = Object.keys(STATUS_INFO) as CaseStatus[];

interface IssueInfo {
  label: string;
  labelMs: string;
  emoji: string;
  hint: string;
  ask: string[];
  evidence: string[];
  paraEn: string;
  paraMs: string;
  outcomeEn: string;
  outcomeMs: string;
}

export const ISSUES: Record<IssueType, IssueInfo> = {
  unknown_charge: {
    label: "A charge I don't recognise",
    labelMs: "Caj yang saya tidak kenali",
    emoji: "❓",
    hint: "Something on the bill you never asked for, or can't explain.",
    ask: ["What exactly is this charge for?", "When and how was it activated?", "Can it be reversed and prevented from recurring?"],
    evidence: ["The bill showing the charge", "Screenshots of your usage page in the app", "Any SMS or email you received about it"],
    paraEn: "I do not recognise this charge and did not knowingly request this service. Please explain what it is for, when and how it was activated, and share the supporting records.",
    paraMs: "Saya tidak mengenali caj ini dan tidak pernah memohon perkhidmatan ini dengan sengaja. Mohon jelaskan caj ini, bila dan bagaimana ia diaktifkan, serta kongsikan rekod sokongan.",
    outcomeEn: "a full explanation and, if the charge is not valid, a refund or credit to my account",
    outcomeMs: "penjelasan penuh dan, jika caj ini tidak sah, bayaran balik atau kredit ke akaun saya",
  },
  promo: {
    label: "Promo price or rebate not applied",
    labelMs: "Harga promosi atau rebat tidak diberikan",
    emoji: "🏷️",
    hint: "You're paying more than the price you signed up for.",
    ask: ["What price is on my contract?", "When does (or did) my promotion end?", "Can the correct price be applied and the difference credited?"],
    evidence: ["Sign-up confirmation (email/SMS) or contract", "Screenshot of the advertised offer", "Bills from before and after the change"],
    paraEn: "When I signed up I was offered {promise}, but my bill does not reflect this. Please check my contract and apply the correct pricing.",
    paraMs: "Semasa mendaftar, saya ditawarkan {promise}, tetapi bil saya tidak mencerminkan tawaran tersebut. Mohon semak kontrak saya dan kenakan harga yang betul.",
    outcomeEn: "the agreed price applied and the overcharged amount credited back",
    outcomeMs: "harga yang dipersetujui dikenakan dan jumlah lebihan caj dikreditkan semula",
  },
  double: {
    label: "Charged twice",
    labelMs: "Dicaj dua kali",
    emoji: "👯",
    hint: "The same fee appears more than once.",
    ask: ["Why does this charge appear twice?", "Can the duplicate be reversed this cycle?"],
    evidence: ["The bill with both charges highlighted", "Your previous bill for comparison"],
    paraEn: "The same charge appears more than once on my bill. Please investigate and reverse the duplicate.",
    paraMs: "Caj yang sama muncul lebih daripada sekali dalam bil saya. Mohon siasat dan batalkan caj berganda tersebut.",
    outcomeEn: "the duplicate charge reversed and credited to my account",
    outcomeMs: "caj berganda dibatalkan dan dikreditkan ke akaun saya",
  },
  after_cancel: {
    label: "Billed after I cancelled",
    labelMs: "Dibilkan selepas penamatan",
    emoji: "🚫",
    hint: "You ended the service but bills keep coming.",
    ask: ["What termination date is on record?", "Can all charges after that date be cancelled?", "Can you send written confirmation and a final statement?"],
    evidence: ["Termination request reference number and date", "Equipment return receipt (if any)", "The bills issued after termination"],
    paraEn: "I requested termination of this service, but I am still being billed. Please stop billing, cancel all charges after my termination date, and send written confirmation of termination with a final statement.",
    paraMs: "Saya telah memohon penamatan perkhidmatan ini, tetapi masih dibilkan. Mohon hentikan pembilan, batalkan semua caj selepas tarikh penamatan saya, dan hantar pengesahan bertulis penamatan bersama penyata akhir.",
    outcomeEn: "all charges after my termination date cancelled, and written confirmation of termination",
    outcomeMs: "semua caj selepas tarikh penamatan dibatalkan, dan pengesahan bertulis penamatan",
  },
  content: {
    label: "Content subscription I didn't sign up for",
    labelMs: "Langganan kandungan yang saya tidak langgan",
    emoji: "🎮",
    hint: "Games, ringtones or app charges billed to your line.",
    ask: ["Which service is this and when did it start?", "Can it be cancelled and refunded?", "Can content/carrier billing be blocked on my line?"],
    evidence: ["The bill showing the content charges", "Any subscription SMS you received", "Screenshots of your app purchase history"],
    paraEn: "I did not subscribe to this content service. Please terminate it immediately, refund the charges, and block third-party content billing on my line.",
    paraMs: "Saya tidak melanggan perkhidmatan kandungan ini. Mohon tamatkan dengan segera, pulangkan caj tersebut, dan sekat pembilan kandungan pihak ketiga pada talian saya.",
    outcomeEn: "the subscription cancelled, the charges refunded and content billing blocked on my line",
    outcomeMs: "langganan dibatalkan, caj dipulangkan dan pembilan kandungan disekat pada talian saya",
  },
  roaming: {
    label: "Unexpected roaming / IDD charges",
    labelMs: "Caj perayauan / IDD yang tidak dijangka",
    emoji: "✈️",
    hint: "A big bill after travelling or calling overseas.",
    ask: ["Can I get an itemised breakdown?", "Could a roaming pass rate be applied?", "Is a goodwill adjustment possible?"],
    evidence: ["The bill with roaming/IDD lines", "Travel dates", "Screenshots of roaming settings or pass purchases"],
    paraEn: "My bill includes unexpectedly high roaming / international charges. Please provide an itemised breakdown and review whether a roaming pass or better rate could have been applied. I would appreciate a goodwill adjustment.",
    paraMs: "Bil saya mengandungi caj perayauan / antarabangsa yang tinggi secara tidak dijangka. Mohon berikan pecahan terperinci dan semak sama ada pas perayauan atau kadar yang lebih baik boleh dikenakan. Saya amat menghargai pelarasan muhibah.",
    outcomeEn: "an itemised breakdown and a review or adjustment of these charges",
    outcomeMs: "pecahan terperinci serta semakan atau pelarasan caj tersebut",
  },
  late_fee: {
    label: "Late payment fee waiver",
    labelMs: "Pengecualian caj bayaran lewat",
    emoji: "⏰",
    hint: "Ask for a one-time goodwill waiver.",
    ask: ["Can the late fee be waived as a one-time goodwill gesture?", "Can auto-debit be set up on my account?"],
    evidence: ["The bill with the late fee", "Proof of payment (date and amount)"],
    paraEn: "I was charged a late payment fee. This was an oversight and the bill has now been settled. As a long-standing customer, I kindly request a one-time waiver of this fee.",
    paraMs: "Saya telah dikenakan caj bayaran lewat. Ini berlaku secara tidak sengaja dan bil tersebut telah dijelaskan. Sebagai pelanggan setia, saya memohon pengecualian sekali sahaja bagi caj ini.",
    outcomeEn: "a one-time waiver of the late payment fee",
    outcomeMs: "pengecualian sekali sahaja bagi caj bayaran lewat",
  },
  penalty: {
    label: "Early termination penalty",
    labelMs: "Penalti penamatan awal",
    emoji: "📄",
    hint: "A penalty you believe doesn't apply.",
    ask: ["What are my contract start and end dates?", "How was the penalty calculated?", "Can it be waived given my circumstances?"],
    evidence: ["Contract or sign-up confirmation", "Termination request and reason", "Any records of service faults"],
    paraEn: "I was charged an early termination penalty that I believe does not apply. Please confirm my contract start and end dates and explain how the penalty was calculated.",
    paraMs: "Saya telah dikenakan penalti penamatan awal yang saya percaya tidak terpakai. Mohon sahkan tarikh mula dan tamat kontrak saya serta jelaskan cara penalti dikira.",
    outcomeEn: "the penalty reviewed and waived if it does not apply",
    outcomeMs: "penalti disemak semula dan dikecualikan jika tidak terpakai",
  },
  speed: {
    label: "Slow speed / service not as promised",
    labelMs: "Kelajuan perlahan / perkhidmatan tidak seperti dijanjikan",
    emoji: "🐢",
    hint: "Your internet is far slower than your plan.",
    ask: ["Can you test my line remotely?", "When will a technician fix it?", "Can I get a rebate for the affected period?"],
    evidence: ["Speed test screenshots (cable test if possible)", "Dates and times of the problems", "Previous ticket numbers"],
    paraEn: "My service has not been performing as subscribed. Speed tests show results well below my plan speed. Please investigate the line and consider a rebate for the affected period.",
    paraMs: "Perkhidmatan saya tidak berfungsi seperti yang dilanggan. Ujian kelajuan menunjukkan keputusan jauh lebih rendah daripada kelajuan pelan saya. Mohon siasat talian ini dan pertimbangkan rebat bagi tempoh yang terjejas.",
    outcomeEn: "the problem fixed and a rebate for the affected period",
    outcomeMs: "masalah dibaiki dan rebat bagi tempoh yang terjejas",
  },
  other: {
    label: "Something else",
    labelMs: "Lain-lain",
    emoji: "💬",
    hint: "Any other billing question or problem.",
    ask: ["What is causing this?", "What will you do to fix it, and by when?"],
    evidence: ["Relevant bills", "Screenshots", "Any previous reference numbers"],
    paraEn: "Please look into the issue described above and advise on the next steps.",
    paraMs: "Mohon teliti isu yang dinyatakan di atas dan nasihatkan langkah seterusnya.",
    outcomeEn: "a clear explanation and a resolution",
    outcomeMs: "penjelasan yang jelas dan penyelesaian",
  },
};

export const ISSUE_TYPES = Object.keys(ISSUES) as IssueType[];

export function isIssueType(v: unknown): v is IssueType {
  return typeof v === "string" && v in ISSUES;
}

export interface DraftInput {
  provider: ProviderId;
  issueType: IssueType;
  chargeLabel?: string | null;
  amount?: number | null;
  billMonth?: string | null;
  accountRef?: string | null;
  description?: string | null;
  desiredOutcome?: string | null;
  promisedPrice?: number | null;
  providerRef?: string | null;
  name?: string | null;
}

function monthLabel(v: string | null | undefined, lang: "en" | "ms"): string {
  if (!v) return lang === "en" ? "latest" : "terkini";
  const m = v.match(/^(\d{4})-(\d{2})$/);
  if (!m) return v;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  return d.toLocaleDateString(lang === "en" ? "en-MY" : "ms-MY", { month: "long", year: "numeric" });
}

export type Channel = "email" | "chat" | "call";

export function draftMessage(input: DraftInput, lang: "en" | "ms", channel: Channel): string {
  const p = PROVIDERS[input.provider];
  const issue = ISSUES[input.issueType];
  const en = lang === "en";
  const acct = input.accountRef ? `${en ? "account ending" : "akaun berakhir"} ${input.accountRef}` : en ? "my account" : "akaun saya";
  const month = monthLabel(input.billMonth, lang);
  const promise = input.promisedPrice
    ? en ? `a price of ${rm(input.promisedPrice)} per month` : `harga ${rm(input.promisedPrice)} sebulan`
    : en ? "a promotional price / rebate" : "harga promosi / rebat";
  const para = (en ? issue.paraEn : issue.paraMs).replace("{promise}", promise);
  const outcome = input.desiredOutcome?.trim() || (en ? issue.outcomeEn : issue.outcomeMs);
  const amountText = input.amount ? rm(input.amount) : "";
  const charge = input.chargeLabel
    ? en
      ? `The charge in question is “${input.chargeLabel}”${amountText ? ` for ${amountText}` : ""}.`
      : `Caj berkenaan ialah “${input.chargeLabel}”${amountText ? ` sebanyak ${amountText}` : ""}.`
    : amountText
      ? en
        ? `The amount in question is ${amountText}.`
        : `Jumlah yang dipertikaikan ialah ${amountText}.`
      : "";
  const details = input.description?.trim();
  const name = input.name?.trim() || (en ? "[Your name]" : "[Nama anda]");
  const ref = input.providerRef ? (en ? ` (previous reference: ${input.providerRef})` : ` (rujukan terdahulu: ${input.providerRef})`) : "";

  if (channel === "email") {
    return en
      ? [
          `Subject: Billing enquiry – ${acct} – ${month} bill${ref}`,
          "",
          `Dear ${p.name} Customer Care,`,
          "",
          `I am writing about my ${month} bill for ${acct}.`,
          "",
          `Issue: ${issue.label}`,
          charge,
          details ? `\nDetails:\n${details}\n` : "",
          para,
          "",
          `I would like ${outcome}.`,
          "",
          "Please acknowledge this enquiry and share a reference number. I understand that under the General Consumer Code of Practice (clause 7.3), a complaint made electronically should be acknowledged within 1 working day, with a proposed resolution within 3 working days for a simple case or 15 working days for a complex one.",
          "",
          "Thank you.",
          "",
          name,
        ].filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").replace(/\n{3,}/g, "\n\n")
      : [
          `Subjek: Pertanyaan bil – ${acct} – bil ${month}${ref}`,
          "",
          `Kepada Khidmat Pelanggan ${p.name},`,
          "",
          `Saya ingin membuat pertanyaan mengenai bil ${month} bagi ${acct}.`,
          "",
          `Isu: ${issue.labelMs}`,
          charge,
          details ? `\nButiran:\n${details}\n` : "",
          para,
          "",
          `Saya memohon ${outcome}.`,
          "",
          "Mohon akui penerimaan pertanyaan ini dan berikan nombor rujukan. Saya difahamkan bahawa di bawah Kod Pengguna Am (General Consumer Code), aduan yang dibuat secara elektronik perlu diakui dalam tempoh 1 hari bekerja, dengan cadangan penyelesaian dalam tempoh 3 hari bekerja bagi kes mudah atau 15 hari bekerja bagi kes kompleks (fasal 7.3).",
          "",
          "Terima kasih.",
          "",
          name,
        ].filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").replace(/\n{3,}/g, "\n\n");
  }

  if (channel === "chat") {
    return en
      ? `Hi, I'd like help with my ${month} bill for ${acct}${ref}. ${issue.label}. ${charge} ${details ? `${details} ` : ""}${para} I would like ${outcome}. Please also give me a reference number for this chat. Thank you!`.replace(/\s+/g, " ").trim()
      : `Hai, saya perlukan bantuan mengenai bil ${month} bagi ${acct}${ref}. ${issue.labelMs}. ${charge} ${details ? `${details} ` : ""}${para} Saya memohon ${outcome}. Mohon berikan juga nombor rujukan untuk sesi ini. Terima kasih!`.replace(/\s+/g, " ").trim();
  }

  const asks = issue.ask.map((a) => `   • ${a}`).join("\n");
  return en
    ? [
        `CALL SCRIPT — ${p.name}`,
        "",
        `1. "Hello, I'm calling about my ${month} bill for ${acct}."`,
        `2. "The problem is: ${issue.label}." ${charge}`,
        details ? `3. Explain briefly: ${details}` : "3. Explain briefly what happened, in one or two sentences.",
        "4. Ask:",
        asks,
        `5. Say what you want: "${outcome.charAt(0).toUpperCase() + outcome.slice(1)}."`,
        "6. Before hanging up, write down:",
        "   • The reference / ticket number",
        "   • The agent's name",
        "   • What they promised, and by when",
        "",
        "Tip: stay calm and polite, and ask for a supervisor if the agent can't help.",
      ].join("\n")
    : [
        `SKRIP PANGGILAN — ${p.name}`,
        "",
        `1. "Helo, saya menelefon mengenai bil ${month} bagi ${acct}."`,
        `2. "Masalahnya: ${issue.labelMs}." ${charge}`,
        details ? `3. Terangkan ringkas: ${details}` : "3. Terangkan ringkas apa yang berlaku dalam satu atau dua ayat.",
        "4. Tanya:",
        "   • Apakah caj ini dan kenapa ia dikenakan?",
        "   • Bolehkah ia dibetulkan, dibatalkan atau dikreditkan semula?",
        "   • Bilakah masalah ini akan diselesaikan?",
        `5. Nyatakan permintaan anda: "${outcome.charAt(0).toUpperCase() + outcome.slice(1)}."`,
        "6. Sebelum menamatkan panggilan, catat:",
        "   • Nombor rujukan / tiket",
        "   • Nama ejen",
        "   • Apa yang dijanjikan dan bila",
        "",
        "Tip: bertenang dan bersopan, dan minta untuk bercakap dengan penyelia jika ejen tidak dapat membantu.",
      ].join("\n");
}
