# Task 843 - Data Correction Request Query Executor Failure Safety Coverage / No DB / No Migration

## Scope

Strengthen `data_correction_request` failure coverage for the persistence repository shortcut when the repository is built with the `queryExecutor` alias.

This is a bounded runtime test hardening task. It does not connect to a database, execute SQL, add a migration, add a route, change API shape, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added `createApp` coverage for `data_correction_request` through a `queryExecutor`-backed async persistence repository whose executor rejects.
- Added `createServerBootstrap` coverage for the same failure path.
- Asserted writer failures are represented through safe failed writer results for `audit`, `contact_log`, and `dispatch_note`.
- Asserted the failure path does not produce `correction_application` records and does not leak raw executor errors or sensitive values.

## Guardrails

- `data_correction_request` remains governance/request-only and does not apply official data corrections.
- Official correction application remains limited to the pre-departure apply path.
- Query-executor failure handling remains safe and bounded to writer result metadata.
- No DB schema, migration, provider, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.

## Verification

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` - PASS, 74 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 614 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1886 passed / 0 failed.
- `git diff --check` - PASS.
