# ADR-0020: Retain inactive Location relations

- Status: Accepted
- Date: 2026-09-18
- Owners: Engineering

## Context

`Location.destinationDetail.relatedLocations` is editorial content, but its
targets have an independent `active` lifecycle. Applying `active=true` as a
Payload relationship filter makes a parent Location unsaveable when an
existing related target is later deactivated. Public destination routes must
still expose only active destinations.

## Decision

Allow `relatedLocations` to reference active or inactive Location records.
Keep inactive references in stored editorial data so unrelated edits do not
destroy the relationship. Filter populated related Locations by `active=true`
when rendering public destination cards, and use fallback authored cards when
no active related Location remains.

This relaxation applies only to `destinationDetail.relatedLocations`; other
relationships retain their existing eligibility filters unless a separate
decision changes them.

## Alternatives Considered

- Reactivate every referenced Location: rejected because editorially retired
  destinations should not become public merely to keep a relation valid.
- Clear inactive relations automatically: rejected because it loses editorial
  intent and makes later reactivation or review harder.
- Replace every relation with manual cards: rejected because active Location
  records should continue to provide canonical names and destination URLs.

## Consequences

- Admins can save a Location after a related target becomes inactive.
- Public pages do not link to inactive destination records.
- Editors may need to maintain fallback cards when all canonical related
  targets are inactive.

## References

- Workstreams task `c669c7ac-a380-465a-a132-8ac8024790cb`
- `src/collections/Locations.ts`
- `src/components/blocks/LocationContextBlocks.tsx`
- `src/app/(frontend)/destinations/[slug]/page.tsx`
