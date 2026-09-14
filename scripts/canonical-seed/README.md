# Canonical Payload Seed

This is the single content bootstrap for freshly provisioned Rockbusters databases.
The tracked snapshot includes the reviewed September 11 catalogue and all 26
trip occurrence editorial overrides, including Kalymnos. The September 12 refresh
also includes all 53 local posts (50 published), 14 blog categories, and the Blog
CMS Page with its selected Rodellar hero and index grid. It also includes the
Team CMS Page with the full active-guide roster and shared content blocks, and
the Contact CMS Page with its seven sections and public desk contacts. Contact
reference phone/email values are not independently verified business details;
enquiry submissions and operational records are excluded. No legacy or editorial
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

Event Date slugs, aliases and indexing eligibility are stored in the snapshot.
Run `pnpm exec tsx scripts/canonical-seed/backfill-occurrence-identities.ts` for
an offline, read-only identity report. The `--rebuild --write` form updates the
snapshot after reviewing its missing-location and collision report; it never
writes to a database. Stored slugs survive destination database ID allocation.

Internal trip links use `/trips/{eventSlug}/{occurrenceSlug}`. Import still
recognizes a pre-launch `?date={sourceId}` link and resolves it from the snapshot's
source occurrence identity, never from the destination database ID. The
trip-editorial builders and QA fail when a required stored slug is absent.

## Contact source maintenance

The Contact Page and its public desk details are persistent CMS content, sourced
from `scripts/data-import/seed/contact-page.json`. The localhost-only maintenance
importer `scripts/data-import/import-contact-page-seed.ts` preserves an existing
`contact` Page unless `--replace` is explicitly supplied. Run it with
`PAYLOAD_DISABLE_DB_PUSH=true` after applying migrations, then export the canonical
snapshot. It is not an additional bootstrap step after `pnpm seed`.

The Contact schema migration adds block tables and the `lightSplit` presentation
variant only; it does not publish a Page or configure enquiry delivery. For an
existing environment, promotion needs both that schema migration and a scoped
Contact Page/block content upsert. A full database replacement is unnecessary.
The current seed keeps the enquiry form's editorial content; runtime submission
availability depends on the separately agreed delivery integration.

Browse-trip actions in the Home and Destinations pages point to `/trips`.
For an existing local database, `pnpm exec tsx scripts/data-import/update-trip-navigation.ts --apply` makes the same narrow,
idempotent correction without reimporting the catalogue. Omit `--apply` for a
read-only count. The utility refuses non-local databases.

The eight customer-defined trip categories are persistent seed records, with
names/descriptions in `scripts/data-import/seed/trip-categories.json`. Run
`pnpm exec tsx scripts/data-import/import-trip-categories.ts --apply` to upsert
these categories in an existing local database and refresh only the canonical
category snapshot. Without `--apply`, the utility reports planned counts only.
It refuses non-local databases and preserves existing categories and Event
assignments. Proposed Event mappings are in
`docs/superpowers/specs/2026-09-13-trip-category-mapping.md` and its CSV companion;
the user-approved assignments have now been applied locally and included in the canonical seed. Run `pnpm exec tsx scripts/data-import/apply-event-categories.ts --apply` to apply the same mapping in an existing local database. The five held Events retain their assignments; draft Events stay draft. Omit `--apply` for a dry run.

Category snapshot merging preserves canonical IDs by slug, even when local database IDs differ, so existing seed relationships remain valid.
