# Task 298 - Customer Channel Identity Scope And Binding Matrix / No Runtime Change

## Scope And Non-goals

This document continues the Customer Channel Identity / Notification Boundary branch opened in Task297.

Task298 defines future-only customer channel identity scope and binding boundaries for LINE, SMS, Email, Web portal, App, reverse binding token identity, and anonymous lookup session.

The goal is to clarify how external channel identities may relate to `customer_id`, how they must be scoped and verified, and how to avoid cross-organization, cross-tenant, or cross-channel misbinding and data leakage.

Task298 is documentation-only.

This task is not:

- customer channel identity runtime,
- binding runtime,
- reverse binding runtime,
- verification runtime,
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

Task298 does not add tables, migrations, schema, indexes, backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, smoke scripts, fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, login runtime, notification runtime, customer self-service runtime, AI runtime, or inventory documentation changes.

## Why Channel Identity Scope / Binding Boundaries Are Needed After Task297

Task297 opened the Customer Channel Identity / Notification Boundary branch and established that LINE is a current primary entry point but not the only identity model.

The next risk is treating provider-specific identifiers such as LINE user id, phone number, email address, web login, app account, reverse binding token, or anonymous lookup session as if they were globally unique customer identity.

Task298 defines a matrix so future channel identity design does not:

- merge customers only because a raw external identifier matches,
- bind a channel identity across organizations incorrectly,
- treat an external channel identity as an internal user,
- leak internal-only data through customer-visible lookup,
- reveal whether a Case, customer, phone, email, token, or channel identity exists.

## Definitions

### Customer Channel Identity

Customer channel identity is a scoped relationship between a platform Customer and a specific external channel/provider identity.

It is not the same as `customer_id` and is not an internal user account.

### customer_id

`customer_id` is the platform's internal customer reference.

It should be the customer anchor that multiple channel identities may connect to after future safe verification/binding workflows.

### LINE Identity

LINE identity is the future scoped relationship between a customer and a LINE provider identity within an organization and LINE channel.

Raw LINE user id is not a global customer identity.

### SMS Identity

SMS identity is a future phone/SMS contact identity.

Phone number alone must not automatically merge customers or prove ownership.

### Email Identity

Email identity is a future email contact identity.

Email address alone must not automatically merge customers or prove ownership.

### Web Portal Identity

Web portal identity is a future authenticated customer portal identity.

It must remain customer-visible and organization-scoped.

### App Identity

App identity is a future owned customer App account or device-linked customer identity.

It must connect to the same customer model without hard-coding LINE or replacing Data Access Control.

### Organization Scope

Organization scope means every identity, verification, binding, lookup, consent, and notification action must be tied to the correct organization/tenant context.

### line_channel_id Scope

`line_channel_id` scope means a LINE user identifier is meaningful only within a LINE channel and organization context.

### Reverse Binding

Reverse binding is a future workflow that lets an existing Case/customer context invite or verify a customer into a channel identity, such as LINE.

### Verification State

Verification state indicates whether a channel identity or contact point has passed a future approved challenge.

Verification is not the same as broad consent.

### Consent State

Consent state indicates what communication, notification, survey, quote, fee, or customer-visible interaction the customer has agreed to.

Consent is separate from verification.

### Safe Deny

Safe deny is a generic failure or rejection response that avoids revealing whether a Case, customer, phone, email, channel identity, token, or binding state exists.

### Enumeration Protection

Enumeration protection prevents attackers or unauthorized actors from checking identities, Cases, phone numbers, emails, tokens, or bindings by observing different response text, timing, status, or diagnostics.

## Boundary Principles

- External channel identity is not `customer_id`.
- `customer_id` is not internal user id.
- Customer channel identity is not an internal user seat.
- LINE is a channel, not the only identity model.
- `line_user_id` must be scoped by `organization_id + line_channel_id + line_user_id`.
- SMS identity must be organization-scoped.
- Email identity must be organization-scoped.
- Web portal identity must be organization-scoped.
- App identity must be organization-scoped.
- The same customer may have multiple channel identities.
- The same external identity must not be treated as the same customer across organizations unless a future explicit, secure, audited design approves it.
- Channel binding must not bypass customer-visible policy.
- Channel binding must not expose internal-only data.
- Channel verification must not imply all notification consent.
- Channel identity must not modify Case, Appointment, Field Service Report, quote, fee consent, settlement, survey, or complaint state by itself.
- AI must not merge customer identities or decide binding conflicts.

