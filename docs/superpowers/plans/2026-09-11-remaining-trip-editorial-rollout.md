# Remaining trip editorial rollout

Status: ready-for-human. Local implementation and QA complete. Branch: feature/kalymnos-section-content. Baseline:1ec84ca.

## Scope and decisions
The user approved enriching all remaining25 reference designs after Kalymnos. Continue the same occurrence-specific editorial model, independent heading/eyebrow/intro controls, safe partial-word accents, unchanged imagery and actual commercial facts. These writes are reversible local design/demo content, not production publishing or canonical seed promotion.

Use primary-reference booking/date mappings from the26-page audit. Do not merge the title-alternative Events1/2/3 or inactive full-route Date789. Those are distinct records, not interchangeable content targets. Store copy on the exact25 Event Dates and preserve Event defaults, media, guide/location assignments, schedules, prices/currency/VAT/capacity and other editorial data. Past designs stay past: validate them with historical rendering fixtures without changing public date eligibility or dates.

## Delivery sequence and checklist gates
- [x] Refresh local catalogue and verify mapping scope; preserve Kalymnos and existing branch.
- [x] Extract/adapt11 standalone designs,5 España designs and9 Rock & Road designs in disjoint subagent batches.
- [x] Root implement minimal observed structural extensions: companion tables/related options, independently authored summary/facts strip, headed notices when a schedule is absent, heading-only galleries when no linked imagery exists.
- [x] Generate types and additive migration; guarded local development/test application; preserve all existing records.
- [x] Root review each manifest against source; explicitly record conflicts/adaptations, matched guides, preview testimonials and dynamic commercial fields.
- [x] Guarded transactional dry-run/apply per occurrence, with idempotence, before/after receipts and protected-field checks. Reject pre-existing nonempty editorial rather than overwrite editor work.
- [x] Independent read-back plus full expected-text and heading-accent checks for every25 occurrence, including historical fixtures where needed.
- [x] Desktop/mobile browser QA for all25 fixture pages and every currently selectable live URL; verify actual selectedDateId, source gaps rather than inventing images, no overflow and authoritative booking actions.
- [x] Regression: Kalymnos, sparse unmodified Event, saved custom layout; unit/type/lint/theme checks and isolated integration suite (known8 baseline failures recorded separately).
- [x] Independent standards/spec review, resolve introduced findings, commit branch and update board/read back checklist.

Each trip has separate manifest/review/applied/read-back/contentQA/browserQA gates. A board checkbox is complete only after all gates pass, not merely after a record is populated. Missing source imagery is recorded and retained; source copy is still rendered. No loose appendix qualifies as section content parity.

## Subagent instructions
Standalone agent owns only its11 reference+manifest files and extraction tooling. España agent owns only its5 files/tooling. Rock & Road agent owns only its9 files/tooling. All use existing typed editorial contracts plus root-agreed observed extensions; safe text only, no HTML/CSS/image copying. Root owns schema/integration/importer, database writes, task checklist and QA decisions. Subagents have no authority to commit, change relationships, mutate databases or post board messages. Later independent reviews focus on code/content they did not author.

## Source and factual policy
Exact source text and accent fragments remain in reference files; adaptations carry source/reason/output provenance. Prominent price, date, duration, capacity, place and coach facts use selected occurrence tokens. Other prices in comparison/reference prose are either matched to a real offering or replaced by non-price wording with a documented conflict. Testimonials remain visibly unverified design previews. Guide bios appear only for actually assigned guides; mismatches remain in provenance rather than manufacturing assignments. Meal/transport/certification claims are not blindly copied across contradictory catalogue facts.

