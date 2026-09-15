#!/usr/bin/env python3
"""Record reviewed category/team fallback decisions in scratch overviews."""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUDIT = ROOT / ".scratch/legacy-expiry-audit/all-old-url-inventory.csv"
OLDER = ROOT / ".scratch/sitemap-redirect-mapping.csv"
BLOG_PATHS = {"/blog/category/bouldering", "/blog/category/video"}
TEAM_PATHS = {f"/team-member/{slug}" for slug in json.loads(
    (ROOT / "src/lib/legacy-redirect-decisions.json").read_text())["missingTeamMemberSlugs"]}


def read_csv(path):
    with path.open(newline="") as handle:
        reader = csv.DictReader(handle)
        return reader.fieldnames, list(reader)


def write_csv(path, fields, rows):
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


fields, rows = read_csv(AUDIT)
assert {row["oldPath"] for row in rows if row["oldPath"] in BLOG_PATHS} == BLOG_PATHS
assert {row["oldPath"] for row in rows if row["oldPath"] in TEAM_PATHS} == TEAM_PATHS
for row in rows:
    if row["oldPath"] in BLOG_PATHS:
        row["auditClassification"] = "existing-empty-blog-category"
        row["auditTargetCandidate"] = row["oldPath"]
        row["auditTargetStatus"] = "live-200-self-canonical-empty-category"
    elif row["oldPath"] in TEAM_PATHS:
        row["auditClassification"] = "missing-guide-team-index-fallback"
        row["auditTargetCandidate"] = "/team"
        row["auditTargetStatus"] = "reviewed-team-index-fallback"
write_csv(AUDIT, fields, rows)

fields, rows = read_csv(OLDER)
assert {row["source"] for row in rows if row["source"] in BLOG_PATHS} == BLOG_PATHS
assert {row["source"] for row in rows if row["source"] in TEAM_PATHS} == TEAM_PATHS
for row in rows:
    if row["source"] in BLOG_PATHS:
        row["classification"] = "same-path-existing-category"
        row["destination"] = row["source"]
        row["reason"] = "Existing empty Post Category on local and named production; route 200, self-canonical, links to /blog. Same path requires no old-to-new path redirect."
    elif row["source"] in TEAM_PATHS:
        row["classification"] = "team-index-fallback-ready"
        row["destination"] = "/team"
        row["reason"] = "Specific Guide detail URL absent from the new sitemap; user-approved /team fallback returns 200 and is self-canonical."
write_csv(OLDER, fields, rows)
print(f"marked={len(BLOG_PATHS)}-existing-blog-categories,{len(TEAM_PATHS)}-team-index-fallbacks")
