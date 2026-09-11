# Remaining integration failures — 2026-09-11

Root full-suite result: 394/402 passed, eight failed. A guarded rerun of the six affected test files reproduced the same eight failures, with no unhandled errors. Only an allowlisted reporter emitted classifications; no raw exception, request, environment or SDK objects were printed.

## Classification and baseline evidence

- **Block registry groups (2): stale strict catalogue-list expectations.** `tests/int/block-registry.int.spec.ts` compares hardcoded slug lists with catalogue-generated groups and surface lists. Both this test file and `src/blocks/index.ts` are byte-unchanged against fixed pre-branch commit `13287d5` (`devel`). The failures are assertion failures, not schema/runtime errors; this branch does not change the registry or registration metadata.
- **Country location resolver (1): fixture not guaranteed to appear in the first page.** The test inserts `Resolver Active Location ...`, requests Spain with limit 10, then expects the new ID in that first page. The unchanged resolver sorts all active matching records by name. Read-only test-DB verification found 13 active Spain locations sorting before the fixture prefix. Thus the assertion fails independently of trip editorial work. Test and resolver are unchanged against fixed pre-branch commit `13287d5` (`devel`).
- **Homepage generic layout + RenderBlocks (3): missing App Router test context.** All three failures classify as router-context invariants, not assertion failures. `BlockAction.tsx` calls `useRouter()` during static rendering; its code and the CTA/Hero callers and affected tests are unchanged. The sole new RenderBlocks context projection executes only when `context.trip` exists; these failing tests supply no trip context.
- **Featured homepage Events (1): outdated fixture assumption.** The test creates a published featured Event without an Event Date and expects a nonempty result. Existing `getFeaturedEventsForHomepage()` filters through `filterEventsWithUpcomingDates`; its function body is unchanged by this branch. The current query diff only adds editorial data to the trip-detail Event Date projection. Failure remains an assertion, not a database/validation exception.
- **Program linked trip blocks (1): undated Event fixture.** The failing test creates a published Event related to a Program without a scheduled Event Date, then expects its trip card. Existing catalogue queries/resolvers exclude Events without upcoming dates. Failure is the rendered HTML missing the asserted card. The test and trip-grid resolver are unchanged; the new trip context projection is inactive for this Program-only context.

## Verification boundary

This is current failing-subset reproduction plus source-diff and read-only fixture evidence. It is not a clean-`13287d5` full-suite execution. Evidence identifies existing test/fixture incompatibilities rather than a new editorial failure; unrelated fixes were intentionally not attempted. Safe runners/reporters: `limitations-run.mjs`, `limitations-reporter.mjs` in this directory.

Earlier 92-failure run was separately traced to missing prerequisite test-schema migrations (`20260910_173426`, `20260910_181448`). Their guarded additive application left record counts unchanged and all nine Event tests passed afterward. Do not conflate that resolved schema drift with these eight remaining failures.

Fixed-point recheck after root commit `df9ef4c`: all named registry/test/BlockAction/Hero/CTA/resolver files have zero diff against `13287d5`. `queries.ts` differs only by the trip-detail `editorial: true` select; `RenderBlocks.tsx` differs only by its trip-context projection. No test rerun was necessary for this source-comparison correction.
