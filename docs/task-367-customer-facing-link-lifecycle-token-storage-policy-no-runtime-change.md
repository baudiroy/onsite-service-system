# Task 367 - Customer-facing Link Lifecycle / Token Storage Policy / No Runtime Change

## Scope Summary

Task367 is a documentation-only policy design for future customer-facing link lifecycle and token storage.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, helper files, interface/code files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, token runtime, link runtime, projection service runtime, verification runtime, audit runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task367 extends Task360-366: customer-facing API contracts, projection permission filters, verification design, customerAccessContext, safe-deny helper, and audit/security event boundaries.

## Link Lifecycle Purpose

Future customer-facing links should provide safe entry points for customer-visible surfaces without turning guessable identifiers into access grants.

Customer-facing link lifecycle policy should:

- support appointment timeline access,
- support customer-facing service report access,
- support report issue / unresolved issue entrypoints,
- support survey entrypoints,
- support appointment confirmation / reschedule flows,
- support safe expiration,
- support revocation,
- support replay protection,
- support scoped verification,
- support safe-deny and enumeration protection,
- prevent raw link values from entering logs, AI context, customer responses, or provider debug output.

Links must not replace customer channel identity verification or organization isolation.

## Customer-facing Link Types

These link types are proposal-only and do not imply runtime support.

| Link type | Purpose | Required scope | Expiration direction | Revocation requirement | Verification requirement | Safe-deny behavior | Must-not-include in URL / logs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Timeline view link | Let customer view customer-safe appointment timeline. | Organization, channel/link context, customer-safe Case reference, surface `timeline`. | Short or policy-defined duration. | Must support revocation if sent to wrong recipient or superseded. | Required when link alone is insufficient for risk level. | Generic unavailable, verification required, or link unavailable. | Raw DB ids, raw LINE ID, full phone/address/email, internal workflow state. |
| Customer-facing service report link | Let customer view filtered completion report. | Organization, customer-safe Case/report reference, surface `serviceReport`. | Should expire or require verified session. | Must support revocation after correction, dispute, or wrong delivery. | Stronger verification may be required due report sensitivity. | Link unavailable or generic unavailable. | Internal FSR id, raw report id, signature storage keys, billing internals. |
| Report issue / unresolved issue link | Let customer report unresolved issue. | Organization, customer-safe Case/report reference, action `reportIssue`. | Short or tied to report access policy. | Must support revocation if report access revoked. | Required before accepting issue content. | Report issue unavailable or generic unavailable. | Complaint classification, internal escalation state. |
| Satisfaction survey link | Let customer answer post-completion survey. | Organization, Case/report/survey context, surface `survey`. | Usually time-limited. | Must support revocation / suppression if policy changes. | Depends on survey risk policy and channel identity. | Survey unavailable or link unavailable. | Survey eligibility reason, suppression reason, internal report status. |
| Appointment confirmation link | Let customer confirm proposed appointment. | Organization, proposed appointment context, customer-safe Case reference. | Short due scheduling sensitivity. | Must support revocation if appointment proposal changes. | Required before final confirmation if link is shareable. | Action unavailable or link unavailable. | Raw appointment id, route/engineer internals. |
| Reschedule request link | Let customer request change safely. | Organization, proposed/confirmed appointment context, customer-safe Case reference. | Short or tied to appointment window. | Must support revocation when appointment state changes. | Required when request changes workflow. | Action unavailable or link unavailable. | Internal scheduling constraints, route scoring. |
| Customer verification link | Let customer complete a verification step. | Organization, channel/link context, verification purpose. | Short. | Must support revocation and one-time semantics if needed. | This link is a factor, not identity by itself. | Verification required or link unavailable. | Verification code, raw token, raw identity values. |

## Token Storage Principles

Future token handling should follow these principles:

- Raw token values should not be stored in plaintext.
- Store only token hash, digest, or lookup-safe reference.
- Token scope should bind organization, surface/action, customer-safe reference, channel/link context, and expiration policy.
- Token values should not contain raw database ids.
- Token values should not contain raw LINE IDs.
- Token values should not contain full phone, full email, full address, internal workflow state, or provider payloads.
- Token validation must fail closed.
- Token mismatch, expired, revoked, unknown, invalid, or unsupported states must safe-deny.
- Failure response must not reveal whether the token was expired, revoked, unknown, or tied to a real Case unless product/security policy explicitly approves a generic link-unavailable wording.
- Token values must not be written to audit log, application log, error log, docs, AI context, provider debug output, or customer response.

