# JSON-LD Structured Data Research

Date: 2026-09-01

Scope: primary-source research for adding JSON-LD / schema.org structured data to the Rockbusters Next.js + Payload catalogue. This is a research note only; it does not propose schema or application-code changes.

## Local Context

- Rockbusters is a Next.js App Router app using Payload CMS; the public frontend routes live under `src/app/(frontend)`, the Payload config registers catalogue collections including `events`, `event-dates`, `programs`, `locations`, `guides`, `faqs`, and `reviews`, and the package versions currently resolve to Next `16.2.6` and Payload `3.84.1`. Sources: [AGENTS.md](../../../AGENTS.md), [src/payload.config.ts](../../../src/payload.config.ts), [package.json](../../../package.json).
- The authoritative domain terms are: internal `Event` is public "Trip"; `Event Date` is the purchasable scheduled occurrence; `Location` is a climbing venue; `Destination` is only a country/location browsing lens; and `Guide` is the team-member record. Source: [CONTEXT.md](../../../CONTEXT.md).
- The current `seoFields` group is a local Payload field with only `title`, `keywords`, and `description`; the official Payload SEO plugin is not installed in this checkout. Sources: [src/fields/seo.ts](../../../src/fields/seo.ts), [package.json](../../../package.json).

## Platform Support

