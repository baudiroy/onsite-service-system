# Task1278 - Historical Appointment/Dispatch CreateAppointment Synthetic Tests / No Source Change

Status: local tests-only coverage ready for PM review.

## Scope

Task1278 adds direct synthetic coverage for `AppointmentService.createAppointment` from the historical appointment/dispatch dirty source subset.

This task does not modify source files, does not connect to a database, does not run smoke tests, does not call providers, and does not stage or commit anything.

Source imported as runtime under test only:

- `src/services/AppointmentService.js`

Explicitly not modified:

- `src/services/AppointmentService.js`
- `src/repositories/DispatchRepository.js`
- `src/repositories/FieldServiceReportRepository.js`
- `src/services/FieldServiceReportService.js`
- `src/server.js`
- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`

## Behavior Covered

`tests/historicalDirtyStack/appointmentDispatchCreateAppointmentHistoricalSource.unit.test.js` covers:

- explicit same-case `dispatchAssignmentId` is accepted
- synthetic appointment repository receives the safe resolved dispatch assignment id
- created appointment is normalized to `scheduled`
- input payload is not mutated
- explicit cross-case `dispatchAssignmentId` is rejected with `invalid_reference`
- missing explicit `dispatchAssignmentId` is rejected with `invalid_reference`
- cross-case and missing assignment paths do not create appointment, message, or audit side effects
- invalid actual arrival / finish range rejects before case lookup, create, message, or audit side effects
- current source behavior normalizes caller-supplied `appointmentStatus: completed` to `scheduled` when `visitResult` is non-completed
- completed `visitResult` is rejected because current create path always creates scheduled appointments

## Observed Source Behavior

`createAppointment` currently forces `appointmentStatus` to `scheduled` when calling the appointment repository. Because of that, a service-level caller-provided `appointmentStatus: completed` is ignored on create.

The public create appointment validator does not expose `appointmentStatus`, so this normalization is likely intentional for API callers. However, it means Task1278 cannot honestly prove "completed status plus non-completed visit result rejects" at the service-input level; the observed behavior is normalization to `scheduled` with the provided non-completed `visitResult`.

`visitResult: completed` does reject on create because a new appointment is treated as scheduled by current source behavior.

## Readiness Assessment

With Task1275 and Task1278 together, the appointment/dispatch subset has direct synthetic coverage for:

- dispatch lookup by id
- same-case dispatch validation
- missing/cross-case dispatch rejection
- create appointment explicit dispatch assignment behavior
- actual time range validation
- completed visit result consistency behavior
- reschedule completed status consistency behavior

The subset appears closer to a future exact-subset source stage/commit for only:

- `src/repositories/DispatchRepository.js`
- `src/services/AppointmentService.js`

PM should still explicitly decide whether the observed create-time `appointmentStatus` normalization is acceptable before source commit.

The following remain excluded and should not be bundled into an appointment/dispatch exact-subset source commit:

- Field Service Report repository/service
- `src/server.js`
- Task105 document
- smoke scripts

## Verification

Required by PM:

- `node --test tests/historicalDirtyStack/appointmentDispatchCreateAppointmentHistoricalSource.unit.test.js`
- `node --test tests/historicalDirtyStack/appointmentDispatchHistoricalSourceBaseline.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git diff --cached --name-only`
- `git diff --name-only`
- `git log -1 --oneline`

Expected:

- new test passes
- baseline test passes
- diff checks pass
- staged area remains empty
- latest commit remains `b237d69 Add historical appointment dispatch synthetic test baseline`
- tracked diff remains exactly the same 8 historical dirty files
- Task1278 files remain untracked
