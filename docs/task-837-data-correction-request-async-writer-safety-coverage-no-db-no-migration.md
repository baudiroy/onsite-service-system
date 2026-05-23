# Task 837 - Data Correction Request Async Writer Safety Coverage / No DB / No Migration

## Scope

Add targeted coverage for `data_correction_request` async writer safety after Task 836 moved request actions into the async writer-backed path.

This is a bounded runtime test hardening task. It does not connect to a database, execute SQL, add a migration, add a route, change API shape, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added unit coverage that `processDataCorrectionRequestAsync` supports object writers with an async `write` method.
- Added unit coverage that async writer rejection returns a safe writer failure result without leaking raw error details.
- Added unit coverage that false writer results remain safe and do not leak raw writer payload details.

## Guardrails

- `data_correction_request` still does not apply official data corrections by itself.
- Phone changes still require re-verification.
- Async writer failure handling remains safe and generic.
- No DB schema, migration, provider, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.

## Verification

- `node --test tests/dataCorrection/dataCorrectionRequestService.unit.test.js` - PASS, 18 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 604 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1876 passed / 0 failed.
- `git diff --check` - PASS.
