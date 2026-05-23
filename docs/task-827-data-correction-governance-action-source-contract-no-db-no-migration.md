# Task 827 - Data Correction Governance Action Source Contract / No DB / No Migration

## Scope

Make the Data Correction governance orchestrator action source contract explicit and covered by targeted unit tests.

This is a bounded runtime source-contract hardening task. It does not connect to a database, execute SQL, add a migration, add a route, change HTTP behavior, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added `DATA_CORRECTION_GOVERNANCE_ACTION_SOURCE_PATHS` to `src/dataCorrection/dataCorrectionGovernanceOrchestrator.js`.
- The governance orchestrator action source contract is now frozen as:
  - `actionType`
  - `payload.actionType`
- Added unit coverage that payload fallback works while query/header action-like values are ignored.
- Added unit coverage that the action source contract is immutable.

## Guardrails

- Phone changes still require re-verification and cannot be applied through normal correction.
- Pre-departure, post-departure, unable-to-complete, and follow-up governance behavior remains unchanged.
- No new API surface, DB schema, migration, index, permission bypass, customer channel behavior, or notification behavior is introduced.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.
- The orchestrator import boundary still excludes DB, repository, provider, notification, AI, RAG, or vector dependencies.

## Verification

- `node --test tests/dataCorrection/dataCorrectionGovernanceOrchestrator.unit.test.js` - PASS, 24 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 589 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1861 passed / 0 failed.
- `git diff --check` - PASS.
