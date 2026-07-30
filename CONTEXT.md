# Rockbusters — Domain Glossary

This file is the ubiquitous language of the rockbusters.net project.
It is a glossary and nothing else — no schemas, no design decisions, no
implementation notes. Those live in `docs/superpowers/specs/*` and
`docs/adr/*`.

Add a term here the moment its meaning stabilises. If two words seem to
mean the same thing, resolve which one is canonical before writing code
that uses either.

---

## Location

The canonical term for a specific climbing venue — a crag, a bouldering
area, a single climbing school. Instances: *El Chorro*, *Kalymnos*,
*Ceüse*, *Adršpach*.

A Location has a country. Locations are grouped into **Destinations** by
country when browsing.

Payload collection: `locations`.

## Destination

**Not its own domain concept.** "Destination" is the marketing/UI word
for a country-scoped browsing lens over Locations. When a customer
clicks "Destinations → Spain", they see every Location whose
`country === "ES"`.

There is no `destinations` collection. There is no Destination record.
The URL `/destinations` and the site nav label "Destinations" are the
customer-facing translations of *"browse Locations by country"*.

If in the future a country ever needs a stable ID, hero image, or its
own copy, that would elevate Destination into its own concept — until
then, resist creating it.

## Guide

The canonical term for a team-member record — a real person the
customer engages with. Instances: *Jany*, guest ambassadors, physios.

A Guide has a `role` (free text, e.g. "Head coach", "Pro climber",
"Physiotherapist"). Not every Guide is a Coach. Not every Guide is a
UIAGM mountain guide either — the word here is broader than its
alpine-industry meaning, because Rockbusters uses it as the umbrella
noun for anyone on the team roster.

Payload collection: `guides`.

## Coach

**Not its own record type.** A Coach is a *role* — one value the
`Guide.role` field can hold. When we say a Guide "is a coach on this
trip," we mean that Guide has been assigned to an Event and their
role includes coaching. Other Guides on the same Event may act as
physio, pro climber, ambassador, etc.

The Event field `coaches` is a legacy imprecision — it holds a set of
Guide records irrespective of role. It should eventually be renamed
(candidate: `assignedTeam` or `team`) but the record it points at is
always a Guide.

Marketing copy is free to say "coaches" as shorthand — same
UI-translation pattern as [[Destination]] / [[Location]].

## Event

The canonical term for the catalogue concept — a course/trip idea and
its marketing content. Instances: *"Kalymnos Autumn Camp"*,
*"El Chorro Winter Intensive"*.

An Event has many [[Event Date]]s (scheduled runs), belongs to one or
more [[Type]]s (marketing product lines), and is delivered by one or
more [[Guide]]s.

Payload collection: `events`.

## Trip

The customer-facing word for an [[Event]]. Public URLs, nav copy, and
marketing prose all say "Trip". Internally the record is always Event
— "Trip" is a UI-only translation, same pattern as
[[Destination]] / [[Location]] and [[Coach]] / [[Guide]].

Do not create a `Trip` record type. If a document mentions "Trip", it
refers to an Event.

## Event Date

The specific dated occurrence of an [[Event]] — a scheduled run with
its own guides, locations, price, capacity, and airport pair. This is
the **purchasable unit**: an Order line item points at an Event Date,
not an Event.

Instances: *"Kalymnos Autumn Camp, 12–19 Oct 2026, guided by Jany,
from Prague airport"*.

Payload collection: `event-dates`.

Snowbusters merged this from two separate entities (`CourseDate` for
dates, `CoursePrice` for prices) that were not linked to each other.
Rockbusters merges them by design.
