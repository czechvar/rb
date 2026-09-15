# ADR-0017: Render Event parent pages as Trip hubs

- Status: Accepted
- Date: 2026-09-15
- Owners: Engineering

## Context

ADR-0015 made `/trips/{eventSlug}` a noindex departure selector because Event-level content was not then ready for an evergreen parent. Published Events now have reusable rich text, structured sections, media, and active Trip Variants. Legacy `/event/*` pages with several locations need a stable destination that represents the Event rather than one changing departure.

## Decision

For a published Event with active Trip Variants, render `/trips/{eventSlug}` as a stable parent Trip hub. Use Event-level content through the registered trip block renderer, show the active Variant choices, and list their upcoming/in-progress Event Dates by month. Filter date-specific blocks from default and authored Event layouts so the hub owns one schedule. The parent does not select one Date for its content or URL. The parent is self-canonical. It enters the sitemap and may be indexed when the Event has readable rich content and at least two active, reviewed/indexable Variants. A parent with one or only thin Variants remains reachable but noindex and outside the sitemap unless its Event hub is explicitly approved for indexing.

For the Tier 1 legacy Event redirect programme, Bouldering Albarracin and Climbing Technique Mental Coaching are explicitly approved as Event-level parent hubs despite thin Variant pages. Their parents may be indexed when Event copy is readable and an active Variant exists. Their individual Variant pages retain separate editorial/indexability settings. This approval is scoped by Event slug in the shared parent metadata and sitemap eligibility helper.

The Tier 1 future dated URLs under Albarracin, Kyparissi and Rodellar also have exact active Event Dates. After reviewing their inherited or Variant copy, approve those three Variant pages for indexing in the canonical launch migration and local catalogue. This makes their seven dated leaves eligible without changing Date ownership, pricing or booking identity.

Keep the exact Variant and dated-query routes as the location and scheduled-selection identities. Keep the numeric `?date={id}` compatibility redirect on the parent. Published Events without active Variants retain ADR-0015's availability/selection fallback. Draft Events remain unavailable publicly and outside the sitemap. Legacy old-to-new redirects are reviewed and installed separately.

This supersedes ADR-0015's parent redirect/noindex rule only for Events with active Variants. Its exact Date identity and booking rules remain accepted.

## Alternatives Considered

- Permanently redirect every old Event page to one current Variant: rejected for Events with several distinct locations.
- Keep selecting the next departure on all parents: rejected for multi-location Events because the destination changes with availability.
- Index every rendered parent: rejected while single-Variant and thin Variant parents may duplicate or lack reviewed content.

## Consequences

- Multi-location Events can have stable indexable hubs without a schema or seed migration.
- Event copy and Variant presentations still need editorial review before old Event URLs are redirected to the hub.
- Parent metadata, JSON-LD, sitemap, cache tags, and browser checks must agree on hub eligibility.

## References

- [ADR-0015](0015-occurrence-slug-routing.md)
- [ADR-0016](0016-trip-variants-and-dated-query-leaves.md)
- [Legacy URL delivery task](https://app.workstreams.ai/teams/S_ZYh417Os/board/AceE0P/tasks/8d966e2a-b385-4691-a8e7-4fa73fe4e7ba)
