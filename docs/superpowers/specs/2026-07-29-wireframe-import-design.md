# Wireframe Import from Drive — Design Spec

Status: ready-for-agent
Date: 2026-07-29

## Problem Statement

The rockbusters copywriter team maintains a Google Drive folder of maximalist HTML wireframes — one per page type — as the spec surface for the site rebuild. Only two of eleven page-type buckets have been imported into the repo so far (`docs/html/TEAM/`, `docs/html/TRIP-COURSE/`). The other nine buckets plus two loose root-level HTMLs live only in Drive, which means:

- The copywriter's spec isn't visible to code review or in-repo search.
- Scope-triage meetings between Jan and the copywriter must jump between Drive and code.
- Any AI agent working on the rebuild can't discover the wireframes without a Drive round-trip.

## Solution

Bulk-import every HTML wireframe from the Drive folder into `docs/html/`, following the same staging convention already established by `TEAM/` and `TRIP-COURSE/`. Strip base64-inlined images to keep repo size sane while preserving layout. Never overwrite files that already exist locally. Report what was imported, skipped, or failed.

Drive folder: <https://drive.google.com/drive/folders/1GtToGpK_32Wp92wBPBJpbm-j5ewc95KI>

## User Stories

1. As Jan, I want every wireframe bucket from Drive available in the repo, so that I can grep and read them alongside the code.
2. As Jan, I want the existing `TEAM/` and `TRIP-COURSE/` files left untouched, so that local edits and derivative work aren't clobbered by the Drive versions.
3. As Jan, I want directory names normalized (uppercase, dashes) to match the existing pattern, so that new buckets are consistent with `TEAM/` and `TRIP-COURSE/`.
4. As Jan, I want the two loose root-level HTMLs (`rodellar-destination.html`, `rockbusters_destination_page_structure.html`) filed under `docs/html/DESTINATIONS/`, so that all destination wireframes live together.
5. As Jan, I want existing verbatim-named subfolders (`Rockbusters trip landing page 10 BLOCKS/`) preserved rather than renamed, so that files already in the tree aren't fragmented across two paths.
6. As Jan, I want non-HTML files in the Drive folders (the `package.json`, `env-example.txt`, `README.md` in CHECK OUT) skipped, so that `docs/html/` stays a HTML-only spec surface.
7. As Jan, I want inline base64 image payloads stripped from every imported wireframe, so that the repo doesn't gain 40+MB of duplicate binary data.
8. As Jan, I want each stripped `<img>` tag preceded by an `<!-- IMG STRIPPED -->` comment and its `src` blanked, so that when the wireframe is opened in a browser the box still renders and it's obvious where images were.
9. As Jan, I want `data:` URLs inside inline `<style>` blocks and `style=""` attributes stripped too, so that no residual multi-MB payloads survive.
10. As Jan, I want the copywriter team (Martin + English-fluent colleague) able to spot immediately that the wireframes in the repo mirror the Drive tree, so that scope-triage meetings can happen against the in-repo copy.
11. As an AI agent picking up trip/destination-page implementation work later, I want every wireframe discoverable via `docs/html/{BUCKET}/`, so that I don't need Drive access to know what the copywriter drafted.
12. As Jan reviewing the import, I want a final report grouped by folder listing what was written, what was skipped (existed), what was skipped (non-HTML), and what failed to download, so that I can spot-check the outcome without diffing every file.
13. As Jan, I want anything that fails to download (e.g. an MCP payload-size failure on the 22MB trip landing page) surfaced in the report, so that I can sync those files manually from Drive.
14. As Jan, I want no commit created by the import — the changes land only in the working tree, so that I can review the diff and commit myself.

## Implementation Decisions

- **In scope: import only.** Wireframes are staged spec, not shipping code. Per the established content-production workflow, scope-triage against the imported wireframes and any Payload / Next.js implementation happen in later sessions.
- **Directory normalization rule.** Drive folder title → local dirname: uppercase; `[\s,/]+` collapses to a single `-`; trim leading/trailing `-`. Applied at every nesting level, with one exception (see next bullet).
- **Existing-folder override.** If the normalized target path doesn't exist but a verbatim-named sibling does (e.g. `docs/html/TRIP-COURSE/Rockbusters trip landing page 10 BLOCKS/`), reuse the existing verbatim path rather than creating a second normalized-named folder. Only new subfolders get the normalized name.
- **File-level skip-if-exists.** For every file, if the target path already contains a file with the same name, skip. Never overwrite. Preserves any local edits and mitigates the risk of clobbering derivative work.
- **Loose root-level HTMLs → DESTINATIONS.** `rodellar-destination.html` and `rockbusters_destination_page_structure.html` land in `docs/html/DESTINATIONS/`.
- **Non-HTML files: dropped.** Anything whose Drive `mimeType` isn't `text/html` (or whose extension isn't `.html`) is skipped and noted in the final report.
- **Base64 image stripping.**
  - Regex: substitute the entire `data:image/[^;]+;base64,[A-Za-z0-9+/=]+` payload — wherever it appears — with an empty string. Runs against three surfaces: `<img src="…">`, `url("…")` inside inline `<style>` blocks, and `style="…url(...)…"` attributes.
  - Each `<img>` tag is preceded by an `<!-- IMG STRIPPED -->` comment marker so a reader can immediately see where images were.
  - `src` is left as an empty string so the browser renders a broken-image placeholder, preserving layout.
