# Issue Tracker: Workstreams + Local Markdown

Board-level tasks for this repo live in **Workstreams.ai** and must be accessed
through the **Workstreams.ai - Xbusters** MCP connector whenever updating,
creating, or otherwise managing Xbusters board tasks. Repo-local specs, PRDs,
implementation plans, ADRs, and wayfinding artifacts live as markdown in this
repository. The Git remote is GitLab
(`git@gitlab.com:roman_roznovsky/xbusters.git`) and is used for code branches,
commits, and merge requests, not as the canonical agent issue tracker.

## Conventions

- **Specs / PRDs** → `docs/superpowers/specs/YYYY-MM-DD-<slug>-design.md` (16+ existing specs follow this pattern; use today's date and a kebab-case slug).
- **Plans** → `docs/superpowers/plans/YYYY-MM-DD-<slug>.md`.
- **Board tasks / delivery status** → Workstreams.ai Xbusters board, via the
  `Workstreams.ai - Xbusters` MCP connector.
- **Ad-hoc wayfinding / grilling artefacts** → `.scratch/<effort>/` (create if needed; not checked in unless explicitly staged).
- **Triage state** → a `Status:` line near the top of each file (see `triage-labels.md` for the role strings).
- **Comments and conversation history** → append to the bottom of the file under a `## Comments` heading.

## When a skill says "publish to the issue tracker"

For repo-local engineering work, create or update markdown under
`docs/superpowers/specs/` or `docs/superpowers/plans/`. For board-visible work,
create or update the corresponding Workstreams.ai task using the
`Workstreams.ai - Xbusters` MCP connector. Do not use the generic
Workstreams.ai connector, local helper scripts, or direct API calls for Xbusters
tracker writes unless the Xbusters MCP connector is unavailable and the fallback
is called out explicitly. Do not run `gh issue create`, and do not use GitLab
Issues unless the user explicitly asks for a GitLab issue mirror.

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

## GitLab Is Still Used For Code

- Branch management and commits use `git`.
- Merge requests and code review may use `glab mr` when needed.
- GitLab Issues are not the source of truth; if one exists there, treat it as a
  mirror or a note from a contributor, not the working document.
