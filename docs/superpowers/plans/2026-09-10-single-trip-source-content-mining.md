# Single trip view: source-preserving content mining and implementation handoff

Status: migration and frontend bindings implemented; design acceptance reopened
Date: 2026-09-10
Task: https://app.workstreams.ai/teams/S_ZYh417Os/board/AceE0P/tasks/a0cca40c-12bf-4d82-a969-a0d4b776bd2b

## Execution update — 2026-09-10

The user subsequently authorized proceeding with migration. This supersedes the Phase A-only execution boundary below for the audited local database. The implemented target is `events.tripDetail.sections[]` (`kind`, original `heading`, original Lexical `body`), recorded in ADR-0009. It preserves existing source paragraphs/lists rather than forcing them into invented learning groups or destination-bound itinerary rows. No source fields or existing arrays were replaced.

The consolidated working dataset and per-Event manifest are in `.scratch/event-detail-migration/`; see `scripts/data-import/event-detail/README.md` for reproducible commands, target guards and receipts. Schema migration `20260910_151403_event_trip_detail_sections` and the backfill added 96 exact-copy sections to 47 Events. Fifteen candidate sections remain for editors; all 65 Events are accounted for. Independent read-back verified all inserted bodies and unchanged captured source data. The canonical seed received the same 96 sections on 47 existing Events.

The later component/rendering work is implemented; current visual acceptance is tracked in docs/superpowers/plans/2026-09-10-single-trip-design-acceptance.md. The original Phase A prompt below is historical; do not rerun it as if mining were outstanding. Refresh live evidence before any further migration and preserve subsequent editor changes.

## Objective and authority

Mine existing Event and Event Date content into a reviewable structured-data proposal, then use approved mappings to support the single-trip design with existing components and CMS blocks. Editors own subsequent corrections and enrichment.

User decision: "we need to mine what we can to fill the data, but don't reinvent, don't modify - the editors will do that later". Existing wording, meaning, quantities, names and relationships are the source of truth for extraction. The HTML is a layout reference only. Do not use the internet or the HTML to supply missing commercial/editorial content.

This document is a plan, not permission to apply a database migration. The currently authorized execution boundary is read-only inventory/mining and local proposal artifacts. No INSERT, UPDATE, DELETE, DDL, seed import/export, schema push, CMS writes or media uploads against the inspected database. Future backfill means filling reviewed empty fields on existing records, which is a database write and requires a subsequent execution instruction. Do not start UI/schema implementation merely because later phases are described here.

## Start here

1. Read AGENTS.md, CONTEXT.md, docs/agents/issue-tracker.md and relevant ADRs 0003, 0005, 0006 and 0008. Before frontend work, read .agents/skills/design-system/SKILL.md and ADR-0002. ADR-0005 keeps Event marketing, Location venue information and Event Date occurrences/overrides distinct.
2. Establish checkout/branch and preserve dirty work. The audit ran on devel; do not assume that remains current.
3. Read the evidence below. Optional local evidence: .scratch/event-data-audit/{report.json,details.json,analysis.md,knots-stone-migration-preview.json}. Scratch files may be absent in another checkout; this plan must remain sufficient to restart.
4. Re-check the configured target without printing any environment value. The audit used `.env` and rejected the documented production host. This verifies non-production against that guard, not a named Neon branch. No production read was performed.
5. Use direct PostgreSQL with connection-level default_transaction_read_only=on, an explicit READ ONLY transaction and a statement timeout. Assert transaction_read_only=on before catalogue queries. Do not initialize Payload: startup may push schema. Select catalogue fields explicitly; exclude users, orders, authentication data and Guide contact details. Print only allowlisted scalar diagnostics, never connection/error/response objects.

## Evidence snapshot (2026-09-10, refresh before execution)

65 Events: 49 published, 16 draft. No matches for the inspected POC/smoke markers; this is not editorial certification.

| Coverage | Events |
|---|---:|
| Main rich text / catalogue title and teaser | 65 / 65 |
| Short description / hero media relationship | 52 / 64 |
| Gallery / Location / Event coach relationships | 26 / 39 / 45 |
| Accommodation / food copy | 39 / 39 |
| Included / excluded lists | 45 / 44 |
| Additional information sections | 46 |
| Highlights / audience cards / prerequisites | 3 each |
| Structured learning / itinerary days / equipment items | 0 each |
| Transport description | 0 |
| Custom layouts | 2 |
| Active Event-linked FAQ / review | 3 Events each |

