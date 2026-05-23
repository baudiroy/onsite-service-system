# Task 782 — Data Correction Async Persistence Repository Opt-in / No DB / No Migration

## Scope

Add an opt-in async persistence repository path for Data Correction writers. This allows the repository shortcut to expose awaitable writer methods when future runtime code uses async query executors, while preserving the existing synchronous default.

This task does not open a database connection, does not apply or dry-run migrations, and does not change API behavior outside the explicit opt-in writer construction path.

## Changes

- Added `asyncWriters: true` / `useAsyncWriters: true` opt-in support to `createDataCorrectionPersistenceRepository`.
- Kept the default repository writer set synchronous.
- Reused the async query-backed persistence writer factory from Task 781 when async writers are explicitly requested.
- Added unit coverage proving async repository methods await async executors.
- Added unit coverage proving `useAsyncWriters` returns an app-compatible async writer set.
- Added E2E coverage proving an async repository writer set can pass through the mounted Data Correction app route.

## Guardrails

- No DB connection is opened; tests use injected synthetic executors only.
- No migration, schema, index, package script, or smoke script is added.
- Phone changes still cannot be applied through the normal correction path and must use re-verification.
- Follow-up appointment handling remains a proposal/draft path and does not create a formal appointment.
- Unable-to-complete remains an appointment result path and does not create a Field Service Report.
- `finalAppointmentId` remains backend/system-determined and is stripped from outputs.
- No LINE/SMS/App push, provider sending, AI/RAG, customer-visible expansion, billing, settlement, or formal appointment runtime is introduced.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPersistenceRepository.unit.test.js tests/dataCorrection/dataCorrectionPersistenceRepositoryE2E.integration.test.js tests/dataCorrection/dataCorrectionQueryBackedPersistenceWritersSyncContract.unit.test.js` — PASS, 44 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 540 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1812 passed / 0 failed.
- `git diff --check` — PASS.
