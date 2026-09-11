# Blog index CMS conversion

Status: implemented locally; validation recorded below

Task: https://app.workstreams.ai/teams/S_ZYh417Os/board/AceE0P/tasks/5ea8a4cd-4638-4834-be3d-b6f1ce7ce216

Reference: `docs/html/BLOG/blog.html` and the supplied Downloads HTML.

## Result

`/blog` renders the published Pages record with slug `blog`. The persistent seed
composes a brand editorial Hero, a Post Grid in full index mode, and a final red
CTA. All generic Page blocks remain available. An absent/draft Page keeps the
existing listing fallback. SEO and JSON-LD use the canonical `/blog` URL.

The index fetches all published posts across query pages and sends only compact
card data to the browser. Filters include all CMS categories, including empty
ones. Missing categories do not hide posts from All. Date sorting and category
selection persist in query parameters and browser Back/Forward. The featured
story appears once in the default view; filtered/sorted views show all matching
stories. The first manually selected post is featured, otherwise the newest is
used. Existing card/compact Post Grid variants retain their behavior.

Statistics derive from the actual published archive. The source's invented
contributor/post-frequency numbers are replaced by byline and archive-year
counts. Shared hero sizing, theme tokens, header behavior, and 5vw gutters take
precedence over isolated reference CSS values. The source's inert newsletter
form is replaced by a working trip CTA; newsletter delivery is outside this task.

## Local setup

Data classification: persistent CMS seed content, no temporary/demo records.
The importer is local-only and skips an existing Blog Page unless `--replace`
is explicitly passed. Post selection resolves by slug rather than portable IDs.

```bash
PAYLOAD_DISABLE_DB_PUSH=true pnpm payload migrate
PAYLOAD_DISABLE_DB_PUSH=true pnpm exec tsx scripts/data-import/import-blog-page-seed.ts
```

Migration adds `index` to Post Grid variant enums on all six block surfaces.
Rollback changes index instances to cards but leaves the unused enum label.
Blog import changes from the preceding task are separate working-tree changes.

## Validation

- Unit tests cover complete archive pagination, compact DTOs, filters/sorting,
  uncategorized records, missing dates/media, and text-based reading estimates.
- Passed: five unit tests, TypeScript, scoped ESLint, theme CSS/registry checks,
  and production build against the local database. `/blog` prerenders successfully.
- Local read-back: Page id 4, published, layout `hero → postGrid(index) → cta`;
  50 published posts rendered, no draft posts in the index.
- Browser verified at 1440×1000 and 390×844: no horizontal overflow or page
  exceptions; visible images loaded; desktop filters align under the header;
  mobile filters remain static. Verified seven Climbing Destinations matches,
  oldest-first date order, URL reload/Back/Forward, empty-category reset,
  keyboard tab order, reduced motion, CTA destination, and canonical JSON-LD.
- Screenshots and compact browser evidence: `.scratch/blog-index/`.
- Production deployment/database untouched. Local dev server: port 4444.