Additional-info headings: What to bring 43, Need to know 24, Trip overview 16, Itinerary 7, Included details 2. Only 20 Events have heading nodes in their main Lexical content; heading splitting alone is insufficient.

789 Event Dates; 622 active flags. 67 active dates start on/after 2026-09-10 UTC across 12 Events; this is not a published-parent or remaining-availability count. 533 dates have non-null extra_content. 44 of those 67 upcoming dates have non-null logistics overrides. All-date meaningful override counts: accommodation 409, food 290, included 388, excluded 396, note 160.

The three Events with populated audience/highlights/prerequisites are sport-climbing-basics, deep-blue-psicobloc and dolomite-dolce-vita. The latter two have custom layouts. Preserve these contents/layouts.

### Pilot: knots-stone-czech-climbing-tradition

Observed Event id 62, September Event Date id 701; IDs are audit evidence, not portable identifiers. Resolve by slug and validated occurrence identity in each environment.

- Event Date: September 12–19 2026, EUR 1150, capacity 4, Pavel Ryva, Labské Údolí and Prague airport relations. Three dates total; September is the only upcoming date at the audit cutoff.
- Event prose: EUR 895, maximum 6, five days and different dates. Its schedule includes Day 6. Event-level coach relation: Benjamin Brochard.
- Date extra_content contains both revised facts and contradictory older paragraphs. Never promote the entire date body onto the Event.
- Structured inclusions: individualized coaching; guiding/local knowledge; safety equipment; shared accommodation. Exclusions: local transport, flights, insurance, food/drinks. Prose also claims meals and transport are included. Preserve both source statements and flag the conflict.
- No gallery links, structured learning/itinerary/equipment/audience/prerequisites, layout, linked FAQ or reviews. Hero media, accommodation, food and What to bring exist.
- Main Lexical node indices at audit: overview paragraphs 5–6; learning list 10; schedule paragraphs 14–16; requirements list 20; promotional list 24; anonymous quote 26. Validate heading/text context on refresh; node indices can move.
- Canonical seed contains the Event and its main content exactly matched the inspected DB. This was not a whole-seed equality check.

## Extraction contract

Allowed: copying existing paragraphs/list items verbatim; preserving Lexical formatting/links; grouping items under an existing explicit source heading; assigning an existing field to a compatible target; deriving a machine key from source identity. Presentation-only whitespace normalization may be used for matching, but retain original text in the proposal.

Not allowed: paraphrasing, summarizing, translating, correcting spelling, changing numbers/names, rewriting misleading copy, adding marketing headings, regrouping six learning bullets into invented Technique/Mental/Tactics pillars, inferring audience personas, converting a venue mention to a new relationship, inferring mandatory equipment or coaching duration, turning an anonymous quote into a verified Review, creating FAQs, fetching replacement images, or importing HTML-only copy.

Keep existing structured values and relationships untouched. A mismatch is a conflict, not permission to overwrite. Event Date facts remain scoped to that occurrence. Preserve date-specific logistics; do not flatten them into Event defaults. Missing content remains missing; a renderer can omit an empty section.

Use four explicit outcomes for each candidate:

- copy-exact: source and target semantics match; target empty; no known contradiction affecting the candidate.
- already-populated: target has data; no replacement proposed.
- editor-review: ambiguity, contradictions, unsupported grouping or incompatible target schema. Include exact excerpts and paths; omit from executable changes.
- unmapped: retain the source and explain why no destination is suitable.

Record provenance in an offline manifest, not a new CMS provenance collection. Each candidate includes Event slug; source collection/record identity and field/node path; original value; proposed target path/value; outcome; reason; and source/target snapshot preconditions. Environment values must never be included, even as hashes. Hashing catalogue content for stale-source detection is permitted.

## Phase A — Read-only extraction, executable independently

### A1. Refresh inventory

Read Events and their child arrays, direct relations, Event Dates/overrides and Event-linked FAQ/review counts. Distinguish NULL, whitespace/empty Lexical content and populated content. Include published/draft and past/active/upcoming breakdowns. Do not count images as verified binaries. Define the time cutoff explicitly and compare to the existing query helper before making rendering claims.

