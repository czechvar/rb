# Account & booking pages — marketing shell + header user icon

**Date:** 2026-06-10
**Scope:** `/account/*` and `/book/*` get the storefront Header/Breadcrumb/Footer; the shared `Header` gains an auth-aware user icon (desktop nav + mobile drawer); `/login` redirects already-authenticated users to `/account`.
**Builds on:** [`2026-05-26-user-section-design.md`](./2026-05-26-user-section-design.md) (account area) and [`2026-06-01-trip-detail-figma-r3-hero-design.md`](./2026-06-01-trip-detail-figma-r3-hero-design.md) (made `MarketingShell` crumbs optional and added the transparent header mode this spec must coexist with).

## Goal

The account area (`/account/*`) and booking flow (`/book/*`) currently render bare — no site header, no footer. Wrap them in the existing marketing shell so users never leave the storefront chrome, and add a persistent user entry point to the header: a person icon that links to `/login` when logged out and `/account` when logged in.

## Decisions captured during brainstorming

So this spec reads standalone:

- **Shell scope:** `/account/*` and `/book/*` only. Auth pages (`/login`, `/register`, forgot/reset password, verify) keep their centered-card layout — less distraction mid-flow.
- **Icon behavior:** direct links, no dropdown. Logged out → `/login` (the login page links to register). Logged in → `/account` (the sidebar there has profile/orders/sign-out). A dropdown was considered and rejected as avoidable client complexity.
- **Auth state source:** client-side. `Header` is already a client component; a `useMe()` hook fetches Payload's built-in `GET /api/users/me` once after mount. **Do not** read `headers()`/`cookies()` in `MarketingShell` or any shared shell component — the project has no `revalidate`/`dynamic` config anywhere, so a request-time cookie read in the shell would silently force every marketing page dynamic and add a Payload auth lookup per page view sitewide.
- **Pre-resolution state:** until `/me` resolves (and on any error) the icon renders its logged-out form. Same icon slot in both states — no spinner, no layout shift.
- **Fixed-header offset:** the header is `position: fixed`; on marketing pages the content offset comes from `Breadcrumb`'s `margin-top: var(--headerTotalHeight)`. Reusing `MarketingShell` with a static layout-level crumb (`Home / My account`, `Home / Booking`) gets the offset for free. Deeper per-page crumbs (e.g. `… / Orders / #1234`) are deferred to the design-review round.
- **Footer reused as-is**, including the "Ready to Send Your Project?" contact-CTA section. Slimming it for account pages is a design-review-round concern.
- **Design review of the account pages** against the storefront language is explicitly deferred until after this integration lands (user decision, 2026-06-10).

## Component plan

| File | Change |
|---|---|
| `src/app/(frontend)/account/layout.tsx` | Wrap the existing sidebar grid in `<MarketingShell crumbs={[Home, My account]}>`. Auth guard (`getCurrentUser` → `redirect('/login')`) and `AccountSidebar` untouched. |
| `src/app/(frontend)/book/layout.tsx` (new) | `<MarketingShell crumbs={[Home, Booking]}>{children}</MarketingShell>`. Purely visual — booking pages keep their own auth redirects (they carry `?from=` context the layout can't). |
| `src/components/marketing/useMe.ts` (new) | Client hook. State `'out' \| 'in'`, initial `'out'`. One `fetch('/api/users/me', { credentials: 'same-origin' })` in a mount effect; sets `'in'` iff response is OK and contains a non-null `user`. Any non-200 or network error stays `'out'`. |
| `src/components/marketing/Header.tsx` | Call `useMe()` once; feed both render sites. Desktop: person-silhouette SVG (inline, `currentColor`, same conventions as the existing phone/social icons) in the `menuBar` nav after "Join Us" — `href="/login"` + `aria-label="Log in"` when out, `href="/account"` + `aria-label="My account"` when in. Mobile drawer: text entry "Log in" / "My account", same hrefs, closes the drawer on click. |
| `src/components/marketing/marketing.module.css` | Minimal icon-link styles (size, alignment, hover) consistent with existing nav links. Must inherit text color so the R3 transparent header mode needs no special casing. |
| `src/app/(frontend)/(auth)/login/page.tsx` | If `getCurrentUser()` returns a user, `redirect('/account')`. Makes the icon's logged-out fallback self-healing: a logged-in user who sees the stale icon and clicks it lands on `/account` anyway. |

## Error handling

- `/api/users/me` failure → icon behaves as logged out. Combined with the `/login` redirect above, the worst case is one extra hop for a logged-in user.
- No new error surfaces in the layouts: `MarketingShell` is presentational; auth failures keep their existing redirect behavior.

## Testing

Playwright (extends existing e2e suites):

- Logged out, `/`: user icon present in header, `href="/login"`; drawer entry says "Log in".
- Logged in (reuse auth e2e login helpers): icon `href="/account"`; `/account` and `/account/orders` render header nav + footer; a `/book/[eventDateId]` page renders header nav + footer.
- `/login` visited while authenticated redirects to `/account`.
- `shell-visual.spec.ts` baseline regenerated (header gains an icon). The rescued `trip-detail-visual.spec.ts-snapshots/` baseline (recovered from the R3 worktree, currently untracked) is committed with this branch.

## Out of scope

- Shell on auth pages; user dropdown menu; per-page breadcrumbs; footer slimming/redesign; the deferred design-review pass; any Payload schema changes.
