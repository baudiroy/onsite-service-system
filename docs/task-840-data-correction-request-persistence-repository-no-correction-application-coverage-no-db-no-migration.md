# Task 840 - Data Correction Request Persistence Repository No Correction Application Coverage / No DB / No Migration

## Scope

Strengthen persistence shortcut coverage so `data_correction_request` writes only governance/manual-handling records through the repository shortcut and never writes a `correction_application` record.

This is a bounded runtime test hardening task. It does not connect to a database, execute SQL, add a migration, add a route, change API shape, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added `createApp` repository-shortcut coverage for post-departure `data_correction_request`, asserting the captured record types are `audit`, `contact_log`, and `dispatch_note`.
- Added `createServerBootstrap` repository-shortcut coverage for the same path.
- Asserted `correction_application` is not produced by `data_correction_request`.

## Guardrails

- `data_correction_request` remains governance/request-only and does not apply official data corrections.
- Official correction application remains limited to the pre-departure apply path.
- No DB schema, migration, provider, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.

## Verification

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` - PASS, 68 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 608 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1880 passed / 0 failed.
- `git diff --check` - PASS.
