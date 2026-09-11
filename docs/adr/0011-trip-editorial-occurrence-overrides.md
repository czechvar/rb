# ADR-0011: Trip editorial occurrence overrides

- Status: Accepted
- Date: 2026-09-11
- Owners: Engineering

## Context

The 26 reference designs map to nine Events. Kalymnos and five other destination designs share Event8. Event-wide pilot copy therefore leaks into unrelated scheduled occurrences. Editors also cannot change automatic gallery/audience headings without replacing the complete layout. The user authorized implementation, delegated delivery and root decisions on a separate branch.

## Decision

Extend ADR-0005: Events remain default marketing owners; Event Dates may hold optional typed editorial overrides for occurrence-specific story and section content. Resolve selected Date over Event over existing content/shared defaults. This does not alter commerce, media, taxonomy or relationships. Preserve existing source-rich content under ADR-0009.

A semantic section key owns independently editable eyebrow, heading segments, intro, clear flags and hide state. Omission inherits; clear is explicit. Ordered escaped text segments carry semantic accent and break-before flags and concatenate without injected whitespace, including inside words. No arbitrary HTML/CSS is accepted. Existing plain headings remain compatible.

Explicit saved layout fields win when supplied. Synthesized layout labels are defaults, not editorial overrides. This extends ADR-0010 without replacing saved layouts. Bodies and existing structured arrays are reused rather than duplicated solely to customize a heading.

## Alternatives Considered

- Full layout forks for headings: rejected because a copy edit should not fork presentation.
- Separate Events for every design: rejected because scheduled occurrences already represent these trips.
- Location-wide story edits: rejected because course copy should not replace shared venue information.
- Generic JSON or HTML: rejected because editors need typed fields and safe predictable rendering.
- Automatic colon-based accent inference: retained only as legacy fallback; authored segments explicitly control emphasis.

## Consequences

Queries and all trip blocks must use the same selected occurrence projection. Tests cover leakage, custom layouts and clear/reset semantics. Date-specific content migration is local, reversible and source-traced; other catalogue enrichment remains gated by Kalymnos acceptance.

## References

- docs/superpowers/plans/2026-09-11-kalymnos-editorial-implementation.md
- docs/superpowers/plans/2026-09-11-trip-detail-customization-audit.md


## Implementation clarifications

Section visibility is an explicit inherit/show/hide choice rather than an ambiguous false checkbox. Clear flags apply to text; absent values inherit. The supported commercial placeholders in overview facts, comparison column headings and closing primary CTA are interpolated from selected occurrence data. Nested itinerary images and transport airports cannot be overridden by editorial fields; existing source relationships remain authoritative. Unused nullable relational structures from the additive migration are retained rather than destructively editing an applied migration.
