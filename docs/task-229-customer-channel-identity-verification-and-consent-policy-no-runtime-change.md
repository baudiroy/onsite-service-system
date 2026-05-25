# Task 229 - Customer Channel Identity Verification and Consent Policy / No Runtime Change

## Purpose and Scope

Task229 extends the generic customer channel identity proposal with a documentation-only verification and consent policy.

It defines future safety boundaries for customer contact points and channel identities across verification, consent, opt-in, opt-out, unsubscribe, suppression, fallback channels, and identity ambiguity.

Task229 is not:

- migration proposal,
- schema implementation,
- resolver implementation,
- LINE binding runtime,
- reverse binding runtime,
- provider sending implementation,
- notification runtime,
- survey runtime,
- API contract,
- Admin UI,
- customer portal,
- automated test,
- AI decision engine.

This document does not add tables, consent runtime, suppression runtime, reverse binding runtime, provider adapters, API behavior, or Admin UI.

## Core Verification Principles

A customer channel identity is not usable merely because it exists.

Principles:

- provider identifier is not automatically a verified customer identity,
- verification must be organization-scoped,
- verification must be channel-scoped,
- verification must have an auditable basis,
- verification must not rely only on AI inference,
- verification must not rely only on free-text note matching,
- verification failure must not leak whether customer / Case / phone / LINE binding exists,
- verification status must remain separate from Case / Appointment / Field Service Report official status,
- `line_user_id` must not be treated as global identity,
- LINE identity must be scoped by organization_id + line_channel_id + line_user_id,
- App push token, SMS number, email address, and web token must not directly equal customer identity.

Verification should become a controlled future workflow, not an implicit side effect of provider callback, frontend input, or AI suggestion.

## Conceptual Verification States

The following states are placeholders only:

- `unverified`
- `verification_pending`
- `verified`
- `verification_failed`
- `ambiguous`
- `revoked`
- `expired`
- `suppressed`

These are not:

- production status enum,
- database values,
- API fields,
- Admin UI states,
- runtime behavior.

Future implementation requires separate schema, migration, API, Admin, permission, and security review tasks.

## Consent / Opt-In / Opt-Out / Suppression Principles

Consent is not the same as verification.

Principles:

- verified channel identity may still be unavailable for sending,
- opt-out / unsubscribe must be respected before notification or survey delivery,
- suppression can be channel-specific or cross-channel according to future policy,
- consent status must be organization-scoped where applicable,
- provider-level unsubscribe must not be ignored,
- manual resend must not bypass opt-out / suppression,
- AI suggestion must not bypass consent or suppression,
- consent changes should be auditable,
- consent / opt-out / suppression must not modify Case / Appointment / Field Service Report status,
- opt-out must not be treated as customer complaint by default.

Future policy must distinguish service-critical communication, marketing-like communication, survey delivery, and support follow-up.

## Channel-Specific Readiness Boundaries

### LINE

Requirements:

- scoped by organization + LINE channel + LINE user,
- follow / friendship / message interaction does not automatically equal consent for all message types,
- binding or reverse binding requires explicit safe workflow,
- raw LINE user id must not be exposed,
- LINE access token and channel secret must not be logged or returned.

### SMS

Requirements:

- possession / verification of phone number must be defined before use,
- complete mobile must be masked or excluded in customer-visible / Admin surfaces unless future policy allows,
- SMS opt-out must be respected,
- provider credential and raw provider payload must not be exposed.

### Email

Requirements:

- email verification and bounce handling are separate readiness concerns,
- email unsubscribe must be respected,
- complete email display should be masked unless future permissioned display allows,
- email address alone must not become global customer identity.

### Web Link

Requirements:

- link token is not customer identity,
- token must be expiring and safe,
- token validation failure must not leak resource existence,
- token must not appear in logs, filenames, audit metadata, or handoff output.

### Web Portal / App

Requirements:

- authenticated customer session is not automatically cross-organization visibility,
- App push token is not customer identity,
- device-level consent and account-level identity must remain distinct,
- push permission does not equal survey consent by default.

## Identity Ambiguity Handling

Do not automatically treat identity as verified when:

- same phone appears on multiple customer profiles,
- same LINE identity appears under unexpected channel / organization context,
- customer record merge is uncertain,
- Case contact differs from channel identity,
- provider callback lacks organization scope,
- token validation is incomplete,
- opt-in source is unclear,
- unsubscribe / suppression status conflicts,
- AI suggests a match but evidence is incomplete.

When identity is ambiguous:

- do not send,
- do not bind,
- do not update official identity,
- do not modify Case / Appointment / Field Service Report,
- do not display information that leaks state,
- prepare for future human review and audit readiness.

Ambiguity should fail closed.

## Customer-Visible vs Internal-Only Messaging

### Customer-Visible May Include

- general verification success prompt,
- general verification failure prompt,
- general opt-out / unsubscribe success prompt,
- general link unavailable prompt,
- safe customer service contact prompt.

### Customer-Visible Must Not Include

- "此案件不存在",
- "手機號碼錯誤",
- "LINE 尚未綁定",
- "LINE 已被其他帳號綁定",
- raw LINE user id,
- complete mobile / phone / tel,
- token / secret,
- provider diagnostics,
- internal matching reason,
- audit log,
- AI confidence / explanation.

