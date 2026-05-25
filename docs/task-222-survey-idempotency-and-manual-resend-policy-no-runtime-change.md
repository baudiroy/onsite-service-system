# Task 222 - Survey Idempotency and Manual Resend Policy / No Runtime Change

## Purpose and Scope

Task222 defines a documentation-only policy for future customer satisfaction survey idempotency, duplicate suppression, delivery retry, and manual resend behavior.

The goal is to prevent duplicate survey invitations, repeated customer harassment, cross-organization delivery mistakes, provider retry confusion, and race-like survey state conflicts when future survey runtime is implemented.

Task222 is not:

- survey runtime implementation,
- delivery runtime implementation,
- idempotency key implementation,
- manual resend API,
- provider retry worker,
- DB schema or migration proposal,
- Admin UI,
- automated test,
- AI decision engine.

This document does not create tables, define production idempotency keys, add API behavior, modify runtime, send provider messages, add tests, or touch Migration020.

## Core Idempotency Principles

Future survey eligibility and delivery must be idempotent by design.

Principles:

- survey eligibility evaluation may run more than once, but must not create duplicate active survey lifecycle records,
- delivery retry may run more than once, but must not repeatedly bother the customer,
- the same Case and the same final completed appointment should have one active survey invitation lifecycle by default,
- duplicate suppression must be organization scoped,
- idempotency must not rely only on provider message id,
- idempotency must not rely only on raw channel identity,
- idempotency must not rely only on frontend request identity,
- idempotency must not cross organization boundaries,
- provider callback must not become official Case completion source of truth,
- provider callback must not become survey eligibility source of truth,
- repeat completion rejection must not create a new survey invitation,
- failed completion must not create a survey invitation.

The future source of truth should remain backend first successful Case-level completion context, not frontend payload, provider delivery result, or AI inference.

## Future Idempotency Dimensions

The following conceptual dimensions may help future implementation design. They are not table fields, not migration proposal, not API schema, and not production idempotency key format.

Conceptual dimensions:

- organization reference,
- Case reference,
- final completed appointment reference,
- survey purpose / template reference,
- customer channel identity reference,
- survey invitation lifecycle reference,
- delivery attempt reference,
- manual resend request reference,
- suppression / opt-out reference,
- correlation reference,
- actor reference.

Future implementation requires separate schema, migration, API, permission, entitlement, Admin, and test tasks.

## Duplicate Prevention Policy

Future survey workflows should prevent duplicate invitation and duplicate delivery by default.

Policy:

- the same Case must not create multiple survey invitations because of repeated completion requests,
- the same final completed appointment must not create multiple survey invitations because of worker retry,
- provider timeout must not automatically cause multiple channel sends,
- manual resend must not bypass duplicate suppression,
- multi-channel fallback must not send multiple survey invitations simultaneously unless a future approved policy explicitly allows it,
- reopened / voided / corrected completion requires exception review and must not automatically create a new survey,
- if a response already exists, a new survey invitation should not be sent by default,
- if a survey link expired, future policy must distinguish resending the same invitation lifecycle from creating a new invitation lifecycle,
- duplicate suppression should be auditable with safe reason categories,
- duplicate suppression must not reveal whether a Case, customer identity, channel binding, or survey exists to unauthorized users.

Default recommendation:

- one Case-level completion context,
- one final completed appointment reference when available,
- one active survey invitation lifecycle,
- controlled retries within that lifecycle,
- controlled manual resend only with permission, audit, and suppression checks.

## Manual Resend Policy

Manual resend is a future controlled human action. Task222 does not approve manual resend runtime.

Future manual resend must require:

- explicit human request,
- actor identity,
- permission,
- organization scope,
- safe reason category,
- audit,
- opt-out / unsubscribe / suppression checks,
- channel identity readiness check,
- provider readiness check,
- duplicate policy check.

Manual resend must not:

- be triggered automatically by AI,
- be triggered automatically by provider callback,
- be triggered by browser refresh,
- be triggered by frontend request retry,
- bypass opt-out / unsubscribe / suppression,
- send across organization boundary,
- leak whether customer, Case, phone, survey, or LINE binding exists,
- create a formal complaint automatically,
- modify survey response automatically,
- modify Case / Appointment / Field Service Report status,
- change finalAppointmentId,
- create a second formal Field Service Report.

Manual resend should be treated as a high-friction controlled operation, not a convenience button that skips safety checks.

## Retry Policy

Retry handles delivery attempt failure. It is not eligibility re-evaluation.

Future retry principles:

- retry must not create a new Case completion,
- retry must not create a new Field Service Report completion,
- retry must not create a new survey response record,
- retry must not change finalAppointmentId,
- retry must not skip opt-out / unsubscribe / suppression,
- retry should remain inside the same survey invitation lifecycle unless a future exception policy approves otherwise,
- retry count, retry interval, cooldown, and provider failure category are future policy questions,
- provider failure diagnostics are internal-only,
- provider failure must not be shown to customers as raw error detail,
- retry failure must not mutate Case / Appointment / Field Service Report.

Provider failure cannot be treated as customer dissatisfaction or formal complaint by itself.

## Reopened / Corrected / Exception Cases

Future reopen, void, correction, service recovery, or supervisor exception flows require separate product policy.

Principles:

- a sent survey does not prevent a Case from being reopened by a future approved workflow,
- survey response must not automatically reopen a Case,
- reopened Case completion must not automatically send a second survey unless a future approved exception policy allows it,
- formal complaint must not automatically trigger a new survey,
- service recovery must not automatically trigger a new survey,
- supervisor-approved exception must be audited,
- exception must not break one Case / one formal Field Service Report,
- exception must not create multiple open appointments for the same Case,
- exception must not allow manual finalAppointmentId override by default.

