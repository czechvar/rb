# Location Taxonomy Design

Date: 2026-09-01
Status: Accepted for schema design

## Purpose

Normalize the first legacy location extraction into a small, maintainable set of
values for Payload `locations`.

The taxonomy should support browsing, filtering, card badges, comparison, and
future imports. It should not preserve every extracted phrase as an enum. Long
legacy evidence remains structured text attached to the location.

## Scope

This taxonomy applies to `Location` records rendered publicly under
`/destinations/{slug}`.

It does not create a separate `Destination` collection. "Destination" remains a
customer-facing route and navigation word for Location-led browsing.

## Modeling Rule

Use controlled values only when the value is useful across multiple locations or
as a predictable filter.

Store canonical taxonomy IDs on records. Translate labels per locale in UI/admin
code. Do not store localized labels in imported destination data.

Keep the following as text fields, not taxonomy:

- grade prose such as "from 7b to 8c" or "all difficulties"
- season nuance such as "cold sunny winter days" or "tufas take time to dry"
- transport instructions such as "2 hours from Valencia, hire a car"
- accommodation notes such as "book early in high season"
- safety, access, ethics, gear, local tips, and rest-day advice

## Controlled Fields

### `locationKind`

One optional primary value. This is for cards and high-level grouping, not
geology. Leave it blank when source data is too thin.

- `sport-climbing-area`
- `bouldering-area`
- `multi-pitch-area`
- `mixed-climbing-area`
- `alpine-climbing-area`
- `online`

### `climbingStyles`

Multi-select. This is the main user-facing climbing filter.

- `sport`
- `bouldering`
- `multi-pitch`
- `trad`
- `deep-water-soloing`

Rejected as separate style values for now:

- `bolted`: maps to `sport`
- `lead-climbing`: maps to `sport`
- `single-pitch-climbing`: maps to `sport`
- `multipitch`: maps to `multi-pitch`
- `big-wall`: maps to `multi-pitch`
- `traditional-protection`: maps to `trad`
- `top-roping`: too thin in source data; keep as text if needed

### `rockTypes`

Multi-select. This is geology only.

- `limestone`
- `sandstone`
- `granite`
- `conglomerate`
- `gneiss`
- `dolomite`

Rejected as a rock type:

- `tufa`: use `rockFeatures: tufas`

### `rockFeatures`

Multi-select. Useful for climber-facing flavor without polluting geology.

- `tufas`
- `caves`
- `overhangs`
- `slabs`
- `pockets`
- `crimps`
- `cracks`
- `roofs`

### `settingTags`

Multi-select. This describes the environment and helps editorial grouping.

- `coastal`
- `island`
- `gorge-canyon`
- `forest`
- `mountain`
- `valley`

Rejected as separate setting values for now:

- `beach`: maps to `coastal`
- `cliff`, `crag`, `walls`, `climbing destination`, `climbing area`: too generic
- `canyon` and `gorge`: both map to `gorge-canyon`

### `bestSeasons` and `avoidSeasons`

Multi-select seasonal tags.

- `spring`
- `summer`
- `autumn`
- `winter`
- `year-round`

Season tags must be backed by source evidence, but the evidence should remain in
`seasonSummary` or similar text. A tag says "consider this season", not "perfect
all season in every sector".

### `accommodationTags`

Multi-select. This should stay practical and broad.

- `campsite`
- `hotel`
- `guesthouse-b-and-b`
- `apartment`
- `hostel`
- `refuge-hut`
- `villa`
- `rural-cottage`
- `luxury`

### `transportTags`

Multi-select. This is for planning signals, not detailed directions.

- `car-recommended`
- `public-transport-possible`
- `flight-access`
- `ferry-access`
- `walkable-local-access`

### `nearestAirports`

For now, use normalized airport city labels rather than a controlled enum:

- `Alicante`
- `Antalya`
- `Athens`
- `Avignon`
- `Barcelona`
- `Genoa`
- `Girona`
- `Innsbruck`
- `Kos`
- `Lyon`
- `Madrid`
- `Malaga`
- `Munich`
- `Nimes`
- `Salzburg`
- `Valencia`
- `Zaragoza`

