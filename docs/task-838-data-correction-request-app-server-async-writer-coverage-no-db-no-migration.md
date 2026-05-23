# Task 838 - Data Correction Request App/Server Async Writer Coverage / No DB / No Migration

## Scope

Add app/server shortcut coverage for `data_correction_request` after Task 836 moved request actions into the async writer-backed path.

This is a bounded runtime test hardening task. It does not connect to a database, execute SQL, add a migration, add a route, change API shape, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added `createApp` coverage that `data_correction_request` awaits async contact-log, dispatch-note, and audit writers through the `dataCorrectionWriterSet` shortcut.
- Added `createServerBootstrap` coverage for the same async request writer path.
- Verified the request remains a safe governance response and does not apply official correction data.

## Guardrails

- `data_correction_request` remains a request/governance action, not an official data mutation action.
- Post-departure request handling remains manual-contact oriented.
- Async writer support is limited to existing injected writers; no DB schema, migration, provider, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.

## Verification

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` - PASS, 66 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 606 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1878 passed / 0 failed.
- `git diff --check` - PASS.
