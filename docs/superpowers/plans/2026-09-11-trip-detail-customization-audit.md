# Trip detail designs: customization inventory and Kalymnos-first plan

Date: 2026-09-11
Status: analysis complete; implementation plan proposed, no bulk enrichment authorized
Task: https://app.workstreams.ai/teams/S_ZYh417Os/board/AceE0P/tasks/a0cca40c-12bf-4d82-a969-a0d4b776bd2b

## Findings that determine the plan

The 26 HTML designs share 12 top-level section elements plus a facts strip. Counting independently configurable subregions gives 18 content units. This is a reusable shared page composition, but the visible text and some inner structures vary substantially. A full custom layout must not be required just to edit an eyebrow, heading or introduction.

The designs do not represent 26 distinct Events. Primary booking-link evidence maps them to 9 existing Event records and their dated occurrences. Three additional curated Events have matching design branding but conflicting occurrence evidence. Six destination/season designs map to Event 8; nine Rock & Road pages map to Event 9; five Project España pages map to Event 17. Therefore Event-level heading fields alone are insufficient for destination-specific copy.

Kalymnos should remain the only enrichment pilot. First define independent section-copy overrides and occurrence scoping; then make its reference content appear in the correct sections; only then broaden the work. Text parked in “More about this trip” is captured source, not content parity in its intended section.

## Evidence and boundaries

- Recursively inspected all 26 `.html` files in [the requested design directory](</home/czechspekk/Downloads/NEW ROCKBUSTERS WEBSITE - HTML /TRIP-COURSE/TRIPS-COURSES>): 12 root files, 5 Project España files and 9 Rock & Road files. No sibling templates included.
- Parsed actual HTML headings, eyebrows, labels, nested content and primary booking links; CSS, scripts and embedded image data were excluded from the text inventory. Existing image assets were not changed.
- Read-only transaction against the guarded local catalogue: 65 Events and 789 Event Dates. No production/live-site verification is claimed.
- Primary booking references were resolved through `scripts/data-import/seed/legacy-event-dates.json` and matched by current Event slug plus exact start/end dates. Historical numeric Payload lookup files were not trusted: their IDs differ from this database.
- Full evidence: `.scratch/trip-design-inventory/designs.json`, `normalized.json`, `catalogue.json`, `matches.json`, parser scripts and the customization audit. These are research artifacts, not seed or demo records. No catalogue, code, migration, layout, image or Workstreams changes in this analysis.
- [All section headings and labels](2026-09-11-trip-detail-customization-headings.csv): 468 section rows, including absent units.
- [All catalogue mappings](2026-09-11-trip-detail-customization-catalogue.csv): 26 rows, source booking IDs, current IDs, dates and caveats.
- [Current implementation customization audit](2026-09-11-trip-detail-customization-implementation-audit.md): field/renderer evidence and file locations.

## 1. Complete section inventory and heading variations

Order below follows the designs. “Distinct headings” counts normalized text, not CSS capitalization or accent styling. Absence is not an additional variation.

