# Task1275 - Historical Appointment/Dispatch Source Synthetic Test Baseline / No Source Change

Status: local tests-only baseline ready for PM review.

## Scope

Task1275 adds tests-only coverage for a narrow historical dirty source subset:

- `src/repositories/DispatchRepository.js`
- `src/services/AppointmentService.js`

This task does not modify source files, does not connect to a database, does not run smoke tests, and does not stage or commit anything.

Explicitly excluded from this task:

- `src/repositories/FieldServiceReportRepository.js`
- `src/services/FieldServiceReportService.js`
- `src/server.js`
- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`

## Testable Behavior Covered

`tests/historicalDirtyStack/appointmentDispatchHistoricalSourceBaseline.unit.test.js` covers the following with synthetic dependencies only:

- `DispatchRepository.getDispatchAssignmentById` delegates to an injected query client and returns a found assignment
- missing dispatch assignment returns `null`
- deleted assignment exclusion is encoded through `deleted_at IS NULL`
- `AppointmentService.ensureDispatchAssignmentForCase` accepts a same-case assignment
- missing assignment is rejected with `invalid_reference`
- cross-case assignment is rejected with `invalid_reference`
- invalid actual arrival / finish time range is rejected before update, message, or audit side effects
- completed appointment status with non-completed `visitResult` is rejected before update, message, or audit side effects
- completed `visitResult` can derive completed appointment status with synthetic repository, message, and audit dependencies

## Test Limitations

The following were not forced in Task1275 because doing so would require source refactor, route/runtime wiring, or broader source scope:

- real database behavior for inactive or deleted dispatch assignments beyond verifying the repository SQL filter
- DB-backed transaction behavior
- controller/API request behavior
- server mount behavior
- Field Service Report repository/service behavior
- smoke coverage

`AppointmentService` imports transaction helpers at module load time. The test replaces only that transaction helper with a synthetic callback before loading the service module, so validation and dependency calls can be tested without a DB connection.

## Readiness Assessment

The appointment/dispatch subset is now testable for the narrow behaviors above without source changes.

The subset is not yet ready for broad source stage/commit solely from Task1275 because only `DispatchRepository.js` and `AppointmentService.js` were covered, while FSR/source/server/smoke files remain excluded. A future task should decide whether to expand tests to the remaining historical dirty files or stage only an exact reviewed subset.

## Verification

Required by PM:

- `node --test tests/historicalDirtyStack/appointmentDispatchHistoricalSourceBaseline.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git diff --cached --name-only`
- `git diff --name-only`
- `git log -1 --oneline`

Expected:

- test passes
- diff checks pass
- staged area remains empty
- latest commit remains `e22a137 Document repair intake route-ready remote setup decision`
- tracked diff remains exactly the same 8 historical dirty files
- Task1275 files remain untracked
