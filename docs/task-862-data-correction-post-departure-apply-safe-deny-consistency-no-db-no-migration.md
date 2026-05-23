# Task 862 — Data Correction Post-Departure Apply Safe-Deny Consistency / No Request Writers / No DB

## Goal

Harden the Data Correction apply-path test coverage so post-departure or otherwise non-applyable correction attempts cannot create official correction applications or fall through to manual request writers.

## Scope

Changed files:

- `tests/dataCorrection/dataCorrectionRequestService.unit.test.js`
- `tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js`
- `tests/dataCorrection/dataCorrectionServerOptions.unit.test.js`
- `docs/task-862-data-correction-post-departure-apply-safe-deny-consistency-no-db-no-migration.md`

## Runtime Decision

No source/runtime change was required for this task. Existing apply behavior already blocks post-departure correction application before `correctionWriter` is called.

The new coverage verifies:

- post-departure `pre_departure_apply` returns a blocked safe result.
- `correctionApplicationReady` remains `false`.
- `correctionApplied` remains `false`.
- `correctionWriter` is not called.
- contact-log and dispatch-note manual request writers are not called from the apply path.
- repository shortcut writers are not used when explicit task-scoped options are provided.
- audit intent remains limited to the existing safe deny audit path.
- response and writer payloads do not expose sensitive values or `finalAppointmentId`.

## Non-goals

This task did not:

- change API routes, DTOs, controllers, service contracts, or repository behavior.
- add DB schema, migrations, DDL, seed data, or psql usage.
- add real persistence, audit sinks, contact logs, dispatch notes, correction application writes, or repository-backed runtime.
- change permission model, policy schema, or valid pre-departure apply behavior.
- add smoke tests or admin frontend changes.
- touch provider sending, LINE/SMS/App push, AI/RAG runtime, billing, settlement, package files, or credentials.

## Verification

Executed commands:

```bash
node --test tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js # PASS, 111 passed / 0 failed
node --test tests/dataCorrection/*.js # PASS, 636 passed / 0 failed
npm run check # PASS
find tests -type f -name '*.js' -exec node --test {} + # PASS, 1964 passed / 0 failed
git diff --check -- src/dataCorrection/dataCorrectionRequestService.js tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js docs/task-862-data-correction-post-departure-apply-safe-deny-consistency-no-db-no-migration.md # PASS
```
