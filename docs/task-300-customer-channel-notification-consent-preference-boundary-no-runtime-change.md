# Task 300 - Customer Channel Notification Consent And Preference Boundary / No Runtime Change

## Scope And Non-goals

This document continues the Customer Channel Identity / Notification Boundary branch after Task297, Task298, and Task299.

Task300 defines future-only boundaries for notification consent, notification preference, notification purpose, customer-visible payload safety, provider sending, audit readiness, and SaaS usage tracking.

The goal is to prevent future channel binding or reverse binding verification from being mistaken as permission to send every notification category.

Task300 is documentation-only.

This task is not:

- notification consent runtime,
- notification preference runtime,
- provider sending runtime,
- LINE / SMS / Email / APP sending,
- customer channel identity runtime,
- reverse binding runtime,
- verification runtime,
- token runtime,
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
- usage metering runtime,
- seat billing runtime,
- AI / RAG runtime,
- report/export/download runtime,
- API contract,
- Admin UI,
- backend service change,
- DB schema / migration proposal,
- smoke / test implementation.

Task300 does not add tables, migrations, schema, indexes, backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, smoke scripts, fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, customer self-service runtime, notification consent runtime, notification preference runtime, AI runtime, or inventory documentation changes.

## Why Consent / Preference Boundaries Are Needed After Task299

Task299 clarified reverse binding and verification boundaries. It established that reverse binding is not login, verification success is not customer self-service authorization, and binding verification is not notification consent.

The next risk is treating a verified channel identity as permission to send every future message type.

That would be unsafe because appointment reminders, survey invitations, quote notices, fee consent requests, complaint callback updates, customer-visible document notices, and marketing messages have different purpose, consent, preference, payload, audit, and usage requirements.

Task300 therefore separates:

- channel binding,
- identity verification,
- notification consent,
- notification preference,
- provider delivery,
- customer business response,
- audit / usage tracking.

None of these concepts are interchangeable.

## Definitions

### Notification Consent

Notification consent is a future record that the customer agreed to receive one or more notification categories through a scoped channel or purpose.

Consent must be traceable, revocable, scoped, and auditable.

### Notification Preference

Notification preference is the customer's future channel or category preference, such as whether they prefer LINE, SMS, Email, Web portal, App push, or manual callback for a category.

Preference does not override Data Access Control, customer-visible data policy, entitlement, permission, or legal consent requirements.

### Necessary Service Notification

Necessary service notification is a future message required to operate the service flow, such as appointment confirmation, reschedule notice, or completion notice.

Even necessary messages still require channel verification, customer-visible payload limits, safe deny, audit readiness, and provider safety.

### Optional Notification

Optional notification is a future message that improves customer experience but is not strictly required for the service flow.

Optional notifications may require explicit consent and preference checks.

### Marketing Notification

Marketing notification is a future promotional or commercial message.

Marketing notification must be treated separately from service notifications and must not be inferred from channel binding or service consent.

### Survey Notification

Survey notification is a future invitation to answer a post-completion survey.

Survey notification is not the same as the survey response, survey answer, complaint closure, or customer satisfaction result.

### Quote Notification

Quote notification is a future notice that a quote is available or needs customer review.

Quote notification is not quote approval.

### Customer Fee Consent Notification

Customer fee consent notification is a future notice asking the customer to review a fee consent request.

The notification itself is not the customer's fee consent.

### Appointment Notification

Appointment notification is a future appointment-related message, such as reminder, confirmation, reschedule notice, engineer arrival notice, or missed appointment follow-up.

It must use only customer-visible appointment information.

### Complaint / Callback Notification

Complaint / callback notification is a future customer-visible update about callback or complaint handling.

It must not expose internal notes, supervisor comments, risk flags, audit data, or AI raw payload.

### Consent Scope

Consent scope defines what category, channel, purpose, organization, and policy version the consent applies to.

Consent for one category or channel must not be generalized to all categories or channels.

### Consent Revocation

Consent revocation is a future customer action or policy event that disables a previously granted consent scope.

Revoked consent must be respected for all future notification categories that require that consent.

## Boundary Principles

- Channel binding is not notification consent.
- Verification success is not consent to all notifications.
- Provider delivery success is not customer consent.
- Necessary service notifications, optional notifications, and marketing notifications must be future separated.
- Survey notification is not survey consent response.
- Quote notification is not quote approval.
- Customer fee consent notification is not customer fee consent.
- Callback notification is not complaint closure.
- Notification preference cannot bypass Data Access Control.
- Notification preference cannot bypass customer-visible data policy.
- Notification preference cannot bypass organization isolation.
- Notification preference cannot bypass permission, entitlement, subscription, usage, audit, or provider safety checks.
- Notification consent must not imply permission to expose internal-only data.
- Notification preference must not imply permission to choose a provider that is not verified, entitled, or operationally allowed.
- AI must not decide consent state.
- AI must not decide notification preference.
- AI must not send notifications.
- AI must not convert a notification delivery result into a business approval, survey response, fee consent, quote approval, or complaint closure.

