# Task 363 - Customer Channel Identity Verification Runtime Design / No Runtime Change

## Scope Summary

Task363 is a documentation-only runtime design for future customer channel identity verification.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, projection service runtime, verification runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task363 extends the Task352-362 customer-visible surfaces, API contract, and projection permission filter sequence. It proposes future identity verification boundaries only. It does not implement verification.

## Verification Purpose

Future customer channel identity verification should decide whether a customer-facing access request can be safely connected to the correct organization, channel, customer, Case, and customer-visible surface.

It should support:

- customer-visible appointment timeline,
- customer-facing service report,
- report issue entrypoint,
- survey entrypoint,
- support handoff entrypoint,
- future customer portal / App access.

Verification must prevent raw LINE identifiers, phone-like identifiers, email-like identifiers, link values, or customer-safe references from becoming global identities.

The verification layer should provide the projection service with a fail-closed `customerAccessContext` that tells the projection service whether it may return a customer-safe projection or must return safe-deny.

## Identity Scope Principles

Identity scope must be explicit.

Core principles:

- `line_user_id` is not a global identity.
- Channel identity must be scoped by organization and channel/provider.
- A same external id in a different organization or different LINE channel must be treated as a different identity scope.
- Web, SMS, and Email links must not rely only on guessable Case ids.
- Phone and email can be verification factors or contact channels, but they should not directly equal customer identity.
- Customer identity resolution must not cross organization boundaries.
- Customer identity resolution must not reveal whether another organization, tenant, Case, Customer, report, or LINE binding exists.
- Customer-facing responses must never include raw channel identity values.

Future channel identity should be able to support LINE, Web link, Web portal, App, SMS-directed link, Email-directed link, and customer service assisted handoff without hard-coding one channel as the only path.

## Proposed Verification Context

These fields are proposal-only and do not define a runtime interface.

Potential future verification context:

- `organizationContext`,
- `channelContext`,
- `externalIdentityRef`,
- `customerSafeCaseRef`,
- `customerSafeReportRef`,
- `linkContext`,
- `verificationFactorStatus`,
- `consentStatus`,
- `requestedSurface`,
- `requestedAction`,
- `riskFlags`.

Design constraints:

- Do not include raw provider payload.
- Do not include full phone, full email, or full address unless the step clearly requires it and the value is masked or tightly controlled.
- Do not include cross-organization query results.
- Do not include raw LINE ID in customer-facing response.
- Do not send unmasked verification context to AI.
- Do not expose link values, verification codes, or provider secrets in logs, errors, docs, or customer responses.

The verification context should produce a reduced `customerAccessContext` for downstream projection. It should not hand the projection service raw provider identifiers or raw denial details.

## Verification Flow Proposal

Future implementation should use a fail-closed flow.

| Step | Purpose | Failure behavior | Internal-only note |
| --- | --- | --- | --- |
| Resolve organization / channel scope | Establish the tenant and channel boundary before identity resolution. | Generic safe-deny. | Do not reveal if the organization or channel exists. |
| Resolve customer-safe reference | Resolve a customer-safe Case/report reference without exposing raw ids. | Generic safe-deny or link unavailable. | Do not reveal whether the underlying Case/report exists. |
| Validate link context if present | Check link integrity, expiration, revocation, and intended surface. | Link unavailable or generic safe-deny. | Link state remains internal. |
| Validate channel identity scope | Check that the external identity belongs to the expected organization/channel scope. | Generic safe-deny. | Same external id elsewhere must not leak. |
| Validate verification factors | Confirm required factors such as verified session, channel binding, or challenge result. | Verification required or generic safe-deny. | Missing factor details remain internal. |
| Validate consent | Confirm required consent for viewing or receiving customer-facing data. | Verification required or generic safe-deny. | Missing consent reason remains internal. |
| Validate customer-to-Case/report authorization | Confirm the customer may access the Case/report. | Generic safe-deny. | Wrong customer and wrong Case must not be disclosed. |
| Build customerAccessContext | Produce a reduced fail-closed context for projection service. | Safe-deny context. | Must not include root denial reason for display. |
| Map denial to safe-deny | Map denied access to approved generic message semantics. | Generic safe-deny / verification required / link unavailable. | Detailed cause may be audited internally. |
| Record audit / security / contact attempt | Future internal observability. | No customer-facing details. | Future dependency, not implemented here. |

Any step failure must not expose the specific root cause to the customer.

The verification layer should not return a "resource not found" style response to customer-visible surfaces when that response can be used for enumeration.

## Risk and Abuse Cases

