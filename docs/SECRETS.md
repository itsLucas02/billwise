# Secrets & Credentials

BillWise has **no secrets in the repository**. Everything lives in Bitwarden Secrets Manager (BWS) and is pulled at runtime.

## Where the BWS access token lives

- **Not** in a dotfile and **not** in this repo.
- macOS Keychain, generic password: service `bws-access-token`, account `$USER`.
- `~/.zshrc` loads it into the shell on startup:

```bash
_bws_token="$(security find-generic-password -a "$USER" -s bws-access-token -w 2>/dev/null)"
[ -n "$_bws_token" ] && export BWS_ACCESS_TOKEN="$_bws_token"
unset _bws_token
```

Read it directly without printing it:

```bash
export BWS_ACCESS_TOKEN="$(security find-generic-password -a "$USER" -s bws-access-token -w)"
```

Never copy this token into a file, commit, or log.

## Which BWS project

BillWise **does not have its own BWS project and must not get one.** It reuses an existing shared project the access token can read, namespaced by the `BILLWISE__` key prefix. The project name and IDs are kept privately, not in this public repo. `bws secret list` with the token above returns the keys it can see.

## BillWise secrets

All under the `BILLWISE__` prefix. Values are intentionally not recorded here.

| Key | Meaning |
| --- | --- |
| `BILLWISE__SUPABASE_PROJECT_REF` | Supabase project ref |
| `BILLWISE__SUPABASE_ORG_ID` | Supabase org |
| `BILLWISE__SUPABASE_URL` | `https://<ref>.supabase.co` |
| `BILLWISE__SUPABASE_REGION` | `ap-southeast-1` |
| `BILLWISE__DB_PASSWORD` | Postgres password |
| `BILLWISE__DB_USER` | Pooler username, `postgres.<ref>` |
| `BILLWISE__DATABASE_URL_SESSION` | Full session-pooler URL (port 5432) — this is `DATABASE_URL` |

List keys only (safe to print):

```bash
bws secret list -o json | python3 -c 'import json,sys; [print(s["key"]) for s in json.load(sys.stdin) if s["key"].startswith("BILLWISE__")]'
```

Fetch a single value (do not echo it into logs):

```bash
bws secret get <SECRET_ID> -o json | python3 -c 'import json,sys; print(json.load(sys.stdin)["value"])'
```

## Local runtime configuration

`src/db/index.ts` reads `process.env.DATABASE_URL` and throws on startup if it is missing. Next.js loads `.env` automatically.

`.env` is **gitignored** and is a local copy of `BILLWISE__DATABASE_URL_SESSION`:

```bash
# refresh .env from BWS without printing the value
export BWS_ACCESS_TOKEN="$(security find-generic-password -a "$USER" -s bws-access-token -w)"
db_url="$(bws secret list -o json | python3 -c '
import json,sys
k="BILLWISE__DATABASE_URL_SESSION"
print(next(s["value"] for s in json.load(sys.stdin) if s["key"]==k))')"
printf 'DATABASE_URL=%s\n' "$db_url" > .env
chmod 600 .env
```

`.env` must keep mode `600`. Never commit it.

## Supabase project facts

- Project name: `billwise`; the ref is in `BILLWISE__SUPABASE_PROJECT_REF`
- Region: Southeast Asia (Singapore), `ap-southeast-1`
- Postgres: 17.11

## Connection gotchas

These cost real debugging time — keep them in mind:

1. **Direct host is IPv6-only.** `db.<ref>.supabase.co:5432` resolves to an IPv6 address and fails with `No route to host` on IPv4-only networks. Do not use it.
2. **`aws-0-ap-southeast-1.pooler.supabase.com` does not work** for this project; it returns `FATAL: (ENOTFOUND) tenant/user ... not found`.
3. **Use `aws-1-ap-southeast-1.pooler.supabase.com:5432` (session mode)** with username `postgres.<ref>` and `sslmode=require`.
4. The transaction pooler (port 6543) is untested here. Session mode is what `.env` uses.

## Keys the app does not need

BillWise talks to Postgres directly through `pg` + Drizzle. It does **not** use the Supabase anon or service-role keys, so those are deliberately absent from BWS.

## Rotating credentials

- **DB password:** reset it in the Supabase dashboard, then update `BILLWISE__DB_PASSWORD`, `BILLWISE__DATABASE_URL_SESSION`, and local `.env` together. A mismatch breaks the app at startup.
- **Supabase access token:** stored account-wide in BWS; it is not BillWise-specific.

## Deploying

The Vercel project belongs to a different account from the default `vercel` CLI login, and git pushes do not auto-deploy. Deploy with that account's token from BWS (`SHARED__VERCEL_SECONDARY_TOKEN`), passed as `vercel deploy --prod --token "$T"` without echoing it.
