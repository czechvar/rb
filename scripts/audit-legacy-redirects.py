#!/usr/bin/env python3
"""Validate redirect-overview rows against the named production deployment."""

import csv
import json
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

OVERVIEW = Path(__file__).resolve().parents[1] / ".scratch/sitemap-consolidation/legacy-redirect-overview.csv"
BASE_URL = "https://rb-github.vercel.app"
BASE_ORIGIN = urlparse(BASE_URL)
REDIRECT_STATUSES = {301, 302, 307, 308}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, file_pointer, code, message, headers, new_url):
        return None


opener = urllib.request.build_opener(NoRedirect)


def request(url, follow_redirects=False):
    active_opener = urllib.request.build_opener() if follow_redirects else opener
    request = urllib.request.Request(url, headers={"User-Agent": "Rockbusters redirect audit"})
    try:
        with active_opener.open(request, timeout=20) as response:
            response.read(1)
            return response.status, response.headers.get("Location"), response.geturl()
    except urllib.error.HTTPError as error:
        return error.code, error.headers.get("Location"), error.geturl()
    except (TimeoutError, urllib.error.URLError):
        return 0, None, None


def path_and_query(url):
    parsed = urlparse(url)
    return parsed.path + (f"?{parsed.query}" if parsed.query else "")


def audit(row):
    status, location, _ = request(BASE_URL + row["oldPath"])
    if row["needsRedirectConfiguration"] == "no":
        validation = "deployed-retained-path-200" if status == 200 else f"retained-path-http-{status}"
        return validation

    if status in REDIRECT_STATUSES and location:
        resolved = urljoin(BASE_URL, location)
        parsed = urlparse(resolved)
        if ((parsed.scheme, parsed.netloc) != (BASE_ORIGIN.scheme, BASE_ORIGIN.netloc)
                or path_and_query(resolved) != row["targetCandidate"]):
            return f"deployed-redirect-target-mismatch-http-{status}"
        final_status, _, final_url = request(resolved, follow_redirects=True)
        final = urlparse(final_url) if final_url else None
        if not final or (final.scheme, final.netloc) != (BASE_ORIGIN.scheme, BASE_ORIGIN.netloc):
            return f"deployed-{status}-final-origin-mismatch"
        return f"deployed-{status}-final-200" if final_status == 200 else f"deployed-{status}-final-http-{final_status}"

    return "redirect-missing-production-404" if status == 404 else f"redirect-source-http-{status}"


def main():
    with OVERVIEW.open(newline="") as handle:
        rows = list(csv.DictReader(handle))
    checked_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    with ThreadPoolExecutor(max_workers=8) as executor:
        validations = list(executor.map(audit, rows))
    for row, validation in zip(rows, validations):
        row["validationStatus"] = validation
        row["redirectCheckedAtUtc"] = checked_at
        if validation == "redirect-missing-production-404":
            row["reviewNote"] = "No matching redirect on named production; source returned 404"
        elif validation in ("deployed-307-final-200", "deployed-308-final-200"):
            row["reviewNote"] = {
                "Published Event target; absent from saved new sitemap; verify live route and robots":
                    "Redirect and final 200 verified on named production; target robots/indexability still require review",
                "Trip catalogue is the approved browse successor; verify legacy-host redirect":
                    "Trip catalogue is the approved browse successor; redirect and final 200 verified on named production",
                "Broad trip-catalogue fallback; verify migrated legacy-host route":
                    "Broad trip-catalogue fallback; redirect and final 200 verified on named production",
            }.get(row["reviewNote"], row["reviewNote"])
        elif validation == "deployed-retained-path-200" and row["reviewNote"] == "Published CMS Page seeded on devel; verify same-path 200 and sitemap after deployment":
            row["reviewNote"] = "Published CMS Page returned 200 on named production; sitemap presence is recorded separately"
    fieldnames = list(rows[0])
    if "redirectCheckedAtUtc" not in fieldnames:
        fieldnames.append("redirectCheckedAtUtc")
    temporary = OVERVIEW.with_suffix(".refresh.csv")
    with temporary.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    temporary.replace(OVERVIEW)
    counts = {value: validations.count(value) for value in sorted(set(validations))}
    print(json.dumps({"checkedAtUtc": checked_at, "rows": len(rows), "validationCounts": counts}))


if __name__ == "__main__":
    main()
