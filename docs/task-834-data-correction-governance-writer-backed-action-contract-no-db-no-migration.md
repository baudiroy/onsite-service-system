# Task 834 - Data Correction Governance Writer-backed Action Contract / No DB / No Migration

## Scope

Expose and cover a frozen governance-layer writer-backed action contract for Data Correction.

This is a bounded runtime contract task. It does not connect to a database, execute SQL, add a migration, add a route, change HTTP behavior, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added `DATA_CORRECTION_GOVERNANCE_WRITER_BACKED_ACTION_ORDER` in `src/dataCorrection/dataCorrectionGovernanceOrchestrator.js`.
- Exported the frozen governance writer-backed action order.
- Updated governance orchestrator unit coverage for the new exported contract.
- Updated action parity coverage so controller async action order aligns with the governance writer-backed action order.

## Guardrails

- Governance behavior is unchanged.
- Writer-backed governance actions are explicitly:
  - `data_correction_request`
  - `follow_up_proposal`
  - `post_departure_freeze`
  - `pre_departure_apply`
  - `unable_to_complete_result`
- `data_correction_request` remains outside official correction application, but is writer-backed for audit/contact/dispatch-note persistence after Task 836.
- No DB schema, migration, API, permission, audit log, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.

## Verification

- `node --test tests/dataCorrection/dataCorrectionGovernanceOrchestrator.unit.test.js tests/dataCorrection/dataCorrectionActionContractParity.unit.test.js` - PASS, 27 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 598 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1870 passed / 0 failed.
- `git diff --check` - PASS.
