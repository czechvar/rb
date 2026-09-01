# AGENTS.md

This file gives coding agents the current operating context for this repository.
It is derived from `CLAUDE.md`, the implemented codebase, and a high-level architecture review.

## Project Overview

Rockbusters is a rebuild of `rockbusters.net`: a course/trip catalogue, booking, account, and lightweight commerce site for climbing trips. The project has moved past the greenfield state described at the top of `CLAUDE.md`; the current repository contains a working Next.js + Payload CMS application with public marketing pages, account/auth flows, booking, order administration, email hooks, tests, migrations, and draft payment-gateway code.

The primary product goal remains better on-site user handling than the legacy site: registration, verification, login, profile and address management, booking history, order detail, and admin-managed order lifecycle.

## Technical Summary

- Runtime: Next.js App Router, React, TypeScript.
- CMS/API: Payload CMS 3 using the local API from server components and server actions.
- Database: Postgres via `@payloadcms/db-postgres`, with Neon branches used for prod/dev/test separation.
- Media: Payload Media collection, Cloudflare R2 through the S3 storage plugin when all `R2_*` variables are present; local disk fallback otherwise.
- Email: `@payloadcms/email-resend` through `src/lib/email/adapter.ts`, with a console fallback when `RESEND_API_KEY` is absent.
- Auth: Payload auth on the `users` collection, with email verification, forgot/reset password, lockout, account pages, and server-action based forms.
- Tests: Vitest integration tests under `tests/int`; Playwright e2e tests under `tests/e2e`.
- Deployment: Vercel.

