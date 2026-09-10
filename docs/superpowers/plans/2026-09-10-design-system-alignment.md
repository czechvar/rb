# Design-system alignment review

Status: local implementation; release review outstanding.
Board: AceE0P, task d9db3960-d4ed-4887-8eac-dd1a997a3873.
Branch: codex/design-system-alignment.

## Reference and scope

Reference directory: `/home/czechspekk/Downloads/NEW ROCKBUSTERS WEBSITE - HTML /`.
Primary comparisons: original homepage, trips calendar, destination detail and
team/trip photo cards. No CMS, database or media records were changed.

Checkpoint `fb98726` captures theme-owned fluid widths, shared eyebrow lines,
and the unified homepage/trips image gallery. The original has 5% gutters and
no fixed desktop cap; the theme contract therefore uses 100vw plus 5vw gutters.

## Issues addressed in the follow-up

1. Header pages selected different backgrounds and thresholds (0px or 80vh).
   Removed `transparent` and `transparentHeader` props. Header alone owns a
   60px threshold, following the original homepage/calendar/trip references.
   The shared module selects a top gradient or solid background with 12px blur.
   Scroll-back, route changes and pageshow synchronize the same state.
2. CSS compilation dropped the standard backdrop-filter when its vendor-prefixed
   declaration followed it. Put the prefix first and verified actual computed blur.
3. Light breadcrumb pages lacked a dark backing behind the reserved menu space.
   The breadcrumb now supplies a document-flow backing; it does not override the
   fixed header or its scroll state. Desktop navigation switches to the shared
   mobile menu below 1100px to avoid cramped/clipped tablet navigation.
4. Fact cards lacked reference hover treatment. Dark facts use a subtle #131313
   surface; light facts use an accent border. The homepage inline facts start
   on the canvas instead of inheriting a later generic dark-card background.
   The red hero-statistics strip stays static, matching the reference.
5. Generic galleries lacked the destination-strip photo effect; guide renderers
   had separate implementations. Shared imageZoom now supplies 1.04 zoom and
   550ms timing for CMS galleries, destination media, CMS guide cards and legacy
   team/coach cards. Trip cards retain their separate reference 1.05 treatment.
6. Added missing CMS FAQ accent borders, program-card surface changes, partner
   feedback and corresponding legacy fact/FAQ effects. Linked cards have keyboard
   focus equivalents. Static cards/photos do not acquire fake tab stops.
7. Hover movement is pointer-capability gated; reduced motion disables image
   movement and transitions. Both theme previews contain real fact-card specimens;
   new hover surfaces and image timing are registered theme properties.
8. Intermediate-width audit found the destination month grid overflowing at
   900/1024px. It uses six columns at 768–1200px and retains two on mobile.

## Verification

- TypeScript and scoped ESLint passed.
- Theme registry: 227 tokens; strict CSS: 82 files, zero migration warnings.
- Width checker regression tests: 3 passed.
- Read-only header regression suite: **3 passed** on the existing :4444 server.
  Source: `tests/e2e/header-scroll.e2e.spec.ts`.
  Covers home/trips/destinations/team/programs/blog at 390/1440px, top/60/61/700px
  and scroll-back, mobile menu navigation, body-scroll unlocking and reduced motion.
  Auth routes do not render the marketing header and are outside this suite.
- Browser interaction audit: home, Albarracin, team, both theme previews;
  fact/FAQ/program surface changes, photo zoom, link focus, reduced motion.
- Both theme editors changed the fact-hover token successfully; a touch-device
  browser context kept photo zoom disabled.
- Final layout checks: no document overflow on Albarracin/blog at
  390/900/1024/1100/1200/1440px; mobile month grid remains two columns.
- Layout evidence: `.scratch/design-effects/results.json`, `final-layout.json`,
  screenshots and the local Playwright configuration for the existing :4444 server.
- Early runs found and corrected a CSS composition placement error and missing
  blur. Removed an incorrect login-header assertion; navigation waits accommodate
  the slow local catalogue render. These early runs were not acceptance passes.

## Further candidates identified

| Candidate | Evidence / next step |
| --- | --- |
| Reveal on entering the viewport | Reference uses IntersectionObserver; current shared reveal animation runs at initial paint. Evaluate as a separate motion change with reduced-motion/no-JS visibility. |
| Homepage content duplication | Live CMS layout contains two FAQ blocks. Decide intended content in CMS before removing one. |
| Location-card parity | CMS countryTiles uses light/image-backed cards, while original destination index uses dark flat cards. Compare variants and content before changing selection. |
| Remaining section/title rhythm | Compare program, post, account and booking surfaces; do not force editorial title sizes onto functional forms. |
| Gallery final row | Six cards plus a double-width lead creates a partial final row, also present in the reference. Decide count/composition rather than silently hiding content. |
| Additional legacy card variants | Existing compact/editorial renderers remain distinct. Review their visual language separately from the shared image gallery. |
| Release verification | Review the branch, run production build/release checks, then verify a deployed preview. No push, MR or deployment in this pass. |

The hover pass implements the audited interactions, not every possible effect
in every HTML draft. The candidates above remain an explicit review backlog.

## Review follow-up: account navigation

Restored a visible desktop Log in / My account link beside LET'S TALK using the
existing useMe session state. Mobile drawer retains the same destination/label.
Tightened shared navigation gaps so both actions fit from 1100px without overlap.
Added a read-only browser regression for desktop and mobile in both session states
(mocked /api/users/me; no users or database fixtures). The test, scoped lint,
TypeScript and strict theme CSS check passed. This resolves the desktop account
entry-point review finding; the other older-commit findings remain open.
