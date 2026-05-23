# Task661 - Data Correction Governance Route Skeleton and Unit Tests / No DB / No App Mount

## Scope

Task661 adds a route module skeleton for Data Correction / Amendment Governance.

This task intentionally does not mount the route into the app or route index. It only provides a reusable route registration module for a future approved API wiring task.

## Added Route Module

`src/routes/dataCorrectionRoutes.js`

Exports:

- `DATA_CORRECTION_GOVERNANCE_ROUTE_PATH`
- `registerDataCorrectionRoutes(router, options)`

Route path:

- `POST /data-correction/governance`

The route module imports only:

- `../controllers/dataCorrectionController`

## Route Behavior

`registerDataCorrectionRoutes(router, options)`:

- accepts a caller-provided router;
- safe no-ops if router is missing or does not expose `.post`;
- creates a controller handler through `createDataCorrectionGovernanceHandler(options)`;
- registers `router.post(DATA_CORRECTION_GOVERNANCE_ROUTE_PATH, handler)`;
- passes injected options through to the controller.

The route module does not create auth middleware, permission runtime, DB clients, writers, providers, or AI/RAG integrations.

## Tests

Added:

- `tests/dataCorrection/dataCorrectionRoutes.unit.test.js`

Coverage includes:

- Route constant and registration export.
- Route path equals `/data-correction/governance`.
- Registers one `POST` handler on a synthetic router.
- Missing/invalid router safe no-op.
- Registered handler is callable.
- Missing auth returns generic `403`.
- Pre-departure apply request with injected correction writer returns safe `200`.
- Phone correction returns re-verification safe response and does not expose raw phone.
- Post-departure freeze request with injected writers returns safe manual handling response.
- Response excludes raw phone / raw address / raw LINE id.
- Response excludes token / secret / DB URL / internal note / audit raw / AI raw / finalAppointmentId.
- Route source imports only the controller and has no DB / repository / provider / AI / app / server imports.
- No server bootstrap or app listen behavior.

## Non-goals

Task661 does not:

- Modify route index.
- Mount the route into app/server.
- Add live API surface to the running app.
- Add DB queries, repositories, transactions, migrations, or schema.
- Add real permission middleware.
- Add real persistence.
- Add real audit log, contact log, dispatch note, appointment result, or follow-up draft writers.
- Add Engineer Mobile, dispatch UI, or admin UI.
- Send LINE, SMS, Email, App push, AI calls, or provider notifications.
- Add smoke tests.
- Touch shared runtime or production data.

## Future Tasks

Recommended follow-up tasks:

1. Add explicit route index/app mount only after permission and live API scope approval.
2. Add real permission middleware integration.
3. Add repository-backed persistence for selected actions.
4. Add integration and smoke coverage once live API and DB slices are approved.
