# Issue tracker: Local Markdown

Issues, specs, and PRDs for this repo live as **local markdown files** — not GitHub Issues. The repo has a GitHub remote (`czechvar/rb`) but that's for code only; agent workflows around specs and triage stay local.

## Conventions

- **Specs / PRDs** → `docs/superpowers/specs/YYYY-MM-DD-<slug>-design.md` (16+ existing specs follow this pattern; use today's date and a kebab-case slug).
- **Plans** → `docs/superpowers/plans/YYYY-MM-DD-<slug>.md`.
- **Ad-hoc wayfinding / grilling artefacts** → `.scratch/<effort>/` (create if needed; not checked in unless explicitly staged).
- **Triage state** → a `Status:` line near the top of each file (see `triage-labels.md` for the role strings).
- **Comments and conversation history** → append to the bottom of the file under a `## Comments` heading.

## When a skill says "publish to the issue tracker"

Create a new markdown file under `docs/superpowers/specs/` (for specs/PRDs) or `docs/superpowers/plans/` (for plans). Do **not** run `gh issue create`.

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket, kept under `.scratch/<effort>/`.

- **Map**: `.scratch/<effort>/map.md` — the Notes / Decisions-so-far / Fog body.
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer to the map's Decisions-so-far in `map.md`.

## GitHub is still used for code

- Pull requests, code review, branch management → `gh pr` / `git` as usual.
- Issues on the GitHub side are **not** the source of truth; if one exists there, treat it as a mirror or a note from a contributor, not the working document.
