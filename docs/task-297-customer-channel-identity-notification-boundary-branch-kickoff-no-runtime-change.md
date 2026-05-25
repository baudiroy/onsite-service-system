# Task 297 - Customer Channel Identity / Notification Boundary Branch Kickoff / No Runtime Change

## Scope And Non-goals

This document opens a docs-only Customer Channel Identity / Notification Boundary branch after the Engineer Mobile / Field UX branch readiness closure in Task296.

The purpose is to map future boundaries for LINE / SMS / Email / Web portal / App customer channel identity, reverse binding, verification challenge, consent, notification preference, safe deny, non-enumeration, provider sending, and notification audit.

Task297 is documentation-only.

This task is not:

- customer channel identity runtime,
- reverse binding runtime,
- verification runtime,
- consent runtime,
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

Task297 does not add tables, migrations, schema, indexes, backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, smoke scripts, fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, customer self-service runtime, survey sending, notification runtime, AI runtime, or inventory documentation changes.

## Why This Branch Follows Engineer Mobile / Field UX Readiness Closure

Task289 through Task296 defined future Engineer Mobile / Field UX boundaries and then paused that branch without runtime approval.

The next safe product branch is Customer Channel Identity / Notification Boundary because:

- LINE is currently the main customer entry point, but must not become the only identity model,
- future SMS / Email / Web portal / App support must preserve the same customer identity principles,
- reverse binding is required for existing Cases to connect to customer channel identities safely,
- notifications, survey, appointment updates, quote/fee consent, callbacks, and customer-visible documents all depend on channel identity and consent policy,
- provider sending must not be confused with data authorization or customer consent,
- verification failures must not leak whether a Case, customer, phone, email, LINE identity, or channel identity exists.

This branch remains docs-only and does not approve runtime implementation.

## Customer Channel Identity / Notification Branch Purpose

This branch should define future channel and notification boundaries without adding screens, APIs, schemas, provider adapters, workers, or sending logic.

It should preserve:

- channel-agnostic customer identity,
- organization-scoped channel identity,
- safe reverse binding,
- non-enumeration,
- safe deny,
- consent and notification preference separation,
- customer-visible/internal-only data separation,
- Data Access Control authority,
- audit readiness,
- provider usage tracking readiness,
- SaaS-ready channel feature boundaries.

## Concept Map

The following concepts are future design targets only.

They are not UI components, API endpoints, database tables, provider adapters, worker jobs, or runtime approvals.

| Concept | Future purpose | Key boundary | Runtime allowed now? |
| --- | --- | --- | --- |
| Customer channel identity | Represent a customer reachable through a specific channel/provider context. | Must be scoped and must not equal internal user seat. | No |
| LINE identity | Connect customer context to LINE channel identity. | `line_user_id` must be scoped by organization + LINE channel + provider identifier. | No |
| SMS identity | Connect customer context to a phone/SMS channel. | Phone verification must be safe and non-enumerating. | No |
| Email identity | Connect customer context to an email channel. | Email verification must be safe and non-enumerating. | No |
| Web portal identity | Allow customer self-service login or lookup. | Customer-visible only; no internal data. | No |
| App identity | Long-term owned customer entry point. | Must connect to same customer model, not replace LINE scope. | No |
| Reverse binding | Link an existing Case/customer to a channel identity. | Token must expire, be one-time, and future-hashed. | No |
| Verification challenge | Prove customer/channel possession or relationship. | Failure must not reveal existence or correctness. | No |
| Consent | Customer authorization for specific use or notification category. | Verified identity does not imply all consents. | No |
| Notification preference | Customer/channel preference and suppression rules. | Preference is separate from identity and consent. | No |
| Safe deny | Generic rejection that avoids information leakage. | Must not reveal whether customer/Case/channel exists. | No |
| Non-enumeration | Prevent attackers from checking existence/correctness. | Applies to phone, email, Case, LINE identity, token, and binding state. | No |
| Provider sending | Delivery through LINE, SMS, Email, App push, or similar provider. | Sending is not data authorization or business-state authority. | No |
| Notification audit | Record lifecycle and safety events. | Must not store raw provider payload or secrets. | No |

## Core Boundaries

