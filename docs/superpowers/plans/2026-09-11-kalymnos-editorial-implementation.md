# Kalymnos editorial customization implementation

Status: implemented and locally verified; human visual/editorial signoff pending. Branch: `feature/kalymnos-section-content`.
Follow-up to https://app.workstreams.ai/teams/S_ZYh417Os/board/AceE0P/tasks/a0cca40c-12bf-4d82-a969-a0d4b776bd2b

## Outcome and scope
Make all Kalymnos reference copy editable and present in its intended trip-detail section, without replacing the full layout. Pilot Event 8 / Event Date 745 (26 September–10 October 2026). Preserve existing images, reviewed hero placement, dark gallery, commerce facts and saved layouts. This is an authorized local editorial demo, not canonical seed promotion or production deployment. Other 25 designs remain an inventory and later rollout scope.

## Decisions
Selected occurrence editorial overrides Event editorial defaults, which override existing content/shared defaults. Explicit custom block text wins when supplied; automatic-layout placeholder labels must not override authored copy. Omitted fields inherit; explicit clear flags clear individual text fields; explicit hide controls hide sections. Clearing an override restores inheritance. Existing source-preserving prose remains authoritative for its bodies. Occurrence overrides may hold typed copies of existing content structures; never a generic JSON/HTML blob.

Headings support ordered text segments with accent and break-before flags. Segments concatenate without inserted spaces, allowing accents inside a word, multiple emphasized phrases and deliberate line breaks. Text is escaped React content; accent uses the semantic theme token. Editors cannot inject CSS/HTML. Plain headings and old consumers retain fallbacks.

Event Date editorial scope is a deliberate extension of ADR-0005, justified by six differently branded destinations sharing Event 8. Record this in an ADR; do not duplicate Events. Commercial date/location/guide/price/capacity state remains independent and authoritative.

## Delivery ownership and dependencies
1. Root creates task/branch, preserves dirty baseline and records decisions.
2. Schema agent: reusable typed editorial fields on Events/Event Dates, pure resolution and scope projection, tests. No database writes.
3. Heading agent (parallel): safe text segment primitive and optional presentation props on existing section components, focused tests.
4. Content agent (parallel): extract original HTML into portable manifest, provenance and reversible guarded local importer; preserve prior pilot edits with stale-value preconditions. Do not apply until root reviews.
5. Root integrates schema and headings through queries, shared selected occurrence context, automatic/default and custom block paths. Generate types and tracked additive migration. Agent scopes remain disjoint; no agent commits or writes externally.
6. Root reviews importer, applies migration only to guarded local dev/test targets, dry-runs and applies Date745 content, performs independent read-back and browser QA.
7. Independent code-review agents assess standards/spec after implementation; root resolves findings, commits branch, updates board with accurate acceptance and remaining limits.

## Implementation sequence
A. Add editorial contract, inheritance/clear/hide semantics and safe heading segments; verify gallery and audience first.
B. Bind overview, dates, gallery, audience, learning, programme/comparison, venue, team, reviews, logistics/package, FAQ and closing CTA. Preserve shared component variants and theme tokens.
C. Add only missing reference structures: six overview facts with subtitles, six-row daily timetable, four practical cards, occurrence venue text/facts, package content and CTA labels. Use existing audience/pillars/comparison/FAQ/guide data where possible. Keep unsupported other-design structural variants deferred.
D. Move prior Event8 Kalymnos pilot fields to Date745 editorial and restore parent fields only if they exactly match recorded pilot values. Preserve unmatched subsequent edits and all unrelated content; report conflicts. Remove only exact duplicate supplementary passages now rendered in place. Keep preview testimonials explicitly identified; never claim verification.
E. Keep actual selected occurrence in hero, facts, summary and booking. One-week and other-destination runs must not inherit Kalymnos-specific pilot text. No mutations to price, capacity, VAT, dates, media or relationships.

## Migration and content safety
Tracked additive schema migration plus generated types; existing fixtures/seed compatible with absent optional fields. Importer supplies dry-run, apply, check, rollback and idempotence with before/after receipts. No production hosts, secrets, environment dumps or full SDK/error outputs. Existing local demo records retain deterministic identification and cleanup. Canonical seed promotion deferred.

## QA gates
- Pure resolution: Event/Date precedence, no leakage, empty/inherit/reset/clear/hide, explicit custom block precedence and source-body preservation.
- Heading rendering: substring accents, adjacent segments with no accidental spaces, multiple accents, line breaks, escaped hostile text, plain fallback; both themes.
- Meaningful rendering/query tests: editorial fields fetched, every section reaches its intended renderer, content counts, timetable/comparison, no duplicate source rendering, current booking links and sold-out inquiry.
- Guarded migration up/read-back; optional fields do not break existing records; importer second run no-op and stale-input protection.
- Browser desktop 1440 and mobile390: Date745, one-week Kalymnos, non-Kalymnos Event8, sparse Event and existing custom layout. Verify actual resolved date ID, all reference headings/bodies/items/accents, CMS edit/read-back, image loading, no overflow/overlap and preserved hero buttons/gallery background. URL alone does not prove selection for past dates.
- Typecheck, scoped lint, theme checks, focused tests; full configured suite once after target guards. Record baseline/unrelated failures separately, do not falsely claim a green suite.
- Root owns decisions, integration and QA. Automated checks do not substitute for section-by-section visual comparison. Human final visual signoff remains open.

