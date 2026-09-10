# ADR-0010: Trip layout variants and occurrence context

- Status: Accepted
- Date: 2026-09-10
- Owners: Engineering

## Context

The source-preserving sections introduced by ADR-0009 need public rendering. Trip pages share components with existing pages and CMS layouts. Event Dates own commercial and occurrence-specific information; mixing their values with Event defaults produces contradictory booking summaries.

## Decision

Preserve explicit Event layouts as authoritative. When an Event has meaningful tripDetail sections and no custom layout, synthesize a sequence of registered CMS blocks. Otherwise retain the legacy composition. Extend shared presentations with explicit variants whose absent/default value preserves existing consumers.

Read upcoming active Event Dates once per trip request, without long-lived catalogue caching. Select a valid requested occurrence, otherwise the first available occurrence, then the earliest sold-out occurrence. Recompute remaining seats after asynchronous booking counts resolve. No occurrence or a sold-out occurrence offers an inquiry rather than a direct booking link. Booking still validates capacity on submission.

Use that occurrence consistently for dates, price, guide, venue, airports and meaningful logistics overrides. Fall back to Event defaults per existing ownership rules. Never change stored relationships or source wording to reconcile editorial conflicts.

Render original Lexical sections without rewriting or guessed groups. Preserve old structured fields alongside mined sections when both exist. Make unmatched content/additionalInfo available in an expandable source section, removing only exact heading-and-body matches that the actual layout renders. Preserve partner/demo content and team-bullets fallbacks. Empty optional sections stay absent. Editors control custom layouts and content reconciliation.

## Alternatives Considered

- Replace shared component defaults: rejected because existing pages and custom layouts must retain their presentation.
- Copy reference HTML copy or infer missing sections: rejected; editors own new and corrected content.
- Cache booking availability with Event content: rejected because new orders would make the displayed availability stale.
- Rewrite all Event layouts in the database: unnecessary; a default runtime composition preserves editor layouts and avoids content writes.

## Consequences

- Variants are available to editors and previewable in both themes without demo database records.
- The reference's comparison content and missing editorial groupings remain deferred until source-backed content exists.
- Conflicting unmapped prose remains accessible for editorial review; commercial controls use the selected occurrence.
- The schema migration is additive. Rollback drops the new layout settings and maps featureLead galleries to grid while retaining their media and order.

## References

- docs/adr/0005-catalogue-event-location-date-ownership.md
- docs/adr/0009-source-preserving-trip-detail-sections.md
- docs/superpowers/plans/2026-09-10-single-trip-source-content-mining.md
- src/lib/trip-detail.ts
- src/lib/trip-layout.ts
