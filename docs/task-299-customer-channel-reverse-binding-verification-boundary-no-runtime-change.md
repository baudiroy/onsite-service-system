# Task 299 - Customer Channel Reverse Binding Verification Boundary / No Runtime Change

## Scope And Non-goals

This document continues the Customer Channel Identity / Notification Boundary branch after Task297 and Task298.

Task299 defines future-only reverse binding and verification boundaries for linking an existing Case/customer context to a customer channel identity.

The focus is token safety, verification challenge safety, safe deny, non-enumeration, consent boundary, audit readiness, customer-visible data limits, and sensitive data protection.

Task299 is documentation-only.

This task is not:

- reverse binding runtime,
- token generation runtime,
- token storage runtime,
- token verification runtime,
- binding runtime,
- customer channel identity runtime,
- consent runtime,
- login runtime,
- notification/provider sending runtime,
- LINE / SMS / Email / APP sending,
- customer self-service lookup runtime,
- appointment runtime change,
- Case runtime change,
- completion runtime change,
- Field Service Report runtime change,
- customer fee consent runtime,
- quote runtime,
- billing runtime,
- settlement runtime,
- survey sending runtime,
- permission runtime,
- entitlement runtime,
- usage metering runtime,
- seat billing runtime,
- AI / RAG runtime,
- report/export/download runtime,
- API contract,
- Admin UI,
- backend service change,
- DB schema / migration proposal,
- smoke / test implementation.

Task299 does not add tables, migrations, schema, indexes, backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, smoke scripts, fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, customer self-service runtime, login runtime, AI runtime, notification runtime, token runtime, or inventory documentation changes.

## Why Reverse Binding / Verification Boundaries Are Needed After Task298

Task298 defined channel identity scope and clarified that external channel identity is not `customer_id`, `customer_id` is not internal user id, and raw provider identity must not become global identity.

The next risk is treating reverse binding links, binding tokens, verification challenges, or partial customer data as if they were safe long-term credentials.

Reverse binding is necessary for existing Cases to connect to future customer channels, but it must not reveal whether a Case, customer, phone, email, channel identity, token, or binding state exists.

Task299 defines that boundary before any token, verification, binding, login, notification, or customer self-service runtime is approved.

## Definitions

### Reverse Binding

Reverse binding is a future workflow that links an existing Case/customer context to a scoped customer channel identity after successful verification.

It is a customer identity/channel operation, not Case completion and not login by itself.

### Binding Token

Binding token is a future one-time challenge or invitation credential used to start or continue reverse binding.

Binding token must not be a long-term identity credential.

### Token Hash

Token hash is a future stored representation of a token.

Token hash is still sensitive and must not be exposed externally.

### Token Expiry

Token expiry is the future time boundary after which the binding token is no longer valid.

Expired token handling must use safe deny.

### One-time Use

One-time use means a token can be successfully consumed only once.

Reuse must fail safely and be auditable without exposing sensitive values.

### Verification Challenge

Verification challenge is a future step asking the customer to prove relationship, contact possession, or case context.

It must not reveal which proof failed.

### Verification Factor

Verification factor is a future proof category, such as partial phone, partial email, appointment-related prompt, Case reference, SMS OTP, Email OTP, Web portal login, or App login.

### Verification Attempt

Verification attempt is a future auditable event for a submitted challenge response.

### Safe Deny

Safe deny is a generic external failure response that does not reveal whether a resource or credential exists or which validation failed.

### Enumeration Protection

Enumeration protection prevents unauthorized users from learning whether Case, customer, phone, email, channel identity, token, feature entitlement, or usage state exists through response differences.

### Consent Capture

Consent capture is a future process for recording what the customer agreed to, such as binding, notification category, survey, quote, or fee consent.

Binding verification is not the same as all notification consent.

### Binding Audit Event

Binding audit event is a future internal audit event for token lifecycle, verification attempts, success/failure, safe-deny classification, conflicts, consent, and revocation.

It must be redacted and scoped.

## Boundary Principles

- Reverse binding is not login.
- Reverse binding is not customer self-service authorization.
- Reverse binding is not notification consent.
- Binding token must not be treated as long-term identity credential.
- Binding token must be future expiring.
- Binding token must be one-time-use.
- Binding token must be hash-stored if stored.
- Token hash must not be externally visible.
- Verification challenge must not reveal whether Case exists.
- Verification challenge must not reveal whether Customer exists.
- Verification challenge must not reveal whether phone is correct.
- Verification challenge must not reveal whether email is correct.
- Verification challenge must not reveal whether channel identity exists.
- Successful binding still permits only customer-visible data through customer-facing channels.
- Successful binding does not imply all notification consent.
- Consent must remain scoped and auditable.
- AI must not approve binding.
- AI must not merge customers.
- AI must not decide verification conflict.
- Reverse binding must not modify Case, Appointment, Field Service Report, quote, fee consent, settlement, survey, or complaint state by itself.

## Future-only Reverse Binding Lifecycle Matrix

