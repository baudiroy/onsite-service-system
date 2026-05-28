# Task1800 Engineer Mobile Finish-Work Action Policy / No DB No Global Mount

## Purpose

Task1800 adds one bounded pure runtime policy for `engineer_mobile.finish_work`.

The policy only decides whether an assigned engineer may mark the on-site work session as finished for an appointment snapshot. It does not persist state, expose an API route, mount a route globally, send provider messages, create completion reports, approve completion reports, publish completion reports, mutate finalAppointmentId, or publish any customer-visible effect.

## Modified Files

- `src/engineerMobile/engineerMobileFinishWorkActionPolicy.js`
- `tests/engineerMobile/engineerMobileFinishWorkActionPolicy.unit.test.js`
- `tests/engineerMobile/engineerMobileFinishWorkActionPolicyBoundary.static.test.js`
- `docs/task-1800-engineer-mobile-finish-work-action-policy-no-db-no-global-mount.md`

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
- No finalAppointmentId mutation.
- No customer-visible publication.

## Policy

The module exports:

- `ENGINEER_MOBILE_FINISH_WORK_ACTION`
- `ENGINEER_MOBILE_FINISH_WORK_PERMISSION`
- `evaluateEngineerMobileFinishWorkAction`

Permission key:

- `engineer_mobile.visit.finish_work`

The evaluator allows only when:

- actor exists.
- appointment exists.
- actor and appointment are in the same organization.
- actor is the assigned engineer for the appointment.
- actor has `engineer_mobile.visit.finish_work`.
- appointment status is still open for finish-work: `scheduled` or `rescheduled`.
- work has started by mobile visit status, visit status, or work-start timestamp.
- work has not already finished.
- appointment has no terminal visit result already set.
- appointment does not carry completion-report boundary indicators.
- appointment does not carry finalAppointmentId boundary indicators.

Denied decisions return stable reason codes:

- `actor_required`
- `appointment_required`
- `organization_mismatch`
- `permission_required`
- `not_assigned_engineer`
- `appointment_not_open`
- `work_not_started`
- `already_finished`
- `terminal_visit_result`
- `completion_report_boundary`
- `final_appointment_boundary`

## Sanitized Output

The returned decision envelope contains only safe policy metadata:

- action
- permission
- reasonCode
- subject actor id
- subject appointment id
- subject organization id
- subject appointment status
- audit intent with safe identifiers

It does not echo raw appointment rows, customer phone, address, LINE IDs, customer raw data, private notes, SQL, credentials, provider payloads, stack traces, completion report payloads, finalAppointmentId values, or internal implementation details.

## Tests

Unit coverage includes:

- allowed finish-work when working by `mobileVisitStatus: "working"`.
- allowed finish-work when working by `visitStatus: "working"`.
- allowed finish-work when working by `workStartedAt`.
- allowed finish-work when working by `startedWorkAt`.
- missing actor.
- missing appointment.
- organization mismatch.
- missing permission.
- actor not assigned to appointment.
- cancelled, completed, and no-show statuses.
- work-start evidence missing.
- already finished appointment.
- terminal visit result.
- completion-report boundary indicators.
- finalAppointmentId boundary indicators.
- sanitized output.
- input immutability.

Static boundary coverage confirms:

- policy imports nothing.
- policy does not contain forbidden DB, route, provider, AI/RAG, billing/settlement, or finalAppointmentId patterns.
- policy does not execute persistence, provider, route, or completion workflow calls.
- this document records the no-runtime-expansion boundaries.

## Verification

Run:

```bash
node --test tests/engineerMobile/engineerMobileFinishWorkActionPolicy.unit.test.js
node --test tests/engineerMobile/engineerMobileFinishWorkActionPolicyBoundary.static.test.js
node --test tests/engineerMobile/engineerMobileFinishWorkActionPolicy.unit.test.js tests/engineerMobile/engineerMobileFinishWorkActionPolicyBoundary.static.test.js
npm run check
git diff --check -- src/engineerMobile/engineerMobileFinishWorkActionPolicy.js tests/engineerMobile/engineerMobileFinishWorkActionPolicy.unit.test.js tests/engineerMobile/engineerMobileFinishWorkActionPolicyBoundary.static.test.js docs/task-1800-engineer-mobile-finish-work-action-policy-no-db-no-global-mount.md
```

Also run a precise credential/sensitive scan limited to the touched files.

## Current Git Boundary

The 7 held historical untracked docs remain unrelated and must not be staged, cleaned, reset, stashed, restored, removed, or committed as part of this task.
