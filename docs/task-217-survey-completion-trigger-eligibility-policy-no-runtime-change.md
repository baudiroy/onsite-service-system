# Task 217 - Survey Completion Trigger Eligibility Policy / No Runtime Change

## Purpose and Scope

Task217 defines a documentation-only eligibility policy for future post-completion customer satisfaction survey triggers.

This document is part of the Survey Runtime Readiness branch and focuses on when a future survey may be considered eligible, when it must be blocked, and when ambiguity should require future review. It does not implement triggers, tables, APIs, Admin UI, workers, provider delivery, surveys, tests, fixtures, or AI decision engines.

Task217 is not:

- survey runtime implementation,
- provider sending implementation,
- queue / outbox / worker implementation,
- DB migration,
- API contract implementation,
- Admin UI implementation,
- automated test implementation,
- AI decision engine implementation.

## Eligibility Source of Truth

Future survey eligibility should be determined by backend/system state, not by user interface or external delivery callbacks.

Principles:

- eligibility should be based on official Case-level completion,
- eligibility should be based on the completed Field Service Report,
- eligibility should use backend/system-determined `finalAppointmentId`,
- eligibility should not be decided by an Admin button alone,
- eligibility should not be decided by Admin manual appointment selection,
- eligibility should not be decided by an engineer form,
- eligibility should not be decided by AI suggestion,
- eligibility should not be decided by provider callback,
- survey trigger should not accept normal manual final appointment selection,
- any future Admin override must be permission-controlled, audited, and exceptional.

## Required Eligibility Conditions

Future survey eligibility should require all of the following conditions before any survey is created or delivered.

These are policy conditions only, not executable rules in Task217:

- Case is within the same organization scope,
- Case is not deleted,
- Case is not archived into a non-operable state,
- Case has reached formal completion status,
- Field Service Report is formally completed,
- one Case still has one formal Field Service Report,
- `field_service_reports.case_id` uniqueness principle is preserved,
- `finalAppointmentId` has been resolved by the backend/system,
- final appointment exists,
- final appointment belongs to the same Case,
- final appointment has a clear completed terminal state,
- same Case has no other open appointment,
- survey has not already been created or blocked by future duplicate policy,
- customer contact/channel eligibility is resolvable by a future channel resolver,
- opt-out / unsubscribe / suppression policy is satisfied once such policy exists.

Task217 does not implement contact resolution or eligibility checking.

## Ineligible States

Future survey trigger must not run when any of these states apply:

- Case is not completed,
- Field Service Report is draft,
- Field Service Report is in progress,
- Field Service Report is incomplete,
- `finalAppointmentId` is not resolved,
- final appointment is not a completed terminal visit,
- Case still has an open appointment,
- appointment result is customer unavailable,
- appointment result is pending parts,
- appointment result is pending quote,
- appointment result is canceled,
- appointment result is rescheduled,
- appointment result is cannot repair while the Case is not formally completed,
- appointment result is no access,
- appointment result is no show,
- appointment result is waiting customer decision,
- an intermediate visit is completed but the Case is not completed,
- report completion is rolled back,
- report completion is voided,
- report is reopened in a future workflow,
- report enters future exception review before survey eligibility is confirmed,
- organization / tenant scope is ambiguous,
- customer channel identity is ambiguous,
- customer channel identity is unverified,
- opt-out / unsubscribe / suppression state is unclear,
- provider readiness is unclear,
- AI confidence is the only source of eligibility.

## Manual Resend / Retry / Duplicate Boundary

Future manual resend and retry policy must be separate from first eligibility.

Principles:

- normal retry must not create multiple active surveys,
- manual resend must require permission,
- manual resend must require organization scope,
- manual resend must be audited,
- manual resend must not re-decide Case completion,
- provider delivery failure must not modify Case, Appointment, or Field Service Report state,
- resend must respect unsubscribe, opt-out, and suppression,
- repeat completion should be protected by idempotency guard,
- future policy must distinguish same survey resend from new survey invitation,
- future policy must distinguish reopened Case after completion from normal resend,
- future supervisor-approved exception must be explicit and audited.

Task217 does not implement resend, retry, idempotency, provider retry, or audit runtime.

## Multi-Visit Handling

Survey eligibility must preserve core multi-visit guardrails.

Principles:

- multiple visits belong at appointment / dispatch visit level,
- Field Service Report remains the Case-level final completion summary,
- survey should default to the final completed appointment context,
- survey should not be sent for a pending parts first visit,
- survey should not be sent for a pending quote intermediate visit,
- survey should not be sent for customer unavailable visits,
- survey should not be sent for rescheduled visits,
- survey should not be sent simply because one intermediate appointment is completed,
- if a Case completes after multiple visits, the survey context should reference the final completed appointment,
- customer feedback may describe the whole service experience,
- survey response data must not be written back into service report internal notes.

## Failure and Ambiguity Handling

Future survey eligibility should fail closed.

Fail-closed cases:

- eligibility unclear -> do not send,
- `finalAppointmentId` unclear -> do not send,
- appointment state unclear -> do not send,
- Case completion unclear -> do not send,
- Field Service Report completion unclear -> do not send,
- organization scope unclear -> do not send,
- tenant scope unclear -> do not send,
- channel identity unclear -> do not send,
- provider readiness unclear -> do not send,
- opt-out/suppression unclear -> do not send,
- AI confidence low or uncertain -> do not treat as eligibility,
- concurrent/repeated completion ambiguity -> route to future exception review / audit, not automatic sending.

