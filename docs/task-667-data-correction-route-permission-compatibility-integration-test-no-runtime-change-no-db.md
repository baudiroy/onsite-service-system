# Task 667 - Data Correction Route Permission Compatibility Integration Test / No Runtime Change / No DB

## Scope

Task667 adds permission compatibility integration coverage after Task666 wired the Data Correction permission middleware into the governance route stack.

This task changes tests and task documentation only. It does not modify runtime source.

## Test Purpose

The integration test verifies that the permission-protected data correction route still works through:

- route index `createAppRouter({ dataCorrection })`
- app factory `createApp({ dataCorrection })`
- server factory `createServerBootstrap({ dataCorrection })`

No real server is started and no DB/provider/AI runtime is connected.

## Coverage Added

The integration test verifies:

- Route index mounted route includes permission middleware before controller handler.
- Missing auth is denied before writer calls.
- Missing permission is denied before writer calls.
- Valid `pre_departure_apply` with `case.correction.apply` reaches the orchestrator and calls `correctionWriter`.
- App factory path still supports valid pre-departure apply.
- App factory path denies missing permission before writer calls.
- Server bootstrap path supports mounted route behavior without calling `listen`.
- `options.app` priority still bypasses `dataCorrection` options.
- Engineer with `appointment.result.record` can submit `unable_to_complete_result`.
- Engineer cannot submit general pre-departure correction apply.
- AI role is denied through the mounted route.
- Phone correction with valid permission returns re-verification and does not call `correctionWriter`.
- Mounted responses redact raw phone, raw address, raw LINE id, token, secret, DB URL, internal note, AI raw payload, and `finalAppointmentId`.
- The integration test source imports only app, routes, server, and Node built-ins.

## Runtime / API / DB Decision

- Runtime source: no change.
- API: no new route; this verifies existing mounted route behavior.
- DB / migration: no change.
- Permission: skeleton middleware integration is tested only.
- Audit log: no real writer; injected test writers only.
- Engineer Mobile Workbench: no source change.
- LINE/SMS/App provider: no provider sending.
- AI/RAG/vector: no runtime.
- Smoke/browser: no change.

## Future Tasks

- Add real auth/permission service integration in a separate bounded runtime task.
- Add real audit/contact/dispatch/follow-up persistence after repository boundaries are approved.
- Add smoke coverage only after real persistence and permission service integration are approved.
- Preserve response redaction and writer-before-deny protections in future route/app/server tests.

## Verification

Planned verification commands:

- `node --test tests/dataCorrection/dataCorrectionPermissionCompatibility.integration.test.js`
- `git diff --check -- tests/dataCorrection/dataCorrectionPermissionCompatibility.integration.test.js docs/task-667-data-correction-route-permission-compatibility-integration-test-no-runtime-change-no-db.md`
