# Task 865 — Data Correction Pre-Departure Apply Permission Denial Safe Envelope / No Writers / No DB

## Goal

Harden the permission-denied `pre_departure_apply` path so denied official correction attempts fail before `correctionWriter` or manual writers run, and never imply correction application readiness.

## Scope

Changed files:

- `tests/dataCorrection/dataCorrectionRequestService.unit.test.js`
- `tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js`
- `tests/dataCorrection/dataCorrectionServerOptions.unit.test.js`
- `docs/task-865-data-correction-pre-departure-apply-permission-denial-safe-envelope-no-db-no-migration.md`

## Runtime Decision

No source/runtime change was required. Existing pre-departure apply permission denial already fail-closes before any correction or manual request writer path.

The new coverage verifies:

- permission-denied `pre_departure_apply` is blocked through service, app factory, and server-created app paths.
- `correctionApplicationReady` is `false`.
- `correctionApplied` is `false`.
- `correctionWriter` is not called.
- contact-log, dispatch-note, audit, engineer-notification, and repository shortcut writers are not called as fallback.
- safe response output does not include permission internals or sensitive values.

## Non-goals

This task did not:

- add or broaden permissions.
- convert denied apply into manual handling.
- change API routes, DTOs, controllers, repository behavior, or permission policy schema.
- add DB schema, migrations, DDL, seed data, psql, or real persistence.
- add audit sinks, contact logs, dispatch notes, correction writes, notification sends, provider sends, AI/RAG, billing, settlement, admin frontend, smoke, package, or credential changes.
- add official Case, Appointment, Field Service Report, or `finalAppointmentId` mutation behavior.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js
# PASS: 121 passed / 0 failed

node --test tests/dataCorrection/*.js
# PASS: 646 passed / 0 failed

npm run check
# PASS

find tests -type f -name '*.js' -exec node --test {} +
# PASS: 1974 passed / 0 failed

git diff --check -- src/dataCorrection/dataCorrectionRequestService.js src/dataCorrection/preDepartureCorrectionApplicationService.js tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js docs/task-865-data-correction-pre-departure-apply-permission-denial-safe-envelope-no-db-no-migration.md
# PASS
```