Useful commands:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm check:theme-registry
pnpm test:int
pnpm test:e2e
pnpm test
pnpm generate:types
pnpm generate:importmap
pnpm seed
```

## Architecture

The codebase is organized around three main surfaces:

- Public frontend: `src/app/(frontend)` renders marketing/catalogue pages for homepage, trips, programs, destinations, team, blog, calendar, auth, account, and booking.
- Payload admin/API: `src/app/(payload)` exposes Payload admin, REST, GraphQL, and GraphQL playground routes.
- Domain/CMS layer: `src/collections`, `src/lib`, `src/components`, and `src/payments` hold Payload collections, server-side query helpers, UI components, commerce behavior, and draft payment abstractions.

Core domain collections are registered in `src/payload.config.ts`:

- Admin/auth: `users`, `media`
- Catalogue: `events`, `event-dates`, `programs`, `categories`, `difficulties`, `locations`, `airports`, `guides`, `partners`, `faqs`, `reviews`
- Commerce/attribution: `orders`, `discount-codes`, `referrals`
- Content: `posts`, `post-categories`

The domain vocabulary in `CONTEXT.md` is authoritative:

- `Event` is the internal catalogue record; public UI usually says "Trip".
- `Event Date` is the purchasable scheduled occurrence.
- `Location` is the climbing venue.
- `Destination` is currently only a country-scoped browsing lens over Locations, not a collection.
- `Guide` is the team-member record. `Coach` is a role/marketing word, not a separate record.

Data fetching for public pages goes through `src/lib/queries.ts` where practical. Production uses Next tag-based caching via `src/lib/cache.ts`; dev and test bypass this cache so fixtures and local edits are visible immediately. Collection revalidation hooks use the same tag constants.

Block availability in Payload admin is catalogue-driven. `src/blocks/index.ts`
defines `blockCatalogue` metadata, category group exports, and `blocksFor(surface)`.
Blocks default to `compatibleWith: '*'`; use `notCompatibleWith` only for
surfaces where a block cannot currently resolve its required data. Collections
should import the derived surface arrays (`pageBlocks`, `eventLayoutBlocks`,
`programLayoutBlocks`, `locationLayoutBlocks`, `guideLayoutBlocks`,
`postLayoutBlocks`) instead of hand-maintaining block allowlists.

Booking is implemented as a logged-in server-action flow under `src/app/(frontend)/book/[eventDateId]`. Orders are created in `pending` state, shown in `/account/orders`, and managed in Payload admin. Order lifecycle behavior lives mostly in `src/collections/orders/*`:

- `state-machine.ts` defines the allowed order states and forward transitions.
- `hooks.ts` derives counts/totals, allocates order numbers, and stamps append-only notes.
- `capacity-hook.ts` protects booking creation with a Postgres advisory lock per event date.
- `state-hook.ts` validates transitions.
- `emails-hook.ts` dispatches order lifecycle emails.

Payments are not fully implemented. `src/payments/gateway.ts` and `src/payments/muzapay/*` are draft TypeScript ports inspired by the Snowbusters payment layer. Treat them as design scaffolding until gateway clients, persistence, webhook routes, and sandbox verification exist.

## Strengths

- The Payload collection model matches the business domain well and keeps most CMS/admin behavior close to the data it protects.
- Public routes, account/auth routes, booking, and Payload admin are separated with clear Next route groups.
- The order lifecycle has real guardrails: explicit states, hook-enforced transitions, append-only admin notes, and capacity locking.
- Test coverage is broad for the project stage, with integration tests for domain behavior and Playwright coverage for key frontend flows.
- Cache invalidation has a single tag vocabulary and deliberately avoids stale-cache pain in dev/test.
- Operational warnings in `CLAUDE.md` capture real production lessons, especially around Neon branch separation and Resend sandbox behavior.

## Risks And Tradeoffs

- `CLAUDE.md` is partially stale. The "no application code exists yet" and "proposed stack" sections no longer reflect the implemented application.
- `Events.ts` is a large page-shaped schema. It is pragmatic for CMS velocity, but it couples content modeling tightly to current page sections and can become hard to evolve.
- Business behavior is split between Payload hooks, server actions, and helpers. This is normal for Payload apps, but complex flows need tests because the call graph is not obvious from routes alone.
- Money is currently represented as numbers on orders and event dates, while the draft payment abstraction correctly models money as decimal strings. Resolve this before online payments.
- Payment gateway work is incomplete and explicitly unverified. Do not assume MuzaPay signing or token behavior is production-ready.
- Payload-generated types must be kept current after collection changes. Run `pnpm generate:types` when schemas change.
- Local, test, and production databases must stay isolated. A previous e2e run polluted production data when local `.env` pointed at the production Neon branch.

## Database And Environment Rules

Never point local `.env` or e2e runs at the production Neon branch.

- Production Vercel `DATABASE_URL`: production branch host `ep-weathered-pine-alvc3sdj`.
- Local dev `.env`: Neon `dev` branch.
- Integration tests `.env.test`: dedicated Neon `test` branch loaded by `vitest.setup.ts` with override enabled.

If a local `DATABASE_URL` contains `ep-weathered-pine-alvc3sdj`, stop and fix the environment before running the app, seed scripts, migrations, or tests.

For local email testing, normally leave `RESEND_API_KEY` unset so the console adapter prints links. The Resend sandbox sender `onboarding@resend.dev` only delivers to the verified account-owner email and can make local registration fail with a 403.

Required production environment variables are documented in `CLAUDE.md`; keep that list in sync when deployment-sensitive behavior changes.

## Data Hygiene Rules

Every task that creates database or media records must declare whether those
records are persistent seed data, temporary test fixtures, screenshot/demo
records, migration data, or uploaded media.

Temporary/demo records must be easy to identify and clean:

- Use deterministic markers such as a slug prefix, title prefix, or metadata
  marker, for example `poc-blocks-*`, `[POC]`, or `cms-block-system-poc`.
- Make seed/demo scripts idempotent: update existing marked records or replace
  them instead of creating duplicates.
- Include a cleanup path for POC/demo data: a script command, documented
  Payload-local-API cleanup, SQL cleanup, or test teardown.
- Keep integration/e2e fixtures in the test database and clean them by marker
  in `afterEach` or `afterAll`.
- Keep generated media fixtures named deterministically and delete or replace
  old generated files where practical.

Demo data may remain only when it is explicitly promoted to documented
seed/demo content. Before running seed, migration, screenshot, or test commands,
apply the production database guard from this file.

## Agent Workflow

Read these before non-trivial work:

1. `AGENTS.md`
2. `CONTEXT.md`
3. Relevant files in `docs/agents/`
4. Relevant specs/plans under `docs/superpowers/`
5. Relevant collection, route, hook, and test files

For design-system, theme-token, Snowbusters/Rockbusters variant, or
`/design-system` playground work, use the repo-local
`.agents/skills/design-system/SKILL.md` skill before editing.

## Agent Skills

### Issue tracker

Workstreams.ai is the board-level task tracker. Repo-local specs and plans live
as markdown under `docs/superpowers/`. GitLab is for code and merge requests,
not the canonical agent issue tracker. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical defaults: `needs-triage`, `needs-info`, `ready-for-agent`,
`ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` plus accepted/proposed ADRs in `docs/adr/` at
the repo root. See `docs/agents/domain.md`.

## Superpowers And Skill Routing

This repository uses the local `docs/superpowers/` convention for specs and plans. Existing plans were written for the older Superpowers-style workflow and commonly say:

- `superpowers:subagent-driven-development`
- `superpowers:executing-plans`

The current skill inventory is captured in `skills-lock.json` and maps that workflow to Matt Pocock engineering/productivity skills. Treat `docs/superpowers/specs/` as the source of product/design intent and `docs/superpowers/plans/` as task-by-task implementation history.

Recommended skill routing:

- Use `to-spec` when turning a rough request into a formal design/spec under `docs/superpowers/specs/`.
- Use `to-tickets` when breaking an approved spec into implementation tasks or plan files.
- Use `implement` for executing an existing plan.
- Use `tdd` for changes where tests should lead implementation; most existing plans expect failing tests first.
- Use `code-review` for reviewing diffs, quality, regressions, and missing tests.
- Use `codebase-design` for greenfield or major module design.
- Use `improve-codebase-architecture` for structural refactors and architecture cleanup.
- Use `domain-modeling` when domain language changes or a decision should become a glossary/ADR entry.
- Use `grill-with-docs` or `grilling` when requirements are ambiguous and need clarification before implementation.
- Use `wayfinder` for broad exploration where the next useful task is unclear; store wayfinding artifacts under `.scratch/<effort>/`.
- Use `research` for bounded repo or external investigation before proposing a solution.
- Use `prototype` for disposable validation of a risky approach.
- Use `diagnosing-bugs` for failure investigation and reproduction-first debugging.
- Use `triage` for classifying local specs/issues with the labels in `docs/agents/triage-labels.md`.
- Use `handoff` when stopping mid-work and leaving enough context for another agent.

Repository-specific additions:

- Use the Figma diagram/design skills for Figma URLs, FigJam diagrams, design-to-code, or code-to-Figma work.
- Use the local issue-tracker rules in `docs/agents/issue-tracker.md`; do not create GitHub Issues for project specs.
- Use `CONTEXT.md` and `docs/agents/domain.md` before changing domain terms.

## ADR Discipline

This repository keeps formal Architecture Decision Records in `docs/adr/`.
Specs and plans explain intended work; ADRs explain decisions that should remain
true after the implementation history fades.

Before architecture, domain, persistence, auth, booking, payment, cache, or
deployment work:

1. Read relevant ADRs in `docs/adr/`.
2. Check whether the proposed change conflicts with an accepted ADR.
3. If it conflicts, call that out explicitly before editing code.

Create or update an ADR when a task introduces, confirms, or changes a durable
decision, especially:

- domain vocabulary or entity boundaries,
- collection/schema ownership,
- order, booking, payment, discount, referral, or capacity behavior,
- auth/access-control behavior,
- caching/revalidation behavior,
- deployment/database/provider safety rules,
- a meaningful rejected alternative or tradeoff.

Use `docs/adr/template.md`. Name files as `NNNN-short-kebab-title.md`; if no
ADRs exist yet, start with `0001`. Prefer one concise ADR per decision. Do not
write ADRs for routine bug fixes, copy updates, or purely visual changes unless
they establish a reusable rule.

Issue/spec workflow is local markdown, not GitHub Issues:

- Specs/PRDs: `docs/superpowers/specs/YYYY-MM-DD-<slug>-design.md`
- Plans: `docs/superpowers/plans/YYYY-MM-DD-<slug>.md`
- Triage labels: see `docs/agents/triage-labels.md`
- Do not run `gh issue create` for this repository's working specs.

When changing schemas:

- Update the collection files.
- Add or update migrations when needed.
- Run `pnpm generate:types`.
- Update tests and affected seed/fixture code.

When changing order, booking, discount, referral, or capacity behavior:

- Read `src/collections/Orders.ts` and `src/collections/orders/*`.
- Add or update integration tests under `tests/int`.
- Consider Playwright coverage if a user-visible flow changes.

When changing public catalogue pages:

- Prefer existing query helpers in `src/lib/queries.ts`.
- Keep cache tags in `src/lib/cache.ts` and collection revalidation hooks aligned.
- Preserve the domain vocabulary from `CONTEXT.md`.

When changing auth/account forms:

- Use server actions and existing form components/patterns.
- Keep validation in colocated `schema.ts` files where the route already follows that pattern.
- Avoid bypassing Payload access rules unless there is a documented reason.

When working on payments:

- Treat Snowbusters as a functional reference, not a source to copy verbatim.
- Verify signing, callbacks, idempotence, and transaction transitions against sandbox/test vectors.
- Resolve the number-vs-decimal money mismatch before taking online payments live.

## Reference: Snowbusters

Snowbusters is the functional reference for payments, user handling, and order behavior. `CLAUDE.md` lists the relevant files from the old project. Use it to understand proven flows and edge cases, but implement idiomatic TypeScript/Payload/Next code in this repository.
