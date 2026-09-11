# Canonical Payload Seed

This is the single content bootstrap for freshly provisioned Rockbusters databases.
The tracked snapshot includes the reviewed September 11 catalogue and all 26
trip occurrence editorial overrides, including Kalymnos. No legacy or editorial
import command is needed after `pnpm seed`.

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
- `seed:sandbox` creates a fresh local disposable database, runs migrations,
  seeds twice, checks exported content and relationships, then cleans up its database.
  It refuses to reset an existing database.
- `seed:demo` is a historical fixture utility, not a catalogue bootstrap.

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

## Scope and maintenance

The snapshot is persistent seed content. It includes every configured public CMS
collection: pages, posts/taxonomy, media metadata, airports, locations, guides,
partners, programs, categories, difficulties, trips, occurrences, FAQs and reviews.
Accounts, orders, transactions, discounts, referrals and internal Payload state
belong in full database backups, not this seed. R2/local media binaries need their
own storage backup; metadata alone does not recreate image files.

After reviewed CMS edits, check the source database target, run `pnpm seed:export`,
review the snapshot diff, run `pnpm seed:sandbox`, and commit the snapshot with
its compatible schema/migrations. Run migrations before `pnpm seed` on a fresh
environment. The export reads CMS data; it does not modify the source database.

Historical `scripts/data-import` source files and manifests retain provenance and
can support future source refreshes. They are not implicitly executed by the seed.
Their fixed IDs/receipts must not be reused against a freshly seeded database.

See ADR-0012 for the content/operational-data boundary.

Internal trip links with `?date=` are remapped after all occurrences have been
imported, so related-option links continue selecting the intended occurrence even
when the destination database allocates different IDs.
