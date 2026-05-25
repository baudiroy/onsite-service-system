# Task 301 - Customer Channel Provider Payload And Delivery Audit Boundary / No Runtime Change

## Scope And Non-goals

This document continues the Customer Channel Identity / Notification Boundary branch after Task297 through Task300.

Task301 defines future-only boundaries for provider payloads, delivery results, provider errors, retry candidates, delivery audit, usage tracking, and sensitive data protection for LINE, SMS, Email, Web portal, App push, and future channels.

The goal is to prevent future provider sending integrations from storing raw provider payloads, leaking credentials, exposing provider diagnostics, or confusing delivery results with customer consent, customer channel validity, or billing runtime.

Task301 is documentation-only.

This task is not:

- provider sending runtime,
- delivery tracking runtime,
- retry runtime,
- provider audit runtime,
- usage tracking runtime,
- notification consent runtime,
- notification preference runtime,
- customer channel identity runtime,
- reverse binding runtime,
- verification runtime,
- token runtime,
- login runtime,
- customer self-service lookup runtime,
- appointment runtime change,
- Case runtime change,
- Field Service Report completion runtime change,
- quote runtime,
- customer fee consent runtime,
- billing runtime,
- settlement runtime,
- survey sending runtime,
- permission runtime,
- entitlement runtime,
- seat billing runtime,
- AI / RAG runtime,
- report/export/download runtime,
- API contract,
- Admin UI,
- backend service change,
- DB schema / migration proposal,
- smoke / test implementation.

Task301 does not add tables, migrations, schema, indexes, backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, smoke scripts, fixtures, package changes, provider sending, delivery tracking, retry runtime, audit runtime, usage runtime, notification runtime, LINE / SMS / Email / APP sending, customer self-service runtime, AI runtime, or inventory documentation changes.

## Why Provider Payload / Delivery Audit Boundaries Are Needed After Task300

Task300 separated channel binding, verification, notification consent, notification preference, provider delivery, and customer business response.

The next risk is assuming provider payloads and delivery results are safe to store or display without boundaries.

Provider integrations often return diagnostic messages, recipient identifiers, delivery details, raw callbacks, and failure reasons. These values can contain sensitive customer data, provider credentials, raw channel identifiers, or hidden existence signals.

Task301 defines the provider payload / delivery audit boundary before any provider sending, delivery tracking, retry, audit, usage metering, customer self-service, or notification runtime is approved.

## Definitions

### Provider Payload

Provider payload is the data sent to or received from a future external channel provider, such as LINE, SMS, Email, App push, or another messaging provider.

Provider payload must be minimized and customer-visible when outbound.

### Provider Raw Payload

Provider raw payload is the unfiltered request, response, callback, webhook, diagnostic, or error body from a provider.

Provider raw payload must not be stored in normal logs, audit logs, usage records, frontend responses, or customer-visible outputs.

### Outbound Notification Payload

Outbound notification payload is the future customer-facing message content prepared by the platform before provider-specific formatting.

It must contain only customer-visible data needed for the notification category.

### Provider Delivery Result

Provider delivery result is a future status category from a provider or platform dispatcher, such as accepted, delivered, failed, suppressed, skipped, or unknown.

Delivery result is not customer consent and is not business approval.

### Provider Error

Provider error is a future provider or dispatcher failure category.

Provider error details may be sensitive and must be mapped to safe internal categories and generic external responses.

### Retry Candidate

Retry candidate is a future failed or uncertain delivery attempt that may be considered for retry.

Retry candidate does not mean retry is allowed.

### Delivery Audit Event

Delivery audit event is a future internal audit record for notification creation, provider attempt, provider result, safe deny, suppression, retry decision, or delivery failure classification.

It must be masked and scoped.

### Usage Tracking Event

Usage tracking event is a future metering record for provider cost, channel usage, message count, retry count, or notification-related SaaS usage.

Usage tracking is not billing runtime by itself.

### Provider Credential

Provider credential is any future secret or credential used to call provider APIs or verify provider callbacks.

Provider credentials must never be exposed through logs, audit, usage, errors, or frontend responses.

### Provider Token / Secret

Provider token / secret is a future access token, API key, channel secret, webhook secret, push credential, email credential, SMS credential, or equivalent authentication material.

Provider token / secret must be treated as highly sensitive.

### Safe Provider Log

Safe provider log is a future masked, minimized operational log that records only safe categories needed for troubleshooting and audit.

It must not include raw provider payload, credentials, raw recipient identifiers, or private customer content.

## Boundary Principles

