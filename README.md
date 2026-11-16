# BillWise

**Understand your Malaysian telco bill. Pay only for what you actually need.**

**Live demo:** <https://billwise-blush.vercel.app>

BillWise is a bill-decoding and plan-shopping demo for Malaysian telco customers. Paste in a bill from Unifi, Maxis, CelcomDigi, TIME, Allo or U Mobile and get a line-by-line breakdown with concrete findings — duplicate charges, an 8% SST line where telco tax should be 6%, a rebate that is about to expire, a device instalment running longer than it should. It also compares 46 plans across the 6 providers, walks you through coverage checks without guessing, and gives you a workspace to escalate a billing dispute through the right channels.

> **The providers are real; the bills are not.** Provider names, plan names, prices, contact details and source links come from each telco's own published pages and were last checked by hand in Nov 2026. The six sample bills use invented account numbers and amounts. BillWise is independent and not affiliated with any provider — always confirm prices on the provider's site before switching.

No sign-up, no AI, no scraping. Everything is a deterministic rule engine over a hand-maintained plan catalogue.

---

## Bounty entry: Build for Better Connectivity

Entry for the [KrackedDevs bounty](https://krackeddevs.com/code/bounty/build-for-better-connectivity). **User:** an ordinary Malaysian broadband customer. **Problem:** a bill that is higher than expected or has charges they don't understand. **Outcome:** understand the bill, see what is confirmed and what is uncertain, and leave with an editable billing enquiry (English or BM) tracked as a case. Nothing is sent to the provider. Details: [`docs/BOUNTY.md`](docs/BOUNTY.md), submission text: [`docs/SUBMISSION.md`](docs/SUBMISSION.md).

Try it at <https://billwise-blush.vercel.app>:

1. Open the homepage, then "Try a sample bill" (Unifi promo-expiry sample) or paste your own.
2. Read the breakdown: findings ranked "Act on this", "Worth checking", "Good to know" or "Looks fine", savings estimates with assumptions.
3. On a questionable charge, start a billing enquiry. Provider, charge, amount and analysis link carry over.
4. Create the case, then edit and copy the enquiry (English or BM) and check the evidence checklist.
5. Record the provider's reference, change status, add notes. Refresh and reopen: it is saved.

---

## Why

Telco bills in Malaysia are dense, bilingual, and full of line items that are easy to miss. People overpay for months without noticing a promo ended, a content subscription they never wanted, or a paper-bill fee they thought was abolished. BillWise reads the bill the way a careful friend would: it names what it found, says how confident it is, and tells you what to do next.

## What it does

### Bill decoder — `/decoder`

Accepts a pasted bill (or six simulated samples, or manually entered rows). The engine in `src/lib/decoder.ts` classifies every charge into one of 15 categories and runs 15 finding passes, including:

- duplicate `(label, amount)` pairs
- SST sanity check — flags 8% tax where telco service tax should be 6%
- stated total disagreeing with the computed total by more than RM0.50
- paying more than a "promised" price, or more than today's price for the matched plan
- rebates in their final month (`Month 2 of 6`, "expires", "final")
- device instalments with a visible `9/24` progress marker
- content/VAS add-ons, roaming, IDD, extra usage, late fees, early-termination penalties, paper-bill fees, prorated charges

Output is an `Analysis` with a bill health score (0–100), severity-ranked findings, and savings estimates — ask for the current price, switch provider, cancel content billing, go e-bill, use internet calling instead of IDD, avoid late fees.

Analyses are saved per browser and reachable again at `/decoder/[id]`, including the original pasted text.

### Plan finder — `/plans`

- **Recommend** — a transparent weighted heuristic (no ML). You give budget, household size, activities, home type, contract preference, and which providers you have confirmed at your address. It computes a required speed or data allowance, scores every plan, and returns a match ring with up to four reasons and three cautions per plan.
- **Browse all 46** — filter by provider, max price, minimum speed or data; sort by price, speed, or best value.
- **Saved** — a shortlist you keep across visits.
- **Compare** — `/plans/compare?ids=…` puts up to four plans side by side, including 24-month cost with SST, and highlights the best cell per row.

Each plan carries a `source` URL pointing at that provider's own published plan page and a status marking whether it came from the provider's site or a dealer/press listing. Nothing is crawled or refreshed at runtime — `PLANS_REVIEWED` is the last date a human checked the figures.

### Coverage — `/coverage`

Three honest checks, deliberately without guesswork:

- **Fibre** — enter a postcode plus property type, and BillWise gives you each provider's official coverage-checker link and lets you record the result per provider. When at least one says available, those providers pre-fill the plan finder.
- **Signal** — enter an RSRP reading (with optional SINR) and get a plain-language interpretation.
- **Speed** — compare your measured Mbps against a plan's advertised speed, with the test method recorded (LAN / Wi-Fi near / Wi-Fi far), because that changes the honest verdict.

BillWise never claims to know coverage for your address. It tells you how to find out and remembers what you found.

### Dispute workspace — `/help`

Ten issue types (overcharge, promo not honoured, speed below plan, no service, refund, and more), each with a tailored checklist, evidence list, and a choice of drafting an email, a live-chat message, or a phone script — in English or Bahasa Malaysia. Drafts are templates, generated deterministically from your case details, and stay editable.

A case tracks status (`open → contacted → awaiting → resolved`, plus `escalated` and `closed`), a provider reference, follow-up date, recovered amount, and a full event timeline. It also shows the General Consumer Code deadlines (3 / 7 / 30 days from first contact) and the escalation ladder: provider → CFM → MCMC.

### Providers — `/providers`

A directory of the six providers with support channels, apps, coverage-checker links, and the CFM and MCMC hotlines.

---

## How it is built

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16.4 (App Router) |
| UI | React 19, Tailwind CSS v4, lucide-react |
| Data | Drizzle ORM 0.45 over `pg` (node-postgres) |
| Database | PostgreSQL 17 (Supabase, Singapore `ap-southeast-1`) |
| Language | TypeScript 5.9, strict |

The domain logic lives in `src/lib/` as pure, testable TypeScript:

```
src/lib/
├── decoder.ts     bill parser + 15 finding passes + savings engine
├── plans.ts       static catalogue: 46 plans across 6 providers
├── providers.ts   provider profiles, contacts, detection regexes, escalation
├── recommend.ts   weighted heuristic scorer for fibre and mobile
├── cases.ts       issue catalogue + EN/BM message drafting
├── coverage.ts    postcode→state table, RSRP/SINR/speed interpretation
├── format.ts      SST, currency, dates
├── samples.ts     six specimen bills
├── server.ts      idempotent DDL, anonymous identity, input helpers
└── client.ts      fetch helper that attaches the browser id
```

The schema bootstraps itself: `ensureSchema()` in `src/lib/server.ts` runs idempotent `CREATE TABLE IF NOT EXISTS` statements, so a fresh database needs no migration step.

### Deliberate non-features

These are decisions, not gaps:

- **No AI or LLM.** Every explanation, finding, recommendation and message draft comes from rules and templates. That keeps it free, offline-capable, and auditable.
- **No accounts.** Identity is an anonymous per-browser id (`x-bw-user`, with an httpOnly cookie fallback). There is no sign-up, password, or OAuth.
- **No live pricing or coverage data.** Plans are hand-checked against the providers' sites on the date in `PLANS_REVIEWED`; coverage is whatever you record from the provider checkers.
- **No file upload or OCR.** You paste the bill text, or enter rows by hand.
- **No dark mode, no PWA, no telemetry.**

## Running it locally

```bash
npm install
npm run dev
```

The app needs one environment variable, `DATABASE_URL`, pointing at a PostgreSQL instance. `src/db/index.ts` throws at startup without it.

**Credentials are not in this repository.** They live in Bitwarden Secrets Manager — see [`docs/SECRETS.md`](docs/SECRETS.md) for where the access token is stored, which BWS project holds the `BILLWISE__*` keys, and how to hydrate `.env` without leaking them.

```bash
npm run typecheck
npm run lint
npm run build
```

## Deployment

Production is live at **<https://billwise-blush.vercel.app>**.

| Field | Value |
| --- | --- |
| Platform | Vercel |
| Scope | `dreamin-x` team (account `adreamin96-6176`) |
| Project | `billwise` (`prj_zPXpnhBKj4R6Sxmp45QcOSXipcKD`) |
| Region | Singapore (`sin1`) — same region as the Supabase database |
| Production alias | <https://billwise-blush.vercel.app> |

The project is linked from this working copy through `.vercel/` (gitignored). `DATABASE_URL` is stored as an encrypted Vercel environment variable for production, preview and development, sourced from `BILLWISE__DATABASE_URL_SESSION` in Bitwarden — no secrets live in the repository.

Deploy a new production build from the repo root:

```bash
vercel deploy --prod
```

Vercel's per-deployment URLs (`billwise-<hash>-dreamin-x.vercel.app`) sit behind Vercel Authentication; the production alias above is the public entry point.

Serverless functions execute in `sin1` (Singapore) so database queries stay in-region. Builds run in Vercel's default build region, which does not affect request latency.

## Accessibility & tone

Warm light palette, bilingual headings, 44–48px minimum targets, visible focus rings, `aria-pressed` / `aria-live` / tablist semantics, a persistent text-size control (md / lg / xl, applied before first paint), and `prefers-reduced-motion` respected throughout.

Specimen sample bills are labelled as such everywhere. Analysis output is framed as guidance for a conversation with your provider — not a ruling or legal advice.

## Data & disclaimers

Provider names, plan names, prices and contact details are real, taken from each telco's own published pages and checked in Nov 2026, and each plan links to that provider's site. Telcos change prices and promotions frequently, so confirm before signing up. Coverage results are what you recorded, not what BillWise inferred. The sample bills are specimens with invented account numbers. BillWise is independent and not affiliated with any provider. The CFM and MCMC escalation channels are real public information.