## Future-only Notification Consent Matrix

This matrix is future-only guidance. It does not approve runtime, schema, API, consent, preference, provider sending, notification, customer self-service, or Admin implementation.

| Notification type | Necessary or optional | Requires channel verification? | Requires consent? | Requires preference check? | Customer-visible data only? | May include internal-only data? | Requires audit readiness? | Requires usage tracking? | Provider sending allowed now? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Appointment reminder | Necessary service | Yes | Future policy decision | Yes | Yes | No | Yes | Yes | No | No |
| Appointment reschedule notice | Necessary service | Yes | Future policy decision | Yes | Yes | No | Yes | Yes | No | No |
| Engineer arrival notice | Necessary service | Yes | Future policy decision | Yes | Yes | No | Yes | Yes | No | No |
| Completion notice | Necessary service | Yes | Future policy decision | Yes | Yes | No | Yes | Yes | No | No |
| Survey invitation | Optional service quality | Yes | Yes | Yes | Yes | No | Yes | Yes | No | No |
| Quote notice | Necessary or optional by policy | Yes | Future policy decision | Yes | Yes | No | Yes | Yes | No | No |
| Customer fee consent request notice | Necessary or optional by policy | Yes | Future policy decision | Yes | Yes | No | Yes | Yes | No | No |
| Complaint / callback update | Necessary service or optional by policy | Yes | Future policy decision | Yes | Yes | No | Yes | Yes | No | No |
| Customer-visible document notice | Necessary or optional by policy | Yes | Future policy decision | Yes | Yes | No | Yes | Yes | No | No |
| Marketing / promotional notice | Optional marketing | Yes | Yes | Yes | Yes | No | Yes | Yes | No | No |
| Emergency / safety notice | Necessary safety | Future policy decision | Future policy decision | Future policy decision | Yes | No | Yes | Yes | No | No |

## Consent Lifecycle / Future-only

Future consent lifecycle may include:

1. Consent requested.
2. Consent granted.
3. Consent scoped by channel / purpose.
4. Consent updated.
5. Consent revoked.
6. Consent expired / stale.
7. Consent conflict requires human review.

Design principles:

- Consent request must be customer-visible and purpose-specific.
- Consent grant must be scoped to organization, channel, purpose, category, source, and policy version.
- Consent update must preserve audit trail.
- Consent revocation must be respected before future sends.
- Expired or stale consent must be treated as not valid for categories that require fresh consent.
- Conflicting consent signals must not be auto-resolved by AI.
- Human review may be needed when consent records, preferences, identity scope, or channel ownership conflict.
- Consent lifecycle is future design only and does not approve any runtime.

## Data Protection Rules

Notification payload must not contain:

- internal note,
- audit log,
- billing internal data,
- settlement internal data,
- supervisor note,
- AI raw payload,
- provider credentials,
- hidden risk flags,
- internal-only complaint notes,
- raw provider diagnostics,
- customer data beyond the minimum customer-visible content required by the notification purpose.

Logs, errors, audit summaries, usage records, and provider diagnostics must not expose:

- complete phone,
- complete email,
- token,
- secret,
- LINE access token,
- channel secret,
- raw LINE id,
- raw provider payload,
- verification code,
- binding token,
- hidden Case existence signal,
- hidden customer existence signal,
- hidden channel identity existence signal.

Preference UI, customer-visible response, provider callback response, and failure response must not leak hidden Case, customer, channel identity, organization, entitlement, usage, or provider readiness state.

## Safe Deny / Non-enumeration

The following categories must collapse to a generic external response:

- channel unavailable,
- channel not verified,
- verification failed,
- consent missing,
- consent revoked,
- consent expired,
- preference disabled,
- Case missing,
- customer missing,
- channel identity missing,
- organization mismatch,
- channel scope mismatch,
- feature not entitled,
- subscription inactive,
- usage exceeded,
- provider unavailable,
- provider delivery blocked,
- notification category not allowed,
- customer-visible policy denies the payload.

External response must not reveal the true reason.

Internal audit may record a masked category, such as `consent_missing`, `preference_disabled`, `scope_mismatch`, `feature_not_entitled`, or `usage_exceeded`, but it must not expose sensitive values.

