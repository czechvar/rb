# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the rockbusters backend — a Payload 3 + Next.js app with all content/commerce-foundation collections and a working admin panel.

**Architecture:** Payload 3 installs into a Next.js app (single repo, single deploy target: Vercel). Postgres via the Payload Postgres adapter (Neon in production). All domain data lives in Payload collections; the admin panel is generated. This phase delivers the admin/data layer only — no public storefront, no checkout, no payments wiring.

**Tech Stack:** TypeScript, Next.js (App Router), Payload 3, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, `@payloadcms/storage-s3` (Cloudflare R2), Neon Postgres, Vitest.

**Reference:** Design spec `docs/superpowers/specs/2026-05-22-rockbusters-rebuild-design.md` (§2 stack, §3 data model).

**Prerequisites (human-supplied):**
- Node.js ≥ 20.9.0.
- A Neon Postgres connection string for the **dev** database.
- A second Postgres connection string for the **test** database (a separate Neon branch, or a local Postgres). Tests must never run against the dev database.

---

## Execution status & post-scaffold conventions

**Tasks 1–3 are COMPLETE** (done by the controller as environment setup): the
Payload 3.84.1 blank template is scaffolded into the repo, `.env`/`.env.test`
are configured (Neon dev + Neon test branch), and the Vitest harness is
isolated onto the test database with a `getTestPayload()` helper.

The scaffold differs from this plan's pre-scaffold assumptions. **Tasks 4–15
use these conventions** wherever the task text below says otherwise:

| Plan text says | Use instead |
|---|---|
| `npm` / `npm install` | `pnpm` / `pnpm add` (`pnpm add -D` for dev deps) |
| `DATABASE_URI` | `DATABASE_URL` |
| `npm test -- <file>` | `pnpm test:int <name>` |
| test files in `tests/collections/` | `tests/int/` (Vitest only includes `tests/int/**/*.int.spec.ts`) |
| `tests/helpers/payload.ts` import | from a `tests/int/` spec, import `../helpers/payload` |
| `npm run build` | `pnpm build` |

Stack: Payload 3.84.1, Next 16, React 19. `getTestPayload()` already exists at
`tests/helpers/payload.ts`.

---

## File Structure

Created by the scaffold (Task 1), then extended:

- `src/payload.config.ts` — Payload config: db adapter, collections array, plugins.
- `src/collections/` — one file per collection.
- `src/fields/slug.ts` — reusable slug field + slugify hook.
- `src/fields/seo.ts` — reusable SEO field group.
- `src/access/index.ts` — access-control functions (`anyone`, `isAdmin`, `isAdminOrSelf`).
- `src/app/(payload)/` — Payload admin routes (scaffold-generated).
- `src/payments/` — existing draft code, untouched this phase.
- `tests/helpers/` — test harness (`payload.ts`, `setup.ts`).
- `tests/collections/` — one `*.int.spec.ts` per collection.
- `vitest.config.mts`, `.env`, `.env.test`, `vercel.json`.

---

## Task 1: Scaffold Payload 3 + Next.js into the repo

**Files:**
- Create: entire Payload/Next.js project skeleton at the repo root.
- Modify: `.gitignore` (reconcile with the generated one).

- [ ] **Step 1: Verify Node version**

Run: `node --version`
Expected: `v20.9.0` or higher. If lower, stop and upgrade Node.

- [ ] **Step 2: Scaffold into a temporary sibling directory**

Run from the parent of the repo (`/Users/janantl/Work/rockbusters/`):

```bash
npx create-payload-app@latest rb-scaffold
```

Answer the interactive prompts:
- Template: **blank**
- Database: **PostgreSQL**
- Database connection string: paste the **dev** Neon connection string
- Install dependencies: **yes**

This generates a working Next.js + Payload project in `rb-scaffold/`.

- [ ] **Step 3: Move the generated project into the repo root**

Run from the repo root (`/Users/janantl/Work/rockbusters/v3/`):

```bash
rsync -a --exclude='.git' --exclude='node_modules' ../rb-scaffold/ ./
rm -rf ../rb-scaffold
npm install
```

The generated `src/` merges with the existing `src/payments/` (additive — no conflict).

