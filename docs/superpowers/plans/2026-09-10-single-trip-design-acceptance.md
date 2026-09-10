# Single trip: section-by-section acceptance

Task: https://app.workstreams.ai/teams/S_ZYh417Os/board/AceE0P/tasks/a0cca40c-12bf-4d82-a969-a0d4b776bd2b
Date: 2026-09-10
Status: top-down corrections implemented and checked; overall visual acceptance and missing editorial groups/personas/comparison content remain open.

The old checklist marked 20/20 complete. That recorded implementation coverage and incorrectly implied visual acceptance. A passing render/overflow check does not demonstrate agreement with the reference design. Use this matrix before checking visual work complete.

## Section coverage

| Section | Existing binding/presentation | Current acceptance boundary |
| --- | --- | --- |
| Hero and right pricing summary | tripHero / DetailHero / PricingSidebar | Shared occurrence and theme sizes verified; compare composition with reference |
| Facts strip | tripFacts / StatsBlock | Bound; compare density/wrapping with reference |
| Overview | tripContent overview | Exact source where available; sparse records may omit it |
| Dates and booking rows | tripDates / EventDatesList | Selection/availability verified; visual acceptance still required |
| Photo gallery | GalleryBlock / shared ImageTripCard photo | Maximum five valid source photos; source remains intact; review total height/crop/responsive layout |
| Audience | tripContent audience / existing arrays or exact sections | Supported; no invented personas where content absent |
| Learning | tripContent learning | Supported; no invented three-pillar grouping |
| Programme / itinerary | tripContent itinerary | Supported; pilot disputed stages remain with editors; not a complete reference programme |
| Requirements | tripContent requirements | Supported; pilot disputed requirements remain with editors |
| Comparison | No source-backed table | Deferred and not implemented; explicit editorial dependency |
| Venue | tripVenue / LocationBlock | Selected venue binding; visual acceptance still required |
| Guides | tripTeam / shared catalogue GuideCard | Reuse actual site card; selected occurrence guides, links, original copy and bullets retained |
| Reviews | ReviewGrid | Existing relevant records only; omit when absent |
| Logistics and equipment | tripLogistics / equipment content | Existing copy and date overrides; review hierarchy/readability |
| FAQ | FAQ block | Existing relevant records only; omit when absent |
| Closing CTA | tripBookingCTA / BookingCTA | Shared occurrence and theme button recipe verified; compare composition |
| Unmapped copy, partner and demo | Remaining source block | Preserve existing content; implementation addition for editorial transition |

All reference section categories are accounted for. This does not mean all are populated or visually accepted. Comparison is explicitly unimplemented. The pilot lacks gallery, audience, reviews and FAQs; its programme/requirements contain unresolved conflicts.

## Required check for each visual section

1. Identify the reference section, intended order, visible item count and responsive arrangement.
2. Identify the existing reusable component and current public callers before extending it.
3. Map existing source fields and define empty/partial states; do not invent copy or relationships.
4. Verify shared typography, spacing, image crop, button dimensions and keyboard/reduced-motion behavior.
5. Capture the actual section beside the reference at desktop and mobile; record differences, not just HTTP status or overflow.
6. Mark implementation, visual verification and editor dependencies separately. Only mark design acceptance complete when the differences have been resolved or explicitly accepted.

## Current corrections

- Gallery formerly rendered all linked media (64 on some Events). Its featureLead preview now caps at five valid photos, matching the reference count. Other gallery variants and stored records remain unchanged.
- Trip guide cards now use the existing catalogue GuideCard photoOverlay presentation; selected guides, profile links, photos and original copy are preserved.
- Keep overall design acceptance, gallery geometry, guide consistency and comparison/editor dependencies open in Workstreams. Do not mark the task complete from automated test results alone.


## Executed review and evidence

Review sheet: `.scratch/trip-checklist-qa/report.html` (reference/current section captures and a 65-Event content table). Machine-readable measurements: `verified.json`; source inventory: `content-coverage.json` in the same directory. Captures are local artifacts, not CMS data.

| Check | Verified result |
| --- | --- |
| Gallery desktop geometry | Five photos, 2fr/1fr/1fr grid, two 300px rows with 4px gap: 604px, equal to reference at 1440px viewport |
| Gallery mobile / sparse | Two-column preview, 444px on real trip at 390px; one/two/five-photo fixtures adapt in both themes; no catalogue-grid changes |
| Guide reuse | Existing GuideCard photoOverlay, matching GuideGridBlock; deliberate canonical-site presentation rather than another reference-specific guide variant |
| Headings and section spacing | Added embedded SectionIntro variant only for trip fallback bindings; removed doubled heading padding without changing other consumers |
| Overview panel | Bordered contiguous fact tiles; one column on mobile; odd final value spans the row instead of leaving a blank tile |
| Logistics hierarchy | Accommodation/travel cards followed by separate included/excluded lists, exact copy and date overrides retained; gear remains its existing source-backed section and group size remains in occurrence facts |
| Closing actions | Bookable image banner has booking plus inquiry; no-date/sold-out shows one inquiry action |
| Source coverage | All 65 Events (49 published) inventoried; pilot has overview/learning/equipment only and no gallery/audience/reviews/FAQs; programme/requirements conflicts remain editorial |
| Responsive/theme checks | Pilot, Deep Blue and Andalucia at 1440/390px; both theme previews, source item counts, loaded gallery images and no horizontal overflow verified |
| Automated checks | 31 isolated tests, full TypeScript, scoped ESLint, theme CSS and registry pass; no DB/content changes |

