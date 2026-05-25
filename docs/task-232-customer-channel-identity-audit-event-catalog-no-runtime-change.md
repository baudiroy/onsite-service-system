# Task 232 - Customer Channel Identity Audit Event Catalog / No Runtime Change

## Purpose and Scope

Task232 defines a documentation-only audit event catalog for future customer channel identity workflows.

It covers future audit families for customer channel identity lifecycle, verification, consent, opt-out, suppression, reverse LINE binding, provider callbacks, safe-deny, identity ambiguity, AI advisory, diagnostic access, export, redaction, and privacy events.

Task232 is not:

- audit runtime implementation,
- DB schema or migration proposal,
- API contract,
- Admin UI,
- customer portal,
- resolver implementation,
- LINE binding runtime,
- reverse binding runtime,
- provider sending,
- automated test,
- AI decision engine.

This document does not create audit tables, modify audit runtime, add API behavior, implement resolver, call LINE APIs, send messages, or add tests.

## Audit Principles

Future customer channel identity audit should record important operations, state changes, denials, security events, and human decisions without storing sensitive raw values.

Principles:

- audit log is internal-only,
- audit must not become customer-facing response,
- every audit event must be organization scoped,
- channel-specific audit events should preserve channel scope,
- audit should support safe correlation references,
- audit must not include raw token values or raw provider payload,
- audit should separate human action, system evaluation, provider diagnostic source, AI advisory source, and security / safe-deny event,
- audit should not replace official customer identity record,
- audit should not store large files, attachments, images, signatures, or raw payload.

Audit should help authorized internal users understand controlled identity operations without revealing sensitive provider or customer data.

## Audit Event Family Catalog

The following event names are placeholders for future design. They are not production event names, not database enum values, not API contract values, and not localization keys.

### A. Channel Identity Lifecycle Events

Future examples:

- `customer_channel_identity.created`
- `customer_channel_identity.updated`
- `customer_channel_identity.disabled`
- `customer_channel_identity.revoked`
- `customer_channel_identity.merged_review_created`
- `customer_channel_identity.ambiguity_detected`
- `customer_channel_identity.conflict_detected`

Purpose:

- record controlled lifecycle changes,
- record ambiguity and conflict requiring human review,
- preserve organization and channel scope context.

Boundaries:

- placeholder only,
- not production event name,
- no enum / schema / API added.

### B. Verification Events

Future examples:

- `customer_channel_identity.verification.requested`
- `customer_channel_identity.verification.succeeded`
- `customer_channel_identity.verification.failed`
- `customer_channel_identity.verification.expired`
- `customer_channel_identity.verification.retried`
- `customer_channel_identity.verification.blocked`
- `customer_channel_identity.verification.ambiguous`

Purpose:

- record verification attempts and outcomes,
- record blocked / ambiguous state without leaking sensitive proof details,
- support future review and security investigation.

### C. Consent / Opt-Out / Suppression Events

Future examples:

- `customer_channel_identity.consent.granted`
- `customer_channel_identity.consent.revoked`
- `customer_channel_identity.opt_out.applied`
- `customer_channel_identity.unsubscribe.applied`
- `customer_channel_identity.suppression.applied`
- `customer_channel_identity.suppression.lifted`
- `customer_channel_identity.suppression.conflict_detected`

Purpose:

- record consent and suppression changes,
- record provider or customer-driven opt-out,
- record conflicts requiring human review.

### D. Reverse LINE Binding Events

Future examples:

- `customer_channel_identity.reverse_line.invitation_created`
- `customer_channel_identity.reverse_line.token_generated`
- `customer_channel_identity.reverse_line.token_expired`
- `customer_channel_identity.reverse_line.token_reused`
- `customer_channel_identity.reverse_line.verification_attempted`
- `customer_channel_identity.reverse_line.verification_succeeded`
- `customer_channel_identity.reverse_line.verification_failed`
- `customer_channel_identity.reverse_line.scope_mismatch_detected`
- `customer_channel_identity.reverse_line.ambiguity_detected`
- `customer_channel_identity.reverse_line.completed`
- `customer_channel_identity.reverse_line.revoked`

Purpose:

- support future reverse LINE binding auditability,
- record token lifecycle categories without storing token values,
- record scope mismatch and ambiguity safely.

