# Homepage rebuild — design spec

**Date:** 2026-06-25
**Status:** Draft, pending plan
**Source wireframe:** `docs/rockbusters_homepage_HEX E30713.html`

## Context

The marketing homepage at `/` is currently a 70-line stub: a hero with two CTAs and a single "What We Offer" card grid. Martin's copywriter team delivered a maximalist HTML wireframe with 15 sections. Per the content-production workflow, the wireframe is a draft-for-discussion menu, not a shipping list.

This spec captures the keep/trim/drop triage settled between Jan and Claude on 2026-06-25 (pre-meeting with Martin), the implementation approach, and dependencies that fall out of it.

## Goal

Replace the homepage stub with a production-grade landing page faithful to the wireframe's design system. The page composes 13 sections (2 deferred) — hardcoded layout + copy where the content is editorial, dynamic feeds from existing Payload collections where the content already lives there.

## Section triage

| # | Section | Decision | Notes |
|---|---|---|---|
| 1 | Hero | Keep as designed | Display H1 "CLIMB / HARDER. / CLIMB / SMARTER." + eyebrow + sub + 2 CTAs + trust strip naming Adam Ondra · Daila Ojeda · Hazel Findlay · Dave Graham (partnerships confirmed). |
| 2 | Stats bar | Keep | Numbers TBD — Jan to supply verified figures before launch. |
| 3 | **Sticky filter bar** | **Defer** | Own follow-up spec. Needs search-results page, new `Events` fields for Duration / Guide-or-Coach, and dual hero/sticky filter sync. |
| 4 | Who we are + 6 pillars | Keep all | Hardcoded copy, no images per pillar. |
| 5 | Featured trips | Keep 6 cards (1 wide + 5) | Dynamic from `Events` where `featured && status='published'`. |
| 6 | Why / pain-points | Keep all 6 | Hardcoded copy. Overlaps thematically with pillars but framing differs (problems vs. strengths). |
| 7 | Pro climber workshops | Keep with named climbers | Partnerships with Ondra / Ojeda / Findlay confirmed. Sourced from `Guides` (see Data sources). |
| 8 | Pick your experience | Keep 8 cards | Card destinations: `/programs/[slug]`. **Known issue:** target routes don't exist yet — links ship broken in v1. See Known issues. |
| 9 | Destinations | Keep 10 country cards | Hardcoded country list with crag bullets and country pages (`/destinations/[country]`). |
| 10 | Testimonials | Keep 3 | Dynamic from `Reviews`. Jan to seed real reviews before launch. |
| 11 | Meet the team | Keep as designed | 1 named founder card (Jany, from `Guides`) + 3 hardcoded umbrella cards (Elite International Guides / Pro Clinic Partners / Local Experts) + stats sub-strip. |
| 12 | FAQ | Keep 6 | Dynamic from `FAQs`. |
| 13 | Partners | Keep 5 names | Dynamic from `Partners`. |
| 14 | Final CTA | Keep as designed | Hardcoded copy. |
| 15 | **Footer newsletter signup** | **Defer** | Own follow-up spec. Needs Resend Audiences (or alternative) integration + double opt-in + GDPR consent text. Rest of footer ships. |

## Implementation approach

**A — Fully hardcoded TSX + collection feeds.** Matches existing convention (`/programs`, `/destinations`, `/team`, `/calendar` are all hardcoded TSX with collection-backed feeds). No Payload `Pages` collection or `homepage` global is introduced. Marketing copy edits go through Martin → Claude → PR per the content-production workflow, not via the admin UI. Promote to a CMS-managed model only when the client explicitly asks to self-edit copy.

## Design system change (site-wide)

Wireframe's CSS declares itself "single source of truth" and conflicts with the project's current tokens. Resolution: **adopt the wireframe's design system globally**, not homepage-only.

