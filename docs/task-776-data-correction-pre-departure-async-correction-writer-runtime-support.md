# Task 776 — Data Correction Pre-departure Async Correction Writer Runtime Support

## Scope

Add bounded runtime support for async pre-departure data correction writers used through the Data Correction governance route.

This task only affects the pre-departure correction writer path. It does not add DB access, migrations, provider sending, AI, RAG, LINE, SMS, package scripts, or smoke scripts.

## Changes

- Added `applyPreDepartureCorrectionAsync` while preserving the existing synchronous `applyPreDepartureCorrection` API.
- Added async governance orchestration via `runDataCorrectionGovernanceActionAsync`, routing only `pre_departure_apply` through the async pre-departure service.
- Added async controller response helpers and changed the route handler factory to await the async governance path.
- Added app/server/controller/orchestrator tests for async correction writer success and safe failure handling.
- Confirmed async writer failure maps to safe `dataCorrection.writerFailed` output without leaking raw error values.

## Guardrails

- Phone corrections still require re-verification and cannot be applied through the normal correction writer path.
- Pre-departure non-phone corrections still require organization scope, actor context, permissions, and safe field groups.
- No formal Field Service Report is created or mutated.
- `finalAppointmentId` remains backend/system-determined and is stripped from correction outputs.
- No DB connection, migration, provider sending, AI/RAG, LINE/SMS, or customer-visible expansion is introduced.

## Verification

- `node --test tests/dataCorrection/dataCorrectionController.unit.test.js tests/dataCorrection/dataCorrectionGovernanceOrchestrator.unit.test.js tests/dataCorrection/dataCorrectionAppFactoryOptions.unit.test.js tests/dataCorrection/dataCorrectionServerOptions.unit.test.js tests/dataCorrection/preDepartureCorrectionApplicationService.unit.test.js` — PASS, 89 passed / 0 failed.
- `node --test tests/dataCorrection/*.js` — PASS, 494 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1766 passed / 0 failed.
