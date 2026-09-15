# ADR-0018: Published CMS Pages At Root Slugs

- Status: Accepted
- Date: 2026-09-15
- Owners: Engineering

## Context

ADR-0001 and ADR-0003 deferred a generic root route while the Pages block model was still a POC. Standalone CMS pages now need public URLs such as `/terms-and-conditions` without a route file for each page.

## Decision

A single-segment root URL looks up a Page with the same slug. Only published Pages render; a missing or draft Page returns 404. Existing explicit routes keep ownership of their URLs through App Router route precedence. The generic `/cms-pages/[slug]` route remains available, while public links and sitemap entries for standalone Pages use root URLs.

## Alternatives Considered

- Add one route file per Page: rejected because it makes CMS-managed pages depend on code changes.
- Rewrite all unknown paths to `/cms-pages/[slug]`: rejected because metadata and structured data would describe the preview URL rather than the public URL.
- Add a multi-segment catch-all: deferred because nested route ownership needs a separate rule.

## Consequences

- Editors can publish new standalone Pages without a deployment for each slug.
- A Page slug matching an explicit route cannot take over that route.
- Public page metadata, JSON-LD, and sitemap paths use the root URL.

## References

- ADR-0001 and ADR-0003
- `src/app/(frontend)/[slug]/page.tsx`
- `src/app/(frontend)/cms-pages/[slug]/page.tsx`
