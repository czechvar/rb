# Canonical Payload Seed

This folder contains the reusable seed path for freshly provisioned Rockbusters
databases.

## Commands

```bash
pnpm run seed:export
pnpm run seed
pnpm run seed:sandbox
pnpm run seed:demo
```

- `seed:export` snapshots the current `DATABASE_URL` into
  `scripts/data-import/seed/canonical-payload-seed.json`.
- `seed` imports that snapshot into the current `DATABASE_URL`.
- `seed:sandbox` resets a local disposable database, runs migrations, and runs
  `seed` against it.
- `seed:demo` keeps the older hand-written/demo seed available for tests and
  legacy import verification flows.

## Import Order

The canonical seed imports base records before dependants:

1. `media`
2. `difficulties`, `categories`, `programs`, `airports`, `guides`, `locations`,
   `partners`, `post-categories`, `posts`
3. `events`
4. `event-dates`
5. `reviews`, `faqs`
6. `pages`

Numeric Payload IDs are not portable across empty databases, so the importer
records old-to-new ID mappings and rewrites relationship fields while importing.
Media IDs are string IDs and are preserved because R2 object keys depend on
those values.

## Hygiene

The exporter excludes known temporary/demo rows with markers such as
`cms-block-system-poc`, `poc-blocks`, and `mcp-smoke`, and prunes event dates
whose parent event was removed. It also refuses to run against the production
Neon host unless `--allow-production` is passed intentionally.
