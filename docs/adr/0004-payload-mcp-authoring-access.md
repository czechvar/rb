# ADR-0004: Payload MCP Authoring Access

- Status: Proposed
- Date: 2026-08-27
- Owners: Engineering

## Context

Rockbusters needs MCP access to Payload so the business owner can create and
edit CMS-managed pages from clients such as ChatGPT and Claude, and developers
can do the same from Codex. The same authoring workflow should also support
core catalogue content, because page blocks commonly depend on Events, Event
Dates, Programs, Locations, Guides, Airports, taxonomy records, FAQs, Reviews,
Partners, Posts, and Post Categories.

The existing Payload model already separates public page composition from
commerce and account data. `pages` uses approved block contracts rather than
arbitrary component names or executable code. Catalogue collections require
admin access for writes. Auth, orders, transactions, discount codes, and
referrals carry higher operational and privacy risk and are not needed for the
first MCP authoring workflow.

The Payload MCP plugin exposes collection operations as tools. Its config is
the maximum allowed surface, while the MCP API Keys collection can further
restrict permissions per key at runtime. Payload access control and hooks still
apply to MCP operations.

## Decision

Enable the official `@payloadcms/plugin-mcp` plugin, pinned to the same version
as the Payload packages in this app.

Expose `find`, `create`, and `update` over MCP for:

- `pages`
- `media`
- `events`
- `event-dates`
- `programs`
- `locations`
- `guides`
- `airports`
- `categories`
- `difficulties`
- `faqs`
- `reviews`
- `partners`
- `posts`
- `post-categories`

Do not expose `delete` for any collection in the first rollout.

Do not expose MCP operations for:

- `users`
- `orders`
- `transactions`
- `discount-codes`
- `referrals`

MCP API keys must be created for admin users when they need authoring access,
because current collection access rules require admin identity for catalogue and
page writes. Treat those keys as production secrets.

## Alternatives Considered

- Read-only MCP access: rejected because the primary requirement is page and
  catalogue authoring from MCP clients.
- Full CRUD for all collections: rejected because users, orders, discounts, and
  referrals are unnecessary for page authoring and carry avoidable privacy,
  commerce, and destructive-action risk.
- Enable delete for page and catalogue collections: deferred until the authoring
  workflow has proven reliable and deletion/audit expectations are explicit.
- Build a custom MCP server instead of using Payload's plugin: rejected for now
  because the official plugin already integrates with Payload collection
  schemas, access control, hooks, and admin-managed API keys.
- Expose only `pages` and `media`: rejected because useful page creation often
  needs to discover or create related catalogue content that blocks reference.

## Consequences

- Business owners and developers can create draft pages and update catalogue
  content from MCP-capable clients while reusing Payload validation, access
  control, hooks, and block contracts.
- Agent-created pages can reference and maintain the same core catalogue records
  used by the public site instead of creating isolated page-only content.
- Destructive operations remain outside MCP initially, reducing the blast radius
  of mistaken prompts, compromised client sessions, or overly broad agent
  actions.
- Admin MCP API keys become high-value credentials and need normal production
  secret handling, rotation discipline, and limited client distribution.
- The plugin adds MCP admin/key management and may require generated types,
  import map updates, and deployment schema planning.
- Initial verification must include an authenticated MCP smoke test that creates
  a clearly marked draft page and a cleanup path for that record.

## References

- `src/payload.config.ts`
- `src/collections/Pages.ts`
- `src/blocks/index.ts`
- `docs/adr/0001-payload-blocks-page-composition.md`
- `docs/adr/0003-canonical-block-layouts.md`
- Payload MCP documentation: https://payloadcms.com/docs/plugins/mcp
- Workstreams task `b184d4fc-2c5d-4199-8a5f-3e3123a06e5f`
