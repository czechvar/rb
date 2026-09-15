#!/usr/bin/env python3
"""Refresh the read-only legacy/new sitemap starting inventory."""

import csv
import json
import sys
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
OLD_XML = OUT / "old-sitemap.xml"
NEW_XML = OUT / "new-sitemap.xml"
SNAPSHOT_META = OUT / "sitemap-snapshot-metadata.json"
AUDIT = ROOT / ".scratch/legacy-expiry-audit/all-old-url-inventory.csv"
TIER1 = ROOT / ".scratch/legacy-expiry-audit/tier1-redirect-readiness.csv"
OLDER_MAP = ROOT / ".scratch/sitemap-redirect-mapping.csv"
CANONICAL_SEED = ROOT / "scripts/data-import/seed/canonical-payload-seed.json"
EMPTY_TARGET_OPTIONS = ROOT / ".scratch/legacy-expiry-audit/empty-target-options.csv"
CATEGORY_BROWSER_AUDIT = OUT / "category-browser-validation.json"
REDIRECT_DECISIONS = ROOT / "src/lib/legacy-redirect-decisions.json"
CONTENT_EVENT_ALIASES = {"alpine-rock-climbing-in-chamonix": "big-wall-climbing-in-chamonix"}
legacy_decisions = json.loads(REDIRECT_DECISIONS.read_text())
APPROVED_CONTENT_ONLY_PARENT_SLUGS = set(legacy_decisions["contentOnlyParentSlugs"])
MISSING_TEAM_PATHS = {f"/team-member/{slug}" for slug in legacy_decisions["missingTeamMemberSlugs"]}
HISTORICAL_DATE_CATEGORY_TARGETS = {
    f"/event-date/{slug}": f"/trips?category={category}"
    for slug, category in legacy_decisions["temporaryHistoricalDateCategoryRedirects"].items()
}
APPROVED_EVENT_PAGE_TARGETS = {
    f"/event/{slug}": target
    for slug, target in legacy_decisions["approvedLegacyEventPageRedirects"].items()
}
BROWSE_INDEX_TARGETS = {path: "/trips" for path in legacy_decisions["legacyTripBrowseIndexRedirects"]}
TRIPS_FALLBACK_TARGETS = {path: "/trips" for path in legacy_decisions["legacyTripIndexFallbackPaths"]}
SAME_PATH_CMS_TARGETS = {f"/{slug}": f"/{slug}" for slug in legacy_decisions["samePathCmsPageSlugs"]}
USER_DECISION_TARGETS = {
    **APPROVED_EVENT_PAGE_TARGETS, **BROWSE_INDEX_TARGETS,
    **TRIPS_FALLBACK_TARGETS, **SAME_PATH_CMS_TARGETS,
}
assert len(USER_DECISION_TARGETS) == sum(map(len, (
    APPROVED_EVENT_PAGE_TARGETS, BROWSE_INDEX_TARGETS,
    TRIPS_FALLBACK_TARGETS, SAME_PATH_CMS_TARGETS,
))), "Legacy decisions overlap"
EXCLUDED_LEGACY_EVENT_SLUGS = {
    "singing-rock-mobile-test-center": "inactive equipment test-center campaign",
    "rockbusters-summer-2018": "obsolete Summer 2018 campaign",
}
SOURCE_URLS = {
    OLD_XML: "https://rockbusters.net/sitemap.xml",
    NEW_XML: "https://rb-github.vercel.app/sitemap.xml",
}


def key(url):
    parsed = urlparse(url)
    path = parsed.path.rstrip("/") or "/"
    return path + ("?" + parsed.query if parsed.query else "")


def sitemap_urls(path):
    return [element.text for element in ET.parse(path).getroot().iter()
            if element.tag.endswith("loc") and element.text]


def family(url):
    path = urlparse(url).path.strip("/")
    return "/" + path.split("/")[0] if path else "/"


