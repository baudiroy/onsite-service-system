# Task 839 - Data Correction Request Does Not Apply Correction Through App/Server / No DB / No Migration

## Scope

Strengthen app/server shortcut coverage so `data_correction_request` cannot be accidentally routed into the official correction writer when both request writers and `correctionWriter` are available.

This is a bounded runtime test hardening task. It does not connect to a database, execute SQL, add a migration, add a route, change API shape, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Updated `createApp` async request-writer shortcut coverage to inject `correctionWriter` and assert it is not called by `data_correction_request`.
- Updated `createServerBootstrap` async request-writer shortcut coverage with the same non-application assertion.

## Guardrails

- `data_correction_request` remains governance/request-only and does not apply official data corrections.
- Phone changes still require re-verification.
- Official correction application remains limited to the pre-departure apply path.
- No DB schema, migration, provider, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.

## Verification

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` - PASS, 66 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 606 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1878 passed / 0 failed.
- `git diff --check` - PASS.
