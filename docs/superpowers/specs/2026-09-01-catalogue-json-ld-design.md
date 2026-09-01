# Catalogue JSON-LD Structured Data (Design Spec)

Status: ready-for-agent
Date: 2026-09-01
Workstreams task: `6dfba7c1-b7f5-4604-94e4-f84b22739fa3`

## Problem Statement

Rockbusters catalogue pages contain structured trip, date, location, program,
guide, FAQ, review, price, and media data in Payload, but public pages do not
publish machine-readable schema.org JSON-LD. Search engines and assistants can
therefore infer page meaning only from rendered HTML.

## Research Summary

Payload does not need a schema change for this slice. The official Payload SEO
plugin can add editable metadata fields and can be extended with custom fields
such as `json-ld`, but the frontend still renders metadata however the
application requires. Payload also has a raw JSON field if editor-owned JSON is
ever needed. For this catalogue work, JSON-LD should be generated from trusted
typed records in the Next.js frontend instead of asking editors to maintain raw
schema blobs.

Next.js App Router supports JSON-LD by rendering a
`<script type="application/ld+json">` in page or layout components. Its guide
also calls out sanitizing serialized JSON before injecting it into HTML.

Primary references:

- Payload SEO plugin docs: https://payloadcms.com/docs/plugins/seo
- Payload JSON field docs: https://payloadcms.com/docs/fields/json
- Next.js JSON-LD guide: https://nextjs.org/docs/app/guides/json-ld
- Local primary-source research note:
  `docs/research/2026-09-01-jsonld-research.md`
- Google structured data intro: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Google Event structured data: https://developers.google.com/search/docs/appearance/structured-data/event
- Google Product snippet structured data: https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- Google Breadcrumb structured data: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- Schema.org TouristTrip: https://schema.org/TouristTrip
- Schema.org TouristDestination: https://schema.org/TouristDestination

## Solution

Generate a page-level JSON-LD graph in TypeScript from Payload Local API data and
render it on canonical public catalogue detail routes.

No Payload collection fields, migrations, or generated types are required. The
source of truth stays the existing catalogue records. The frontend builder omits
unknown or empty values instead of inventing data.

## Catalogue Entity Structures

### Trip detail: `/trips/[slug]`

Primary entity: `TouristTrip`, with commercial `Product` semantics only for
facts visible on the page.

Graph nodes:

- `Organization` for Rockbusters.
- `WebPage` for the current URL, `mainEntity` pointing at the trip.
- `BreadcrumbList`: Home -> Trips -> current trip.
- `TouristTrip`: title, slug URL, short/SEO description, image/gallery,
  itinerary highlights where available, locations as `Place` /
  `TouristDestination`, guides as `Person`, related programs where embedded.
- Deferred: `FAQPage` for active event FAQs. This must be added only where the
  same FAQ content is visibly rendered for both fallback and block-driven
  layouts.

### Trip dates: `/trips/[slug]/dates`

Primary entities: dated `Event` nodes, one per active Event Date shown on the
page.

Graph nodes:

- `Organization`, `WebPage`, and `BreadcrumbList`.
- Parent `TouristTrip` / `Product` node linked from each dated occurrence.
- `Event` per active Event Date with `startDate`, `endDate`, locations,
  guides/performers, and `offers`.

Offer mapping:

- `price` <- `event-dates.price`
- `priceCurrency` <- `event-dates.currency`
- `availability` <- `InStock` when `remainingSeats > 0` or capacity is unknown,
  otherwise `SoldOut`
- `url` <- the visible `/book/[eventDateId]` button target
- `validFrom` omitted until there is an explicit sale-open field

### Program detail: `/programs/[slug]`

Primary entity: `Course`, with `hasCourseInstance` avoided until the page has
date-specific program instances. The page can also link its concrete Events.

Graph nodes:

- `Organization`, `WebPage`, and `BreadcrumbList`.
- `Course`: name, description, image/gallery, provider, teaches/results,
  audience/curriculum fields where available.
- `ItemList` of related Trip/Event pages from `getPublishedEventsForProgram`.
- Deferred: `FAQPage` and review nodes. They must only be emitted by routes or
  blocks that visibly render the same FAQ/review content.

### Location detail: `/destinations/[slug]`

Primary entity: `Place` plus `additionalType` `TouristDestination`.

Graph nodes:

- `Organization`, `WebPage`, and `BreadcrumbList`.
- `Place`: name, URL, address/city/country, coordinates as `GeoCoordinates`,
  image/gallery, description.
- `ItemList` of Trips in that Location.

Note: per `CONTEXT.md`, Destination is route/UI language over a Location record;
do not create a Destination entity boundary.

### Guide detail: `/team/[slug]`

Primary entity: `Person`.

Graph nodes:

- `Organization`, `WebPage`, and `BreadcrumbList`.
- `Person`: name, URL, role/jobTitle, image, description, affiliation, knowsAbout
  from tags, and subjectOf/worked-on trip list where available.

Do not expose guide email or phone in JSON-LD. The route intentionally avoids
rendering public contacts.

## Implementation Notes

- Add a reusable `JsonLd` server component that escapes serialized JSON for safe
  script injection.
- Add `src/lib/jsonld.ts` with typed builders for trip, program, location, and
  guide page graphs.
- Reuse `siteUrl()` for canonical absolute URLs and `mediaUrl()` for media.
- Prefer `seo.description`, then `shortDescription` / `tagline`, then extracted
  plain text from rich text when needed.
- Render JSON-LD in detail routes before the block-layout/fallback branch so
  structured data exists for both layouts.
- Fetch active Event Dates with enough depth for trip date location/guide
  overrides before building dated `Event` and `Offer` nodes on the dates page.
- Omit `FAQPage` unless the same active FAQs are visible in the rendered page.
  Google rich result support for FAQ display changes over time, but the schema
  remains useful for page meaning when content parity is guaranteed.

## Testing Decisions

- Unit-style Vitest coverage for JSON-LD builders using plain object fixtures.
- Route smoke coverage may assert `application/ld+json` presence where existing
  e2e fixtures make that cheap.
- Run targeted Vitest for the new builder tests, then lint/build if time allows.

## Verification Checklist

- [ ] Worktree created outside the dirty main checkout.
- [ ] Research note/spec committed.
- [ ] JSON-LD builders tested.
- [ ] Trip, Program, Location, and Guide detail routes render JSON-LD.
- [ ] Workstreams task updated with plan, implementation notes, and QA result.
- [ ] Code review completed.