if "--refresh" in sys.argv:
    for local_path, source_url in SOURCE_URLS.items():
        with urllib.request.urlopen(source_url, timeout=60) as response:
            if response.status != 200:
                raise RuntimeError(f"Sitemap refresh failed with HTTP {response.status}")
            data = response.read()
        parsed = ET.fromstring(data)
        if not any(element.tag.endswith("loc") and element.text for element in parsed.iter()):
            raise RuntimeError("Sitemap refresh returned XML without URLs")
        temporary = local_path.with_suffix(".refresh.xml")
        temporary.write_bytes(data.replace(b"\r\n", b"\n"))
        temporary.replace(local_path)
    SNAPSHOT_META.write_text(json.dumps({"checkedAtUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}, indent=2) + "\n")

refreshed_at = json.loads(SNAPSHOT_META.read_text())["checkedAtUtc"] if SNAPSHOT_META.exists() else datetime.fromtimestamp(
    min(path.stat().st_mtime for path in SOURCE_URLS), timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
old_urls = sitemap_urls(OLD_XML)
new_urls = sitemap_urls(NEW_XML)
old_keys = {key(url) for url in old_urls}
new_keys = {key(url) for url in new_urls}
audit_rows = list(csv.DictReader(AUDIT.open(newline="")))
tier1_rows = list(csv.DictReader(TIER1.open(newline="")))
tier1_by_old = {row["oldUrl"].rstrip("/") or "/": row for row in tier1_rows}
older_rows = list(csv.DictReader(OLDER_MAP.open(newline="")))
older_by_old = {row["source"].rstrip("/") or "/": row for row in older_rows}
seed = json.loads(CANONICAL_SEED.read_text())
seed_events = {row["slug"]: row for group in seed["collections"] if group["slug"] == "events" for row in group["rows"]}
seed_pages = {row["slug"]: row for group in seed["collections"] if group["slug"] == "pages" for row in group["rows"]}
assert all(target.startswith("/trips/") and seed_events.get(target.removeprefix("/trips/"), {}).get("state") == "published"
           for target in APPROVED_EVENT_PAGE_TARGETS.values()), "Approved Event targets must be published seed records"
assert all(seed_pages.get(path.strip("/"), {}).get("status") == "published"
           for path in SAME_PATH_CMS_TARGETS), "Same-path CMS target must be published in the seed"
category_fallbacks = {row["source"]: row["draftCategoryFallbackCandidate"]
                      for row in csv.DictReader(EMPTY_TARGET_OPTIONS.open(newline="")) if row["draftCategoryFallbackCandidate"]}
audited_date_fallbacks = {
    key(row["oldUrl"]): row["auditTargetCandidate"]
    for row in audit_rows
    if row["inOldSitemap"] == "true" and key(row["oldUrl"]).startswith("/event-date/")
    and row["auditTargetStatus"] in ("category-fallback-ready", "category-fallback-empty-category")
}
assert HISTORICAL_DATE_CATEGORY_TARGETS == audited_date_fallbacks, "Historical Date redirects must match the legacy category audit"
category_browser_audit = json.loads(CATEGORY_BROWSER_AUDIT.read_text())
for slug, category in legacy_decisions["temporaryEventCategoryRedirects"].items():
    assert category_fallbacks.get(f"/event/{slug}") == f"/trips?category={category}", f"Category decision lacks matching legacy evidence: {slug}"

assert len(old_urls) == len(old_keys), "Old sitemap has duplicate locs"
assert len(new_urls) == len(new_keys), "New sitemap has duplicate locs"
saved_old_keys = {key(row["oldUrl"]) for row in audit_rows if row["inOldSitemap"] == "true"}
assert saved_old_keys == old_keys, f"Legacy inventory changed: {len(old_keys-saved_old_keys)} new URLs and {len(saved_old_keys-old_keys)} removed URLs. Review before rebuilding the redirect CSV."
assert USER_DECISION_TARGETS.keys() <= old_keys, "User-approved redirect sources must occur in the old sitemap"

crosswalk = []
for row in audit_rows:
    old_key = key(row["oldUrl"])
    ready = tier1_by_old.get(old_key)
    older = older_by_old.get(old_key)
    candidate = ready["candidateTarget"] if ready else (row["tier1DateTargetCandidate"] or row["auditTargetCandidate"] or (older["destination"] if older else ""))
    if old_key in MISSING_TEAM_PATHS:
        candidate = "/team"
    if old_key in HISTORICAL_DATE_CATEGORY_TARGETS:
        candidate = HISTORICAL_DATE_CATEGORY_TARGETS[old_key]
    if old_key in USER_DECISION_TARGETS:
        candidate = USER_DECISION_TARGETS[old_key]
    clear_class = ""
    clear_target = ""
    if ready and key(ready["candidateTarget"]) in new_keys:
        clear_class, clear_target = "verified-tier1-identity", ready["candidateTarget"]
    elif row["auditTargetStatus"] == "ready-indexable-equivalent-variant" and candidate and key(candidate) in new_keys:
        clear_class, clear_target = "historical-equivalent-variant", candidate
    elif row["auditTargetStatus"] == "live-200-self-canonical-empty-category" and old_key in ("/blog/category/bouldering", "/blog/category/video"):
        clear_class, clear_target = "same-path-existing-empty-category", old_key
    elif old_key in MISSING_TEAM_PATHS and candidate in new_keys:
        clear_class, clear_target = "reviewed-team-index-fallback", candidate
    elif old_key in BROWSE_INDEX_TARGETS and candidate in new_keys:
        clear_class, clear_target = "approved-browse-index-successor", candidate
    elif old_key in new_keys:
        clear_class, clear_target = "same-listed-path", old_key
    elif older and old_key in ("/location", "/team-member") and older["destination"] in new_keys:
        clear_class, clear_target = "browse-index-successor", older["destination"]
    elif older and older["classification"] == "relevant-replacement" and older["destination"] in new_keys and old_key.startswith(("/location/", "/team-member/")):
        clear_class, clear_target = "same-slug-content-record", older["destination"]
    no_clear_reason = ""
    if not clear_class:
        if old_key in SAME_PATH_CMS_TARGETS:
            no_clear_reason = "same-path-cms-page-not-yet-in-named-sitemap"
        elif old_key in TRIPS_FALLBACK_TARGETS:
            no_clear_reason = "approved-browse-fallback-not-equivalent"
        elif row["auditTargetStatus"]:
            no_clear_reason = row["auditTargetStatus"]
        elif older and older["destination"] and key(older["destination"]) not in new_keys:
            no_clear_reason = "saved-target-absent-from-new-sitemap"
        elif old_key in ("/event", "/event-date"):
            no_clear_reason = "browse-index-successor-needs-review"
        else:
            no_clear_reason = "no-reviewed-content-equivalent-target"
    crosswalk.append({
        "oldUrl": row["oldUrl"],
        "oldPath": old_key,
        "oldFamily": family(row["oldUrl"]),
        "inOldSitemap": row["inOldSitemap"],
        "unchangedPathInNewSitemap": str(old_key in new_keys).lower(),
        "candidateTarget": candidate,
        "candidateInNewSitemap": str(bool(candidate) and key(candidate) in new_keys).lower(),
        "mappingClass": "tier1-exact" if ready else (row["auditTargetStatus"] or "unreviewed"),
        "candidateSource": "legacy-redirect-decisions.json" if old_key in MISSING_TEAM_PATHS or old_key in HISTORICAL_DATE_CATEGORY_TARGETS or old_key in USER_DECISION_TARGETS else ("tier1-redirect-readiness.csv" if ready else ("all-old-url-inventory.csv" if row["tier1DateTargetCandidate"] or row["auditTargetCandidate"] else ("sitemap-redirect-mapping.csv" if older and older["destination"] else ""))),
        "clearReplacementClass": clear_class,
        "clearReplacementTarget": clear_target,
        "reasonWithoutClearReplacement": no_clear_reason,
    })

with (OUT / "old-to-new-crosswalk.csv").open("w", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=list(crosswalk[0]), lineterminator="\n")
    writer.writeheader()
    writer.writerows(crosswalk)

overview = []
for row in crosswalk:
    target = row["clearReplacementTarget"] or row["candidateTarget"]
    content_event = None
    if row["oldFamily"] == "/event" and row["mappingClass"] == "missing-target":
        old_slug = row["oldPath"].split("/event/", 1)[1]
        content_event = seed_events.get(CONTENT_EVENT_ALIASES.get(old_slug, old_slug))
    if content_event and content_event["slug"] in APPROVED_CONTENT_ONLY_PARENT_SLUGS and not target:
        target = f"/trips/{content_event['slug']}"
    content_review = ""
    if content_event:
        content_review = ("approved-content-only-parent" if content_event["slug"] in APPROVED_CONTENT_ONLY_PARENT_SLUGS
                          else "excluded-legacy-campaign" if content_event["slug"] in EXCLUDED_LEGACY_EVENT_SLUGS
                          else "needs-current-offer-review")
    category_fallback = ""
    date_category_fallback = HISTORICAL_DATE_CATEGORY_TARGETS.get(row["oldPath"], "")
    if content_review == "needs-current-offer-review" and not target:
        category_slug = legacy_decisions["temporaryEventCategoryRedirects"].get(content_event["slug"], "")
        candidate = category_fallbacks.get(row["oldPath"], "") if category_slug else ""
        browser = category_browser_audit["filters"].get(category_slug, {})
        if browser.get("http") == 200 and browser.get("selected") is True and browser.get("resultCount", 0) > 0 and browser.get("pageErrors") == 0:
            target = category_fallback = candidate
    if row["oldPath"] in SAME_PATH_CMS_TARGETS:
        action = "same-path-cms-production-pending"
        config = "no"
    elif row["oldPath"] in APPROVED_EVENT_PAGE_TARGETS:
        action = "approved-event-page-redirect"
        config = "yes"
    elif row["oldPath"] in BROWSE_INDEX_TARGETS:
        action = "approved-browse-index-redirect"
        config = "yes"
    elif row["oldPath"] in TRIPS_FALLBACK_TARGETS:
        action = "approved-trips-fallback-redirect"
        config = "yes"
    elif row["clearReplacementClass"] in ("same-listed-path", "same-path-existing-empty-category"):
        action = "retain-same-path"
        config = "no"
    elif row["clearReplacementClass"]:
        action = "redirect-candidate-needs-validation"
        config = "yes"
    elif category_fallback:
        action = "temporary-category-redirect"
        config = "yes"
    elif date_category_fallback:
        action = "temporary-date-category-redirect"
        config = "yes"
    elif row["mappingClass"] == "category-fallback-ready":
        action = "review-browse-fallback"
        config = "pending"
    else:
        action = "target-decision-needed"
        config = "pending"
    evidence = "legacy-date-category-audit" if date_category_fallback else "browser-verified-category-fallback" if category_fallback else row["clearReplacementClass"] or row["mappingClass"]
    validation = "target-200-self-canonical" if row["clearReplacementClass"] in ("same-path-existing-empty-category", "reviewed-team-index-fallback") else ("path-listed-target-needs-content-check" if row["clearReplacementClass"] else "date-category-empty-production-pending" if date_category_fallback and row["mappingClass"] == "category-fallback-empty-category" else "date-category-production-pending" if date_category_fallback else "filter-200-nonempty-redirect-not-live" if category_fallback else "code-approved-production-pending" if content_review == "approved-content-only-parent" else "editorial-review-pending" if content_event else "decision-pending")
    note = (EXCLUDED_LEGACY_EVENT_SLUGS[content_event["slug"]] if content_review == "excluded-legacy-campaign" else "temporary browsing fallback; not an equivalent Event page; revisit after editorial review" if category_fallback else "draft and hidden on old site; validate current offer and copy before a target or redirect is approved" if content_review == "needs-current-offer-review" else "approved content-only parent in code; validate indexability on named production") if content_event else ("temporary category fallback; category currently has no active trips" if date_category_fallback and row["mappingClass"] == "category-fallback-empty-category" else "temporary category fallback for historical Date; not an equivalent occurrence" if date_category_fallback else row["reasonWithoutClearReplacement"])
    if row["oldPath"] in APPROVED_EVENT_PAGE_TARGETS:
        evidence, validation, note = "user-approved-event-page", "approved-event-page-production-pending", "Published Event target; absent from saved new sitemap; verify live route and robots"
    elif row["oldPath"] in BROWSE_INDEX_TARGETS:
        evidence, validation, note = "user-approved-browse-index", "browse-index-production-pending", "Trip catalogue is the approved browse successor; verify legacy-host redirect"
    elif row["oldPath"] in TRIPS_FALLBACK_TARGETS:
        evidence, validation, note = "user-approved-trips-fallback", "trips-fallback-production-pending", "Broad trip-catalogue fallback; verify migrated legacy-host route"
    elif row["oldPath"] in SAME_PATH_CMS_TARGETS:
        evidence, validation, note = "published-cms-seed", "same-path-cms-production-pending", "Published CMS Page seeded on devel; verify same-path 200 and sitemap after deployment"
    overview.append({
        "sitemapsCheckedAtUtc": refreshed_at,
        "oldUrl": row["oldUrl"],
        "oldPath": row["oldPath"],
        "sourceSet": "old-sitemap" if row["inOldSitemap"] == "true" else "future-date-discovered-on-old-event-page",
        "targetCandidate": target,
        "targetOnNamedProduction": "https://rb-github.vercel.app" + target if target and target.startswith("/") else "",
        "action": action,
        "needsRedirectConfiguration": config,
        "mappingEvidence": evidence,
        "contentSourceRecord": f"events/{content_event['slug']}" if content_event else "",
        "contentSourceSeedState": content_event.get("state", "") if content_event else "",
        "contentReviewStatus": content_review,
        "categoryTargetResultCount": category_browser_audit["filters"][category_fallback.split("category=", 1)[1]]["resultCount"] if category_fallback else "",
        "categoryTargetCheckedAtUtc": category_browser_audit["checkedAtUtc"] if category_fallback else "",
        "candidateInNewSitemap": str(bool(target) and key(target) in new_keys).lower(),
        "validationStatus": validation,
        "reviewNote": note,
    })
with (OUT / "legacy-redirect-overview.csv").open("w", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=list(overview[0]), lineterminator="\n")
    writer.writeheader()
    writer.writerows(overview)

not_clear = [row for row in crosswalk if row["inOldSitemap"] == "true" and not row["clearReplacementClass"]]
with (OUT / "old-urls-without-clear-replacement.csv").open("w", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=list(crosswalk[0]), lineterminator="\n")
    writer.writeheader()
    writer.writerows(not_clear)

missing_lines = ["# Old sitemap URLs without a clear new replacement", "",
                 "These are old sitemap URLs without a same-listed-path or identity-backed, sitemap-listed new target. Some have broader category or archive candidates that require review. A missing replacement here does not imply the content should be deleted.", ""]
for current_family in sorted({row["oldFamily"] for row in not_clear}):
    group = sorted((row for row in not_clear if row["oldFamily"] == current_family), key=lambda row: row["oldPath"])
    missing_lines.extend([f"## `{current_family}` — {len(group)}", ""])
    for item in group:
        note = item["reasonWithoutClearReplacement"]
        missing_lines.append(f"- `{item['oldPath']}` — {note}" +
                             (f"; candidate `{item['candidateTarget']}`" if item["candidateTarget"] else ""))
    missing_lines.append("")
(OUT / "without-clear-replacement.md").write_text("\n".join(missing_lines))

old_families = Counter(family(url) for url in old_urls)
new_families = Counter(family(url) for url in new_urls)
unchanged = sorted(old_keys & new_keys)
ready_present = sum(key(row["candidateTarget"]) in new_keys for row in tier1_rows)
clear_counts = Counter(row["clearReplacementClass"] for row in crosswalk if row["inOldSitemap"] == "true")
not_clear_families = Counter(row["oldFamily"] for row in not_clear)
new_saved = sitemap_urls(ROOT / ".scratch/legacy-expiry-audit/new-sitemap-hub-check.xml")
new_additions = sorted(new_keys - {key(url) for url in new_saved})
actions = Counter(row["action"] for row in overview)
dated_additions = sum("?date=" in url for url in new_additions)

lines = [
    f"# Live Rockbusters sitemap comparison — {refreshed_at[:10]}",
    "",
    f"Sources: `https://rockbusters.net/sitemap.xml` and `https://rb-github.vercel.app/sitemap.xml`, last checked at {refreshed_at} UTC. Local XML copies and the [{len(crosswalk)}-row crosswalk](old-to-new-crosswalk.csv) are in this folder. The crosswalk includes {len(old_urls)} listed old URLs plus 51 future Event Date URLs found on legacy Event pages in the prior audit.",
    "",
    f"Old sitemap: **{len(old_urls)}** unique `<loc>` entries, all path URLs. New sitemap: **{len(new_urls)}** unique `<loc>` entries, including **{sum(bool(urlparse(url).query) for url in new_urls)}** dated `?date=` URLs. Counts are sitemap entries, not indexed-URL or redirect counts.",
    "",
    "| Old route family | Old URLs | New route family | New URLs |",
    "|---|---:|---|---:|",
    f"| `/event` + `/event-date` | {old_families['/event']+old_families['/event-date']} | `/trips` | {new_families['/trips']} |",
    f"| `/location` | {old_families['/location']} | `/destinations` | {new_families['/destinations']} |",
    f"| `/team-member` | {old_families['/team-member']} | `/team` | {new_families['/team']} |",
    f"| `/blog` | {old_families['/blog']} | `/blog` | {new_families['/blog']} |",
    f"| Other: `/`, contact, guiding, partner, test-center, terms | {sum(count for name,count in old_families.items() if name not in ['/event','/event-date','/location','/team-member','/blog'])} | Other: `/`, programs, calendar, CMS pages, contact | {sum(count for name,count in new_families.items() if name not in ['/trips','/destinations','/team','/blog'])} |",
    "",
    f"**{len(unchanged)} old paths** also appear in the new sitemap: homepage, contact, and {len(unchanged)-2} blog paths. This means the path survives in the sitemap; it does not yet prove content equivalence or correct legacy-host behavior.",
    "",
    f"The existing Tier 1 sheet has **{len(tier1_rows)} exact candidates** (51 future Date URLs and seven Event URLs); **{ready_present}** candidate targets appear in the live new sitemap. These are target-presence checks, not proof that the old sources redirect or that every target serves equivalent content and a correct canonical.",
    "",
    f"For the **165 URLs actually listed in the old sitemap**, **{165-len(not_clear)} have a clear replacement** using saved identity evidence, the same path/slug, or a reviewed browse successor. The [remaining {len(not_clear)} URLs](old-urls-without-clear-replacement.csv) lack a sitemap-listed equivalent; {actions['temporary-category-redirect']+actions['temporary-date-category-redirect']} have temporary category targets, {actions['approved-event-page-redirect']} have approved Event-page targets absent from the saved new sitemap, {actions['approved-trips-fallback-redirect']} use the broader `/trips` index, and one has a same-path CMS page seeded in devel. Clear replacement counts: seven verified Tier 1 Event identities, 17 historical equivalent Variant targets, 22 original same-listed paths, 45 same-slug Location/Guide detail records (32 Locations, 13 Guides), four browse-index successors, two existing empty blog categories at their same path, and five missing Guide URLs approved for `/team`. The blog category pages and `/team` returned 200 with self canonicals on the named production site. Other individual content and HTTP checks remain open.",
    "",
    f"The [single shareable redirect overview](legacy-redirect-overview.csv) covers all {len(overview)} old URLs: {actions['redirect-candidate-needs-validation']} earlier path-changing candidates, {actions['temporary-category-redirect']} temporary Event-to-category redirects, {actions['temporary-date-category-redirect']} temporary historical Date-to-category redirects, {actions['approved-event-page-redirect']} newly approved Event-page redirects, {actions['approved-browse-index-redirect']} approved Event browse-index redirects, {actions['approved-trips-fallback-redirect']} broader `/trips` fallbacks, {actions['retain-same-path']} existing same-path URLs, and one same-path CMS page pending named-production validation. No old sitemap URL lacks a target candidate. `needsRedirectConfiguration=yes` marks work that still needs deployment or external configuration and live verification; it does not claim a redirect is live.",
    "",
    "No clear replacement by old family: " + ", ".join(f"`{family}` {count}" for family, count in sorted(not_clear_families.items())) + ".",
    "",
    f"Of the 54 historical dated leaves listed in the old sitemap, the saved audit marks 17 content-equivalent Variant candidates whose URLs are in the new sitemap and 37 temporary category-browsing redirects. Seven of those category filters currently have no active trips and need content review. Category-filter query URLs are not sitemap entries by design, so their route and result content still need direct checks. For the 29 old Event detail pages, seven are in Tier 1; the remaining old Events now have user-approved Event-page, category, or trip-index destinations. Their old-source and final-target HTTP behavior still needs review. The remaining 82 old site URLs still need group-by-group redirect review, even though {len(unchanged)} retain the same listed path.",
    "",
    f"The saved 15 September new sitemap snapshot had {len(new_saved)} entries. The live sitemap has {len(new_additions)} more entries: {dated_additions} dated selections and {len(new_additions)-dated_additions} page paths. New URLs since that snapshot: " + ", ".join(f"`{path}`" for path in new_additions) + f". The old sitemap is unchanged from the saved {len(old_urls)}-URL copy.",
    "",
    "## Consolidated task boundary",
    "",
    "Use the older generated-HTML comparison for content lineage and design references, then use the newer legacy-expiry audit as the URL identity and redirect candidate inventory. This live comparison is the current entry point for both tasks. The generated HTML is not the deployed Payload site, so HTML-file similarity must not establish a redirect target by itself.",
    "",
    f"The next review is content and routing validation: check each Tier 1 source/target pair for old-source status, final 200 response, equivalent content, canonical and robots behavior; then review the 54 historical dated leaves, {len(unchanged)} non-trip unchanged paths, and 82 other-site URLs. Search Console data is still needed to prioritize indexed or traffic-bearing legacy URLs.",
    "",
    "Related board tasks: `aea8ff52-74d0-433d-8f33-db92e08e7362` (generated HTML/legacy content comparison) and `8d966e2a-b385-4691-a8e7-4fa73fe4e7ba` (legacy URL redirects).",
    "",
]
(OUT / "baseline.md").write_text("\n".join(lines))
print(f"old={len(old_urls)} new={len(new_urls)} clear_old={len(old_urls)-len(not_clear)} not_clear_old={len(not_clear)} tier1_targets_present={ready_present}/{len(tier1_rows)} crosswalk={len(crosswalk)}")
