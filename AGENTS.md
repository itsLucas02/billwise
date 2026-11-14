# AGENTS.md — BillWise

BillWise is a Next.js 16 app (React 19, Drizzle ORM, Postgres) that helps Malaysians decode telco bills, compare plans, check coverage and resolve billing disputes.

## Read this before touching config or the database

**All credentials live in Bitwarden Secrets Manager.** Nothing is committed. Before changing env vars, DB connection strings, or onboarding to this project, read [`docs/SECRETS.md`](docs/SECRETS.md). It documents:

- where the BWS access token is stored (macOS Keychain, service `bws-access-token`)
- which BWS project holds the keys (`MediBrave CMS` — reused, namespaced with `BILLWISE__`)
- every `BILLWISE__*` secret and how to fetch it without leaking it
- the Supabase project details and the pooler gotchas (use `aws-1-ap-southeast-1.pooler.supabase.com:5432`)

## Local development

```bash
npm install
# .env must contain DATABASE_URL; see docs/SECRETS.md to populate it from BWS
npm run dev
```

`src/db/index.ts` throws if `DATABASE_URL` is missing. The schema bootstraps itself through `ensureSchema()` in `src/lib/server.ts`, so no migration step is required for a fresh database.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```
