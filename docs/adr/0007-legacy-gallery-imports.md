# ADR-0007: Legacy Gallery Imports

- Status: Accepted
- Date: 2026-09-02
- Owners: Engineering

## Context

Legacy Rockbusters stores galleries as separate records:

```text
media__gallery
media__gallery_media
event_date.gallery_id
```

The new Payload model does not have a Gallery collection. It stores ordered
media relations directly on entities through `hasMany` upload fields such as
`events.gallery` and `locations.gallery`.

The legacy placement signal comes from event dates. Blog rows do not currently
use `blog.gallery_id`. Many event dates reference a gallery, but the same
gallery can be reused by many dates and some dates span multiple locations.
Current fresh sandbox imports have no populated `events.gallery` or
`locations.gallery` relations.

## Decision

Flatten legacy gallery membership into ordered Payload media arrays.

Use `media__gallery_media` ordered by `position`, then `id`, and translate each
legacy `media_id` through the stable legacy media lookup. Preserve this order in
Payload `gallery` arrays.

Populate `locations.gallery` from event-date gallery placements only when the
event date resolves to exactly one legacy location. This makes Location the
canonical owner for reusable destination imagery.

Populate `events.gallery` by rolling up all resolved gallery media from that
event's event dates. This gives event pages direct imagery even when location
ownership is ambiguous or incomplete.

When importing into an entity that already has gallery media, preserve the
existing order and append only missing legacy media in legacy order. Do not
delete or reorder CMS-added gallery items.

Do not add `event-dates.gallery` now. Event Date remains the purchasable
occurrence and should not own duplicated editorial gallery content.

Ignore the legacy `media__gallery_media.enabled` flag for this import unless a
future audit proves it is meaningful. The restored legacy data has almost all
gallery memberships disabled, so using it as a hard filter would discard the
available gallery catalogue.

## Alternatives Considered

- Add a Payload Gallery collection. Rejected for now because current public
  entities need ordered media arrays, not reusable gallery records with their
  own editorial lifecycle.
- Store galleries only on Events. Rejected because much of the imagery is
  destination context and should be reusable across trips.
- Store galleries only on Locations. Rejected because not every event can be
  fully covered through single-location placement, and multi-location events
  still need direct imagery.
- Add `event-dates.gallery`. Rejected because date-level ownership would
  duplicate the same gallery across many scheduled occurrences.
- Filter only enabled legacy gallery memberships. Rejected because only a tiny
  fraction of memberships are enabled in the restored dump.

## Consequences

- Destination pages get canonical reusable galleries from unambiguous
  single-location event-date placements.
- Event pages get their own gallery arrays from all date placements, including
  ambiguous multi-location cases.
- Import order matters and must be deterministic.
- Imports must merge galleries instead of overwriting editor-owned media.
- The importer should report unresolved media IDs and skipped ambiguous
  location placements.

## References

- Workstreams task: `de204748-947e-40fd-ae6e-361e785f62b2`
- `src/collections/Events.ts`
- `src/collections/Locations.ts`
- `scripts/data-import/seed/legacy-event-dates.json`
- `scripts/data-import/extract-legacy-events.ts`
- `scripts/data-import/import-legacy-events.ts`
