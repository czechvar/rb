# Trip detail customization audit

Read-only source inspection, 2026-09-11. No code, data or external task mutations. Sources: current checkout and local `rockbusters_sportclimbing_kalymnos.html`; no live DB claims.

## Composition and ownership

The Event has one optional full block layout. Any nonempty `event.layout` replaces the automatic layout; there is no partial merge (`src/app/(frontend)/trips/[slug]/page.tsx:24`, `:30`; `src/collections/Events.ts:81`). Default sequence and eyebrows are code-owned (`src/lib/trip-layout.ts:6`). This confirms the user's concern: CMS block headings alone do not solve event-specific copy on the shared automatic layout.

However, not all current headings are hardcoded: `tripDetail.sections[]` already stores editable kind, heading and rich-text body (`src/collections/Events.ts:51-63`), rendered directly by `TripEditorialSection` (`src/components/sections/TripEditorialSection.tsx:25`). These authored sections coexist with older structured arrays; `TripContentBlock` renders both, so adding another rich-text section to fix a heading can create duplicate semantic sections (`src/components/blocks/TripContentBlocks.tsx:51-77`).

## Current customization matrix

| Default section | Event/related-record editable content | Heading/eyebrow/intro and action gaps |
|---|---|---|
| Hero | Event title, shortDescription, mainPicture, tripDetail.hashtag and leadRequirement; selected occurrence dates/locations/guides | Title accent is inferred from a colon, not separately authored (`DetailHero.tsx:42`). Primary Book Your Spot / inquiry and secondary Dates & Pricing labels are hardcoded (`src/components/sections/DetailHero.tsx:47`, `:83`). No configurable secondary action target. |
| Facts strip / right overview | tripDetail locationDescriptor, gradeRange, leadRequirement, minimumParticipants, priceCaption, travelNote; selected Event Date facts | Most labels and structure derived in `src/lib/trip-summary.ts:25-37`; not arbitrary editorial facts. Correctly preserves occurrence ownership. |
| Overview | tripDetail.sections kind=overview heading/body | Eyebrow About This Trip from default layout; CTA Book Your Spot/Ask a Question code-owned (`src/components/blocks/TripContentBlocks.tsx:67`). |
| Dates | Event Date records | Eyebrow Other Dates / heading Dates & Pricing in default layout; editable only via full layout block (`src/blocks/TripDates/config.ts:8`). No section intro field. Row labels are component-owned. |
| Gallery | Event.gallery images | Eyebrow Trip Gallery; no default heading/body. Block has all three text fields, but Event has no independent gallery copy fields (`src/blocks/Gallery/config.ts:9`, `src/components/blocks/GalleryBlock.tsx:39-43`). Heading plain string; no accent spans. |
| Audience | Event.audienceCards heading/body/highlighted; authored audience sections | Array heading Who this camp is for hardcoded (`src/components/sections/AudienceCards.tsx:23`); default eyebrow Who Should Show Up. No array section intro. |
| Highlights | Event.highlights text; authored highlights sections | Array heading Trip Highlights supplied in adapter (`src/components/blocks/TripContentBlocks.tsx:59`); default eyebrow Trip Highlights. |
| Learning | whatYouLearn intro, three box headings/bullet arrays; authored learning sections | Array heading What you'll learn fixed (`src/components/sections/WhatYouLearn.tsx:31`); default eyebrow The Coaching. |
| Itinerary/programme | itinerary.intro, days with badges, heading, eyebrow, description, schedule; authored itinerary sections | Array heading Daily flow fixed (`src/components/sections/DayByDayItinerary.tsx:12`); default eyebrow Daily Structure. Current day schema is destination-oriented, while Kalymnos reference is a single typical-day timetable. |
| Format comparison (paired with itinerary) | Event.comparison heading/intro/column labels/rows | Eyebrow What's Different hardcoded (`src/components/sections/TripComparison.tsx:15`). Render requires heading, both columns, nonempty rows (`:11`). |
| Requirements | prerequisites.text; authored requirements sections | Array heading Climber type & prerequisites fixed (`src/components/sections/Prerequisites.tsx:9`); default eyebrow Requirements. |
| Venue | Selected occurrence Locations; name, destinationDetail intro, mainPicture, country/gradeRange | Heading is Location.name; eyebrow The Venue fixed; body comes from shared Location intro. No Event-specific venue heading/description/facts override (`src/components/blocks/TripContentBlocks.tsx:88-100`). Location with no intro is omitted. |
| Team | Selected occurrence guides; Event.coachFramingParagraph/coachTeamBullets; shared guide cards | Meet your guides fixed even in custom tripTeam card block; Your Guides eyebrow can be set in layout only (`src/components/blocks/TripContentBlocks.tsx:103-118`). |
| Reviews | Related real review records | What Past Climbers Say / Results supplied in automatic layout; block heading/eyebrow/intro editable only in custom layout (`src/components/blocks/ReviewGridBlock.tsx:34`; `src/blocks/ReviewGrid/config.ts:8`). |
| Logistics/inclusions | accommodation rich text and included/notIncluded arrays; transport; occurrence overrides | Everything Sorted / Accommodation & Logistics default; block heading/eyebrow editable only in custom layout. Accommodation, Getting There, Included in our price, Not included fixed (`src/components/sections/EventAccommodationLogistics.tsx:41`, `:45`, `:63`, `:77`). No Gear/Group Size card data contract or Full Package subheading. |
| Equipment | essentialEquipment and equipmentIntro; authored equipment sections | Essential equipment fixed (`src/components/sections/EssentialEquipment.tsx:21`); default eyebrow Equipment. |
| Notes | Authored notes heading/body | Default eyebrow Additional Information; per-item heading/body editable. |
| FAQ | Related FAQ questions/answers | Common Questions / FAQ in default; heading/eyebrow editable only in custom layout; block intentionally excludes body (`src/blocks/FAQ/config.ts:13`). |
| Remaining | Event.content unmatched material, additionalInfo heading/body; partner fields and demo fields | More about this trip fixed; More Information default eyebrow (`src/components/blocks/TripContentBlocks.tsx:36-47`). Partner/demo have their own existing event-level copy fields (`src/collections/Events.ts:328-351`). |
| Final booking CTA | Selected occurrence and Event image | Ready to join? / Reserve Your Place default; custom block allows heading/eyebrow/body; button labels hardcoded (`src/components/sections/BookingCTA.tsx:24-37`). No event-level final CTA copy. |

