# Task 228 - Generic Customer Channel Identities Proposal / No Migration

## Purpose and Scope

Task228 defines a documentation-only proposal for future generic customer channel identities.

The goal is to keep customer identity, contact points, channel identity, provider-scoped identifiers, verification, consent, opt-out, and suppression channel-agnostic, so core Case, Survey, Notification, Billing, and AI workflows do not become hard-coded to LINE.

Task228 is not:

- migration proposal,
- schema implementation,
- resolver implementation,
- LINE binding runtime,
- provider sending implementation,
- API contract,
- Admin UI,
- customer portal,
- notification runtime,
- survey runtime,
- AI decision engine.

This document does not add tables, columns, API behavior, provider adapters, channel resolver, reverse binding runtime, or provider sending.

## Core Identity Principles

Customer identity must not equal a single channel identity.

Principles:

- customer profile is the platform-level identity concept,
- channel identity is a provider/channel-specific way to reach or recognize a customer,
- channel identity must not equal raw provider identifier,
- LINE is one channel provider, not the core customer identity,
- `line_user_id` must not be treated as a global identity,
- LINE identity must be scoped by organization_id + line_channel_id + line_user_id,
- SMS / Email / App / Web Portal identities also need scope, verification, consent, and suppression policy,
- Case / Appointment / Field Service Report must not store provider-specific raw identifiers as core identity,
- provider callback must not decide official Case / Appointment / Field Service Report state,
- future delivery channel selection must be resolved through a controlled channel abstraction.

## Conceptual Model Boundary

The following conceptual terms are design language only.

Conceptual terms:

- customer profile reference,
- customer contact point,
- customer channel identity,
- channel provider,
- provider channel reference,
- provider scoped identifier reference,
- verification status,
- consent status,
- opt-out / unsubscribe status,
- suppression state,
- preferred channel,
- fallback channel,
- identity binding request,
- reverse binding token reference,
- channel identity audit reference.

These are not:

- table names,
- migration proposal,
- production column names,
- API schema,
- generated client contract,
- provider adapter contract.

Future implementation requires a separate migration, API, permission, security, Admin, and test task.

## Channel Examples and Required Boundaries

### LINE

Requirements:

- scope by organization + LINE channel + LINE user,
- do not expose raw LINE user id,
- do not log LINE access token or channel secret,
- do not include LINE access token or channel secret in API response, docs example, QA artifact, or handoff,
- support multiple organizations,
- support multiple LINE channels,
- support future multi-brand / multi-provider service scenarios.

LINE must not become the only customer entry point or the only survey / notification delivery path.

### SMS

Requirements:

- do not expose complete mobile / phone / tel values by default,
- support opt-out / unsubscribe,
- do not reveal whether mobile is correct through error messages,
- do not expose SMS provider credential,
- treat provider delivery diagnostics as internal-only.

### Email

Requirements:

- do not expose complete email by default unless future policy allows masked display,
- support unsubscribe, bounce, and verification policy,
- do not expose email provider raw payload,
- do not use email address alone as global customer identity.

### Web Link

Requirements:

- do not use guessable Case ids as access credential,
- future token must be hashed / expiring / one-time or policy-bound,
- token verification failure must not reveal whether Case exists,
- token must not appear in logs, filenames, audit metadata, or user-facing support output.

### Web Portal / App

Requirements:

- must rely on authenticated customer session and organization scope,
- must not leak cross-organization resources because of login state,
- APP push token must not be treated as customer identity,
- device token / push token should be treated as delivery credential, not identity source of truth.

## Existing Case Reverse Binding Readiness

Task228 supports future existing Case reverse LINE binding direction but does not implement it.

Future principles:

- token expires,
- token is one-time-use or governed by explicit retry policy,
- token should be stored hashed,
- failed verification must not reveal whether Case exists,
- failed verification must not reveal whether mobile is correct,
- failed verification must not reveal whether LINE is already bound,
- success, failure, expiration, and reuse require audit,
- logs, errors, and responses must not expose complete mobile, token, secret, LINE access token, or channel secret.

Task228 does not add token, API, DB, LINE runtime, web form, resolver, or provider sending.

## Verification / Consent / Suppression Readiness

Future policy questions:

- When is a channel identity verified?
- When can a contact point be used for notification?
- How is opt-in recorded?
- How are opt-out and unsubscribe respected?
- Is suppression cross-channel or channel-specific?
- How does fallback channel avoid repeated customer harassment?
- How are customer deletion / correction requests handled?
- How are channel identity conflicts reviewed?
- How are duplicate customer identities merged or preserved?
- How are channel identities handled when an organization terminates service?

No runtime behavior is implemented in Task228.

## Customer-Visible vs Internal-Only Data Separation

### Customer-Visible May Include

- general verification success / failure prompt,
- safe contact method confirmation prompt,
- opt-out / unsubscribe success prompt,
- customer-managed contact method if future portal exists.

### Customer-Visible Must Not Include

- raw LINE user id,
- complete mobile / phone / tel,
- token / secret,
- provider diagnostics,
- provider raw payload,
- audit log,
- internal identity match score,
- organization / tenant diagnostics,
- AI raw payload,
- internal duplicate identity suspicion.

### Internal-Only May Include

- verification status,
- consent status,
- suppression reason,
- channel scope reference,
- provider readiness,
- audit trail,
- identity ambiguity review,
- AI advisory suggestion.

Internal-only data still requires permission, organization scope, and redaction.

## Safe-Deny and Non-Leakage

Fail closed:

