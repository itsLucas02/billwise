# Rehearsal: See it work (SeeItWork.tsx)

- Gold copied: stageshow `hero-demo` (browser window + a second window brought forward, cursor beats).
- Changed: BillWise's own decoder and billing-case screens and labels; amounts are the decoder's result for the redacted Aug 2026 Unifi bill (RM136.75, RM10.00 reconnection fee, RM136.75 carried). Beats: Upload PDF bill → Decode my bill → Help me dispute this → Make it firmer → hold → case closes, result folds back, text clears.
- Poster (reduced motion, thumbnails): result + case window + "Draft rewritten".

## Gate (film.mjs --gate), 17 Nov 2026
Fixed from the gate: misaligned left edges (pills, note box, draft box), dark slab in a light window, total touching its amount, overflow past padding, uneven gutters, landing hops (will-change), an empty page between input and result (now one `States` crossfade), a counter that rewound on reset, phone crop cutting real words, squeezed score, abrupt vanish.

Still printed, not fixed:
- `near-empty frames` at the loop reset (both widths). The contact sheet shows a continuous crossfade; the start screen simply has far fewer text elements (≈8) than the result (≈160). Not padded with filler on purpose.
- Phone (390): visible browser crop is taller than wide. A proper fix is a separate phone-shaped compact design.
- `kit override` lines for `.ss-phone*` parts that this demo doesn't use; caused by the host page's global CSS reaching the kit's unused phone styles.
- One 404 resource on the host page, not traced.

Not checked: dark theme (the site is light only), a fresh-eye review against the gold side by side.
