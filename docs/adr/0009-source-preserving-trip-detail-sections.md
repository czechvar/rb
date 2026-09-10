# ADR-0009: Source-preserving trip detail sections

- Status: Accepted
- Date: 2026-09-10
- Owners: Engineering

## Context

Existing Event marketing copy contains useful paragraphs and lists, but also conflicting commercial facts. The user authorized mining and migration with existing wording preserved and editorial corrections deferred. Forcing the source into new audience personas, three learning pillars or destination-bound itinerary days would require invention. Existing Event arrays also cannot retain all original Lexical formatting.

## Decision

Add optional `events.tripDetail.sections`, a typed Payload array with `kind`, original `heading`, and original rich-text `body`. Kinds are overview, learning, itinerary, requirements, equipment, audience, highlights and notes. A source list remains a list and a source paragraph remains a paragraph. This is an initial source-preserving content contract; it does not claim full card/table parity with the HTML design.

Keep current content, additionalInfo, existing typed arrays, custom layouts and relationships intact. Fill only an empty section array from deterministic exact-source candidates. Preserve existing section arrays on repeat runs. Store source provenance, conflicts, omitted ranges and preconditions in migration artifacts, not a new CMS collection.

Conflicting or ambiguous candidates remain outside the backfill for editors. Date prices, schedules, guides, locations and logistics overrides stay on Event Dates under ADR-0005. HTML and internet material are not sources for the backfill. This migration does not change public rendering; source removal/render cutover is separate work.

## Alternatives Considered

- Populate a fixed three-pillar schema: rejected because grouping and headings would need new editorial content.
- Narrow/replace Event.content immediately: rejected because unmapped text and conflicting facts must remain available for editors.
- Flatten rich text into existing plain-text arrays: deferred where it would lose formatting or require guessed attributes such as mandatory equipment or stage destination.
- Add a generic JSON blob: rejected in favor of typed sections editable through Payload.

## Consequences

- Source-rich sections can be bound to reusable blocks without rewriting copy.
- Original and mined content coexist until a reviewed rendering/editorial cutover.
- Not every design section is populated; missing and disputed content remains editorial work.
- Migrations are additive. The importer preserves existing target data and validates source preconditions, and canonical seed promotion must preserve the same exact section bodies.

## References

- docs/adr/0005-catalogue-event-location-date-ownership.md
- docs/superpowers/plans/2026-09-10-single-trip-source-content-mining.md
- scripts/data-import/event-detail/README.md
