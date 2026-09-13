# Team CMS page and guide template alignment

Implement sequentially: verify the Team page before styling guide details.

The `/team` route reads the published `team` Page and renders its generic CMS
blocks, with the existing fallback retained when that Page is absent. The initial
persistent page uses Hero, Section Intro, Stats, Guide Grid, Trip Grid, Review Grid
and CTA. References are `docs/html/TEAM/rockbusters_community_guides_coaches.html`
and the current shared Rockbusters block styles.

Both team and friends grids use active guide records and link to `/team/[slug]`.
The Guide Grid editor and resolver support up to 100 records, retaining a default
of six for teaser usage. Featured guides sort before names. This validation limit
change introduces no database columns or enum values.

The guide detail template retains authored content and custom CMS layouts. Shared
guide components receive semantic heading sizes, readable biographies, portrait
presentation, and the generic closing CTA. Contact fields remain private; no
email or phone is rendered. Missing optional sections stay absent.

Local CMS content is persistent seed content. The Team Page source is
`scripts/data-import/seed/team-page.json`; the canonical snapshot is refreshed
after local authoring. No production database or deployment is changed here.

## Local verification

- Team Page saved and read back as Page 5; 32 active guide links rendered at
  1440px and 390px, and card-to-profile navigation passed.
- Jan's CMS layout and default guide profiles rendered without browser errors
  or horizontal overflow. Trips anchors exist and no email/telephone links render.
- TypeScript, scoped lint, both theme checks, both theme previews, and the
  full-roster/teaser regression test passed.
- Fresh and repeated canonical imports matched all 11,504 rows in 15 content
  collections, retaining all 26 enriched occurrences. Disposable DB cleaned.
