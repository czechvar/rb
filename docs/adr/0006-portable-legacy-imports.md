# ADR-0006: Portable Legacy Imports

- Status: Accepted
- Date: 2026-09-02
- Owners: Engineering

## Context

Legacy Rockbusters imports need to work against more than one database: local
development, disposable validation databases, preview databases, and eventually
production. Earlier import runs could accidentally reuse lookup JSON files that
contained Payload numeric IDs from a different database. That made otherwise
valid legacy rows point at unrelated or missing records, especially media,
guides, airports, events, and event dates.

Media is the exception to the general rule. Legacy media IDs map to stable
Payload media text IDs and R2 object keys, so those string IDs must remain
portable and must not be replaced with fresh numeric IDs.

## Decision

Legacy imports must be portable across databases. Import scripts may read
committed source seeds, but database-local lookup output must be redirectable
through `DATA_IMPORT_LOOKUP_DIR`. Disposable validation runs write lookup files
under `.scratch/data-import-sandbox-lookups` instead of mutating committed seed
lookups.

The canonical fresh-database check is:

```bash
pnpm run data-import:sandbox
```

That command resets a separate local database,
`rockbusters_import_sandbox`, runs migrations and the full import pipeline, then
reruns the foreign-key-heavy imports to prove idempotence. The runner refuses
non-local admin database hosts.

When a lookup file contains stale database-local IDs, importers should recover
from stable source attributes where practical:

- guides by legacy guide rows and guide slug,
- airports by legacy airport rows and IATA code,
- event dates by parent event plus date range,
- homepage references by validating referenced records and falling back to
  global or nullable references.

Media imports keep stable string IDs and verify referenced media exists before
using it.

## Alternatives Considered

- Use full SQL dumps as the normal migration path. Rejected as the default
  because dumps are useful for snapshots, but they do not exercise repeatable
  import behavior and make it easy to copy stale or environment-specific data.
- Commit one set of generated lookup files and reuse them everywhere. Rejected
  because Payload numeric IDs are database-local.
- Add legacy IDs to every Payload collection schema. Deferred because the
  current import boundary can preserve legacy traceability in external lookup
  artifacts without permanently exposing legacy implementation details in the
  CMS model.
- Treat missing media references as fatal. Rejected for curated imports because
  the media catalogue can be validated separately and missing optional images
  should not block non-media content from importing.

## Consequences

- Fresh database bootstraps have a repeatable verification command.
- Import scripts are less sensitive to stale lookup files from another
  database.
- `.scratch/data-import-sandbox-lookups` is generated state and must not be
  committed.
- Media binary availability in R2 remains an external prerequisite; these
  imports seed and validate metadata, not object storage contents.
- Known missing legacy references may still be reported by the import logs and
  should be handled deliberately rather than silently invented.

## References

- `scripts/data-import/run-sandbox-import.mjs`
- `scripts/data-import/README.md`
- `scripts/data-import/import-legacy-events.ts`
- `scripts/data-import/import-airports-seed.ts`
- `scripts/data-import/import-homepage-seed.ts`
- `scripts/data-import/import-legacy-destinations.ts`
- `scripts/seed.ts`
