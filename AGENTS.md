# AGENTS.md — BillWise

BillWise is a Next.js 16 app (React 19, Drizzle ORM, Postgres) that helps Malaysians decode telco bills, compare plans, check coverage and resolve billing disputes.

## Read this before touching config or the database

**All credentials live in Bitwarden Secrets Manager.** Nothing is committed. Before changing env vars, DB connection strings, or onboarding to this project, read [`docs/SECRETS.md`](docs/SECRETS.md). It documents:

- where the BWS access token is stored (macOS Keychain, service `bws-access-token`)
- that BillWise reuses a shared BWS project, namespaced with `BILLWISE__`
- every `BILLWISE__*` secret and how to fetch it without leaking it
- the Supabase project details and the pooler gotchas (use `aws-1-ap-southeast-1.pooler.supabase.com:5432`)

## Local development

```bash
npm install
# .env must contain DATABASE_URL; see docs/SECRETS.md to populate it from BWS
npm run dev
```

`src/db/index.ts` throws if `DATABASE_URL` is missing. The schema bootstraps itself through `ensureSchema()` in `src/lib/server.ts`, so no migration step is required for a fresh database.

## Deployment

Production: **https://billwise-blush.vercel.app** — Vercel project `billwise` under the `dreamin-x` team. Serverless functions run in **`sin1` (Singapore)**, matching the Supabase region.

`DATABASE_URL` is set as an encrypted Vercel environment variable for production, preview and development, sourced from `BILLWISE__DATABASE_URL_SESSION` in Bitwarden. Deploy with `vercel deploy --prod` from the repo root; `.vercel/` is gitignored and per-deployment URLs are behind Vercel Authentication.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles mapped one-to-one (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Bounty submission

BillWise is an entry for the KrackedDevs "Build for Better Connectivity" bounty (deadline Mon 16 Nov 2026, 11:59 PM MYT). Scope, requirements mapping, the judge journey and the open real-provider-name risk are in [`docs/BOUNTY.md`](docs/BOUNTY.md); the copy-paste submission text is in [`docs/SUBMISSION.md`](docs/SUBMISSION.md). Keep the bill-to-enquiry flow working; prefer finishing it over adding features.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
