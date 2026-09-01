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

The canonical record type for a climbing place or destination page. A
Location can be a single crag, a bouldering area, a climbing school, a
broader region, or a country-scale destination when that is the useful
customer-facing scope. Instances: _El Chorro_, _Kalymnos_, _Ceüse_,
_Adršpach_, _Andalucía_.

A Location has a country when the country is known. It may also have a
scope such as crag, area, region, country, indoor, or unknown.

Payload collection: `locations`.

## Destination

**Not its own domain concept.** "Destination" is the marketing/UI word
for browsing and reading Location records. A destination detail page can
represent a single crag, a climbing area, a broader region, or a
country-scale destination.

There is no `destinations` collection. There is no Destination record.
The URL `/destinations` and the site nav label "Destinations" are the
customer-facing translations of _"browse Locations"_. Detail URLs under
`/destinations/{slug}` render a single [[Location]] record; that is
route/UI language, not evidence of a Destination entity.

## Guide

The canonical term for a team-member record — a real person the
customer engages with. Instances: _Jany_, guest ambassadors, physios.

A Guide has a `role` (free text, e.g. "Head coach", "Pro climber",
"Physiotherapist"). Not every Guide is a Coach. Not every Guide is a
UIAGM mountain guide either — the word here is broader than its
alpine-industry meaning, because Rockbusters uses it as the umbrella
noun for anyone on the team roster.

Payload collection: `guides`.

## Coach

**Not its own record type.** A Coach is a _role_ — one value the
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
its marketing content. Instances: _"Kalymnos Autumn Camp"_,
_"El Chorro Winter Intensive"_.

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

Instances: _"Kalymnos Autumn Camp, 12–19 Oct 2026, guided by Jany,
from Prague airport"_.

Payload collection: `event-dates`.

Snowbusters merged this from two separate entities (`CourseDate` for
dates, `CoursePrice` for prices) that were not linked to each other.
Rockbusters merges them by design.
