// Anatomy figure: "How BillWise reads your bill" — a mail-sorting bench. Built with the Anatomy kit
// (scripts/figures/vendor/anatomy-kit, MIT). Every number comes from BillWise's own decoder run on the
// Unifi promo sample bill, so the drawing can't drift from the app.
//   node scripts/figures/bill-sorter.mjs            -> src/components/figures/billSorter.generated.ts
//   node scripts/figures/bill-sorter.mjs --preview  -> also a standalone light-theme HTML page for review
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./vendor/anatomy-kit/iso-kit.mjs";
import { decodeBill } from "../../src/lib/decoder.ts";
import { SAMPLE_BILLS } from "../../src/lib/samples.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../..");

/* ───────── truth: the decoder's own result for the sample bill ───────── */
const sample = SAMPLE_BILLS.find((s) => s.id === "unifi-promo");
const A = decodeBill({ text: sample.text, provider: sample.provider, promisedPrice: sample.promised });
const sumOf = (cats) => Math.round(A.items.filter((i) => cats.includes(i.category)).reduce((s, i) => s + i.amount, 0) * 100) / 100;
const itemsOf = (cats) => A.items.filter((i) => cats.includes(i.category)).map((i) => i.label);
const findingFor = (re) => A.findings.find((f) => re.test(f.title));
const BINS = [
  { key: "plan", name: "Monthly plan", cats: ["plan", "rebate", "prorated"], note: findingFor(/more than the price you signed up for/)?.title },
  { key: "addon", name: "Add-ons", cats: ["addon", "vas", "device"], note: findingFor(/add-ons/)?.title },
  { key: "oneoff", name: "One-offs & usage", cats: ["one_time", "usage", "roaming", "idd", "penalty", "other"], note: null },
  { key: "late", name: "Late & reconnection fees", cats: ["late_fee"], note: findingFor(/late payment charge|reconnection fee/)?.title },
  { key: "tax", name: "Service tax", cats: ["tax"], note: findingFor(/Service tax/)?.title },
].map((b) => {
  const amount = sumOf(b.cats);
  const flagged = A.findings.some((f) => f.severity !== "good" && f.severity !== "low" && f.itemIds?.some((id) => b.cats.includes(A.items.find((i) => i.id === id)?.category)));
  return { ...b, amount, items: itemsOf(b.cats), flagged };
});
const TOTAL = A.totals.total;

/* ───────── world ───────── */
const WIDTH = 640;
const HEIGHT = 400;
const PLATE = { x: -190, y: -70, w: 392, d: 140, r: 9 };
const PLATE_H = 12;
const FOOT_H = 5;
const BIN = { w: 46, d: 52, h: 20, wall: 2.2, gap: 8, y: -6 };
const BIN_X = (i) => -118 + i * (BIN.w + BIN.gap);
const BIN_CX = (i) => BIN_X(i) + BIN.w / 2;
const STACK_PER_RM = 0.17; // slip-stack height in world units per ringgit (the stack IS the amount)
const stackH = (rm) => (rm > 0 ? Math.max(1.6, rm * STACK_PER_RM) : 0);
const POSTS = [-150, 152];
const POST_Y = -50;
const BEAM_Z = 92;
const BEAM = { x: POSTS[0] - 6, y: POST_Y - 7, w: POSTS[1] - POSTS[0] + 12, d: 14, r: 2 };
const ARM_Z = 58;
const FEED = { x: -182, y: -2, w: 52, d: 62, r: 3 };

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [POSTS[0], POST_Y, BEAM_Z + 12], [POSTS[1], POST_Y, BEAM_Z + 12]],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 40 },
);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = k.corners(PLATE, 24).sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P));
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // ruler strip along the front edge, under the bins: one tick per RM10 of stack height
  const strip = { x: BIN_X(0), y: PLATE.y + PLATE.d - 15, w: BIN_X(4) + BIN.w - BIN_X(0), d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  // engraved label plate: the one word in the drawing — it is a rules machine
  const label = { x: 158, y: 8, w: 34, d: 18, r: 1.2 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3, 0.3), { tone: "lo", crease: "none" }));
  out.push(k.faceTextSvg(k.topMatrix([label.x + 4, label.y + 11], 0.8, P, "x"), "RULES", { size: 4, tone: "mid" }));
  out.push(D([at([label.x + 2.4, label.y + 2.4, 0.8]), at([label.x + label.w - 2.4, label.y + 2.4, 0.8]), at([label.x + 2.4, label.y + label.d - 2.4, 0.8]), at([label.x + label.w - 2.4, label.y + label.d - 2.4, 0.8])], { size: 0.4 }));
  return out.join("");
}

