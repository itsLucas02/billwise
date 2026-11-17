// The BillWise mark (same drawing as Logo in components/ui.tsx), for next/og image routes.
export function OgMark({ size, square = false }: { size: number; square?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <rect width="40" height="40" rx={square ? 0 : 12} fill="#0f1b2d" />
      <path d="M11.5 8.5h15v22.2l-2.5-1.7-2.5 1.7-2.5-1.7-2.5 1.7-2.5-1.7-2.5 1.7z" fill="#fbf8f2" />
      <path d="M15 14.5h8M15 18.5h5" stroke="#0f1b2d" strokeWidth="2" strokeLinecap="round" />
      <circle cx="27.6" cy="27.4" r="6.6" fill="#ffc23d" stroke="#0f1b2d" strokeWidth="2.2" />
      <path d="m24.9 27.5 1.8 1.8 3.5-3.7" stroke="#0f1b2d" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
