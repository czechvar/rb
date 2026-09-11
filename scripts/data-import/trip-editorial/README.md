# Remaining trip editorial rollout

> Seed promotion — 2026-09-11: the reviewed occurrence content is now persistent
> canonical seed data (ADR-0012). Fresh environments use `pnpm seed` only.
> The temporary classification and commands below describe the historical import
> workflow; its local receipts are not required or portable seed inputs.


This importer updates only `editorial` on the 25 existing Event Dates mapped by the three manifests. The content is **temporary local design comparison content**, identified by `trip-editorial-{eventDateId}` receipts. It does not promote canonical seed data or mutate parent Events, booking values, relationships, or imagery. Kalymnos Date745 is explicitly excluded.

Run from the repository root through `pnpm exec tsx`:

```bash
pnpm exec tsx scripts/data-import/trip-editorial/manage.ts dry-run
pnpm exec tsx scripts/data-import/trip-editorial/manage.ts dry-run --batch espana
pnpm exec tsx scripts/data-import/trip-editorial/manage.ts dry-run --date 749
pnpm exec tsx scripts/data-import/trip-editorial/manage.ts apply --batch espana
pnpm exec tsx scripts/data-import/trip-editorial/manage.ts check --batch espana
pnpm exec tsx scripts/data-import/trip-editorial/manage.ts refresh-dry-run --date 749
pnpm exec tsx scripts/data-import/trip-editorial/manage.ts refresh --date 749
pnpm exec tsx scripts/data-import/trip-editorial/manage.ts rollback --date 749
```

Batch names are `standalone`, `espana`, and `rockroad`; positional batch names also work. Omitting selectors selects all 25. Migrations and generated types must be in place before running. Application and refresh execution belongs to root QA after manifest review.

## Safety and verification

The local `.env` database is checked before Payload loads. Only local hosts are allowed; the known production host is explicitly refused. Automatic schema push is disabled. Configuration values and runtime errors are never printed. Output contains only safe stage names, record IDs, counts, and booleans.

For each target the importer verifies Event ID, slug, Event Date parent, and exact dates. Existing populated editorial requires an unchanged receipt. Initial apply requires empty editorial. `check` and repeated `apply` verify receipt ownership, unchanged protected fields, unchanged manifest, every authored key, and exact array lengths. Manifest changes require explicit `refresh`; refresh preserves the original rollback snapshot and appends previous editorial/provenance to receipt history.

Each date uses a separate Payload transaction. The record and parent Event are checked again within that transaction. Readback compares all Event Date fields except `editorial` and `updatedAt`; parent Event must remain identical. Authored editorial is verified recursively, allowing Payload-generated defaults and IDs but not missing keys or dropped array rows. The importer does not write any other collection.

Receipts live in `.scratch/trip-editorial-rollout/receipts/{id}.json`. A `{id}.pending.json` receipt is written exclusively before transaction commit, then renamed after commit. Any pending receipt blocks that date: root must inspect committed state against its before/after snapshots before recovery. The importer intentionally never deletes ambiguous recovery evidence. Each successful date prints a checkpoint; earlier completed dates remain recorded if a later date stops.

`rollback` requires unchanged receipt-owned content and protected data, restores the initial editorial, verifies readback, and archives the receipt. Subsequent operator edits cause a safe stop rather than being overwritten. Re-apply after a completed rollback creates a fresh receipt.

The text-only references and manifest provenance preserve original passages and documented adaptations. They are review evidence, not verified testimonials or live commercial records. Receipts are local rollback artifacts and should not be treated as canonical seed content.

## Browser and contract QA

Use `pnpm exec vitest run --config vitest.editorial.config.mts` for pure rendering, import replacement and all-manifest contract checks. No database is initialized by this configuration. The two older Node test files run through `pnpm exec tsx --test tests/unit/trip-detail.test.ts tests/unit/trip-layout.test.ts`.

Historical occurrences must remain historical. After checking the local development database guard and running the development server with schema push disabled, install the temporary fixture route:

```bash
node scripts/data-import/trip-editorial/qa-fixture.mjs install
node scripts/data-import/trip-editorial/qa.mjs
node scripts/data-import/trip-editorial/qa.mjs --public --ids=674,676
python3 scripts/data-import/trip-editorial/text-qa.py
node scripts/data-import/trip-editorial/qa-fixture.mjs remove
```

The fixture uses actual saved occurrence content and the public rendering components with an explicit historical clock. It only accepts the 25 reviewed IDs and returns 404 in production. The install/remove helper refuses to overwrite a modified route. Always remove it before committing or building a release. Public-mode checks should include only occurrences currently eligible on public routes; historical selections deliberately fall back there.

Browser checks cover exact selected occurrence, every expected passage, heading accent segments and line breaks, unresolved commercial tokens, overflow, page errors and existing image loading at 1440 and 390 pixels. Per-case JSON and screenshots live in `.scratch/trip-editorial-rollout/qa`; missing source imagery remains a documented catalogue gap. `--ids=...`, `--widths=...` and `--origin=...` select cases. Keep parallel browser runs bounded and aggregate per-case results when partitioning work.

The independent text check uses Python with BeautifulSoup and verifies all final authored display strings, including short labels and resolved tokens, against saved-content fixture HTML without requesting media. Keep the fixture installed until this check finishes. The checked-in HTML template is QA tooling, not a public route.