Deliver: local audit JSON and readable coverage report covering every Event, plus a source snapshot containing only needed catalogue content. Reconcile the refreshed totals with this snapshot and explain drift.

Done when: every inspected Event is accounted for and reads are proven read-only; no database mutation was attempted.

### A2. Pilot exact mining on Knots & Stone — blocked by A1

Build a pure extraction function against the snapshot. Prefer Lexical node structure, then existing additionalInfo headings/list boundaries; avoid regex parsing of rendered HTML. Extract the overview paragraphs and existing learning/requirements items verbatim. Preserve the three schedule paragraphs as source candidates; mark duration and schema ambiguity for editor review. Keep equipment advice exact and avoid assigning mandatory flags.

Compare Event, date extra_content and existing structured facts. Record the conflicts listed above and any new ones. Keep the six existing learning bullets as six items, not three invented pillars. Retain the anonymous quote as source prose. Do not populate unavailable gallery, audience, FAQ, review or comparison content.

Deliver: pilot manifest with source-to-target mapping, conflict register, unmapped-source register and a readable before/proposed view. Proposed field names are provisional until a later schema change is authorized; do not mislabel unsupported destinations as applicable Payload patches.

Done when: every proposed string can be traced to an exact source span and all excluded/ambiguous material is accounted for.

### A3. Mine the full catalogue — blocked by A2

Apply only proven patterns. Handle explicit headings, list nodes, additionalInfo and unstructured prose separately. Do not force one template across all Events. Preserve unsupported rich-text fragments intact in the unmapped report. Date overrides and extra_content must be represented in coverage even when no Event-level extraction is appropriate.

Deliver: one manifest per Event, deterministic combined index, counts by outcome and per-section fillability matrix. Record every Event including those with zero candidates. Use stable source-derived keys for reproducible output and replacement of local artifacts rather than append-only duplicates.

Done when: every Event is mapped or explicitly left for editors, existing populated fields remain untouched, and a second run against the same snapshot produces equivalent output.

### A4. Validate and hand back — blocked by A3

Use focused pure tests for exact copy/format preservation; blank headings; non-heading prose; lists; existing target preservation; conflicting Event/date claims; occurrence scoping; unsupported targets; and deterministic repeat runs. Validate that source relationships, media identifiers and commercial values remain unchanged. A candidate set must never silently discard original source material.

Deliver: coverage summary, tests/results, conflict list, proposed minimal schema delta, and the exact scope that could be applied later. Reference artifacts from the parent task only when explicitly instructed to post an execution update. Do not claim migration or UI completion.

STOP after A4. Report back to the parent/user; leave the database and canonical seed unchanged. Do not ask editors to resolve all conflicts before mining unaffected material.

## Phase B — Future implementation after an execution instruction

These are follow-on deliverables, not authorized database operations in Phase A.

### B1. Minimal schema and controlled backfill — depends on A4

Use existing fields first. Learning currently has two fixed boxes; add an optional repeatable form without deleting old fields. Itinerary days currently require destinationName; support source stages without inventing venues. Optional missing design content stays empty. Record durable ownership decisions in an ADR before schema changes, add tracked migrations and regenerate Payload types.

Backfill accepts a reviewed manifest and defaults to dry-run. Apply only copy-exact candidates with validated source and empty-target preconditions. Fail/skip stale candidates explicitly. Resolve natural keys in the target DB, preserve existing IDs/relationships and custom layouts, and make repeat applications no-ops. Never create duplicate Events, dates, locations, guides or media. Child-array rows are persistent migrated content and are database writes, even though no new Event is created.

Retain original content and metadata for rollback; a rollback must not erase subsequent editor work. Do not remove source fields or rewrite conflicting prose. Validate schema and backfill only on an explicitly approved isolated test target. Refresh the canonical seed later under the same scoped instruction, and ensure legacy-import reruns do not overwrite editor changes or restore superseded render inputs.

### B2. Single-date rendering context and hero — depends on B1 and date-selection design confirmation

Read src/lib/queries.ts, DetailHero, PricingSidebar, EventDatesList and booking controls. Resolve one explicitly identified occurrence for price/date/guide/venue/logistics across all sections. Preserve stored Event defaults; occurrence precedence is rendering behavior, not a relationship migration. Confirm the default selection/fallback policy before implementation. Remove Rodellar hardcoding through real bindings. Empty/full/past date states must not produce misleading booking links; capacity is not remainingSeats.

