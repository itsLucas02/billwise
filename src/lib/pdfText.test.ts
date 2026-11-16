import { test } from "node:test";
import assert from "node:assert/strict";
import { linesFromPdfItems } from "./pdfText.ts";

// pdf.js text items: transform[4] = x, transform[5] = y (origin bottom-left)
const item = (str: string, x: number, y: number) => ({ str, transform: [1, 0, 0, 1, x, y] });

test("pieces on the same row join left to right; rows read top to bottom", () => {
  const page = [
    item("159.00", 400, 700),
    item("Unifi Home 500Mbps (ST)", 50, 700),
    item("10.00", 400, 680),
    item("Reconnection Fee (ST)", 50, 680.6), // slightly off baseline, same row
  ];
  assert.equal(linesFromPdfItems([page]), "Unifi Home 500Mbps (ST) 159.00\nReconnection Fee (ST) 10.00");
});

test("pages follow each other and empty pieces are dropped", () => {
  assert.equal(linesFromPdfItems([[item("Page one", 0, 10), item("  ", 0, 5)], [item("Page two", 0, 10)]]), "Page one\nPage two");
});
