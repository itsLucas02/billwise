"use client";
// One place that maps BillWise moments to fun-isometric stickers in house colours, so pages ask for "heart" not palettes.
import { Sticker } from "./Sticker";
import { bills, coveragePin, enquiry } from "./icons";
import { chat, coins, folder, gift, heart, pen, phone, pin, search, trophy } from "./set";
import { cn } from "../ui";
import type { Icon, Palette } from "./fun";

// house colours on the kit's slots: outlines in ink, pink main swapped for the page accents
const HOUSE: Partial<Palette> = { main: "#2f6fe4", gold: "#ffc23d", tint: "#fff1cc", ok: "#0b8f63", hot: "#e0442a", deep: "#0f1b2d", ink: "#0f1b2d" };
const KUNYIT: Partial<Palette> = { ...HOUSE, main: "#ffc23d", tint: "#fff1cc" };
const PANDAN: Partial<Palette> = { ...HOUSE, main: "#0b8f63", tint: "#dcf3e8" };
const SKY: Partial<Palette> = { ...HOUSE, main: "#2f6fe4", tint: "#e4ecfd" };
const SAMBAL: Partial<Palette> = { ...HOUSE, main: "#e0442a", tint: "#fde6e0" };

const SPOTS = {
  bills: [bills, KUNYIT],
  search: [search, SKY],
  coins: [coins, HOUSE],
  gift: [gift, { ...SAMBAL, tint: "#fde6e0" }],
  phone: [phone, { ...SKY, tint: "#e4ecfd" }],
  pin: [pin, PANDAN],
  coverage: [coveragePin, PANDAN],
  mailbox: [enquiry, { ...SKY, hot: "#e0442a" }],
  pen: [pen, { ...KUNYIT, tint: "#fff1cc", main: "#e0442a" }],
  chat: [chat, PANDAN],
  folder: [folder, { ...SKY, ok: "#ffc23d" }],
  heart: [heart, { ...SAMBAL, hot: "#e0442a" }],
  trophy: [trophy, HOUSE],
} satisfies Record<string, [Icon, Partial<Palette>]>;
export type SpotName = keyof typeof SPOTS;

type SpotProps = { name: SpotName; className?: string; enter?: number; loop?: boolean; onDark?: boolean };

/** A decorative sticker: plays once on arrival (or loops), replays on hover, rests still under reduced motion. */
export function Spot({ name, className, enter = 0.1, loop = false, onDark }: SpotProps) {
  const [icon, palette] = SPOTS[name];
  // on the ink hero the ink outline would vanish, so outlines turn paper there
  const tone = onDark ? { ...palette, ink: "#fbf8f2", deep: palette.deep === "#0f1b2d" ? "#fbf8f2" : palette.deep } : palette;
  return (
    <div aria-hidden className={cn("pointer-events-auto shrink-0", className)}>
      <Sticker icon={icon} palette={tone} loop={loop} enter={enter} replayOnHover label="" />
    </div>
  );
}

// each page header: one large sticker that names the page, two smaller ones that hint at what it does, standing on a plinth
type Scene = { tone: [string, string, string]; spots: Array<[SpotName, string]> }; // plinth top, left side, right side
const SCENES = {
  decoder: { tone: ["#fff1cc", "#ffc23d", "#e8a91f"], spots: [["bills", "left-14 top-2 w-52"], ["search", "right-0 top-4 w-32"], ["coins", "right-20 bottom-8 w-24"]] },
  plans: { tone: ["#e4ecfd", "#7fa5f0", "#5b88e6"], spots: [["coins", "left-16 top-6 w-48"], ["phone", "right-0 top-0 w-32"], ["gift", "right-20 bottom-8 w-24"]] },
  coverage: { tone: ["#dcf3e8", "#5fbf97", "#3fa57b"], spots: [["coverage", "left-20 top-0 w-48"], ["phone", "right-0 top-4 w-28"], ["search", "right-20 bottom-8 w-24"]] },
  help: { tone: ["#e4ecfd", "#7fa5f0", "#5b88e6"], spots: [["mailbox", "left-14 top-0 w-52"], ["pen", "right-0 top-4 w-28"], ["chat", "right-20 bottom-8 w-24"]] },
  providers: { tone: ["#fde6e0", "#f08c78", "#e0664f"], spots: [["phone", "left-16 top-2 w-48"], ["chat", "right-0 top-0 w-32"], ["folder", "right-20 bottom-8 w-24"]] },
} satisfies Record<string, Scene>;
export type SceneName = keyof typeof SCENES;

// an isometric slab in the stickers' own style: flat top, two extruded sides, one ink outline
function Plinth({ tone: [top, left, right] }: { tone: Scene["tone"] }) {
  const T = "192,92 372,182 192,272 12,182";
  return (
    <svg viewBox="0 0 384 300" className="absolute inset-x-0 bottom-0 w-full" aria-hidden>
      <g stroke="#0f1b2d" strokeWidth="3" strokeLinejoin="round">
        <polygon points="12,182 192,272 192,294 12,204" fill={left} />
        <polygon points="372,182 192,272 192,294 372,204" fill={right} />
        <polygon points={T} fill={top} />
      </g>
      <polygon points="192,116 324,182 192,248 60,182" fill="none" stroke="#0f1b2d" strokeOpacity="0.18" strokeWidth="2" strokeDasharray="2 9" strokeLinecap="round" />
    </svg>
  );
}

/** The right-hand art of a PageHeader: three stickers arriving one after another on a plinth. Wide screens only; phones keep the title. */
export function HeaderArt({ scene }: { scene: SceneName }) {
  const { tone, spots } = SCENES[scene];
  return (
    <div aria-hidden className="pointer-events-none absolute right-2 top-1/2 hidden h-[18rem] w-[22rem] -translate-y-1/2 lg:block">
      <Plinth tone={tone} />
      {spots.map(([name, pos], i) => (
        <Spot key={name + i} name={name} enter={0.15 + i * 0.18} className={cn("absolute", pos)} />
      ))}
    </div>
  );
}
