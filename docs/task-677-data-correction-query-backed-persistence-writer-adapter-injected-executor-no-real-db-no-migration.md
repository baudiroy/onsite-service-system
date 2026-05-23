# Task 677 — Data Correction Query-backed Persistence Writer Adapter / Injected Executor / No Real DB / No Migration

## Scope

Task677 adds a query-backed Data Correction persistence writer adapter.

This task composes the existing persistence writer contract shape with the Task676 injected query executor adapter. It is still a no-real-DB slice: it does not connect to a database, execute real SQL, add migrations, alter schema, wire repositories, mount routes, or change API behavior.

## Files Changed

- Added `src/dataCorrection/dataCorrectionQueryBackedPersistenceWriters.js`
- Added `tests/dataCorrection/dataCorrectionQueryBackedPersistenceWriters.unit.test.js`
- Added `docs/task-677-data-correction-query-backed-persistence-writer-adapter-injected-executor-no-real-db-no-migration.md`

## Runtime Decision

The new adapter exports:

- `createDataCorrectionQueryBackedLowLevelWriters(options)`
- `createDataCorrectionQueryBackedPersistenceWriters(options)`
- `QUERY_BACKED_WRITER_BINDINGS`

The adapter imports only:

- `./dataCorrectionPersistenceWriters`
- `./dataCorrectionPersistenceQueryExecutor`

The query-backed low-level writers call:

```js
executeDataCorrectionPersistenceQuery({ writerType, payload }, options)
```

The query-backed high-level writer set exposes the same downstream writer names used by Data Correction services:

- `auditWriter`
- `contactLogWriter`
- `dispatchNoteWriter`
- `engineerNotificationWriter`
- `appointmentResultWriter`
- `evidenceWriter`
- `followUpDraftWriter`
- `correctionWriter`

## WriterType Mapping

Low-level writer bindings:

- `auditPersistenceWriter` -> `audit`
- `contactLogPersistenceWriter` -> `contact_log`
- `dispatchNotePersistenceWriter` -> `dispatch_note`
- `engineerNotificationIntentPersistenceWriter` -> `engineer_notification_intent`
- `appointmentResultPersistenceWriter` -> `appointment_result`
- `evidencePersistenceWriter` -> `evidence`
- `followUpDraftPersistenceWriter` -> `follow_up_draft`
- `correctionApplicationPersistenceWriter` -> `correction_application`

High-level writer bindings:

- `auditWriter` -> `auditPersistenceWriter`
- `contactLogWriter` -> `contactLogPersistenceWriter`
- `dispatchNoteWriter` -> `dispatchNotePersistenceWriter`
- `engineerNotificationWriter` -> `engineerNotificationIntentPersistenceWriter`
- `appointmentResultWriter` -> `appointmentResultPersistenceWriter`
- `evidenceWriter` -> `evidencePersistenceWriter`
- `followUpDraftWriter` -> `followUpDraftPersistenceWriter`
- `correctionWriter` -> `correctionApplicationPersistenceWriter`

## Executable / Non-executable Behavior

Task675 query specs remain `executable: false` by default, and Task676 preserves that boundary.

Task677 preserves the same behavior:

- default behavior: non-executable specs fail closed and do not call the injected executor.
- `allowNonExecutableForTest: true`: permits only synthetic unit-test executor calls.
- executor throw: safe failure.
- malformed executor result: safe failure.
- successful executor result: safe persisted result.

`allowNonExecutableForTest` is not runtime authorization for real SQL.

## Safety Boundaries

Task677 does not:

- connect to DB.
- execute SQL.
- add migration or schema.
- add repository code.
- change routes, controllers, app, or server wiring.
- create real audit log, contact log, dispatch note, engineer notification, appointment result, evidence, follow-up, or correction application records.
- send LINE, SMS, App push, Email, provider, AI, RAG, or notification traffic.
- change admin frontend.
- modify guardrails, design docs, README, task index, or smoke tests.

Future DB/repository work must separately approve executable specs, real DB clients, concrete tables, migrations, transaction handling, permission runtime, and real audit log boundaries.

## Unit Test Coverage

Added `tests/dataCorrection/dataCorrectionQueryBackedPersistenceWriters.unit.test.js`.

Coverage verifies:

- exported query-backed factory functions.
- low-level writer set contains all expected low-level writer functions.
- high-level writer set contains all expected downstream writer functions.
- default non-executable specs do not call the executor and return safe failure.
- synthetic `allowNonExecutableForTest` path can call the injected executor.
- audit high-level writer reaches executor with writer type `audit`.
- correction high-level writer reaches executor with writer type `correction_application`.
- contact, dispatch, follow-up, appointment, evidence, and engineer notification paths map to the correct writer types.
- executor throw returns safe failure without raw error leakage.
- executor malformed result returns safe failure.
- unsafe payload is sanitized before executor.
- executor does not receive raw phone, address, LINE id, token, secret, database URL, or final appointment id.
- high-level writer set is compatible with the downstream writer contract shape.
- input payload is not mutated.
- executor object is not mutated.
- no logging side effects.
- module import boundary avoids DB, repository, provider, AI, route, controller, app, and server imports.

## Verification

Executed verification commands:

- `node --check src/dataCorrection/dataCorrectionQueryBackedPersistenceWriters.js`: PASS
- `node --test tests/dataCorrection/dataCorrectionQueryBackedPersistenceWriters.unit.test.js`: PASS (17 passed / 0 failed)

`git diff --check` is expected to be run after this document is added.

## Future Tasks

- Add repository-backed persistence only in a separately scoped DB/repository task.
- Decide concrete tables and migrations before making any query spec executable.
- Add permission and real audit writer integration before runtime persistence.
- Add transaction and rollback behavior after DB schema and repository scope are approved.
- Add integration/smoke coverage only after real persistence and permission/audit boundaries are approved.
