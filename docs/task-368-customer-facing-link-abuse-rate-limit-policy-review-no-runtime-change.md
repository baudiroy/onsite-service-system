# Task 368 - Customer-facing Link Lifecycle Abuse / Rate-limit Policy Review / No Runtime Change

## Scope Summary

Task368 is a documentation-only policy review for future customer-facing link abuse and rate-limit boundaries.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, helper files, interface/code files, migrations, schema, indexes, package configuration, API routes, controllers, services, repositories, validators, rate-limit runtime, abuse monitoring runtime, token runtime, link runtime, projection service runtime, verification runtime, audit runtime, notification delivery, provider integrations, customer portal runtime, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task368 extends Task360-367: customer-facing API contracts, projection filters, verification, customerAccessContext, safe-deny helper, audit/security event boundaries, and link lifecycle / token storage policy.

## Abuse / Rate-limit Purpose

Future abuse and rate-limit policy should reduce customer-facing link abuse without creating new information leaks.

The policy should help reduce:

- token probing,
- customer-safe reference guessing,
- link replay,
- brute force attempts,
- resource enumeration,
- cross-organization probing,
- repeated failed access attempts,
- forwarded or shared link risk.

It should protect:

- customer-visible appointment timeline,
- customer-facing service report,
- report issue entrypoint,
- survey entrypoint,
- appointment confirmation link,
- reschedule request link,
- customer verification link.

Rate-limit and abuse monitoring must not replace verification, organization isolation, customer channel identity scope, projection filtering, safe-deny, or link lifecycle policy.

Rate-limit or suspicious-access behavior must not reveal external differences that help attackers infer whether a Case, report, customer, token, link, organization, appointment, survey, or issue entrypoint exists.

## Abuse Scenarios Matrix

| Scenario | Risk | Recommended behavior | Safe-deny behavior | Audit / security event direction | Rate-limit / monitoring suggestion | Must-not-log data |
| --- | --- | --- | --- | --- | --- | --- |
| Expired link replay | Old link may expose stale timeline/report. | Reject or require a fresh link/verification. | Link unavailable or generic unavailable. | Link unavailable / replay category. | Count repeats by hashed link reference and channel scope. | Raw token, full URL, query string. |
| Revoked link reuse | Invalidated link is retried. | Reject and avoid exposing revocation reason. | Link unavailable or generic unavailable. | Revoked link category. | Monitor repeated use after revocation. | Raw token, revocation detail if sensitive. |
| Consumed one-time link reuse | Survey/confirmation one-time action may be reused. | Enforce one-time policy if link type requires it. | Action unavailable, survey unavailable, or generic unavailable. | Consumed link category. | Monitor repeated consumes. | Survey response content, raw link. |
| Bot/brute force token attempts | Token endpoint probing / enumeration. | Fail closed, throttle, and monitor. | Generic unavailable. | Suspicious probe category. | Rate-limit by organization scope, surface, channel type, hashed token prefix/reference if safe, and network risk category. | Raw tokens, full request body, full query string. |
| Guessing customerSafeCaseRef | Case enumeration. | Require scoped verification and safe-deny. | Generic unavailable. | Suspicious reference probing category. | Track repeated unknown refs per scoped context. | Attempted raw ids, full identifiers. |
| Trying many report links from same session/IP/channel | Report enumeration. | Throttle and safe-deny. | Generic unavailable or try-again/contact-support. | Suspicious probe / rate bucket category. | Aggregate count per scoped session/channel/IP risk bucket. | Raw link values, full IP if policy disallows, raw provider payload. |
| Forwarded SMS/email link | Wrong recipient sees customer surface. | Require verification for sensitive surfaces. | Verification required or generic unavailable. | Shared-link risk category if detectable. | Monitor mismatched channel/session. | Full phone/email, raw URL. |
| Screenshot/shared link | Link escapes intended recipient. | Validate scope and require verification where needed. | Verification required or generic unavailable. | Link sharing/replay category. | Monitor repeated accesses from different contexts. | Raw token, full URL. |
| Same external LINE ID under different organization/channel | Cross-tenant identity confusion. | Scope identity by organization and channel. | Generic unavailable. | Channel scope mismatch category. | Monitor integration/configuration anomalies. | Raw LINE ID, raw provider payload. |
| Phone/email recycled or shared | Weak factor may authorize wrong person. | Treat phone/email as a factor, not identity. | Verification required or generic unavailable. | Verification risk category. | Require stronger verification for sensitive surfaces. | Full phone/email. |
| Survey link repeated submission attempts | Duplicate or manipulated feedback. | Enforce survey policy and safe-deny. | Survey unavailable or generic unavailable. | Survey repeat category. | Monitor repeated submissions by link/surface scope. | Survey response details, raw link. |
| Report issue link used by wrong customer | Issue entrypoint can reveal Case/report ownership. | Re-check authorization and safe-deny. | Report issue unavailable or generic unavailable. | Access denied category. | Monitor repeated wrong-customer action attempts. | Correct customer, complaint classification. |
| Appointment confirmation link replay after appointment changed | Customer may confirm stale appointment. | Reject superseded link and guide to safe verification if approved. | Action unavailable or link unavailable. | Superseded appointment link category. | Monitor stale confirmation attempts. | Raw appointment id, route/engineer internals. |
| Reschedule link used after superseded schedule | Customer may act on old schedule state. | Reject or require latest verification. | Action unavailable or link unavailable. | Superseded reschedule link category. | Monitor repeated old-link use. | Internal scheduling state, raw link. |
| Internal projection error repeatedly triggered | Could indicate bug or probing. | Safe-deny and alert internally. | Try again/contact-support or generic unavailable. | Projection unavailable / internal error category. | Monitor repeated error category per surface/context. | Stack trace, SQL, provider payload. |

