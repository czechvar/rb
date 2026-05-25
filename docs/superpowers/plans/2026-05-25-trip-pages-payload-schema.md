# Trip Pages — Payload Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Payload schema to support the Trip Category page (rendered from `Types`) and Trip Detail page (rendered from `Events`), per the agreed worksheets and Martin's clarifications.

**Architecture:** Three-tier model — **Type → Event → EventDate**. `Types` becomes a content-rich taxonomy that renders the Trip Category page. `Events` gains the marketing content + Day-by-Day Itinerary structure for the Trip Detail page. Two new shared collections (`FAQs`, `Reviews`) relate to either Events or Types.

**Tech Stack:** Payload CMS 3.84.1, postgres adapter, vitest int tests, existing `slugField` / `seoFields` helpers in `src/fields/`.

**Source of decisions:** `docs/trip-category-meeting-worksheet.md`, `docs/trip-detail-meeting-worksheet.md`, PR #1 comment thread (Martin's inline answers).

**Test environment caveat:** `.env.test` Neon credentials currently fail auth (`password authentication failed for user 'neondb_owner'`). Tests are written alongside each task and ready to run once credentials are refreshed — implementation correctness verified via `pnpm generate:types` (catches type errors) and `pnpm lint`.

---

## File Structure

**New files:**
- `src/collections/FAQs.ts` — shared FAQ entity, relates to Events and/or Types
- `src/collections/Reviews.ts` — shared Review entity, relates to Events and/or Types
- `tests/int/faqs.int.spec.ts`
- `tests/int/reviews.int.spec.ts`
- `tests/int/types.int.spec.ts` (Types currently has no dedicated test file)

**Modified files:**
- `src/collections/Types.ts` — heavy extension: gains hero, marketing content, curriculum pillars, program flow, week variants, accommodation, transport, coaches, results, SEO
- `src/collections/Events.ts` — heavy extension: gains `locations` (hasMany), highlights, audience cards, equipment grid, what-you-learn, day-by-day itinerary (max 14 days), accommodation, transport, coaches + team bullets, partner block
- `src/payload.config.ts` — register `FAQs` and `Reviews`
- `src/payload-types.ts` — auto-regenerated via `pnpm generate:types` after schema changes
- `tests/int/events.int.spec.ts` — extend with new-field coverage

---

## Task 1 — Extend `Types` with hero/content/SEO fields

**Files:**
- Modify: `src/collections/Types.ts`
- Test: `tests/int/types.int.spec.ts` (create)

Fields to add: `slug` (auto from `name`), `shortDescription` (textarea), `content` (richText), `mainPicture` (upload to media), `gallery` (upload hasMany), `vimeoId` (text), `featured` (checkbox), `state` (draft/published select), `seoFields`.

- [ ] **Step 1: Write the failing test** — `tests/int/types.int.spec.ts`

```ts
import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('types collection — content fields', () => {
  it('creates a Type with auto-slug, draft state, defaults', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error state/featured intentionally omitted
    const doc = await payload.create({
      collection: 'types',
      data: {
        name: `Sport Climbing Camps ${Date.now()}`,
        shortDescription: 'Recurring sport climbing programs.',
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.slug).toMatch(/^sport-climbing-camps-/)
    expect(doc.state).toBe('draft')
    expect(doc.featured).toBe(false)
    expect(doc.active).toBe(false)
  })
})
```

- [ ] **Step 2: Run test, expect FAIL** — `pnpm test:int -- types.int.spec`

- [ ] **Step 3: Extend `src/collections/Types.ts`**

```ts
import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'

export const Types: CollectionConfig = {
  slug: 'types',
  labels: { singular: 'Type', plural: 'Types' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'Taxonomy' },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'shortDescription', type: 'textarea' },
    { name: 'content', type: 'richText' },
    { name: 'mainPicture', type: 'upload', relationTo: 'media' },
    { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true },
    { name: 'vimeoId', type: 'text' },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'active', type: 'checkbox', defaultValue: false },
    {
      name: 'state',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    seoFields,
  ],
}
```

- [ ] **Step 4: Run test, expect PASS**
- [ ] **Step 5: Regenerate types** — `pnpm generate:types`
- [ ] **Step 6: Commit** — `git add src/collections/Types.ts tests/int/types.int.spec.ts src/payload-types.ts && git commit -m "feat: extend Types with hero, content, and SEO fields"`

---

## Task 2 — Add `Types.highlights` and `Types.audienceCards`

**Sub-elements**

- `highlights`: array of `{ text }` — Trip Highlights grid
- `audienceCards`: array of `{ heading, body, highlighted }` — Who-This-Camp-Is-For 3-card grid
- `soloNote`: text — solo travellers reassurance line
- `redirectCallout`: richText — "wrong fit?" info note

