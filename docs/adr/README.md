# Architecture Decision Records

This directory stores Architecture Decision Records (ADRs): short records of
important technical and domain decisions, written when the decision is made or
when an agent discovers that a decision is currently only implicit in plans,
specs, code, or conversation.

ADRs are for decisions that future engineers will need to understand, not for
routine implementation notes.

## When To Add An ADR

Add or update an ADR when work changes or confirms:

- Domain vocabulary or entity boundaries.
- Persistence model, collection structure, or ownership boundaries.
- Auth, access control, account, booking, payment, cache, or deployment behavior.
- A major external integration or provider choice.
- A non-obvious tradeoff, rejected alternative, or production safety rule.

Do not create an ADR for small local refactors, visual tweaks, copy changes, or
straightforward bug fixes unless they establish a reusable rule.

## Naming

Use sequential numbers and a short kebab-case title:

```text
0001-use-payload-next-postgres.md
0002-event-date-is-purchasable-unit.md
```

If no ADRs exist yet, start at `0001`.

## Status Values

Use one of:

- `Proposed`
- `Accepted`
- `Superseded`
- `Deprecated`

If replacing an older ADR, mark the older one as `Superseded` and link to the
new ADR.

## Template

Copy `template.md` and fill it in. Keep ADRs concise: one decision, the context
that forced it, the alternatives considered, and the consequences.