## Rate-limit Dimensions Proposal

Future rate-limit and abuse monitoring may use minimized dimensions such as:

- organization scope,
- surface/action type,
- customer-safe link reference or token hash reference,
- channel type,
- masked or hashed external identity reference,
- session / device / browser context if available and policy-approved,
- source IP or network risk category with privacy caution,
- customerSafeCaseRef probing pattern,
- repeated safe-deny category,
- request correlation id patterns,
- aggregate count / time bucket.

Rules:

- Do not use raw LINE ID as a global key.
- Do not store raw token.
- Do not store full phone, full email, or full address.
- Do not mix rate-limit identity across organizations.
- Do not expose rate-limit signal directly in customer-facing response.
- Do not let a rate-limit bucket reveal whether a Case/report exists.
- Keep rate-limit data retention short enough for privacy and long enough for security investigation.

## Safe-deny and Lockout Boundary

Rate-limited or suspicious access should not say:

- you are blocked,
- this token expired,
- this token was revoked,
- this Case does not exist,
- this report does not exist,
- this customer is wrong,
- this LINE binding is missing,
- this organization is wrong.

Preferred customer-facing behavior:

- generic unavailable,
- try again or contact support,
- verification required only when it does not create enumeration risk,
- link unavailable only when product/security policy accepts the wording risk.

Different root causes should avoid externally visible differences.

Lockout, temporary block, step-up verification, additional challenge, or support-only recovery are future runtime policies and are not implemented by Task368.

Support contact actions must not include internal risk category.

## Monitoring / Escalation Boundary

Repeated failed attempts may form internal security monitoring signals.

Suspicious probing may form internal event categories.

High-risk patterns may notify internal ops/security in future tasks, but not customer raw reason.

AI may assist with high-level trend summaries only when data is:

- masked / redacted,
- tenant-isolated,
- permission-aware,
- auditable,
- minimized,
- not raw token/link/provider data.

AI must not:

- automatically close customer access,
- automatically close complaints,
- modify Case status,
- modify appointment status,
- modify Field Service Report,
- modify customer-facing report,
- cross organization boundaries,
- inspect raw tokens or full identifiers.

## Logging / Privacy Boundary

Must not log:

- raw token,
- full URL or query string if it contains token,
- raw LINE ID,
- raw provider payload,
- raw webhook body,
- full phone,
- full address,
- full email,
- verification code,
- secrets,
- credentials,
- provider tokens,
- database URLs,
- internal notes,
- AI raw prompt,
- AI raw output,
- billing internal data,
- settlement internal data,
- inventory internal data,
- warehouse data,
- stock movement data.

Allowed minimized signals may include:

- hashed token reference if necessary,
- channel type,
- organization-scoped reference,
- surface/action,
- safe-deny key family,
- risk flag symbolic category,
- timestamp,
- correlation id,
- aggregate count / rate bucket.

## Interaction With Existing Designs

This abuse and rate-limit policy should align with:

- Task367 link lifecycle and token storage policy,
- Task366 audit/security event categories,
- Task365 safe-deny helper design,
- Task364 customerAccessContext proposal,
- Task363 verification design,
- Task362 projection service filter design,
- Task360 / Task361 timeline and report API contract proposals.

Abuse/rate-limit policy is a future monitoring and throttling layer. It must not bypass verification, projection filtering, safe-deny, organization isolation, customer channel identity scope, or customer visible data policy.

## Non-goals

Task368 does not:

- add rate-limit runtime,
- add monitoring runtime,
- add token table,
- add token validation,
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

These are future tasks only and must not be implemented as part of Task368.

### Customer-facing Link Rate-limit Data Model Proposal

Design future minimized rate-limit records, retention, and privacy rules.

### Token Probing Detection Policy

Define thresholds, aggregation, and response policy for token probing.

### Safe-deny Helper Rate-limit Integration

Design how safe-deny helper handles rate-limited/suspicious contexts without leaking state.

### Security Monitoring / Alerting Policy

Define internal alerting rules for high-risk access attempts.

### Access-control Smoke / Integration Tests

Add tests only after disposable local/test runtime is confirmed and runtime exists.

### Privacy Retention Policy For Rate-limit Signals

Define retention and deletion policy for rate-limit and abuse monitoring signals.

### Link Lifecycle Runtime Design

Plan link lifecycle runtime after data model, verification, and safe-deny designs are approved.

### Notification Delivery Token Redaction Policy

Ensure providers, retries, debug logs, and error handling do not leak token values.

## Risk and Limitations

This document is not runtime approval. It defines future abuse and rate-limit policy only.

Future implementation must still resolve:

- rate-limit dimensions,
- retention policy,
- rate thresholds,
- lockout or step-up verification policy,
- privacy review,
- monitoring and alerting,
- link lifecycle runtime,
- tests in a disposable local/test environment.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No localization file, rate-limit table, or monitoring runtime is added by Task368.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke test change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, raw link values, verification codes, or production data details.

Future abuse/rate-limit implementation must continue to avoid exposing token values, resource existence, ownership, organization scope, channel identity state, internal denial reason, provider data, AI payload, billing internals, settlement internals, inventory internals, signature storage internals, or staff-management data.
