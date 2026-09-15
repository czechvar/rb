# ADR-0019: Index substantive content-only Event parents

- Status: Accepted
- Date: 2026-09-15
- Owners: Engineering

## Context

ADR-0015 sends published Events without active Trip Variants to a departure selector or noindex availability page. ADR-0017 creates stable Event hubs only when active Variants exist. The legacy migration also has Event records with substantial evergreen copy but no current dates or Variants. Their parent URLs should be able to represent the Event without inventing an offer or scheduled departure.

## Decision

A published Event with no active Trip Variants, no current or in-progress Event Dates, at least 100 words of Event rich text, and an explicit Event-level approval renders `/trips/{eventSlug}` as a content-only parent. It is self-canonical, indexable, and included in the sitemap. Render the Event's date-safe blocks, identify that no upcoming dates are listed, and provide an enquiry path. Structured data describes the Event without a dated offer. Draft Events stay unavailable and outside the sitemap. For this migration, only `big-wall-climbing-in-chamonix` is approved. Additional approvals require an editorial check of current offer claims and an explicit addition to the [shared eligibility list](../../src/lib/legacy-redirect-decisions.json).

Events with current Dates but no active Variants retain ADR-0015's selection and noindex fallback. Events with active Variants retain ADR-0017's hub eligibility rule. The numeric `?date={id}` compatibility redirect retains its exact Date behavior. Legacy redirects are configured separately after target review.

This supersedes ADR-0015's noindex fallback and ADR-0017's final no-Variant fallback only for substantive, published Events with no current Dates or active Variants.

## Alternatives Considered

- Publish every imported draft Event automatically: rejected because historical copy and offer details need editorial review.
- Index thin availability pages: rejected because they do not describe the Event well enough to stand alone.

## Consequences

- Editors can publish and approve reviewed legacy Event content without creating a placeholder Variant or Date.
- Route metadata and sitemap eligibility must use the same content and current-Date rules.
- The imported draft Events still require review and publication before their old URLs can redirect to indexable parents.

## References

- [ADR-0015](0015-occurrence-slug-routing.md)
- [ADR-0017](0017-event-parent-trip-hubs.md)
- [Legacy URL delivery task](https://app.workstreams.ai/teams/S_ZYh417Os/board/AceE0P/tasks/8d966e2a-b385-4691-a8e7-4fa73fe4e7ba)