This matrix is future-only guidance. It does not approve runtime, schema, API, token generation, verification, binding, consent, customer self-service, notification, or provider implementation.

| Lifecycle row | Customer-visible response allowed? | May reveal Case existence? | May reveal Customer existence? | May reveal phone/email correctness? | Requires audit readiness? | Requires sensitive masking? | May create active binding? | May AI decide? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Token generated | No customer response by itself. | No | No | No | Yes | Yes | No | No | No |
| Token delivered via channel | Maybe, safe invitation only. | No | No | No | Yes | Yes | No | No | No |
| Token opened | Generic flow page only. | No | No | No | Yes | Yes | No | No | No |
| Verification submitted | Generic pending/result only. | No | No | No | Yes | Yes | No by itself. | No | No |
| Verification failed | Generic failure/retry guidance. | No | No | No | Yes | Yes | No | No | No |
| Token expired | Generic unavailable/expired-safe guidance. | No | No | No | Yes | Yes | No | No | No |
| Token reused | Generic unavailable/invalid-safe guidance. | No | No | No | Yes | Yes | No | No | No |
| Verification success | Generic success or next-step only. | No | No | No | Yes | Yes | Future-only maybe. | No | No |
| Consent captured | Generic consent confirmation if policy allows. | No | No | No | Yes | Yes | Future-only maybe. | No | No |
| Binding active | Safe customer-visible acknowledgement only. | No | No | No | Yes | Yes | Future-only yes. | No | No |
| Binding revoked | Generic revocation acknowledgement if policy allows. | No | No | No | Yes | Yes | No | No | No |
| Duplicate / conflict detected | Generic unavailable / support guidance. | No | No | No | Yes | Yes | No | No | No |

## Verification Factor Guidance

These are future-only factor candidates. They are not implementation approval.

| Verification factor | Future purpose | Enumeration risk | Safe-deny requirement |
| --- | --- | --- | --- |
| Partial phone challenge | Check whether customer knows/possesses a phone-related proof without displaying the complete value. | Can reveal phone correctness or Case/customer existence if errors differ. | Always use generic failure and masked internal audit. |
| Partial Email challenge | Check email-related proof without displaying complete email. | Can reveal email correctness or account existence. | Always use generic failure and masked internal audit. |
| Appointment-related challenge | Ask a customer-known appointment fact. | Can reveal appointment existence or schedule if prompt is too specific. | Use generic prompt and generic failure; avoid showing hidden details before verification. |
| Case reference challenge | Ask for customer-known case reference. | Can reveal Case existence if response differs. | Use generic failure and rate/attempt controls in future design. |
| SMS OTP candidate | Prove phone possession. | Can reveal phone availability or correctness through send/result differences. | Generic send/result responses; provider diagnostics internal-only. |
| Email OTP candidate | Prove email possession. | Can reveal email availability or correctness through send/result differences. | Generic send/result responses; provider diagnostics internal-only. |
| Web portal login candidate | Use authenticated customer session. | Can leak cross-organization or hidden Case data if session scope is wrong. | Enforce organization scope and customer-visible data policy. |
| App login candidate | Use authenticated App customer session. | Can leak if device/app identity is over-trusted. | Enforce organization scope, session validation, and customer-visible data policy. |

## Safe Deny / Non-enumeration Rules

The following external failure categories must collapse to generic failure / retry / support guidance:

- verification failed,
- token expired,
- token reused,
- token missing,
- Case missing,
- customer missing,
- customer mismatch,
- phone mismatch,
- email mismatch,
- channel mismatch,
- organization mismatch,
- LINE channel mismatch,
- feature not entitled,
- usage exceeded,
- binding already active,
- binding conflict,
- duplicate customer ambiguity,
- provider readiness unavailable,
- verification factor unavailable.

External response must not reveal the true reason.

Internal audit may record safe categories, but must mask sensitive data.

## Consent Boundary

- Binding verification is not notification consent.
- Binding verification is not marketing consent.
- Binding verification is not survey consent.
- Binding verification is not quote approval.
- Binding verification is not customer fee consent.
- Consent capture must be future traceable by source, time, channel, scope, actor, and policy version.
- Consent revoked means the channel must not be used for non-essential notification categories that require consent.
- Essential service notifications and marketing/non-essential notifications require future separation.
- Consent state must not be inferred from provider delivery success.
- Consent state must not be inferred from message open/read state by itself.

## Data Protection Rules

Logs, errors, frontend responses, AI context, reports, exports, diagnostics, and customer-visible responses must not expose:

- complete binding token,
- token hash,
- secrets,
- complete phone numbers,
- complete email addresses,
- LINE access tokens,
- LINE channel secrets,
- raw LINE identifiers,
- raw provider payloads,
- verification codes,
- provider credentials,
- hidden Case existence,
- hidden Customer existence,
- binding conflict diagnostics,
- cross-organization data,
- internal-only data.

Token hash must not be used in external response.

