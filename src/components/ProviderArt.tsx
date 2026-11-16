// Abstract line motifs per provider (owner picked the corner placement, 17 Nov 2026; some motifs may be redrawn). Deliberately NOT derived from any logo or
// wordmark (bounty rule 6); each reflects the kind of network instead. Drawn in currentColor, used faintly.
import type { ProviderId } from "@/lib/providers";

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const wave = (y: number, amp: number, len: number, phase = 0) =>
  `M -10 ${y} ` + range(14).map((i) => `Q ${-10 + i * len + len / 2} ${y + (i % 2 ? -amp : amp) * (phase ? -1 : 1)} ${-10 + (i + 1) * len} ${y}`).join(" ");

const MOTIFS: Record<ProviderId, () => React.ReactNode> = {
  // Ripples from a corner: a signal spreading through a neighbourhood.
  unifi: () => range(9).map((i) => <circle key={i} cx="200" cy="0" r={22 + i * 22} />),
  // Long diagonal currents.
  maxis: () => range(10).map((i) => <path key={i} d={`M ${-60 + i * 30} 220 C ${0 + i * 30} 140, ${40 + i * 30} 80, ${120 + i * 30} -20`} />),
  // Nodes and links: a mesh network.
  celcomdigi: () => {
    const pts = range(16).map((i) => [20 + (i % 4) * 53 + (Math.floor(i / 4) % 2) * 18, 20 + Math.floor(i / 4) * 53] as const);
    return (
      <>
        {pts.map(([x, y], i) => pts.slice(i + 1).filter(([a, b]) => Math.hypot(a - x, b - y) < 62).map(([a, b], j) => <line key={`${i}-${j}`} x1={x} y1={y} x2={a} y2={b} />))}
        {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.5" />)}
      </>
    );
  },
  // Mirrored waves: equal speed up and down.
  time: () => range(5).flatMap((i) => [<path key={`a${i}`} d={wave(40 + i * 30, 12, 30)} />, <path key={`b${i}`} d={wave(40 + i * 30, 12, 30, 1)} />]),
  // Woven strands: fibre threads crossing.
  allo: () => (
    <>
      {range(7).map((i) => <path key={`h${i}`} d={`M -10 ${20 + i * 28} C 60 ${5 + i * 28}, 140 ${35 + i * 28}, 210 ${20 + i * 28}`} />)}
      {range(7).map((i) => <path key={`v${i}`} d={`M ${20 + i * 28} -10 C ${35 + i * 28} 60, ${5 + i * 28} 140, ${20 + i * 28} 210`} />)}
    </>
  ),
  // Radiating arcs and a mast: a cell site broadcasting.
  umobile: () => (
    <>
      {range(6).map((i) => <path key={i} d={`M ${150 - (i + 1) * 22} 200 A ${(i + 1) * 22} ${(i + 1) * 22} 0 0 1 ${150 + (i + 1) * 22} 200`} />)}
      <path d="M 150 200 L 150 120 M 140 140 L 160 140 M 136 160 L 164 160" />
    </>
  ),
  // A generic city skyline: a network for the whole town (no real buildings traced).
  yes: () => (
    <path d="M 0 200 L 0 150 L 22 150 L 22 120 L 44 120 L 44 165 L 60 165 L 60 95 L 70 85 L 80 95 L 80 160 L 98 160 L 98 70 L 120 70 L 120 140 L 136 140 L 136 110 L 150 100 L 164 110 L 164 175 L 180 175 L 180 130 L 200 130 L 200 200 M 104 82 L 114 82 M 104 96 L 114 96 M 104 110 L 114 110 M 66 108 L 74 108 M 66 122 L 74 122 M 109 50 L 109 70 M 105 58 L 113 58" />
  ),
};

export function ProviderArt({ id, className, style }: { id: ProviderId; className?: string; style?: React.CSSProperties }) {
  return (
    <svg aria-hidden viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className={className} style={style}>
      {MOTIFS[id]()}
    </svg>
  );
}
