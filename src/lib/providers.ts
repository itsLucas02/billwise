export type ProviderId = "unifi" | "maxis" | "celcomdigi" | "time" | "allo" | "umobile" | "yes";

export const PROVIDER_IDS: ProviderId[] = ["unifi", "maxis", "celcomdigi", "time", "allo", "umobile", "yes"];

export type ChannelKind = "phone" | "whatsapp" | "chat" | "web" | "email";

export interface SupportChannel {
  kind: ChannelKind;
  label: string;
  value: string;
  href: string;
  note?: string;
}

export interface Provider {
  id: ProviderId;
  name: string;
  company: string;
  color: string;
  ink: string;
  services: Array<"fibre" | "mobile">;
  blurb: string;
  fibreNetwork: string;
  website: string;
  supportUrl: string;
  fibreCheckUrl: string;
  mobileMapUrl?: string;
  app: string;
  channels: SupportChannel[];
  tips: string[];
  detect: RegExp;
}

export const PROVIDERS: Record<ProviderId, Provider> = {
  unifi: {
    id: "unifi",
    name: "Unifi",
    company: "Telekom Malaysia (TM)",
    color: "#F26B1D",
    ink: "#ffffff",
    services: ["fibre", "mobile"],
    blurb: "TM's consumer brand for Unifi Home fibre and Unifi Mobile (UNI5G) plans.",
    fibreNetwork:
      "Runs on TM's own fixed network — the widest fibre footprint in Malaysia, though not every street or building is connected.",
    website: "https://unifi.com.my",
    supportUrl: "https://unifi.com.my/support/contact-us",
    fibreCheckUrl: "https://unifi.com.my/check-coverage",
    mobileMapUrl: "https://unifi.com.my/our-network",
    app: "MyUnifi app",
    channels: [
      { kind: "phone", label: "Hotline", value: "100", href: "tel:100", note: "From local lines" },
      { kind: "phone", label: "From overseas", value: "+603-2241 1290", href: "tel:+60322411290" },
      { kind: "chat", label: "Live chat", value: "unifi.com.my / MyUnifi app", href: "https://unifi.com.my/support/contact-us" },
    ],
    tips: [
      "You can view bills and raise billing enquiries in the MyUnifi app.",
      "If your promotional price has ended, ask whether you qualify for a current promotion or recontract offer.",
    ],
    detect: /unifi|telekom malaysia|tm technology services|uni5g/i,
  },
  maxis: {
    id: "maxis",
    name: "Maxis",
    company: "Maxis Broadband Sdn Bhd",
    color: "#1C9A55",
    ink: "#ffffff",
    services: ["fibre", "mobile"],
    blurb: "Mobile postpaid (Maxis, Hotlink) and Maxis Home Fibre, with bundle discounts for customers who have both.",
    fibreNetwork:
      "Maxis Home Fibre is delivered over partner fibre infrastructure, so availability depends on which network reaches your building.",
    website: "https://www.maxis.com.my",
    supportUrl: "https://www.maxis.com.my/en/contact-us/",
    fibreCheckUrl: "https://www.maxis.com.my/en/broadband/",
    mobileMapUrl: "https://www.maxis.com.my/en/coverage/",
    app: "Maxis app",
    channels: [
      { kind: "phone", label: "From a Maxis line", value: "123", href: "tel:123" },
      { kind: "phone", label: "From other lines", value: "1-800-82-1123", href: "tel:1800821123" },
      { kind: "whatsapp", label: "WhatsApp", value: "+6012-345 1123", href: "https://wa.me/60123451123", note: "24/7" },
    ],
    tips: [
      "Maxis Postpaid customers get lower Home Fibre bundle prices — worth asking if you pay for both separately.",
      "Roaming passes and content add-ons can be managed in the Maxis app.",
    ],
    detect: /maxis|hotlink/i,
  },
  celcomdigi: {
    id: "celcomdigi",
    name: "CelcomDigi",
    company: "CelcomDigi Berhad",
    color: "#2F5BEA",
    ink: "#ffffff",
    services: ["fibre", "mobile"],
    blurb: "Malaysia's largest mobile operator (formed from Celcom and Digi), plus CelcomDigi Home Fibre.",
    fibreNetwork:
      "CelcomDigi Home Fibre is delivered over partner fibre infrastructure — availability depends on your exact address.",
    website: "https://www.celcomdigi.com",
    supportUrl: "https://help.celcomdigi.com",
    fibreCheckUrl: "https://www.celcomdigi.com/fibre/home-fibre",
    mobileMapUrl: "https://corporate.celcomdigi.com/network/checker",
    app: "CelcomDigi app",
    channels: [
      { kind: "phone", label: "Customer service", value: "016-333 1111", href: "tel:+60163331111" },
      { kind: "whatsapp", label: "WhatsApp", value: "016-333 1111", href: "https://wa.me/60163331111", note: "8am–8pm" },
      { kind: "web", label: "Help centre", value: "help.celcomdigi.com", href: "https://help.celcomdigi.com" },
    ],
    tips: [
      "Postpaid 5G 140 and above give 50% off supplementary lines — handy for families.",
      "Eligible postpaid customers can get Home Fibre at bundle prices.",
    ],
    detect: /celcomdigi|celcom|\bdigi\b|xpax/i,
  },
  time: {
    id: "time",
    name: "TIME",
    company: "TIME dotCom Berhad",
    color: "#F454CD",
    ink: "#1f1600",
    services: ["fibre"],
    blurb: "Fibre specialist known for high speeds and symmetrical upload on its own network.",
    fibreNetwork:
      "Runs its own fibre network, concentrated in high-rise buildings and selected landed areas in major cities.",
    website: "https://www.time.com.my",
    supportUrl: "https://www.time.com.my/support/for-home/faq?faq=home",
    fibreCheckUrl: "https://www.time.com.my",
    app: "TIME Self Care (web & app)",
    channels: [{ kind: "phone", label: "Hotline", value: "1800-18-1818", href: "tel:1800181818" }],
    tips: [
      "TIME advertises prices excluding 6% SST — expect the tax on top of your plan price.",
      "No-contract options carry a one-time installation and activation charge.",
    ],
    detect: /time dotcom|time internet|time fibre|time\.com\.my|masa internet/i,
  },
  allo: {
    id: "allo",
    name: "Allo",
    company: "Allo Technology Sdn Bhd (TNB group)",
    color: "#712A81",
    ink: "#ffffff",
    services: ["fibre"],
    blurb: "TNB-owned fibre provider with symmetrical speeds on most plans.",
    fibreNetwork: "Operates its own fibre network in selected neighbourhoods across several states.",
    website: "https://www.allo.my",
    supportUrl: "https://www.allo.my",
    fibreCheckUrl: "https://www.allo.my/coverage",
    app: "Allo online portal",
    channels: [
      { kind: "phone", label: "Hotline", value: "1300-38-8000", href: "tel:1300388000" },
      { kind: "email", label: "Email", value: "customerservice@allo.my", href: "mailto:customerservice@allo.my" },
      { kind: "web", label: "Contact via website", value: "allo.my", href: "https://www.allo.my" },
    ],
    tips: [
      "Allo prices are subject to 6% service tax.",
      "12-month contracts carry a one-time charge; 24-month contracts don't.",
    ],
    detect: /\ballo\b/i,
  },
  umobile: {
    id: "umobile",
    name: "U Mobile",
    company: "U Mobile Sdn Bhd",
    color: "#F5A300",
    ink: "#1f1600",
    services: ["fibre", "mobile"],
    blurb: "ULTRA postpaid plans with large data quotas, plus U Home Fibre.",
    fibreNetwork: "U Home Fibre is delivered over partner fibre networks — check your exact address.",
    website: "https://www.u.com.my",
    supportUrl: "https://www.u.com.my/en/personal/support/contact-us",
    fibreCheckUrl: "https://www.u.com.my/en/personal/broadband/fibre/check-coverage",
    mobileMapUrl: "https://www.u.com.my/en/personal/support/coverage-map",
    app: "MyUMobile app",
    channels: [
      { kind: "phone", label: "From a U Mobile line", value: "1318", href: "tel:1318" },
      { kind: "phone", label: "From other lines", value: "+6018-388 1318", href: "tel:+60183881318" },
      { kind: "email", label: "Email", value: "customer.service@u.com.my", href: "mailto:customer.service@u.com.my" },
    ],
    tips: [
      "ULTRA plans slow to 512kbps after your quota instead of charging for extra data.",
      "A 90-day minimum applies before you can downgrade a postpaid plan.",
    ],
    detect: /u mobile|umobile|u\.com\.my|ultra postpaid/i,
  },
  yes: {
    id: "yes",
    name: "Yes",
    company: "YTL Communications Sdn Bhd",
    color: "#111111",
    ink: "#ffffff",
    services: ["mobile"],
    blurb: "YTL's 5G mobile network with no-contract postpaid plans, many with uncapped data.",
    fibreNetwork: "Yes sells 5G mobile and wireless broadband, not fibre. Its checker shows 5G coverage.",
    website: "https://www.yes.my",
    supportUrl: "https://www.yes.my/docs/faq",
    fibreCheckUrl: "https://www.yes.my/coverage/",
    mobileMapUrl: "https://www.yes.my/coverage/",
    app: "MyYes app",
    channels: [
      { kind: "chat", label: "Live chat (Ask Sofia)", value: "yes.my / MyYes app", href: "https://www.yes.my/support/offlinechat/" },
      { kind: "email", label: "Email", value: "yescare@yes.my", href: "mailto:yescare@yes.my" },
    ],
    tips: [
      "Yes postpaid plans on the no-contract tab can be cancelled without a penalty.",
      "On uncapped plans, check the hotspot allowance: it is capped separately from your data.",
    ],
    detect: /yes\.my|ytl communications|yes (postpaid|infinite|power \d+|ai \d+)/i,
  },
};

