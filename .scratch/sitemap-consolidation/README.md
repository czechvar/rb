# Sitemap and redirect overview

The shareable file is `legacy-redirect-overview.csv`. It covers every URL in the saved old-site inventory, including dated links discovered on old Event pages. The `action`, `needsRedirectConfiguration`, `validationStatus`, and `candidateInNewSitemap` columns distinguish current candidates from same-path pages and unresolved mappings.

Refresh it after a sitemap, content, or redirect decision changes:

```bash
python3 .scratch/sitemap-consolidation/compare.py --refresh
```

The command fetches the live `rockbusters.net` and named `rb-github.vercel.app` sitemaps, validates the XML, and rebuilds the CSV. It stops if the old sitemap adds or removes a URL relative to the audited inventory, so new sources receive an identity review before entering the configuration list. The fetch time is stored in `sitemap-snapshot-metadata.json` and copied into the CSV's `sitemapsCheckedAtUtc`; copying the XML files does not change the recorded check time.

The category and team decisions from 15 September 2026 are recorded in `mark-decisions.py` and in `.scratch/legacy-expiry-audit/all-old-url-inventory.csv` plus `.scratch/sitemap-redirect-mapping.csv`. Re-running that script is idempotent.

The 13 unresolved Event content sources are audited in `13-event-content-sources.md`. The redirect CSV reads their `contentSourceRecord` and `contentSourceSeedState` from the current canonical Payload seed on every refresh. `contentReviewStatus` currently marks one approved content-only parent, two excluded legacy campaigns, and ten drafts needing current-offer review. Seven drafts have temporary category-browsing targets with nonempty named-production results; three have empty category filters and no target. The browser evidence is saved in `category-browser-validation.json` and its check time and result count are copied into the CSV. Refresh that browser evidence when category content changes.
