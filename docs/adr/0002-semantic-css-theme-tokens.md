# ADR-0002: Semantic CSS Theme Tokens

- Status: Accepted
- Date: 2026-08-25
- Updated: 2026-09-10 (theme-owned maximum widths)
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

### Theme-owned maximum widths

All frontend design maximum widths must use semantic theme tokens, including
page shells, blocks, component interiors, responsive rules, and inline styles.
Numeric caps belong only in `theme.css`. This also covers implicit caps in
`width: min(...)`/`clamp(...)` and offsets calculated from a container width.
Choose reusable tokens by layout purpose; reading text, forms, and sidebars
may intentionally have different caps from page content. Intrinsic/relative
values such as `100%`, `none`, `min-content`, and `max-content` remain valid;
media-query breakpoints are outside this rule.

The September review found independent 1400px CMS containers, 1200px detail
sections, and a largely unused 1920px content token. The original homepage
HTML uses fluid 5% gutters rather than a global cap. Centralizing ownership
allows these layouts to be aligned deliberately.

The implemented baseline matches the original fluid design: `--theme-content-max`
is `100vw` in both theme presets, with `5vw` outer gutters. Full-page containers
therefore use 90% of the viewport (1728px at 1920px), with no fixed desktop cap. Article
and contained media use 960px; reading text 760px; lead text 600px; forms 480px;
sidebars 340px; compact content 260px; logos 150px. A 56ch measure remains for
character-based copy. These are role-based defaults, not one token for each
old component value. Full-width backgrounds remain outside the container.
A fixed 1400px desktop cap was trialled, then replaced with the original fluid
layout at the user's request. Width ownership remains in the theme contract.

### Shared eyebrow decoration

Editorial eyebrow labels use one CSS recipe selected by `data-eyebrow`:
section (24px line, 10px gap) or hero (32px line, 12px gap). Theme tokens own
line width, height, gap, and color. The 1px line follows `currentColor` by
default, including contrasting CTA labels. Legacy global label classes map
to the section variant. Component modules retain their typography and margins,
while centered and wrapped labels use the shared layout behavior. Decorative
lines use empty pseudo-elements rather than punctuation in content.

Image-overlay trip galleries share `ImageTripCard` and its grid recipe between
Trip Grid featureLead and Catalogue Results calendar. Callers retain Event versus
Event Date selection, pricing, and grouping. The theme owns card dimensions,
title hierarchy, overlays, and image-motion duration; the component owns hover,
focus, and reduced-motion behavior. Other compact/editorial variants remain
separate compositions.

### Global header and interaction ownership

The public Header has one scroll rule: gradient at 0–60px, solid/blur above
60px, reset on return to the top. This follows the original homepage/calendar
HTML. Page-selected `transparent` / `transparentHeader` modes are removed; they
had selected competing 0px and 80vh thresholds. Only Header owns the scroll
state and only its shared module styles that state. Breadcrumb placement remains
separate from header appearance. No page or CMS block overrides the effect.

Gallery and guide-photo renderers share the `imageZoom` composition (1.04 scale),
while image trip cards preserve their 1.05 reference effect. Theme tokens own
image timing and fact/card hover surfaces. Decorative static content does not
acquire keyboard tab stops; links have focus equivalents, hover zoom is pointer
capability gated, and reduced motion disables movement.

## Alternatives Considered

- Copy Snowbusters CSS directly into Rockbusters: rejected because it would
  preserve Snowbusters-specific naming and couple the app to static page CSS.
- Add a third-party UI framework or utility CSS framework: deferred because the
  repository already has a CSS Modules baseline and no approved dependency need.
- Keep only brand-specific `--rb-*` variables: rejected because it blocks
  reusable skins and makes future Snowbusters/Rockbusters component sharing
  harder.
- Keep maximum widths local to components: rejected because shared theme
  changes then cannot reliably align pages. One universal cap is also rejected
  because text, forms, and page grids have different layout needs.

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
- Frontend CSS caps and booking inline max-widths have been migrated to the
  theme contract. The CSS checker rejects numeric element caps, including caps
  nested in sizing functions. Inline styles and alignment arithmetic still
  require review. Registry/preset updates and responsive visual checks remain
  required when implementing width-token changes.

## Shared hero sizing

Hero statistics on a primary-color (Rockbusters red) panel use
`--theme-color-ink` for the large values and full-opacity `--theme-color-paper`
for small labels and supporting text. Apply this consistently to generic CMS,
blog, destination, and guide hero statistics; dark-panel statistics keep their
existing color treatment.

All public hero variants consume `--theme-hero-min-height` and the shared responsive `--theme-hero-mobile-min-height` from the theme contract. Do not add page-specific viewport-height or variant-height overrides. The initial values match the destination hero (760px desktop, 680px mobile). Trip booking summaries sit beside the hero on desktop and below it on mobile, so the summary does not increase mobile hero height. The summary sits above image overlays.

## References

- `src/app/(frontend)/theme.css`
- `src/app/(frontend)/styles.css`
- `scripts/check-theme-css.mjs`
- `/home/czechspekk/Downloads/snowbusters-design-system.html`
- Workstreams task `ee34ee48-02a4-4665-93a5-94d0a802b3e0`
