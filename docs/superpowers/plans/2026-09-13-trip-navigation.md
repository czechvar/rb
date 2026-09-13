# Trip navigation correction

Scope: menu and browse-trip links use `/trips`; existing Program detail routes,
content cards and structured data retain their domain-specific destinations.

Implemented:
- Header desktop/mobile navigation already uses `/trips`.
- Homepage, team, booking and account browse links now use `/trips`.
- Footer trip/coaching placeholders now lead to the trip catalogue.
- Five Home/Destinations CMS actions corrected locally and in the canonical seed.
- Dedicated Home/Destinations source snapshots and demo seed corrected so reimports
  cannot restore the old links.
- `scripts/data-import/update-trip-navigation.ts` performs the idempotent,
  local-only correction; dry-run by default, `--apply` writes persistent CMS content.

Review: standards review found no blockers. Spec review identified the dedicated
source snapshots; those five hrefs were corrected. No new category filters invented.

Validation: TypeScript and 149 unit/component tests passed. CMS read-back and a
second update run confirmed no remaining old browse links. Canonical seed changes
are exactly five `/programs` to `/trips` href replacements. Browser validation passed on Home, Destinations, Team and Trips at 1440px and 390px: HTTP 200, zero old browse/menu links and zero footer placeholders. The mobile drawer contains the correct Trips link and navigating it succeeds. Local development was restored with the normal Turbopack server and a fresh development cache.

Separate content gaps: footer `/faq` and `/terms` return 404 on production. No
approved global FAQ or Terms page exists in the current CMS seed/routes; their
content and publication remain separate work, not a fabricated navigation target.

Production has not been modified by this navigation correction.