| Content unit | Present | Distinct headings | What varies / control required |
| --- | ---: | ---: | --- |
| Hero | 26/26 | 26 | 26 titles; subtitle, hashtag, metadata and CTA labels/targets. Explicit accent phrase/line break instead of colon inference. |
| Hero pricing summary | 26/26 | — | No section heading. Four row-label sequences (Coach/Coaches; Location/Destinations), price captions and travel callouts. Live facts remain bound. |
| Facts strip | 26/26 | — | No section heading. All 26 label sequences differ: destination descriptor, duration, grade/style/route metric, participation, price/route stage. |
| Overview | 26/26 | 26 | Heading and prose vary; five eyebrow values. |
| Overview fact tiles | 26/26 | — | No section heading. Fourteen label sequences; values and explanatory subtitles vary. |
| Other dates / route schedule / related notice | 24/26 | 10 | 24 blocks: 23 dated schedules and one Dolomites single-pitch notice. Absent for Zillertal and Deep Blue. Ten headings, four eyebrows; row content and actions vary. |
| Gallery | 26/26 | 26 | 26 headings AND 26 eyebrows; introduction, emphasized phrase and intentional line break vary. |
| Audience | 26/26 | 26 | 26 headings; same eyebrow; three persona card headings and bodies vary. |
| Learning pillars | 26/26 | 22 | 22 headings; same eyebrow. Technique / Mental Game / Tactics labels are stable in all 26, but bullets and heading emphasis vary. |
| Programme / daily flow | 26/26 | 4 | A Typical Day (22), How the Two Weeks Flow (2), How the Week Flows (1), The 6-Day Arc (1). Timetable vs multi-day/stage content. |
| Programme companion panel | 26/26 | 8 | Eight companion headings. 23 comparison tables, two venue tables, one related-options panel. Not universally a “format comparison”. |
| Venue / route area | 26/26 | 22 | 22 headings; single venue or multi-stop region/route, fact labels and copy vary. |
| Coaches / guides | 26/26 | 2 | World-Class Coaches / World-Class Coaching; two eyebrow values, variable coaches and roles/bios. |
| Reviews | 26/26 | 1 | What Past Climbers Say is stable; quotes, authors and outcome badges differ. Design testimonials are not verified reviews. |
| Practical logistics | 26/26 | 1 | We Sorted the Boring Bits is stable. Four nested cards; Deep Blue replaces Gear and Group Size with The Deep Blue Kit and Sport Climbing Backup. |
| Inclusions / package | 26/26 | 1 | Full Package is stable. Included items, excluded text and food notes vary. |
| FAQ | 26/26 | 1 | Common Questions is stable. Questions and answers vary. |
| Closing booking CTA | 26/26 | 26 | 26 headings; stable Reserve Your Place eyebrow; body, CTA copy, secondary price badges and support text vary. |

Header navigation and footer are shared site chrome, outside trip-specific content controls. The current implementation additionally exposes highlights, prerequisites, standalone equipment, notes, remaining legacy copy and optional partner/demo sections. These are not separate top-level sections in these 26 designs; preserve existing content while deciding whether it belongs within another section. Do not delete them simply because the reference has no separate heading.

## 2. Heading patterns and structural exceptions

The highest-priority editable headings are hero, overview, gallery, audience, learning, programme, companion panel, venue, team and closing CTA. Reviews, logistics, inclusions and FAQ have stable top-level headings in this archive, but should still have optional copy overrides so editors do not need a layout fork. Stable wording can remain the shared default.

Examples:

| Unit | Kalymnos | Other designs |
| --- | --- | --- |
| Overview | Where Tufas Teach Patience | Where Metal Protection Isn’t Allowed; No Ego, Just Climb; Four Weeks. Four Crags. One Country Done Properly. |
| Gallery | Tufas, Pockets & Pure Grit | Towers, Textile & a Century of Ethics; Cliffs, Chalk & Cannonballs; Pockets, Pesto & The Mediterranean |
| Audience | Built for the Gym-to-Crag Gap | Built for the Trad-Curious; Built for the Rope-Optional; Built for the All-In Climber |
| Learning | Three Skills Worth the Trip | Three Skills You Won’t Learn Elsewhere; Three Skills Across Eight Rock Types |
| Programme | A Typical Day | The 6-Day Arc; How the Week Flows; How the Two Weeks Flow |
| Companion | Which Format? | Standard Course vs A MUERTE; Before vs After This Course; Mixed Course vs Beta Babes; Sport Climbing vs Czech Trad; 1 Week vs PROJECT X; Where You’ll Climb; More Ways to Go Deep |
| Team | World-Class Coaches | World-Class Coaching |
| Closing | Ready to Climb Better, Harder, More? | Ready to Trust the Water?; Ready to Climb Like It’s 1905?; Ready for the Whole Odyssey? |

The companion-panel heading “Which Format?” appears 18 times. The five other comparison headings appear once each; “Where You’ll Climb” appears twice (Dolomites and Finale), and “More Ways to Go Deep” appears once (Deep Blue). Venue tables describe area/base/style or crag/style/grade rather than two purchasable options. They must not be forced into the existing left/right commercial comparison model.

Other customization beyond headings: 12 distinct hero/closing CTA-label combinations; 14 overview-fact label sequences; all 26 strip-label sequences; caption/emphasis and gallery introduction alignment; coach singular/plural; inclusion subheadings; dated schedule versus route list versus related offering. Keep layout choices limited to observed reusable variants, and keep copy independently editable.

## 3. Corresponding catalogue trips

