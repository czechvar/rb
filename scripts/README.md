# Scripts

One-off and maintenance scripts for the Rockbusters rebuild. All are TypeScript,
run through `tsx`, and load environment from `.env` via `dotenv/config`, so they
target **whatever database `DATABASE_URL` points at**. They talk to the app
through Payload's Local API (the same code path the admin uses), not raw SQL.

## ⛔ Before you run anything

- **Never point a script at the production database.** These read from and (some)
  write to `DATABASE_URL`. Local `.env` must use the Neon **`dev`** branch (or the
  local Docker Postgres), never the production host `ep-weathered-pine-alvc3sdj`.
  See the database-branches warning in the repo-root `CLAUDE.md`.
- **`blog:import` has a built-in guard**: it refuses to run against the production
  host unless you pass `--allow-production`. No other script has this guard —
  check your `DATABASE_URL` yourself.
- **If a script hangs silently at startup**, prefix it with
  `PAYLOAD_DISABLE_DB_PUSH=true`. When the schema has drifted, Payload's dev
  "push" prompts interactively, which wedges a non-interactive script forever:

  ```bash
  PAYLOAD_DISABLE_DB_PUSH=true pnpm blog:import
  ```

## Quick reference

| Command | Script | Writes DB? | What it does |
| --- | --- | --- | --- |
| `pnpm seed` | `seed.ts` | ✅ upsert | Idempotent dev seed — content, categories, guides, locations, etc. Skips records that already exist; safe to re-run. |
| `pnpm blog:scrape` | `blog-import/scrape.ts` | ❌ (writes files) | Crawls the live rockbusters.net blog into `blog-import/data/` (JSON + images). Network-only. |
| `pnpm blog:import` | `blog-import/import.ts` | ✅ upsert | Loads the scraped `blog-import/data/` into Payload. Needs `blog:scrape` to have run first. |
| `pnpm inspect-user <email>` | `inspect-user.ts` | ❌ read-only | Dumps the auth-relevant fields of one user (verification token, timestamps) for debugging signup/verify. |
| `pnpm e2e-fixtures:inventory` | `e2e-fixture-inventory.ts` | ❌ read-only | Counts e2e test fixtures present in the DB (by the naming patterns the e2e suite uses). |
| `pnpm e2e-fixtures:list` | `e2e-fixture-list.ts` | ❌ read-only | Dumps exact ids/identifiers of every record `cleanup` would delete, to `e2e-fixture-targets.txt`. |
| `pnpm e2e-fixtures:cleanup` | `e2e-fixture-cleanup.ts` | 🔴 **deletes** | Deletes leaked e2e fixtures. Destructive — see the workflow below before running. |

## Blog import workflow

Two steps: scrape the old site to local files, then import those files into
Payload. Both are idempotent and re-runnable.

```bash
pnpm blog:scrape                        # → scripts/blog-import/data/ (gitignored)
PAYLOAD_DISABLE_DB_PUSH=true pnpm blog:import
```

- **`blog:scrape`** makes outbound HTTPS requests to rockbusters.net, YouTube,
  Vimeo and EpicTV (the last for embed-liveness checks). Behind a TLS-intercepting
  corporate proxy, set `NODE_EXTRA_CA_CERTS=/path/to/corp-ca.pem`. It writes one
  JSON file per post under `data/posts/`, all images under `data/images/`, plus
  `data/categories.json` and `data/manifest.json`. The whole `data/` dir is
  gitignored — regenerate it rather than committing it.
- **`blog:import`** upserts categories and posts by slug and media by filename,
  so re-running refreshes content without duplicating. It converts post HTML to
  Payload's Lexical format, uploads images, drops dead video embeds, and swaps
  known-dead EpicTV embeds for their YouTube re-uploads (`EMBED_REPLACEMENTS`).
- Run against production only when intended: `pnpm blog:import --allow-production`
  (with a production `DATABASE_URL` **and** the `R2_*` vars set, so media land in
  R2 rather than local disk).

## e2e fixture cleanup workflow

Background: on 2026-06-12 the e2e suite ran against a shared database and left
~421 test fixtures behind. These scripts find and remove them. **Only run
`cleanup` deliberately, after reviewing what it will delete** — the destructive
step was originally approved by Jan after a read-only review.

```bash
pnpm e2e-fixtures:inventory   # 1. how many fixtures are present?
pnpm e2e-fixtures:list        # 2. exact records → e2e-fixture-targets.txt (review this)
pnpm e2e-fixtures:cleanup     # 3. delete them (FK-safe order)
```

The fixture-matching patterns (`e2e-`, `E2E `, `booking-e2e-`, …) must stay in
sync with the fixture naming in `tests/e2e/*.spec.ts`.

## Prerequisites

- The target database must be reachable and migrated. For a fresh local DB:
  `pnpm payload migrate` → `pnpm seed` → start the dev server. See the local-dev
  notes in `CLAUDE.md`.
- `tsx` is a dev dependency; run these through `pnpm` (which resolves it) rather
  than a bare `node`.