- [ ] **Step 1: Extend test** with second `it()` that creates a Type with 6 highlights, 3 audience cards (one highlighted), soloNote, redirectCallout. Assert roundtrip.

- [ ] **Step 2: Add fields to `Types.ts`** (between `vimeoId` and `featured`):

```ts
{
  name: 'highlights',
  type: 'array',
  fields: [{ name: 'text', type: 'text', required: true }],
},
{
  name: 'audienceCards',
  type: 'array',
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    { name: 'highlighted', type: 'checkbox', defaultValue: false },
  ],
},
{ name: 'soloNote', type: 'text' },
{ name: 'redirectCallout', type: 'richText' },
```

- [ ] **Step 3: Run test → regen types → commit**

```
git add src/collections/Types.ts tests/int/types.int.spec.ts src/payload-types.ts
git commit -m "feat: add Types highlights and audience cards"
```

---

## Task 3 — Add `Types.curriculumPillars` (3-pillar grid)

`curriculumPillars`: array of `{ icon, title, bullets[] }` — "What You'll Work On" curriculum pillars.

- [ ] **Step 1: Extend test** to create a Type with 3 pillars, each with 5 bullets.
- [ ] **Step 2: Add field:**

```ts
{
  name: 'curriculumPillars',
  type: 'array',
  fields: [
    { name: 'icon', type: 'text' },
    { name: 'title', type: 'text', required: true },
    {
      name: 'bullets',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
  ],
},
```

- [ ] **Step 3: Test → regen → commit** — `feat: add Types curriculum pillars`

---

## Task 4 — Add `Types.programFlow` group

`programFlow`: group containing the heaviest content of the category page (the "performance lab" framing).

```ts
{
  name: 'programFlow',
  type: 'group',
  fields: [
    { name: 'framingParagraph', type: 'textarea' },
    {
      name: 'mixAndMatchBlocks',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'tagline', type: 'textarea' },
        {
          name: 'bullets',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'tailoredToYou',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'focusTracks',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'colorTag',
          type: 'select',
          options: [
            { label: 'Red', value: 'red' },
            { label: 'Blue', value: 'blue' },
            { label: 'Green', value: 'green' },
          ],
        },
        {
          name: 'bullets',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },
  ],
},
```

- [ ] **Steps:** Test → field add → test → regen → commit — `feat: add Types program flow group`

---

## Task 5 — Add `Types.weekVariants` + `weekRecommendation`

```ts
{
  name: 'weekVariants',
  type: 'array',
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'bullets',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
  ],
},
{ name: 'weekRecommendation', type: 'textarea' },
```

- [ ] Test → add → regen → commit — `feat: add Types week variants`

---

## Task 6 — Add `Types.accommodation` + `Types.transport`

```ts
{
  name: 'accommodation',
  type: 'group',
  fields: [
    { name: 'description', type: 'richText' },
    {
      name: 'included',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'foodBeverages',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'notIncluded',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
  ],
},
{
  name: 'transport',
  type: 'group',
  fields: [
    { name: 'description', type: 'richText' },
    {
      name: 'airports',
      type: 'relationship',
      relationTo: 'airports',
      hasMany: true,
      filterOptions: () => ({ active: { equals: true } }),
    },
  ],
},
```

- [ ] Test → add → regen → commit — `feat: add Types accommodation and transport`

---

## Task 7 — Add `Types.coaches`, `Types.coachFramingParagraph`, `Types.results`

```ts
{
  name: 'coachFramingParagraph',
  type: 'textarea',
},
{
  name: 'coaches',
  type: 'relationship',
  relationTo: 'guides',
  hasMany: true,
  filterOptions: () => ({ active: { equals: true } }),
},
{
  name: 'results',
  type: 'array',
  fields: [{ name: 'text', type: 'text', required: true }],
},
```

- [ ] Test → add → regen → commit — `feat: add Types coaches and results outcomes`

---

## Task 8 — Add `Events.locations` (hasMany)

Per Martin's note: *"event can have more than one location"*. Currently only `EventDates` has `locations`.

- [ ] **Step 1: Extend `tests/int/events.int.spec.ts`** with a second `it()`:

```ts
it('attaches multiple locations to an event', async () => {
  const payload = await getTestPayload()
  const a = await payload.create({
    collection: 'locations',
    data: { name: `Loc A ${Date.now()}`, active: true },
  })
  const b = await payload.create({
    collection: 'locations',
    data: { name: `Loc B ${Date.now()}`, active: true },
  })
  // @ts-expect-error state defaulted
  const doc = await payload.create({
    collection: 'events',
    data: { title: `Multi-Loc ${Date.now()}`, locations: [a.id, b.id] },
  })
  const ids = (doc.locations ?? []).map(l => (typeof l === 'object' ? l.id : l))
  expect(ids).toEqual([a.id, b.id])
})
```

