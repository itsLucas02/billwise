// Rebuild readable rows from pdf.js text items. Pure, so `node --test` can run it without pdf.js.

export interface PdfTextItem {
  str: string;
  transform: number[]; // [a, b, c, d, x, y]
}

const ROW_TOLERANCE = 2; // points: pieces this close vertically are on the same row

export function linesFromPdfItems(pages: PdfTextItem[][]): string {
  const out: string[] = [];
  for (const items of pages) {
    const rows: { y: number; parts: { x: number; str: string }[] }[] = [];
    for (const it of items) {
      const str = it.str.trim();
      if (!str) continue;
      const [x, y] = [it.transform[4], it.transform[5]];
      let row = rows.find((r) => Math.abs(r.y - y) <= ROW_TOLERANCE);
      if (!row) rows.push((row = { y, parts: [] }));
      row.parts.push({ x, str });
    }
    rows.sort((a, b) => b.y - a.y);
    for (const r of rows) out.push(r.parts.sort((a, b) => a.x - b.x).map((p) => p.str).join(" "));
  }
  return out.join("\n");
}
