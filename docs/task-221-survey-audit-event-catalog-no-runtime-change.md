# Task 221 - Survey Audit Event Catalog / No Runtime Change

## Purpose and Scope

Task221 defines a documentation-only audit event catalog for future post-completion customer satisfaction survey workflows.

The catalog covers future audit families for survey eligibility, delivery, channel identity, consent, response handling, low-rating review, complaint follow-up, manual resend, retry, AI advisory, export, retention, and privacy events.

Task221 is not:

- audit runtime implementation,
- survey runtime implementation,
- provider sending implementation,
- DB schema or migration proposal,
- API contract,
- Admin UI,
- customer portal,
- automated test,
- AI decision engine.

This document does not create audit tables, modify audit runtime, add API behavior, update backend / Admin code, add migration, add tests, implement survey runtime, or authorize provider sending.

## Audit Principles

Future survey audit should record important actions, decisions, evaluations, and state-transition attempts without storing sensitive raw values.

Principles:

- audit log is internal-only,
- audit log must not become customer-visible output,
- every audit event must be organization scoped,
- audit should support actor / system / AI advisory source attribution,
- audit should support safe correlation references,
- audit must not include token values, provider credentials, raw provider payloads, or AI raw payloads,
- audit should separate official action, human decision, system evaluation, AI suggestion, and provider diagnostic reference,
- audit does not replace official workflow records,
- audit does not replace survey response records,
- audit does not replace complaint or follow-up records,
- audit must not store large files, photos, signatures, attachments, or raw payloads.

Audit records should help authorized internal users answer: who did what, when, for which organization, through which controlled flow, and with which safe reason category.

## Audit Event Family Catalog

The following event names are placeholders for future design discussion. They are not production enums, not database values, not API contract values, and not localization keys.

Future implementation must define canonical event names in a separate schema / migration / API / permission task.

### A. Survey Eligibility Events

Possible future events:

- `survey.eligibility.evaluated`
- `survey.eligibility.created`
- `survey.eligibility.skipped`
- `survey.eligibility.blocked`
- `survey.eligibility.ambiguity_detected`
- `survey.eligibility.duplicate_suppressed`
- `survey.eligibility.final_appointment_mismatch_detected`
- `survey.eligibility.open_appointment_conflict_detected`

Purpose:

- record first-completion survey eligibility evaluation,
- record safe skip / block reason categories,
- record ambiguity requiring human or system review,
- record duplicate suppression without creating duplicate survey actions.

Boundaries:

- does not create survey intent runtime,
- does not create event outbox runtime,
- does not alter Case / Appointment / Field Service Report,
- does not authorize sending.

### B. Survey Delivery Events

Possible future events:

- `survey.delivery.channel_evaluated`
- `survey.delivery.channel_selected`
- `survey.delivery.channel_blocked`
- `survey.delivery.scheduled`
- `survey.delivery.skipped`
- `survey.delivery.attempted`
- `survey.delivery.succeeded`
- `survey.delivery.failed`
- `survey.delivery.suppressed`
- `survey.delivery.provider_readiness_unavailable`

Purpose:

- record delivery readiness decisions,
- record selected safe channel category,
- record skipped / blocked / suppressed delivery reason,
- record provider diagnostic reference without storing provider raw payload.

Boundaries:

- does not authorize provider sending,
- does not create outbox / worker,
- does not call LINE / APP / SMS / email providers,
- does not define delivery retries.

### C. Channel Identity and Consent Events

Possible future events:

- `survey.channel_identity.missing`
- `survey.channel_identity.ambiguous`
- `survey.channel_identity.scope_mismatch_detected`
- `survey.channel_identity.verified_reference_used`
- `survey.consent.opt_out_respected`
- `survey.consent.unsubscribe_respected`
- `survey.consent.suppression_applied`

Purpose:

- record channel identity readiness without leaking raw identity values,
- record organization / channel scope mismatch categories,
- record consent and suppression decisions.

Boundaries:

- must not record raw LINE user id,
- must not record complete mobile / phone / tel values,
- must not reveal whether LINE binding exists to unauthorized users,
- must not expose token values or provider credentials.

### D. Survey Response Events

Possible future events:

- `survey.response.submitted`
- `survey.response.viewed`
- `survey.response.classified`
- `survey.response.redacted`
- `survey.response.deletion_requested`
- `survey.response.export_requested`
- `survey.response.customer_visible_rendered`

Purpose:

- record important internal access and processing actions for survey responses,
- record safe response classification category,
- record redaction / export / deletion request categories.