- [ ] **Step 2: Add field to `Events.ts`** (after the existing relations):

```ts
{
  name: 'locations',
  type: 'relationship',
  relationTo: 'locations',
  hasMany: true,
  filterOptions: () => ({ active: { equals: true } }),
},
```

- [ ] **Step 3: Test → regen → commit** — `feat: add Events.locations hasMany`

---

## Task 9 — Add `Events.highlights`, `audienceCards`, `prerequisites`

Identical shape to Types, but on Events for the trip-detail page.

```ts
{
  name: 'highlights',
  type: 'array',
  fields: [{ name: 'text', type: 'text', required: true }],
},
{
  name: 'audienceCards',
  type: 'array',
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    { name: 'highlighted', type: 'checkbox', defaultValue: false },
  ],
},
{
  name: 'prerequisites',
  type: 'array',
  fields: [{ name: 'text', type: 'text', required: true }],
},
```

- [ ] Test → add → regen → commit — `feat: add Events highlights, audience cards, prerequisites`

---

## Task 10 — Add `Events.essentialEquipment` grid

7 items per the salzburg wireframe; `mandatory` flag for helmet.

```ts
{ name: 'equipmentIntro', type: 'text' },
{
  name: 'essentialEquipment',
  type: 'array',
  fields: [
    { name: 'icon', type: 'text' },
    { name: 'name', type: 'text', required: true },
    { name: 'note', type: 'text' },
    { name: 'mandatory', type: 'checkbox', defaultValue: false },
  ],
},
```

- [ ] Test (create Event with 7 equipment items, helmet mandatory=true, assert roundtrip) → add → regen → commit — `feat: add Events essential equipment grid`

---

## Task 11 — Add `Events.whatYouLearn` group

2-column layout from the wireframe.

```ts
{
  name: 'whatYouLearn',
  type: 'group',
  fields: [
    { name: 'intro', type: 'textarea' },
    { name: 'box1Heading', type: 'text' },
    {
      name: 'box1Bullets',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    { name: 'box2Heading', type: 'text' },
    {
      name: 'box2Bullets',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
  ],
},
```

- [ ] Test → add → regen → commit — `feat: add Events whatYouLearn group`

---

## Task 12 — Add `Events.itinerary` (Day-by-Day, max 14 days)

Heaviest new structure. Per Martin's clarification, max 14 days.

```ts
{
  name: 'itinerary',
  type: 'group',
  fields: [
    { name: 'intro', type: 'textarea' },
    {
      name: 'days',
      type: 'array',
      maxRows: 14,
      fields: [
        { name: 'dayBadge', type: 'text' },
        { name: 'destinationIcon', type: 'text' },
        { name: 'destinationName', type: 'text', required: true },
        { name: 'metaLine', type: 'textarea' },
        { name: 'eyebrow', type: 'text' },
        { name: 'heading', type: 'text' },
        { name: 'description', type: 'textarea' },
        {
          name: 'highlightTags',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        {
          name: 'schedule',
          type: 'array',
          fields: [
            { name: 'time', type: 'text', required: true },
            { name: 'activity', type: 'text', required: true },
          ],
        },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
},
```

- [ ] Test: create Event with 5-day itinerary, each with full schedule + tags, assert roundtrip. Then attempt to create with 15 days, assert it's rejected.
- [ ] Add → regen → commit — `feat: add Events Day-by-Day Itinerary (max 14)`

---

## Task 13 — Add `Events.accommodation` + `Events.transport`

Same shape as Types but adds `cuisineHighlights`.

```ts
{
  name: 'accommodation',
  type: 'group',
  fields: [
    { name: 'description', type: 'richText' },
    {
      name: 'included',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'notIncluded',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    { name: 'cuisineHighlights', type: 'richText' },
  ],
},
{
  name: 'transport',
  type: 'group',
  fields: [
    { name: 'description', type: 'richText' },
    {
      name: 'airports',
      type: 'relationship',
      relationTo: 'airports',
      hasMany: true,
      filterOptions: () => ({ active: { equals: true } }),
    },
  ],
},
```

- [ ] Test → add → regen → commit — `feat: add Events accommodation and transport`

---

## Task 14 — Add `Events.coaches`, framing paragraph, team bullets

`Events.coaches` distinct from `EventDates.coaches` (event-level vs. instance-level).

```ts
{
  name: 'coachFramingParagraph',
  type: 'textarea',
},
{
  name: 'coaches',
  type: 'relationship',
  relationTo: 'guides',
  hasMany: true,
  filterOptions: () => ({ active: { equals: true } }),
},
{
  name: 'coachTeamBullets',
  type: 'array',
  fields: [{ name: 'text', type: 'text', required: true }],
},
```

