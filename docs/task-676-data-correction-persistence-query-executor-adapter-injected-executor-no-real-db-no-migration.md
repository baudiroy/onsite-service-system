# Task 676 — Data Correction Persistence Query Executor Adapter / Injected Executor / No Real DB / No Migration

## Scope

Task676 adds a bounded Data Correction persistence query executor adapter.

This task is still a no-real-DB slice. It creates an injected-executor boundary around the Task675 non-executable query spec, but it does not connect to a database, execute real SQL, add migrations, alter schema, wire repositories, mount routes, or change API behavior.

## Files Changed

- Added `src/dataCorrection/dataCorrectionPersistenceQueryExecutor.js`
- Added `tests/dataCorrection/dataCorrectionPersistenceQueryExecutor.unit.test.js`
- Added `docs/task-676-data-correction-persistence-query-executor-adapter-injected-executor-no-real-db-no-migration.md`

## Runtime Decision

The new adapter exports:

- `executeDataCorrectionPersistenceQuery(input, options)`
- `createDataCorrectionPersistenceQueryExecutor(options)`

The adapter imports only `./dataCorrectionPersistenceRecordMapper` and uses `buildDataCorrectionPersistenceQuerySpec(input)` as its source of query specs.

## Executable / Non-executable Behavior

Task675 query specs are still `executable: false` by default.

Task676 preserves that boundary:

- default behavior: `executable:false` specs fail closed with `QUERY_SPEC_NOT_EXECUTABLE`.
- `allowNonExecutableForTest: true`: permits a synthetic unit-test executor path only.
- invalid mapped payloads fail closed before executor resolution.
- missing executor fails closed with `MISSING_EXECUTOR`.

`allowNonExecutableForTest` is not runtime authorization for real SQL. It exists only for synthetic unit tests around this adapter boundary.

## Injected Executor Behavior

Supported executor forms:

- function executor: `executor(querySpec)`
- object executor: `executor.execute(querySpec)`

The adapter sends a cloned and frozen query spec to the executor. The query spec contains static SQL with placeholders, ordered fields, ordered values, and params from the mapper.

Executor outcomes:

- successful executor result: must return an object with `ok: true`.
- executor throws: fail closed with `EXECUTOR_FAILED`.
- malformed result: fail closed with `EXECUTOR_RESULT_MALFORMED`.

Successful adapter output is intentionally minimal:

```js
{ ok: true, persisted: true, writerType, recordType }
```

Executor return payloads are not echoed, so raw phone, address, LINE id, tokens, secrets, database URLs, internal notes, audit dumps, AI raw payloads, and other sensitive values cannot leak through the adapter result.

## Safety Boundaries

Task676 does not:

- connect to DB.
- execute SQL.
- add migration or schema.
- add repository code.
- change routes, controllers, app, or server wiring.
- create real audit log, contact log, dispatch note, engineer notification, appointment result, evidence, follow-up, or correction application records.
- send LINE, SMS, App push, Email, provider, AI, RAG, or notification traffic.
- change admin frontend.
- modify guardrails, design docs, README, task index, or smoke tests.

Future DB/repository work must separately decide concrete tables, executable specs, transaction handling, permissions, audit log integration, and migration scope before a real executor is connected.

## Unit Test Coverage

Added `tests/dataCorrection/dataCorrectionPersistenceQueryExecutor.unit.test.js`.

Coverage verifies:

- exported factory/direct execution functions.
- invalid payload fail-closes and executor is not called.
- non-executable spec default fail-closes and executor is not called.
- synthetic `allowNonExecutableForTest` path can call the injected executor.
- missing executor fail-closes.
- function executor and object `.execute()` executor success paths.
- executor throw returns safe failure without raw error leakage.
- malformed executor result fail-closes.
- executor receives static parameterized query spec, fields, values, and params without raw SQL interpolation.
- adapter result does not expose raw phone, address, LINE id, token, secret, database URL, internal note, audit dump, AI raw payload, or final appointment id.
- input object is not mutated.
- executor object is not mutated by adapter setup.
- frozen query spec prevents executor mutation from changing adapter internals.
- no logging side effects.
- module import boundary avoids DB, repository, provider, AI, route, controller, app, and server imports.

## Verification

Executed verification commands:

- `node --check src/dataCorrection/dataCorrectionPersistenceQueryExecutor.js`: PASS
- `node --test tests/dataCorrection/dataCorrectionPersistenceQueryExecutor.unit.test.js`: PASS (16 passed / 0 failed)

`git diff --check` is expected to be run after this document is added.

## Future Tasks

- Add repository-backed persistence only in a separately scoped DB/repository task.
- Decide concrete tables and migrations before making any query spec executable.
- Add permission and real audit writer integration before runtime persistence.
- Add transaction and rollback behavior after DB schema and repository scope are approved.
- Add integration/smoke coverage only after real persistence and permission/audit boundaries are approved.