- LINE is currently the main customer entry point, but it is not the only identity model.
- `line_user_id` must not be treated as a global identity.
- LINE identity must be scoped by `organization_id + line_channel_id + line_user_id`.
- Customer channel identity is not an internal user account.
- Customer channel identity is not an internal user seat.
- Customer channel identity must not bypass organization isolation.
- Customer channel identity must not bypass Data Access Control.
- Customer channel identity must not see internal-only data.
- Customer channel identity must not modify Case, Appointment, Field Service Report, billing, settlement, quote, survey, or complaint state by itself.
- Reverse binding token must be future expiring, one-time-use, and hash-stored.
- Verification failure must not reveal whether Case exists.
- Verification failure must not reveal whether customer exists.
- Verification failure must not reveal whether phone/email is correct.
- Verification failure must not reveal whether LINE/channel identity exists.
- Verification failure must not reveal whether a customer is already bound.
- Provider delivery success does not prove customer consent.
- Provider delivery failure does not prove customer identity is invalid.

## Future-only Channel Capability Map

This matrix is future-only guidance. It does not approve runtime, schema, API, customer self-service, provider sending, notification, consent, verification, or reverse binding implementation.

| Capability | Channel type | Requires verification? | Requires consent? | Customer-visible only? | May expose internal-only data? | Requires organization scope? | Requires channel identity scope? | Requires safe deny? | Requires audit readiness? | Requires usage tracking? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LINE case lookup | LINE | Yes | Maybe, depending on policy. | Yes | No | Yes | Yes | Yes | Yes | Yes | No |
| LINE reverse binding | LINE | Yes | Yes, for binding/notifications as policy requires. | Yes | No | Yes | Yes | Yes | Yes | Yes | No |
| SMS verification | SMS | Yes | Maybe | Yes | No | Yes | Yes | Yes | Yes | Yes | No |
| Email verification | Email | Yes | Maybe | Yes | No | Yes | Yes | Yes | Yes | Yes | No |
| Web portal login / lookup | Web portal | Yes | Maybe | Yes | No | Yes | Yes | Yes | Yes | Yes | No |
| App login / lookup | App | Yes | Maybe | Yes | No | Yes | Yes | Yes | Yes | Yes | No |
| Appointment notification | LINE / SMS / Email / App | Yes | Yes, if policy requires. | Yes | No | Yes | Yes | Yes | Yes | Yes | No |
| Survey notification | LINE / SMS / Email / App | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes | Yes | No |
| Quote / fee consent notification | LINE / SMS / Email / App / Web | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes | Yes | No |
| Complaint / callback notification | LINE / SMS / Email / App | Yes | Yes, if policy requires. | Yes | No | Yes | Yes | Yes | Yes | Yes | No |
| Customer-visible document notification | LINE / SMS / Email / App / Web | Yes | Yes, if policy requires. | Yes | No | Yes | Yes | Yes | Yes | Yes | No |

## Notification Boundary Principles

- Notification sending is not data authorization.
- Provider delivery success is not customer consent.
- Provider delivery success is not proof of customer identity correctness.
- Provider callback is not business-state authority by itself.
- Verified channel identity does not mean the customer agreed to all notification categories.
- Survey sending requires future survey policy.
- Quote sending requires future quote/customer-visible policy.
- Fee consent request requires future consent policy.
- Callback notice requires future complaint/callback policy.
- Customer-visible document notification requires future document visibility and download policy.
- Provider raw payload must not be written into general logs.
- Provider raw payload must not be returned in external responses.
- Provider secrets must never be exposed to AI, logs, frontend, or customer-visible responses.
- Message copy must not include internal-only data.
- Sending must be organization-scoped, permission-aware, auditable, and usage-trackable in future runtime.

## Data Protection Rules

Logs, errors, frontend responses, customer-visible responses, AI context, reports, exports, and diagnostic views must not expose:

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
- customer private data beyond operational need,
- cross-organization data,
- internal notes,
- billing/settlement internal data,
- audit log details,
- supervisor notes,
- AI raw payloads.

Customer-visible notification content must not contain:

- internal note,
- billing internal data,
- settlement internal data,
- audit log,
- AI raw payload,
- supervisor-only note,
- provider diagnostics,
- internal risk flags,
- vendor payout,
- SaaS billing/usage cost,
- hidden Case/Customer existence hints.

All future notifications require:

- organization scope,
- customer-visible data policy,
- channel identity scope,
- verification and consent policy where applicable,
- permission/entitlement check for the initiating user/workflow,
- audit readiness,
- provider usage tracking readiness,
- safe-deny behavior for failures.

## Interaction With Existing Platform Objects