### Remaining acceptance constraints

- Programme and requirements: the pilot's source is disputed. Renderers exist, but no full reference programme is published by guessing or rewriting.
- Comparison: no source-backed rows; no table invented.
- Final full-content signoff stays open until those editorial decisions are supplied. Missing source sections are omitted according to the agreed content policy.
- The reference's four practical cards are not populated with claims absent from the existing records. Existing equipment prose stays intact in its own section; actual group size is already shown in date-derived facts. Photo/guide assets and item counts reflect existing records.
- Theme typography and shared guide-card presentation are intentional departures from the standalone HTML, following the user's explicit reuse/theme instructions. The HTML is a layout reference, never a content source.


## Reuse audit

| Trip section | Shared implementation / existing caller |
| --- | --- |
| Hero and pricing | DetailHero / PricingSidebar through TripHeroBlock; PricingSidebar also in design-system specimens |
| Facts | StatsBlock through generic RenderBlocks and the existing heroBar variant |
| Overview / mined prose | Existing SectionIntro and Lexical inside the source-preserving TripEditorialSection adapter |
| Dates | EventDatesList, also used by the dedicated trip dates route |
| Photos | ImageTripCard, also used by TripGrid featureLead and Catalogue Results calendar cards |
| Audience | AudienceCards, also used by the canonical Program route |
| Learning / programme / requirements / highlights / equipment | Existing WhatYouLearn, DayByDayItinerary, Prerequisites, HighlightsGrid, EssentialEquipment; trip callers only opt into embedded headings; no replacement card implementation |
| Venue | LocationBlock, also used by Program and trip logistics routes |
| Guides | CatalogueCards.GuideCard, used by GuideGridBlock and FeaturedGuideBlock |
| Reviews / FAQ | Existing ReviewGridBlock and FAQBlock registered on other compatible CMS surfaces |
| Logistics | EventAccommodationLogistics through existing TripLogisticsBlock and design-system specimens; additive cards variant |
| Closing action | Existing BookingCTA through TripBookingCTABlock; additive image variant |
| Source remainder / partner / demo | Lexical plus existing PartnerBlock and DemoLessonBlock, preserving their Event fields |


## Top-down correction pass (latest; supersedes earlier acceptance claims)

- Hero: selected date/country and guide metadata; populated difficulty only; existing destination red-accent CSS on the unchanged title suffix after a colon. Hero description is visually clamped to three lines; stored text is unchanged.
- Overview: section eyebrow, paper-white body token, booking link to selected occurrence (pilot `/book/701`) or inquiry fallback.
- Eyebrows: optional props on existing section components; neutral default trip labels. Other callers retain their defaults.
- Programme/requirements: runtime-only extraction of explicitly headed original passages exposes DAILY SCHEDULE and REQUIREMENTS on Knots. Original wording, node order and formatting are retained. Exact displayed slices are removed from the remainder; no editorial reconciliation or CMS backfill occurred.
- Supplementary prose is visible, not collapsed. Original conflicting facts remain available and require editorial review.
- Learning: existing six Knots learning items are visible. Existing WhatYouLearn now supports an optional third pillar with the trip cards variant. No new grouping was invented.
- Audience: existing shared AudienceCards remains supported; the pilot has no source cards/personas.
- Comparison: optional Event heading/intro/column labels/rows and the programme/table pairing are implemented. Empty/incomplete comparisons are omitted, and comparison-only content uses full width. The pilot has no source comparison rows.
- Additive migration `20260910_173426_event_comparison_learning_pillar` applied and tables read back in the local development DB. New comparison and third-pillar tables each contain zero rows; Events remain 65. No editorial records inserted. Test/remote DB migration is not claimed.

Evidence: `.scratch/trip-topdown-qa/verified.json` and section screenshots at 1440/390px. Hero checked at both widths: red accent, three-line clamp, metadata, no overlap/overflow. Overview/learning/itinerary/requirements each visible with eyebrow; overview computed paper color `rgb(240,237,231)` and booking `/book/701`; no collapsed details or horizontal overflow. Existing six learning items differ deliberately from the screenshot's three editorial groups. The absent audience/comparison cannot receive visual full-content acceptance from this pilot.

Validation: 36 isolated render/query tests, 21 resolver/composition tests, TypeScript, scoped lint and theme checks. Final design acceptance remains open; component availability is not full-content visual signoff.
