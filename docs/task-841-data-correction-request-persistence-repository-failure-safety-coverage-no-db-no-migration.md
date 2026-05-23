# Task 841 - Data Correction Request Persistence Repository Failure Safety Coverage / No DB / No Migration

## Scope

Strengthen `data_correction_request` repository-shortcut failure coverage.

This is a bounded runtime test hardening task. It does not connect to a database, execute SQL, add a migration, add a route, change API shape, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added `createApp` coverage for `data_correction_request` when the injected async persistence repository executor rejects.
- Added `createServerBootstrap` coverage for the same failure path.
- Asserted the failed request path still attempts only `audit`, `contact_log`, and `dispatch_note` governance records.
- Asserted `correction_application` is not produced on writer failure.
- Asserted writer failures remain safe and do not leak raw error text or sensitive values.

## Guardrails

- `data_correction_request` remains governance/request-only and does not apply official data corrections.
- Official correction application remains limited to the pre-departure apply path.
- Repository writer failure is surfaced through safe writer result metadata, not raw executor errors.
- No DB schema, migration, provider, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.

## Verification

- `node --test tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js` - PASS, 70 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 610 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1882 passed / 0 failed.
- `git diff --check` - PASS.
