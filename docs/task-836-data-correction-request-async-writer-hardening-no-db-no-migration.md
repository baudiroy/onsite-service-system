# Task 836 - Data Correction Request Async Writer Hardening / No DB / No Migration

## Scope

Harden `data_correction_request` so async audit/contact/dispatch-note writers are awaited when the controller is created with async writer options.

This is a bounded runtime hardening task. It does not connect to a database, execute SQL, add a migration, add a route, change the public API shape, or introduce customer notification, AI, billing, settlement, LINE/SMS/App push, or shared runtime side effects.

## Changes

- Added `processDataCorrectionRequestAsync` in `src/dataCorrection/dataCorrectionRequestService.js`.
- Updated the governance orchestrator async path to route `data_correction_request` through the async request service.
- Updated the governance writer-backed action order to include `data_correction_request` because it may write audit/contact/dispatch-note records.
- Updated the controller async action contract and handler routing so `data_correction_request` uses the async handler when async audit/contact/dispatch-note writers are injected.
- Added unit coverage for:
  - async request service writer awaiting,
  - async governance request writer awaiting,
  - controller handler awaiting async request writers,
  - updated action parity.

## Guardrails

- `data_correction_request` still does not apply official data corrections by itself.
- Phone changes still require re-verification.
- Async writer support is limited to existing injected writers; no DB schema, migration, provider, notification, customer channel, AI/RAG, billing, or settlement behavior is introduced.
- `finalAppointmentId` remains backend/system-determined and is stripped from safe outputs.
- This task supersedes the earlier narrow assumption that `data_correction_request` is outside the writer-backed async contract. It remains outside official correction application, but it is writer-backed for audit/contact/dispatch-note persistence.

## Verification

- `node --test tests/dataCorrection/dataCorrectionRequestService.unit.test.js tests/dataCorrection/dataCorrectionGovernanceOrchestrator.unit.test.js tests/dataCorrection/dataCorrectionController.unit.test.js tests/dataCorrection/dataCorrectionActionContractParity.unit.test.js` - PASS, 81 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` - PASS, 601 passed / 0 failed.
- `npm run check` - PASS.
- `find tests -type f -name '*.js' -exec node --test {} +` - PASS, 1873 passed / 0 failed.
- `git diff --check` - PASS.