Boundaries:

- survey response must not be written into Field Service Report internal note,
- audit does not replace the survey response record,
- customer-visible response must not display audit log,
- response free text should not be duplicated into audit metadata unless explicitly safe and necessary.

### E. Low-Rating / Complaint Follow-Up Events

Possible future events:

- `survey.review.low_rating_created`
- `survey.review.complaint_risk_flagged`
- `survey.review.follow_up_created`
- `survey.review.reviewer_assigned`
- `survey.review.customer_callback_recorded`
- `survey.review.unable_to_reach_customer_recorded`
- `survey.review.supervisor_escalation_created`
- `survey.review.formal_complaint_created`
- `survey.review.dismissed_not_complaint`
- `survey.review.follow_up_completed`
- `survey.review.reopened`

Purpose:

- record human review and service recovery actions,
- record transition from low-rating review to formal complaint only after human-confirmed action,
- record follow-up progress without changing core completion records.

Boundaries:

- low rating is not automatically a formal complaint,
- formal complaint creation requires human confirmation, permission, and audit,
- audit event must not automatically modify Case / Appointment / Field Service Report,
- AI suggestion must not create or close complaint / follow-up workflow.

### F. Manual Resend / Retry Events

Possible future events:

- `survey.resend.requested`
- `survey.resend.approved`
- `survey.resend.rejected`
- `survey.resend.executed`
- `survey.resend.blocked_by_suppression`
- `survey.resend.blocked_by_duplicate_policy`
- `survey.retry.requested`
- `survey.retry.skipped`
- `survey.retry.failed`

Purpose:

- record controlled manual resend request and decision paths,
- record retry attempts without permitting repeated customer harassment,
- record duplicate and suppression safeguards.

Boundaries:

- Task221 does not approve manual resend runtime,
- manual resend must require permission, organization scope, and audit,
- retry must not bypass consent / suppression policy,
- retry must not create duplicate survey intent or provider send without future approved policy.

### G. AI Advisory Events

Possible future events:

- `survey.ai.summary_generated`
- `survey.ai.risk_suggestion_generated`
- `survey.ai.follow_up_suggestion_generated`
- `survey.ai.suggestion_viewed`
- `survey.ai.suggestion_accepted_for_review`
- `survey.ai.suggestion_rejected`
- `survey.ai.low_confidence_ignored`

Purpose:

- record that AI advisory output was generated, viewed, accepted for human review, rejected, or ignored,
- preserve human decision trail when AI assists triage or summary.

Boundaries:

- do not record AI raw payload,
- AI suggestion is not an official record,
- AI must not automatically create a formal complaint,
- AI must not automatically close complaint / follow-up,
- AI must not automatically modify Case / Appointment / Field Service Report,
- AI must not automatically approve refund, compensation, quote, settlement, or billing changes.

### H. Export / Retention / Privacy Events

Possible future events:

- `survey.export.requested`
- `survey.export.completed`
- `survey.export.blocked`
- `survey.retention.policy_applied`
- `survey.retention.deletion_requested`
- `survey.privacy.redaction_applied`
- `survey.privacy.access_denied`

Purpose:

- record privileged export and privacy actions,
- record retention / deletion request categories,
- record redaction and access-denied outcomes.

Boundaries:

- export requires permission, entitlement, and organization scope,
- export must not include unmasked sensitive data by default,
- Task221 does not implement export / retention / privacy runtime,
- retention and deletion behavior require future policy and implementation approval.

## Suggested Future Event Fields

The following conceptual fields may help future implementation design. They are not table columns, not migration proposal, not API response schema, and not production enum values.

Conceptual fields:

- event family,
- event action,
- organization reference,
- actor reference,
- actor role category,
- source type: human / system / AI advisory / provider diagnostic,
- target reference type,
- target reference,
- correlation reference,
- request reference,
- permission context category,
- entitlement context category,
- result category,
- safe reason code,
- redacted metadata,
- occurred at.

Future implementation requires separate schema, migration, API, permission, entitlement, Admin, and test tasks.

## Forbidden Audit Content

Future survey audit events must not include:

- complete mobile / phone / tel values,
- raw LINE user id,
- LINE access token,
- channel secret,
- token / secret / password values,
- provider credential,
- raw provider payload,
- AI raw payload,
- DATABASE_URL value,
- SQL error detail,
- DB constraint name,
- stack trace,
- production translation string,
- customer full private content in metadata when not necessary,
- internal diagnostic payload,
- attachment binary,
- photo binary,
- signature binary,
- document binary.

