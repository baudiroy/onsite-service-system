# Task 863 — Data Correction Pre-Departure Apply Writer Boundary / Correction Application Ready / No DB

## Goal

Harden the only approved official correction path: valid `pre_departure_apply` can apply a safe operational correction through the injected `correctionWriter`, while manual request writers and repository shortcuts remain unused.

## Scope

Changed files:

- `tests/dataCorrection/dataCorrectionRequestService.unit.test.js`
- `tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js`
- `tests/dataCorrection/dataCorrectionServerOptions.unit.test.js`
- `docs/task-863-data-correction-pre-departure-apply-writer-boundary-no-db-no-migration.md`

## Runtime Decision

No source/runtime change was required for this task. Existing apply behavior already limits official correction application to the valid pre-departure apply path.

The new coverage verifies:

- valid `pre_departure_apply` returns the approved applied result.
- `correctionApplicationReady` is `true`.
- `correctionApplied` is `true`.
- `correctionWriter` is called exactly once through the injected synthetic writer.
- contact-log and dispatch-note manual request writers are not called by the apply path.
- repository shortcut writers are not used when explicit task-scoped options are provided.
- audit intent remains limited to the existing safe apply audit path.
- response and writer payloads do not expose sensitive values or `finalAppointmentId`.

## Non-goals

This task did not:

- broaden what counts as pre-departure apply.
- change API routes, DTOs, controllers, service contracts, or repository behavior.
- add DB schema, migrations, DDL, seed data, or psql usage.
- add real persistence, audit sinks, contact logs, dispatch notes, correction application writes, or repository-backed runtime.
- convert manual requests into official correction applications.
- change permission model, policy schema, or denied/non-applyable behavior.
- add smoke tests or admin frontend changes.
- touch provider sending, LINE/SMS/App push, AI/RAG runtime, billing, settlement, package files, or credentials.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js
# PASS: 114 passed / 0 failed

node --test tests/dataCorrection/*.js
# PASS: 639 passed / 0 failed

npm run check
# PASS

find tests -type f -name '*.js' -exec node --test {} +
# PASS: 1967 passed / 0 failed
```

```bash
git diff --check -- src/dataCorrection/dataCorrectionRequestService.js tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js docs/task-863-data-correction-pre-departure-apply-writer-boundary-no-db-no-migration.md
# PASS
```