Primary-link mappings below are evidence-backed catalogue correspondences, not a decision to merge or rename records. Date IDs are current local IDs. “Past” means the designed start precedes 11 September 2026, even if a multi-week trip has not ended.

| Design file | Current Event ID / slug | Current active Date ID | Designed dates | Caveat |
| --- | --- | --- | --- |
| `PROJECT ESPANA/rockbusters_espana_chulilla.html` | 17 / `climbing-trip-spain` | 749 | 2027-02-27 → 2027-03-06 | Exact source/date match |
| `PROJECT ESPANA/rockbusters_espana_margalef.html` | 17 / `climbing-trip-spain` | 751 | 2027-03-13 → 2027-03-20 | Exact source/date match |
| `PROJECT ESPANA/rockbusters_espana_sella.html` | 17 / `climbing-trip-spain` | 748 | 2027-02-20 → 2027-02-27 | Exact source/date match |
| `PROJECT ESPANA/rockbusters_espana_siurana.html` | 17 / `climbing-trip-spain` | 750 | 2027-03-06 → 2027-03-13 | Exact source/date match |
| `PROJECT ESPANA/rockbusters_projectespana_fulltrip.html` | 17 / `climbing-trip-spain` | 747 | 2027-02-20 → 2027-03-20 | Exact source/date match |
| `ROCK & ROAD/event-date___ceuse-rock-road-europe-2026-09-12.html` | 9 / `europe-rock-climbing-trip` | 684 | 2026-09-12 → 2026-09-19 | Exact source/date match |
| `ROCK & ROAD/event-date___frankenjura-rock-road-europe-2026-08-22.html` | 9 / `europe-rock-climbing-trip` | 687 | 2026-08-22 → 2026-08-29 | Past/started |
| `ROCK & ROAD/event-date___gorges-du-tarn-rock-road-europe-2026-09-19.html` | 9 / `europe-rock-climbing-trip` | 683 | 2026-09-19 → 2026-09-26 | Exact source/date match |
| `ROCK & ROAD/event-date___labske-udoli-rock-road-europe-2026-08-15.html` | 9 / `europe-rock-climbing-trip` | 689 | 2026-08-15 → 2026-08-22 | Past/started |
| `ROCK & ROAD/event-date___margalef-rock-road-europe-2026-09-26.html` | 9 / `europe-rock-climbing-trip` | 682 | 2026-09-26 → 2026-10-03 | Exact source/date match |
| `ROCK & ROAD/event-date___oltre-finale-rock-road-europe-2026-09-05.html` | 9 / `europe-rock-climbing-trip` | 685 | 2026-09-05 → 2026-09-12 | Past/started |
| `ROCK & ROAD/event-date___rock-road-europe-2026-08-15.html` | 9 / `europe-rock-climbing-trip` | 688 | 2026-08-15 → 2026-10-10 | Past/started; Inactive duplicate 789 |
| `ROCK & ROAD/event-date___rodellar-rock-road-europe-2026-10-03.html` | 9 / `europe-rock-climbing-trip` | 681 | 2026-10-03 → 2026-10-10 | Exact source/date match |
| `ROCK & ROAD/event-date___zillertal-rock-road-europe-2026-08-29.html` | 9 / `europe-rock-climbing-trip` | 686 | 2026-08-29 → 2026-09-05 | Past/started |
| `rockbusters_amuerte_rodellar.html` | 49 / `advanced-sport-climbing-course` | 674 | 2026-10-24 → 2026-10-31 | Exact source/date match |
| `rockbusters_beginnercourse_sella.html` | 4 / `beginner-climbing-course` | 676 | 2026-10-31 → 2026-11-07 | Branding alternative exists; see below. |
| `rockbusters_betababes_cuenca.html` | 20 / `woman-climbing` | 740 | 2026-10-17 → 2026-10-24 | Exact source/date match |
| `rockbusters_christmasretreat_sella.html` | 8 / `sport-climbing` | 714 | 2026-12-19 → 2027-01-02 | Exact source/date match |
| `rockbusters_deepblue_mallorca.html` | 18 / `deep-water-solo-mallorca` | 774 | 2026-08-17 → 2026-08-24 | Branding alternative exists; see below.; Past/started |
| `rockbusters_dolcevita_dolomites.html` | 8 / `sport-climbing` | 704 | 2026-07-04 → 2026-07-11 | Branding alternative exists; see below.; Past/started |
| `rockbusters_finaleligure_sportclimbing_3.html` | 8 / `sport-climbing` | 775 | 2027-04-17 → 2027-05-01 | Exact source/date match |
| `rockbusters_istria_easter.html` | 8 / `sport-climbing` | 717 | 2027-03-20 → 2027-04-03 | Exact source/date match |
| `rockbusters_knotsstone_czech.html` | 62 / `knots-stone-czech-climbing-tradition` | 701 | 2026-09-12 → 2026-09-19 | Exact source/date match |
| `rockbusters_leonidio_winter.html` | 8 / `sport-climbing` | 707 | 2027-01-23 → 2027-02-06 | Exact source/date match |
| `rockbusters_projectX_rodellar.html` | 55 / `climb-work` | 758 | 2026-10-10 → 2026-10-24 | Exact source/date match |
| `rockbusters_sportclimbing_kalymnos.html` | 8 / `sport-climbing` | 745 | 2026-09-26 → 2026-10-10 | Exact source/date match |