function feed() {
  const out = [];
  out.push(S(k.slabOf(FEED, 0, 6, P, 4, 0.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(FEED, 3), 6, P, 3), { tone: "faint" }));
  // the bill: a sheet resting in the tray, its printed lines as free rule lines
  const sheet = { x: FEED.x + 6, y: FEED.y + 6, w: FEED.w - 12, d: FEED.d - 12, r: 0.6 };
  out.push(S(k.slabOf(sheet, 6, 1.4, P, 2), { tone: "hi", crease: "lo" }));
  for (let i = 0; i < 7; i++) {
    const y = sheet.y + 8 + i * 6;
    const right = sheet.x + sheet.w - 4 - (i % 3 === 1 ? 12 : i % 3 === 2 ? 6 : 0);
    out.push(k.lineSvg(k.lineOnTop([sheet.x + 4, y], [right, y], 7.4, P), { tone: "lo", free: "both" }));
  }
  // clip bar holding the sheet, with two screws
  const clip = { x: FEED.x + 3, y: FEED.y + 2, w: FEED.w - 6, d: 6, r: 1.5 };
  out.push(S(k.slabOf(clip, 7.4, 2.6, P, 3, 0.4), { tone: "mid" }));
  out.push(D([at([clip.x + 4, clip.y + 3, 10]), at([clip.x + clip.w - 4, clip.y + 3, 10])], { size: 0.45 }));
  return out.join("");
}

function post(x) {
  const out = [];
  out.push(S(k.cylinder(x, POST_Y, 7, 0, 3, P, 28), { tone: "lo" }));
  out.push(S(k.cylinder(x, POST_Y, 3.6, 3, BEAM_Z - 3, P, 28), { tone: "mid", crease: "none" }));
  out.push(L([24, 48, 72].map((z) => k.sideArc(x, POST_Y, 3.6, z, P, 16)).join(""), { tone: "faint" }));
  out.push(S(k.cylinder(x, POST_Y, 5, BEAM_Z - 6, 6, P, 28), { tone: "mid" }));
  return out.join("");
}

function beam() {
  const out = [];
  out.push(S(k.slabOf(BEAM, BEAM_Z, 6, P, 4, 0.6), { tone: "mid" }));
  for (const y of [BEAM.y + 2.5, BEAM.y + BEAM.d - 4.5]) {
    out.push(S(k.slabOf({ x: BEAM.x + 8, y, w: BEAM.w - 16, d: 2, r: 0.6 }, BEAM_Z + 6, 1.4, P, 2), { tone: "lo", crease: "none" }));
  }
  for (const x of [BEAM.x + 2, BEAM.x + BEAM.w - 6]) out.push(S(k.slabOf({ x, y: BEAM.y + 1, w: 4, d: BEAM.d - 2, r: 0.8 }, BEAM_Z + 6, 4, P, 2, 0.3), { tone: "mid" }));
  const knob = [BEAM.x + BEAM.w + 5, POST_Y];
  out.push(S(k.cylinder(knob[0], knob[1], 4.6, BEAM_Z + 0.5, 5, P, 28), { tone: "mid" }));
  out.push(L(k.knurl(knob[0], knob[1], 4.6, BEAM_Z + 0.5, BEAM_Z + 5.5, 28, P), { tone: "lo" }));
  out.push(D([at([BEAM.x + 14, POST_Y, BEAM_Z + 6]), at([BEAM.x + BEAM.w - 14, POST_Y, BEAM_Z + 6])], { size: 0.45 }));
  return out.join("");
}

