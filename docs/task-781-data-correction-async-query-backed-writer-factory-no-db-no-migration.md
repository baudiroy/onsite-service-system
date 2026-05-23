# Task 781 — Data Correction Async Query-backed Writer Factory / No DB / No Migration

## Scope

Add an explicit async query-backed Data Correction persistence writer factory that can be used by the async governance writer paths added in Tasks 776-779.

This task preserves the existing synchronous query-backed writer contract. The existing `createDataCorrectionQueryBackedPersistenceWriters` factory still returns plain objects synchronously and still rejects Promise-returning executors with `ASYNC_EXECUTOR_NOT_SUPPORTED`. The new async factory is opt-in.

No real DB connection, DB dry-run, migration apply, provider sending, AI/RAG, LINE/SMS, package scripts, or smoke scripts are introduced.

## Changes

- Added `executeDataCorrectionPersistenceQueryAsync` inside the query-backed writer adapter.
- Added `createDataCorrectionAsyncQueryBackedLowLevelWriters`.
- Added `createDataCorrectionAsyncQueryBackedPersistenceWriters`.
- Added unit coverage for async function executors, object executors with async `execute`, executor rejection, malformed executor results, sanitized query specs, and import boundaries.
- Added app-route E2E coverage proving the async query-backed writer set can pass through the Data Correction mounted route and async controller path.
- Kept the sync-contract test intact so the old sync writer factory remains a plain-object, non-Promise contract.

## Guardrails

- The async query-backed factory is opt-in and does not change existing app/server defaults.
- No DB connection is opened; all tests use injected synthetic executors.
- No migration is added or applied.
- Phone changes still require re-verification and cannot be applied through normal correction.
- Follow-up proposal remains a draft/proposal path and does not create a formal appointment.
- Unable-to-complete remains an appointment result path and does not create a Field Service Report.
- `finalAppointmentId` remains backend/system-determined and is stripped from outputs.
- No provider sending, AI/RAG, LINE/SMS, or customer-visible expansion is introduced.

## Verification

- `node --test tests/dataCorrection/dataCorrectionQueryBackedPersistenceWriters.unit.test.js tests/dataCorrection/dataCorrectionQueryBackedPersistenceWritersSyncContract.unit.test.js tests/dataCorrection/dataCorrectionQueryBackedWriterE2E.integration.test.js` — PASS, 50 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 537 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1809 passed / 0 failed.
- `git diff --check` — PASS.
