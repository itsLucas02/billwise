import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
// Satori cannot read variable fonts, so fonts/og holds static instances of the site fonts (fonttools varLib.instancer; OFL).
import { OgMark } from "./og-mark";

// The card WhatsApp, X, Facebook and Slack show when someone shares a BillWise link.
export const alt = "BillWise: understand your telco bill and pay only for what you need";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0f1b2d", PAPER = "#fbf8f2", MUTED = "#586477", LINE = "#e6dccb";

// a few real lines from the sample Unifi bill on the homepage, with the flag BillWise raises
const LINES: Array<[string, string, string?]> = [
  ["Unifi Home 300Mbps", "139.00"],
  ["Unifi TV Add-on Pack", "49.00"],
  ["Mesh Wi-Fi Add-on (2 units)", "20.00"],
  ["Late payment charge", "10.00", "Ask for a one-time waiver"],
  ["Service tax 6%", "12.48"],
  ["Rounding adjustment", "0.02"],
];

export default async function OpengraphImage() {
  const display = await readFile(new URL("./fonts/og/Bricolage-800.ttf", import.meta.url));
  const body = await readFile(new URL("./fonts/og/Jakarta-500.ttf", import.meta.url));
  const bold = await readFile(new URL("./fonts/og/Jakarta-800.ttf", import.meta.url));
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: PAPER, fontFamily: "Jakarta", color: INK, padding: "64px 72px" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <OgMark size={56} />
            <span style={{ fontFamily: "Bricolage", fontSize: 38, fontWeight: 800 }}>
              Bill<span style={{ color: "#0b8f63" }}>Wise</span>
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "Bricolage", fontSize: 62, fontWeight: 800, lineHeight: 1.04, letterSpacing: -1.5, display: "flex", flexDirection: "column" }}>
              <span>Understand your</span><span>telco bill.</span>
            </div>
            <div style={{ fontFamily: "Bricolage", fontSize: 62, fontWeight: 800, lineHeight: 1.04, letterSpacing: -1.5, color: "#0b8f63", display: "flex", flexDirection: "column" }}>
              <span>Pay only for</span><span>what you need.</span>
            </div>
            <div style={{ marginTop: 22, fontSize: 26, color: MUTED, lineHeight: 1.35 }}>
              Free for every Malaysian. Decode a bill, compare plans, dispute a charge.
            </div>
          </div>
          <div style={{ fontSize: 24, color: MUTED }}>billwise-blush.vercel.app</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginLeft: 48, marginTop: 8, width: 420, height: 500, background: "#fff", border: `2px solid ${LINE}`, borderRadius: 28, padding: "30px 30px", transform: "rotate(2deg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 26, fontWeight: 800 }}>Unifi · Oct 2026</span>
            <span style={{ fontSize: 16, color: MUTED }}>EXAMPLE</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 18 }}>
            {LINES.map(([label, amt, flag]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", padding: "8px 0", borderTop: `1px solid ${LINE}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 21 }}>
                  <span>{label}</span>
                  <span style={{ fontWeight: 800 }}>{amt}</span>
                </div>
                {flag && (
                  <div style={{ display: "flex", marginTop: 8 }}>
                    <span style={{ background: "#e0442a", color: "#fff", fontSize: 17, fontWeight: 800, borderRadius: 8, padding: "4px 10px" }}>↳ {flag}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 14, borderTop: `2px solid ${INK}` }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10, background: INK, color: "#fff", borderRadius: 14, padding: "8px 12px", fontSize: 16, fontWeight: 800 }}>
              Bill health <span style={{ color: "#ffc23d" }}>69 / 100</span>
            </span>
            <span style={{ fontFamily: "Bricolage", fontSize: 30, fontWeight: 800 }}>RM230.50</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage", data: display, weight: 800, style: "normal" },
        { name: "Jakarta", data: body, weight: 500, style: "normal" },
        { name: "Jakarta", data: bold, weight: 800, style: "normal" },
      ],
    },
  );
}