- Provider raw payload must not be written to normal logs.
- Provider credential / token / secret must not enter audit logs.
- Provider credential / token / secret must not enter usage records.
- Provider credential / token / secret must not enter error responses.
- Provider credential / token / secret must not enter frontend responses.
- Delivery success is not customer consent.
- Delivery success is not quote approval.
- Delivery success is not customer fee consent.
- Delivery success is not survey response.
- Delivery failure is not customer channel identity invalid.
- Delivery failure is not consent revocation by itself.
- Retry candidate is not permission to resend.
- Provider usage cost is not customer charge.
- Audit log is not usage tracking.
- Usage tracking is not billing runtime.
- Notification payload must not contain internal-only data.
- Provider callback diagnostics must be internal-only and masked.
- Provider-specific failure reasons must not be exposed to customers.
- AI must not decide retry eligibility.
- AI must not convert provider delivery result into consent, approval, complaint closure, or official record change.

## Future-only Provider Delivery Matrix

This matrix is future-only guidance. It does not approve runtime, schema, API, provider sending, delivery tracking, retry, audit, usage metering, notification consent, customer channel identity, or Admin implementation.

| Delivery row | Provider / channel type | Customer-visible payload only? | May include internal-only data? | Requires consent/preference check? | Requires organization scope? | Requires audit readiness? | Requires usage tracking? | May store provider raw payload? | May expose failure reason externally? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LINE push send candidate | LINE | Yes | No | Yes | Yes | Yes | Yes | No | No | No |
| SMS send candidate | SMS | Yes | No | Yes | Yes | Yes | Yes | No | No | No |
| Email send candidate | Email | Yes | No | Yes | Yes | Yes | Yes | No | No | No |
| App push send candidate | App push | Yes | No | Yes | Yes | Yes | Yes | No | No | No |
| Web portal notification candidate | Web portal | Yes | No | Yes | Yes | Yes | Yes | No | No | No |
| Appointment reminder delivery | Channel-agnostic | Yes | No | Yes | Yes | Yes | Yes | No | No | No |
| Survey invitation delivery | Channel-agnostic | Yes | No | Yes | Yes | Yes | Yes | No | No | No |
| Quote notice delivery | Channel-agnostic | Yes | No | Yes | Yes | Yes | Yes | No | No | No |
| Customer fee consent request delivery | Channel-agnostic | Yes | No | Yes | Yes | Yes | Yes | No | No | No |
| Complaint / callback update delivery | Channel-agnostic | Yes | No | Yes | Yes | Yes | Yes | No | No | No |
| Provider error received | Provider callback / response | No customer payload | No | N/A | Yes | Yes | Yes if metered | No | No | No |
| Retry after transient failure | Provider retry candidate | Yes | No | Yes | Yes | Yes | Yes | No | No | No |
| Permanent delivery failure classification | Provider result category | No customer payload | No | N/A | Yes | Yes | Yes if metered | No | No | No |

## Safe Provider Log Rules

Safe provider logs may record:

- masked provider type,
- organization scope,
- message category,
- delivery status category,
- correlation id,
- timestamp,
- retry category,
- suppression category,
- safe deny category,
- provider family category without credential values.

Safe provider logs must not record:

- complete phone,
- complete email,
- raw LINE id,
- LINE access token,
- channel secret,
- SMS credential,
- Email credential,
- App push token raw value,
- raw provider payload,
- verification code,
- binding token,
- customer private content,
- internal note,
- AI raw payload,
- provider request body,
- provider callback body,
- provider credential configuration.

Provider diagnostic data should be mapped to safe categories before logging.

## Retry Boundary

Retry is future-only and must be controlled by:

- notification consent,
- notification preference,
- channel verification,
- organization scope,
- feature entitlement,
- subscription status,
- usage limits,
- provider safety,
- idempotency,
- rate limit,
- suppression rules,
- category-specific policy,
- customer-visible payload policy.

Design principles:

- Transient failure may be classified internally, but external response must remain safe.
- Permanent failure may be classified internally, but must not automatically invalidate the customer channel identity.
- Invalid recipient category must not reveal whether the customer, channel, or recipient exists.
- Provider unavailable must not leak provider configuration status.
- Retry must not create duplicate customer fee consent requests.
- Retry must not create survey spam.
- Retry must not resend quote notices after the quote state changed.
- Retry must not send a notification through another channel without consent / preference / entitlement checks.
- Retry must not cross organization scope.
- Retry must not be decided by AI.
- Retry must not bypass usage tracking or audit readiness.

## Audit Vs Usage Separation

Delivery audit records responsibility, safety, and traceability.

Usage tracking records metered volume, cost attribution, and future SaaS usage.

They may be linked by safe correlation id, but they are not the same concept.

Audit may answer:

- who initiated or authorized the notification attempt,
- which organization and category were involved,
- what safe delivery category occurred,
- whether a safe deny or suppression happened,
- whether a retry decision occurred.

Usage tracking may answer:

- how many provider attempts occurred,
- which feature category consumed usage,
- which billing period the event belongs to,
- whether a retry consumed usage,
- whether a provider family incurred cost.

