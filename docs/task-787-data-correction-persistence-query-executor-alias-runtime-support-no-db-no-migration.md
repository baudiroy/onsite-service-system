# Task 787 — Data Correction Persistence Query Executor Alias Runtime Support / No DB / No Migration

## Scope

Extend the standalone Data Correction persistence query executor helper so it accepts `queryExecutor` as an alias for `executor`.

This keeps the direct helper aligned with the Task 785 query-backed writer and repository alias behavior. It does not add database connectivity, migrations, schema changes, API routes, provider sending, or customer-visible behavior.

## Changes

- Added a bounded option resolver in `dataCorrectionPersistenceQueryExecutor` that prefers `queryExecutor` when explicitly provided, otherwise falling back to `executor`.
- Updated the factory-created executor to accept `queryExecutor` at default construction time.
- Updated runtime override options so `queryExecutor` can override the default executor for a single call.
- Added direct execution coverage for `queryExecutor`.
- Added factory default and runtime override coverage for `queryExecutor`.

## Guardrails

- No DB connection is opened; tests use injected synthetic executors only.
- No migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- The helper still returns safe generic failure envelopes for missing, malformed, rejected, or throwing executors.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPersistenceQueryExecutor.unit.test.js` — PASS, 18 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 552 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1824 passed / 0 failed.
- `git diff --check` — PASS.