- [ ] Test → add → regen → commit — `feat: add Events coaches relation and team bullets`

---

## Task 15 — Add `Events.partner` block

Gear-demo / Partner section.

```ts
{
  name: 'partner',
  type: 'relationship',
  relationTo: 'partners',
  filterOptions: () => ({ active: { equals: true } }),
},
{ name: 'partnerEyebrow', type: 'text' },
{ name: 'partnerHeadline', type: 'text' },
{ name: 'partnerDescription', type: 'textarea' },
{
  name: 'partnerBenefits',
  type: 'array',
  fields: [{ name: 'text', type: 'text', required: true }],
},
```

- [ ] Test → add → regen → commit — `feat: add Events partner / gear-demo block`

---

## Task 16 — Create `FAQs` collection

**Files:**
- Create: `src/collections/FAQs.ts`
- Modify: `src/payload.config.ts`
- Test: `tests/int/faqs.int.spec.ts`

`event` and `type` are both optional — an FAQ may belong to an Event, a Type, or be global.

```ts
import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'question', group: 'Catalogue' },
  fields: [
    { name: 'question', type: 'text', required: true },
    { name: 'answer', type: 'richText', required: true },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
    },
    {
      name: 'type',
      type: 'relationship',
      relationTo: 'types',
      filterOptions: () => ({ active: { equals: true } }),
    },
    { name: 'position', type: 'number', defaultValue: 0 },
    { name: 'active', type: 'checkbox', defaultValue: false },
  ],
}
```

Register in `src/payload.config.ts` between Partners and Events (group with Catalogue):
```ts
import { FAQs } from './collections/FAQs'
// ...
collections: [..., Partners, FAQs, Events, EventDates],
```

Test (create FAQ tied to event, FAQ tied to type, FAQ tied to neither — all valid).

- [ ] Test → create file → register → regen → commit — `feat: add FAQs collection`

---

## Task 17 — Create `Reviews` collection

Same shape as FAQs.

```ts
import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Review', plural: 'Reviews' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'reviewerName', group: 'Catalogue' },
  fields: [
    { name: 'quote', type: 'textarea', required: true },
    { name: 'reviewerName', type: 'text', required: true },
    { name: 'reviewerLocation', type: 'text' },
    { name: 'resultLine', type: 'text' },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
    },
    {
      name: 'type',
      type: 'relationship',
      relationTo: 'types',
      filterOptions: () => ({ active: { equals: true } }),
    },
    { name: 'position', type: 'number', defaultValue: 0 },
    { name: 'active', type: 'checkbox', defaultValue: false },
  ],
}
```

- [ ] Test → create → register → regen → commit — `feat: add Reviews collection`

---

## Task 18 — Final sanity sweep

- [ ] `pnpm generate:types` once more to make sure `payload-types.ts` reflects everything
- [ ] `pnpm lint` — clean
- [ ] `pnpm test:int` (will need refreshed DB creds — see env caveat at top)
- [ ] Commit any final type regen — `chore: regenerate payload-types`

---

## Out of scope (separate plans)

- **Trip Category page render** (`2026-05-25-trip-category-page-render.md`) — Next.js routing + section components
- **Trip Detail page render** (`2026-05-25-trip-detail-page-render.md`) — same, but for Events
- **Booking flow** — date picker / EventDate selection, payment hookup
- **Migration / seed data** — populate one Type and one Event end-to-end with all the new fields, so designers can preview

## Self-review notes

- **Spec coverage**: every Keep/Structured section from both worksheets maps to fields above. Cross-cutting answers honoured (section ordering implicit in field order; N-day max=14 on `itinerary.days`; coach card minimal on Events via the team-bullets pattern with framing paragraph; FAQs+Reviews as own collections per Martin's notes; `Event.locations` hasMany).
- **Open items deferred**: where Martin said "TBD" (date-variant listing on category page), the schema doesn't enforce a single answer — `Types` has `coaches` and accommodation but doesn't yet have a "linked events list" field; that's a render-layer concern (Plan 2 queries `Events` filtered by `types`).
- **Coach card shape**: Martin confirmed minimal on detail (Events). Implementation uses a `coaches` relation + `coachFramingParagraph` + `coachTeamBullets` — the bio + credentials live on the `Guides` collection itself (the rich card on Types pulls more from Guides; the minimal card on Events pulls less). No separate `coachCardShape` enum needed — the page type itself dictates.
- **Partner block ↔ existing `Partners` collection**: this plan adds Event-side partner copy (eyebrow, headline, description, benefits) so per-event partner messaging is editable; the partner record itself (logo, name, link) lives in the existing collection.
