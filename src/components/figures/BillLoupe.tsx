"use client";

// Fig 1 "Every line, checked": the bill on a clipboard (scripts/figures/bill-loupe.mjs draws it). This component moves the
// magnifier down the lines, reveals each tick or flag as it is reached, shows that line's amount magnified, and writes the readout.
import "./iso.css";
import "./bill-loupe.css";
import { useEffect, useRef } from "react";
import { BILL_LOUPE_HTML, READOUTS, ROWS, ROW_UNIT, ROW_Y } from "./billLoupe.generated";

const STEP_MS = 2200;

export function BillLoupe() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const stage = el?.querySelector<HTMLElement>(".iso-stage");
    const svg = stage?.querySelector("svg");
    const loupe = svg?.querySelector<SVGGElement>('[data-part="loupe"]');
    const readout = el?.querySelector<HTMLElement>("[data-readout]");
    if (!stage || !svg || !loupe || !readout) return;
    const marks = [...svg.querySelectorAll<SVGGElement>("[data-mark]")];
    const mags = [...svg.querySelectorAll<SVGGElement>("[data-mag]")];
    const still = matchMedia("(prefers-reduced-motion: reduce)");

    let y = ROW_Y[0], row = 0, seen = 0, visible = false, frame = 0, last = 0, touring = !still.matches;
    let tourTimer = 0, idleTimer = 0;
    const place = () => loupe.setAttribute("transform", `translate(${(ROW_UNIT[0] * y).toFixed(2)} ${(ROW_UNIT[1] * y).toFixed(2)})`);
    const paint = () => {
      const arrived = Math.abs(ROW_Y[row] - y) < 0.6;
      marks.forEach((m) => m.setAttribute("data-on", String(Number(m.dataset.mark) <= seen)));
      mags.forEach((m) => m.setAttribute("data-on", String(arrived && Number(m.dataset.mag) === row)));
      const text = `${READOUTS[row]}`;
      if (readout.textContent !== text) readout.textContent = text;
      stage.setAttribute("aria-valuenow", String(row + 1));
      stage.setAttribute("aria-valuetext", `${text}: ${ROWS[row].note}`);
    };
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      const target = ROW_Y[row];
      y = still.matches ? target : y + (target - y) * (1 - Math.exp(-dt / 0.3));
      if (Math.abs(target - y) < 0.05) y = target;
      if (y === target) seen = Math.max(seen, row);
      place();
      paint();
      frame = visible && y !== target ? requestAnimationFrame(tick) : 0;
    };
    const run = () => {
      if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); }
    };
    const go = (next: number) => {
      row = Math.max(0, Math.min(ROWS.length - 1, next));
      if (!visible || document.hidden || still.matches) { y = ROW_Y[row]; seen = Math.max(seen, row); place(); }
      paint();
      run();
    };
    const tour = () => {
      clearInterval(tourTimer);
      if (touring) tourTimer = window.setInterval(() => {
        // after the last line the ticks and flags are cleared and the read starts again from the top
        if (row === ROWS.length - 1) seen = -1;
        go((row + 1) % ROWS.length);
      }, STEP_MS);
    };
    const steer = (next: number) => {
      touring = false;
      tour();
      seen = Math.max(seen, ROWS.length - 1); // once someone explores, every result stays visible
      go(next);
      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => { touring = !still.matches; tour(); }, 7000);
    };

    const io = new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" });
    io.observe(stage);
    const onMove = (e: PointerEvent) => {
      const box = svg.getBoundingClientRect();
      const share = Math.min(1, Math.max(0, ((e.clientY - box.top) / box.height - 0.3) / 0.4));
      const next = Math.round(share * (ROWS.length - 1));
      if (next !== row || touring) steer(next);
    };
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, number> = { ArrowDown: row + 1, ArrowRight: row + 1, ArrowUp: row - 1, ArrowLeft: row - 1, Home: 0, End: ROWS.length - 1 };
      if (!(e.key in map)) return;
      e.preventDefault();
      steer(map[e.key]);
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("keydown", onKey);
    if (still.matches) seen = ROWS.length - 1;
    place();
    paint();
    tour();
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      clearInterval(tourTimer);
      clearTimeout(idleTimer);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("keydown", onKey);
    };
  }, []);

  return <div ref={root} className="iso bill-loupe" data-theme="light" dangerouslySetInnerHTML={{ __html: BILL_LOUPE_HTML }} />;
}
