# Single trip: section-by-section acceptance

Task: https://app.workstreams.ai/teams/S_ZYh417Os/board/AceE0P/tasks/a0cca40c-12bf-4d82-a969-a0d4b776bd2b
Date: 2026-09-10
Status: implementation exists; design acceptance reopened after user review.

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
- Trip guide cards had a separate presentation. Replace that cards variant with the existing catalogue GuideCard rather than styling another copy.
- Keep overall design acceptance, gallery geometry, guide consistency and comparison/editor dependencies open in Workstreams. Do not mark the task complete from automated test results alone.
