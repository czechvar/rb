# ADR-0003: Canonical Block Layouts

- Status: Accepted
- Date: 2026-08-26
- Owners: Engineering

## Context

ADR-0001 introduced `/cms-pages/[slug]` as a safe POC route for Payload
block composition and explicitly deferred canonical route adoption. The block
model has since been extended beyond standalone CMS pages: Events, Programs,
Locations, Guides, Posts, and the Home page can all carry optional layouts
composed from approved block contracts.

Keeping this capability only under `/cms-pages/[slug]` would force duplicated
page behavior: canonical routes would keep hardcoded layouts while editors
tested the same content model elsewhere. That makes the POC less useful for
real migration decisions and hides route-specific data-binding problems.

## Decision

Allow canonical public routes to render an approved block layout when the
underlying record has one. If the layout is empty, the route must keep its
existing hardcoded fallback. This applies to the Home page, Trip/Event detail,
Program detail, Location detail, Guide detail, and Blog Post detail routes.

The `/cms-pages/[slug]` route remains available for standalone CMS pages and
campaign-style content. Published Page records are the only records that may
render publicly through the Pages collection.

Blocks remain controlled contracts. They must not store JSX, component import
paths, arbitrary query definitions, class names, or executable code. Data
bindings stay explicit through resolver-owned source options and relationship
fields.

## Alternatives Considered

- Keep block layouts only at `/cms-pages/[slug]`: safest for routing, but it
  would not prove how block composition works on real catalogue/detail pages.
- Replace hardcoded canonical routes immediately: rejected because fallbacks
  are still useful and reduce rollout risk while block parity improves.
- Add a catch-all `/*` Page route now: deferred until route precedence and
  ownership rules are specified.

## Consequences

- Editors can modularly compose canonical detail pages while existing layouts
  remain as fallbacks.
- Route components now own the switch between record layout and fallback
  layout, so each route must pass the correct render context.
- Cache tags for page queries must include every collection that embedded
  block relationships can expose, or related-record edits can leave stale
  published pages.
- Visual parity is incremental: reusable block variants may need to evolve to
  match bespoke legacy sections without reintroducing page-specific block
  types.

## References

- `docs/adr/0001-payload-blocks-page-composition.md`
- `src/app/(frontend)/page.tsx`
- `src/app/(frontend)/cms-pages/[slug]/page.tsx`
- `src/app/(frontend)/trips/[slug]/page.tsx`
- `src/app/(frontend)/programs/[slug]/page.tsx`
- `src/app/(frontend)/destinations/[slug]/page.tsx`
- `src/app/(frontend)/team/[slug]/page.tsx`
- `src/app/(frontend)/blog/[slug]/page.tsx`
