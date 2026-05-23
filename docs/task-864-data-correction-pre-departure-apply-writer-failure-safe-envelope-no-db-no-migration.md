# Task 864 — Data Correction Pre-Departure Apply Writer Failure Safe Envelope / No Manual Fallback / No DB

## Goal

Harden the valid `pre_departure_apply` failure path so an injected `correctionWriter` failure cannot imply an official correction was applied and cannot fall back to manual request writers or repository shortcuts.

## Scope

Changed files:

- `src/dataCorrection/preDepartureCorrectionApplicationService.js`
- `tests/dataCorrection/dataCorrectionRequestService.unit.test.js`
- `tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js`
- `tests/dataCorrection/dataCorrectionServerOptions.unit.test.js`
- `docs/task-864-data-correction-pre-departure-apply-writer-failure-safe-envelope-no-db-no-migration.md`

## Runtime Decision

This task made a bounded source correction in the existing pre-departure apply result builder:

- when `correctionWriter` fails or returns a failed result, the response remains `failed`.
- `correctionApplied` remains `false`.
- `correctionApplicationReady` is now also `false` on writer failure.
- manual request writers are not called as fallback.
- repository shortcuts are not used when explicit task-scoped options are provided.

## Non-goals

This task did not:

- broaden what counts as valid pre-departure apply.
- convert failed apply into `data_correction_request` or manual handling.
- change API routes, DTOs, controllers, repository behavior, or permission policy schema.
- add DB schema, migrations, DDL, seed data, psql, or real persistence.
- add contact-log, dispatch-note, audit-log, notification, provider, AI/RAG, billing, settlement, admin frontend, smoke, package, or credential changes.
- add official Case, Appointment, Field Service Report, or `finalAppointmentId` mutation behavior.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js
# PASS: 118 passed / 0 failed

node --test tests/dataCorrection/*.js
# PASS: 643 passed / 0 failed

npm run check
# PASS

find tests -type f -name '*.js' -exec node --test {} +
# PASS: 1971 passed / 0 failed

git diff --check -- src/dataCorrection/dataCorrectionRequestService.js tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js docs/task-864-data-correction-pre-departure-apply-writer-failure-safe-envelope-no-db-no-migration.md
# PASS

git diff --check -- src/dataCorrection/preDepartureCorrectionApplicationService.js tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js docs/task-864-data-correction-pre-departure-apply-writer-failure-safe-envelope-no-db-no-migration.md
# PASS: supplemental check for the actual bounded pre-departure apply source file touched by this task.
```
