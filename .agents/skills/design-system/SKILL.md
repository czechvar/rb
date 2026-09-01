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

The `/design-system` preview is organized as a tabbed workbench:

- Tokens — foundation swatches, detail tokens, and the full editable token atlas
  from `src/lib/theme/tokenRegistry.ts`.
- Typography — type scale, headings, body copy, captions, links, lists,
  metadata, numeric/stat text, and form label/help/error specimens.
- Components — grouped rows using existing presentational components with
  inline fixture data. Prefer `FormField`, `FormBanner`, `SubmitButton`,
  `SectionIntro`, `Card`/`CardGrid`, `TagChipStrip`, `PricingSidebar`,
  fixture-safe booking CTAs, catalogue-card exports, FAQs, reviews, highlights,
  location, and partner surfaces.
- Patterns — composed product examples such as catalogue grids,
  booking/pricing sidebars, form banner plus fields, section intro plus CTA,
  status/notice stacks, and paper/table surfaces.
- Blocks — either direct fixture-safe block specimens or an explicit strategy
  for block renderers that require Payload-like route, relationship, auth,
  media, or query contexts.

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

Fixtures must stay inline or imported from static test-like helpers only. The
playground must not create records, call server actions, fetch Payload data,
depend on authenticated state, or persist edits outside browser state.

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
