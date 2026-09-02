# Snowbusters Seed

Source snapshot:

- Snowbusters API data captured under `../sb-github/data/snowbusters-api/raw/`
- Static program taxonomy from `../snowbusters-static-html/static/CATEGORIES/`

This directory contains seed data only. It does not import anything into Payload.

## Decisions

- Programs come from the static Snowbusters category/design pages, not from API `types[]`.
- API `types[]` are preserved in `discipline-types.json` as equipment/discipline facets only (`Ski`, `Snowboard`).
- v1 is text-only. Media references are retained for a later media import, but should not be uploaded by the first importer.
- Airports are skipped in v1 because Snowbusters source data lacks vetted IATA codes.
- `event-dates.price` should use gross `price_with_vat`.
- Invalid date rows are quarantined and should not be imported.

## Files

- `manifest.json`: generation metadata, decisions, and counts.
- `categories.json`: API course categories.
- `difficulties.json`: API difficulty taxonomy.
- `discipline-types.json`: API `Ski` / `Snowboard` values, not programs.
- `programs.json`: static category/design taxonomy.
- `locations.json`: Snowbusters locations.
- `guides.json`: Snowbusters guides.
- `partners.json`: Snowbusters partners.
- `events.json`: valid Snowbusters courses mapped as event seed rows.
- `event-dates.json`: one scheduled occurrence per valid course.
- `quarantine.json`: source rows excluded from v1 import.

Current seed count: 42 source courses, 41 event rows, 41 event-date rows, 1 quarantined invalid-date course.