Token storage policy is a future design only. Task367 does not add token storage or hashing runtime.

## Lifecycle States Proposal

These lifecycle states are proposal-only.

| State | Meaning | Customer-facing response guidance |
| --- | --- | --- |
| `issued` | Link/token has been created but not necessarily delivered or activated. | Not directly displayed. |
| `active` | Link/token may be used subject to verification and scope checks. | May proceed to verification/projection. |
| `consumed` | Link/token has been used and may or may not be reusable depending on link type. | If one-time only, safe-deny or link unavailable. |
| `expired` | Link/token is beyond allowed time window. | Link unavailable or generic unavailable. |
| `revoked` | Link/token was invalidated by system/operator/policy. | Link unavailable or generic unavailable. |
| `superseded` | A newer link/token replaced this one. | Safe-deny or start a new verification flow without revealing superseded root cause. |
| `invalid` | Token format/hash/scope is invalid. | Generic unavailable or link unavailable. |
| `unknown` | Token cannot be found or cannot be safely resolved. | Generic unavailable. |

Customer-facing response should not display raw lifecycle state.

`expired`, `revoked`, `unknown`, and `invalid` usually collapse to `customerAccess.linkUnavailable` or `customerAccess.genericUnavailable`.

Whether `consumed` can be reused must depend on link type. For example, survey submission may be one-time, while service report view might allow repeated access during a valid window.

## Validation Flow Proposal

Future link validation should use a fail-closed flow.

1. Receive link access request without logging raw token.
2. Resolve organization / channel / link scope safely.
3. Hash or digest token value for lookup.
4. Validate token scope.
5. Validate token lifecycle state.
6. Validate expiration, revocation, and replay rules.
7. Validate customer channel identity, verification state, and consent.
8. Build `customerAccessContext`.
9. Call projection service or safe-deny helper.
10. Record minimized audit/security event if needed.

Rules:

- Any step failure fails closed.
- Failure root cause is not shown to the customer.
- Raw token does not enter event/log/AI.
- Customer-facing response uses safe-deny wording only.
- Validation should not reveal whether a Case, Customer, Organization, Appointment, report, issue, or survey exists.

## Replay and Abuse Cases

| Case | Risk | Required behavior | Safe-deny behavior | Audit / security event direction | Must-not-log data |
| --- | --- | --- | --- | --- | --- |
| Expired link replay | Old access can expose stale report/timeline. | Reject or require new verification/link. | Link unavailable or generic unavailable. | `customer_access.link_unavailable` or suspicious replay category. | Raw token, full URL, query string. |
| Revoked link reuse | Previously invalidated access is retried. | Reject and do not disclose revocation reason. | Link unavailable or generic unavailable. | Revoked link category without raw link. | Raw token, revocation detail if sensitive. |
| Forwarded SMS/email link | Another person may access customer data. | Require verification if surface is sensitive. | Verification required, link unavailable, or generic unavailable. | Shared-link pattern if detectable. | Full phone/email, raw URL. |
| Screenshot/shared link | Link leaves intended channel. | Validate link scope and verification. | Verification required or generic unavailable. | Channel mismatch or link replay category. | Raw provider payload, raw token. |
| Guessing customerSafeCaseRef plus token probing | Enumeration attempt. | Rate-limit and safe-deny. | Generic unavailable. | Suspicious probe category. | Attempted raw ids, full request body. |
| Same external identity in different organization/channel | Cross-tenant identity confusion. | Scope identity by organization/channel. | Generic unavailable. | Channel scope mismatch. | Raw external identity. |
| Customer uses old report link after case reopened/follow-up | Customer may see stale information. | Revocation or superseded policy should apply. | Link unavailable or verified updated flow. | Superseded link category. | Internal case workflow reason. |
| Survey link after survey already submitted | Duplicate feedback or confusion. | Follow survey policy; likely one-time or show safe already-submitted wording if approved. | Survey unavailable or generic unavailable. | Survey consumed category. | Survey response content, score routing. |
| Issue link used by wrong customer | Complaint endpoint can leak ownership. | Re-check identity and authorization. | Report issue unavailable or generic unavailable. | Access denied category. | Complaint classification, correct customer. |
| Bot/brute force attempts against token endpoint | Enumeration or abuse. | Rate-limit, safe-deny, and security monitoring. | Generic unavailable. | Suspicious probe / rate-limit category. | Raw tokens, full query string, raw request payload. |