## Later rollout
After Kalymnos acceptance, resolve the three catalogue branding ambiguities and inactive full-route duplicate from the audit. Then pilot programme/companion/logistics exceptions and batch remaining designs by Event/occurrence using manifests and source provenance. No bulk enrichment in this branch.

## Execution log
- Created separate branch retaining pre-existing work; launched three bounded agents (contract, presentation, content). Full audit and 26-page mapping retained alongside this plan.


## Delivered implementation and QA

Follow-up task: https://app.workstreams.ai/teams/S_ZYh417Os/board/AceE0P/tasks/21751f02-0f2b-4c53-8acc-b0af18c56ff0

- Three agents delivered the typed contract/resolver, shared heading primitive/migration, and portable reference/importer. Root integrated all public blocks, made ownership decisions and performed browser QA; independent standards/spec reviews found and drove corrections to inheritance, source targeting, independent package rendering, intro binding and live commercial text.
- Schema supports Event defaults and selected Date overrides, semantic section keys, explicit visibility, clear/reset, safe adjacent heading segments and no full-layout replacement. Nested itinerary media/transport airport editing was removed after review; source relationships remain authoritative. Already-created unused nullable database structures remain rather than destructively rewriting an applied migration.
- New additive editorial migration and prior summary migration applied to isolated local development/test targets. Event and Event Date counts unchanged by schema migrations. Two missing older prerequisite migrations were subsequently reconciled in test only.
- Imported Date745 content and restored12 parent Event content fields only where exact pilot preconditions matched; zero subsequent edits skipped. Nine earlier Event-wide preview FAQ/review rows deactivated, retained for rollback; occurrence arrays now supply them. Commercial values, imagery and source relationships independently read back unchanged.
- Refresh added explicit dynamic placeholders for prominent price/capacity/location/coach facts, comparison columns and closing price CTA. Original rollback before-state retained; later refresh provenance captured. Food inclusion conflict adapted consistently, testimonials visibly marked as previews.
- Full text verification:137/137 expected items present in intended sections. All14 reference section headers plus hero present; partial-word support tested, actual reference accent phrases visible. Existing images retained and all10 rendered images loaded after normal lazy-load activation.
- Browser matrix:1440px and390px for Date745, one-week Date651, IstriaDate717, sparse DeepBlue and saved Dolomite layout. All10 responses200, oneH1, no page errors/horizontal overflow/missing images/raw placeholders. Kalymnos content absent from other occurrences. Desktop hero buttons72px above hero bottom; gallery backgroundrgb(13,13,13).
- Transactional Payload CMS QA saved/read back accented heading parts, clear/hide, override removal/inheritance and explicit show; rolled back and independently verified the whole original Date745 unchanged. No QA demo records persisted.
-65 isolated unit/render/query tests pass. TypeScript, scoped ESLint (zero errors; dynamic importer warnings only), themeCSS and231-token registry checks pass. `git diff --check` passes.
- Full integration first run310/402: most failures were missing older test schema columns. Reconciled additive prerequisites and confirmed all9 Event tests pass; broad rerun394/402 passing, eight remaining registry/query/renderer test failures. These are recorded as a full-suite limitation; no claim of a fully green integration suite. Full e2e not run: existing config launches its server using local dev environment; targeted browser matrix plus isolated tests used instead of risking fixture writes into the development catalogue.

Evidence: `.scratch/kalymnos-editorial-qa/desktop.json`, `matrix.json`, screenshots, `cms-edit-result.json`; local importer receipts in `.scratch/kalymnos-editorial-745/`. Portable reference, manifest, baseline, reversible runner and README are tracked under `scripts/data-import/kalymnos-editorial/`. [Editor guide](2026-09-11-trip-editorial-authoring.md).

No production deployment, remote database write, imagery replacement, canonical seed promotion or bulk enrichment performed. Remaining work after this delivery is human visual/editorial signoff and the explicitly deferred wider-catalogue rollout/branding decisions from the audit.

- Final CTA reconciliation: overview reuses authored closing booking text with live price interpolation; pricing summary retains the reference Book Your Spot label. Thirty relevant tests passed after this final copy adjustment.

Eight remaining full-suite failures were reproduced in the affected subset and traced to unchanged behavior against pre-branch `13287d5`: two strict registry expectations, one paginated location fixture, three missing App Router test contexts and two undated Event fixtures. This is fixed-baseline source comparison plus current reproduction, not a clean-baseline full-suite run. See [integration limitations](2026-09-11-kalymnos-integration-limitations.md).
