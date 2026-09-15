# Reusable content behind 13 unresolved old Event URLs

Checked 15 September 2026 against `scripts/data-import/seed/legacy-events.json` and the canonical Payload seed. The old Chamonix alias was also checked on the live legacy site. These are content-source findings; the later user-approved redirect destinations live in `src/lib/legacy-redirect-decisions.json` and `legacy-redirect-overview.csv`.

Twelve old slugs have exact Event records in the canonical seed. All twelve are draft, carry imported Lexical content and typed trip sections, have no Trip Variant, and have no active Event Dates. Their content is reusable after editorial and public-route decisions. The thirteenth URL, `/event/alpine-rock-climbing-in-chamonix`, receives two legacy 301 responses ending at `/event/big-wall-climbing-in-chamonix/`; the canonical seed has that published Big Wall Event. Its named-production `/trips/big-wall-climbing-in-chamonix` page returns 200 with a self canonical but noindex, and is outside the sitemap.

| Old Event URL | Seed Event | State | Lexical words | Typed sections | Dates / active |
|---|---|---|---:|---|---:|
| `/event/singing-rock-mobile-test-center` | `singing-rock-mobile-test-center` | draft | 1725 | whatYouLearn, itinerary, accommodation, transport | 0 / 0 |
| `/event/climbing-weekends` | `climbing-weekends` | draft | 261 | whatYouLearn, itinerary, accommodation, transport, gallery | 1 / 0 |
| `/event/christmas-climbing-holiday` | `christmas-climbing-holiday` | draft | 368 | whatYouLearn, itinerary, accommodation, transport, gallery | 10 / 0 |
| `/event/easter-climbing-in-sella` | `easter-climbing-in-sella` | draft | 291 | whatYouLearn, itinerary, accommodation, transport, gallery | 3 / 0 |
| `/event/rockbusters-climbing-express` | `rockbusters-climbing-express` | draft | 336 | whatYouLearn, itinerary, accommodation, transport | 0 / 0 |
| `/event/rockbusters-private-guiding` | `rockbusters-private-guiding` | draft | 287 | whatYouLearn, itinerary, accommodation, transport, gallery | 1 / 0 |
| `/event/biomechanica-funcional` | `biomechanica-funcional` | draft | 578 | whatYouLearn, itinerary, accommodation, transport | 0 / 0 |
| `/event/adam-ondra-patxi-usobiaga-work-shop` | `adam-ondra-patxi-usobiaga-work-shop` | draft | 391 | whatYouLearn, itinerary, accommodation, transport, gallery | 4 / 0 |
| `/event/daila-ojeda-climbing-work-shop` | `daila-ojeda-climbing-work-shop` | draft | 433 | whatYouLearn, itinerary, accommodation, transport, gallery | 14 / 0 |
| `/event/alpine-rock-climbing-in-chamonix` | `big-wall-climbing-in-chamonix` | published | 414 | whatYouLearn, itinerary, accommodation, transport, gallery | 24 / 20 |
| `/event/klemen-becan-performance-coaching-privat` | `klemen-becan-performance-coaching-privat` | draft | 476 | whatYouLearn, itinerary, accommodation, transport | 0 / 0 |
| `/event/deep-water-solo-sailing-mallorca` | `deep-water-solo-sailing-mallorca` | draft | 405 | whatYouLearn, itinerary, accommodation, transport | 0 / 0 |
| `/event/rockbusters-summer-2018` | `rockbusters-summer-2018` | draft | 236 | whatYouLearn, itinerary, accommodation, transport | 0 / 0 |

All thirteen source Events also have `tripDetail` and a main picture in the canonical seed. The raw legacy export retains body copy and, for many records, inclusions, exclusions, equipment, food/accommodation and itinerary notes. These fields provide enough source material to review an archive or service page without scraping the old HTML again.

Suggested content-review groups: `singing-rock-mobile-test-center`, `rockbusters-private-guiding`, `biomechanica-funcional`, and `klemen-becan-performance-coaching-privat` describe service/test/coaching offers; the dated holiday/workshop Events may need archive content later. Their redirect destinations are now decided, but this does not publish or validate their old Event copy.

The source content may be outdated. Check price, availability, guide assignments, brand claims, imagery and the intended current offer before publishing a new indexable page. Draft records must stay unpublished until that review is complete.

## Content-only parent decision

Of these 13 audited source records, only the published Big Wall Chamonix Event is approved for content-only parent indexing. Its old Chamonix alias now has an approved `/trips/big-wall-climbing-in-chamonix` redirect rule, pending deployment and named-production validation. All twelve exact-slug matches were hidden in the old export (`display=0`) and remain draft in the canonical seed, so none has an approved content-equivalent parent page.

Exclude `singing-rock-mobile-test-center` from the current offer set: it describes an old equipment test-center campaign, not a test fixture. Exclude `rockbusters-summer-2018`: its title and body are tied to July 2018. The other ten draft Events have genuine source content but need a current-offer and copy review before publication. In particular, named-climber workshops and coaching pages must confirm those people and services are still available; seasonal and private-guiding pages must confirm current locations and terms. Seven of the ten have temporary browsing redirects to live, populated category filters: four to Sport Climbing Holidays (47 results) and three to Performance & Technique Camps (eight results), browser-checked on the named production site on 15 September 2026. The three Custom Trips/Private Coaching pages use the user-approved broader `/trips` fallback because their filters had zero results. These browsing redirects do not restore the old Event content or approve it for indexing.