## Per-trip delivery
| Date | Trip / source | Manifest | Reviewed | Applied | Read-back | Content QA | Browser QA |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 749 | PROJECT ESPANA/rockbusters_espana_chulilla.html | done | done | done | done | done | done |
| 751 | PROJECT ESPANA/rockbusters_espana_margalef.html | done | done | done | done | done | done |
| 748 | PROJECT ESPANA/rockbusters_espana_sella.html | done | done | done | done | done | done |
| 750 | PROJECT ESPANA/rockbusters_espana_siurana.html | done | done | done | done | done | done |
| 747 | PROJECT ESPANA/rockbusters_projectespana_fulltrip.html | done | done | done | done | done | done |
| 684 | ROCK & ROAD/event-date___ceuse-rock-road-europe-2026-09-12.html | done | done | done | done | done | done |
| 687 | ROCK & ROAD/event-date___frankenjura-rock-road-europe-2026-08-22.html | done | done | done | done | done | done |
| 683 | ROCK & ROAD/event-date___gorges-du-tarn-rock-road-europe-2026-09-19.html | done | done | done | done | done | done |
| 689 | ROCK & ROAD/event-date___labske-udoli-rock-road-europe-2026-08-15.html | done | done | done | done | done | done |
| 682 | ROCK & ROAD/event-date___margalef-rock-road-europe-2026-09-26.html | done | done | done | done | done | done |
| 685 | ROCK & ROAD/event-date___oltre-finale-rock-road-europe-2026-09-05.html | done | done | done | done | done | done |
| 688 | ROCK & ROAD/event-date___rock-road-europe-2026-08-15.html | done | done | done | done | done | done |
| 681 | ROCK & ROAD/event-date___rodellar-rock-road-europe-2026-10-03.html | done | done | done | done | done | done |
| 686 | ROCK & ROAD/event-date___zillertal-rock-road-europe-2026-08-29.html | done | done | done | done | done | done |
| 674 | rockbusters_amuerte_rodellar.html | done | done | done | done | done | done |
| 676 | rockbusters_beginnercourse_sella.html | done | done | done | done | done | done |
| 740 | rockbusters_betababes_cuenca.html | done | done | done | done | done | done |
| 714 | rockbusters_christmasretreat_sella.html | done | done | done | done | done | done |
| 774 | rockbusters_deepblue_mallorca.html | done | done | done | done | done | done |
| 704 | rockbusters_dolcevita_dolomites.html | done | done | done | done | done | done |
| 775 | rockbusters_finaleligure_sportclimbing_3.html | done | done | done | done | done | done |
| 717 | rockbusters_istria_easter.html | done | done | done | done | done | done |
| 701 | rockbusters_knotsstone_czech.html | done | done | done | done | done | done |
| 707 | rockbusters_leonidio_winter.html | done | done | done | done | done | done |
| 758 | rockbusters_projectX_rodellar.html | done | done | done | done | done | done |

## QA findings and resolutions

- Importer stopped before saving when omitted optional groups became null. Group-aware replacement now handles apply, refresh and rollback; five pure regression cases pass. All committed writes have per-date protected-field and durable read-back checks.
- Standalone and España manifests incorrectly cleared their newly authored overview array. Removed that clear flag; 101 manifest contract cases guard identity, clear/content conflicts, heading segments, commercial tokens, table alignment, safe links and preview attribution.
- Patxi's assigned catalogue name includes a role suffix. Matching now preserves his verified Guide 11 biography and applicable coaching copy. Unverified free follow-up plan offers remain contact-first. BetaBabes and Leonidio copy reflect actual assignment/capacity limits.
- Comparison rendering now preserves column positions when a CMS column label is blank; covered by a rendering regression test.
- Historical fixture query now includes the complete relevant occurrence set rather than truncating later dates at the first 100. The temporary route is excluded from delivery.

## Integration verification boundary

The isolated full integration run completed with 393/402 passing and nine failures, without unhandled errors. Eight are the previously documented registry, pagination, router-context and undated-fixture failures in `2026-09-11-kalymnos-integration-limitations.md`. The additional catalogue-facet failure was reproduced independently: 563 active upcoming test dates precede its 2030 fixture, while the existing query returns at most 500. The relevant query, resolver and test are unchanged against baseline `1ec84ca`; no unrelated cleanup or catalogue behavior changes were made. This is source-comparison plus isolated reproduction evidence, not a pristine-baseline full-suite run.

Full `pnpm lint` also scans existing ignored `.scratch` diagnostics and reports 41 errors there. Delivery lint excluding `.scratch/**` passes with existing warnings. TypeScript, theme registry, 176 editorial/render/manifest tests and 22 Node resolver/layout tests pass. The generic full e2e configuration is not used because its web server points at development data; the bounded, read-only desktop/mobile browser matrix provides the page-level verification for this rollout.

## Source imagery boundary

No imagery was imported or replaced. Existing gallery relationships remain intact. Events 49 (A MUERTE), 55 (Project X), and 62 (Knots & Stone) have no assigned gallery images, so their authored gallery heading/intro renders without fabricated photos. Other Events retain their shared catalogue galleries; venue-specific image selection is separate work.

## Review outcomes

Standards review identified one ordered-table alignment defect, now fixed and tested. Its nonblocking extraction-duplication observation remains: family-specific audit builders retain separate adaptation logic rather than introducing a broad refactor during content delivery. Repeated duration calculation was consolidated. Spec review identified Patxi's role-suffix identity mismatch and incomplete Rock & Road text assertions; both are fixed. Root expanded the final text pass to include short labels and tokens in every family. España overview paragraphs are now mapped into the structured overview body rather than an unsupported intro-only section.

## Final delivery evidence

- All 25 mapped occurrences populated locally; final receipt check passed on all 25. No parent Event, date, commercial, assignment or media fields changed. Kalymnos preservation passed independently.
- 25/25 final server-rendered text checks passed, covering 4,637 authored display strings.
- 86/86 final browser cases passed: 50 historical/current fixtures and 36 currently eligible public routes, at 1440 and 390 pixels. Checks include exact occurrence ID, copy, heading accent segments and hero line breaks, actual theme accent color, overflow, page errors and existing image loading. Earlier cold-image timeouts and two development HTTP500 responses passed subsequent checks; initial observations remain in the QA report. No persistent runtime failure remained in the final matrix.
- Temporary QA route removed; reusable guarded install/remove tooling and its development-only template remain checked in.
- Branch: `feature/kalymnos-section-content`. Local content only; no production import, push or deployment.
- Evidence: `.scratch/trip-editorial-rollout/qa/final-matrix.json`, `text-matrix.json`, `kalymnos-preservation.json`; per-date receipts in `.scratch/trip-editorial-rollout/receipts`.
- Board: https://app.workstreams.ai/teams/S_ZYh417Os/board/AceE0P/tasks/4dd007ef-50dd-4a73-bd22-aad772a77da5

