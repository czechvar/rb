# Applied event-to-category mapping

Status: approved by the user and applied locally. All 60 mapped Events now have the listed primary and secondary categories, with the primary listed first. The five held Events retain their previous assignments. Publication states and Event Dates were not changed. The canonical seed includes the assignments. Production is untouched.

## Interpretation

- Propose one main browsing category and only meaningful secondary categories. The existing Events.categories field supports multiple categories but has no formal primary-category field; primary here is editorial guidance, not a schema change.
- Expeditions requires a multi-week, multi-crag travelling format. A long stay, big wall or exotic destination alone is insufficient. Short occurrences of a road-trip Event inherit its overall format; occurrence-specific taxonomy is outside this proposal.
- Private Coaching and Custom Trips describe how the offer is delivered; discipline categories can be secondary.
- The three old category records remain in place. The 60 mapped Events no longer use their old assignments; held Events retain theirs. Retire/reconcile old categories only after their remaining relations are audited.
- The footer now links all eight categories to `/trips?category=<slug>`. Active authored categories remain selectable even without upcoming dates, showing an empty result instead of silently discarding the filter.

## Inventory and evidence

All 65 local Events were reviewed, including drafts. Evidence: current local titles, slugs, publication states and descriptions; corresponding canonical Event rich content for specialist/ambiguous offers; local occurrence durations for road-trip candidates. This is a content-based classification proposal, not verification that every offer is currently sold. CSV uses stable event/category slugs for later migration; numeric IDs are local review references only.

## Category records and proposed coverage

| Category | Slug | Primary matches |
| --- | --- | --- |
| Expeditions | `expeditions` | 6 |
| Sport Climbing Holidays | `sport-climbing-holidays` | 14 |
| Bouldering Camps | `bouldering-camps` | 3 |
| Performance & Technique Camps | `performance-technique-camps` | 19 |
| Sport Climbing Courses | `sport-climbing-courses` | 4 |
| Trad & Multi-Pitch | `trad-multipitch` | 7 |
| Private Coaching | `private-coaching` | 5 |
| Custom Trips | `custom-trips` | 2 |
| Outside taxonomy / hold | — | 5 |

## Classification caveats retained for future refinement

1. Should Sport Climbing Holidays include deep-water solo? Events 2, 18 and 35 need this decision; sailing/DWS has no exact category in the supplied list.
2. Does France Rock Trip (59) have a multi-week itinerary? If yes, promote it to Expeditions.
3. Should specialist bolting (63) fit Sport Climbing Courses, and short biomechanics/Feldenkrais workshops (26, 54) fit Performance & Technique Camps?
4. Confirm Private Coaching includes private guiding (22, 47).
5. Keep gear-test centre, internship, van rental, accommodation and the 2018 umbrella record outside the trip-category mapping. This does not propose deleting or unpublishing them.

## Expeditions