### Internal-Only May Include

- verification method category,
- verification status,
- consent source category,
- suppression reason,
- identity ambiguity reason,
- audit trail,
- provider readiness,
- AI advisory suggestion.

Internal-only data still requires permission, organization scope, redaction, and audit where appropriate.

## Safe-Deny and Non-Leakage Policy

Use generic safe behavior:

- invalid token -> generic unavailable,
- expired token -> generic unavailable or generic expired only if safe context allows,
- phone mismatch -> generic verification failed,
- existing binding -> generic verification failed unless authenticated authorized surface permits more detail,
- organization mismatch -> generic unavailable,
- channel mismatch -> generic unavailable,
- permission missing -> generic unavailable,
- entitlement missing -> generic unavailable for customer-facing surfaces,
- provider failure -> generic temporarily unavailable.

Do not leak:

- whether customer exists,
- whether Case exists,
- whether mobile is correct,
- whether LINE is bound,
- whether provider found identity,
- whether survey / notification exists,
- whether organization has a specific channel feature.

## Audit Readiness

Future audit events may include:

- channel identity verification requested,
- channel identity verification succeeded,
- channel identity verification failed,
- channel identity verification expired,
- channel identity ambiguity detected,
- consent granted,
- consent revoked,
- opt-out applied,
- unsubscribe applied,
- suppression applied,
- suppression lifted,
- reverse binding verification attempted,
- reverse binding verification failed,
- reverse binding verification succeeded,
- provider unsubscribe received,
- provider callback ignored,
- AI identity match suggestion generated,
- AI identity match suggestion rejected.

Audit redaction:

- do not record complete mobile / phone / tel values,
- do not record raw LINE user id,
- do not record token / secret,
- do not record provider credential,
- do not record raw provider payload,
- do not record AI raw payload,
- do not expose audit to customer-visible surfaces.

## Permission / Entitlement Readiness

Task229 does not implement permission or entitlement runtime.

Future questions:

- Who can view verification status?
- Who can manually mark verified / revoked?
- Who can view ambiguity reason?
- Who can lift suppression?
- Who can re-initiate verification?
- Who can view opt-out / unsubscribe status?
- Who can view channel identity audit trail?
- Which channel verification features require organization entitlement?
- Which provider operations require usage metering?

Placeholder permissions:

- `customer_channel_identity.verification.view`
- `customer_channel_identity.verification.review`
- `customer_channel_identity.consent.view`
- `customer_channel_identity.consent.manage`
- `customer_channel_identity.suppression.view`
- `customer_channel_identity.suppression.manage`
- `customer_channel_identity.audit.view`

Placeholder feature keys:

- `customer_channel_verification`
- `customer_channel_consent_management`
- `customer_channel_suppression`
- `customer_channel_line_verification`
- `customer_channel_sms_verification`
- `customer_channel_email_verification`
- `customer_channel_app_verification`

These are not production permissions or production feature keys.

Task229 does not add permission runtime, entitlement runtime, feature flag runtime, usage metering, billing, subscription, or plan pricing.

## AI Advisory-Only Boundary

AI may:

- flag possible identity ambiguity,
- summarize verification failure category for authorized users,
- check safe-deny copy for leakage,
- suggest human review priority,
- organize consent policy checklist.

AI must not:

- automatically verify customer identity,
- mark channel identity as verified,
- bind or reverse-bind LINE,
- lift opt-out / suppression,
- send verification message,
- modify Case / Appointment / Field Service Report,
- approve quote / settlement / refund / compensation,
- create or close complaint,
- bypass permission / organization scope / entitlement,
- write uncertain inference into official record.

AI suggestion must stay separate from official identity state.

## Relationship to Other Branches

Task229:

- extends Task228 Generic Customer Channel Identities Proposal,
- supports Survey Delivery Channel Abstraction from Task218,
- supports Survey Idempotency / Manual Resend opt-out boundaries from Task222,
- supports Survey Safe Messaging from Task225,
- supports future Notification Delivery Readiness Planning,
- supports future Reverse LINE Binding Security Design.

Task229 does not:

- reopen Survey branch,
- modify SLA / Operations Risk branch,
- modify inventory docs,
- touch Migration020.

## Explicit Non-Goals

Task229 does not:

- create customer channel identity table,
- create consent table,
- create suppression table,
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

Task229 is policy design only.

Future implementation requires separate PM / user approval for:

- schema and migration,
- verification runtime,
- consent runtime,
- suppression runtime,
- reverse binding runtime,
- provider adapter,
- API contract,
- Admin UI,
- customer portal,
- permission and entitlement enforcement,
- audit runtime,
- tests and smoke coverage.

General continuation language does not approve these steps.

## Verification Checklist

Task229 completion should verify:

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
- no consent runtime,
- no suppression runtime,
- no customer portal,
- no AI identity runtime,
- no AI auto-decision,
- no smoke / automated tests / fixtures / QA scripts touched,
- no localization files touched,
- no message template files touched,
- no package.json change,
- no inventory docs change,
- sensitive / internal diagnostic scan contains no actual sensitive values.