Component filenames shortened only within prose where unambiguous; matrix citations give full paths for primary evidence. Authoritative default order: `src/lib/trip-layout.ts:8-27`. Optional components can omit themselves, so a default block's presence does not prove visible content.

## Kalymnos reference copy needing independent controls

Exact local HTML text:

- Overview: About This Course / Where Tufas Teach Patience.
- Dates: Other Dates / This Course Travels, with section intro.
- Gallery: Real Rock, Real Kalymnos / Tufas, Pockets & Pure Grit, plus gallery description. Pure Grit is an accent phrase.
- Audience: Who Should Show Up / Built for the Gym-to-Crag Gap.
- Learning: The Coaching / Three Skills Worth the Trip (Skills accented).
- Daily programme: Daily Structure / A Typical Day.
- Comparison: 1 Week vs 2 Weeks / Which Format?
- Venue: The Venue / Kalymnos, Greece, with trip-appropriate description and venue facts.
- Team: Your Coaching Team / World-Class Coaches.
- Reviews: Results / What Past Climbers Say.
- Logistics: Accommodation & Logistics / We Sorted the Boring Bits; four cards Accommodation, Getting There, Gear, Group Size.
- Inclusions: What's Included / Full Package.
- FAQ: FAQ / Common Questions.
- Final CTA: Reserve Your Place / Ready to Climb Better, Harder, More?, body and booking/support copy.
- Hero labels: Reserve Your Place / Read the Programme (the latter is an on-page programme action, unlike current dates-page link).

## Recommended Kalymnos-first contract, before wider content work