When a value is needed for correlation, use safe internal references, masked summaries, reason codes, or deterministic internal identifiers approved by future schema design.

## Customer-Visible vs Internal Separation

Audit log is always internal-only.

Customer-visible surfaces must not show:

- audit log,
- audit reason code,
- provider diagnostics,
- AI suggestion acceptance / rejection,
- permission decision internals,
- entitlement decision internals,
- reviewer assignment internals,
- complaint risk label,
- supervisor note,
- internal follow-up note.

Customer-visible surfaces should use safe general text, such as:

- response received,
- link expired,
- request cannot be processed,
- please contact customer service,
- feedback has been received.

Customer-visible copy must not reveal whether a case exists, whether mobile verification matched, whether LINE binding exists, whether a survey exists, or why an internal permission / entitlement check failed.

## Organization Isolation and Non-Leakage

Survey audit events must be scoped to organization.

Principles:

- cross-organization audit view must not exist by default,
- admin permission must not bypass organization isolation,
- audit lookup must safe-deny cross-organization access,
- hidden resource, deleted resource, ambiguous identity, or missing permission should avoid resource enumeration,
- error messages must not leak case existence, customer identity correctness, LINE binding existence, or survey existence,
- channel identity ambiguity must not be exposed through audit responses or customer-visible errors.

Future implementation should treat organization scope as a required audit dimension, not optional metadata.

## Permission / Entitlement Readiness

Task221 does not implement permission or entitlement runtime.

Future design questions:

- Who can view survey audit trail?
- Who can view delivery audit?
- Who can view AI suggestion audit?
- Who can view complaint follow-up audit?
- Who can export audit data?
- Who can view redaction events?
- Which audit views require tenant admin permission?
- Which audit exports require higher entitlement?

Placeholder feature keys:

- `survey_audit_view`
- `survey_delivery_audit_view`
- `survey_ai_audit_view`
- `survey_complaint_audit_view`
- `survey_audit_export`
- `survey_privacy_redaction_audit`

These are not production feature keys. They do not add entitlement runtime, usage metering runtime, billing runtime, subscription runtime, or plan pricing.

Permission and entitlement must remain separate:

- permission controls whether a specific user can perform an action,
- entitlement controls whether an organization has access to a feature.

Even if a future organization has entitlement, a future user still needs permission.

## AI Boundary

AI may assist future survey audit workflows by:

- summarizing audit trail for authorized internal roles,
- identifying missing audit categories,
- flagging unusual flows for human review,
- drafting internal follow-up suggestions,
- grouping similar low-rating issues for review.

AI must not:

- automatically create audit events,
- automatically modify audit events,
- automatically delete or hide audit events,
- automatically modify official records,
- automatically create formal complaint,
- automatically close formal complaint,
- automatically approve refund / compensation / quote / settlement,
- bypass permission, organization scope, or entitlement,
- write uncertain content into official audit record.

AI output must stay advisory unless a future approved workflow explicitly records a human-confirmed decision.

## Explicit Non-Goals

Task221 does not:

- create audit table,
- modify audit table,
- create survey table,
- create complaint / follow-up table,
- add migration,
- modify schema,
- add indexes,
- add audit runtime,
- add survey runtime,
- add provider integration,
- send LINE / APP / SMS / email,
- add outbox / worker,
- add API,
- modify backend service / repository / controller,
- modify Admin UI,
- add customer portal,
- add AI analysis runtime,
- add automated test / fixture / smoke,
- add localization file,
- modify package.json,
- modify inventory docs,
- touch Migration020,
- execute DB / psql / db:migrate / DDL / cleanup,
- touch shared Zeabur runtime.

## Future Implementation Approval Boundary

This catalog is a design aid only. Any future implementation requires explicit PM / user approval and separate tasks for:

- schema and migration,
- runtime write path,
- permission and entitlement checks,
- organization isolation tests,
- redaction and safe error policy,
- Admin UI if needed,
- no-send tests,
- provider integration if ever authorized,
- audit export / retention policy if ever authorized.

## Verification Checklist

Task221 completion should verify:

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
- no complaint workflow runtime,
- no follow-up workflow runtime,
- no outbox / worker,
- no survey token / web form,
- no AI analysis runtime,
- no AI auto-decision,
- no permission runtime,
- no entitlement runtime,
- no SaaS billing / subscription / usage metering,
- no smoke / automated tests / fixtures / QA scripts touched,
- no localization files touched,
- no package.json change,
- no inventory docs change,
- sensitive / internal diagnostic scan contains no actual sensitive values.