| | Current | New (from wireframe) |
|---|---|---|
| Brand red | `#e30613` | `#E30713` |
| Display font | Libre Franklin | Bebas Neue |
| Body font | Lato | Inter |
| Token convention | `--col*` (rem-based, `--rem-base: 10px`) | `--rb-*` (px-based) |

Existing marketing pages (`/programs`, `/destinations`, `/team`, `/calendar`, `/trips/[slug]`, plus `/account/*`, `/login`, `/register`) automatically re-skin and **must be visually QA'd as part of the plan**.

To reduce blast radius during the swap, the plan should add a compatibility shim that aliases old `--col*` tokens to the closest `--rb-*` equivalents while individual modules migrate. Shim removed once the visual QA pass confirms parity.

### Header alignment

The wireframe's nav (`Trips & Clinics`, `Destinations`, `The Crew`, `Contact`, `Blog` + a "Find Your Trip" primary CTA) differs from the current `Header.tsx` (`Programs`, `Destinations`, `Team`, `Blog`, no primary CTA). The current Header also carries a phone strip, account icon, and `transparent` prop the wireframe doesn't show. Resolution: rename `Programs` → `Trips & Clinics` and `Team` → `The Crew`, add a `Contact` link, add the "Find Your Trip" primary CTA. Preserve the existing phone strip, account icon, and `transparent` prop — these are functional improvements over the wireframe that we shouldn't lose. To resolve in plan: whether to refactor `Header.tsx` styling into the new tokens in the same PR or alias-and-defer.

## File structure

```
src/app/(frontend)/page.tsx              # async server component, fetches data, composes sections
src/app/(frontend)/styles.css            # rewritten: --rb-* tokens + global helper classes
src/app/(frontend)/layout.tsx            # updated next/font/google to Inter + Bebas Neue

src/components/marketing/homepage/
  Hero.tsx              + Hero.module.css
  StatsBar.tsx          + StatsBar.module.css
  WhoWeAre.tsx          + WhoWeAre.module.css
  FeaturedTrips.tsx     + FeaturedTrips.module.css
  WhyRockbusters.tsx    + WhyRockbusters.module.css
  ProClimbers.tsx       + ProClimbers.module.css
  PickYourExperience.tsx + PickYourExperience.module.css
  Destinations.tsx      + Destinations.module.css
  Testimonials.tsx      + Testimonials.module.css
  Team.tsx              + Team.module.css
  HomepageFAQ.tsx       + HomepageFAQ.module.css
  Partners.tsx          + Partners.module.css
  FinalCTA.tsx          + FinalCTA.module.css
```

`page.tsx` does all data fetching once and passes typed props down. Section components are presentation-only; no client-side fetching.

## Data sources

| Section | Source | Query |
|---|---|---|
| Hero | hardcoded copy + Media (hero background) | — |
| Stats bar | hardcoded copy | — |
| Who we are + 6 pillars | hardcoded copy | — |
| Featured trips (6) | dynamic | `Events` where `featured && status='published'`, populate `locations` + lowest `EventDates.price`, limit 6 |
| Why pain-points (6) | hardcoded copy | — |
| Pro climbers (3) | dynamic | `Guides` where `section='friends' && featured && active`, limit 3, order by `position` *(see Schema notes)* |
| Pick your experience (8) | hardcoded `{name, tagline, href}` list | — |
| Destinations (10) | hardcoded `{flag, name, crags[], href}` list | — |
| Testimonials (3) | dynamic | `Reviews` where `active && event=null && type=null`, limit 3, order by `position` |
| Team (founder + 3 umbrellas) | mixed | Founder: `Guides` where `section='team' && featured && active`, limit 1. 3 umbrella cards hardcoded. |
| FAQ (6) | dynamic | `FAQs` where `active && event=null && type=null`, limit 6, order by `position` |
| Partners (5) | dynamic | `Partners` where `featured && active`, limit 5 |
| Final CTA | hardcoded copy | — |

## Schema notes

No new collections or required fields. To verify during plan:

