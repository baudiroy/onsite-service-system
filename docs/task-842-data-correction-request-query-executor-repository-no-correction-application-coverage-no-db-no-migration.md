# Task 842 - Data Correction Request Query Executor Repository No Correction Application Coverage / No DB / No Migration

## Scope

Strengthen `data_correction_request` coverage for the persistence repository shortcut when the repository is built with the `queryExecutor` alias.

This is a bounded runtime test hardening task. It does not connect to a database, execute SQL, add a migration, add a route, change API shape, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added `createApp` coverage for `data_correction_request` through an async persistence repository using `queryExecutor`.
- Added `createServerBootstrap` coverage for the same `queryExecutor` shortcut path.
- Asserted the query-executor repository path writes only `audit`, `contact_log`, and `dispatch_note` governance records.
- Asserted `correction_application` is not produced by the request-only path.

## Guardrails

- `data_correction_request` remains governance/request-only and does not apply official data corrections.
- Official correction application remains limited to the pre-departure apply path.
- The `queryExecutor` alias remains wiring-compatible with the repository shortcut without changing DB, API, migration, or notification behavior.

## Verification

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` - PASS, 72 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 612 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1884 passed / 0 failed.
- `git diff --check` - PASS.
