# Task 666 - Wire Data Correction Permission Middleware Into Route / No DB / No Real Writers

## Scope

Task666 wires the Task665 Data Correction permission middleware into the existing data correction route module.

This is a route middleware stack change only. The governance route remains the same endpoint and still uses injected writers only in tests or caller-provided options.

## Runtime Decision

- Route path remains `POST /data-correction/governance`.
- `registerDataCorrectionRoutes(router, options)` now registers:
  - permission middleware first
  - data correction governance controller handler second
- Permission middleware is created with `options.permission` when provided.
- Controller handler still receives the original `options` object.
- Writer injection behavior remains controller/orchestrator-owned and is not changed.
- Missing or invalid router remains safe no-op.

## Permission Boundary

- Permission checking is the Task665 input-auth skeleton only.
- Missing auth or missing required permission is denied before the controller handler and before writer calls.
- `engineer` can pass `unable_to_complete_result` with `appointment.result.record`.
- `engineer` cannot pass general correction apply by default.
- AI role is denied before controller/writer execution.
- Phone correction can pass the permission middleware when the caller has correction apply permission, but the controller/orchestrator still returns the phone re-verification result and does not call `correctionWriter`.

## Explicit Non-goals

- No route index change.
- No `src/app.js` or `src/server.js` change.
- No DB connection.
- No repository, transaction, or persistence integration.
- No migration or schema change.
- No real auth/permission service.
- No real audit/contact/dispatch/follow-up writer runtime.
- No provider, LINE, SMS, Email, App push, notification, AI, RAG, vector, or file storage runtime.
- No admin frontend change.
- No smoke, browser, fixture, package, guardrails, short-instruction, design-doc, task-index, README, DTO, or projection change.

## Coverage Added

The route permission middleware unit coverage verifies:

- Route registers `POST /data-correction/governance` with middleware plus handler.
- Route stack order is permission middleware before controller handler.
- Missing router safe no-op still works.
- Missing auth is denied before controller/writer.
- Missing permission is denied before controller/writer.
- Valid `data_correction_request` with `case.correction.request` passes and returns safe response.
- Valid `pre_departure_apply` with `case.correction.apply` passes and calls `correctionWriter`.
- Engineer with `appointment.result.record` can pass `unable_to_complete_result` and call `appointmentResultWriter`.
- Engineer cannot pass `pre_departure_apply` general correction.
- AI role is denied before controller/writer.
- Phone correction with valid permission returns re-verification and does not call `correctionWriter`.
- Denied response is generic and does not leak permission reason.
- Responses exclude raw phone, raw address, raw LINE id, token, secret, DB URL, internal note, AI raw payload, and `finalAppointmentId`.
- Route source imports only the controller and permission middleware, with no DB, repository, provider, AI, app, or server import.

## Future Tasks

- Connect this skeleton permission middleware to a real auth/permission service in a separate bounded task.
- Add real audit/contact/dispatch/follow-up persistence writers in separate bounded repository/service tasks.
- Add integration or smoke coverage only after real persistence and route-level permission behavior are approved.
- Keep Engineer Mobile Workbench and customer channel identity flows separate until explicitly scoped.
- Preserve phone re-verification before any phone/customer channel identity update.

## Verification

Planned verification commands:

- `node --check src/routes/dataCorrectionRoutes.js`
- `node --test tests/dataCorrection/dataCorrectionRoutePermissionMiddleware.unit.test.js`
- `git diff --check -- src/routes/dataCorrectionRoutes.js tests/dataCorrection/dataCorrectionRoutePermissionMiddleware.unit.test.js docs/task-666-wire-data-correction-permission-middleware-into-route-no-db-no-real-writers.md`