function bin(i) {
  const b = BINS[i];
  const x = BIN_X(i);
  const plan = { x, y: BIN.y, w: BIN.w, d: BIN.d, r: 2 };
  const w = BIN.wall;
  const back = [], front = [];
  back.push(`<path class="iso-halo" d="${k.haloOf(plan, 0, 0.1, P)}" style="filter:blur(3px)"/>`);
  back.push(S(k.slabOf(plan, 0, 2, P, 4, 0.4), { tone: "mid" }));
  back.push(S(k.slabOf({ x, y: BIN.y, w: BIN.w, d: w, r: 0.6 }, 2, BIN.h, P, 2, 0.3), { tone: "mid" }));
  back.push(S(k.slabOf({ x, y: BIN.y, w, d: BIN.d, r: 0.6 }, 2, BIN.h, P, 2, 0.3), { tone: "mid" }));
  const h = stackH(b.amount);
  if (h > 0) {
    const stack = { x: x + 7, y: BIN.y + 9, w: BIN.w - 14, d: BIN.d - 20, r: 0.8 };
    back.push(`<g data-stack="${i}">${S(k.slabOf(stack, 2, h, P, 2, 0.3), { tone: "hi", crease: "lo" })}`);
    const layers = Math.floor(h / 3);
    for (let n = 1; n <= layers; n++) back.push(L(k.lineOnTop([stack.x, stack.y + stack.d], [stack.x + stack.w, stack.y + stack.d], 2 + n * 3, P), { tone: "faint" }));
    back.push(`</g>`);
  }
  back.push(S(k.slabOf({ x: x + BIN.w - w, y: BIN.y, w, d: BIN.d, r: 0.6 }, 2, BIN.h, P, 2, 0.3), { tone: "mid" }));
  if (b.flagged) {
    // flag post on the back-right corner: what the inspector lamp found
    const fx = x + BIN.w - 6, fy = BIN.y + 5;
    back.push(S(k.cylinder(fx, fy, 1, 2 + BIN.h, 16, P, 12), { tone: "mid", crease: "none" }));
    back.push(`<g data-flag="${i}">${S(k.slabOf({ x: fx - 11, y: fy - 0.6, w: 10, d: 1.2, r: 0.3 }, 2 + BIN.h + 10, 6, P, 2), { tone: "hi", lit: true })}</g>`);
  }
  front.push(S(k.slabOf({ x, y: BIN.y + BIN.d - w, w: BIN.w, d: w, r: 0.6 }, 2, BIN.h, P, 2, 0.3), { tone: "mid" }));
  // label plate on the front wall with three rule lines (the bin's name lives in the legend, not the drawing)
  front.push(S(k.slabOf({ x: x + 8, y: BIN.y + BIN.d - 0.4, w: BIN.w - 16, d: 0.6, r: 0.2 }, 7, 9, P, 2), { tone: "lo", crease: "none" }));
  front.push(D(Array.from({ length: i + 1 }, (_, n) => at([x + BIN.w / 2 - i * 2 + n * 4, BIN.y + BIN.d + 0.3, 11.5])), { size: 0.55, tone: "hi" }));
  return `<g data-bin="${i}" class="bs-bin">${back.join("")}${front.join("")}</g>`;
}

function shuttle() {
  // built at x = 0 and moved along the beam with translateAlong
  const out = [];
  const block = { x: -11, y: POST_Y - 9, w: 22, d: 18, r: 2.5 };
  out.push(S(k.slabOf(block, BEAM_Z + 7.4, 9, P, 4, 0.6), { tone: "mid" }));
  out.push(D([at([-7, POST_Y - 5, BEAM_Z + 16.4]), at([7, POST_Y - 5, BEAM_Z + 16.4]), at([-7, POST_Y + 5, BEAM_Z + 16.4]), at([7, POST_Y + 5, BEAM_Z + 16.4])], { size: 0.45 }));
  // arm reaching forward over the bins, then a chute down toward the stack
  const armY0 = POST_Y + 9, armY1 = BIN.y + 22;
  out.push(S(k.slabOf({ x: -4, y: armY0, w: 8, d: armY1 - armY0, r: 1.5 }, ARM_Z + 30, 5, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -3, y: armY0 - 4, w: 6, d: 5, r: 1 }, ARM_Z + 33, BEAM_Z + 9 - ARM_Z - 33, P, 2, 0.3), { tone: "mid" }));
  out.push(S(k.cylinder(0, armY1 + 2, 6.2, ARM_Z, 30, P, 28), { tone: "mid" }));
  out.push(L([ARM_Z + 8, ARM_Z + 16, ARM_Z + 24].map((z) => k.sideArc(0, armY1 + 2, 6.2, z, P, 20)).join(""), { tone: "faint" }));
  out.push(S(k.cylinder(0, armY1 + 2, 7.4, ARM_Z - 3, 3, P, 28), { tone: "mid" }));
  // the inspector lamp: the one lit part
  out.push(`<g data-lamp>${S(k.cylinder(0, armY1 + 2, 3.6, ARM_Z - 6, 3, P, 24), { tone: "hi", lit: true })}</g>`);
  return out.join("");
}

