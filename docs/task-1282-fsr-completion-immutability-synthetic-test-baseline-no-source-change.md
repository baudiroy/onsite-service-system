# Task1282 - FSR Completion/Immutability Synthetic Test Baseline / No Source Change

Status: local tests-only coverage ready for PM review.

## Scope

Task1282 adds synthetic coverage for the remaining Field Service Report dirty source subset before any exact-subset source stage/commit decision.

This task does not modify source files, does not connect to a database, does not run smoke tests, does not call providers, and does not stage or commit anything.

Source imported as runtime under test only:

- `src/repositories/FieldServiceReportRepository.js`
- `src/services/FieldServiceReportService.js`

Explicitly not modified:

- `src/repositories/FieldServiceReportRepository.js`
- `src/services/FieldServiceReportService.js`
- `src/server.js`
- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`
- `src/repositories/DispatchRepository.js`
- `src/services/AppointmentService.js`

## Behavior Covered

`tests/historicalDirtyStack/fsrCompletionImmutabilityHistoricalSourceBaseline.unit.test.js` covers:

- `FieldServiceReportRepository.getServiceReportByIdForUpdate` uses `FOR UPDATE`
- `getServiceReportByIdForUpdate` filters `deleted_at IS NULL`
- repository methods delegate through an injected synthetic query client
- `completeServiceReportFirstTransition` sets `service_status = 'completed'`
- `completeServiceReportFirstTransition` filters `deleted_at IS NULL`
- `completeServiceReportFirstTransition` guards `service_status <> 'completed'`
- `completeServiceReportFirstTransition` conditionally handles `final_appointment_id`
- `completeServiceReportFirstTransition` returns `null` when no row is updated
- `createServiceReport` maps the active `field_service_reports.case_id` unique conflict to `ConflictError`
- duplicate create conflict does not proceed to case summary, message, or audit side effects
- `updateServiceReport` rejects completed reports before repository update, message, or audit side effects
- `completeServiceReport` rejects already completed reports before completion side effects
- `completeServiceReport` maps a null first-transition update result to `ConflictError`
- `completeServiceReport` infers `finalAppointmentId` when omitted and an eligible completed appointment exists
- supplied `finalAppointmentId` must reference a completed appointment for the same case
- service part create, update, and delete reject when the parent report is already completed
- service part rejection paths avoid part mutation, message, and audit side effects

## Remaining Limits

The repository row lock and conditional update are covered as SQL-shape behavior only. Actual PostgreSQL row-lock behavior and concurrent first-transition semantics require explicit DB authorization and are not executed by this task.

The supplied `finalAppointmentId` path remains an override input path in service code. Task1282 verifies same-case and completed-appointment validation, but it does not prove route-level or role-level admin-only enforcement because source was not changed and no route/auth runtime was exercised.

`src/server.js`, smoke scripts, Task105 doc, and appointment/dispatch files remain excluded.

## Readiness Assessment

The FSR dirty source subset appears closer to a future exact-subset source stage/commit after this tests-only baseline, limited to:

- `src/repositories/FieldServiceReportRepository.js`
- `src/services/FieldServiceReportService.js`

Recommended next step is PM review of Task1282 results, then either:

- add any missing tests-only coverage requested by PM, or
- stage/commit only the FSR source subset if PM accepts the synthetic baseline.

Repository DB behavior should remain unexecuted until a separate disposable DB authorization task.

## Verification

Required by PM:

- `node --test tests/historicalDirtyStack/fsrCompletionImmutabilityHistoricalSourceBaseline.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git diff --cached --name-only`
- `git diff --name-only`
- `git log -1 --oneline`

Expected:

- new test passes
- diff checks pass
- staged area remains empty
- latest commit remains `b17f245 Harden appointment dispatch assignment validation`
- tracked diff remains the remaining excluded dirty files
- Task1282 files remain untracked