## Logging / Audit Boundary

Future logs/events may record token lifecycle category only when needed.

Allowed in minimized logs/events:

- lifecycle category,
- surface/action category,
- organization-scoped reference,
- channel type,
- masked or hashed link reference if necessary,
- correlation id,
- timestamp,
- symbolic risk flag.

Must not log:

- raw token,
- full URL if it contains token,
- full query string,
- raw provider payload,
- full phone,
- full email,
- full address,
- raw LINE ID,
- verification code,
- secret,
- credential,
- provider token,
- reusable link value.

Correlation ids may be used for tracing, but must not contain raw token values.

Token or link context must not be sent to AI.

## Interaction With Other Components

### Verification Layer

Links support verification; they do not replace verification.

The verification layer should validate link scope and then build a fail-closed customer access context.

### CustomerAccessContext

`customerAccessContext` must not contain raw token values.

It may contain symbolic state such as link unavailable, verification required, or access denied.

### Projection Service

Projection service must not use raw token value as authorization input.

It should only consume verified or safe-deny customer access context.

### Safe-deny Helper

Safe-deny helper must not expose expired, revoked, invalid, unknown, or superseded root cause details.

### Audit / Security Event

Audit/security event writer should receive only minimized lifecycle category and redacted context.

### Notification Delivery

Future notification delivery must not leak token values in logs, provider payload debug output, or error reports.

### AI

AI must not see raw token, full link, query string, provider payload, or link lifecycle root cause.

AI may only see masked high-level policy summaries if needed for product copy review or risk trend analysis.

## Non-goals

Task367 does not:

- add a token table,
- add token hash implementation,
- add link generation runtime,
- add link validation runtime,
- add an API route,
- add a controller,
- add a service,
- add a repository,
- add a validator,
- add migration, schema, or indexes,
- add localization files,
- add safe-deny helper code,
- add projection service runtime,
- add verification runtime,
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

These are future tasks only and must not be implemented as part of Task367.

### Customer-facing Link / Token Data Model Proposal

Design future link/token schema, lifecycle states, hashed lookup strategy, scope fields, and retention policy.

### Link Generation / Validation API Contract

Define how links are created, validated, revoked, and safe-denied.

### Token Storage Hashing Strategy Review

Review digest, salt/pepper, rotation, lookup, and operational safety options.

### Notification Delivery Token Redaction Policy

Define how notification providers, logs, retries, and error handling avoid token exposure.

### Link Lifecycle Smoke / Integration Tests

Add tests only after disposable local/test runtime is confirmed and runtime exists.

### Rate-limit / Abuse Monitoring Policy

Design replay/probing detection and response policy.

### Customer Access Audit Event Integration

Integrate link lifecycle categories into audit/security event design.

### Safe-deny Helper Link-unavailable Implementation

Implement link-unavailable response only after helper and localization policy are approved.

## Risk and Limitations

This document is not runtime approval. It defines future link lifecycle and token storage policy only.

Future implementation must still resolve:

- link/token data model,
- token hashing strategy,
- expiration defaults,
- revocation UX,
- replay protection,
- notification provider redaction,
- audit/security event integration,
- rate-limit policy,
- tests in a disposable local/test environment.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No localization file, token table, or token runtime is added by Task367.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke test change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, raw link values, verification codes, or production data details.

Future customer-facing link lifecycle implementation must continue to avoid exposing token values, resource existence, ownership, organization scope, channel identity state, internal denial reason, provider data, AI payload, billing internals, settlement internals, inventory internals, signature storage internals, or staff-management data.
