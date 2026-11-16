// Anatomy figure: "Inside the decoder" — the owner's (redacted) Aug 2026 Unifi bill on a clipboard, read line by line
// under a magnifier; red sticky flags mark what BillWise flags. Built with the Anatomy kit (vendor/anatomy-kit, MIT).
//   node scripts/figures/bill-loupe.mjs [--preview <dir>] -> src/components/figures/billLoupe.generated.ts
// Camera: azimuth 70 / elevation 45, so text (world x) runs almost across the screen and rows (world +y) go down it.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./vendor/anatomy-kit/iso-kit.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const W = 640, H = 420;
const ROWS = [
  { label: "Unifi Home 500Mbps", amt: "159.00", flag: false, note: "your monthly plan, billed as expected" },
  { label: "Promo discount", amt: "-40.00", flag: false, note: "your promo is still applied" },
  { label: "Reconnection fee", amt: "10.00", flag: true, note: "your line was cut off for an overdue balance" },
  { label: "Service tax 6%", amt: "7.74", flag: false, note: "the correct 6% rate for telco services" },
  { label: "Unpaid from last bill", amt: "136.75", flag: true, note: "you're one bill behind, so each payment clears the older bill" },
];
const TOTAL = "273.50";

/* ── world ── */
const BOARD = { x: -108, y: -150, w: 216, d: 296, r: 10 };
const BOARD_Z = -7;
const SHEET = { x: -92, y: -120, w: 184, d: 252, r: 1.2 };
const BACK_SHEET = { x: -89, y: -116, w: 184, d: 252, r: 1.2 };
const PAPER_Z = 0.6; // top of the back sheet
const TOP = PAPER_Z + 1.0; // top of the printed sheet
const X0 = SHEET.x + 16, XR = SHEET.x + SHEET.w - 30, XM = SHEET.x + SHEET.w - 16; // text start, amount column, margin
const ROW0 = -50, ROW_STEP = 23;
const rowY = (i) => ROW0 + i * ROW_STEP;
const LENS_R = 28, LENS_Z = 12, LENS_X = 49; // over the amount column: the money is what matters

let P = null;
P = k.fitProjection(
  [...k.boxCorners(BOARD, BOARD_Z, 0), [LENS_X + 130, rowY(4) + 20, LENS_Z + 6], [-155, 100, 0]],
  W, H, { pad: 28, azimuth: 70, elevation: 45 },
);
const at = (p) => k.iso(p, P);
// The lens hovers LENS_Z above the paper; shift it along +y so its centre lands on screen over the row it reads.
const TEXT_MID = -2.6; // half a line above the baseline: the middle of the printed text
const LENS_DY = (() => { const want = at([LENS_X, TEXT_MID, TOP])[1]; let dy = 0; for (let n = 0; n < 40; n++) dy += (want - at([LENS_X, dy, LENS_Z + 4])[1]) * 0.5; return dy; })();
const S = (paths, st) => k.solidSvg(paths, st);
const L = (d, st) => k.lineSvg(d, st);
const D = (pts, st) => k.dotsSvg(pts, st);
const T = (x, y, text, opts) => k.faceTextSvg(k.topMatrix([x, y], TOP, P, "x"), text, opts);
const flatPath = (pts, z) => "M" + pts.map((p) => at([p[0], p[1], z]).map((v) => v.toFixed(2)).join(" ")).join(" L") + " Z";

function board() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BOARD, BOARD_Z, 7, P)}"/>`];
  out.push(S(k.slabOf(BOARD, BOARD_Z, 7, P, 8, 1.2), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BOARD, 4), 0, P), { tone: "faint" }));
  // hanging hole near the top edge
  out.push(L(k.ring(0, BOARD.y + 10, 5, 0, P, 24), { tone: "lo" }));
  return out.join("");
}