## Future-only Identity Scope Matrix

This matrix is future-only guidance. It does not approve runtime, schema, API, login, verification, consent, binding, reverse binding, customer self-service, notification, or provider implementation.

| Identity type | Required scope fields | Maps directly to customer_id? | Requires verification? | Requires consent? | Customer-visible only? | May access internal-only data? | Safe deny required? | Audit readiness required? | Usage tracking candidate? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LINE identity | `organization_id`, `line_channel_id`, provider-scoped LINE user reference. | No | Yes | Yes, for notification categories as policy requires. | Yes | No | Yes | Yes | Yes | No |
| SMS phone identity | `organization_id`, phone/contact reference, provider/context if applicable. | No | Yes | Maybe, depending on notification type. | Yes | No | Yes | Yes | Yes | No |
| Email identity | `organization_id`, email/contact reference, provider/context if applicable. | No | Yes | Maybe, depending on notification type. | Yes | No | Yes | Yes | Yes | No |
| Web portal account identity | `organization_id`, portal account/session reference. | No | Yes | Maybe | Yes | No | Yes | Yes | Yes | No |
| App account identity | `organization_id`, app account/device/session reference. | No | Yes | Maybe | Yes | No | Yes | Yes | Yes | No |
| Reverse binding token identity | `organization_id`, binding request reference, token hash reference, target context. | No | Yes | Yes, if binding/notification policy requires. | Yes | No | Yes | Yes | Yes | No |
| Anonymous lookup session | `organization_id`, lookup session reference, challenge context. | No | Yes, before data display. | Maybe | Yes | No | Yes | Yes | Yes | No |

## Future-only Binding Lifecycle

The following lifecycle is conceptual only. It is not a schema, API, state machine, or runtime approval.

1. Initiated.
2. Verification pending.
3. Verified.
4. Consent captured, if policy requires.
5. Active.
6. Revoked.
7. Expired.
8. Failed.
9. Duplicate / conflict requires human review.

Lifecycle state must not expose sensitive existence information through customer-facing responses.

## Reverse Binding Rules

- Reverse binding token must expire.
- Reverse binding token must be one-time-use.
- Reverse binding token must be hash-stored.
- Reverse binding token must not appear in logs.
- Reverse binding token must not appear in errors.
- Reverse binding token must not appear in frontend responses.
- Verification success needs future audit readiness.
- Verification failure needs future audit readiness.
- Token expiration needs future audit readiness.
- Token reuse needs future audit readiness.
- Binding conflict needs future audit readiness.
- Failure response must not reveal whether Case exists.
- Failure response must not reveal whether customer exists.
- Failure response must not reveal whether phone/email is correct.
- Failure response must not reveal whether channel identity exists.
- Failure response must not reveal whether binding is already active.

## Conflict / Duplicate Binding Rules

- Same LINE identity in different `line_channel_id` scopes must not be merged by raw LINE user id alone.
- Same phone number must not automatically merge customers.
- Same email address must not automatically merge customers.
- Same App device token must not become customer identity.
- Same Web portal contact value must not automatically merge customers.
- Organization mismatch must fail closed.
- Channel/provider mismatch must fail closed.
- Ambiguous customer match must require future human-controlled review.
- Duplicate/conflict resolution must be an authorized future workflow.
- AI must not automatically merge customer identities.
- AI must not decide binding conflict.
- AI may only suggest possible duplicate/conflict signals for human review if future policy allows.

## Interaction With Existing Platform Objects

### Customer

Customer remains the internal platform customer anchor.

Multiple channel identities may link to a Customer only through future scoped, verified, audited workflows.

### Case

Case may be used in reverse binding or customer lookup challenges.

Failed binding or lookup must not reveal whether the Case exists.

### Appointment / Dispatch Visit

Appointment notifications or lookup may use channel identity in the future.

Channel identity must not reveal internal dispatch notes or unrelated appointment history.

