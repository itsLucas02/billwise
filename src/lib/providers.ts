export type ProviderId = "unifly" | "maxon" | "telcomdigi" | "tide" | "helo" | "vmobile";

export const PROVIDER_IDS: ProviderId[] = ["unifly", "maxon", "telcomdigi", "tide", "helo", "vmobile"];

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
  unifly: {
    id: "unifly",
    name: "Unifly",
    company: "Unifly Networks Sdn Bhd",
    color: "#0F766E",
    ink: "#ffffff",
    services: ["fibre", "mobile"],
    blurb: "Fibre and mobile plans on a national fixed network.",
    fibreNetwork:
      "Runs its own fixed network with broad fibre coverage, though not every street or building is connected.",
    website: "https://example.com/unifly",
    supportUrl: "https://example.com/unifly/support",
    fibreCheckUrl: "https://example.com/unifly/coverage",
    mobileMapUrl: "https://example.com/unifly/mobile-coverage",
    app: "MyUnifly app",
    channels: [
      { kind: "phone", label: "Hotline", value: "1-300-88-0100", href: "tel:1300880100", note: "Simulated" },
      { kind: "chat", label: "Live chat", value: "example.com/unifly/support", href: "https://example.com/unifly/support", note: "Simulated" },
    ],
    tips: [
      "You can view bills and raise billing enquiries in the MyUnifly app.",
      "If your promotional price has ended, ask whether you qualify for a current promotion or recontract offer.",
    ],
    detect: /unifly|unifly networks/i,
  },
  maxon: {
    id: "maxon",
    name: "Maxon",
    company: "Maxon Telecommunications Sdn Bhd",
    color: "#3730A3",
    ink: "#ffffff",
    services: ["fibre", "mobile"],
    blurb: "Mobile postpaid and home fibre, with bundle discounts for customers who take both.",
    fibreNetwork:
      "Maxon Home Fibre is delivered over partner fibre infrastructure, so availability depends on which network reaches your building.",
    website: "https://example.com/maxon",
    supportUrl: "https://example.com/maxon/support",
    fibreCheckUrl: "https://example.com/maxon/coverage",
    mobileMapUrl: "https://example.com/maxon/mobile-coverage",
    app: "Maxon app",
    channels: [
      { kind: "phone", label: "Customer service", value: "1-300-88-0200", href: "tel:1300880200", note: "Simulated" },
      { kind: "whatsapp", label: "WhatsApp", value: "+60 12-000 0200", href: "https://example.com/maxon/whatsapp", note: "Simulated" },
    ],
    tips: [
      "Customers who take both postpaid and home fibre may get a lower bundle price — worth asking if you pay for both separately.",
      "Roaming passes and content add-ons can be managed in the Maxon app.",
    ],
    detect: /maxon/i,
  },
  telcomdigi: {
    id: "telcomdigi",
    name: "TelcomDigi",
    company: "TelcomDigi Berhad",
    color: "#9F1239",
    ink: "#ffffff",
    services: ["fibre", "mobile"],
    blurb: "A large mobile operator with postpaid plans and home fibre on partner infrastructure.",
    fibreNetwork:
      "TelcomDigi Home Fibre is delivered over partner fibre infrastructure — availability depends on your exact address.",
    website: "https://example.com/telcomdigi",
    supportUrl: "https://example.com/telcomdigi/support",
    fibreCheckUrl: "https://example.com/telcomdigi/coverage",
    mobileMapUrl: "https://example.com/telcomdigi/mobile-coverage",
    app: "TelcomDigi app",
    channels: [
      { kind: "phone", label: "Customer service", value: "1-300-88-0300", href: "tel:1300880300", note: "Simulated" },
      { kind: "web", label: "Help centre", value: "example.com/telcomdigi/support", href: "https://example.com/telcomdigi/support", note: "Simulated" },
    ],
    tips: [
      "Higher-tier postpaid plans may discount supplementary lines — handy for families.",
      "Eligible postpaid customers may get home fibre at bundle prices.",
    ],
    detect: /telcomdigi|telcom digi/i,
  },
  tide: {
    id: "tide",
    name: "TIDE",
    company: "TIDE Broadband Sdn Bhd",
    color: "#334155",
    ink: "#ffffff",
    services: ["fibre"],
    blurb: "Fibre specialist known for high speeds and symmetrical upload on its own network.",
    fibreNetwork:
      "Runs its own fibre network, concentrated in high-rise buildings and selected landed areas in major cities.",
    website: "https://example.com/tide",
    supportUrl: "https://example.com/tide/support",
    fibreCheckUrl: "https://example.com/tide/coverage",
    app: "TIDE self-care (web & app)",
    channels: [
      { kind: "phone", label: "Hotline", value: "1-300-88-0400", href: "tel:1300880400", note: "Simulated" },
    ],
    tips: [
      "Prices are usually advertised before 6% SST — expect the tax on top of your plan price.",
      "No-contract options carry a one-time installation and activation charge.",
    ],
    detect: /tide broadband|tide fibre|tide internet/i,
  },
  helo: {
    id: "helo",
    name: "Helo Fibre",
    company: "Helo Fibre Sdn Bhd",
    color: "#92400E",
    ink: "#ffffff",
    services: ["fibre"],
    blurb: "Fibre provider with symmetrical speeds on most plans.",
    fibreNetwork: "Operates its own fibre network in selected neighbourhoods across several states.",
    website: "https://example.com/helo-fibre",
    supportUrl: "https://example.com/helo-fibre/support",
    fibreCheckUrl: "https://example.com/helo-fibre/coverage",
    app: "Helo Fibre website",
    channels: [
      { kind: "web", label: "Contact via website", value: "example.com/helo-fibre", href: "https://example.com/helo-fibre/support", note: "Simulated" },
    ],
    tips: [
      "Prices are subject to 6% service tax.",
      "12-month contracts carry a one-time charge; 24-month contracts don't.",
    ],
    detect: /\bhelo\b/i,
  },
  vmobile: {
    id: "vmobile",
    name: "V Mobile",
    company: "V Mobile Sdn Bhd",
    color: "#6D28D9",
    ink: "#ffffff",
    services: ["fibre", "mobile"],
    blurb: "Postpaid plans with large data quotas, plus V Home Fibre.",
    fibreNetwork: "V Home Fibre is delivered over partner fibre networks — check your exact address.",
    website: "https://example.com/v-mobile",
    supportUrl: "https://example.com/v-mobile/support",
    fibreCheckUrl: "https://example.com/v-mobile/coverage",
    mobileMapUrl: "https://example.com/v-mobile/mobile-coverage",
    app: "MyVMobile app",
    channels: [
      { kind: "phone", label: "Customer service", value: "1-300-88-0600", href: "tel:1300880600", note: "Simulated" },
      { kind: "email", label: "Email", value: "support@vmobile.example", href: "mailto:support@vmobile.example", note: "Simulated" },
    ],
    tips: [
      "Plans may slow to 512kbps after your quota instead of charging for extra data.",
      "A minimum period may apply before you can downgrade a postpaid plan.",
    ],
    detect: /v mobile|vmobile/i,
  },
};

export function isProviderId(v: unknown): v is ProviderId {
  return typeof v === "string" && (PROVIDER_IDS as string[]).includes(v);
}

export function primaryContact(id: ProviderId): SupportChannel | undefined {
  return PROVIDERS[id].channels.find((c) => c.kind === "phone") ?? PROVIDERS[id].channels[0];
}

export function detectProvider(text: string): ProviderId | null {
  const order: ProviderId[] = ["telcomdigi", "maxon", "vmobile", "unifly", "tide", "helo"];
  for (const id of order) if (PROVIDERS[id].detect.test(text)) return id;
  return null;
}

/**
 * Real escalation path for unresolved telco complaints in Malaysia. These are
 * genuine regulator details, not part of the fictional provider simulation.
 */
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
    { days: 3, text: "Acknowledge your complaint within 3 working days" },
    { days: 7, text: "Respond within 7 days with a solution or a timeline" },
    { days: 30, text: "Resolve at least 95% of complaints within 30 business days" },
  ],
};
