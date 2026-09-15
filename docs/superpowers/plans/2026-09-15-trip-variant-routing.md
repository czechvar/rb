# Trip Variant frontend routing

Status: implemented
Date: 2026-09-15
Decision: [ADR-0016](../../adr/0016-trip-variants-and-dated-query-leaves.md)

## Behavior

- `/trips/{eventSlug}/{variantSlug}` renders the evergreen Trip Variant and is
  self-canonical when the variant has substantive reviewed content.
- `?date=YYYY-MM-DD-to-YYYY-MM-DD` selects exactly one active Event Date under
  that variant. An unknown, malformed, repeated, or wrong-variant key returns 404.
- The dated page is self-canonical and exposes exactly one matching Event in
  JSON-LD. The shared TouristTrip/Product identity stays on the evergreen URL.
- An indexable variant and indexable date enter the sitemap. The six inherited
  thin variants remain noindex and outside the sitemap.
- Migrated occurrence-slug URLs redirect permanently to their dated variant
  leaves. Event parent URLs stay noindex and redirect temporarily to an
  autoselected bookable dated leaf.
- Historical Event Dates without a Trip Variant remain available through their
  direct legacy route as noindex archive content, outside the sitemap.

## Delivery checks

- [x] Resolve Event, Trip Variant, and active dates with exact parent/variant identity.
- [x] Merge content Event Date over Trip Variant over Event without changing booking identity.
- [x] Update parent selectors, trip cards, calendar, homepage, and date lists.
- [x] Update canonical metadata, JSON-LD, and sitemap.
- [x] Browser-verify Mallorca evergreen and one/two-week dated leaves on port 4444.
- [x] Verify old Mallorca occurrence URL redirects, bad key returns 404, and thin
      Albarracin stays noindex.
- [x] Run unit, editorial, focused JSON-LD/sitemap, TypeScript, and scoped lint checks.
