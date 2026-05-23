# Task 788 — Data Correction Query Executor Precedence Coverage / No Runtime Change

## Scope

Add targeted coverage for the `queryExecutor` alias precedence introduced in Tasks 785 and 787.

This confirms that when both `executor` and `queryExecutor` are provided, the explicit `queryExecutor` path is used. The task is test-only and does not change runtime source.

## Changes

- Added direct persistence query executor coverage proving `queryExecutor` has priority over `executor`.
- Added factory-created persistence query executor coverage proving default and runtime override `queryExecutor` options have priority.
- Added sync query-backed writer coverage for `queryExecutor` priority.
- Added async query-backed writer coverage for `queryExecutor` priority.

## Guardrails

- No runtime source change, DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Tests use only synthetic injected executors.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPersistenceQueryExecutor.unit.test.js tests/dataCorrection/dataCorrectionQueryBackedPersistenceWriters.unit.test.js` — PASS, 46 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 556 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1828 passed / 0 failed.
- `git diff --check` — PASS.
