# Task1802 Engineer Mobile Record Visit Result Action Policy / No DB No Completion Report

## Purpose

Task1802 adds one bounded pure runtime policy for `engineer_mobile.record_visit_result`.

The policy only decides whether an assigned engineer may record a final visit result intent for an appointment snapshot after on-site work has been finished. It does not persist state, expose an API route, mount a route globally, send provider messages, create completion reports, approve completion reports, publish completion reports, mutate finalAppointmentId, create or publish Field Service Reports, or publish any customer-visible effect.

## Modified Files

- `src/engineerMobile/engineerMobileRecordVisitResultActionPolicy.js`
- `tests/engineerMobile/engineerMobileRecordVisitResultActionPolicy.unit.test.js`
- `tests/engineerMobile/engineerMobileRecordVisitResultActionPolicyBoundary.static.test.js`
- `docs/task-1802-engineer-mobile-record-visit-result-action-policy-no-db-no-completion-report.md`

## Runtime Boundary

- Pure CommonJS module.
- Synchronous evaluator only.
- No DB.
- No SQL execution.
- No repository.
- No migration.
- No DDL, schema, or index changes.
- No global mount.
- No route/controller/API exposure.
- No provider sending.
- No LINE, SMS, email, webhook, or push.
- No AI/RAG.
- No billing/settlement.
- No admin UI.
- No package changes.
- No smoke/shared runtime.
- No completion report creation.
- No completion report approval.
- No completion report publication.
- No Field Service Report creation.
- No Field Service Report approval.
- No Field Service Report publication.
- No finalAppointmentId mutation.
- No customer-visible publication.

## Policy

The module exports:

- `ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION`
- `ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION`
- `ENGINEER_MOBILE_ALLOWED_VISIT_RESULTS`
- `evaluateEngineerMobileRecordVisitResultAction`

Action:

- `engineer_mobile.record_visit_result`

Permission key:

- `engineer_mobile.visit.record_result`

Allowed visit result codes:

- `resolved`
- `follow_up_required`
- `parts_required`
- `cannot_repair`
- `customer_unavailable`
- `cancelled_on_site`

The evaluator allows only when:

- actor exists.
- appointment exists.
- actor and appointment are in the same organization.
- actor is the assigned engineer for the appointment.
- actor has `engineer_mobile.visit.record_result`.
- appointment status is still open for recording visit result intent: `scheduled` or `rescheduled`.
- work has finished by mobile visit status, visit status, or work-finished timestamp.
- no visit result has already been recorded on the appointment snapshot.
- appointment does not carry completion-report boundary indicators.
- appointment does not carry finalAppointmentId boundary indicators.
- `visitResult` is one of the supported stable result codes.

Denied decisions return stable reason codes:

- `actor_required`
- `appointment_required`
- `organization_mismatch`
- `permission_required`
- `not_assigned_engineer`
- `appointment_not_open`
- `work_not_finished`
- `visit_result_already_recorded`
- `invalid_visit_result`
- `completion_report_boundary`
- `final_appointment_boundary`

## Sanitized Output

The returned decision envelope contains only safe policy metadata:

- action
- permission
- reasonCode
- normalized allowed visit result code
- subject actor id
- subject appointment id
- subject organization id
- subject appointment status
- audit intent with safe identifiers and normalized allowed result code

It does not echo raw appointment rows, customer phone, address, LINE IDs, customer raw data, private notes, SQL, credentials, provider payloads, stack traces, completion report payloads, report draft data, finalAppointmentId values, or internal implementation details.

## Tests

Unit coverage includes:

- allowed record-visit-result when work finished by `mobileVisitStatus: "work_finished"`.
- allowed record-visit-result when work finished by `visitStatus: "work_finished"`.
- allowed record-visit-result when work finished by `workFinishedAt`.
- allowed record-visit-result when work finished by `finishedWorkAt`.
- allowed for each supported visit result code.
- missing actor.
- missing appointment.
- organization mismatch.
- missing permission.
- actor not assigned to appointment.
- cancelled, completed, and no-show statuses.
- work-finished evidence missing.
- visit result already recorded.
- invalid, empty, null, object, and array visit result.
- completion-report boundary indicators.
- finalAppointmentId boundary indicators.
- sanitized output.
- input immutability.

Static boundary coverage confirms:

- policy imports nothing.
- policy does not contain forbidden DB, route, provider, AI/RAG, billing/settlement, or finalAppointmentId patterns.
- policy does not execute persistence, provider, route, appointment mutation, or completion workflow calls.
- this document records the no-runtime-expansion boundaries.

## Verification

Run:

```bash
node --test tests/engineerMobile/engineerMobileRecordVisitResultActionPolicy.unit.test.js
node --test tests/engineerMobile/engineerMobileRecordVisitResultActionPolicyBoundary.static.test.js
node --test tests/engineerMobile/engineerMobileRecordVisitResultActionPolicy.unit.test.js tests/engineerMobile/engineerMobileRecordVisitResultActionPolicyBoundary.static.test.js
npm run check
git diff --check -- src/engineerMobile/engineerMobileRecordVisitResultActionPolicy.js tests/engineerMobile/engineerMobileRecordVisitResultActionPolicy.unit.test.js tests/engineerMobile/engineerMobileRecordVisitResultActionPolicyBoundary.static.test.js docs/task-1802-engineer-mobile-record-visit-result-action-policy-no-db-no-completion-report.md
```

Also run a precise credential/sensitive scan limited to the touched files.

## Current Git Boundary

The 7 held historical untracked docs remain unrelated and must not be staged, cleaned, reset, stashed, restored, removed, or committed as part of this task.