Open product questions:

- Should a corrected completion suppress prior survey?
- Should a service recovery completion allow a second survey?
- Who can approve a second survey?
- Should the original survey remain linked to the first completion context?
- How should a later corrected finalAppointmentId affect survey display, if ever?

No answer in Task222 authorizes runtime behavior.

## Fail-Closed Ambiguity Handling

Future survey sending must fail closed when safety or identity context is unclear.

Do not send when:

- organization scope is unclear,
- Case reference is unclear,
- finalAppointmentId is unclear when appointments exist,
- final appointment terminal state is unclear,
- same Case has open appointment conflict,
- survey invitation lifecycle is unclear,
- existing response state is unclear,
- channel identity is ambiguous,
- consent / opt-out / unsubscribe / suppression state is unclear,
- provider readiness is unclear,
- permission is unclear,
- entitlement is unclear,
- AI suggestion conflicts with official state,
- duplicate policy cannot be evaluated,
- customer-visible copy would reveal sensitive internal state.

Fail-closed outcomes should use safe internal audit categories and safe customer-facing messages.

## Audit Readiness

Future audit events may include:

- survey idempotency evaluated,
- duplicate survey suppressed,
- duplicate delivery suppressed,
- manual resend requested,
- manual resend approved,
- manual resend rejected,
- manual resend executed,
- manual resend blocked by suppression,
- manual resend blocked by duplicate policy,
- delivery retry scheduled,
- delivery retry attempted,
- delivery retry skipped,
- delivery retry failed,
- reopened case survey exception detected,
- supervisor exception approved,
- AI resend suggestion generated,
- AI resend suggestion rejected.

Audit redaction requirements:

- do not record complete mobile / phone / tel values,
- do not record raw LINE user id,
- do not record token / secret / provider credential,
- do not record raw provider payload,
- do not record AI raw payload,
- do not expose audit to customer-visible surfaces,
- do not expose provider diagnostics to customers,
- do not expose permission / entitlement decision internals to customers.

## Permission / Organization Scope Readiness

Task222 does not implement permission runtime.

Future questions:

- Who can request manual resend?
- Who can approve manual resend?
- Who can execute resend?
- Who can view duplicate suppression reason?
- Who can view provider retry status?
- Who can override expired survey behavior?
- Who can approve reopened-case survey exception?
- Who can view idempotency audit trail?

Future API / Admin actions must check:

- authentication,
- role,
- permission,
- organization scope,
- resource scope,
- safe-deny and non-leakage behavior.

Admin permission must not hide organization isolation problems. Cross-organization, hidden resource, deleted resource, ambiguous identity, and unauthorized access should be safe-denied without leaking existence.

## SaaS-Ready / Entitlement Readiness

Task222 does not implement entitlement runtime.

Placeholder future feature keys:

- `survey_manual_resend`
- `survey_delivery_retry`
- `survey_duplicate_suppression`
- `survey_resend_approval`
- `survey_delivery_status`
- `survey_exception_review`
- `survey_provider_diagnostics`

These are not production feature keys.

This document does not add:

- entitlement runtime,
- usage metering runtime,
- billing runtime,
- subscription runtime,
- plan pricing.

Permission and entitlement must remain separate:

- permission controls whether a specific user can perform an action,
- entitlement controls whether an organization has access to a feature.

Even if a future organization has entitlement, a future user still needs permission.

## AI Advisory-Only Boundary

AI may assist by:

- suggesting that a manual resend review may be needed,
- summarizing provider failure categories for authorized internal users,
- flagging duplicate / suppression ambiguity,
- reminding staff about reopened-case exception risk,
- drafting internal manual resend reason text.

AI must not:

- automatically resend survey,
- automatically retry provider delivery,
- bypass suppression / opt-out / unsubscribe,
- create a new survey invitation,
- modify survey response,
- modify Case / Appointment / Field Service Report,
- choose finalAppointmentId,
- create or close formal complaint,
- approve refund / compensation / quote / settlement,
- bypass permission / organization scope / entitlement,
- write uncertain inference into official record.

AI suggestions remain advisory and require human confirmation when any official action is involved.

## Explicit Non-Goals

Task222 does not:

- create survey invitation table,
- create idempotency table,
- create manual resend table,
- add migration,
- modify schema,
- add indexes,
- add idempotency key,
- add worker,
- add outbox,
- add retry scheduler,
- add manual resend API,
- add provider adapter,
- send LINE / APP / SMS / email,
- add survey token,
- add survey web form,
- add survey runtime,
- add notification runtime,
- add audit runtime,
- add AI analysis runtime,
- add automated test / fixture / smoke,
- add localization file,
- modify package.json,
- modify inventory docs,
- touch Migration020,
- execute DB / psql / db:migrate / DDL / cleanup,
- touch shared Zeabur runtime.

## Future Implementation Approval Boundary

This document is a policy design aid only.

Future implementation requires separate PM / user approval for:

- schema and migration,
- canonical idempotency key format,
- survey invitation lifecycle runtime,
- retry scheduler,
- manual resend API,
- permission and entitlement checks,
- Admin UI,
- provider adapters,
- no-send tests,
- audit events,
- localization keys,
- customer-visible copy.

General continuation language does not authorize these implementation steps.

## Verification Checklist

Task222 completion should verify:

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
- no idempotency runtime,
- no manual resend runtime,
- no retry scheduler,
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