If airports become a booking or search facet, promote them to relationship data
with IATA codes.

## Generated Artifacts

Run:

```bash
node scripts/data-import/legacy/normalize-destination-taxonomy.mjs
```

Default input:

```text
.scratch/legacy-destination-work/native-output
```

Default output:

```text
.scratch/legacy-destination-work/normalized-taxonomy
```

The output contains:

- `location-taxonomy.json`: full normalized per-location facts plus raw facts
- `location-taxonomy.csv`: spreadsheet-friendly per-location assignments
- `location-taxonomy-usage.json`: value usage by field
- `README.md`: human-readable usage rollup

## Open Review Points

### Accepted Product Decisions

These decisions affect the Payload schema and public UI.

1. Keep `locationKind`.

   Accepted: keep it optional/editor-selected. It gives cards a clean primary
   label like "Sport climbing area" or "Bouldering area". Do not infer it
   automatically forever, because broad destinations can contain several styles.

2. Add a `destinationScope` field.

   Accepted: add a separate optional field for scale:
   - `crag`
   - `area`
   - `region`
   - `country`
   - `indoor`
   - `unknown`

   This lets us keep broad records like `andalucia`, `balkan`, `norway`,
   `dolomites`, `slovenia`, and `sardinia` without pretending they are the same
   kind of thing as `oliana` or `labske-udoli`.

   Import rule: `indoor` should normally be excluded from public outdoor
   destination pages unless we intentionally create an indoor/gym surface.

3. Keep `rockFeatures` public.

   Accepted: store it and allow public use now.

4. Keep `settingTags`.

   Accepted: store it and allow use for public UI and editorial grouping.

5. Use the proposed season semantics.

   Accepted: `bestSeasons` means "normally worth considering"; `avoidSeasons`
   means "known caution". A destination can have the same season in both only if
   different sectors/styles behave differently.

6. Keep `nearestAirports` as strings for now.

   Accepted: keep simple normalized strings for the first import. Promote to the
   existing `airports` collection only when booking/search needs IATA codes or
   airport-specific filtering.

7. Add admin review/completeness status.

   Accepted: partial records can go live. Keep `contentCompleteness` or
   `reviewStatus` visible in admin so editors know which records need manual
   enrichment later.

8. Use canonical taxonomy IDs with locale labels on top.

   Accepted: stored values are stable IDs such as `sport`, `multi-pitch`,
   `limestone`, `coastal`, and `spring`. Locale-specific display labels are
   applied above the data layer in admin/frontend code.

### Already Curated

The curated candidate set excludes clearly non-fitting records:

- `online`: course/content record, not a destination.
- `monobloc-reus-spain`: indoor bouldering gym, not an outdoor destination page.
- `istria`: duplicate/bad legacy row titled "Chroatia"; keep `istria-1` as the
  canonical Istria record.

`kyparissi` is kept. The legacy placeholder title was removed from the curated
candidate data, because Kyparissi itself is a real climbing destination.

## Next Payload Schema Fields

Add these fields to `locations` for the first seed/import pass:

- `locationKind`: optional select
- `destinationScope`: optional select
- `climbingStyles`: multi-select
- `rockTypes`: multi-select
- `rockFeatures`: multi-select
- `settingTags`: multi-select
- `bestSeasons`: multi-select
- `avoidSeasons`: multi-select
- `accommodationTags`: multi-select
- `transportTags`: multi-select
- `nearestAirports`: array of strings
- `gradeRange`: text
- `routeCount`: number
- `problemCount`: number
- `sectorCount`: number
- `seasonSummary`: textarea/rich text
- `transportSummary`: textarea/rich text
- `accommodationSummary`: textarea/rich text
- `contentCompleteness` or `reviewStatus`: select
- `sourceReferences`: array of source metadata

The first seed/import should consume:

```text
.scratch/legacy-destination-work/curated-output/
```

Do not consume raw normalized output directly, because it still includes
pre-curation records.
