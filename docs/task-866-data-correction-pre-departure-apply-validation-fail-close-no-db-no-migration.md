# Task 866 — Data Correction Pre-Departure Apply Validation Fail-Close / No Writers / No DB

## Goal

Harden the malformed `pre_departure_apply` path so official apply attempts with missing or invalid `correction.fieldKey` / `correction.fieldGroup` fail safely before `correctionWriter`, manual writers, or repository shortcuts run.

## Scope

Changed files:

- `tests/dataCorrection/dataCorrectionRequestService.unit.test.js`
- `tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js`
- `tests/dataCorrection/dataCorrectionServerOptions.unit.test.js`
- `docs/task-866-data-correction-pre-departure-apply-validation-fail-close-no-db-no-migration.md`

## Runtime Decision

No source/runtime change was required. Existing validation already fail-closes malformed apply input before official correction application.

The new coverage verifies:

- missing `correction.fieldKey` and blank `correction.fieldGroup` are rejected in the service apply path.
- sync and async service apply paths return `correctionApplicationReady=false` and `correctionApplied=false`.
- app factory and server-created app paths fail closed before any correction/manual writer or repository shortcut runs.
- safe response output does not include validation internals or sensitive values.

The app/server routes currently deny malformed `pre_departure_apply` input with a route-level safe `403` before the service result envelope is created. This is the more conservative behavior and was kept unchanged to avoid API/DTO/route shape expansion.

## Non-goals

This task did not:

- redesign validation schema.
- add public response fields.
- broaden permissions.
- convert invalid apply into manual request handling.
- change API routes, DTOs, controllers, repository behavior, or permission policy schema.
- add DB schema, migrations, DDL, seed data, psql, or real persistence.
- add audit sinks, contact logs, dispatch notes, correction writes, notification sends, provider sends, AI/RAG, billing, settlement, admin frontend, smoke, package, or credential changes.
- add official Case, Appointment, Field Service Report, or `finalAppointmentId` mutation behavior.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js
# PASS: 124 passed / 0 failed

node --test tests/dataCorrection/*.js
# PASS: 649 passed / 0 failed

npm run check
# PASS

find tests -type f -name '*.js' -exec node --test {} +
# PASS: 1977 passed / 0 failed
```
