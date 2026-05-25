# Task 354 - Timeline And Customer-facing Report Access-control Test Plan / No Runtime Change

## Scope Summary

This document defines a future access-control test plan for customer-visible appointment timelines and customer-facing service reports.

Task354 is documentation-only. It does not modify `src/`, `admin/src/`, `scripts/smoke/`, migrations, schema, indexes, API contracts, package configuration, provider integrations, notification sending, AI / RAG runtime, billing, invoice, payment, customer-facing report runtime, timeline runtime, survey, complaint, callback, inventory, parts, WMS, supervisor override, correction runtime, or access-control runtime.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task354 extends:

- Task352 customer-visible appointment timeline policy,
- Task353 customer-facing service report alignment review.

## Protected Surfaces

Future customer-facing surfaces that need access-control tests include:

- customer-visible appointment timeline,
- customer-facing service report,
- completion report link,
- report issue / unresolved issue entrypoint,
- satisfaction survey entrypoint,
- SMS-directed Web link,
- LINE-directed access surface,
- App-directed access surface,
- Web portal access surface.

These surfaces are customer-facing projections or filtered views.

They are not the internal source of truth and must not expose raw internal appointment rows, raw internal Field Service Reports, audit logs, billing internals, settlement internals, provider payloads, or AI raw payload.

## Identity And Access Assumptions

Future implementation should assume:

- `line_user_id` is not a global identity,
- customer channel identity must be scoped by `organization_id`, channel / provider scope, and external user identity,
- Web links and SMS links must not rely only on guessable IDs,
- access should require verification, consent, a safe access token, or another approved customer identity mechanism,
- wrong customer, wrong Case, wrong organization, expired link, revoked link, and missing consent must not leak existence details,
- safe deny and enumeration protection are required,
- no customer-facing access path may bypass organization scope,
- no customer-facing access path may expose another customer's Case or report.

Error responses must not reveal whether:

- a Case exists,
- a customer exists,
- a phone number is correct,
- a LINE binding exists,
- an organization exists,
- an appointment exists,
- a report exists.

Internal audit or security events may record richer diagnostic details, but the customer-facing response must remain generic and safe.

## Test Scenario Matrix

| Scenario | Required access result | Data that may be shown | Data that must remain hidden | Expected safe-deny behavior | Future test type suggestion |
| --- | --- | --- | --- | --- | --- |
| Same organization + verified customer + correct Case | Allow filtered view. | Customer-safe timeline status, confirmed appointment window, customer-facing report link after completion, issue report entrypoint, survey entrypoint if eligible. | Internal notes, audit log, raw AI payload, billing/settlement internals, raw provider payloads, internal IDs. | Not applicable. | Integration test with projected customer view. |
| Same organization + unverified customer | Deny or require verification. | Generic verification-required state only. | All Case, appointment, report, customer, and channel details. | Generic response that does not confirm Case/customer existence. | API safe-deny test. |
| Same organization + wrong customer identity | Deny. | Generic safe-deny only. | All timeline/report fields and all customer details. | Same message as other unauthorized cases. | API safe-deny test with wrong customer binding. |
| Different organization + same external channel ID | Deny. | Generic safe-deny only. | All cross-organization Case, timeline, report, customer, channel, and organization data. | Must not reveal that the channel ID exists elsewhere. | Cross-tenant isolation test. |
| Different organization + same phone-like identifier | Deny. | Generic safe-deny only. | Case/customer/report details in the other organization. | Must not reveal whether the phone-like identifier matches a customer. | Cross-tenant isolation and enumeration test. |
| Expired link | Deny or require re-verification. | Generic expired / unavailable state if policy allows. | Case existence, customer existence, internal identifiers, report content. | Must not reveal whether the expired link used to be valid. | Link lifecycle safe-deny test. |
| Revoked link | Deny. | Generic unavailable state if policy allows. | Case existence, revocation reason, report content, internal identifiers. | Must not reveal whether the link was revoked for a specific Case. | Link lifecycle safe-deny test. |
| Missing consent | Deny or require consent / verification. | Generic consent-required state if policy allows. | Case details beyond what is needed to obtain consent. | Must not reveal extra Case/customer details. | Consent flow integration test. |
| Deleted / closed / unavailable Case | Safe generic response. | Customer-safe unavailable state if policy allows. | Internal deletion reason, audit log, closed reason if not customer-safe. | Must not distinguish unauthorized from unavailable in a leaky way. | Safe-deny / lifecycle state test. |
| Customer tries another Case ID | Deny. | Generic safe-deny only. | Other Case timeline, report, customer, appointment, channel details. | Same response shape as unauthorized access. | Enumeration protection test. |
| Internal-only fields exist in source data | Allow filtered view but omit internal-only fields. | Only customer-safe projection fields. | Internal notes, engineer comments, supervisor notes, audit, internal billing/settlement. | Not applicable if access otherwise valid. | Projection allow-list test. |
| AI-generated draft exists | Do not expose unless human-approved and customer-safe. | Human-approved customer-safe wording only, if approved. | Raw AI output, prompts, confidence, retrieval sources, internal explanations. | If draft is not approved, response should omit it without indicating sensitive internals. | Projection and AI gate test. |
| Complaint / low rating exists | Allow issue reporting and customer-safe support status if approved. | Customer-safe follow-up status or support entrypoint. | Internal complaint classification, liability analysis, supervisor review, staff notes. | Not applicable if access otherwise valid. | Projection allow-list and complaint privacy test. |
| Billing / settlement data exists | Show only confirmed customer-relevant charges / invoice info if approved. | Customer charge, approval, invoice / receipt status. | Supplier payout, internal cost, margin, settlement rules, reconciliation data. | Not applicable if access otherwise valid. | Billing projection allow-list test. |
| LINE-bound user accessing Web link | Must still pass scoped verification rules. | Customer-safe view only after approved verification. | Raw LINE ID, other channel bindings, internal IDs. | Generic safe-deny if verification fails. | Cross-channel identity test. |
| Web user accessing LINE-originated Case | Must not bypass channel identity or verification rules. | Customer-safe view only after approved verification. | Raw LINE ID, internal channel state, other customer data. | Generic safe-deny if verification fails. | Cross-channel identity test. |