Survey delivery must never be used to resolve official Case / Appointment / Field Service Report state ambiguity.

## Audit Readiness

Future survey eligibility should define audit events before runtime implementation.

Possible future audit events:

- survey eligibility evaluated,
- survey eligibility created,
- survey eligibility skipped,
- survey eligibility blocked,
- survey eligibility ambiguity detected,
- duplicate eligibility suppressed,
- manual resend requested,
- manual resend approved,
- manual resend rejected,
- provider delivery retry requested,
- channel identity missing,
- opt-out respected,
- suppression respected,
- finalAppointmentId mismatch detected,
- open appointment conflict detected,
- AI suggestion ignored for review only,
- AI suggestion accepted for review only.

Audit requirements:

- do not record full phone/mobile values,
- do not record raw LINE user id,
- do not record token values,
- do not record secret values,
- do not record provider credential values,
- do not record raw provider payloads,
- do not record AI raw payloads,
- do not expose internal diagnostics to customer-visible responses,
- keep audit events organization scoped,
- keep manual resend and exception actions attributable.

Task217 does not create audit log entries or audit runtime.

## AI Boundary

AI may assist future eligibility workflows by:

- reminding humans or deterministic rules about potentially eligible Cases,
- summarizing completion-state risk,
- flagging possible open appointment conflict,
- drafting exception review reason,
- summarizing why eligibility may be blocked,
- grouping similar survey eligibility issues for review.

AI must not:

- automatically determine official survey eligibility,
- automatically send survey,
- automatically modify Case status,
- automatically modify Appointment status,
- automatically modify Field Service Report status,
- automatically select `finalAppointmentId`,
- automatically close a complaint,
- automatically approve compensation,
- automatically approve refund,
- automatically approve settlement,
- automatically approve quote,
- bypass permission,
- bypass organization scope,
- bypass entitlement,
- write uncertain content into official records.

## Permission / Entitlement Readiness

Task217 does not create permission or entitlement runtime.

Future questions:

- who can view survey eligibility status,
- who can request manual resend,
- who can approve manual resend,
- who can view skipped reason,
- who can view blocked reason,
- who can view delivery failure,
- who can view AI suggestion,
- which roles can override suppression in approved exception cases, if ever allowed,
- which roles can export survey eligibility or response data,
- which organization-level entitlements enable survey runtime.

Possible placeholder future entitlements:

- `survey_runtime`,
- `survey_manual_resend`,
- `survey_delivery_status`,
- `survey_ai_summary`,
- `survey_exception_review`.

These are placeholders only and not production feature keys.

Principles:

- permission controls what a user may do,
- entitlement controls what an organization has enabled,
- permission and entitlement must not be confused,
- entitlement does not bypass RBAC,
- RBAC does not bypass organization scope.

## Explicit Non-Goals

Task217 does not:

- create survey table,
- add migration,
- modify schema,
- add trigger,
- add outbox,
- add worker,
- add API,
- modify backend service / repository / controller code,
- modify Admin UI,
- add survey delivery provider,
- send LINE / SMS / email / APP,
- add survey token,
- add survey web form,
- add automated tests,
- add fixtures,
- add smoke tests,
- add localization file,
- modify `package.json`,
- modify inventory docs,
- touch Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- execute DDL,
- run cleanup commands,
- touch shared Zeabur runtime.

## Future Implementation Approval Boundary

Future implementation requires separate PM/user approval for:

1. data model / migration,
2. trigger source of truth,
3. idempotency and duplicate prevention,
4. manual resend rules,
5. channel/contact resolver,
6. provider sending,
7. no-send / dry-run mode,
8. permission and entitlement model,
9. audit model,
10. test and fixture strategy,
11. customer-visible vs internal response contract,
12. AI advisory-only safeguards.

General continuation wording does not approve any of the above.

## Future Task Candidates

Possible next docs-only tasks:

- Task218 - Survey Delivery Channel Abstraction Proposal / No Runtime Change.
- Task218 - Survey Response Data Separation Policy / No Runtime Change.
- Task218 - Survey Low-Rating and Complaint Follow-Up Workflow Design / No Runtime Change.
- Task218 - Survey Audit Event Catalog / No Runtime Change.
- Task218 - Survey Idempotency and Manual Resend Policy / No Runtime Change.
- Task218 - Survey Permission and Entitlement Readiness Matrix / No Runtime Change.

These are candidates only. Task217 does not execute them.

## Verification Checklist

Task217 should be considered valid only if:

- it remains documentation-only,
- it changes only docs,
- it does not modify backend `src/`,
- it does not modify `admin/src/`,
- it does not modify migrations, schema, or indexes,
- it does not modify routes, controllers, services, or repositories,
- it does not modify OpenAPI / Swagger or generated clients,
- it does not create tests, fixtures, smoke tests, or QA scripts,
- it does not create localization files,
- it does not modify `package.json`,
- it does not modify inventory docs,
- it does not connect to DB,
- it does not run DDL,
- it does not run psql,
- it does not run `npm run db:migrate`,
- it does not dry-run/apply Migration 020,
- it does not run cleanup commands,
- it does not touch shared Zeabur runtime,
- it does not send LINE / APP / SMS / email,
- it does not add provider sending,
- it does not add survey runtime,
- it does not add outbox / worker,
- it does not add survey token or web form,
- it does not add AI automatic decisions,
- it contains no sensitive values,
- it does not violate `docs/PROJECT_GUARDRAILS.md`.
