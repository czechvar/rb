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
- **`data-import:import` has a built-in guard**: it refuses to run against the
  production host unless you pass `--allow-production`. No other script has this
  guard — check your `DATABASE_URL` yourself.
- **If a script hangs silently at startup**, prefix it with
  `PAYLOAD_DISABLE_DB_PUSH=true`. When the schema has drifted, Payload's dev
  "push" prompts interactively, which wedges a non-interactive script forever:

  ```bash
  PAYLOAD_DISABLE_DB_PUSH=true pnpm data-import:import
  ```

## Quick reference

| Command | Script | Writes DB? | What it does |
| --- | --- | --- | --- |
| `pnpm seed` | `seed.ts` | ✅ upsert | Idempotent dev seed — content, categories, guides, locations, etc. Skips records that already exist; safe to re-run. |
| `pnpm data-import:extract` | `data-import/extract.ts` | ❌ (writes files) | Refreshes the committed seed at `data-import/seed/*.json` from a local MySQL loaded with the old rockbusters dump. Only needed when the source data changes. |
| `pnpm data-import:import` | `data-import/import.ts` | ✅ create-if-missing | Loads the committed seed JSON into Payload. **Skip-if-exists** on slug — never updates, never deletes. Guarded against production. |
| `pnpm data-import:guides` | `data-import/import.ts --only=guides` | ✅ create-if-missing | Same as `data-import:import` but guides only. |
| `pnpm data-import:locations` | `data-import/import.ts --only=locations` | ✅ create-if-missing | Same as `data-import:import` but locations only. |
| `pnpm inspect-user <email>` | `inspect-user.ts` | ❌ read-only | Dumps the auth-relevant fields of one user (verification token, timestamps) for debugging signup/verify. |
| `pnpm e2e-fixtures:inventory` | `e2e-fixture-inventory.ts` | ❌ read-only | Counts e2e test fixtures present in the DB (by the naming patterns the e2e suite uses). |
| `pnpm e2e-fixtures:list` | `e2e-fixture-list.ts` | ❌ read-only | Dumps exact ids/identifiers of every record `cleanup` would delete, to `e2e-fixture-targets.txt`. |
| `pnpm e2e-fixtures:cleanup` | `e2e-fixture-cleanup.ts` | 🔴 **deletes** | Deletes leaked e2e fixtures. Destructive — see the workflow below before running. |

## Data import workflow

Seeds the `guides` and `locations` collections from a committed JSON snapshot
of the old rockbusters MySQL dump. The snapshot lives at
`scripts/data-import/seed/`, so anyone importing into dev or prod doesn't
need MAMP — see the [full README](./data-import/README.md) for the field
mappings and the refresh-from-source workflow.

```bash
# import both collections
PAYLOAD_DISABLE_DB_PUSH=true pnpm data-import:import

# or one at a time
PAYLOAD_DISABLE_DB_PUSH=true pnpm data-import:guides
PAYLOAD_DISABLE_DB_PUSH=true pnpm data-import:locations
```

- **Skip-if-exists on slug.** Never overwrites hand-crafted content like the
  seeded Jany founder profile. Safe to re-run.
- **`<img>` tags are stripped** from body HTML; photos are re-uploaded through
  admin. A per-collection stripped-image count is logged.
- Run against production only when intended:
  `pnpm data-import:import --allow-production` — production `DATABASE_URL` plus
  the `R2_*` vars must be set. Almost always the wrong thing to do; import
  against dev, review, only then decide.

Refresh the seed from an updated source dump with `pnpm data-import:extract`
(requires MAMP + `OLD_DB_URL`). Commit the resulting diff in
`scripts/data-import/seed/`.

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