### B3. Section deliverables — depends on B1; commercial sections also depend on B2

Each row is a separately verifiable component/block deliverable. Reuse presentational components; keep source selection in resolvers and ordering/options in blocks. No all-purpose query or executable-code fields in Payload.

| Deliverable | Existing foundation | Acceptance |
|---|---|---|
| Hero and pricing summary | DetailHero, PricingSidebar, tripHero | Actual occurrence context; readable long titles; no hardcoded unrelated trip facts |
| Facts strip and overview | StatsBlock, TripPitchBlock, SectionIntro | Exact mined overview; facts bound once; missing values omitted |
| Dates list | tripDates, EventDatesList | Date rows and selection/booking links work; truthful availability/empty state |
| Gallery | GalleryBlock currentEvent source | Existing media only; optional leading-image variant; empty gallery omitted |
| Audience | AudienceCards | Existing/mined exact cards only; no invented personas; Event block binding |
| Learning | CurriculumPillars / WhatYouLearn | Variable number of source-backed items/groups; original headings preserved |
| Programme | DayByDayItinerary | Source stage labels and prose; no invented destination or duration |
| Comparison | No general table established | Implement only if source-backed rows exist; otherwise record as deferred/missing |
| Venue | LocationBlock and existing relationships | Accurate scoped selection; no newly inferred venue relations |
| Guides | Existing guide cards/social-proof blocks | Existing assigned records; no copied HTML biographies |
| Reviews and FAQ | ReviewGrid / FAQ blocks | Existing relevant records only; omit absent records |
| Logistics and equipment | TripLogistics, EventAccommodationLogistics, EssentialEquipment | Per-field overrides respected; exact supplied text; conflicts left to editors |
| Closing booking banner | BookingCTA / tripBookingCTA | Shared occurrence context; existing copy only; themed image variant if existing media supports it |

Synthesize the default section sequence from available structured content when layout is empty, preserving existing custom layouts. Until editor cleanup, legacy prose can remain available as fallback; do not silently drop unmapped text or publish duplicated extracted sections. Any change that removes old material from public rendering must have a reviewed coverage mapping.

Theme: reuse semantic tokens, headings, buttons, spacing, max-widths, card patterns and shared header. Use existing global 60px header behavior. A destination-style conditional jump nav is a proposal, not mandatory scope for mining. Existing page labels may be reused; new editorial headings belong to editors.

### B4. Verification and editorial handoff — depends on implemented B deliverables

Test resolver/date-selection and override behavior, idempotent backfill, stale-source refusal, source preservation and sparse content. Run relevant schema/type/theme checks and desktop/mobile checks for implemented sections on a safe target. Keep temporary fixtures explicitly marked with teardown. Verify custom layouts and fallback pages still work. Hand editors the exact conflict/missing-content register rather than changing copy to make screenshots match.

## Ready-to-send subagent prompt

Read docs/superpowers/plans/2026-09-10-single-trip-source-content-mining.md and execute Phase A only. Mine existing database catalogue content verbatim into local reviewable manifests. Honor read-only database enforcement; preserve all source text, nonempty targets, relationships and date overrides. Do not research online, invent content, correct copy, apply migrations, update CMS/seed data or implement the frontend. Cover every Event, pilot Knots & Stone first, then generalize only proven extraction patterns. Return artifact paths, coverage, exact-copy validation, unresolved conflicts and a minimal proposed schema delta. Stop after A4 and report to the parent. Do not post to Workstreams or launch additional agents without a separate instruction.


## Frontend execution — 2026-09-10

Subsequent user approval authorized iterative implementation with subagents and root QA, with explicit additive variants whenever extending existing components. Phase B2/B3 is implemented locally; the earlier Phase A-only prompt is historical.

