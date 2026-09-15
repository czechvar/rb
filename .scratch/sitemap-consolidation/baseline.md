# Live Rockbusters sitemap comparison — 2026-09-15

Sources: `https://rockbusters.net/sitemap.xml` and `https://rb-github.vercel.app/sitemap.xml`, last checked at 2026-09-15T18:48:25Z UTC. Local XML copies and the [216-row crosswalk](old-to-new-crosswalk.csv) are in this folder. The crosswalk includes 165 listed old URLs plus 51 future Event Date URLs found on legacy Event pages in the prior audit.

Old sitemap: **165** unique `<loc>` entries, all path URLs. New sitemap: **256** unique `<loc>` entries, including **59** dated `?date=` URLs. Counts are sitemap entries, not indexed-URL or redirect counts.

| Old route family | Old URLs | New route family | New URLs |
|---|---:|---|---:|
| `/event` + `/event-date` | 85 | `/trips` | 93 |
| `/location` | 33 | `/destinations` | 57 |
| `/team-member` | 19 | `/team` | 33 |
| `/blog` | 22 | `/blog` | 64 |
| Other: `/`, contact, guiding, partner, test-center, terms | 6 | Other: `/`, programs, calendar, CMS pages, contact | 9 |

**24 old paths** also appear in the new sitemap: homepage, contact, and 22 blog paths. This means the path survives in the sitemap; it does not yet prove content equivalence or correct legacy-host behavior.

The existing Tier 1 sheet has **58 exact candidates** (51 future Date URLs and seven Event URLs); **58** candidate targets appear in the live new sitemap. These are target-presence checks, not proof that the old sources redirect or that every target serves equivalent content and a correct canonical.

For the **165 URLs actually listed in the old sitemap**, **102 have a clear replacement** using saved identity evidence, the same path/slug, or a reviewed browse successor. The [remaining 63 URLs](old-urls-without-clear-replacement.csv) lack a sitemap-listed equivalent; 44 have temporary category targets, 10 have approved Event-page targets absent from the saved new sitemap, 8 use the broader `/trips` index, and one has a same-path CMS page seeded in devel. Clear replacement counts: seven verified Tier 1 Event identities, 17 historical equivalent Variant targets, 22 original same-listed paths, 45 same-slug Location/Guide detail records (32 Locations, 13 Guides), four browse-index successors, two existing empty blog categories at their same path, and five missing Guide URLs approved for `/team`. The blog category pages and `/team` returned 200 with self canonicals on the named production site. Other individual content and HTTP checks remain open.

The [single shareable redirect overview](legacy-redirect-overview.csv) covers all 216 old URLs: 127 earlier path-changing candidates, 7 temporary Event-to-category redirects, 37 temporary historical Date-to-category redirects, 10 newly approved Event-page redirects, 2 approved Event browse-index redirects, 8 broader `/trips` fallbacks, 24 existing same-path URLs, and one same-path CMS page pending named-production validation. No old sitemap URL lacks a target candidate. `needsRedirectConfiguration=yes` marks work that still needs deployment or external configuration and live verification; it does not claim a redirect is live.

No clear replacement by old family: `/event` 22, `/event-date` 37, `/partner` 1, `/private-guiding` 1, `/terms-and-conditions` 1, `/test-center` 1.

Of the 54 historical dated leaves listed in the old sitemap, the saved audit marks 17 content-equivalent Variant candidates whose URLs are in the new sitemap and 37 temporary category-browsing redirects. Seven of those category filters currently have no active trips and need content review. Category-filter query URLs are not sitemap entries by design, so their route and result content still need direct checks. For the 29 old Event detail pages, seven are in Tier 1; the remaining old Events now have user-approved Event-page, category, or trip-index destinations. Their old-source and final-target HTTP behavior still needs review. The remaining 82 old site URLs still need group-by-group redirect review, even though 24 retain the same listed path.

The saved 15 September new sitemap snapshot had 242 entries. The live sitemap has 14 more entries: 7 dated selections and 7 page paths. New URLs since that snapshot: `/blog/category/bouldering`, `/blog/category/video`, `/trips/bouldering-albarracin`, `/trips/bouldering-albarracin/albarracin`, `/trips/bouldering-albarracin/albarracin?date=2026-10-31-to-2026-11-14`, `/trips/climbing-technique-mental-coaching`, `/trips/climbing-technique-mental-coaching/kyparissi`, `/trips/climbing-technique-mental-coaching/kyparissi?date=2026-11-14-to-2026-11-21`, `/trips/climbing-technique-mental-coaching/kyparissi?date=2026-11-14-to-2026-11-28`, `/trips/climbing-technique-mental-coaching/kyparissi?date=2026-11-21-to-2026-11-28`, `/trips/climbing-technique-mental-coaching/rodellar`, `/trips/climbing-technique-mental-coaching/rodellar?date=2027-05-08-to-2027-05-15`, `/trips/climbing-technique-mental-coaching/rodellar?date=2027-05-08-to-2027-05-22`, `/trips/climbing-technique-mental-coaching/rodellar?date=2027-05-15-to-2027-05-22`. The old sitemap is unchanged from the saved 165-URL copy.

## Consolidated task boundary

Use the older generated-HTML comparison for content lineage and design references, then use the newer legacy-expiry audit as the URL identity and redirect candidate inventory. This live comparison is the current entry point for both tasks. The generated HTML is not the deployed Payload site, so HTML-file similarity must not establish a redirect target by itself.

The next review is content and routing validation: check each Tier 1 source/target pair for old-source status, final 200 response, equivalent content, canonical and robots behavior; then review the 54 historical dated leaves, 24 non-trip unchanged paths, and 82 other-site URLs. Search Console data is still needed to prioritize indexed or traffic-bearing legacy URLs.

Related board tasks: `aea8ff52-74d0-433d-8f33-db92e08e7362` (generated HTML/legacy content comparison) and `8d966e2a-b385-4691-a8e7-4fa73fe4e7ba` (legacy URL redirects).
