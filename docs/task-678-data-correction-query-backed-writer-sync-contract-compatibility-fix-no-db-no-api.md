# Task 678 — Data Correction Query-backed Writer Sync Contract Compatibility Fix / No DB / No API

## Scope

Task678 closes the pre-implementation blocker found after Task677: the query-backed persistence writers returned Promises, while existing Data Correction downstream services expect injected writer return values synchronously.

This task only updates the query-backed writer adapter and adds a focused unit test. It does not change DB, SQL execution, migrations, routes, controllers, app/server bootstrapping, provider sending, admin frontend, smoke tests, or runtime persistence.

## Decision

Query-backed writers must return plain objects synchronously:

- Success returns `{ ok: true, persisted: true, writerType, recordType }`.
- Safe failure returns `{ ok: false, persisted: false, writerType, recordType, reasonCode }`.
- Writers must never return a Promise to downstream services.

Task676's async query executor adapter remains unchanged as a future repository boundary. Task678 intentionally makes the Task677 query-backed writer adapter synchronous so it is compatible with current downstream service contracts.

## Synchronous Failure Rules

- Default non-executable query specs fail synchronously with `QUERY_SPEC_NOT_EXECUTABLE`.
- Default non-executable failure does not call the injected executor.
- `allowNonExecutableForTest` only permits a sync synthetic executor path for tests.
- Missing executor fails with `MISSING_EXECUTOR`.
- Executor throw fails with `EXECUTOR_FAILED`.
- Malformed executor result fails with `EXECUTOR_RESULT_MALFORMED`.
- Async / Promise executor results fail with `ASYNC_EXECUTOR_NOT_SUPPORTED`.

Async executors are rejected until a future explicit async persistence architecture task changes the downstream writer contract.

## Safety

The writer adapter builds the same sanitized query spec boundary used by the Task675 record mapper. It passes only cloned and frozen query specs to the injected executor, and does not echo raw executor payloads or raw error messages.

The focused unit test confirms the adapter does not expose raw phone/address/LINE id/token/secret/DB URL/finalAppointmentId values in query specs or safe failures.

## Downstream Compatibility

The new sync-contract test verifies `applyPreDepartureCorrection` behavior:

- Default non-executable query-backed correction writer is treated as writer failure, not success.
- Sync synthetic executor success is treated as recorded success.
- Phone correction still does not call the correction executor.

This preserves the current downstream contract while preparing a later bounded E2E compatibility test.

## Non-goals

- No real DB execution.
- No migration.
- No API change.
- No app/server/route/controller change.
- No repository/provider/AI/RAG import.
- No admin frontend change.
- No smoke test change.
- No Guardrails or design-doc change.