- **No committed import script.** One-shot; transform runs inline in the executing session.
- **No git commit created.** The import writes into the working tree; Jan reviews the diff and commits manually.
- **Report format.** Per-folder summary at the end:
  - Written: N (list filenames)
  - Skipped — existed: N (list)
  - Skipped — non-HTML: N (list)
  - Failed — download error: N (list, with error)

### Target directory map

Drive title → local dirname:

| Drive title | Local dirname | Status |
|---|---|---|
| HOME PAGE | `HOME-PAGE` | new |
| DESTINATIONS | `DESTINATIONS` | new |
| DESTINATIONS/OTHER DESTINATIONS | `DESTINATIONS/OTHER-DESTINATIONS` | new |
| TEAM | `TEAM` | exists — files skipped |
| TRIP/COURSE | `TRIP-COURSE` | exists |
| TRIP/COURSE/Rockbusters trip landing page 10 BLOCKS | `TRIP-COURSE/Rockbusters trip landing page 10 BLOCKS` | exists (verbatim retained) |
| CATEGORIES | `CATEGORIES` | new |
| CONTACT | `CONTACT` | new |
| BLOG | `BLOG` | new |
| CHECK OUT | `CHECK-OUT` | new |
| THANKS PAGES | `THANKS-PAGES` | new |
| EMAILS BOOKING, RESERVATION, INQUIRY | `EMAILS-BOOKING-RESERVATION-INQUIRY` | new |
| TRIPS CLINICS CALENDAR | `TRIPS-CLINICS-CALENDAR` | new |

## Testing Decisions

- **No automated tests.** One-shot import; a test suite for code that runs once is ceremony. Verification is by visual inspection of `git diff` and by opening a sampled subset of imported wireframes in a browser.
- **Verification checklist for the executor:**
  - The final report shows non-zero writes for each of the nine new buckets.
  - `TEAM/` and `TRIP-COURSE/` files are listed under "skipped — existed" (import didn't clobber).
  - The two loose root-level HTMLs appear under `DESTINATIONS/` writes.
  - Spot-check three imported files in a browser: layout still renders (broken-image icons OK), no residual `data:` payloads (`grep -r "base64" docs/html/{NEW_BUCKET}` returns nothing).
  - No committed changes; only working-tree changes.

## Out of Scope

- **Scope triage.** Deciding which sections of each maximalist wireframe actually ship — separate session (Jan + copywriter meeting per the content-production workflow).
- **Payload schema changes.** No new collections or field additions are inferred from the wireframes here.
- **Next.js implementation.** No new routes, components, or pages are built from the imported wireframes.
- **Renaming existing verbatim subfolders.** `Rockbusters trip landing page 10 BLOCKS/` stays as-is.
- **Cleaning up stray files.** `.DS_Store` files in existing dirs are not removed.
- **Introducing git-lfs.** If wireframe sizes ever become a repo-size problem, that's a separate migration.
- **Domain-model updates.** No changes to `CONTEXT.md` or ADRs. The wireframes may hint at future terms but nothing gets promoted until discussed.

## Further Notes

- Two Drive files are large — `rockbusters_trip_landing_page.html` (22MB) and `rodellar-destination.html` (16MB). The MCP `download_file_content` tool response may exceed its practical payload ceiling on these. If a download fails, the file lands in the "failed" report bucket and Jan will sync it from Drive manually. The 22MB trip landing page is already present locally (as a 294KB version), so `skip-if-exists` will short-circuit it anyway.
- After the import lands, next likely session is a scope-triage meeting per the established content-production workflow — using the imported wireframes and the `docs/trip-page-meeting-worksheet.md` pattern (Keep/Trim/Drop + Structured/Free-form per section).
- Related: SEO page-mapping (old rockbusters.net URLs → new URLs) is the other half of the page rebuild — not blocking this import, but informs how routes for the new pages will be shaped when implementation gets picked up.
