// BillWise's stickers, from the fun-isometric worked set (MIT, Kelvin Adithya, skills.klvn.dev/fun-isometric).
// Colours are palette slots; HomeActivity passes each pocket's palette.
import { VIEWS, line, pill, poly, rect, ring, spark } from "./fun";
import { SNAP, erase, hop, jolt, slide, sparkle, springTurn, sway } from "./motions";
import type { Icon, Layer, Motion, Shape, Vec } from "./fun";

const LINE = 5;
const { tilt: FACE, extrude: EXT } = VIEWS.right;
const PIN = "M0 118C-24 76 -96 22 -96 -42A96 96 0 0 1 96 -42C96 22 24 76 0 118Z";

const glow = (parent: string, p: Vec, r: number, m: Motion | ReadonlyArray<Motion>): Layer => ({ parent, a: p, p, m, shapes: [{ d: spark(p[0], p[1], r), fill: "white" }] });

// a bill on a clipboard, its lines written in
export const bills: Icon = {
  name: "Decoded bills",
  frames: 180,
  still: 0,
  line: LINE,
  extrude: EXT,
  layers: [
    {
      id: "pad",
      a: [0, 136],
      p: [250, 374],
      tilt: FACE,
      m: { ...sway, k: 0.8 },
      shapes: [
        { d: rect(-118, -136, 236, 272, 24), fill: "main", depth: 1 },
        { d: rect(-96, -108, 192, 222, 10), fill: "white", depth: 0.2 },
        { d: pill(-52, -154, 104, 42), fill: "grey", depth: 0.6 },
        { d: pill(-20, -140, 40, 12), fill: "ink", line: false },
        ...[0, 1, 2, 3].map((i): Shape => ({ d: line([-68, -66 + i * 40], [i === 3 ? 10 : 68, -66 + i * 40]), trim: erase(22 - i * 5, 80 + i * 5) })),
      ],
    },
  ],
};

// a letter slides out of the mailbox and the flag goes up: the enquiry is sent
export const enquiry: Icon = {
  name: "Billing cases",
  frames: 180,
  still: 90, // letter out, flag up: the enquiry is sent
  line: LINE,
  extrude: EXT,
  layers: [
    { id: "mail", a: [0, 150], p: [250, 392], m: jolt([-4, 10]), shapes: [] },
    { parent: "mail", tilt: FACE, shapes: [{ d: rect(-18, 40, 36, 150, 6), fill: "grey", depth: 0.8 }] },
    {
      parent: "box",
      a: [70, 0],
      p: [70, 0],
      m: slide([56, 0], 24, 72, 40),
      shapes: [{ d: rect(30, -40, 96, 62, 6), fill: "white", depth: 0.25 }, { d: line([44, -24], [78, -6], [112, -24]) }],
    },
    {
      id: "box",
      parent: "mail",
      tilt: FACE,
      shapes: [
        { d: poly([[-136, -96], [136, -96], [136, 56], [-136, 56]], [72, 72, 10, 10]), fill: "deep", depth: 1 },
        { d: poly([[96, -96], [136, -96], [136, 56], [96, 56]], [0, 72, 10, 0]), fill: "main", depth: 1 },
      ],
    },
    {
      parent: "box",
      a: [-60, -10],
      p: [-60, -10],
      r: 84,
      m: { r: [...springTurn(-84, 18), [128, -84, SNAP], [168, 0]] },
      shapes: [{ d: rect(-68, -130, 16, 124, 4), fill: "grey", depth: 0.5 }, { d: rect(-68, -130, 70, 44, 6), fill: "hot", depth: 0.5 }],
    },
  ],
};

// a map pin drops onto the address
export const coveragePin: Icon = {
  name: "Coverage checks",
  frames: 180,
  line: LINE,
  extrude: [-3, 16],
  layers: [
    { id: "drop", a: [0, 118], p: [250, 362], m: { ...hop, at: 20 }, shapes: [] },
    { parent: "drop", shapes: [{ d: PIN, fill: "main", depth: 1, edges: [[0, 118]] }, { d: ring(0, -42, 46, 22), fill: "white", depth: 0.3 }] },
    glow("drop", [104, -128], 26, sparkle(48)),
    glow("drop", [-118, -20], 16, sparkle(110)),
  ],
};
