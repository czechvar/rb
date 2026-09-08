# ADR-0008: Location Destination Detail Structured Content

- Status: Accepted
- Date: 2026-09-03
- Owners: Engineering

## Context

Location pages need a richer default destination renderer than the current
fallback prose layout. The Albarracin source design includes hero stats,
audience cards, sector cards, scored season rows, gear groups, transport and
accommodation cards, rest-day ideas, access rules, safety items, cost rows,
destination FAQs, trip promos, and related destination cards.

The existing Location schema already owned destination taxonomy, logistics
summaries, media, galleries, and mined `contentSections`, but those fields did
not provide enough structure for the card/table-heavy default renderer. Once
`destinationDetail` is populated, keeping both prose layers duplicates public
copy and makes the seed/schema harder to reason about.

## Decision

Add optional `locations.destinationDetail` structured content for the default
destination detail renderer.

Keep the new fields grouped under `destinationDetail` instead of flattening
them onto `locations`. Existing canonical facts such as `problemCount`,
`sectorCount`, `gradeRange`, `bestSeasons`, `nearestAirports`,
`mainPicture`, and `gallery` remain on Location.

Use scored `seasonMonths` rows as the canonical month-level rendering input.
Hero season ranges should be derived from scores rather than hand-authored
season labels.

Make `destinationDetail` the single public destination-detail copy surface.
Remove the old top-level `content`, `contentSections`, `seasonSummary`,
`transportSummary`, and `accommodationSummary` fields from Location after the
current destinationDetail data is exported into the canonical seed.

Keep `sourceReferences` on Location as editorial traceability for canonical
facts and imported research provenance. It is not a renderer input.

## Alternatives Considered

- Use only mined `contentSections`. Rejected because prose sections cannot
  reliably power audience cards, sector cards, season tables, FAQ accordions,
  and cost tables.
- Add a new Destination collection. Rejected because the domain model says
  destination pages render Location records.
- Store this as one JSON blob. Deferred because typed Payload arrays are more
  editor-friendly and give generated TypeScript types for renderer work.
- Flatten all fields on Location. Rejected because it would make the Location
  schema harder to scan and blur canonical facts with detail-page composition.

## Consequences

- Destination detail rendering can become richer while keeping older Location
  records compatible through optional fields and fallbacks.
- Location has a cleaner ownership split: parent fields are canonical facts,
  media, relationships, source traceability, and CMS layout; `destinationDetail`
  owns page copy and renderer-specific structured rows.
- The schema creates several nested array tables in Postgres; short `dbName`
  values are required to avoid identifier length problems.
- Importers can update one Location at a time before expanding to all curated
  destinations.
- Some design-derived values remain editorial claims and should stay marked for
  verification until reviewed.

## References

- Workstreams task: `53d850ca-5395-4f34-84e5-b213055e2435`
- `src/collections/Locations.ts`
- `scripts/data-import/update-location-structured-content.ts`
- `.scratch/albarracin-derived-structured-content.json`
