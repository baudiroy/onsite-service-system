# Task 783 — Data Correction Async Persistence Repository Shortcut Coverage / No Runtime Change

## Scope

Add coverage proving the Task 782 async persistence repository opt-in path works when passed through app/server `dataCorrectionRepository` shortcut options.

This task is test-only plus documentation. It does not change runtime behavior, does not open a database connection, and does not add or apply migrations.

## Changes

- Added app factory coverage for `createApp({ dataCorrectionRepository: repository })` where `repository` is a real `createDataCorrectionPersistenceRepository({ asyncWriters: true })` instance.
- Added server bootstrap coverage for `createServerBootstrap({ dataCorrectionRepository: repository })` with the same async persistence repository shape.
- Both tests use injected synthetic async executors and assert the async shortcut path records only safe query specs for the follow-up proposal path.

## Guardrails

- No runtime code change.
- No DB connection is opened; tests use injected synthetic executors only.
- No migration, schema, index, API contract, package script, provider sending, LINE/SMS/App push, AI/RAG, billing, settlement, or customer-visible behavior is introduced.
- Follow-up appointment handling remains a proposal/draft path and does not create a formal appointment.
- `finalAppointmentId` remains backend/system-determined and is stripped from outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js tests/dataCorrection/dataCorrectionPersistenceRepositoryE2E.integration.test.js` — PASS, 70 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 542 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1814 passed / 0 failed.
- `git diff --check` — PASS.
