// Abstract line motifs per provider, shown faintly in the plan card corner (Unifi, Maxis, TIME, Allo and U Mobile redrawn 17 Nov 2026). Deliberately NOT derived from any logo or
// wordmark (bounty rule 6); each reflects the kind of network instead. Drawn in currentColor, used faintly.
import type { ProviderId } from "@/lib/providers";

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const f = (n: number) => n.toFixed(1);
const poly = (pts: [number, number][], close = false) => `M ${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L ")}${close ? " Z" : ""}`;

const MOTIFS: Record<ProviderId, () => React.ReactNode> = {
  // Topographic contours: irregular nested rings, like a coverage map of the ground the network covers.
  unifi: () => (
    <g strokeWidth="1.05">
      {range(12).map((k) => {
        const pts = range(90).map((j): [number, number] => {
          const t = (j / 90) * Math.PI * 2;
          const r = (12 + k * 13) * (1 + 0.09 * Math.sin(3 * t + k * 0.55) + 0.05 * Math.sin(5 * t - k * 0.8));
          return [150 + r * Math.cos(t), 45 + r * 0.85 * Math.sin(t)];
        });
        return <path key={k} d={poly(pts, true)} />;
      })}
    </g>
  ),
  // A flow field: fine lines drifting together, like traffic across a national network.
  maxis: () => (
    <g strokeWidth="1">
      {range(26).map((i) => <path key={i} d={poly(range(45).map((j): [number, number] => { const x = -10 + j * 5; return [x, -40 + i * 9 + 16 * Math.sin(x / 34 + i * 0.22) + x * 0.32]; }))} />)}
    </g>
  ),
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
  // Moiré interference: two sets of fine circles crossing evenly, for symmetrical upload and download.
  time: () => (
    <g strokeWidth="0.85">
      {range(26).map((k) => <circle key={`a${k}`} cx="40" cy="200" r={6 + k * 8} />)}
      {range(26).map((k) => <circle key={`b${k}`} cx="200" cy="40" r={6 + k * 8} />)}
    </g>
  ),
  // A fibre bundle: fine strands converging into a single cable.
  allo: () => (
    <g strokeWidth="0.95">
      {range(24).map((i) => {
        const y = -10 + i * 9.5;
        return <path key={i} d={`M -10 ${f(y)} C 70 ${f(y)}, 120 ${f(100 + (y - 100) * 0.18)}, 210 ${f(100 + (y - 100) * 0.04)}`} />;
      })}
    </g>
  ),
  // A halftone signal: dots that fade with distance from a single point, like reception falling off.
  umobile: () => (
    <g fill="currentColor" stroke="none">
      {range(15 * 15).map((i) => {
        const x = 6 + (i % 15) * 14, y = 6 + Math.floor(i / 15) * 14;
        const r = 3.4 * (1 - Math.hypot(x - 175, y - 175) / 235);
        return r > 0.35 ? <circle key={i} cx={x} cy={y} r={f(r)} /> : null;
      })}
    </g>
  ),
  // A generic city skyline: a network for the whole town (no real buildings traced).
  yes: () => (
    <path d="M 0 200 L 0 150 L 22 150 L 22 120 L 44 120 L 44 165 L 60 165 L 60 95 L 70 85 L 80 95 L 80 160 L 98 160 L 98 70 L 120 70 L 120 140 L 136 140 L 136 110 L 150 100 L 164 110 L 164 175 L 180 175 L 180 130 L 200 130 L 200 200 M 104 82 L 114 82 M 104 96 L 114 96 M 104 110 L 114 110 M 66 108 L 74 108 M 66 122 L 74 122 M 109 50 L 109 70 M 105 58 L 113 58" />
  ),
};

export function ProviderArt({ id, className, style }: { id: ProviderId; className?: string; style?: React.CSSProperties }) {
  return (
    <svg aria-hidden viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" className={className} style={style}>
      {MOTIFS[id]()}
    </svg>
  );
}
