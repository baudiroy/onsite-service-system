# Task 789 — Data Correction Persistence Record Mapper Public Metadata Constants / No DB / No Migration

## Scope

Expose the existing Data Correction persistence mapper metadata as public, immutable constants for future adapter, migration, and smoke alignment.

This is a bounded runtime source change. It does not connect to a database, execute SQL, add a migration, or change any persistence write behavior.

## Changes

- Exported `DATA_CORRECTION_PERSISTENCE_TABLE_HINTS` from the persistence record mapper.
- Exported `DATA_CORRECTION_APPOINTMENT_REQUIRED_RECORD_TYPES` from the persistence record mapper.
- Added coverage that table hints exist for every supported Data Correction persistence record type.
- Added coverage that appointment-required record types remain limited to appointment-scoped persistence records and exclude audit-only records.
- Added immutability coverage for the exported metadata constants.

## Guardrails

- No DB connection, migration, schema, index, API route, package script, LINE/SMS/App push, AI/RAG, billing, settlement, customer-visible behavior, or shared runtime behavior is introduced.
- The exported constants are derived from existing mapper metadata only.
- Phone changes still require re-verification and cannot be applied through normal correction.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.
- Data Correction persistence remains opt-in and non-executing unless an injected executor is explicitly supplied by future bounded work.

## Verification

- `node --test tests/dataCorrection/dataCorrectionPersistenceRecordMapper.unit.test.js` — PASS, 22 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 559 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1831 passed / 0 failed.
- `git diff --check` — PASS.