function paper() {
  const out = [];
  out.push(S(k.slabOf(BACK_SHEET, 0, PAPER_Z, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf(SHEET, PAPER_Z, TOP - PAPER_Z, P, 2), { tone: "hi", crease: "lo" }));
  // header: provider and bill period (no logo, just the name)
  out.push(T(X0, -98, "Unifi", { size: 15, tone: "hi" }));
  out.push(T(X0, -87, "Account ••••8888", { size: 5, tone: "lo" }));
  out.push(T(XR + 16, -97, "BILL · AUG 2026", { size: 5.6, tone: "mid", anchor: "end" }));
  out.push(T(XR + 16, -87, "Pay by 28 Aug 2026", { size: 5, tone: "lo", anchor: "end" }));
  out.push(L(k.lineOnTop([X0, -78], [XM, -78], TOP, P), { tone: "lo" }));
  // table
  out.push(T(X0, ROW0 - 16, "THIS MONTH'S CHARGES", { size: 4.6, tone: "lo" }), T(XR, ROW0 - 16, "RM", { size: 4.6, tone: "lo", anchor: "end" }));
  ROWS.forEach((r, i) => {
    const y = rowY(i);
    out.push(`<g data-row="${i}">${T(X0, y, r.label, { size: 7.2, tone: "mid" })}${T(XR, y, r.amt, { size: 7.2, tone: "mid", anchor: "end" })}</g>`);
    if (i < ROWS.length - 1) out.push(L(k.lineOnTop([X0, y + 9], [XM, y + 9], TOP, P), { tone: "faint" }));
  });
  const ty = rowY(ROWS.length) + 8;
  out.push(L(k.lineOnTop([X0, ty - 13], [XM, ty - 13], TOP, P), { tone: "mid" }));
  out.push(T(X0, ty, "Total amount payable", { size: 7.6, tone: "hi" }), T(XR, ty, TOTAL, { size: 8.4, tone: "hi", anchor: "end" }));
  // payment slip along the foot: perforation, barcode, small print
  const slipY = SHEET.y + SHEET.d - 40;
  out.push(L(k.lineOnTop([SHEET.x, slipY], [SHEET.x + SHEET.w, slipY], TOP, P), { tone: "lo", dashed: true }));
  const bars = [];
  for (let i = 0; i < 36; i++) { const x = X0 + i * 2.4; if ((i * 7) % 5 !== 0) bars.push(k.lineOnTop([x, slipY + 10], [x, slipY + 24], TOP, P)); }
  out.push(L(bars.join(""), { tone: "mid", free: "both" }));
  out.push(T(XR + 16, slipY + 16, "JomPAY · Biller 8888", { size: 4.6, tone: "lo", anchor: "end" }));
  out.push(T(XR + 16, slipY + 24, `RM ${TOTAL}`, { size: 5.4, tone: "mid", anchor: "end" }));
  return out.join("");
}

// A pen tick for a line that checks out, drawn in the margin when the magnifier reaches it.
const tick = (i) => {
  const y = rowY(i) - 2.5, x = XM - 4;
  return `<g data-mark="${i}" class="bl-tick">${L(`${k.lineOnTop([x - 3, y], [x - 0.6, y + 3], TOP, P)}${k.lineOnTop([x - 0.6, y + 3], [x + 4.5, y - 4], TOP, P)}`, { tone: "hi", free: "both" })}</g>`;
};
// A red sticky flag on the sheet's left edge at a flagged line (the magnifier's handle works the right side).
const flag = (i) => {
  // sits on the line's lower half: the rows slope down to the right, so a flag left of the text must sit a touch lower to read as this line
  const y = rowY(i) - 2.5, x0 = SHEET.x - 22, x1 = SHEET.x + 6, z = TOP + 0.15;
  const body = flatPath([[x0, y], [x1, y], [x1, y + 9], [x0, y + 9]], z);
  const stuck = flatPath([[x1 - 10, y], [x1, y], [x1, y + 9], [x1 - 10, y + 9]], z + 0.01);
  return `<g data-mark="${i}" class="bl-flag"><path class="bl-flag-shadow" d="${flatPath([[x0 + 1.5, y + 2], [x1 + 1.5, y + 2], [x1 + 1.5, y + 11], [x0 + 1.5, y + 11]], z - 0.1)}"/><path class="bl-flag-body" d="${body}"/><path class="bl-flag-stuck" d="${stuck}"/></g>`;
};

function clip() {
  // a metal bulldog clip at the top of the board
  const out = [];
  const base = { x: -46, y: -146, w: 92, d: 30, r: 5 };
  out.push(S(k.slabOf(base, 0, 2.2, P, 5, 0.6), { tone: "mid" }));
  out.push(D([at([base.x + 9, base.y + 9, 2.2]), at([base.x + base.w - 9, base.y + 9, 2.2])], { size: 0.7 }));
  out.push(L([base.x + 9, base.x + base.w - 9].map((x) => k.ring(x, base.y + 9, 2.4, 2.2, P, 16)).join(""), { tone: "lo" }));
  // jaw pressing on the paper, a hinge barrel, and the lever lifted toward the viewer
  out.push(S(k.slabOf({ x: -40, y: -124, w: 80, d: 14, r: 4 }, TOP, 3.4, P, 4, 0.6), { tone: "mid" }));
  out.push(L(k.lineOnTop([-34, -117], [34, -117], TOP + 3.4, P), { tone: "faint" }));
  out.push(S(k.slabOf({ x: -42, y: -136, w: 84, d: 10, r: 5 }, 2.2, 8, P, 6, 1.2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -30, y: -150, w: 60, d: 16, r: 6 }, 9, 3, P, 6, 0.8), { tone: "mid" }));
  out.push(D([at([-40, -131, 10.2]), at([40, -131, 10.2])], { size: 0.8, tone: "hi" }));
  return out.join("");
}

