# Source-preserving Event content migration

Target contract: `Event.tripDetail.sections[]` with `kind`, the original `heading`, and original Lexical `body`. Supported kinds: overview, learning, itinerary, requirements, equipment, audience, highlights, notes. Paragraph/list structure and formatting are preserved. This is the source content layer for later blocks, not a completed visual redesign or a fully populated card model.

The migration adds sections only. Event/date IDs, original source fields, existing structured arrays, custom layouts, prices, guide/location/media relationships and date overrides remain unchanged. Missing material and contradictory source passages are left for editors. The HTML and internet are not data sources. See ADR-0009.

## One place for the working data

`.scratch/event-detail-migration/` contains:

- `source.json`: immutable consolidated catalogue source snapshot (65 Events, relevant child arrays, 789 dates with extra content/overrides, relationship identities and supporting public records). This includes the fields needed for this migration; it is not a whole-database or media-binary backup.
- `manifest.json`: every Event's candidates, original bodies, source paths, outcomes, known pilot conflicts and unmapped ranges; occurrence content is preserved in place.
- `README.md`: per-Event coverage table.
- `runs/*/{intent,committed}.json`: append-only application receipts. `applied.json` points to the latest completed run.
- `canonical-seed-before.json`: the canonical seed before the scoped update.

Scratch artifacts are local, not committed. The commands below recreate an inventory in a new directory. The portable committed data after this run is `scripts/data-import/seed/canonical-payload-seed.json`; only new Event tripDetail sections were added.

## Execution

All DB scripts load only the selected connection value from `.env`, never print it, reject the known production host and restrict connections to localhost. The user authorized the audited local target. Remote deployment or running against another target is a separate scope.

```bash
# Read-only, refuses to overwrite an existing source snapshot.
node scripts/data-import/event-detail/capture.mjs .scratch/event-detail-migration
node scripts/data-import/event-detail/mine.mjs .scratch/event-detail-migration

# Pure exact-source, ambiguity and stale-source tests.
node --test scripts/data-import/event-detail/mine.test.mjs

# Optional local integration check: temporary tables/fixtures, rollback and connection teardown.
node scripts/data-import/event-detail/database.test.mjs

# After schema migration and authorized target verification:
node scripts/data-import/event-detail/backfill.mjs .scratch/event-detail-migration
node scripts/data-import/event-detail/backfill.mjs .scratch/event-detail-migration --apply

# Verifies committed DB sections against manifest; updates only empty seed tripDetail sections.
node scripts/data-import/event-detail/promote-seed.mjs .scratch/event-detail-migration
```

Tracked schema migration: `20260910_151403_event_trip_detail_sections`. Use the repository migration workflow with schema push disabled and the verified local connection. Generated SQL was scoped to the new sections table/type/indexes; preexisting payment columns belong to earlier migrations. The accompanying generator snapshot includes the complete current schema.

The backfill validates its deterministic manifest against the source snapshot and the live catalogue before writing. It uses a serializable transaction and locks Event/target writes. Existing section arrays are preserved wholesale; reruns do not append duplicates or overwrite editor changes. Read-back validates every inserted body and confirms the captured original fields remain unchanged before commit. Date changes, source edits or relationship changes invalidate the snapshot and require a new capture/manifest.

Candidate outcomes are `copy-exact`, `editor-review`, `already-populated`; unclassified source is explicitly listed under `unmapped`. Conflict detection is conservative screening, not a claim to have discovered every editorial inconsistency. Inspect the manifest before applying to a new snapshot. Multiple sources for a topic are left for an editor rather than merged or ranked automatically.

## Completed local run — 2026-09-10

- 96 exact-copy sections added to 47 existing Events.
- 15 candidate sections retained for editor review; all 65 Events accounted for.
- Knots & Stone: overview, learning and What to bring copied; programme/requirements withheld for known conflicts.
- Original captured catalogue data unchanged; no new Event, Event Date, Guide, Location or Media records.
- 47 canonical seed Events received those same 96 sections after independent DB read-back.
- Frontend rendering and existing page layouts unchanged.

## Rollback and editor work

No source fields were removed. A rollback of the backfill should use the original run's inserted IDs and expected values, delete only rows still byte-equivalent to those inserted, and preserve edited rows. Do not use the schema `down` migration after editors have worked in the new sections: it drops the section table. No rollback was requested or executed after the committed run.

Later frontend work should bind available section kinds to reusable components and resolve date facts separately. Existing content remains the public renderer's input until that work is reviewed; never present the 96 sections as visual implementation completion.
