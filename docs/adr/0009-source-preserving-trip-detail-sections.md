# ADR-0009: Source-preserving trip detail sections

- Status: Accepted
- Date: 2026-09-10
- Owners: Engineering

## Context

Existing Event marketing copy contains useful paragraphs and lists, but also conflicting commercial facts. The user authorized mining and migration with existing wording preserved and editorial corrections deferred. Forcing the source into new audience personas, three learning pillars or destination-bound itinerary days would require invention. Existing Event arrays also cannot retain all original Lexical formatting.

## Decision

Add optional `events.tripDetail.sections`, a typed Payload array with `kind`, original `heading`, and original rich-text `body`. Kinds are overview, learning, itinerary, requirements, equipment, audience, highlights and notes. A source list remains a list and a source paragraph remains a paragraph. This is an initial source-preserving content contract; it does not claim full card/table parity with the HTML design.

Keep current content, additionalInfo, existing typed arrays, custom layouts and relationships intact. Fill only an empty section array from deterministic exact-source candidates. Preserve existing section arrays on repeat runs. Store source provenance, conflicts, omitted ranges and preconditions in migration artifacts, not a new CMS collection.

Conflicting or ambiguous candidates remain outside the backfill for editors. Public rendering may now expose exact original passages under explicitly recognized source headings in their corresponding sections, even when other original statements are disputed. This runtime presentation does not approve, correct or persist those statements. Editor-owned structured sections take priority, and only exact source slices actually rendered are subtracted from supplementary copy. Date prices, schedules, guides, locations and logistics overrides stay on Event Dates under ADR-0005. HTML and internet material are not sources for the backfill.

Optional third learning-pillar fields extend the existing learning group; an optional Event comparison group owns its heading, column labels and source rows. The timeline variant pairs a complete comparison with the programme; incomplete comparisons are omitted. Adding these fields does not populate them from design examples. Original ungrouped learning items remain ungrouped until editors provide grouping.

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


## Authored summary content — 2026-09-11

The user subsequently authorized adapting the Kalymnos reference copy for one Event and matching its hero summary and facts strip. This is an editorial operation, separate from the exact-copy migration above. Optional tripDetail fields own locationDescriptor, gradeRange, leadRequirement, minimumParticipants, priceCaption, travelNote and hashtag. Unpopulated Events retain their existing presentation.

Separate strip and summary projections use these authored fields alongside the selected Event Date. Duration is elapsed calendar days (a two-week stay is 14 days), while date endpoints remain unchanged. Dates, currency, prices, venue and coaches follow the selected occurrence; an alternative weekly price requires a same-start, same-venue, same-currency seven-day occurrence. The minimum participant count is editorial copy, not a booking-capacity rule. Sold-out/inquiry behavior remains authoritative. No design example overrides commercial controls.
