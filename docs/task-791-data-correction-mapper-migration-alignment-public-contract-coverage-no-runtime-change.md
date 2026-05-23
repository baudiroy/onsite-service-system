# Task 791 — Data Correction Mapper / Migration Alignment Public Contract Coverage / No Runtime Change

## Scope

Update the Data Correction mapper / migration alignment coverage to consume the public persistence mapper constants introduced in Tasks 789 and 790.

This is test-only and documentation-only. It does not change runtime source, connect to a database, execute SQL, or add a migration.

## Changes

- Updated mapper / migration alignment tests to use `DATA_CORRECTION_PERSISTENCE_TABLE_HINTS` instead of a duplicated local table mapping.
- Added alignment coverage for `DATA_CORRECTION_PERSISTENCE_QUERY_NAME`.
- Kept the existing static migration and proposal checks as no-DB, no-DDL coverage.

## Guardrails

- No runtime source change, DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- Migration 021 remains an authoring-only artifact and is not applied or dry-run.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPersistenceMapperMigrationAlignment.static.test.js` — PASS, 7 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 559 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1831 passed / 0 failed.
- `git diff --check` — PASS.