Both audit and usage must avoid storing complete sensitive payloads, raw provider payloads, credentials, or raw recipient identifiers.

Usage tracking is not customer billing runtime by itself. Future SaaS billing must be a separate approved design.

## Interaction With Existing And Future Objects

### Customer Channel Identity

Customer channel identity provides scoped recipient context. It does not authorize provider sending by itself and does not prove consent.

### Notification Consent / Preference

Notification consent and preference are future policy checks before provider dispatch. They do not override Data Access Control or customer-visible payload rules.

### Case

Case context may select message category and customer-visible details. Provider payload must not include internal Case notes or hidden status.

### Appointment / Dispatch Visit

Appointment / dispatch visit context may support reminder, reschedule, arrival, or no-show related notification. Payload must be limited to customer-visible appointment information.

### Survey

Survey invitation delivery is provider sending. Delivery does not equal survey response, survey consent answer, complaint status, or feedback result.

### Quote

Quote notice delivery does not equal quote approval. Quote notice payload must not expose internal pricing or approval rules unless they are customer-visible.

### Customer Fee Consent

Customer fee consent request delivery does not equal customer fee consent. Delivery result must not be used as approval.

### Complaint / Callback Future Records

Complaint / callback notification delivery does not close the complaint, resolve callback status, or expose internal review details.

### Audit Log Future Layer

Audit layer may record safe provider attempt categories and delivery status categories with masking and organization scope.

### Usage Tracking Future Layer

Usage layer may record safe metering information for provider attempts, retries, suppressions, and category usage without storing raw sensitive payload.

## SaaS-ready / Security Considerations

- Organization isolation is mandatory.
- Provider credential safety is mandatory.
- Channel identity scope must remain provider/channel/organization scoped.
- Data Access Control remains authoritative.
- Permission, entitlement, subscription, consent, preference, usage, and audit are separate concepts.
- Provider usage tracking readiness is required before future SaaS metering.
- Audit readiness is required before provider sending runtime.
- LINE / SMS / Email / Web portal / App design must stay channel-agnostic at the core.
- Provider-specific adapters must not leak provider-specific identifiers into core customer-visible data.
- Provider credentials must be treated as supplier / external-service secrets.
- Provider integrations must support future supplier risk management, incident response, credential rotation, and exit strategy.
- SaaS plan entitlement, account-seat billing, usage billing, AI Add-on, Enterprise SSO, and custom tenant policy may affect provider availability, but must not weaken privacy, consent, redaction, or organization isolation.

## Explicit Runtime Forbidden Confirmation

Task301 does not approve:

- provider sending runtime,
- delivery tracking runtime,
- retry runtime,
- provider audit runtime,
- usage tracking runtime,
- notification consent runtime,
- notification preference runtime,
- customer channel identity runtime,
- binding runtime,
- reverse binding runtime,
- verification runtime,
- token runtime,
- login runtime,
- LINE sending,
- SMS sending,
- Email sending,
- App push sending,
- Web portal customer notification runtime,
- customer self-service runtime,
- API change,
- Admin UI change,
- DB schema change,
- migration,
- index,
- DDL,
- `psql`,
- `db:migrate`,
- Migration 020 dry-run,
- Migration 020 apply,
- Case runtime change,
- Appointment runtime change,
- Field Service Report runtime change,
- quote runtime,
- customer fee consent runtime,
- billing runtime,
- settlement runtime,
- survey sending runtime,
- permission runtime,
- entitlement runtime,
- seat billing runtime,
- AI decision runtime,
- AI / RAG runtime,
- report/export/download runtime,
- smoke / fixture change,
- package change,
- inventory docs expansion.

## Future Questions

These questions should be answered before any provider payload / delivery audit runtime is implemented:

- Which provider result categories are safe to store?
- Which provider diagnostics must be discarded immediately?
- Which provider retries should consume usage?
- Which suppressions should create audit records?
- How should provider correlation ids be generated without exposing sensitive data?
- Which delivery statuses are customer-visible?
- Which delivery statuses are internal-only?
- How should provider callback verification be audited without storing credentials?
- How should future SaaS usage metering distinguish accepted, delivered, failed, skipped, and suppressed attempts?
- How should customer-visible copy avoid provider-specific technical language?

## Conclusion

Task301 defines docs-only provider payload / delivery audit boundary guidance.

The current approved state remains:

- no provider sending,
- no delivery tracking,
- no retry runtime,
- no provider audit runtime,
- no usage tracking runtime,
- no notification consent / preference runtime,
- no customer channel identity runtime,
- no API change,
- no Admin UI change,
- no DB change,
- no migration,
- no AI decision runtime.

Provider payload, provider raw payload, delivery result, provider error, retry candidate, delivery audit, usage tracking, consent, preference, customer channel identity, and business approval must remain separate concepts until a future task explicitly approves runtime design and implementation.
