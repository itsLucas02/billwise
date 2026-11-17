import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const jakarta = localFont({
  src: "./fonts/PlusJakartaSans.ttf",
  variable: "--font-jakarta",
  weight: "200 800",
  display: "swap",
});

const bricolage = localFont({
  src: "./fonts/BricolageGrotesque.ttf",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://billwise-blush.vercel.app"),
  openGraph: { siteName: "BillWise", locale: "en_MY", type: "website" },
  twitter: { card: "summary_large_image" },
  title: {
    default: "BillWise — Understand your telco bill, pay only for what you need",
    template: "%s · BillWise",
  },
  description:
    "BillWise helps Malaysians decode telco bills, spot overcharges, compare Unifi, Maxis, CelcomDigi, TIME, Allo and U Mobile plans, check coverage the honest way, and resolve billing problems.",
};

export const viewport: Viewport = {
  themeColor: "#fbf8f2",
  width: "device-width",
  initialScale: 1,
};

const textSizeScript = `try{var s=localStorage.getItem('bw_text');if(s==='lg'||s==='xl'){document.documentElement.setAttribute('data-text',s);}}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-MY" className={`${jakarta.variable} ${bricolage.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: textSizeScript }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
