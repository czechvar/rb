# ADR-0013: Contact enquiry intake before distribution

- Status: Accepted
- Date: 2026-09-13
- Owners: Engineering

## Context

The Contact Page needs a working submission path. The user clarified that
submitting content to the backend is sufficient; email, CRM distribution and
follow-up are separate work. Waiting for those integrations leaves the form
unusable unnecessarily. The user subsequently selected interim email
notifications while confirming that enquiries must remain stored in Payload.

## Decision

The public Contact Form submits validated enquiries to this project's Payload
backend. Successful submission means the enquiry has been persisted, not that
an email was sent, a conversation was opened, or a person has replied.

After a new enquiry is saved, send one best-effort email notification through
Payload's existing email adapter. Use the published Contact Page's contact inbox,
with an optional server-configured CONTACT_ENQUIRY_EMAIL override. The visitor's
validated email is Reply-To, not the sender or recipient. Use plain text so
visitor content cannot inject HTML. Never send an automatic visitor reply.

Track notification status and acceptance time on the enquiry. A failed or
unconfigured notification does not undo persistence or fail the visitor's
submission. Exact retries do not send a second notification. A pending status
may represent an interrupted attempt; do not blindly retry it automatically.
The console fallback is skipped for this flow to avoid logging message content.
Email transport acceptance is not proof of inbox delivery. CRM distribution and
any reliable retry worker remain separate work.

Enquiries are private operational records, accessible to admins and excluded
from public collection APIs, MCP content authoring and canonical seeds. The
public server action is the constrained intake boundary; it validates and
applies abuse controls before using the local API to create a record.

Use PostgreSQL-backed atomic rate limits shared across application instances,
a honeypot, and stable submission IDs for retry deduplication. Rate-limit keys
must not store raw network addresses. Current limits are five valid attempts per
network, three per email and 100 globally per ten minutes. Trust the
Vercel-provided client address only on Vercel; other hosts share a conservative
unknown-network bucket until their proxy contract is explicitly configured.
Register the operational rate table with Payload via its schema hook so schema
push and migration generation preserve it; do not expose it as a CMS collection. Do not log enquiry bodies or raw runtime
errors. These controls reduce abuse; they do not establish that every sender
is human. Additional bot challenges can be layered on the same boundary if
needed without coupling intake to downstream distribution.

## Alternatives Considered

- Require email/HubSpot/Chatwoot delivery before accepting enquiries: deferred;
  the user explicitly separated intake from distribution.
- In-memory throttling only: rejected because serverless instances do not share
  counters.
- Public collection creation: rejected because it bypasses the constrained
  intake path and its abuse controls.

## Consequences

- Staff can read received enquiries in Payload while distribution is designed.
- Deployments need an additive operational schema migration; a content seed
  does not carry customer messages or throttle state.
- Tests use marked isolated fixtures and clean them; no outbound email or CRM
  activity is needed to verify intake.
- Retention and any future distribution worker are separate operational work;
  do not promise automatic replies or a response-time SLA.

## References

- Workstreams task 352a5b3e-20e8-47dc-93dc-e2945a588e14
- ADR-0012: One canonical content seed

- [Vercel request header contract](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for)