## Local review links

Copy and heading controls are under **Event Dates → selected occurrence → Trip editorial copy**. Seven historical occurrences remain historical: their saved content is available in the CMS and QA artifacts; the public route correctly chooses an upcoming occurrence instead.

| Occurrence | Review |
| --- | --- |
| 749 — PROJECT ESPANA/rockbusters_espana_chulilla.html | [Public preview](http://localhost:4444/trips/climbing-trip-spain?date=749) |
| 751 — PROJECT ESPANA/rockbusters_espana_margalef.html | [Public preview](http://localhost:4444/trips/climbing-trip-spain?date=751) |
| 748 — PROJECT ESPANA/rockbusters_espana_sella.html | [Public preview](http://localhost:4444/trips/climbing-trip-spain?date=748) |
| 750 — PROJECT ESPANA/rockbusters_espana_siurana.html | [Public preview](http://localhost:4444/trips/climbing-trip-spain?date=750) |
| 747 — PROJECT ESPANA/rockbusters_projectespana_fulltrip.html | [Public preview](http://localhost:4444/trips/climbing-trip-spain?date=747) |
| 684 — ROCK & ROAD/event-date___ceuse-rock-road-europe-2026-09-12.html | [Public preview](http://localhost:4444/trips/europe-rock-climbing-trip?date=684) |
| 687 — ROCK & ROAD/event-date___frankenjura-rock-road-europe-2026-08-22.html | [CMS — historical](http://localhost:4444/admin/collections/event-dates/687) |
| 683 — ROCK & ROAD/event-date___gorges-du-tarn-rock-road-europe-2026-09-19.html | [Public preview](http://localhost:4444/trips/europe-rock-climbing-trip?date=683) |
| 689 — ROCK & ROAD/event-date___labske-udoli-rock-road-europe-2026-08-15.html | [CMS — historical](http://localhost:4444/admin/collections/event-dates/689) |
| 682 — ROCK & ROAD/event-date___margalef-rock-road-europe-2026-09-26.html | [Public preview](http://localhost:4444/trips/europe-rock-climbing-trip?date=682) |
| 685 — ROCK & ROAD/event-date___oltre-finale-rock-road-europe-2026-09-05.html | [CMS — historical](http://localhost:4444/admin/collections/event-dates/685) |
| 688 — ROCK & ROAD/event-date___rock-road-europe-2026-08-15.html | [CMS — historical](http://localhost:4444/admin/collections/event-dates/688) |
| 681 — ROCK & ROAD/event-date___rodellar-rock-road-europe-2026-10-03.html | [Public preview](http://localhost:4444/trips/europe-rock-climbing-trip?date=681) |
| 686 — ROCK & ROAD/event-date___zillertal-rock-road-europe-2026-08-29.html | [CMS — historical](http://localhost:4444/admin/collections/event-dates/686) |
| 674 — rockbusters_amuerte_rodellar.html | [Public preview](http://localhost:4444/trips/advanced-sport-climbing-course?date=674) |
| 676 — rockbusters_beginnercourse_sella.html | [Public preview](http://localhost:4444/trips/beginner-climbing-course?date=676) |
| 740 — rockbusters_betababes_cuenca.html | [Public preview](http://localhost:4444/trips/woman-climbing?date=740) |
| 714 — rockbusters_christmasretreat_sella.html | [Public preview](http://localhost:4444/trips/sport-climbing?date=714) |
| 774 — rockbusters_deepblue_mallorca.html | [CMS — historical](http://localhost:4444/admin/collections/event-dates/774) |
| 704 — rockbusters_dolcevita_dolomites.html | [CMS — historical](http://localhost:4444/admin/collections/event-dates/704) |
| 775 — rockbusters_finaleligure_sportclimbing_3.html | [Public preview](http://localhost:4444/trips/sport-climbing?date=775) |
| 717 — rockbusters_istria_easter.html | [Public preview](http://localhost:4444/trips/sport-climbing?date=717) |
| 701 — rockbusters_knotsstone_czech.html | [Public preview](http://localhost:4444/trips/knots-stone-czech-climbing-tradition?date=701) |
| 707 — rockbusters_leonidio_winter.html | [Public preview](http://localhost:4444/trips/sport-climbing?date=707) |
| 758 — rockbusters_projectX_rodellar.html | [Public preview](http://localhost:4444/trips/climb-work?date=758) |
