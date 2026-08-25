# ADR-0001: Payload Blocks Page Composition

- Status: Accepted
- Date: 2026-08-25
- Owners: Engineering

## Context

Rockbusters needs stronger CMS-managed page assembly for campaign, landing, and editorial pages without turning the CMS into a free-form visual builder. The existing app has reusable React sections and a well-defined Payload domain model, but public pages are mostly composed directly in route files.

Editors need to choose page sections, order them, attach media, reference existing catalogue records, and select safe data sources such as featured Events or global FAQs. Developers still need control over accessibility, query behavior, visual variants, route safety, and design-system consistency.

## Decision

Use a `pages` collection with a Payload `blocks` layout field as the controlled page-composition layer. Each block is a CMS contract containing content fields, relationship fields, source enums, limits, and approved visual variants. React block components and resolver functions translate those contracts into rendered UI and Payload queries.

The POC route is mounted at `/cms-pages/[slug]` so existing public routes remain untouched. Only pages with `status = published` render publicly.

Blocks must not store JSX, component import paths, class names, arbitrary query strings, or executable code. Data binding is exposed through explicit source options such as `manual`, `featured`, `upcoming`, `byProgram`, `byLocation`, and `global`.

POC and demo content created to prove this model must use deterministic markers, idempotent seed behavior, and a documented cleanup path before additional block families are added. Integration tests must run against an isolated test database, not the local development or production database.

## Alternatives Considered

- Hardcode every page in Next routes: simple and safe, but does not meet the CMS page-management goal.
- Store arbitrary component names and props in Payload: flexible, but brittle and unsafe because editors could select unsupported components or invalid query shapes.
- Adopt a visual page builder package immediately: deferred because the POC first needs to validate the domain/data-binding model against the existing Payload app.
- Add a catch-all public page route immediately: deferred to avoid conflicts with existing routes until the model is proven.

## Consequences

- Editors can compose landing-style pages from approved sections and bind those sections to existing Events, Locations, Programs, FAQs, and Media.
- Developers keep ownership of rendering, accessibility, responsive behavior, query limits, caching, and variants.
- Every durable page section needs both a Payload block contract and a React renderer/resolver, which is extra boilerplate but keeps the system explicit.
- The page-builder layer introduces a new cache tag and collection; production deployments need schema migration or Payload schema push planning before enabling it.
- Follow-up work should connect this to a fuller design-system token/component layer and decide whether proven CMS pages should move from `/cms-pages/[slug]` to canonical URLs.

## References

- `src/collections/Pages.ts`
- `src/blocks/*/config.ts`
- `src/components/blocks/*`
- `src/lib/block-resolvers/*`
- Workstreams task `aa3863a4-6134-4e6c-892e-aa2a3da71dae`