- [ ] **Step 4: Reconcile `.gitignore`**

The generated `.gitignore` overwrote ours. Ensure it still ignores the brainstorm directory — append this line if absent:

```
.superpowers/
```

Confirm `.gitignore` also contains `node_modules`, `.env`, and `.next` (the generator includes these).

- [ ] **Step 5: Verify the app boots**

Run: `npm run dev`
Open `http://localhost:3000/admin` — Payload should prompt to create the first admin user. Create one (note the email/password). Then stop the dev server (Ctrl+C).
Expected: the admin panel loads and the first user is created.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Payload 3 + Next.js project"
```

---

## Task 2: Database and environment configuration

**Files:**
- Create: `.env.test`
- Modify: `.env`

- [ ] **Step 1: Confirm the dev `.env`**

Open `.env` (generated by Task 1). Confirm it contains a `DATABASE_URI` (the dev Neon string) and a `PAYLOAD_SECRET` (auto-generated). Leave both as-is.

- [ ] **Step 2: Create `.env.test`**

Create `.env.test` pointing at the **test** database (never the dev one):

```
DATABASE_URI=<test database connection string>
PAYLOAD_SECRET=test-secret-not-for-production
```

- [ ] **Step 3: Verify `.env.test` is gitignored**

Run: `git check-ignore .env.test`
Expected: prints `.env.test` (it matches the `.env*` pattern). If it prints nothing, add `.env.test` to `.gitignore`.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: add test environment configuration"
```

(`.env` and `.env.test` are gitignored and not committed.)

---

## Task 3: Vitest integration-test harness

**Files:**
- Create: `vitest.config.mts`, `tests/helpers/setup.ts`, `tests/helpers/payload.ts`, `tests/helpers/harness.int.spec.ts`
- Modify: `package.json` (devDependencies + `test` script)

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest vite-tsconfig-paths dotenv
```

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.mts`:

```ts
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    setupFiles: ['./tests/helpers/setup.ts'],
    include: ['tests/**/*.int.spec.ts'],
    testTimeout: 30_000,
    hookTimeout: 90_000,
    fileParallelism: false,
  },
})
```

- [ ] **Step 3: Create the env setup file**

Create `tests/helpers/setup.ts`:

```ts
import { config } from 'dotenv'

config({ path: '.env.test', override: true })
```

- [ ] **Step 4: Create the Payload test helper**

Create `tests/helpers/payload.ts`:

```ts
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

let instance: Payload | undefined

/** Returns a shared Payload instance bound to the test database. */
export const getTestPayload = async (): Promise<Payload> => {
  instance ??= await getPayload({ config })
  return instance
}
```

- [ ] **Step 5: Add the `test` script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 6: Write the harness test**

Create `tests/helpers/harness.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getTestPayload } from './payload'

describe('payload test harness', () => {
  it('boots a Payload instance against the test database', async () => {
    const payload = await getTestPayload()
    expect(payload.config.collections.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 7: Run the harness test**

Run: `npm test`
Expected: PASS. On first run Payload's Drizzle `push` creates the schema in the test database.

- [ ] **Step 8: Commit**

```bash
git add vitest.config.mts tests/ package.json package-lock.json
git commit -m "test: add Vitest Payload integration harness"
```

---

## Task 4: Shared helpers — slug field, SEO fields, access control

**Files:**
- Create: `src/fields/slug.ts`, `src/fields/seo.ts`, `src/access/index.ts`
- Test: `tests/helpers/helpers.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/helpers/helpers.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { slugify } from '../../src/fields/slug'
import { isAdmin } from '../../src/access'

