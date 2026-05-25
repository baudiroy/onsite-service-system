# Task 366 - Customer-facing Access Audit / Security Event Boundary Design / No Runtime Change

## Scope Summary

Task366 is a documentation-only design for future customer-facing access audit / security event boundaries.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, helper files, interface/code files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, audit runtime, security event runtime, contact attempt runtime, projection service runtime, verification runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task366 extends Task360-365: customer-facing API contract proposals, projection permission filter design, customer channel identity verification design, customerAccessContext proposal, and safe-deny helper design.

## Audit / Security Event Purpose

Future audit / security event boundaries should support safe investigation of customer-facing access behavior.

They should help the platform:

- trace successful customer-facing access,
- trace access denied / safe-deny outcomes,
- trace verification-required outcomes,
- detect suspicious probing,
- investigate cross-organization attempts,
- investigate wrong-customer access attempts,
- investigate link replay,
- investigate brute force / enumeration risk,
- support security monitoring and privacy review.

Audit / security event details must not become customer-facing response content.

They must not expose sensitive raw payloads, credentials, tokens, full personal data, internal notes, or AI raw content.

## Event Categories Proposal

These event categories are proposal-only and do not create runtime events or database schema.

| Event category | Intended use | Related surface | Customer-facing response should be | Data allowed in internal event | Data forbidden in internal event | Retention / sensitivity caution |
| --- | --- | --- | --- | --- | --- | --- |
| `customer_access.allowed` | Verified access to a customer-facing surface succeeds. | Timeline, service report, issue entrypoint, survey. | Normal customer-safe projection. | Organization-scoped reference, surface, action, masked actor/channel summary, timestamp, correlation id. | Raw provider payload, full phone/address/email, raw LINE ID, raw link value, internal notes. | Access history may be sensitive and should follow retention policy. |
| `customer_access.denied_generic` | Access denied and collapsed to generic safe-deny. | All customer-facing surfaces. | Generic unavailable. | Safe-deny family, symbolic reason category, masked actor/channel summary. | Root cause display text, raw ids, raw channel id, token values. | Useful for abuse monitoring; avoid storing excessive identity data. |
| `customer_access.verification_required` | Verification is needed and safe to prompt. | Web/App/link surfaces. | Generic verification required. | Verification state category, surface, channel type. | Verification code, raw factor values, full phone/email. | Verification events can reveal behavior patterns; minimize data. |
| `customer_access.link_unavailable` | Link is expired, revoked, malformed, or unsupported. | Report/timeline/SMS/Email links. | Link unavailable or generic unavailable. | Link state category, surface, channel type, correlation id. | Raw link value, token, signature, full URL. | Link-related events should not store reusable secrets. |
| `customer_access.action_unavailable` | Requested action cannot proceed. | Timeline action, report issue, survey, support. | Action unavailable or action-specific unavailable. | Surface/action category, safe-deny family. | Internal workflow state detail if not required. | Keep reason symbolic. |
| `customer_access.suspicious_probe` | Pattern suggests enumeration or probing. | Any customer-facing surface. | Generic unavailable. | Symbolic risk flag, request correlation id, masked channel/session summary. | Raw payload, full identifiers, attempted raw ids if sensitive. | May require shorter access to raw request metadata or stronger review. |
| `customer_access.cross_org_denied` | Cross-organization or tenant boundary denied. | Any customer-facing surface. | Generic unavailable. | Source organization scope category, target scope category if safe, masked actor. | Tenant names or raw ids in customer-visible logs. | High sensitivity; should be access-controlled. |
| `customer_access.channel_scope_mismatch` | External identity is not valid for the requested organization/channel scope. | LINE/Web/App/SMS/Email handoff. | Generic unavailable. | Channel type, symbolic mismatch category. | Raw external identity, raw provider payload. | Avoid storing reusable provider identifiers. |
| `customer_access.consent_required` | Consent or authorization is missing. | Timeline/report/issue/survey. | Verification required or generic unavailable. | Consent state category. | Consent details that reveal ownership or sensitive status. | Consent logs may be privacy-sensitive. |
| `customer_access.projection_unavailable` | Projection cannot be built safely. | Timeline/report projections. | Action unavailable or generic unavailable. | Projection surface, safe-deny family, redacted error category. | Raw internal source payload or stack trace. | Avoid turning internal errors into data leaks. |
| `customer_access.internal_error_safe_denied` | Internal error occurred and response was safe-denied. | Any customer-facing surface. | Try again or generic unavailable. | Error category, correlation id. | Stack trace, SQL, provider payload, credentials, raw ids. | Must be strongly redacted. |