| Case | Risk | Required behavior | Safe-deny / verification requirement | Internal log direction |
| --- | --- | --- | --- | --- |
| Same LINE user id reused across different organization/channel | Cross-tenant or cross-channel identity confusion. | Scope by organization and channel/provider before resolving customer. | Generic safe-deny if the identity is not valid for this scope. | Log scoped identity mismatch with masked identifiers. |
| Customer shares Web/SMS/Email link | Another person may access customer-facing data. | Require link lifecycle controls and verification where risk requires it. | Link unavailable, verification required, or generic safe-deny. | Log link access attempt and channel summary. |
| Guessing customerSafeCaseRef | Enumeration of Case existence. | Customer-safe references must be non-guessable or paired with verification. | Generic safe-deny. | Log suspected enumeration pattern if future security event exists. |
| Phone number recycled / shared household phone | Wrong person may pass weak phone-based verification. | Treat phone as a factor, not identity; require stronger verification for sensitive surfaces. | Verification required or generic safe-deny. | Log factor type and result without full phone. |
| Email forwarded to another person | Unauthorized report access. | Email link should expire, support revocation, and require verification where needed. | Link unavailable or verification required. | Log forwarded-link style attempt if detectable. |
| Customer uses LINE-bound identity to open Web link | Channel handoff may be valid only after scoped verification. | Bind Web access to a verified customer/session, not only raw LINE identity. | Verification required until session/customer mapping is safe. | Log channel handoff summary. |
| Web user tries LINE-originated Case | Cross-channel mismatch could leak Case existence. | Resolve by organization/channel scope and customer authorization. | Generic safe-deny. | Log channel mismatch internally. |
| Expired / revoked link replay | Old link could expose report/timeline. | Enforce expiration and revocation before projection. | Link unavailable or generic safe-deny. | Log replay attempt without exposing link value. |
| Customer tries another customer's issue entrypoint | Complaint/report issue endpoint could reveal ownership. | Re-check customer-to-Case/report authorization for the action. | Generic safe-deny or action unavailable. | Log denied action internally. |
| AI summarization requested without verified access context | AI might receive unauthorized customer data. | Block AI context creation until access context is verified and filtered. | Generic safe-deny or action unavailable. | Log blocked AI request with safe summary. |

## Data Minimization and Redaction

Verification must use the minimum necessary data.

Customer-facing responses must not include:

- raw channel identifiers,
- full phone numbers,
- full email addresses unless explicitly necessary and approved,
- full addresses,
- raw provider payloads,
- link values,
- verification codes,
- internal denial reasons,
- cross-organization hints.

Internal logs should avoid:

- full phone numbers,
- full addresses,
- raw provider payload,
- unnecessary raw LINE IDs,
- link values,
- verification codes,
- secrets,
- provider credentials.

AI context must be masked / redacted, permission-aware, tenant-isolated, and auditable. AI must not receive unverified identity context or raw provider payloads.

## Interaction With Projection Service

The projection service should only receive either:

- verified customer access context that permits a customer-safe projection, or
- a safe-deny context that tells it to return a safe customer-facing denial.

The projection service should not:

- resolve customer identity from raw provider IDs,
- decide verification factors,
- inspect raw provider payloads,
- display denial root cause,
- bypass customerAccessContext,
- return raw internal records when verification is incomplete.

The access context may include safe booleans such as:

- timeline can be displayed,
- service report can be displayed,
- issue entrypoint can be displayed,
- survey entrypoint can be displayed,
- verification is required,
- generic safe-deny should be returned.

The access context should not include root denial reason intended for display.

## Non-goals

Task363 does not:

- add a customer identity table,
- add verification runtime,
- add an API route,
- add a controller,
- add a service,
- add a repository,
- add a validator,
- add migration, schema, or index,
- add permission runtime,
- add customer channel runtime,
- add safe-deny helper runtime,
- add localization files,
- add notification sending,
- add smoke tests,
- touch provider integrations,
- touch LINE / SMS / Email / App runtime,
- touch AI / RAG runtime,
- touch billing / settlement runtime,
- touch quote / payment / invoice runtime,
- touch inventory / WMS runtime,
- touch customer-facing report runtime,
- touch survey runtime,
- touch complaint / callback runtime,
- change Field Service Report completion,
- change `finalAppointmentId` inference,
- change Case workflow.

## Future Task Candidates

These are future tasks only and must not be implemented as part of Task363.

### Customer Channel Identity Data Model Proposal

Define scoped identity records for organization, channel/provider, external identity reference, customer, consent, and status.

### Verification API Contract Proposal

Define future verification handoff endpoints, response semantics, and safe-deny behavior.

### Customer Access Context Interface Proposal

Define a typed interface shared by verification, projection, safe-deny, and audit/security layers.

### Safe-deny Helper Design

Design shared non-enumerating response behavior for customer-facing surfaces.

### Projection Service Implementation Plan

Plan implementation only after verification and access context contracts are approved.

### Access-control Smoke / Integration Tests

Add tests only after disposable local/test runtime is confirmed and runtime exists.

### Link Lifecycle / Storage Policy

Design link creation, expiration, revocation, hashing, rotation, and audit behavior.

### Audit / Security Event Boundary Design

Define what verification events are logged internally and how values are redacted.

## Risk and Limitations

This document is not runtime approval. It defines the future verification boundary.

Future implementation must still resolve:

- customer channel identity data model,
- customer-safe reference format,
- verification factors,
- consent model,
- link lifecycle policy,
- access context interface,
- audit/security event mapping,
- safe-deny helper,
- localization files,
- tests in a disposable local/test environment.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No localization file is added by Task363.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke test change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, link values, verification codes, or production data details.

Future customer channel identity verification must continue to avoid exposing resource existence, ownership, organization scope, channel identity state, internal denial reason, provider data, AI payload, billing internals, settlement internals, inventory internals, signature storage internals, or staff-management data.