Three branding ambiguities need an explicit catalogue decision before bulk enrichment:

- **Sport Climbing Basics**: Event 1 has the design title, but primary booking 777 maps to Event 4 (`beginner-climbing-course`), Date 676. Event 1’s local occurrence is a different June run.
- **Deep Blue**: Event 2 has the design title, but booking 890 maps to Event 18 (`deep-water-solo-mallorca`), Date 774. Event 2 has other dates.
- **Dolomite Dolce Vita**: Event 3 has the design title, but booking 808 maps to Event 8 (`sport-climbing`), Date 704. Event 3 has different two-week dates.

Rock & Road’s full journey has two local records with the same Event/date range: active Date 688 and inactive Date 789. Record the duplicate; do not auto-merge it. All nine directly mapped Events are currently published locally.

### Kalymnos scope hazard

Event 8 currently has the pilot title “Sport Climbing Course: Kalymnos, Greece”, but the reference bookings for Leonidio, Christmas Sella, Istria, Finale and the Dolomites also map to Event 8. Its event-wide Kalymnos text therefore cannot be the final enrichment model for every occurrence. The audit did not undo the authorized pilot edits.

The public route filters by eligible start date. A past or already-started `?date=` may silently resolve to another occurrence. A URL alone is insufficient QA evidence: verify resolved Date ID, location, dates and CTA. Use historical render fixtures for started designs instead of changing schedules.

## 4. Kalymnos-first customization checklist

Pilot: Event 8 / `sport-climbing`, Date 745, 26 September–10 October 2026. The exact reference is `rockbusters_sportclimbing_kalymnos.html`. Existing imagery stays unchanged.

| Area | Required Kalymnos copy / capability | Current gap to close |
| --- | --- | --- |
| Hero | Title/accent, hashtag, Reserve Your Place / Read the Programme | Labels/secondary action remain code-owned; accents inferred from colon. Keep approved placement; do not reopen it as part of content-field work. |
| Summary + strip | Current reference fields, actual selected occurrence | Recently populated; verify no leakage when selecting another destination or one-week run. Broader metric labels remain future work. |
| Overview | About This Course / Where Tufas Teach Patience; six fact tiles with subtitles | Heading/body already editable; eyebrow and fact-tile contract still need independent controls. |
| Dates | Other Dates / This Course Travels + introduction | Default code owns heading; intro missing; schedule is Event Date data. |
| Gallery | Real Rock, Real Kalymnos / Tufas, Pockets & Pure Grit + description | Event/occurrence text override and Pure Grit accent; no full-layout replacement. |
| Audience | Who Should Show Up / Built for the Gym-to-Crag Gap | Replace hardcoded section heading with resolved copy; retain three authored cards. |
| Learning | The Coaching / Three Skills Worth the Trip | Editable heading/emphasis (Skills); retain existing three pillars and bullets. |
| Programme | Daily Structure / A Typical Day | A six-row time/activity timetable, not invented destination/day cards. |
| Companion | 1 Week vs 2 Weeks / Which Format? | Heading/intro/columns/rows exist; eyebrow is hardcoded. |
| Venue | The Venue / Kalymnos, Greece; two paragraphs and four facts | Trip/occurrence-specific copy without changing shared Location text for other pages. |
| Team | Your Coaching Team / World-Class Coaches | Independent heading/eyebrow; bios/roles belong with selected guide cards rather than supplementary bullets. |
| Reviews | Results / What Past Climbers Say | Independent copy defaults; keep preview quotes distinguished from verified reviews. |
| Logistics | Accommodation & Logistics / We Sorted the Boring Bits | Four cards including Gear and Group Size; card headings/body must be editable. |
| Package | What’s Included / Full Package | Independent heading; correct inclusion/exclusion and food notes. |
| FAQ | FAQ / Common Questions | Optional eyebrow/heading overrides; existing six questions/answers remain editable. |
| Closing CTA | Reserve Your Place / Ready to Climb Better, Harder, More? | Event/occurrence heading/body/support copy and controlled CTA labels; actual booking state stays authoritative. |