## Safe-deny And Enumeration Protection

Future tests should confirm that customer-facing errors do not reveal:

- whether a Case exists,
- whether a customer exists,
- whether a phone number is correct,
- whether a LINE binding exists,
- whether an organization exists,
- whether an appointment exists,
- whether a report exists,
- whether a link was ever valid,
- whether a Case belongs to another customer.

For unauthorized, wrong customer, wrong organization, expired link, revoked link, missing consent, or unavailable resource cases, the customer-facing response should use a generic safe-deny pattern.

Internal audit, security events, or diagnostic logs may record the specific failure reason when allowed, but those details must not be shown to the customer.

## Must-not-leak Field Checklist

Future projection tests must verify customer-facing outputs do not include:

- internal notes,
- audit log,
- raw AI payload,
- AI prompts,
- raw model output,
- engineer internal comments,
- supervisor notes,
- override reasons,
- dispatch scoring,
- engineer ranking,
- route optimization,
- billing internal rules,
- settlement internal rules,
- vendor reconciliation data,
- brand reconciliation data,
- internal cost,
- margin,
- payout,
- inventory internal data,
- warehouse data,
- stock movement internal data,
- raw LINE user IDs,
- internal channel identifiers,
- full customer phone numbers unless clearly necessary and authorized,
- full customer addresses unless clearly necessary and authorized,
- sensitive provider payloads,
- internal complaint classification,
- database IDs that are not customer-safe,
- organization-internal IDs that are not customer-safe,
- raw webhook payloads.

## AI Boundary In Tests

Future tests should verify:

- AI can only assist with customer-safe wording drafts,
- AI output does not automatically become customer-visible truth,
- AI draft content is not exposed unless it passes permission, customer visible policy, redaction, and human approval gates,
- AI does not hide complaints, negative feedback, or unresolved issues,
- AI context is minimum necessary, masked / redacted, permission-aware, tenant-isolated, and auditable,
- raw AI payload, prompts, retrieved sources, confidence scores, and internal explanations are not leaked to customers.

## Report Issue / Survey Entry Point Boundary

The report issue entrypoint and satisfaction survey entrypoint are customer-facing actions, but they must still follow access control.

Future tests should verify:

- unauthorized customers cannot submit issue reports for someone else's Case,
- expired or revoked links cannot submit issue reports without re-verification,
- survey entrypoints do not reveal Case/report existence to unauthorized users,
- customer issue reports do not expose internal complaint classification,
- low-rating or complaint flows do not leak internal escalation notes.

## Non-goals

Task354 does not:

- add runtime tests,
- add smoke tests,
- add an API contract,
- add a projection service,
- add permission model runtime,
- modify validators,
- modify repositories,
- modify API behavior,
- add a migration,
- add a schema or index change,
- add LINE / SMS / Email / App runtime,
- add AI / RAG runtime,
- add notification sending,
- add billing / settlement runtime,
- add customer-facing report runtime,
- add timeline runtime,
- add survey runtime,
- add complaint / callback runtime,
- change Field Service Report completion,
- change `finalAppointmentId` inference,
- change Case status workflow,
- add inventory / parts / WMS behavior.

## Future Task Candidates

These are future tasks only and must not be implemented as part of Task354.

### Customer-visible Timeline API Contract

Define customer-safe response shape, error shape, safe-deny message keys, and access-control requirements.

### Customer-facing Report API Contract

Define the filtered report response shape and field allow-list.

### Projection Service Permission Filter Design

Design a projection layer that converts internal appointment / report data into customer-safe models.

### Safe-deny Message Key Design

Define message keys that avoid resource enumeration while still guiding legitimate customers.

### Customer Channel Identity Verification Runtime Task

Design runtime verification for LINE, Web link, SMS-directed link, Web portal, and App access.

### Access-control Smoke / Integration Tests

Implement tests only after API contract, projection service, and disposable local/test runtime are available.

### Customer-visible Report And Timeline Localization Policy

Define wording and translations that avoid leaking internal state while staying understandable.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No customer-facing access-control table, timeline table, or report projection table is added by Task354.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke file change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, or production data details.

Future access-control tests must continue to redact sensitive values and avoid exposing internal operational, customer, provider, AI, audit, billing, settlement, inventory, or staff-management data.
