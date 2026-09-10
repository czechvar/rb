---
name: design-system
description: Work on the Rockbusters frontend design system, semantic theme tokens, Snowbusters/Rockbusters theme variants, or the local /design-system playground.
---

Use this skill for changes involving frontend theme tokens, CSS Module token
usage, shared visual primitives, design-system specimens, or the local theme
playground.

## Theme Contract

`src/app/(frontend)/theme.css` is the runtime CSS contract. It owns semantic
`--theme-*` variables, the default Rockbusters values, Snowbusters overrides,
and legacy `--rb-*` aliases used during migration.

Keep these files aligned when changing theme properties:

- `src/app/(frontend)/theme.css` — browser runtime source of truth.
- `src/lib/theme/tokenRegistry.ts` — editable token catalogue for the playground.
- `src/lib/theme/themePresets.ts` — Rockbusters and Snowbusters preset values.
- `src/lib/theme/cssExport.ts` — generated CSS output for edited values.

Do not define brand tokens, status tokens, document globals, root font scales,
or theme colors inside component CSS Modules. Component modules should consume
the theme contract and define local layout, state, and composition styles.

## Maximum widths

Use semantic theme tokens for every design maximum width across frontend
pages, components, blocks, and playground specimens. This applies to CSS,
responsive overrides, inline React styles, and caps expressed indirectly with
`width: min(...)`, `clamp(...)`, or viewport/gutter calculations.

- Define numeric caps only in `theme.css`; consume them with `var(--theme-...)`.
  Keep the registry and presets aligned as described above.
- Reuse tokens by purpose (page content, reading text, form, sidebar). Add a
  semantic token only when a distinct layout need warrants it; do not create
  one token per component or per existing pixel value.
- Keep narrower text/form caps intentional. Token-only sizing does not mean
  every element shares one maximum width.
- Intrinsic/relative sizing such as `100%`, `none`, `min-content`, and
  `max-content` may remain literal. Media-query breakpoints are not element
  maximum widths. Numeric design caps inside calculations still require tokens.
- Derive offsets that align to a capped container from the same width token.
  Apply outer gutters once so adjacent sections share alignment.

The shared page-content maximum is `--theme-content-max` (`100vw` in both base
presets), with `5vw` outer gutters to match the original fluid design. Narrower content uses the article, text, lead, form, sidebar, compact,
logo, and copy tokens in the same contract. `--theme-content-gutter` owns outer
gutters; a container's maximum describes its usable content width.

When changing a width rule, check its consumers at desktop and mobile widths.
`pnpm check:theme-css` rejects hardcoded CSS caps, including numeric fallbacks
and caps inside `min()`/`max()`/`clamp()`. Relative fit calculations may subtract
local spacing. Inline styles and container-alignment arithmetic still require
explicit review; do not treat the CSS check as a complete layout audit.

Decision: `docs/adr/0002-semantic-css-theme-tokens.md`.

## Eyebrows

Use `data-eyebrow="section"` or `data-eyebrow="hero"` on editorial eyebrow
labels. The shared recipe in frontend `styles.css` owns the decorative line,
gap, and first-line alignment when text wraps. Legacy `.section-label` and
`.eyebrow` classes use the section variant automatically. Consume the
`--theme-eyebrow-*` tokens; do not reintroduce local `::before` line recipes.
Component modules may retain typography, color, margins, and parent alignment.
The line defaults to `currentColor` so contrasting labels keep a visible line.

## Image trip galleries

Trip Grid `featureLead` and Catalogue Results calendar cards share
`src/components/catalogue/ImageTripCard.tsx` and its grid styles. Keep visual
changes in that shared presentation; callers own Event versus Event Date data,
pricing, selection, grouping, and filters. Gallery dimensions and overlays use
`--theme-trip-card-*` tokens. Verify both callers, keyboard focus, reduced motion,
and the two theme specimens when changing this presentation.

## Playground

The local design-system surface lives at:

- `/design-system?theme=rockbusters`
- `/design-system?theme=snowbusters`

`src/app/(frontend)/design-system/ThemeWorkbench.tsx` supports in-browser token
editing by applying CSS custom properties to the preview root. These edits are
playground-only and must not be treated as persisted state, CMS state, or source
updates unless the user explicitly asks to propagate values into the codebase.

Density and surface switches in the workbench are preview variants only. They
help QA component behavior across layout contexts; they are not stored theme
properties.

## Component Specimens

When enriching the design-system page, prefer existing presentational
components from `src/components` and pass fixture data where needed. Avoid
components that require Payload reads, authentication, server actions, or real
database state unless the task explicitly calls for exercising that integration.

Useful specimen categories:

- Buttons, links, tags, chips, forms, notices, cards, and section intros.
- Catalogue cards and pricing/booking summaries with fixture data.
- Rich content sections that reveal typography, spacing, surface, border,
  shadow, focus, and status token behavior.

Keep the page an actual working specimen, not a landing page explaining the
design system.

## Verification

For theme-token changes, run:

```bash
pnpm check:theme-registry
pnpm check:theme-css
```

Also run scoped lint/build checks appropriate to the files touched. For
user-visible design-system changes, smoke both theme URLs locally and verify
that token edits and preview switches affect the rendered specimen.

If schema or Payload collection files change as part of adjacent work, follow
the repository's normal schema rules from `AGENTS.md`; ordinary design-system
playground work should not touch the database.
