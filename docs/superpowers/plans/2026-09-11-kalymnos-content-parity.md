# Kalymnos: content parity before design work

Task: https://app.workstreams.ai/teams/S_ZYh417Os/board/AceE0P/tasks/a0cca40c-12bf-4d82-a969-a0d4b776bd2b

The user explicitly authorized taking the Kalymnos design's text, excluding imagery, and adapting this one Event before any further design changes. This supersedes the previous source-only restriction for this local editorial comparison only. ADR-0009's exact-copy migration and other Events remain outside this operation.

## Scope and data classification

- Local comparison/demo content on existing Event 8, slug `sport-climbing`; preview occurrence 745 (26 September–10 October 2026).
- Reference: `rockbusters_sportclimbing_kalymnos.html` from the supplied local website design download. Extracted text is saved in `.scratch/kalymnos-content-parity/reference.json`.
- No frontend, styling, layout configuration, schema, imagery or canonical seed changes. No deployment or tracker message.
- Existing Event Dates, prices, capacity, guide/location/media records and relationships are preserved. Reference participant range adapted from 5–15 to 5–8 to respect this occurrence's stored capacity. Commercial wording copied from the design remains comparison copy, not independently verified policy.
- Three reference testimonials are explicitly labelled `[Design preview]`; they are not verified customer reviews.
- Six FAQs and three preview reviews belong only to Event 8. Their generated IDs are recorded in the before/after snapshots. Event array row IDs use `parity8-`.

## Content mapping

| Reference content | Existing content destination |
| --- | --- |
| Title and hero summary | Event title and short description |
| Overview | tripDetail overview section |
| Three audience cards | audienceCards |
| Three learning pillars, five bullets each | whatYouLearn boxes 1–3 |
| Typical day, six timed entries | tripDetail itinerary section; existing rich-text timeline presentation |
| One/two-week comparison, six rows | comparison group and rows |
| Accommodation and travel | Event accommodation and transport descriptions |
| Four package inclusions and exclusions | accommodation included/notIncluded |
| Gear and group-size copy | tripDetail equipment and notes sections |
| Two coach biographies and roles | Event-local coachTeamBullets beneath existing guide cards |
| Six questions and answers | Event-linked FAQs |
| Three testimonial quotes | Event-linked design-preview reviews |
| Gallery caption, venue prose/facts, closing copy, travelling-course introduction, six overview fact tiles and reference headings | Existing additionalInfo supplementary area |

The last row deliberately exposes missing content bindings without changing the design. Exact reference headings for audience/learning/logistics and the CTA, gallery text, venue overrides, overview fact subtitles, and individual coach biographies cannot all be placed in their reference positions using the current default Event template. Copy is retained for comparison; placement parity is not claimed. Existing date rows and occurrence-derived commercial facts remain authoritative.

Old Event content and additionalInfo are backed up and replaced for this comparison, so old supplementary prose does not compete with the reference copy. Shared Guide and Location copy is untouched.

## Reversibility and verification

Local artifacts: `.scratch/kalymnos-content-parity/` contains the source extraction, `apply.mjs`, `verify.mjs`, before/after database snapshots, browser verification and screenshot.

The apply operation uses a production/local-host guard and a transaction. It confirms other Events, all Event Dates, Event relationships, Guides, Locations and Media are unchanged before commit. A second check verifies the complete changed-record snapshot matches the committed receipt.

Read-back: `node .scratch/kalymnos-content-parity/apply.mjs check`

Cleanup: `node .scratch/kalymnos-content-parity/apply.mjs rollback`

Rollback requires the current scoped records to match the after snapshot, then restores the original Event fields and affected child/FAQ/review rows. It refuses to overwrite subsequent editor changes. Snapshot files remain as evidence. This content is not promoted to persistent seed data.

Preview: http://localhost:4444/trips/sport-climbing?date=745

Browser verification at 1440px: HTTP 200, all 74 checked reference passages present in page DOM (FAQ answers may be collapsed), no horizontal overflow. This is content-presence verification, not design acceptance. The screenshot and exact passage audit are local artifacts in the directory above.

## Subsequent user-directed hero and summary corrections

The user then requested the hero text lower and reference-identical content in the red strip and right pricing summary. Desktop hero top padding is now 240px. The metadata remains one line above the two columns; the hashtag remains below the lead.

Added seven optional CMS fields on tripDetail for the authored location descriptor, grade range, lead requirement, minimum participants, price caption, travel note and hashtag. Migration `20260911_120000_trip_summary_content` was applied and recorded on the guarded local database only; types regenerated. Populated only Event 8, as local comparison content. ADR-0009 records the ownership boundary. Canonical seed and remote/test databases were not updated.

The red strip now has five entries: Kalymnos / Greek Limestone; 26 Sep–10 Oct / 14 Days; 5+–7c / Grade; 3 / Min. Participants; €1,890 / Price (2 Weeks). The right summary has the two-week price, the matching one-week alternative, coaching caption, dates/duration/location/level/coaches rows and Kos travel note. Dates, prices, venue and coaches remain derived from the selected occurrence. Minimum participants is not substituted for booking capacity. Sold-out behavior is preserved.

Local before/after receipts were extended for the new fields; prior receipts remain in `*-before-summary.json`. The existing rollback command clears the new authored values when restoring original Event content; it leaves the additive schema in place.

Verification: 10 pure hero/summary/booking tests; TypeScript, scoped lint and theme CSS pass. Browser HTTP 200 at 2048, 1440 and 390px; exact visible strip and pricing text recorded in `summary-verification.json`, with screenshots. Title top at desktop is 283px; no horizontal overflow. No deployment or Workstreams write.
