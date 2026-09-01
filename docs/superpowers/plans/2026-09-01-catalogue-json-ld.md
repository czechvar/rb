# Catalogue JSON-LD Structured Data (Implementation Plan)

Status: ready-for-agent
Execution: in-progress
Date: 2026-09-01
Spec: `docs/superpowers/specs/2026-09-01-catalogue-json-ld-design.md`
Workstreams task: `6dfba7c1-b7f5-4604-94e4-f84b22739fa3`
Branch: `feature/catalogue-jsonld`
Worktree: `/home/czechspekk/projects/xbusters/rb-github-jsonld`

## Goal

Publish dynamic schema.org JSON-LD on canonical catalogue detail pages using the
existing Payload catalogue data.

## Tasks

- [x] Create a clean sibling worktree and branch.
- [x] Fetch the Workstreams task and record the starting plan.
- [x] Research Payload/Next.js support for JSON-LD from primary sources.
- [x] Inspect catalogue collections, route components, and query helpers.
- [x] Implement reusable JSON-LD builders and script rendering.
- [x] Wire Trip, Trip Dates, Program, Location, and Guide routes.
- [x] Add tests for graph generation and script escaping.
- [x] Run targeted Vitest.
- [x] Run lint/build or document any blocker.
- [x] Review the diff and fix review findings.
- [x] Update Workstreams with final execution and QA notes.

## Execution Notes

- JSON-LD is derived in code; no Payload schema fields or migrations are planned.
- The route integration must render JSON-LD for both CMS-block layouts and
  fallback layouts.
- The first implementation slice targets detail pages only, not list pages,
  homepage, blog posts, or booking/account/admin pages.
- Guide email/phone stay private and must not enter structured data.
- FAQ/review JSON-LD is deferred until the route or block layer can guarantee
  the same FAQ/review content is visibly rendered.
- Review fixes applied: removed invented `validFrom`, added `mainEntity`,
  matched dates-page breadcrumbs to the visible Calendar trail, represented
  Locations as `Place` with `additionalType`, included gallery images, and moved
  the research note out of the specs folder.

## QA

- `pnpm exec vitest run --config ./vitest.config.mts tests/int/jsonld.int.spec.ts`
  passed: 5 tests.
- `pnpm run lint` passed with the existing warning set.
- `pnpm exec tsc --noEmit --pretty false` still reports existing test typing
  errors outside this branch; filtered output for changed JSON-LD/route files is
  empty.
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000 PAYLOAD_DISABLE_DB_PUSH=true pnpm run build`
  passed when run with the original checkout's safe local `DATABASE_URL`
  (`127.0.0.1`). The shell printed one pre-existing `.env` parsing warning while
  sourcing that file, but Next build completed successfully.
