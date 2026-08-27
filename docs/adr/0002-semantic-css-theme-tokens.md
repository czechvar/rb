# ADR-0002: Semantic CSS Theme Tokens

- Status: Accepted
- Date: 2026-08-25
- Owners: Engineering

## Context

Rockbusters needs a reusable design-system layer that can absorb proven
Snowbusters visual patterns without copying static HTML or introducing a new UI
framework. The current app already uses global CSS variables and CSS Modules,
with many components still consuming legacy `--rb-*` brand tokens directly.

The Snowbusters design-system reference at
`/home/czechspekk/Downloads/snowbusters-design-system.html` provides a strong
token and component vocabulary for colors, typography, spacing, buttons, forms,
cards, badges, notices, tabs, availability bars, and section rhythm. It is a
static specimen, not runtime application code.

## Decision

Use semantic CSS custom properties as the frontend theme contract. Brand skins
map into `--theme-*` variables, with Rockbusters as the default theme. Apply
theme selection at the document shell, currently on `<body>` through
`data-theme='rockbusters'`, with Snowbusters available through
`data-theme='snowbusters'` or `.theme-snowbusters`.

Keep the existing `--rb-*`, layout, typography, and status aliases mapped to the
semantic tokens during migration. Existing CSS Modules can continue to work,
while new or touched shared UI should consume semantic `--theme-*` tokens
directly.

Component CSS Modules must not define brand tokens, status tokens, document
globals, root font scales, or brand colors. They may only consume the theme
contract and define local layout, state, and composition styles.

Continue using CSS Modules and small React components for shared primitives
instead of adding Tailwind, Storybook, shadcn, or another component-system
dependency at this stage.

## Alternatives Considered

- Copy Snowbusters CSS directly into Rockbusters: rejected because it would
  preserve Snowbusters-specific naming and couple the app to static page CSS.
- Add a third-party UI framework or utility CSS framework: deferred because the
  repository already has a CSS Modules baseline and no approved dependency need.
- Keep only brand-specific `--rb-*` variables: rejected because it blocks
  reusable skins and makes future Snowbusters/Rockbusters component sharing
  harder.

## Consequences

- Shared frontend styling has a brand-neutral contract for colors, typography,
  spacing, radius, elevation, motion, focus, and status states.
- Rockbusters keeps visual compatibility while modules migrate incrementally
  from `--rb-*` aliases to `--theme-*` tokens.
- Snowbusters can be rendered by applying a theme scope, but component parity
  still requires future work on shared Button, FormField, Card, Badge,
  SectionIntro, and TripCard primitives.
- Theme changes remain CSS-only unless future requirements introduce
  CMS-managed brand selection or per-site runtime theming.
- `pnpm check:theme-css` enforces centralized token definitions and reports the
  existing migration backlog for hardcoded component primitives.

## References

- `src/app/(frontend)/theme.css`
- `src/app/(frontend)/styles.css`
- `scripts/check-theme-css.mjs`
- `/home/czechspekk/Downloads/snowbusters-design-system.html`
- Workstreams task `ee34ee48-02a4-4665-93a5-94d0a802b3e0`
