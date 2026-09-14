# ADR-0016: Trip Variants and dated query leaves

- Status: Accepted
- Date: 2026-09-14
- Owners: Engineering

## Context

Recurring departures repeat stable location-specific content on Event Dates.
Dates and prices change each season, while the trip presentation at a location
does not. The canonical seed contains 789 Event Dates, but the launch catalogue
is 64 active future dates under 10 published Events, forming 31 Event/context
groups. Twenty-five groups already have one authoritative rich editorial source.

Date-only query keys are not unique: ten launch groups contain one-week and
two-week departures with the same start date.

## Decision

Introduce Trip Variant between Event and Event Date. Trip Variant owns an
explicit stable slug, its location/context set, evergreen editorial content,
stable logistics, and search eligibility. Event Date remains the purchasable
unit and owns its date range, price, tax, currency, capacity, guides, airports,
and active state. Optional Event Date content remains as a final override for
exceptional departures.

Resolve public content in the order Event Date over Trip Variant over Event.
Adopt this additively: retain the existing Event and content fields on Event Date
until migrated data and callers have been verified.

The evergreen public identity is `/trips/{eventSlug}/{variantSlug}`. A dated
leaf selects exactly one occurrence with a stable start-to-end key, for example
`?date=2026-09-26-to-2026-10-03`. An indexable dated leaf is self-canonical and
may carry one matching Event JSON-LD item. The evergreen page remains
self-canonical and accumulates long-term search value.

For the first migration, create the 31 launch variants and attach the 64 future
dates. Promote the 25 authoritative editorial sources. Six variants without
rich content inherit Event and Location content and remain outside the sitemap.
Historical Event Dates remain archive data and are not normalized in this pass.

For reusable legacy fields, promotion is based only on the 64 assigned launch
dates. Compare values after removing nested generated IDs. Promote a field only
when its assigned dates contain one meaningful normalized value: 30 variants
promote `extraContent`, while one has none; 14 promote logistics, 11 have none,
and six contain conflicts. Conflicting logistics remain null on Trip Variant.
All original Event Date editorial, `extraContent`, and logistics values remain
in place as occurrence overrides and archive provenance.

## Alternatives Considered

- Keep Event Date as the public content owner: rejected because annual dates
  duplicate stable content and fragment search signals.
- Use Location directly: rejected because the same Event/location combination
  is the durable concept and touring variants can contain several or no Location
  relationships.
- Use `YYYY-MM-DD` alone: rejected because ten launch pairs share a start date.
- Normalize all historical dates immediately: deferred because it adds migration
  risk without affecting launch.

## Consequences

Payload gains a Trip Variant collection and Event Date relationship. Canonical
seed import order and relationship remapping must include variants. Routing,
metadata, JSON-LD, sitemap, and discovery callers move in a later implementation
step after the data structure is verified. ADR-0015's occurrence-path canonical
direction is superseded; its exact-selection and booking-safety rules remain.

## References

- [ADR-0015](0015-occurrence-slug-routing.md)
- [Data migration plan](../superpowers/plans/2026-09-14-trip-variant-data-migration.md)