### Customer

Customer remains the platform's internal customer entity.

Customer channel identity should link to Customer through future scoped, verified, audited relationships.

### Case

Case may be referenced in customer-visible lookup or reverse binding, but failed verification must not reveal whether the Case exists.

### Appointment / Dispatch Visit

Appointment notifications may be future customer-visible messages.

Appointment notification must not expose internal dispatch notes, engineer-only notes, or broad appointment history beyond policy.

### Field Service Report

Customer-visible completion summary or report notification must use approved customer-visible content only.

Field Service Report internal content must not leak through notifications.

### Survey

Survey notification should depend on future survey eligibility, channel resolver, consent/preference, suppression, and no-send policy.

Survey sending is not approved by Task297.

### Customer Fee Consent

Fee consent requests require future policy and must not be treated as automatic consent from provider delivery or message read state.

### Quote

Quote notification must be customer-visible, policy-approved, and separate from quote approval.

### Complaint / Callback Future Records

Complaint and callback notices must be sensitive, safe, and non-enumerating.

Low-rating or complaint risk must not expose internal supervisor notes.

### Customer Self-service Lookup

Customer self-service lookup must be customer-visible only and must not expose internal-only data.

Lookup failure must use safe deny and non-enumeration.

### Audit Log Future Layer

Future audit should record verification attempts, safe-deny events, reverse binding lifecycle, notification eligibility decisions, provider send attempts, provider callback classifications, suppression/opt-out decisions, and diagnostic access.

Audit must not store raw provider payloads, complete contact values, tokens, secrets, raw channel identifiers, or AI raw sensitive payload.

### Usage Tracking Future Layer

Future usage tracking may record provider sends, verification attempts, customer lookups, notification retries, manual resends, and provider callbacks.

Usage records must not contain message bodies, raw provider payloads, complete contact values, or secrets.

## SaaS-ready / Security Considerations

Future Customer Channel Identity / Notification design must preserve:

- organization isolation,
- channel identity scope,
- Data Access Control authority,
- permission / entitlement / usage separation,
- customer-visible vs internal-only policy,
- audit readiness,
- provider usage tracking readiness,
- LINE / SMS / Email / Web portal / App channel-agnostic design,
- Enterprise SSO and organization membership boundary for internal users,
- provider supplier risk management,
- ISO 27001-aligned redaction and incident readiness.

Plan entitlement may determine whether an organization can use LINE binding, reverse binding, SMS, Email, App push, customer self-service, survey notifications, quote notifications, fee consent requests, or multi-channel delivery in the future.

Entitlement does not replace organization scope, channel scope, user permission, verification, consent, Data Access Control, masking, audit, non-enumeration, or usage tracking.

## Explicit Runtime Forbidden Confirmation

Task297 explicitly does not approve:

- customer channel identity runtime,
- reverse binding runtime,
- verification runtime,
- consent runtime,
- notification/provider sending runtime,
- LINE sending,
- SMS sending,
- Email sending,
- App sending,
- customer self-service runtime,
- survey sending runtime,
- appointment notification runtime,
- quote notification runtime,
- fee consent request runtime,
- complaint/callback notification runtime,
- API changes,
- Admin UI changes,
- DB schema changes,
- migration changes,
- permission runtime,
- entitlement runtime,
- usage runtime,
- seat billing runtime,
- AI / RAG runtime,
- report/export/download runtime,
- smoke / fixture changes.

## Future Task Candidates

These are future candidates only and are not approved by Task297:

- channel identity concept separation matrix,
- LINE / SMS / Email / Web / App verification policy,
- reverse binding safe-deny matrix,
- notification category and consent taxonomy,
- provider payload redaction policy,
- customer self-service lookup safe response policy,
- channel identity audit event catalog,
- provider usage tracking matrix,
- notification copy governance refresh,
- channel resolver no-send test plan.

## Conclusion

Task297 opens the Customer Channel Identity / Notification Boundary branch as docs-only.

This task preserves the core rule that LINE is a primary current entry point but not the only identity model. Raw provider identity must remain scoped, customer channel identity must not bypass organization isolation or Data Access Control, and notification sending must not be confused with data authorization or consent.

No customer channel identity, reverse binding, verification, consent, notification, provider sending, customer self-service, survey sending, API, Admin UI, DB, migration, AI / RAG, report/export/download, permission, entitlement, usage, smoke, or inventory documentation change is approved by this task.
