# Task 828 - Data Correction Action Contract Parity / No DB / No Migration

## Scope

Keep the Data Correction governance action set aligned with the permission action set.

This is a bounded runtime source-contract and test hardening task. It does not connect to a database, execute SQL, add a migration, add a route, change HTTP behavior, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added `DATA_CORRECTION_GOVERNANCE_ACTION_ORDER` to `src/dataCorrection/dataCorrectionGovernanceOrchestrator.js`.
- Added unit coverage that the governance action order is immutable and matches `DATA_CORRECTION_GOVERNANCE_ACTIONS`.
- Added parity coverage that:
  - governance actions match permission actions,
  - governance action order matches permission action order as a set,
  - every governance action has a permission-map entry.

## Guardrails

- The governance action behavior is unchanged.
- The permission middleware remains the gate before controller/orchestrator execution.
- Phone changes still require re-verification and cannot be applied through normal correction.
- Post-departure changes remain manual-contact oriented.
- Unable-to-complete and follow-up flows remain source-data contracts only; no formal appointment or FSR creation is introduced.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionGovernanceOrchestrator.unit.test.js tests/dataCorrection/dataCorrectionActionContractParity.unit.test.js` - PASS, 26 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 591 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` - PASS, 1863 passed / 0 failed.
- `git diff --check` - PASS.
