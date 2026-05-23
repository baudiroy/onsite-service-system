# Task 786 — Data Correction Query Executor App/Server Shortcut Coverage / No Runtime Change

## Scope

Add coverage proving that a Data Correction persistence repository constructed with the `queryExecutor` alias can flow through the existing app and server `dataCorrectionRepository` shortcut wiring.

This is a test-only follow-up to Task 785. It does not change runtime behavior, API behavior, database schema, migrations, provider sending, or user-visible behavior.

## Changes

- Updated the app factory shortcut test helper so the synthetic async persistence repository can be built with either `executor` or `queryExecutor`.
- Added app factory coverage for a `queryExecutor`-backed async persistence repository passed through `dataCorrectionRepository`.
- Updated the server shortcut test helper the same way.
- Added server bootstrap coverage for a `queryExecutor`-backed async persistence repository passed through `dataCorrectionRepository`.

## Guardrails

- No DB connection is opened; tests use synthetic injected query executors only.
- No migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` — PASS, 62 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 550 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1822 passed / 0 failed.
- `git diff --check` — PASS.