Customer-visible lookup may return only customer-visible data after successful future verification and policy checks.

Internal-only data must never leak through reverse binding, verification challenge, customer lookup, notification, AI context, report, or export.

## Interaction With Existing Platform Objects

### Customer

Reverse binding may link a future channel identity to an existing Customer only after scoped, verified, audited workflow acceptance.

### Case

Case may be a context for reverse binding, but failed verification must not reveal whether the Case exists.

### Appointment / Dispatch Visit

Appointment facts may be future verification context only if they do not leak appointment existence or schedule before verification.

### Field Service Report

Field Service Report content remains protected by customer-visible policy.

Reverse binding does not grant access to internal Field Service Report content.

### Customer Channel Identity

Customer channel identity remains scoped by organization and channel/provider context.

Binding must not use raw provider identifier as global identity.

### Customer Self-service Lookup

Customer self-service lookup requires future verified identity, customer-visible policy, safe deny, and non-enumeration.

Reverse binding alone is not a broad authorization grant.

### Notification Sending

Notification sending requires future consent/preference, channel resolver, provider policy, no-send/sandbox, suppression, audit, and usage tracking.

Binding does not approve sending by itself.

### Survey

Survey delivery may use channel identity later, but only after future survey eligibility, consent/preference, suppression, and channel resolver policy.

### Customer Fee Consent

Customer fee consent must remain a separate workflow from reverse binding.

Binding does not mean the customer agreed to any fee.

### Audit Log Future Layer

Future audit should record token generation, delivery request, opened token, verification submitted, verification failed, expired token, reused token, verification success, consent captured, binding active, revoked binding, duplicate/conflict detected, and diagnostic access.

Audit must not store complete tokens, token hashes in externally visible contexts, secrets, complete phone/email, verification codes, raw provider payloads, raw provider identifiers, or unnecessary customer private data.

### Usage Tracking Future Layer

Future usage tracking may record token generation count, verification attempts, OTP send attempts, binding attempts, customer lookup attempts, and provider sends.

Usage records must not store token values, verification codes, full contact values, raw provider payloads, or customer private data.

## SaaS-ready / Security Considerations

Future reverse binding / verification design must preserve:

- organization isolation,
- channel identity scope,
- Data Access Control authority,
- verification / consent separation,
- customer-visible vs internal-only policy,
- audit readiness,
- usage tracking readiness,
- provider credential safety,
- channel-agnostic design,
- safe deny,
- non-enumeration,
- feature entitlement boundary,
- Enterprise SSO distinction for internal users,
- ISO 27001-aligned incident, access, and supplier risk readiness.

Plan entitlement may determine whether an organization can use reverse binding, SMS OTP, Email OTP, Web portal verification, App login verification, or multi-channel identity in the future.

Entitlement does not replace organization scope, channel scope, verification, consent, Data Access Control, safe deny, non-enumeration, audit, or usage tracking.

## Explicit Runtime Forbidden Confirmation

Task299 explicitly does not approve:

- reverse binding runtime,
- token generation runtime,
- token storage runtime,
- token verification runtime,
- customer channel identity runtime,
- binding runtime,
- verification runtime,
- consent runtime,
- login runtime,
- notification/provider sending runtime,
- LINE sending,
- SMS sending,
- Email sending,
- App sending,
- customer self-service lookup runtime,
- appointment runtime change,
- Case runtime change,
- completion runtime change,
- Field Service Report runtime change,
- customer fee consent runtime,
- quote runtime,
- billing runtime,
- settlement runtime,
- survey sending runtime,
- permission runtime,
- entitlement runtime,
- usage runtime,
- seat billing runtime,
- AI / RAG runtime,
- AI binding / AI identity decision runtime,
- report/export/download runtime,
- API changes,
- Admin UI changes,
- DB schema changes,
- migration changes,
- smoke / fixture changes.

## Future Task Candidates

These are future candidates only and are not approved by Task299:

- reverse binding safe-deny response matrix,
- reverse binding token lifecycle schema proposal with no migration,
- verification factor risk matrix,
- OTP no-enumeration policy,
- consent capture taxonomy,
- binding conflict human review workflow,
- reverse binding audit event catalog,
- customer-visible lookup verification policy,
- reverse binding no-runtime smoke plan,
- provider delivery redaction policy.

## Conclusion

Task299 establishes docs-only reverse binding / verification boundary guidance.

Reverse binding is not login, not customer self-service authorization, not notification consent, and not a long-term identity credential. Future binding tokens must expire, be one-time-use, and be hash-stored. Verification failures must safe-deny without revealing Case, Customer, phone, email, channel identity, token, or binding state. Successful binding still permits only customer-visible data and does not approve notifications, survey, quote, fee consent, payment, or internal data access by itself.

No token, verification, binding, consent, login, notification, customer self-service, API, Admin UI, DB, migration, AI identity decision, provider sending, report/export/download, permission, entitlement, usage, smoke, or inventory documentation change is approved by this task.