## Event Trigger Matrix

| Scenario | Proposed internal event category | Customer-facing safe-deny behavior | Minimum allowed event fields | Must-not-log fields | Escalation / monitoring note |
| --- | --- | --- | --- | --- | --- |
| Verified customer views timeline successfully | `customer_access.allowed` | Return customer-safe timeline projection. | Organization-scoped ref, surface `timeline`, channel type, masked subject ref, timestamp, correlation id. | Raw LINE ID, raw provider payload, full phone/address/email. | Normal access telemetry. |
| Verified customer views service report successfully | `customer_access.allowed` | Return customer-safe service report projection. | Organization-scoped ref, surface `serviceReport`, safe report ref if available, channel type, timestamp. | Internal FSR payload, signature raw file/storage key, billing internals. | Normal access telemetry. |
| Unverified customer requests timeline | `customer_access.verification_required` | Generic verification required when safe. | Surface, channel type, verification state category, correlation id. | Raw verification code, full factor value, raw link value. | Track repeated verification failures. |
| Wrong customer requests Case/report | `customer_access.denied_generic` | Generic unavailable. | Surface/action, safe-deny family, masked actor/channel summary. | Correct customer, ownership details, raw ids. | Watch repeated attempts. |
| Wrong organization or cross-tenant access attempt | `customer_access.cross_org_denied` | Generic unavailable. | Symbolic cross-scope category, channel type, correlation id. | Tenant names in customer-facing logs, raw org ids if not needed. | High-risk monitoring candidate. |
| Same external LINE ID appears under different organization/channel | `customer_access.channel_scope_mismatch` | Generic unavailable. | Channel type, symbolic mismatch category. | Raw external id, raw LINE id, provider payload. | Monitor for integration/configuration issues. |
| Expired / revoked link used | `customer_access.link_unavailable` | Link unavailable or generic unavailable. | Link state category, surface, channel type, timestamp. | Raw link value, token, full URL, signature. | Repeated replay may become suspicious probe. |
| Customer guesses another customerSafeCaseRef | `customer_access.suspicious_probe` | Generic unavailable. | Symbolic risk flag, surface, correlation id, masked channel/session. | Attempted raw ids, full identifiers, raw request payload. | Rate-limit / security monitoring future candidate. |
| Report issue entrypoint denied | `customer_access.action_unavailable` | Report issue unavailable. | Surface `reportIssue`, action category, safe-deny family. | Complaint classification, liability analysis, internal notes. | Track support friction if frequent. |
| Survey unavailable / not eligible | `customer_access.action_unavailable` | Survey unavailable. | Surface `survey`, safe-deny family, symbolic eligibility category. | Survey suppression details, report status if sensitive. | Product/ops review if frequent. |
| Projection service unavailable but safe-denied | `customer_access.projection_unavailable` | Action unavailable or try again/contact support. | Projection surface, redacted error category, correlation id. | Internal source data, stack trace, SQL. | Engineering alert candidate. |
| AI draft exists but not approved for customer display | `customer_access.action_unavailable` | Do not mention AI draft. | Surface/action category, draft-not-approved symbolic category if needed. | AI raw draft, prompt, model output. | Product workflow monitoring only. |
| Internal error occurs while resolving access | `customer_access.internal_error_safe_denied` | Try again/contact support or generic unavailable. | Error category, correlation id, surface. | Stack trace, SQL, provider payload, credentials. | Engineering alert candidate. |
| Repeated failed access attempts from same channel/session/link context | `customer_access.suspicious_probe` | Generic unavailable. | Symbolic rate/probe category, masked channel/session reference. | Raw link values, full provider identifiers, full request body. | Rate-limit / abuse detection future candidate. |

## Minimum Allowed Event Fields

Future audit / security events may consider recording only minimum necessary fields such as:

- organization-scoped reference,
- surface category,
- action category,
- customer-safe Case/report reference if already safely resolved,
- channel type, not raw provider identifier,
- masked external identity reference or hashed reference,
- verification state category,
- safe-deny key family,
- risk flag symbolic category,
- timestamp,
- request correlation id,
- actor type such as customer, anonymous link, system, or support-assisted,
- internal event category.

These fields are proposal-only. They do not imply a database schema exists.