Safe deny must apply equally to LINE, SMS, Email, Web portal, App, provider callback, customer self-service, and future notification APIs.

## Interaction With Existing And Future Objects

### Customer

Customer is the internal customer record. Notification consent and preference should reference internal customer identity through organization scope, not raw provider identity.

### Customer Channel Identity

Customer channel identity stores future scoped channel binding state. Binding does not equal consent, preference, login, notification entitlement, or provider delivery approval.

### Case

Case is the service context. Notification payload must expose only customer-visible Case state and must not leak internal notes, audit records, settlement state, or hidden risk markers.

### Appointment / Dispatch Visit

Appointment and dispatch visit may drive appointment reminders, reschedule notices, arrival notices, or missed visit updates. These notifications must not expose internal routing, engineer internal notes, or hidden dispatch rules.

### Field Service Report

Field Service Report may drive completion notice and future survey trigger context. Completion notice must not include internal report notes, AI raw payload, settlement internals, or hidden supervisor comments.

### Survey

Survey invitation is a notification category. It is not the survey answer, survey consent response, complaint state, or customer feedback result.

### Quote

Quote notice may tell the customer that a quote requires review. It is not quote approval and must not expose internal pricing rules unless explicitly customer-visible.

### Customer Fee Consent

Customer fee consent request notice may ask the customer to review a fee request. It is not the consent itself and must not be counted as approval.

### Complaint / Callback Future Records

Complaint or callback update may notify the customer of next steps. It must not expose internal complaint notes, risk classification, supervisor review, or AI summary unless explicitly customer-visible and approved by policy.

### Audit Log Future Layer

Notification consent, preference, safe deny, provider dispatch attempt, provider callback, and delivery result may require audit readiness.

Audit must be masked and organization-scoped.

### Usage Tracking Future Layer

Provider sending, notification generation, retry, delivery attempt, and customer-visible document notification may be usage-metered in future SaaS design.

Usage records must not contain full sensitive payloads.

## SaaS-ready / Security Principles

- Organization isolation remains mandatory.
- Channel identity scope remains `organization_id + channel/provider scope + provider user identity`.
- Data Access Control remains authoritative.
- Permission, entitlement, subscription, usage, consent, and preference are separate checks.
- A valid entitlement does not grant user permission.
- A valid permission does not grant consent.
- A valid consent does not grant internal-only data access.
- A valid provider channel does not grant customer-visible payload approval.
- Provider sending should support future usage tracking.
- Provider sending should support future audit readiness.
- Provider sending should support future throttling / suppression / retry policy.
- LINE, SMS, Email, Web portal, and App must stay channel-agnostic at the core design layer.
- Customer-visible payload policy must be shared across channels.
- ISO 27001-aligned supplier risk, access control, audit, incident response, and privacy principles apply to future notification providers.
- SaaS plan entitlement, seat billing, usage billing, AI Add-on, Enterprise SSO, and custom tenant policy may affect notification availability, but must not weaken security or privacy.

## Explicit Runtime Forbidden Confirmation

Task300 does not approve:

- notification consent runtime,
- notification preference runtime,
- provider sending runtime,
- LINE sending,
- SMS sending,
- Email sending,
- App push sending,
- Web portal customer notification runtime,
- customer channel identity runtime,
- verification runtime,
- reverse binding runtime,
- token runtime,
- login runtime,
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
- usage runtime,
- seat billing runtime,
- AI decision runtime,
- AI / RAG runtime,
- report/export/download runtime,
- smoke / fixture change,
- package change,
- inventory docs expansion.

## Future Questions

These questions should be answered before any notification consent / preference runtime is implemented:

- Which service notification categories require explicit consent versus operational notice policy?
- Which categories require preference checks even if consent is not required?
- How should consent be scoped across LINE, SMS, Email, Web portal, and App?
- How should customer preference conflicts be resolved?
- How should revocation affect necessary service notifications?
- What notification categories are allowed for customers without verified channels?
- What provider diagnostics can be stored internally without exposing sensitive values?
- How should usage metering count retries, failed sends, provider callbacks, and suppressed sends?
- How should tenant-specific notification policy interact with global safety rules?
- How should Enterprise SSO or customer portal login affect notification preference management?

## Conclusion

Task300 defines a docs-only notification consent / preference boundary.

The current approved state remains:

- no consent runtime,
- no preference runtime,
- no notification runtime,
- no provider sending,
- no customer self-service runtime,
- no API change,
- no Admin UI change,
- no DB change,
- no migration,
- no AI decision runtime.

Channel binding, reverse binding verification, notification consent, notification preference, provider delivery, and customer business response must remain separate concepts until a future task explicitly approves runtime design and implementation.
