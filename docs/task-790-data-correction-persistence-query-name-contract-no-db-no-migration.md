# Task 790 — Data Correction Persistence Query Name Contract / No DB / No Migration

## Scope

Expose the Data Correction persistence query spec name as a public constant and use it when building query specs.

This is a bounded runtime source change. It does not connect to a database, execute SQL, add a migration, or change persistence write behavior.

## Changes

- Added `DATA_CORRECTION_PERSISTENCE_QUERY_NAME`.
- Updated `buildDataCorrectionPersistenceQuerySpec` to use the exported query-name constant.
- Updated mapper coverage to assert the public query-name contract.

## Guardrails

- No DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Query specs remain non-executable by default.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPersistenceRecordMapper.unit.test.js` — PASS, 22 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 559 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1831 passed / 0 failed.
- `git diff --check` — PASS.