describe('shared helpers', () => {
  it('slugifies a title', () => {
    expect(slugify('Beginner Multi-Pitch Course!')).toBe('beginner-multi-pitch-course')
  })

  it('isAdmin is true only for admin users', () => {
    expect(isAdmin({ req: { user: { role: 'admin' } } } as never)).toBe(true)
    expect(isAdmin({ req: { user: { role: 'customer' } } } as never)).toBe(false)
    expect(isAdmin({ req: { user: null } } as never)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- helpers.int.spec.ts`
Expected: FAIL — modules `src/fields/slug` and `src/access` do not exist.

- [ ] **Step 3: Create the slug field helper**

Create `src/fields/slug.ts`:

```ts
import type { Field } from 'payload'

/** Lowercase, hyphenated, alphanumeric-only slug. */
export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * A required, unique slug field. Auto-fills from `source` when left blank.
 * @param source name of the field to derive the slug from (default: 'title')
 */
export const slugField = (source = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: { position: 'sidebar' },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (value) return value
        const src = data?.[source]
        return src ? slugify(String(src)) : value
      },
    ],
  },
})
```

- [ ] **Step 4: Create the SEO field helper**

Create `src/fields/seo.ts`:

```ts
import type { Field } from 'payload'

/** Reusable SEO metadata group. */
export const seoFields: Field = {
  name: 'seo',
  type: 'group',
  label: 'SEO',
  fields: [
    { name: 'title', type: 'text' },
    { name: 'keywords', type: 'text' },
    { name: 'description', type: 'textarea' },
  ],
}
```

- [ ] **Step 5: Create the access helpers**

Create `src/access/index.ts`:

```ts
import type { Access } from 'payload'

/** Public — anyone can perform the operation. */
export const anyone: Access = () => true

/** Only authenticated admin users. */
export const isAdmin: Access = ({ req }) => req.user?.role === 'admin'

/** Admins, or the user acting on their own document. */
export const isAdminOrSelf: Access = ({ req }) => {
  if (!req.user) return false
  if (req.user.role === 'admin') return true
  return { id: { equals: req.user.id } }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- helpers.int.spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/fields/ src/access/ tests/helpers/helpers.int.spec.ts
git commit -m "feat: add slug, SEO and access-control helpers"
```

---

## Task 5: Media collection + Cloudflare R2 storage

**Files:**
- Modify (overwrite the scaffold stub): `src/collections/Media.ts`
- Create: `tests/int/media.int.spec.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/media.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

// 1×1 transparent PNG
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAen63NgAAAAASUVORK5CYII=',
  'base64',
)

describe('media collection', () => {
  it('stores an uploaded image', async () => {
    const payload = await getTestPayload()
    const media = await payload.create({
      collection: 'media',
      data: { alt: 'test image' },
      file: {
        data: tinyPng,
        mimetype: 'image/png',
        name: `t-${Date.now()}.png`,
        size: tinyPng.length,
      },
    })
    expect(media.id).toBeDefined()
    expect(media.alt).toBe('test image')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:int media`
Expected: FAIL until the collection is brought to spec.

- [ ] **Step 3: Replace the Media collection**

Overwrite `src/collections/Media.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { group: 'Library' },
  upload: true,
  fields: [{ name: 'alt', type: 'text', required: true }],
}
```

- [ ] **Step 4: Install and register the Cloudflare R2 storage plugin**

R2 is S3-compatible, so Payload's S3 storage adapter is used. Install:

```bash
pnpm add @payloadcms/storage-s3@3.84.1
```

In `src/payload.config.ts`, add the import (`Media` is already imported and in the `collections` array from the scaffold — leave that, ensure it appears exactly once):

```ts
import { s3Storage } from '@payloadcms/storage-s3'
```

Add to the `plugins` array:

```ts
s3Storage({
  enabled: Boolean(process.env.R2_ACCESS_KEY_ID),
  collections: { media: true },
  bucket: process.env.R2_BUCKET ?? '',
  config: {
    endpoint: process.env.R2_ENDPOINT,
    region: 'auto',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  },
}),
```

The plugin is disabled when `R2_ACCESS_KEY_ID` is absent (the test environment has no R2 credentials), so tests fall back to Payload's local disk storage. R2 env vars are supplied per environment: `R2_BUCKET`, `R2_ENDPOINT` (`https://<account-id>.r2.cloudflarestorage.com`), `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test:int media`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/collections/Media.ts src/payload.config.ts tests/int/media.int.spec.ts package.json pnpm-lock.yaml
git commit -m "feat: add Media collection with Cloudflare R2 storage"
```

---

## Task 6: Users collection (auth, roles, access)

**Files:**
- Create: `src/collections/Users.ts`, `tests/collections/users.int.spec.ts`
- Modify: `src/payload.config.ts` (replace the scaffold's `Users` collection)

- [ ] **Step 1: Write the failing test**

Create `tests/collections/users.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('users collection', () => {
  it('creates a customer with a role', async () => {
    const payload = await getTestPayload()
    const user = await payload.create({
      collection: 'users',
      data: {
        email: `c-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test Customer',
        role: 'customer',
      },
    })
    expect(user.id).toBeDefined()
    expect(user.role).toBe('customer')
  })

  it('defaults role to customer', async () => {
    const payload = await getTestPayload()
    const user = await payload.create({
      collection: 'users',
      data: {
        email: `d-${Date.now()}@example.com`,
        password: 'password123',
        name: 'No Role',
      },
    })
    expect(user.role).toBe('customer')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- users.int.spec.ts`
Expected: FAIL — `role` field does not exist on the scaffold's Users collection.

- [ ] **Step 3: Create the Users collection**

Create `src/collections/Users.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminOrSelf } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email', group: 'Admin' },
  access: {
    read: isAdminOrSelf,
    create: isAdmin,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'customer',
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Admin', value: 'admin' },
      ],
    },
    {
      name: 'addresses',
      type: 'array',
      fields: [
        { name: 'street', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'postalCode', type: 'text' },
        { name: 'country', type: 'text' },
      ],
    },
  ],
}
```

- [ ] **Step 4: Register the collection**

In `src/payload.config.ts`, replace the scaffold's inline `Users` import/definition with `import { Users } from './collections/Users'` and keep `Users` in the `collections` array. Delete the scaffold-generated `src/collections/Users.ts` content if it differs, or overwrite it with the above.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- users.int.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/collections/Users.ts src/payload.config.ts tests/collections/users.int.spec.ts
git commit -m "feat: add Users collection with roles and access control"
```

---

## Task 7: Difficulty and Type collections

**Files:**
- Create: `src/collections/Difficulties.ts`, `src/collections/Types.ts`, `tests/collections/taxonomy-tags.int.spec.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/collections/taxonomy-tags.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('difficulty and type collections', () => {
  it('creates a difficulty', async () => {
    const payload = await getTestPayload()
    const doc = await payload.create({
      collection: 'difficulties',
      data: { name: `Beginner ${Date.now()}`, active: true },
    })
    expect(doc.id).toBeDefined()
  })

  it('creates a type', async () => {
    const payload = await getTestPayload()
    const doc = await payload.create({
      collection: 'types',
      data: { name: `Multi-pitch ${Date.now()}`, active: true },
    })
    expect(doc.id).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- taxonomy-tags.int.spec.ts`
Expected: FAIL — collections `difficulties` and `types` are not registered.

- [ ] **Step 3: Create the Difficulties collection**

Create `src/collections/Difficulties.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const Difficulties: CollectionConfig = {
  slug: 'difficulties',
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'Taxonomy' },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'active', type: 'checkbox', defaultValue: false },
  ],
}
```

- [ ] **Step 4: Create the Types collection**

Create `src/collections/Types.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const Types: CollectionConfig = {
  slug: 'types',
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'Taxonomy' },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'active', type: 'checkbox', defaultValue: false },
  ],
}
```

- [ ] **Step 5: Register the collections**

In `src/payload.config.ts`, import both and add them to the `collections` array:

```ts
import { Difficulties } from './collections/Difficulties'
import { Types } from './collections/Types'
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- taxonomy-tags.int.spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/collections/Difficulties.ts src/collections/Types.ts src/payload.config.ts tests/collections/taxonomy-tags.int.spec.ts
git commit -m "feat: add Difficulty and Type collections"
```

---

## Task 8: Category collection

**Files:**
- Create: `src/collections/Categories.ts`, `tests/collections/categories.int.spec.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/collections/categories.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('categories collection', () => {
  it('creates a category and auto-fills the slug', async () => {
    const payload = await getTestPayload()
    const doc = await payload.create({
      collection: 'categories',
      data: { name: `Sport Climbing ${Date.now()}`, active: true },
    })
    expect(doc.id).toBeDefined()
    expect(doc.slug).toMatch(/^sport-climbing-/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- categories.int.spec.ts`
Expected: FAIL — collection `categories` is not registered.

- [ ] **Step 3: Create the Categories collection**

Create `src/collections/Categories.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'Taxonomy' },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'text', type: 'textarea' },
    { name: 'position', type: 'number', defaultValue: 0 },
    { name: 'active', type: 'checkbox', defaultValue: false },
  ],
}
```

- [ ] **Step 4: Register the collection**

In `src/payload.config.ts`, add `import { Categories } from './collections/Categories'` and include `Categories` in the `collections` array.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- categories.int.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/collections/Categories.ts src/payload.config.ts tests/collections/categories.int.spec.ts
git commit -m "feat: add Category collection"
```

---

## Task 9: Guide collection

**Files:**
- Create: `src/collections/Guides.ts`, `tests/collections/guides.int.spec.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/collections/guides.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('guides collection', () => {
  it('creates a guide and auto-fills the slug', async () => {
    const payload = await getTestPayload()
    const doc = await payload.create({
      collection: 'guides',
      data: { name: `Jane Doe ${Date.now()}`, email: 'jane@example.com', active: true },
    })
    expect(doc.id).toBeDefined()
    expect(doc.slug).toMatch(/^jane-doe-/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- guides.int.spec.ts`
Expected: FAIL — collection `guides` is not registered.

- [ ] **Step 3: Create the Guides collection**

Create `src/collections/Guides.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'

export const Guides: CollectionConfig = {
  slug: 'guides',
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'People' },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'content', type: 'richText' },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
    { name: 'vimeoId', type: 'text' },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'active', type: 'checkbox', defaultValue: false },
    seoFields,
  ],
}
```

- [ ] **Step 4: Register the collection**

In `src/payload.config.ts`, add `import { Guides } from './collections/Guides'` and include `Guides` in the `collections` array.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- guides.int.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/collections/Guides.ts src/payload.config.ts tests/collections/guides.int.spec.ts
git commit -m "feat: add Guide collection"
```

---

## Task 10: Location collection

**Files:**
- Create: `src/collections/Locations.ts`, `tests/collections/locations.int.spec.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/collections/locations.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('locations collection', () => {
  it('creates a location with coordinates', async () => {
    const payload = await getTestPayload()
    const doc = await payload.create({
      collection: 'locations',
      data: {
        name: `Kalymnos ${Date.now()}`,
        city: 'Kalymnos',
        country: 'Greece',
        coordinates: [26.98, 36.95],
        active: true,
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.slug).toMatch(/^kalymnos-/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- locations.int.spec.ts`
Expected: FAIL — collection `locations` is not registered.

- [ ] **Step 3: Create the Locations collection**

Create `src/collections/Locations.ts`. The `point` field stores `[longitude, latitude]`.

```ts
import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'

export const Locations: CollectionConfig = {
  slug: 'locations',
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'Taxonomy' },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'content', type: 'richText' },
    { name: 'address', type: 'text' },
    { name: 'city', type: 'text' },
    { name: 'country', type: 'text' },
    { name: 'coordinates', type: 'point', label: 'Coordinates [lng, lat]' },
    { name: 'active', type: 'checkbox', defaultValue: false },
    seoFields,
  ],
}
```

- [ ] **Step 4: Register the collection**

In `src/payload.config.ts`, add `import { Locations } from './collections/Locations'` and include `Locations` in the `collections` array.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- locations.int.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/collections/Locations.ts src/payload.config.ts tests/collections/locations.int.spec.ts
git commit -m "feat: add Location collection"
```

---

## Task 11: Airport collection

**Files:**
- Create: `src/collections/Airports.ts`, `tests/collections/airports.int.spec.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/collections/airports.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('airports collection', () => {
  it('creates an airport', async () => {
    const payload = await getTestPayload()
    const doc = await payload.create({
      collection: 'airports',
      data: {
        name: `Kos Island ${Date.now()}`,
        iata: 'KGS',
        country: 'Greece',
        continent: 'Europe',
        coordinates: [27.09, 36.79],
        size: 3,
        active: true,
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.iata).toBe('KGS')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- airports.int.spec.ts`
Expected: FAIL — collection `airports` is not registered.

- [ ] **Step 3: Create the Airports collection**

Create `src/collections/Airports.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const Airports: CollectionConfig = {
  slug: 'airports',
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'Taxonomy' },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'iata', type: 'text', required: true },
    { name: 'country', type: 'text' },
    { name: 'continent', type: 'text' },
    { name: 'coordinates', type: 'point', label: 'Coordinates [lng, lat]' },
    { name: 'size', type: 'number' },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
```

- [ ] **Step 4: Register the collection**

In `src/payload.config.ts`, add `import { Airports } from './collections/Airports'` and include `Airports` in the `collections` array.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- airports.int.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/collections/Airports.ts src/payload.config.ts tests/collections/airports.int.spec.ts
git commit -m "feat: add Airport collection"
```

---

## Task 12: Partner collection

**Files:**
- Create: `src/collections/Partners.ts`, `tests/collections/partners.int.spec.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/collections/partners.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('partners collection', () => {
  it('creates a partner and auto-fills the slug', async () => {
    const payload = await getTestPayload()
    const doc = await payload.create({
      collection: 'partners',
      data: {
        name: `Climbing Co ${Date.now()}`,
        link: 'https://example.com',
        featured: true,
        active: true,
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.slug).toMatch(/^climbing-co-/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- partners.int.spec.ts`
Expected: FAIL — collection `partners` is not registered.

- [ ] **Step 3: Create the Partners collection**

Create `src/collections/Partners.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'

export const Partners: CollectionConfig = {
  slug: 'partners',
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'People' },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'link', type: 'text' },
    { name: 'description', type: 'richText' },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'active', type: 'checkbox', defaultValue: false },
  ],
}
```

- [ ] **Step 4: Register the collection**

In `src/payload.config.ts`, add `import { Partners } from './collections/Partners'` and include `Partners` in the `collections` array.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- partners.int.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/collections/Partners.ts src/payload.config.ts tests/collections/partners.int.spec.ts
git commit -m "feat: add Partner collection"
```

---

## Task 13: Event collection

**Files:**
- Create: `src/collections/Events.ts`, `tests/collections/events.int.spec.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/collections/events.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('events collection', () => {
  it('creates an event with default draft state and auto slug', async () => {
    const payload = await getTestPayload()
    const doc = await payload.create({
      collection: 'events',
      data: {
        title: `Multi-Pitch Course ${Date.now()}`,
        shortDescription: 'Learn multi-pitch climbing.',
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.slug).toMatch(/^multi-pitch-course-/)
    expect(doc.state).toBe('draft')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- events.int.spec.ts`
Expected: FAIL — collection `events` is not registered.

- [ ] **Step 3: Create the Events collection**

Create `src/collections/Events.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'

export const Events: CollectionConfig = {
  slug: 'events',
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'title', group: 'Catalogue' },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    { name: 'shortDescription', type: 'textarea' },
    { name: 'content', type: 'richText' },
    {
      name: 'additionalInfo',
      type: 'array',
      label: 'Additional info sections',
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'body', type: 'richText' },
      ],
    },
    { name: 'mainPicture', type: 'upload', relationTo: 'media' },
    { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true },
    { name: 'vimeoId', type: 'text' },
    { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true },
    { name: 'difficulties', type: 'relationship', relationTo: 'difficulties', hasMany: true },
    { name: 'types', type: 'relationship', relationTo: 'types', hasMany: true },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    {
      name: 'state',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    seoFields,
  ],
}
```

- [ ] **Step 4: Register the collection**

In `src/payload.config.ts`, add `import { Events } from './collections/Events'` and include `Events` in the `collections` array.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- events.int.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/collections/Events.ts src/payload.config.ts tests/collections/events.int.spec.ts
git commit -m "feat: add Event collection"
```

---

## Task 14: Event Date collection

**Files:**
- Create: `src/collections/EventDates.ts`, `tests/collections/event-dates.int.spec.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/collections/event-dates.int.spec.ts`. An Event Date requires a parent Event, so the test creates one first.

```ts
import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('event-dates collection', () => {
  it('creates an event date linked to an event', async () => {
    const payload = await getTestPayload()
    const event = await payload.create({
      collection: 'events',
      data: { title: `Parent Event ${Date.now()}` },
    })
    const doc = await payload.create({
      collection: 'event-dates',
      data: {
        event: event.id,
        dateFrom: '2026-07-01T08:00:00.000Z',
        dateTo: '2026-07-05T16:00:00.000Z',
        price: 499,
        vat: 21,
        currency: 'EUR',
        capacity: 12,
        active: true,
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.capacity).toBe(12)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- event-dates.int.spec.ts`
Expected: FAIL — collection `event-dates` is not registered.

- [ ] **Step 3: Create the EventDates collection**

Create `src/collections/EventDates.ts`. `price`/`vat` use `number` for Phase 1; monetary precision is revisited in Phase 3 (checkout).

```ts
import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const EventDates: CollectionConfig = {
  slug: 'event-dates',
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'dateFrom', group: 'Catalogue' },
  fields: [
    { name: 'event', type: 'relationship', relationTo: 'events', required: true },
    { name: 'dateFrom', type: 'date', required: true },
    { name: 'dateTo', type: 'date', required: true },
    { name: 'locations', type: 'relationship', relationTo: 'locations', hasMany: true },
    { name: 'guides', type: 'relationship', relationTo: 'guides', hasMany: true },
    { name: 'airportFrom', type: 'relationship', relationTo: 'airports' },
    { name: 'airportTo', type: 'relationship', relationTo: 'airports' },
    { name: 'price', type: 'number', required: true },
    { name: 'vat', type: 'number', required: true, defaultValue: 0 },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'EUR',
      options: [
        { label: 'EUR', value: 'EUR' },
        { label: 'CZK', value: 'CZK' },
      ],
    },
    { name: 'capacity', type: 'number', required: true },
    { name: 'minParticipants', type: 'number', defaultValue: 0 },
    { name: 'extraContent', type: 'richText' },
    { name: 'active', type: 'checkbox', defaultValue: false },
  ],
}
```

- [ ] **Step 4: Register the collection**

In `src/payload.config.ts`, add `import { EventDates } from './collections/EventDates'` and include `EventDates` in the `collections` array.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- event-dates.int.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/collections/EventDates.ts src/payload.config.ts tests/collections/event-dates.int.spec.ts
git commit -m "feat: add Event Date collection"
```

---

## Task 15: Full suite, admin verification, and Vercel deploy config

**Files:**
- Create: `vercel.json`
- Modify: none (verification task)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all `*.int.spec.ts` files PASS. Fix any failures before continuing.

- [ ] **Step 2: Type-check and build**

Run: `npm run build`
Expected: the Next.js + Payload build completes with no type errors.

- [ ] **Step 3: Verify the admin panel manually**

Run: `npm run dev`, open `http://localhost:3000/admin`, log in. Confirm the left nav shows all collections grouped: **Catalogue** (Events, Event Dates), **Taxonomy** (Categories, Difficulties, Types, Locations, Airports), **People** (Guides, Partners), **Library** (Media), **Admin** (Users). Create one Event and one Event Date through the UI to confirm relationships pick correctly. Stop the dev server.

- [ ] **Step 4: Create the Vercel config**

Create `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "next build",
  "framework": "nextjs"
}
```

(Cron entries for payment-status polling and hold release are added in Phase 4 — not part of Phase 1.)

- [ ] **Step 5: Document required Vercel environment variables**

Append to `CLAUDE.md` a short "Deployment" note listing the env vars Vercel needs: `DATABASE_URL` (Neon), `PAYLOAD_SECRET`, and the Cloudflare R2 set `R2_BUCKET` / `R2_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`.

- [ ] **Step 6: Commit**

```bash
git add vercel.json CLAUDE.md
git commit -m "chore: add Vercel deploy config and document env vars"
```

---

## Done — Phase 1 complete

The repo now holds a deployable Payload 3 + Next.js app with all foundation collections, a passing integration-test suite, and an admin panel. Next: Phase 2 (Storefront) — gated on delivery of the Figma design files.
