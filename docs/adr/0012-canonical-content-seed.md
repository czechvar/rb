# ADR-0012: One canonical content seed

- Status: Accepted
- Date: 2026-09-11
- Owners: Engineering

## Context

The canonical snapshot predated the 26 reviewed trip occurrence enrichments. Rebuilding it required separate database-local editorial import receipts and fixed numeric IDs. The user requested one seed approach before a full database dump.

## Decision

`pnpm seed` is the single supported fresh content bootstrap, using the tracked `scripts/data-import/seed/canonical-payload-seed.json`. `pnpm seed:export` refreshes that snapshot from an explicitly checked non-production source. The September 11 reviewed local catalogue, including all 26 occurrence editorial overrides, is promoted from temporary comparison content to persistent seed content.

The snapshot includes all collections enumerated in `CANONICAL_SEED_COLLECTIONS`: site pages, catalogue records, occurrence content, FAQs/reviews, and media metadata. It excludes accounts, orders, transactions, discounts, referrals, and operational Payload state. Full SQL backups preserve those separately; media binaries remain in object storage.

Legacy and editorial importers are source-maintenance/provenance tools, not additional fresh-install steps. Their original rollback receipts remain historical local artifacts and are not portable installation data. Source copy provenance does not establish independent verification of testimonial or commercial claims.

The seed remaps database-local relationship IDs and preserves stable media IDs. `pnpm seed:sandbox` validates a fresh local disposable database and repeated import; it must not reset a pre-existing database or disclose configuration values.

## Alternatives Considered

- Chain all historical importers: rejected because they depend on old state and local numeric IDs.
- Use SQL dumps as the only bootstrap: retained for backups, not portable content seeding.
- Include customer and commerce history in the seed: rejected because fresh environments must not inherit operational records.

## Consequences

- One tracked snapshot and one import command reproduce current CMS content.
- Reviewed CMS changes require a new snapshot export; manifests alone do not update the seed.
- Migrations must run before seeding. Media binary backup remains separate.

## References

- ADR-0006: Portable legacy imports
- ADR-0011: Trip editorial occurrence overrides
- scripts/canonical-seed/README.md