Boundaries:

- does not approve token runtime,
- does not add token generation / hashing / validation,
- does not call LINE API,
- does not send LINE message.

### E. Provider Callback / Provider Diagnostic Events

Future examples:

- `customer_channel_identity.provider_callback.received`
- `customer_channel_identity.provider_callback.ignored`
- `customer_channel_identity.provider_callback.scope_missing`
- `customer_channel_identity.provider_callback.identity_unknown`
- `customer_channel_identity.provider_callback.diagnostic_recorded`
- `customer_channel_identity.provider_callback.redacted`

Purpose:

- record provider callback handling category,
- record ignored callback reason categories,
- preserve internal diagnostics in redacted form.

Boundaries:

- do not record provider raw payload,
- do not record provider credential,
- provider callback must not decide official Case / Appointment / Field Service Report status.

### F. Safe-Deny / Enumeration Protection Events

Future examples:

- `customer_channel_identity.safe_deny.rendered`
- `customer_channel_identity.lookup.denied`
- `customer_channel_identity.scope_mismatch.denied`
- `customer_channel_identity.permission.denied`
- `customer_channel_identity.entitlement.denied`
- `customer_channel_identity.token_validation.denied`
- `customer_channel_identity.enumeration_risk.detected`

Purpose:

- record safe-deny handling,
- record denied lookup / permission / entitlement categories,
- record enumeration-risk decisions without leaking hidden resources.

### G. AI Advisory Events

Future examples:

- `customer_channel_identity.ai.identity_match_suggestion_generated`
- `customer_channel_identity.ai.ambiguity_suggestion_generated`
- `customer_channel_identity.ai.safe_deny_copy_reviewed`
- `customer_channel_identity.ai.suggestion_viewed`
- `customer_channel_identity.ai.suggestion_accepted_for_review`
- `customer_channel_identity.ai.suggestion_rejected`
- `customer_channel_identity.ai.low_confidence_ignored`

Purpose:

- record advisory activity and human review outcomes,
- preserve distinction between AI suggestion and official identity state.

Boundaries:

- AI suggestion is not official record,
- do not record AI raw payload,
- AI must not automatically bind, unbind, verify, suppress, or approve identity changes.

### H. Export / Privacy / Diagnostic Access Events

Future examples:

- `customer_channel_identity.audit.viewed`
- `customer_channel_identity.audit.export_requested`
- `customer_channel_identity.diagnostic.viewed`
- `customer_channel_identity.redaction.requested`
- `customer_channel_identity.redaction.applied`
- `customer_channel_identity.privacy.deletion_requested`

Purpose:

- record privileged audit and diagnostic access,
- record redaction / deletion request categories,
- support future privacy and compliance reviews.

Boundaries:

- Task232 does not implement export / redaction / deletion runtime,
- audit export requires future permission / entitlement / redaction design.

## Suggested Future Event Fields

The following conceptual fields may help future implementation design. They are not table columns, migration proposal, API response schema, or production enum values.

Conceptual fields:

- event family,
- event action,
- organization reference,
- channel provider category,
- channel scope reference,
- actor reference,
- actor role category,
- source type: human / system / provider / AI advisory,
- target reference type,
- target reference,
- customer channel identity reference,
- correlation reference,
- request reference,
- permission context category,
- entitlement context category,
- result category,
- safe reason category,
- redacted metadata category,
- occurred at.

Future implementation requires separate schema, migration, API, permission, entitlement, Admin, and test tasks.

## Forbidden Audit Content

Audit event must not include:

- complete mobile / phone / tel values,
- raw LINE user id,
- LINE access token,
- channel secret,
- token / secret / password,
- provider credential,
- raw provider payload,
- AI raw payload,
- DATABASE_URL,
- SQL error,
- DB constraint name,
- stack trace,
- production translation string,
- full customer free-text in diagnostic metadata unless future policy allows,
- internal diagnostic payload,
- attachment binary,
- photo / signature / document binary.

Use safe reason categories, masked summaries, internal references, and redacted metadata instead.

## Customer-Visible vs Internal Separation

Audit log is always internal-only.

Customers must not see:

- audit log,
- audit reason category,
- provider diagnostics,
- AI suggestion acceptance / rejection,
- permission / entitlement decision internals,
- identity match details,
- reverse binding diagnostic detail,
- safe-deny internal reason.