- if organization scope is unclear, do not bind,
- if channel scope is unclear, do not bind,
- if provider identifier is ambiguous, do not bind,
- if customer match is ambiguous, do not bind,
- if token is invalid / expired / reused, use generic failure,
- if phone mismatch occurs, use generic failure,
- if LINE already bound, use generic failure unless authenticated and authorized future context permits detail,
- if Case not found, use generic failure,
- if permission or entitlement is unknown, use generic failure,
- if AI-only confidence is insufficient, do not bind.

Do not reveal:

- whether Case exists,
- whether mobile is correct,
- whether LINE is already bound,
- whether customer exists,
- whether provider successfully found identity,
- whether organization has a specific channel entitlement.

Safe-deny copy should be generic and customer-safe.

## Permission / Entitlement Readiness

Task228 does not implement permission or entitlement runtime.

Future questions:

- Who can view customer channel identities?
- Who can add / remove / disable channel identity?
- Who can initiate reverse binding?
- Who can view verification status?
- Who can view suppression reason?
- Who can override channel conflict?
- Who can view identity audit trail?
- Which channels require organization entitlement?
- Which providers generate usage metering?

Placeholder permissions:

- `customer_channel_identity.view`
- `customer_channel_identity.manage`
- `customer_channel_identity.verify`
- `customer_channel_identity.suppress`
- `customer_channel_identity.audit.view`
- `customer_channel_identity.reverse_binding.request`
- `customer_channel_identity.reverse_binding.review`

Placeholder feature keys:

- `customer_channel_identity_core`
- `customer_channel_line`
- `customer_channel_sms`
- `customer_channel_email`
- `customer_channel_app`
- `customer_channel_web_portal`
- `customer_channel_reverse_binding`
- `customer_channel_identity_audit`

These are not production permissions or production feature keys.

Task228 does not add permission runtime, entitlement runtime, usage metering, billing, subscription, or plan pricing.

## Audit Readiness

Future audit events may include:

- channel identity created,
- channel identity verified,
- channel identity verification failed,
- channel identity disabled,
- channel identity suppressed,
- channel identity opt-out applied,
- reverse binding requested,
- reverse binding succeeded,
- reverse binding failed,
- reverse binding expired,
- reverse binding reused,
- ambiguous identity detected,
- channel identity conflict review created,
- provider callback received,
- provider callback ignored,
- AI identity suggestion generated,
- AI identity suggestion rejected.

Audit redaction:

- do not record complete mobile / phone / tel values,
- do not record raw LINE user id,
- do not record token / secret,
- do not record provider credential,
- do not record raw provider payload,
- do not record AI raw payload,
- do not expose audit to customer-visible surfaces.

## AI Advisory-Only Boundary

AI may:

- flag possible duplicate identity,
- summarize channel conflict for authorized internal roles,
- suggest identity ambiguity requiring human review,
- check safe-deny copy for leakage,
- organize provider failure category for authorized internal review.

AI must not:

- automatically bind customer identity,
- automatically reverse-bind LINE,
- automatically unbind,
- automatically overwrite verified contact,
- bypass opt-out / suppression,
- send verification message,
- modify Case / Appointment / Field Service Report,
- approve quote / settlement / refund / compensation,
- close complaint,
- bypass permission / organization scope / entitlement,
- write uncertain content into official record.

## Relationship to Existing Branches

Task228 supports:

- LINE not hard-coded principle,
- Survey Delivery Channel Abstraction from Task218,
- Survey safe messaging / token safety from Task225,
- future Notification Delivery Readiness,
- future APP / Customer Channel Identity branch,
- future reverse LINE binding design.

Task228 does not:

- modify Survey branch docs,
- reopen Survey Runtime Readiness branch,
- modify SLA / Operations Risk branch,
- touch inventory docs,
- touch Migration020.

## Explicit Non-Goals

Task228 does not:

- create customer channel identity table,
- create contact point table,
- create LINE binding table,
- create reverse binding token table,
- add migration,
- modify schema,
- add indexes,
- add resolver,
- add API,
- modify backend service / repository / controller,
- modify Admin UI,
- add customer portal,
- add provider integration,
- send LINE / APP / SMS / email,
- add notification runtime,
- add survey runtime,
- add audit runtime,
- add permission / entitlement runtime,
- add feature flag / usage metering runtime,
- add AI identity runtime,
- add automated test / fixture / smoke,
- add localization file,
- add message template file,
- modify package.json,
- modify inventory docs,
- touch Migration020,
- execute DB / psql / db:migrate / DDL / cleanup,
- touch shared Zeabur runtime.

## Future Implementation Approval Boundary

This proposal is documentation only.

Future implementation requires separate PM / user approval for:

- schema and migration,
- customer channel identity resolver,
- reverse binding runtime,
- provider adapter,
- token / link safety,
- API contract,
- Admin UI,
- customer portal,
- permission and entitlement enforcement,
- audit runtime,
- tests and smoke coverage,
- provider sending.

General continuation language does not approve these steps.

## Verification Checklist

Task228 completion should verify:

- docs-only change,
- no backend source touched,
- no Admin source touched,
- no API touched,
- no migration / schema / index touched,
- no DB / DDL / psql / db:migrate executed,
- no Migration020 dry-run / apply,
- no shared Zeabur runtime touched,
- no provider sending,
- no LINE / APP / SMS / email sending,
- no survey runtime,
- no notification runtime,
- no audit runtime,
- no permission runtime,
- no entitlement runtime,
- no feature flag runtime,
- no usage metering runtime,
- no resolver,
- no reverse binding runtime,
- no customer portal,
- no AI identity runtime,
- no AI auto-decision,
- no smoke / automated tests / fixtures / QA scripts touched,
- no localization files touched,
- no message template files touched,
- no package.json change,
- no inventory docs change,
- sensitive / internal diagnostic scan contains no actual sensitive values.
