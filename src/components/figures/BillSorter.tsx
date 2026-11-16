"use client";

// Fig 1 on the homepage: the bill-sorting bench (scripts/figures/bill-sorter.mjs draws it from the decoder's result).
// This component only moves the shuttle, lights the lamp over flagged bins and writes the readout.
import "./iso.css";
import { useEffect, useRef } from "react";
import { BILL_SORTER_HTML, BIN_CENTRES, BINS, READOUTS, SHUTTLE_UNIT } from "./billSorter.generated";

const TOUR_MS = 2600;

export function BillSorter() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const stage = el?.querySelector<HTMLElement>(".iso-stage");
    const svg = stage?.querySelector("svg");
    const shuttle = svg?.querySelector<SVGGElement>('[data-part="shuttle"]');
    const lamp = svg?.querySelector<SVGGElement>("[data-lamp]");
    const readout = el?.querySelector<HTMLElement>("[data-readout]");
    if (!stage || !svg || !shuttle || !lamp || !readout) return;

    const still = matchMedia("(prefers-reduced-motion: reduce)");
    let x = BIN_CENTRES[0], bin = 0, touring = !still.matches, visible = false, frame = 0, last = 0, glow = BINS[0].flagged ? 1 : 0;
    let tourTimer = 0, idleTimer = 0;

    const draw = () => {
      // the shuttle is drawn at world x = 0; its transform carries the full position along the beam
      shuttle.setAttribute("transform", `translate(${(SHUTTLE_UNIT[0] * x).toFixed(2)} ${(SHUTTLE_UNIT[1] * x).toFixed(2)})`);
      lamp.style.opacity = String(0.2 + 0.8 * glow);
      const text = READOUTS[bin];
      if (readout.textContent !== text) readout.textContent = text;
      stage.setAttribute("aria-valuenow", String(bin + 1));
      stage.setAttribute("aria-valuetext", `${text}${BINS[bin].note ? `. ${BINS[bin].note}` : ""}`);
    };
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      const target = BIN_CENTRES[bin];
      x = still.matches ? target : x + (target - x) * (1 - Math.exp(-dt / 0.32));
      if (Math.abs(target - x) < 0.02) x = target;
      // the lamp only lights once the shuttle has arrived over a flagged bin
      const want = BINS[bin].flagged && Math.abs(target - x) < 3 ? 1 : 0;
      glow = still.matches ? want : glow + (want - glow) * (1 - Math.exp(-dt / 0.18));
      if (Math.abs(want - glow) < 0.01) glow = want;
      draw();
      frame = visible && (x !== target || glow !== want) ? requestAnimationFrame(tick) : 0;
    };
    const run = () => {
      if (!frame && visible) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    const go = (next: number) => {
      bin = Math.max(0, Math.min(BINS.length - 1, next));
      if (!visible || document.hidden) {
        // nothing animates offscreen or in a background tab: jump there so the readout and drawing stay true
        x = BIN_CENTRES[bin];
        glow = BINS[bin].flagged ? 1 : 0;
      }
      draw();
      run();
    };
    const tour = () => {
      clearInterval(tourTimer);
      if (touring) tourTimer = window.setInterval(() => go((bin + 1) % BINS.length), TOUR_MS);
    };
    const steer = (next: number) => {
      touring = false;
      tour();
      go(next);
      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        touring = !still.matches;
        tour();
      }, 6000);
    };

    const io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) run();
    }, { rootMargin: "120px 0px" });
    io.observe(stage);
    const onMove = (e: PointerEvent) => {
      const box = svg.getBoundingClientRect();
      const share = Math.min(1, Math.max(0, ((e.clientX - box.left) / box.width - 0.2) / 0.6));
      const next = Math.round(share * (BINS.length - 1));
      if (next !== bin || touring) steer(next);
    };
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, number> = { ArrowRight: bin + 1, ArrowDown: bin + 1, ArrowLeft: bin - 1, ArrowUp: bin - 1, Home: 0, End: BINS.length - 1 };
      if (!(e.key in map)) return;
      e.preventDefault();
      steer(map[e.key]);
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("keydown", onKey);
    tour();
    draw();
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      clearInterval(tourTimer);
      clearTimeout(idleTimer);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("keydown", onKey);
    };
  }, []);

  return <div ref={root} className="iso bill-sorter" data-theme="light" dangerouslySetInnerHTML={{ __html: BILL_SORTER_HTML }} />;
}
