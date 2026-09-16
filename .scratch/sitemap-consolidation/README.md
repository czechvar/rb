# Sitemap and redirect overview

The shareable file is `legacy-redirect-overview.csv`. It covers every URL in the saved old-site inventory, including dated links discovered on old Event pages. The `action`, `needsRedirectConfiguration`, `validationStatus`, and `candidateInNewSitemap` columns distinguish current candidates from same-path pages and unresolved mappings.

Refresh it after a sitemap, content, or redirect decision changes:

```bash
python3 .scratch/sitemap-consolidation/compare.py --refresh
```

The sitemap refresh command fetches the live `rockbusters.net` and named `rb-github.vercel.app` sitemaps, validates the XML, and rebuilds the CSV. It stops if the old sitemap adds or removes a URL relative to the audited inventory, so new sources receive an identity review before entering the configuration list. The fetch time is stored in `sitemap-snapshot-metadata.json` and copied into the CSV's `sitemapsCheckedAtUtc`; copying the XML files does not change the recorded check time.

Validate every row against the named production deployment and update the CSV's
`validationStatus` and `redirectCheckedAtUtc` columns:

```bash
python3 scripts/audit-legacy-redirects.py
```

The category and team decisions from 15 September 2026 are recorded in `mark-decisions.py` and in `.scratch/legacy-expiry-audit/all-old-url-inventory.csv` plus `.scratch/sitemap-redirect-mapping.csv`. The current redirect and parent approval lists live in `src/lib/legacy-redirect-decisions.json`; Next redirects, parent eligibility, and the CSV generator read that same file. Re-running the decision script is idempotent.

Historical Event Dates without an exact Variant successor use the trip category saved in the legacy audit. The shared decision file contains 37 temporary Date-to-category redirects; 17 other dated leaves retain their exact Variant candidates. Seven of the 37 lead to `trad-multipitch`, which currently has no active trips. The CSV marks these empty-category destinations for content review and keeps them distinct from equivalent replacement targets.

The shared decision file also contains 75 approved exact replacements: the final
24 gaps from the old sitemap and 51 future Event Dates discovered on legacy
Event pages. These redirect permanently to their identity-equivalent Trip,
Variant, or dated selection.

The remaining 52 path-changing candidates are Location and Guide URLs covered
by the generic rules and the five explicit missing-Guide fallbacks to `/team`.

The later user decisions send `/event` and `/event-date` to `/trips`, approve ten published Event-page candidates, and send eight other legacy paths to `/trips`. `/terms-and-conditions` keeps its path through the published root CMS Page in the canonical seed. The overview keeps mapping decisions, live redirect validation, and remaining content or robots review separate; a broad catalogue fallback is not counted as an identity-equivalent sitemap replacement.

The 13 unresolved Event content sources are audited in `13-event-content-sources.md`. The redirect CSV reads their `contentSourceRecord` and `contentSourceSeedState` from the current canonical Payload seed on every refresh. `contentReviewStatus` marks one approved content-only parent, two excluded legacy campaigns, and ten drafts needing current-offer review. Seven drafts have temporary category-browsing targets with nonempty named-production results; three with empty category filters now use the broader `/trips` fallback. The browser evidence is saved in `category-browser-validation.json` and its check time and result count are copied into the CSV. Refresh that browser evidence when category content changes.