export function isProviderId(v: unknown): v is ProviderId {
  return typeof v === "string" && (PROVIDER_IDS as string[]).includes(v);
}

export function primaryContact(id: ProviderId): SupportChannel | undefined {
  const p = PROVIDERS[id];
  if (!p) return undefined;
  return p.channels.find((c) => c.kind === "phone") ?? p.channels[0];
}

export function detectProvider(text: string): ProviderId | null {
  const order: ProviderId[] = ["celcomdigi", "maxis", "umobile", "unifi", "time", "allo", "yes"];
  for (const id of order) if (PROVIDERS[id].detect.test(text)) return id;
  return null;
}

/** Official escalation path for unresolved telco complaints in Malaysia. */
export const ESCALATION = {
  cfm: {
    name: "Communications & Multimedia Consumer Forum of Malaysia (CFM)",
    portal: "https://aduan.skmm.gov.my",
    site: "https://cfm.my",
    hotline: "1800-18-2222",
    app: "My Mobile Rights app",
  },
  mcmc: {
    name: "Malaysian Communications and Multimedia Commission (MCMC)",
    hotline: "1800-188-030",
  },
  gcc: [
    // GCC 2nd ed. (Nov 2022) cl. 7.3.1 & 7.3.3. shortcut: `days` is a calendar-day approximation of working days, used only for the case-page reminder.
    { days: 3, text: "Acknowledge your complaint: on the spot for calls or counter visits, within 1 working day for email, web or app, within 3 working days for letters" },
    { days: 6, text: "Propose a resolution within 3 working days of acknowledging a simple complaint" },
    { days: 22, text: "Propose a resolution within 15 working days for a complex complaint, or explain the delay and give a timeframe" },
  ],
};