- A shared request-scoped occurrence resolver supplies commercial facts, guide/venue relationships and meaningful logistics overrides. Invalid selections fall back safely; no-date/sold-out states offer inquiry. Availability is recomputed after asynchronous booked-seat counts resolve.
- Added CMS tripContent, tripFacts, tripVenue and tripTeam bindings. Extended hero, pricing, dates, gallery, venue, team, logistics and closing CTA through explicit variants. Existing custom layouts remain authoritative; structured Events without layouts use a synthesized registered-block sequence; legacy Events retain their composition.
- Exact mined Lexical copy renders as prose, list cards or a timeline. Existing structured fields remain available. The source remainder only subtracts exact sections actually rendered by that layout; partner/demo data and team-bullets-only content remain supported.
- Applied additive migration 20260910_155720_trip_layout_variants locally and applied both new migrations to the isolated local test database. No frontend content/relationship/media records created. Gallery rollback maps featureLead to grid while preserving media/order.
- ADR-0010 records the rendering/occurrence decision. In-memory variant previews are at /design-system?theme=rockbusters#trip-variants and /design-system?theme=snowbusters#trip-variants. They create no database records.
- Browser QA: Knots & Stone at desktop/mobile; existing custom layouts deep-blue-psicobloc and dolomite-dolce-vita; sparse legacy sport-climbing-basics; no-date structured multipitch-climbing-course; multi-date beginner-climbing-course with selected-row navigation. HTTP 200, one main H1 and no tested horizontal overflow. Both theme previews contain 14 specimens and pass desktop/mobile overflow checks. Screenshots: .scratch/trip-layout-qa/.
- Tests: 18 pure resolver/layout tests and 13 isolated rendering/query/content tests pass. TypeScript, changed-file ESLint and theme CSS/registry checks pass. Repository-wide lint has 36 errors outside changed files, including scratch scripts. Integration suite was rerun after correcting its missing schema migrations; final result recorded below.

Editorial limitations remain deliberate: no invented comparison rows, personas, itinerary groupings, biographies, reviews, FAQs or photographs. The pilot only has migrated overview, learning and equipment; disputed programme/requirements remain accessible in its source remainder for editors. Reference-layout completeness depends on editorial content, not automatic enrichment.


### Final review and verification boundary

Independent standards/correctness review found and resolved: asynchronous remaining-seat calculation, team-bullets-only omission, existing same-kind content omission in the overview variant, and gallery enum rollback with featureLead rows. The independent design/spec review confirmed additive scoped variants and recorded the editorial limitations above.

The first complete integration run after test-schema reconciliation passed 393/402 tests. Updated the trip-block registry and Event media-cache-tag expectations for this change. Remaining failures include pre-existing Location block-list expectations and homepage/programme fixtures without upcoming dates; the other failures involve a country fixture outside a bounded result set and static-render tests missing the router context required by unchanged BlockAction. These older failures are outside this delivery. Focused new tests pass (31 total). Full end-to-end suite was not run; the scoped read-only browser matrix above was exercised against the local application. No production database or deployment was changed.


### Follow-up: consistent default layout

After explicitly clearing Deep Blue's seven saved CMS blocks (local Event 2; other fields unchanged), the user still saw the old design. API read-back confirmed an empty layout: the route's sections.length gate selected the legacy fallback. Removed that gate and the duplicate legacy route composition. Every Event without a saved CMS layout now uses the shared template; missing structured sections stay absent, exact existing content remains available, and explicit custom layouts are still authoritative. ADR-0010 records this clarification. No content was invented or migrated by this rendering correction.


### Follow-up: theme typography and shared image gallery

Replaced local font-size literals/clamps in trip sections and booking presentations with existing semantic theme roles, including SectionIntro and the shared section-title helper. Pricing labels/values use small/body, price uses section, headings use hero/section/card roles, and prose uses body. Primary booking actions reuse the shared button recipe with at least 44px height. The old rem-based labels were below readable sizes under the theme's 10px root. No new typography scale was introduced.

Trip gallery featureLead now renders ImageTripCard variant=photo with the same image renderer, grid, sizing tokens and motion used by homepage/Trip Grid/Catalogue Results. The photo variant retains original media alt text and omits links/commercial labels. Removed the separate GalleryBlock CSS variant. Existing gallery grid/masonry/tiles and linked image cards remain supported.

Verification: 23 isolated rendering/query/route/gallery tests, typecheck, scoped lint and theme CSS/registry checks pass. Browser measured Deep Blue and Knots & Stone desktop/mobile against responsive theme sizes with no overflow. Homepage and trips overview retain keyboard-focusable shared cards. Both theme previews pass desktop/mobile overflow checks, reduced-motion disables image transforms, and changing the section-size token updates/restores the rendered heading. No database/content changes.