Customers should only see generic safe-deny / verification / unavailable / contact-support wording.

## Organization Isolation and Channel Scope

Audit events must be scoped to organization.

Principles:

- LINE-related events must preserve LINE channel scope,
- cross-organization audit view must not exist by default,
- admin permission must not bypass organization isolation,
- cross-channel identity linkage requires explicit future policy,
- cross-organization ambiguity must not leak through audit, diagnostic, or export,
- safe-deny / non-leakage applies to cross-org, unauthorized, hidden resource, ambiguous identity, deleted resource, and unavailable resource states.

## Permission / Entitlement Readiness

Task232 does not implement permission or entitlement runtime.

Future questions:

- Who can view customer channel identity audit trail?
- Who can view reverse LINE binding audit?
- Who can view provider callback ignored reason?
- Who can view AI identity suggestion audit?
- Who can export audit?
- Who can view redaction / deletion events?
- Which audit views require tenant admin?
- Which audit diagnostics are limited to security / support role?

Placeholder permissions:

- `customer_channel_identity.audit.view`
- `customer_channel_identity.audit.export`
- `customer_channel_identity.diagnostic.view`
- `customer_channel_identity.reverse_binding.audit.view`
- `customer_channel_identity.provider_diagnostic.view`
- `customer_channel_identity.ai_audit.view`

Placeholder feature keys:

- `customer_channel_identity_audit`
- `customer_channel_identity_audit_export`
- `customer_channel_identity_diagnostics`
- `customer_channel_reverse_binding_audit`
- `customer_channel_provider_diagnostics`
- `customer_channel_ai_audit`

These are not production permissions or production feature keys.

Task232 does not add permission runtime, entitlement runtime, usage metering, billing, subscription, or plan pricing.

## AI Advisory-Only Boundary

AI may:

- summarize audit trail for authorized internal roles,
- identify audit coverage gaps,
- organize provider callback ignored categories,
- remind operators about enumeration risk,
- check audit metadata for possible sensitive data.

AI must not:

- automatically create, modify, or delete audit event,
- automatically hide audit event,
- verify customer channel identity,
- bind or reverse-bind LINE,
- lift opt-out / suppression,
- send verification message,
- modify Case / Appointment / Field Service Report,
- approve quote / settlement / refund / compensation,
- create or close complaint,
- bypass permission / organization scope / entitlement,
- write uncertain content into official audit record.

## Relationship to Existing Branches

Task232:

- extends Task228 Generic Customer Channel Identities Proposal,
- extends Task229 Verification and Consent Policy,
- extends Task230 Reverse LINE Binding Security Design,
- extends Task231 Safe-Deny and Enumeration Review,
- aligns with Survey audit patterns from Task221,
- aligns with SLA / Operations Risk audit and non-leakage patterns,
- supports future Notification Delivery Readiness.

Task232 does not:

- reopen Survey branch,
- modify SLA / Operations Risk branch,
- modify inventory docs,
- touch Migration020.

## Explicit Non-Goals

Task232 does not:

- create audit table,
- modify audit table,
- create customer channel identity table,
- create reverse binding token table,
- add migration,
- modify schema,
- add indexes,
- add audit runtime,
- add resolver,
- add API,
- modify backend service / repository / controller,
- modify Admin UI,
- add customer portal,
- add LINE provider integration,
- send LINE / APP / SMS / email,
- add notification runtime,
- add survey runtime,
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

Task232 is audit catalog documentation only.

Future implementation requires separate PM / user approval for:

- audit schema,
- audit runtime,
- API / Admin surfaces,
- provider callback handling,
- reverse binding runtime,
- identity resolver,
- permission / entitlement enforcement,
- audit export / privacy workflow,
- tests and smoke coverage.

General continuation language does not approve these steps.

## Verification Checklist

Task232 completion should verify:

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
- no LINE binding runtime,
- no token generation / hashing / validation,
- no customer portal,
- no AI identity runtime,
- no AI auto-decision,
- no smoke / automated tests / fixtures / QA scripts touched,
- no localization files touched,
- no message template files touched,
- no package.json change,
- no inventory docs change,
- sensitive / internal diagnostic scan contains no actual sensitive values.