1. Define optional Event-level section presentation copy keyed by stable semantic section, independent of layout order. Cover eyebrow, heading, intro/description and an explicitly supported emphasis representation; absence inherits shared defaults. Do not require editors to clone the layout. Reuse the existing authored-section heading/body rather than create competing copies.
2. Resolve one heading for each rendered section regardless of whether its body comes from legacy arrays or tripDetail.sections. Decide how parallel sources are reconciled; do not silently drop source material. Document precedence: explicit custom-layout presentation remains authoritative; automatic layout consumes Event copy then shared defaults.
3. Add only missing Kalymnos content structures: simple typical-day timetable, logistics Gear/Group Size cards and inclusion-package intro/subheading; verify existing comparison and learning groups suffice before adding fields. Treat wording capability separately from typography/layout implementation.
4. Expose controlled CTA labels/destinations where design varies, while retaining safe booking/inquiry behavior and derived prices/availability. Add trip-specific venue introduction only if editing shared Location content would be wrong for other trips.
5. Fill and review Kalymnos against each reference section in its intended location. A passage placed in More about this trip does not meet section-level content parity. Handle sample reviews as preview content, never as real testimonials.
6. Only after Kalymnos acceptance generalize to other mapped catalogue Events. Update ADR-0009/0010 for the durable independent-copy contract; retain Event Date ownership from ADR-0005. The user already authorized reference-copy adaptation, so historic exact-copy migration restrictions do not prohibit this new editorial work.


## Scope hazard: multiple reference designs share one Event

Catalogue mapping from the parallel audit establishes 26 designs mapping to 9 Event IDs via primary booking source references. Six destination/season designs map to Event 8 (Kalymnos occurrence 745, Leonidio 707, Christmas 714, Istria 717, Finale 775, Dolomite 704); nine RockRoad designs map to Event 9; five Espana designs map to Event 17. Similarly named curated Events 1/2/3 are not interchangeable with booking-linked Events 4/18/8. Therefore the Event-only copy proposal above is necessary but **insufficient**: changing Event 8's title, gallery framing or audience copy to Kalymnos affects its other selected occurrences too. Do not create duplicate Events merely to match reference filenames.

Existing occurrence support is narrower than editorial parity: Event Dates already store `extraContent` rich text and `logisticsOverrides` accommodation/food/included/excluded/note (`src/collections/EventDates.ts:64-79`). The trip request explicitly selects logistics overrides, but **does not fetch extraContent** (`src/lib/queries.ts:272-277`), and source search finds no rendering consumer for extraContent. Thus that field cannot currently solve occurrence-specific gallery/section headings, hero copy, learning or timetable placement. Logistics overrides are meaningful-content checked and merged into rendering (`src/lib/trip-detail.ts:160-170`), so reuse them for existing supported logistics rather than duplicate that content on Event.

Minimal Kalymnos-first policy to settle in the plan:

- Keep reusable course copy/default section presentation on Event 8; reserve location/season-specific copy for a narrowly defined occurrence override, initially Event Date 745 only. If current Event 8 already contains Kalymnos-specific text, classify and back it up before relocating; do not assume it is safe shared copy.
- Agree an explicit allowlist of overrideable editorial fields for this pilot (hero title/intro/hashtag, relevant section heading/eyebrow/intro and only differing structured bodies). Override only changed fields; absence inherits Event then shared defaults. This is a proposed content ownership policy, not authorization for a new global schema implementation or duplicate catalogue records.
- Preserve explicit custom block layouts and selected occurrence commercial facts. Validate whether custom blocks consume the resolved copy or deliberately retain literal layout text; do not silently override editor-authored layout wording.
- Acceptance must compare occurrence 745 and at least one different Event 8 destination. Selecting another destination must not retain Kalymnos title/gallery eyebrow or source-specific body. Repeat that guard before propagating to multi-design Events 9 and 17.
- Reusable location-season profile/grouping can be considered only after the 745 pilot establishes actual repeated overrides. Avoid a new variant entity or duplicated full layouts now.

### Past-date routing caveat

The detail route loads upcoming active Event Dates, then resolves `?date=` against that filtered set (`src/app/(frontend)/trips/[slug]/page.tsx:18-21`; `src/lib/queries.ts:264-277`). Visibility is based on **start date** on/after today's UTC floor, not on whether the trip has ended (`src/lib/event-date-visibility.ts:4-17`). The resolver filters again and silently chooses another available occurrence (or earliest sold out) when the requested ID is missing/ineligible (`src/lib/trip-detail.ts:142-147`). Consequently a historical HTML booking ID is valid mapping evidence but may not select that exact public page today; even an ongoing trip with a prior start date is excluded. This is a verification boundary, not evidence that the catalogue mapping is wrong. Do not reactivate/re-date historical records just for parity; use a controlled preview for historical variants if required. The pilot should verify selectedDate.id is 745 rather than trust the URL alone.