### Field Service Report

Customer-visible completion summary may be shown through verified channel identity in the future.

Internal report content must not leak through channel binding or lookup.

### Customer Self-service Lookup

Customer self-service lookup must return customer-visible data only.

It must use safe deny and non-enumeration for failed or ambiguous identity checks.

### Notification Sending

Notification sending requires future channel resolution, consent/preference, provider policy, no-send/sandbox, suppression, audit, and usage tracking.

Channel binding alone does not approve sending.

### Customer Fee Consent

Customer fee consent through a channel requires future consent-specific workflow.

Verified channel identity alone is not fee consent.

### Survey

Survey delivery may use channel identity in the future, but only after future survey eligibility, consent/preference, suppression, and channel resolver policy.

### Complaint / Callback Future Records

Complaint and callback workflows may use channel identity for customer communication, but internal risk, supervisor notes, and complaint handling records remain internal-only unless policy approves customer-visible text.

### Audit Log Future Layer

Future audit should record binding initiation, verification attempt, verification success/failure, token expiry, token reuse, duplicate/conflict review, revocation, consent changes, safe-deny events, and diagnostic access.

Audit must not store raw provider identifiers, complete phone/email, tokens, secrets, verification codes, raw provider payloads, or unnecessary customer private data.

## Data Protection Rules

Logs, errors, frontend responses, AI context, reports, exports, diagnostics, and customer-visible responses must not expose:

- complete phone numbers,
- complete email addresses,
- tokens,
- secrets,
- LINE access tokens,
- LINE channel secrets,
- raw LINE identifiers,
- raw provider payloads,
- verification codes,
- binding tokens,
- channel diagnostics,
- hidden Case existence,
- hidden Customer existence,
- cross-organization data,
- internal-only data.

Customer-visible lookup may return only customer-visible data.

Internal-only data must never leak through channel identity, binding, verification, lookup, notification, AI context, report, or export.

## SaaS-ready / Security Considerations

Future channel identity scope/binding design must preserve:

- organization isolation,
- multi-channel identity readiness,
- channel identity scope,
- Data Access Control authority,
- verification / consent separation,
- customer-visible vs internal-only policy,
- audit readiness,
- usage tracking readiness,
- provider credential safety,
- safe deny,
- non-enumeration,
- Enterprise SSO distinction for internal users,
- SaaS entitlement and usage boundaries,
- ISO 27001-aligned incident and supplier risk readiness.

Plan entitlement may determine whether an organization can use LINE binding, reverse binding, SMS verification, Email verification, Web portal lookup, App login, multi-channel identity, or notification delivery in the future.

Entitlement does not replace organization scope, channel identity scope, verification, consent, Data Access Control, user permission, audit, masking, safe deny, or usage tracking.

## Explicit Runtime Forbidden Confirmation

Task298 explicitly does not approve:

- customer channel identity runtime,
- binding runtime,
- reverse binding runtime,
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
- AI merge / AI identity decision runtime,
- report/export/download runtime,
- API changes,
- Admin UI changes,
- DB schema changes,
- migration changes,
- smoke / fixture changes.

## Future Task Candidates

These are future candidates only and are not approved by Task298:

- channel identity verification policy matrix,
- reverse binding token safe-deny matrix,
- consent state taxonomy,
- customer lookup response policy,
- duplicate/conflict human review workflow,
- customer channel identity audit event catalog refresh,
- provider identifier redaction policy,
- channel resolver concept map,
- multi-channel notification eligibility matrix,
- customer self-service non-enumeration test plan.

## Conclusion

Task298 establishes docs-only customer channel identity scope and binding guidance.

External channel identity is not `customer_id`, `customer_id` is not internal user id, customer channel identity is not an internal user seat, and raw provider identifiers must not become global identity. All future channel identity work must remain organization-scoped, channel-scoped, verified, consent-aware, safe-denying, auditable, usage-trackable, and customer-visible-only unless a future authorized workflow says otherwise.

No identity binding, reverse binding, verification, consent, login, notification, provider sending, customer self-service, API, Admin UI, DB, migration, AI/RAG, report/export/download, permission, entitlement, usage, smoke, or inventory documentation change is approved by this task.