function pen() {
  // a ballpoint pen lying beside the board, parallel to it
  const out = [];
  const body = { x: -150, y: -60, w: 9, d: 150, r: 4.5 };
  out.push(`<path class="iso-halo" d="${k.haloOf(body, BOARD_Z, 2, P)}" style="filter:blur(2px)"/>`);
  out.push(S(k.slabOf(body, BOARD_Z, 8, P, 6, 1), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -149.5, y: -60, w: 8, d: 38, r: 4 }, BOARD_Z + 0.2, 8.6, P, 6, 0.8), { tone: "hi" }));
  out.push(S(k.slabOf({ x: -146.5, y: -56, w: 2, d: 30, r: 1 }, BOARD_Z + 8.8, 1.4, P, 3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -148.5, y: 90, w: 6, d: 9, r: 3 }, BOARD_Z + 1, 6, P, 6, 0.6), { tone: "lo" }));
  out.push(L([-10, 30, 70].map((y) => k.lineOnTop([body.x, y], [body.x + body.w, y], BOARD_Z + 8, P)).join(""), { tone: "faint" }));
  return out.join("");
}

// The magnifier: built over row 0 and moved down the rows with translateAlong.
function loupe() {
  const cy = LENS_DY; // built for row y = 0 (offset so it projects onto the row) and translated to the row
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: LENS_X - LENS_R + 6, y: cy - LENS_R + 10, w: LENS_R * 2, d: LENS_R * 2, r: LENS_R }, TOP, 0.1, P)}" style="filter:blur(5px);opacity:.5"/>`);
  // handle off to the right, with a ferrule
  out.push(S(k.slabOf({ x: LENS_X + LENS_R + 10, y: cy - 5.5, w: 74, d: 11, r: 5.5 }, LENS_Z - 2, 9, P, 6, 1.2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: LENS_X + LENS_R - 2, y: cy - 4.5, w: 14, d: 9, r: 3 }, LENS_Z - 1, 7, P, 4, 0.6), { tone: "hi" }));
  out.push(L([LENS_X + LENS_R + 30, LENS_X + LENS_R + 36, LENS_X + LENS_R + 42].map((x) => k.lineOnTop([x, cy - 5.5], [x, cy + 5.5], LENS_Z + 7, P)).join(""), { tone: "faint" }));
  return out.join("");
}
const rimSide = () => S(k.cylinder(LENS_X, LENS_DY, LENS_R + 3, LENS_Z, 4, P, 64, 0.6), { tone: "mid" }).replace(/<path[^>]*data-face="top"[^>]*\/>/, "");
const lensGlass = () => `<path class="bl-glass" d="${k.ring(LENS_X, LENS_DY, LENS_R, LENS_Z + 4, P, 64)}"/>`;
const rimTop = () => `<path class="bl-rim" fill-rule="evenodd" d="${k.ring(LENS_X, LENS_DY, LENS_R + 3, LENS_Z + 4, P, 64)} ${k.ring(LENS_X, LENS_DY, LENS_R, LENS_Z + 4, P, 64)}"/>${L(k.ring(LENS_X, LENS_DY, LENS_R + 3, LENS_Z + 4, P, 64), { tone: "mid" })}${L(k.ring(LENS_X, LENS_DY, LENS_R, LENS_Z + 4, P, 64), { tone: "lit" })}`;