const order = (items) => items.sort((a, b) => k.depthOf(a.at, P) - k.depthOf(b.at, P)).map((i) => i.svg).join("");
const shuttleX0 = BIN_CX(0);
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: `A mail-sorting bench that reads a bill by fixed rules. A bill sits in the feed tray; a shuttle on an overhead beam drops each charge into one of five bins: monthly plan, add-ons, one-offs and usage, late and reconnection fees, and service tax. Each bin holds a stack of slips as tall as its total. A flag stands on bins with something to check, and the shuttle's lamp lights over them. The sample bill totals RM${TOTAL.toFixed(2)}.`,
  body: [
    base(),
    feed(),
    order([...POSTS.map((x) => ({ at: [x, POST_Y, 0], svg: post(x) })), { at: [0, POST_Y, BEAM_Z], svg: beam() }]),
    order(BINS.map((_, i) => ({ at: [BIN_CX(i), BIN.y + BIN.d / 2, 0], svg: bin(i) }))),
    `<g data-part="shuttle" transform="${k.translateAlong(P, [shuttleX0, 0, 0])}">${shuttle()}</g>`,
  ],
});

const unit = k.axisVector(P, [1, 0, 0]); // screen offset per world unit along the beam
const money = (n) => `RM${n.toFixed(2)}`;
const READOUTS = BINS.map((b, i) => `Bin ${i + 1} · ${b.name} · ${money(b.amount)}${b.flagged ? " · flagged" : ""}`);
const plate = k.plateHtml({
  fig: "Fig 1",
  title: "How BillWise reads a bill",
  hint: "Hover or use arrow keys to move the shuttle",
  readout: READOUTS[0],
  keys: [
    { mark: "lit", label: "Inspector lamp and flags: charges worth checking" },
    { mark: "raised", label: "Slip stacks: each as tall as its bin's total" },
  ],
  caption: `The sample Unifi bill, sorted by BillWise's rules (no AI): ${BINS.map((b, i) => `${i + 1} ${b.name} ${money(b.amount)}`).join(", ")}. Total ${money(TOTAL)}, including RM0.02 rounding.`,
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Bill sorter: arrow keys move the shuttle from bin to bin" aria-valuemin="1" aria-valuemax="${BINS.length}" aria-valuenow="1" aria-valuetext="${READOUTS[0]}">${svg}</div>`,
});

const out = `// GENERATED by scripts/figures/bill-sorter.mjs from the decoder's result for the Unifi promo sample. Do not edit.
export const BILL_SORTER_HTML = ${JSON.stringify(plate)};
export const BIN_CENTRES = ${JSON.stringify(BINS.map((_, i) => BIN_CX(i)))};
export const SHUTTLE_UNIT = ${JSON.stringify(unit.map((v) => Math.round(v * 10000) / 10000))};
export const BINS = ${JSON.stringify(BINS.map(({ key, name, amount, items, flagged, note }) => ({ key, name, amount, items, flagged, note: note ?? null })))};
export const READOUTS = ${JSON.stringify(READOUTS)};
`;
writeFileSync(join(ROOT, "src/components/figures/billSorter.generated.ts"), out);
console.log("wrote src/components/figures/billSorter.generated.ts", BINS.map((b) => `${b.key}=${b.amount}${b.flagged ? "!" : ""}`).join(" "));

if (process.argv.includes("--preview")) {
  const dir = process.argv[process.argv.indexOf("--preview") + 1] ?? HERE;
  writeFileSync(join(dir, "bill-sorter-light.html"), k.pageHtml({ title: "Bill sorter", theme: "light", body: plate }));
  console.log("preview:", join(dir, "bill-sorter-light.html"));
}