| Event | State | Secondary categories | Confidence | Reason |
| --- | --- | --- | --- | --- |
| 9: [Europe  Climbing Trip](http://localhost:4444/trips/europe-rock-climbing-trip) | published | Sport Climbing Holidays | high | Travelling multi-crag road trip with multi-week dates or an explicit multi-week itinerary. |
| 17: [Spanish Climbing Trip](http://localhost:4444/trips/climbing-trip-spain) | published | Sport Climbing Holidays | high | Travelling multi-crag road trip with multi-week dates or an explicit multi-week itinerary. |
| 45: [Balkans Climbing Road Trip](http://localhost:4444/trips/balkans-rock-climbing) | published | Sport Climbing Holidays | high | Travelling multi-crag road trip with multi-week dates or an explicit multi-week itinerary. |
| 58: [Andalucia Rock Trip](http://localhost:4444/trips/andalucia-rock-trip) | published | Sport Climbing Holidays | high | Camper-van travel across Andalucian crags plus a multi-week occurrence supports Expeditions. |
| 60: [Bourdering and Sport Climbing in INDIA](http://localhost:4444/trips/bouldering-and-sport-climbing-in-india) | published | Bouldering Camps, Sport Climbing Holidays | high | Full content explicitly describes a two-week Hampi and Badami trip mixing bouldering and sport climbing. |
| 61: [SPAIN ROCK TRIP - Cuenca, Costa Blanca, Chulilla, Siurana](http://localhost:4444/trips/spain-rock-trip-cuenca-costa-blanca-chulilla-siurana) | published | Sport Climbing Holidays | high | Travelling multi-crag road trip with multi-week dates or an explicit multi-week itinerary. |

## Sport Climbing Holidays

| Event | State | Secondary categories | Confidence | Reason |
| --- | --- | --- | --- | --- |
| 2: [DEEP BLUE — The Psicobloc Camp](http://localhost:4444/trips/deep-blue-psicobloc) | published | — | review | Deep-water solo is the lead activity, with sport climbing alongside it. Confirm whether Holidays should include DWS. |
| 8: [Sport Climbing Camp](http://localhost:4444/trips/sport-climbing) | published | — | high | Destination-led climbing holiday; the experience and time on rock are the main offer. |
| 13: [Rockbusters weekends](http://localhost:4444/trips/climbing-weekends) | draft | — | medium | Short climbing weekend; holiday grouping is provisional because the detailed itinerary needs review. |
| 14: [Christmas Climbing Camp](http://localhost:4444/trips/christmas-climbing-holiday) | draft | — | high | Destination-led climbing holiday; the experience and time on rock are the main offer. |
| 15: [Easter Climbing in SELLA](http://localhost:4444/trips/easter-climbing-in-sella) | draft | — | high | Destination-led climbing holiday; the experience and time on rock are the main offer. |
| 18: [Deep Water Solo / Mallorka](http://localhost:4444/trips/deep-water-solo-mallorca) | published | — | review | Mixed DWS and sport-climbing tour. Confirm whether Holidays should include DWS. |
| 19: [Cataluna Climbing](http://localhost:4444/trips/catalunya-climbing) | draft | — | medium | Multiple Catalan sport crags, but no dated occurrences establish a multi-week expedition; use Holidays provisionally. |
| 20: [Girls On Rock](http://localhost:4444/trips/woman-climbing) | published | — | medium | Women-only audience describes who attends, not the activity; Holidays is the provisional format. |
| 21: [San Fermin Climbing](http://localhost:4444/trips/san-fermin-climbing) | draft | — | high | Destination-led climbing holiday; the experience and time on rock are the main offer. |
| 35: [Deep Water Solo & Sailing, Mallorca](http://localhost:4444/trips/deep-water-solo-sailing-mallorca) | draft | — | review | DWS and sailing, not a sport-climbing holiday in the strict sense. Needs an explicit taxonomy decision. |
| 37: [EASTER CLIMBING CAMP in KALYMNOS](http://localhost:4444/trips/easter-climbing-camp-in-kalymnos) | published | — | high | Destination-led climbing holiday; the experience and time on rock are the main offer. |
| 38: [ANDALUCIA CLIMBING](http://localhost:4444/trips/andalucia-climbing) | published | — | high | Destination-led climbing holiday; the experience and time on rock are the main offer. |
| 55: [CLIMB & WORK](http://localhost:4444/trips/climb-work) | published | — | medium | Climb-and-work stay; a longer stay alone does not make it a multi-crag expedition. |
| 59: [France Rock Trip](http://localhost:4444/trips/france-rock-trip) | published | — | review | Multi-crag camper-van format suggests Expeditions, but no occurrence or explicit multi-week duration was found. Keep Holidays provisional until duration is confirmed. |

## Bouldering Camps

| Event | State | Secondary categories | Confidence | Reason |
| --- | --- | --- | --- | --- |
| 5: [Bouldering Albarracin](http://localhost:4444/trips/bouldering-albarracin) | published | — | high | Bouldering is the main climbing discipline. |
| 39: [Introduction to bouldering](http://localhost:4444/trips/introduction-to-bouldering) | published | — | high | A bouldering course belongs with Bouldering Camps despite the course format; it is not a sport-climbing course. |
| 65: [Bouldering Weekend with Alizée Dufraisse](http://localhost:4444/trips/bouldering-weekend-with-alizee-dufraisse) | published | Performance & Technique Camps | high | Three-day bouldering coaching weekend; bouldering first, performance coaching second. |

## Performance & Technique Camps

| Event | State | Secondary categories | Confidence | Reason |
| --- | --- | --- | --- | --- |
| 10: [Rockbusters coaching - On Sight / Red Point](http://localhost:4444/trips/climbing-coaching-on-sight-red-point) | published | — | high | The main promise is structured improvement, technique, training or mental performance. |
| 11: [Rockbusters coaching - Footwork / Balance](http://localhost:4444/trips/climbing-coaching-footwork-balance) | published | — | high | The main promise is structured improvement, technique, training or mental performance. |
| 12: [Rockbusters coaching - Overhangs](http://localhost:4444/trips/climbing-coaching-overhangs) | published | — | high | The main promise is structured improvement, technique, training or mental performance. |
| 24: [Adam Ondra ON SIGHT & RED POINT](http://localhost:4444/trips/adam-ondra-on-sight-red-point) | published | — | high | The main promise is structured improvement, technique, training or mental performance. |
| 25: [Patxi Usobiaga TRAINING](http://localhost:4444/trips/patxi-usobiaga-training) | published | — | high | The main promise is structured improvement, technique, training or mental performance. |
| 26: [BIOMECHANICA FUNCIONAL](http://localhost:4444/trips/biomechanica-funcional) | draft | — | medium | Injury-prevention/biomechanics workshop fits the performance theme, though it is not a camp. |
| 27: [Rockbusters Coaching with Brother and Primo](http://localhost:4444/trips/pro-climbers-performance-coaching) | draft | — | high | The main promise is structured improvement, technique, training or mental performance. |
| 28: [Adam / Patxi / Pablo](http://localhost:4444/trips/adam-ondra-patxi-usobiaga-work-shop) | draft | — | high | The main promise is structured improvement, technique, training or mental performance. |
| 29: [Brother / Primo /  Adam / Patxi / Pablo](http://localhost:4444/trips/adam-ondra-patxi-usobiaga-work-shop-extension) | draft | — | high | The main promise is structured improvement, technique, training or mental performance. |
| 30: [Daila Ojeda Climbing Clinic](http://localhost:4444/trips/daila-ojeda-climbing-work-shop) | draft | — | high | The main promise is structured improvement, technique, training or mental performance. |
| 31: [Hazel Findlay MENTAL COACHING](http://localhost:4444/trips/hazel-findlay-mental-coaching) | published | — | high | The main promise is structured improvement, technique, training or mental performance. |
| 33: [Master Class Coaching with Klemen Bečan](http://localhost:4444/trips/climbing-technique-mental-coaching) | published | — | high | The main promise is structured improvement, technique, training or mental performance. |
| 40: [Sport Climbing MASTERCLASS](http://localhost:4444/trips/sport-climbing-masterclass) | published | — | high | The main promise is structured improvement, technique, training or mental performance. |
| 41: [Climbing coaching](http://localhost:4444/trips/climbing-coaching) | published | — | high | The main promise is structured improvement, technique, training or mental performance. |
| 51: [BIG Gear Test&Demo / Performance Coaching](http://localhost:4444/trips/performance-coaching-gear-test) | published | — | high | Performance coaching is a stated main outcome; gear demos are an additional feature. |
| 52: [EFFICIENT TECHNIQUE / INJURY PREVENTION Sport Climbing Course](http://localhost:4444/trips/efficient-technique-injury-prevention-sport-climbing-course) | published | Sport Climbing Courses | high | Technique/injury prevention is the primary outcome; the authored sport-climbing course format is secondary. |
| 54: [Feldenkrais Method Workshop for Climbers](http://localhost:4444/trips/feldenkrais-method-workshop-for-climbers) | published | — | medium | Feldenkrais/injury-prevention workshop fits performance support; confirm inclusion under a Camps label. |
| 57: [Fear Management & Mental Coaching](http://localhost:4444/trips/fear-management-mental-coaching) | published | — | high | The main promise is structured improvement, technique, training or mental performance. |
| 64: [Youth Summer Rock Climbing & Bouldering Camp](http://localhost:4444/trips/youth-summer-rock-climbing-bouldering-camp) | published | Bouldering Camps | high | Advanced youth performance camp with bouldering; youth is an audience attribute, not a separate category. |

## Sport Climbing Courses

| Event | State | Secondary categories | Confidence | Reason |
| --- | --- | --- | --- | --- |
| 1: [Sport Climbing Basics — Learn to Lead & Climb Outdoors](http://localhost:4444/trips/sport-climbing-basics) | published | — | high | Teaching outdoor sport-climbing skills is the main offer. |
| 4: [Novice course](http://localhost:4444/trips/beginner-climbing-course) | published | — | high | Teaching outdoor sport-climbing skills is the main offer. |
| 49: [Advance sport climbing course](http://localhost:4444/trips/advanced-sport-climbing-course) | published | Performance & Technique Camps | high | Teaching outdoor sport-climbing skills is the main offer. |
| 63: [Bolt & Send: Sicily's Virgin Rock](http://localhost:4444/trips/bolt-send-sicily-s-virgin-rock) | published | — | review | Route development and bolting course. Sport Climbing Courses is the closest category, but the supplied gym-to-rock description does not cover this specialist scope. |

## Trad & Multi-Pitch

| Event | State | Secondary categories | Confidence | Reason |
| --- | --- | --- | --- | --- |
| 3: [The Dolomite Dolce Vita](http://localhost:4444/trips/dolomite-dolce-vita) | published | Expeditions | high | Two-week Dolomites tour focused on multi-pitch sport climbing; Expeditions is a reasonable secondary format. |
| 6: [Trad and Multipitch](http://localhost:4444/trips/multipitch-climbing-course) | published | — | high | Trad protection, multi-pitch systems or big-wall climbing is the main discipline. |
| 7: [Czech Sandstone](http://localhost:4444/trips/sandstone-climbing) | published | — | medium | Czech sandstone has traditional protection and ethics; confirm this offer teaches those rather than only visiting the area. |
| 32: [Big wall climbing in Chamonix](http://localhost:4444/trips/big-wall-climbing-in-chamonix) | published | — | high | Trad protection, multi-pitch systems or big-wall climbing is the main discipline. |
| 42: [Trad climbing course](http://localhost:4444/trips/trad-climbing-course) | published | — | high | Trad protection, multi-pitch systems or big-wall climbing is the main discipline. |
| 43: [Multipitch performance coaching](http://localhost:4444/trips/multipitch-performance-coaching) | published | Performance & Technique Camps | high | Trad protection, multi-pitch systems or big-wall climbing is the main discipline. |
| 62: [KNOTS & STONE: Czech Climbing Tradition](http://localhost:4444/trips/knots-stone-czech-climbing-tradition) | published | — | high | Trad protection, multi-pitch systems or big-wall climbing is the main discipline. |

## Private Coaching

| Event | State | Secondary categories | Confidence | Reason |
| --- | --- | --- | --- | --- |
| 22: [Rockbusters Private Guiding](http://localhost:4444/trips/rockbusters-private-guiding) | draft | — | high | Explicit one-to-one private guiding; confirm that the public Private Coaching label also covers guiding. |
| 34: [MASTER CLASS COACHING with Klemen Becan](http://localhost:4444/trips/klemen-becan-performance-coaching-privat) | draft | — | high | Full content explicitly describes private coaching with a maximum of two climbers. |
| 46: [Sport climbing private coaching](http://localhost:4444/trips/sport-climbing-private-coaching) | published | Performance & Technique Camps | high | Explicit private, individual or very small tailored coaching/guiding. |
| 47: [Multipitch climbing private guiding & coaching](http://localhost:4444/trips/multipitch-climbing-private-guiding-coaching) | published | Trad & Multi-Pitch | high | Explicit private, individual or very small tailored coaching/guiding. |
| 48: [Trad climbing private coaching](http://localhost:4444/trips/trad-climbing-private-coaching) | published | Trad & Multi-Pitch | high | Explicit private, individual or very small tailored coaching/guiding. |

## Custom Trips

| Event | State | Secondary categories | Confidence | Reason |
| --- | --- | --- | --- | --- |
| 16: [Rockbusters Climbing EXPRESS](http://localhost:4444/trips/rockbusters-climbing-express) | draft | — | high | Customer chooses where and when; team arranges transport, gear and camping. |
| 53: [Customized Climbing Rock Trip](http://localhost:4444/trips/customized-climbing-rock-trip) | published | — | high | Dates, destination or itinerary are designed around the customer. |

## Outside taxonomy / hold

| Event | State | Secondary categories | Confidence | Reason |
| --- | --- | --- | --- | --- |
| 23: [Singing Rock Mobile Test Center](http://localhost:4444/trips/singing-rock-mobile-test-center) | draft | — | hold | Mobile gear test centre; no description establishing a bookable climbing trip. |
| 36: [ROCKBUSTERS SUMMER 2018](http://localhost:4444/trips/rockbusters-summer-2018) | draft | — | hold | Draft 2018 summer programme bundling multiple offers; treat as an archive/umbrella record rather than recategorising as a current trip. |
| 44: [Internship](http://localhost:4444/trips/internship) | published | — | hold | Work-experience internship, not a customer climbing trip. |
| 50: [Camper Van Rental](http://localhost:4444/trips/camper-van-rental) | published | — | hold | Camper van rental is an ancillary service. |
| 56: [Climbers Hut: Your Base Camp for Epic Ascents!](http://localhost:4444/trips/climbers-hut-your-base-camp-for-epic-ascents) | published | — | hold | Accommodation/base-camp offer, not a climbing trip. |

## Application and verification

The user approved the mapping as proposed, including the entries marked for review. `scripts/data-import/seed/event-category-assignments.json` records the approved category slugs; empty lists explicitly mean preserve the existing assignment. `pnpm exec tsx scripts/data-import/apply-event-categories.ts --apply` applies the mapping to an existing local database in one transaction and updates only the corresponding category relations/timestamps in the canonical seed. Without `--apply`, it reports planned changes. The utility refuses non-local databases.

Verified: 60 Events updated, five held unchanged, all category assignments read back, and publication states preserved. Previous relations are backed up under `.scratch/event-category-application/`. Category records and Event Dates are not modified by the assignment script. Footer category-filter links are implemented; homepage category links remain separate work.
