# ADR-0005: Catalogue Ownership

- Status: Accepted
- Date: 2026-09-02
- Owners: Engineering

## Context

The legacy Rockbusters catalogue stores most public trip copy on `event` and
`event_date`, while locations hold destination copy and `event_date_type`
behaves like a mixed source-tag table. The new Payload model needs a stable
shape before importing parent events and event dates.

Legacy event dates are purchasable occurrences, but some rows also carry
location-specific logistics copy such as accommodation, food, included, and
excluded text. This matters for broad parent events like road trips or recurring
courses where future date rows differ by destination, airport, or local
logistics. Legacy locations already carry transport and accommodation context,
and the new app now has a seeded `airports` collection.

## Decision

`events` are the main marketing content owner for trips. They own trip story,
hero media, itinerary pattern, audience, prerequisites, equipment, coaching,
partner/demo sections, SEO, and the public taxonomy relations.

`locations` own reusable destination logistics and destination browsing facts.
They keep editorial nearest-airport labels for traceability and also get a
relationship to the canonical `airports` collection for structured planning and
filtering.

`event-dates` stay lean purchasable occurrences. They own dates, price,
currency, VAT, capacity, active state, guides, airports, and location
relationships. They may carry structured logistics overrides for
accommodation, food, included, excluded, and a general note when a specific
date differs from the parent event or location defaults.

Legacy `event_date_type` is imported through a lookup/projection, not as a
one-to-one collection. Curated `categories`, `programs`, and `difficulties`
remain public navigation. Scoped event tag fields preserve source nuance such
as climbing styles, audience tags, format tags, and partner/demo tags.

Legacy IDs remain outside Payload schemas. Importers write lookup JSON files for
legacy-to-Payload joins.

## Alternatives Considered

- Store all logistics on `events` only. Rejected because future legacy dates
  demonstrably differ in accommodation, food, included, and excluded text.
- Store all logistics on `event-dates`. Rejected because it duplicates stable
  destination and trip copy across recurring dates.
- Replace curated taxonomy collections with a generic tag collection. Deferred:
  scoped fields match the current location taxonomy pattern and avoid unbounded
  public taxonomy drift.
- Change `locations.nearestAirports` from strings to relationships in place.
  Rejected for this migration pass because the string labels are useful
  traceability data and an in-place type change would make existing seed data
  harder to preserve.

## Consequences

- Event/date imports can keep event dates date-only while still preserving real
  date-specific logistics differences.
- Location pages can connect to canonical airports without losing mined
  nearest-airport labels.
- Legacy type import needs a curated lookup that projects source tags into
  categories, programs, difficulties, and scoped event tag fields.
- Public UI and query helpers may need follow-up work to surface the new fields
  after data import.

## References

- Workstreams task: `de204748-947e-40fd-ae6e-361e785f62b2`
- `src/collections/Events.ts`
- `src/collections/EventDates.ts`
- `src/collections/Locations.ts`
- `scripts/data-import/seed/legacy-airport-lookup.json`