// Each row's magnified copy, clipped to the lens; only the active row's copy shows.
function magnified() {
  const centre = at([LENS_X, TEXT_MID, TOP]);
  const lens = at([LENS_X, LENS_DY, LENS_Z + 4]);
  const ringD = k.ring(LENS_X, LENS_DY, LENS_R - 1, LENS_Z + 4, P, 64);
  const out = [`<clipPath id="bl-lens"><path d="${ringD}"/></clipPath>`];
  ROWS.forEach((r, i) => {
    // the row's text, shifted so the line under the lens centre is magnified 1.55x about the lens centre
    const shift = [centre[0] - lens[0], centre[1] - lens[1]];
    const rowText = `<g transform="translate(${(-shift[0]).toFixed(2)} ${(-shift[1]).toFixed(2)})">${T(X0, rowY(i) - rowY(i), r.label, { size: 7.2, tone: "hi" })}${T(XR, 0, r.amt, { size: 7.2, tone: "hi", anchor: "end" })}</g>`;
    out.push(`<g data-mag="${i}" class="bl-mag" clip-path="url(#bl-lens)"><g transform="translate(${lens[0].toFixed(2)} ${lens[1].toFixed(2)}) scale(1.55) translate(${(-lens[0]).toFixed(2)} ${(-lens[1]).toFixed(2)})">${rowText}</g></g>`);
  });
  return out.join("");
}

const svg = k.figureSvg({
  width: W,
  height: H,
  label: "A printed Unifi bill for August 2026 on a clipboard. A magnifying glass moves down the bill one line at a time. Lines that check out get a pen tick; the reconnection fee and the unpaid balance from the last bill get red sticky flags.",
  body: [
    board(),
    paper(),
    ROWS.map((r, i) => (r.flag ? flag(i) : tick(i))).join(""),
    clip(),
    pen(),
    `<g data-part="loupe" transform="${k.translateAlong(P, [0, rowY(0), 0])}">${loupe()}${rimSide()}${lensGlass()}${magnified()}${rimTop()}</g>`,
  ],
});

const money = (s) => (s.startsWith("-") ? `−RM${s.slice(1)}` : `RM${s}`);
const READOUTS = ROWS.map((r, i) => `Line ${i + 1} · ${r.label} · ${money(r.amt)} · ${r.flag ? "flagged" : "checks out"}`);
const plate = k.plateHtml({
  fig: "Fig 1",
  title: "Every line, checked",
  hint: "Hover the bill or use arrow keys",
  readout: READOUTS[0],
  keys: [
    { mark: "lit", label: "Magnifier: BillWise reading one line at a time" },
    { mark: "raised", label: "Red flags: charges worth questioning" },
  ],
  caption: "A real Unifi bill (August 2026, account details removed). BillWise checks each line against fixed rules: the plan, promo and tax check out; the RM10.00 reconnection fee and the RM136.75 carried from the last bill are flagged, each with a plain reason.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Bill lines: arrow keys move the magnifier" aria-valuemin="1" aria-valuemax="${ROWS.length}" aria-valuenow="1" aria-valuetext="${READOUTS[0]}">${svg}</div>`,
});

const unit = k.axisVector(P, [0, 1, 0]);
writeFileSync(join(ROOT, "src/components/figures/billLoupe.generated.ts"), `// GENERATED by scripts/figures/bill-loupe.mjs. Do not edit.
export const BILL_LOUPE_HTML = ${JSON.stringify(plate)};
export const ROWS = ${JSON.stringify(ROWS)};
export const ROW_Y = ${JSON.stringify(ROWS.map((_, i) => rowY(i)))};
export const ROW_UNIT = ${JSON.stringify(unit.map((v) => Math.round(v * 10000) / 10000))};
export const READOUTS = ${JSON.stringify(READOUTS)};
`);
console.log("wrote billLoupe.generated.ts");
if (process.argv.includes("--preview")) {
  const dir = process.argv[process.argv.indexOf("--preview") + 1];
  const css = `<style>.bl-flag-body{fill:#e5484d}.bl-flag-stuck{fill:#c9363b}.bl-flag-shadow{fill:rgba(15,27,45,.12)}.bl-glass{fill:rgba(255,255,255,.82);stroke:none}.bl-rim{fill:#d9d4ca}.bl-mag text{font-weight:600}[data-mag="0"]{opacity:1!important}[data-mark]{opacity:1}</style>`;
  writeFileSync(join(dir, "bill-loupe-light.html"), k.pageHtml({ title: "Bill loupe", theme: "light", body: css + plate }));
  console.log("preview written");
}