Events must not store raw tokens, raw LINE IDs, full phone numbers, full addresses, full email addresses, raw provider payloads, or reusable link values.

## Must-not-log / Must-not-display Data

Customer-facing access audit/security events must not log or display:

- raw LINE ID,
- raw provider payload,
- raw webhook body,
- raw link token,
- verification code,
- full phone,
- full address,
- full email,
- internal notes,
- full audit log dump,
- AI raw prompt,
- AI raw model output,
- billing internal rules,
- settlement internal rules,
- vendor reconciliation data,
- brand reconciliation data,
- internal cost,
- margin,
- payout,
- inventory internal data,
- warehouse data,
- stock movement data,
- signature raw file,
- signature image,
- signature storage key,
- internal complaint classification unless required as a symbolic event category,
- raw database ids if a customer-safe reference is available,
- secrets,
- credentials,
- database URLs,
- provider tokens.

## Customer-facing Boundary

Audit, security, and contact attempt details must not appear in customer-facing responses.

Safe-deny responses must not reveal:

- event category,
- wrong customer,
- wrong organization,
- expired token,
- revoked link,
- Case missing,
- report missing,
- LINE binding state,
- internal projection error,
- internal security rule.

Customers should only see generic customer-safe wording, verification-required wording when safe, link-unavailable wording when safe, or action-unavailable wording when safe.

Support contact actions must not include internal denial reasons.

## Interaction With CustomerAccessContext and Safe-deny Helper

Future `customerAccessContext.auditHint` should contain only a minimum necessary symbolic category.

Future `customerAccessContext.safeDeny` should contain a customer-facing message key family, not a root denial reason.

The safe-deny helper should not output audit/security details.

The projection service should not write raw internal details into customer responses.

The API controller should not append raw deny reasons, stack traces, internal ids, provider details, or raw link state.

Future audit/security writer should receive only redacted/minimized event payloads.

## AI Boundary

AI must not read complete audit/security event payloads.

AI must not generate customer-facing denial wording from audit root cause.

AI may help classify high-level risk trends only when the data is:

- masked / redacted,
- tenant-isolated,
- permission-aware,
- auditable,
- minimized,
- safe for the requested AI task.

AI must not:

- automatically escalate security events,
- automatically close security events,
- modify security events,
- cross organization boundaries,
- use raw customer-facing access event payloads for training or cross-tenant learning.

## Non-goals

Task366 does not:

- add audit/security event runtime,
- add audit tables,
- add migration, schema, or indexes,
- add an API route,
- add a controller,
- add a service,
- add a repository,
- add customerAccessContext code,
- add safe-deny helper code,
- add projection service runtime,
- add verification runtime,
- add localization files,
- add notification sending,
- add smoke tests,
- modify validators,
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

These are future tasks only and must not be implemented as part of Task366.

### Customer-facing Access Audit Event Data Model Proposal

Design future event schema, retention, sensitivity classification, and access controls.

### Audit / Security Event Writer Interface Proposal

Define a redacted event writer interface that accepts symbolic categories and minimized fields.

### CustomerAccessContext AuditHint Implementation

Implement `auditHint` only after access context and safe-deny helper designs are approved.

### Safe-deny Helper Audit Integration Design

Design how deny helper output maps to internal audit/security events without leaking customer-facing details.

### Access-control Smoke / Integration Tests

Add tests only after disposable local/test runtime is confirmed and runtime exists.

### Security Monitoring / Rate-limit Policy Review

Design monitoring and rate-limit policy for repeated safe-deny attempts and suspicious probing.

### Link Lifecycle / Storage Policy

Design link creation, expiration, revocation, hashing, rotation, and replay detection.

### Data Retention and Privacy Policy Review

Define retention and access-control policy for customer-facing access events.

## Risk and Limitations

This document is not runtime approval. It defines future audit/security event boundaries only.

Future implementation must still resolve:

- event data model,
- event retention policy,
- redacted event writer interface,
- customerAccessContext audit hint mapping,
- safe-deny helper integration,
- monitoring / rate-limit policy,
- link lifecycle policy,
- tests in a disposable local/test environment.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No localization file, audit table, or event runtime is added by Task366.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke test change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, raw link values, verification codes, or production data details.

Future customer-facing access audit/security implementation must continue to avoid exposing resource existence, ownership, organization scope, channel identity state, internal denial reason, provider data, AI payload, billing internals, settlement internals, inventory internals, signature storage internals, or staff-management data.
