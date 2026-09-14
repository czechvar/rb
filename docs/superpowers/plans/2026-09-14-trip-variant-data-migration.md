# Trip Variant data structure and seed migration

Status: ready-for-human
Date: 2026-09-14
Decision: [ADR-0016](../../adr/0016-trip-variants-and-dated-query-leaves.md)
Implementation: schema and canonical dataset complete; existing-database apply
and disposable migration verification intentionally not run

## Scope

This first delivery creates and populates the additive data model. It does not
switch public routes. Existing Event Date fields and occurrence routes remain
available until the new projection is verified.

Launch scope is fixed to the canonical seed snapshot on 2026-09-14:

- 31 Trip Variants;
- 64 active future Event Dates under 10 published Events;
- 25 promoted authoritative editorial payloads;
- 6 inherited, non-indexable variants;
- 719 past and 6 in-progress dates left as archive data;
- 10 same-start pairs retaining start-to-end occurrence keys.

## Checklist

- [x] Add the Trip Variant collection and register cache/revalidation behavior.
- [x] Add an optional Event Date relationship without removing legacy fields.
- [x] Add database uniqueness and relationship constraints with a tracked migration.
- [x] Generate Payload types.
- [x] Generate 31 deterministic variant rows from the canonical seed.
- [x] Attach exactly 64 launch Event Dates to those variants.
- [x] Promote exactly 25 authoritative editorial payloads.
- [x] Keep six inherited variants non-indexable.
- [x] Preserve every Event Date's existing content and commercial values.
- [x] Extend canonical seed ordering, identity matching, and relationship remapping.
- [x] Verify deterministic reruns, counts, referential integrity, and date-key collisions.
- [x] Run typecheck and focused unit/integration tests without database writes.

## Deferred

- Public route, canonical, JSON-LD, sitemap, and discovery-link switch.
- Full normalization of historical Event Dates.
- Removal of legacy Event Date Event/location/editorial fields.
