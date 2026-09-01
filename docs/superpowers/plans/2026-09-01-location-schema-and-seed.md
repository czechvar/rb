# Location Schema And Seed Plan

Date: 2026-09-01
Status: Ready for implementation

## Source Inputs

Use the curated research dataset:

```text
.scratch/legacy-destination-work/curated-output/
```

Do not import directly from:

```text
.scratch/legacy-destination-work/enriched-output/
.scratch/legacy-destination-work/normalized-taxonomy/
```

Those are intermediate research artifacts and still include records excluded by
curation.

## Accepted Dataset State

- Curated destination candidates: 53
- Excluded records: `istria`, `monobloc-reus-spain`, `online`
- Broad destination records are allowed for now.
- Partial records are allowed to go live.
- Related events/trips are intentionally excluded.

## Accepted Taxonomy

Store canonical IDs. Apply locale labels in frontend/admin code.

Fields:

- `locationKind`
- `destinationScope`
- `climbingStyles`
- `rockTypes`
- `rockFeatures`
- `settingTags`
- `bestSeasons`
- `avoidSeasons`
- `accommodationTags`
- `transportTags`
- `nearestAirports`

Text/fact fields:

- `gradeRange`
- `routeCount`
- `problemCount`
- `sectorCount`
- `seasonSummary`
- `transportSummary`
- `accommodationSummary`
- `contentCompleteness` or `reviewStatus`
- `sourceReferences`

## Implementation Steps

1. Add shared taxonomy constants.

   Suggested file:

   ```text
   src/lib/taxonomy/location.ts
   ```

   Include canonical IDs, default English labels, and a path for locale labels.

2. Extend `src/collections/Locations.ts`.

   Add the accepted taxonomy fields under grouped admin sections. Keep fields
   optional so partial records can be imported safely.

3. Generate Payload types.

   Run:

   ```bash
   pnpm generate:types
   ```

4. Add or update tests.

   Cover at least:
   - taxonomy values accepted by the collection schema
   - destination detail query can read the new fields
   - partial records with missing text/facts remain valid

5. Prepare seed/import mapper.

   Create a deterministic seed script that reads curated JSON files and upserts
   marked location records by slug. It should not create duplicate records.

6. Add cleanup/idempotence behavior.

   Seeded records should carry a deterministic marker or be upserted by existing
   slug. Generated source references should be replaceable on repeat runs.

7. Wire frontend usage incrementally.

   First pass can expose taxonomy badges and sections on destination detail
   pages. More complex filtering can follow after schema and seed data are
   stable.

## QA Commands

Validate curated source data:

```bash
node scripts/data-import/legacy/validate-destination-enrichment.mjs --input .scratch/legacy-destination-work/curated-output
```

Check scripts:

```bash
node -c scripts/data-import/legacy/extract-destination-packets.mjs
node -c scripts/data-import/legacy/normalize-destination-taxonomy.mjs
node -c scripts/data-import/legacy/prepare-destination-enrichment-batches.mjs
node -c scripts/data-import/legacy/validate-destination-enrichment.mjs
node -c scripts/data-import/legacy/curate-destination-dataset.mjs
```

After schema edits:

```bash
pnpm generate:types
pnpm test:int
```

## Guardrails

- Never fill missing fields with unsourced prose.
- Keep source references with imported research data.
- Keep partial records publishable but visibly reviewable in admin.
- Do not promote airports to relationships in this phase.
- Do not create a separate `destinations` collection in this phase.