- Next.js official guidance for App Router JSON-LD is to render structured data as a native `<script type="application/ld+json">` in `layout.js` or `page.js` components. Source: [Next.js JSON-LD guide](https://nextjs.org/docs/app/guides/json-ld).
- Next.js warns that `JSON.stringify` does not sanitize untrusted strings for script injection, and suggests scrubbing `<` or using a maintained serializer; it also says `next/script` is for executable JavaScript, while JSON-LD should use a native script tag. Source: [Next.js JSON-LD guide](https://nextjs.org/docs/app/guides/json-ld).
- Next.js points to Google Rich Results Test and Schema Markup Validator for validation, and mentions `schema-dts` as a TypeScript typing option. Source: [Next.js JSON-LD guide](https://nextjs.org/docs/app/guides/json-ld).
- Payload's official SEO plugin manages editor-facing metadata fields and can be extended with custom fields such as `json-ld`, but the frontend still renders metadata "however your application requires." Source: [Payload SEO plugin docs](https://payloadcms.com/docs/plugins/seo).
- Payload's plugin is useful for manually curated SEO metadata, but Rockbusters already has a local `seoFields` group and structured data for catalogue entities should usually be generated from canonical domain records rather than freeform editor JSON. Sources: [Payload SEO plugin docs](https://payloadcms.com/docs/plugins/seo), [src/fields/seo.ts](../../../src/fields/seo.ts), [src/lib/queries.ts](../../../src/lib/queries.ts).

## Google Rules

- Google says schema.org vocabulary is the base vocabulary, but Google Search Central documentation is definitive for Google Search behavior and rich-result eligibility. Source: [Google structured data introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data).
- Google supports JSON-LD, Microdata, and RDFa for structured data, and recommends JSON-LD when the site setup allows it. Source: [Google structured data introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data).
- Structured data must represent visible page content, be placed on the page it describes, use required properties for the specific rich-result type, and use the most specific applicable schema.org type. Source: [Google general structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).
- Crawlable, indexable image URLs matter when images are included in structured data. Source: [Google general structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).
- Google recommends using Rich Results Test for Google-specific features and Schema Markup Validator for generic schema.org validation. Source: [Google structured data testing tools](https://developers.google.com/search/docs/appearance/structured-data).

## Entity Guidance

### Event / EventDate

- Schema.org `Event` describes something happening at a time and location; ticketing information belongs in `offers`, and repeated events may be represented as separate `Event` objects. Source: [schema.org/Event](https://schema.org/Event).
- Google Event rich results require at least `location`, `name`, and `startDate`; Google also recommends event images, offers, price, availability, status, organizer, and other details where applicable. Source: [Google Event structured data](https://developers.google.com/search/docs/appearance/structured-data/event).
- Rockbusters `Event Date` is the best match for Google `Event`, because it has `dateFrom`, `dateTo`, `locations`, `guides`, `price`, `currency`, `capacity`, `remainingSeats`, and `active`; the undated `Event` page should not pretend to be a scheduled occurrence unless a specific date is represented. Sources: [CONTEXT.md](../../../CONTEXT.md), [src/collections/EventDates.ts](../../../src/collections/EventDates.ts), [Google Event structured data](https://developers.google.com/search/docs/appearance/structured-data/event).
- Multi-location Rockbusters dates need care: Google says if an event happens at multiple locations at the same time, create different events for each location; if it happens across several streets, define the starting or representative location and describe the details. Source: [Google Event structured data](https://developers.google.com/search/docs/appearance/structured-data/event).
- `remainingSeats` can map to schema.org `remainingAttendeeCapacity`, and `capacity` can map to `maximumAttendeeCapacity`, but those values are virtual/read-derived in Payload and must be rendered only when the page already exposes comparable availability information. Sources: [schema.org/Event](https://schema.org/Event), [src/collections/EventDates.ts](../../../src/collections/EventDates.ts), [Google general structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

### Trip / TouristTrip

- Schema.org `Trip` is an itinerary or journey, and `TouristTrip` is a more specific trip itinerary tied to tourist destinations or attractions. Sources: [schema.org/Trip](https://schema.org/Trip), [schema.org/TouristTrip](https://schema.org/TouristTrip).
- Rockbusters public Trip pages can model the catalogue-level trip concept as `TouristTrip` or `Trip` when the page presents itinerary, locations, audience, and learning/travel content without asserting a purchasable date. Sources: [CONTEXT.md](../../../CONTEXT.md), [src/collections/Events.ts](../../../src/collections/Events.ts), [schema.org/TouristTrip](https://schema.org/TouristTrip).
- Google does not list `Trip` or `TouristTrip` as a dedicated rich-result feature in its structured-data gallery, so this markup is for semantic understanding rather than a specific Google rich-result entitlement. Sources: [Google supported structured data gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery), [Google structured data introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data).

### Course

- Schema.org `Course` describes an educational course that may have distinct timed/location instances and aims to build learner knowledge, competence, or ability. Source: [schema.org/Course](https://schema.org/Course).
- Google Course list eligibility is narrower: use `Course` only for educational content with curriculum, educational outcomes, instructors, and students; Google requires valid `name` and `description`, recommends `provider`, requires at least three courses, and requires `ItemList` carousel markup on a summary or all-in-one page. Source: [Google Course structured data](https://developers.google.com/search/docs/appearance/structured-data/course).
- Rockbusters trips with explicit instruction and learning outcomes may qualify as `Course`, but generic trips, camps, or public events should stay as `Trip`/`TouristTrip` plus dated `Event` objects instead of being marked as courses solely for SEO. Sources: [src/collections/Events.ts](../../../src/collections/Events.ts), [Google Course structured data](https://developers.google.com/search/docs/appearance/structured-data/course).
- If using `Course`, dated runs could be represented as `CourseInstance`, which schema.org defines as an instance of a course offered at a different time, location, medium, or section. Source: [schema.org/CourseInstance](https://schema.org/CourseInstance).

### Product / Offer

- Schema.org `Product` includes offered products and services, and schema.org `Offer` covers selling tickets, services, rentals, and similar rights or services. Sources: [schema.org/Product](https://schema.org/Product), [schema.org/Offer](https://schema.org/Offer).
- Google Product snippets require `Product.name` plus at least one of `review`, `aggregateRating`, or `offers`; nested `Offer` requires `price` or `priceSpecification.price`, and Google recommends `availability` plus `priceCurrency`. Source: [Google Product snippet structured data](https://developers.google.com/search/docs/appearance/structured-data/product-snippet).
- Google Product rich results currently focus on pages for a single product or variants of one product, not category/listing pages; Rockbusters list pages should avoid product markup unless each item's detail page carries the single-product graph. Source: [Google Product snippet structured data](https://developers.google.com/search/docs/appearance/structured-data/product-snippet).
- For Rockbusters, `Offer` is a strong fit as a nested property on dated `Event` objects, while top-level `Product` may fit a trip/course detail page only if the page functions as one purchasable service/product and shows the same price/availability facts to users. Sources: [schema.org/Event](https://schema.org/Event), [schema.org/Offer](https://schema.org/Offer), [Google general structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), [src/collections/EventDates.ts](../../../src/collections/EventDates.ts).

### TouristDestination / Place

- Schema.org `Place` covers entities with a fixed physical extension, and `TouristDestination` can describe any tourist-relevant place or be used as `additionalType` on another `Place`. Sources: [schema.org/Place](https://schema.org/Place), [schema.org/TouristDestination](https://schema.org/TouristDestination).
- Rockbusters `Location` pages map naturally to `Place` with optional tourist-destination semantics because the collection has name, address, city, country, coordinates, image, content, and gallery fields. Sources: [CONTEXT.md](../../../CONTEXT.md), [src/collections/Locations.ts](../../../src/collections/Locations.ts), [schema.org/Place](https://schema.org/Place), [schema.org/TouristDestination](https://schema.org/TouristDestination).
- Because Rockbusters `Destination` is not a collection and is currently a browsing lens, country-level destination list pages should not mint stable `TouristDestination` entities unless the page has a real canonical place record or durable country-level content. Sources: [CONTEXT.md](../../../CONTEXT.md), [Google general structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

### Person / Guide

- Schema.org `Person` supports affiliation, email, job/occupation-style properties, image, sameAs, and works-for relationships. Source: [schema.org/Person](https://schema.org/Person).
- Google ProfilePage structured data applies when the page focuses on a single person or organization affiliated with the site; it requires `ProfilePage.mainEntity` as `Person` or `Organization`, and the entity requires `name` or `alternateName`. Source: [Google ProfilePage structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page).
- Rockbusters guide detail pages fit `ProfilePage` plus `Person` because each page is about one Guide and the collection has name, role, tagline, photo, content, achievements, stats, and active status; email and phone should stay out of public JSON-LD because the current page intentionally does not render them. Sources: [src/app/(frontend)/team/[slug]/page.tsx](../../../src/app/(frontend)/team/%5Bslug%5D/page.tsx), [src/collections/Guides.ts](../../../src/collections/Guides.ts), [Google general structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

### FAQPage

- Schema.org `FAQPage` is a web page presenting one or more frequently asked questions. Source: [schema.org/FAQPage](https://schema.org/FAQPage).
- Google removed FAQ rich-result documentation in June 2026 and says the FAQ rich result is no longer shown in Google Search; FAQPage markup may still be valid schema.org but should not be treated as a Google rich-result implementation. Source: [Google Search documentation updates](https://developers.google.com/search/updates).
- Rockbusters can generate FAQPage or Question/Answer markup only for FAQ content visibly rendered on a page, such as trip FAQ sections backed by active FAQ records. Sources: [src/collections/FAQs.ts](../../../src/collections/FAQs.ts), [src/app/(frontend)/trips/[slug]/page.tsx](../../../src/app/(frontend)/trips/%5Bslug%5D/page.tsx), [Google general structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

### BreadcrumbList

- Schema.org `BreadcrumbList` is an ordered chain of linked web pages and uses `position` to reconstruct order. Source: [schema.org/BreadcrumbList](https://schema.org/BreadcrumbList).
- Google requires `BreadcrumbList.itemListElement` with at least two `ListItem` values, and each `ListItem` needs `item`, `name`, and `position` for breadcrumb eligibility. Source: [Google Breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).
- Rockbusters already passes breadcrumb arrays to `MarketingShell` on destination detail pages, so breadcrumb JSON-LD can be generated from the same visible navigation model where pages expose breadcrumbs. Source: [src/app/(frontend)/destinations/[slug]/page.tsx](../../../src/app/(frontend)/destinations/%5Bslug%5D/page.tsx).

### Organization

- Schema.org `Organization` describes a school, club, corporation, NGO, or similar organization. Source: [schema.org/Organization](https://schema.org/Organization).
- Google Organization markup has no required properties, but recommends adding relevant administrative details such as name, url, logo, sameAs, contact, address, legalName, and identifiers; Google recommends placing it on the homepage or one page that describes the organization rather than every page. Source: [Google Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization).
- For Rockbusters, site-wide Organization JSON-LD should be a stable global object with a canonical `@id`, `name`, `url`, logo, contact/address details only if shown or supported by site content, and links from trip/event/person graphs via `organizer`, `provider`, `brand`, `worksFor`, or `affiliation` as appropriate. Sources: [Google Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization), [schema.org/Event](https://schema.org/Event), [schema.org/Course](https://schema.org/Course), [schema.org/Person](https://schema.org/Person).

## Implementation Implications

- Prefer generated JSON-LD builders over editor-authored raw JSON because the canonical facts already live in Payload collections and Google requires structured data to stay accurate and aligned with visible page content. Sources: [Google general structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), [src/collections/Events.ts](../../../src/collections/Events.ts), [src/collections/EventDates.ts](../../../src/collections/EventDates.ts), [src/lib/queries.ts](../../../src/lib/queries.ts).
- Use stable `@id` URLs for reusable graph nodes such as Organization, Trip/Event, Location, Guide, and BreadcrumbList; Google's general guidelines explicitly recommend connecting multiple page items with `@id` when they are related. Source: [Google general structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).
- Render JSON-LD server-side in App Router pages/layouts using native script tags and sanitize serialized output before injecting it. Source: [Next.js JSON-LD guide](https://nextjs.org/docs/app/guides/json-ld).
- Validate templates with Rich Results Test for Google features and Schema Markup Validator for schema.org-only graphs such as TouristTrip. Sources: [Next.js JSON-LD guide](https://nextjs.org/docs/app/guides/json-ld), [Google structured data testing tools](https://developers.google.com/search/docs/appearance/structured-data).

## Recommended First Pass

1. Add global `Organization` JSON-LD on the homepage or about/company page, not every page. Source: [Google Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization).
2. Add `BreadcrumbList` where visible breadcrumbs exist or are introduced. Source: [Google Breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).
3. Add trip detail graph as `TouristTrip` or `Trip` plus visible `FAQPage` where applicable, while treating FAQ as schema-only for Google. Sources: [schema.org/TouristTrip](https://schema.org/TouristTrip), [schema.org/FAQPage](https://schema.org/FAQPage), [Google Search documentation updates](https://developers.google.com/search/updates).
4. Add dated occurrence graph as Google-eligible `Event` only on pages that clearly expose a specific active `Event Date` with date, location, price/offer, and availability. Sources: [Google Event structured data](https://developers.google.com/search/docs/appearance/structured-data/event), [src/collections/EventDates.ts](../../../src/collections/EventDates.ts).
5. Add `ProfilePage`/`Person` on guide pages using only public profile facts. Sources: [Google ProfilePage structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page), [src/app/(frontend)/team/[slug]/page.tsx](../../../src/app/(frontend)/team/%5Bslug%5D/page.tsx).
6. Treat `Course` as conditional: use it only for clearly instructional trips and pair list/detail pages with Google's required `ItemList` course-list structure. Source: [Google Course structured data](https://developers.google.com/search/docs/appearance/structured-data/course).