- `Guides` does not currently expose a `position` field — confirm whether ordering pro-climbers and the founder query needs it added (otherwise we fall back to a deterministic sort like `createdAt` or `name`).
- `Partners` does not currently expose a `position` field — same question. With only 5 entries it may not matter; with growth it will.
- Founder identification: `Guides` has no explicit "founder" marker. The homepage query relies on `section='team' && featured && active && limit 1`, which is brittle if more team members get featured. Consider adding a `role` text match for "Founder" or a dedicated `isFounder` boolean. To resolve in plan.

## Image assets

| Asset | Source | Notes |
|---|---|---|
| Hero background | `Media` collection (uploaded by Jan) | Full-bleed, dark, moody crag landscape. Referenced from `Hero.tsx` via Payload media ID. |
| Featured trip card backgrounds | `Events.mainPicture` (existing) | One per featured event. |
| Pro climber portraits | `Guides.photo` (existing) | Ondra / Ojeda / Findlay records need creating with photos. |
| Founder portrait | `Guides.photo` (existing) | Jany's `Guides` record needs a photo. |
| Partner logos | `Partners.logo` (existing) | Five partners need logos uploaded. |

Testimonials in the wireframe are text-only (no reviewer avatars) — no image needed.

## Known issues / accepted risks

1. **Section 8 "Pick your experience" cards link to `/programs/[slug]` routes that don't exist yet.** Jan explicitly accepted broken links in v1 with the understanding that the 8 category landing pages will ship shortly after the homepage. Status: **shipping with broken links by design**.
2. **Stats bar numbers are placeholders** ("15+ years", "3000+ climbers coached", "100% pure climbing focus") — Jan to confirm exact numbers before launch.
3. **Testimonials use placeholder reviewer copy** — Jan to seed real `Reviews` records before launch.
4. **Existing marketing pages may visually regress after the design-system swap.** Plan must include a visual QA pass on all existing pages with a compatibility shim during the transition.

## Testing

- `pnpm typecheck` after section components + queries land.
- **Integration tests** (`tests/integration/`): verify new homepage query helpers (`getFeaturedEventsForHomepage`, `getHomepageReviews`, `getHomepageFAQs`, `getHomepagePartners`, `getProClimberGuides`, `getFounderGuide`) return data in the expected shape against the test branch.
- **E2E test** (`tests/e2e/homepage.spec.ts`, new): Playwright visits `/`, asserts each section's identifying element is visible — hero H1 text, featured trips grid card count > 0, FAQ items > 0, partners row present, footer present.
- **Manual visual QA**: dev-server walk through `/programs`, `/destinations`, `/team`, `/trips/[slug]`, `/calendar`, `/account/*`, `/login`, `/register` after the design-system swap. Anything visibly broken gets a targeted fix or a token alias.
- No visual-regression / screenshot diffing in this scope.

## Deferred follow-up specs

- **Sticky filter bar** — 6-dimension search UX (Type, Level, Destination, Dates, Guide/Coach, Duration) + search-results page + scroll-triggered visibility + dual filter sync. Requires schema additions to `Events` (Duration, Guide/Coach taxonomy).
- **Footer newsletter signup** — email capture + mailing-list integration (likely Resend Audiences since we already use Resend) + double opt-in + GDPR consent.
- **`/programs/[slug]` category landing pages** — 8 pages to replace the v1 broken links from Section 8. Each page needs design + content (likely a Page-style template pulling Events filtered by category).

## Open questions for the plan phase

1. Should `Guides.position` and `Partners.position` be added as part of this work, or punted until the data set actually requires it?
2. Should the founder query use a dedicated `isFounder` boolean (or `role` text match) instead of `section='team' && featured && limit 1`?
3. Wireframe uses scroll-triggered `.reveal` animations via `IntersectionObserver`. Plan should decide: port the observer as a small client island, or replace with `prefers-reduced-motion`-aware pure CSS?
4. Compatibility shim strategy: alias old `--col*` tokens to nearest `--rb-*` equivalents during the swap, or do the full token migration in a single PR with no shim?