## Proposed staged plan

### A. Agree copy ownership and fallback before adding more fields

Adopt a stable semantic section key, shared defaults, Event-wide copy, and optional occurrence-specific copy for designs such as Kalymnos. A candidate content precedence is **selected Event Date override → Event copy → shared default**. Explicit custom-layout text remains authoritative only for fields the editor intentionally supplied; omitted fields can inherit. Define omitted as inherit, and an explicit clear/hide control separately—blank input must not ambiguously mean both. This is a proposal, not an accepted schema change.

Keep existing `tripDetail.sections` heading/body as the authoritative source where already appropriate; do not create a second competing heading field for the same prose. Give legacy structured sections a resolved section heading, eyebrow and intro rather than requiring a duplicate rich-text section. Keep accent text/line breaks explicit and safe; no arbitrary HTML/CSS from editors.

Resolve occurrence scope before bulk enrichment. For Kalymnos, prove a Date-745 override without overwriting Event 8’s other destinations; separately decide whether a reusable Event+Location editorial profile is needed later. Do not create new duplicate Events simply to get editable headings. Read ADR-0005/0009/0010 and record the accepted ownership decision when implementation is approved.

### B. First implementation slice: gallery and audience copy

Expose independent eyebrow/heading/description controls; wire them through default composition and existing shared components. Support reference heading emphasis consistently. Fill only Kalymnos. Preserve `event.layout` and prove the other Event 8 destination still inherits its own or shared copy. Acceptance: editing either heading in CMS changes only the intended occurrence without copying the layout.

### C. Extend the same contract across Kalymnos

Apply the proven override mechanism to overview, dates, learning, programme/comparison, venue/team, reviews, logistics/package, FAQ and final CTA. Reuse existing fields and renderers first. Add only the missing typical-day timetable and practical-card/package structures needed by this reference. Preserve selected-date commerce facts and inquiry/sold-out actions. Treat schedule/route alternatives and other design-only structural variants as later extensions.

### D. Reconcile captured copy into its intended section

Move the pilot’s supplementary gallery/venue/closing/reference-heading material into its proper bindings, with an exact before/after record. Remove only the duplicate passages now represented there; preserve unrelated legacy text and subsequent editor changes. Correct source conflicts explicitly—e.g. food inclusion claims—rather than propagating them blindly. Separate copied preview testimonials from approved public reviews.

### E. Kalymnos acceptance gate

Verify every reference content unit in place on desktop and mobile: copy, heading emphasis, item counts, CTA targets, loaded images and no overlap. Preserve the hero/gallery adjustments already reviewed; identify remaining visual differences instead of declaring acceptance from text presence alone. Verify Date 745 and the one-week Kalymnos run, one non-Kalymnos occurrence of Event 8, a sparse uncustomized Event, and an existing full custom layout. Include edit/read-back, inherit/reset/clear behavior, no duplicate sections and unchanged booking data. A full page with all reference passages in an appendix does not pass.

### F. Only then broaden the catalogue

Resolve the three branding ambiguities and full-tour duplicate. Group future enrichment by Event and occurrence instead of HTML filename. Pilot the structural exceptions next (Knots & Stone programme, Deep Blue companion/logistics, Dolomites/Finale venue tables, multi-stop routes), then batch approved content with dry-run manifests, source provenance, reversible writes and explicit editorial review. Promote to canonical seed or another database only under the agreed next scope.

No implementation, bulk content promotion or task posting was performed by this audit.
