# Task1880 Customer-facing Report Route / Safe Deny / No Raw Case Data

## Scope

Task1880 adds a customer-facing report route boundary that uses the existing customer access middleware and resolver gate before returning a filtered service report projection.

The route is bounded to synthetic/injected dependency tests. It does not run a real DB, migration, runtime server, Zeabur deploy, smoke test, provider call, AI/RAG call, or billing call.

## Files changed

- `src/customerAccess/customerAccessContextMiddleware.js`
- `src/customerAccess/customerAccessRouteRegistry.js`
- `src/routes/customerAccessRoutes.js`
- `tests/customerAccess/customerAccessRoutes.unit.test.js`
- `tests/customerAccess/customerAccessRouteRegistry.unit.test.js`
- `tests/customerAccess/customerAccessRouteMiddlewareIntegration.unit.test.js`
- `tests/customerAccess/customerAccessResolverRuntimeWiring.static.test.js`
- `tests/customerAccess/customerAccessModuleImportBoundary.static.test.js`
- `tests/customerAccess/customerAccessRouteDbAdapterOptions.unit.test.js`
- `tests/customerAccess/customerAccessRouteDbExecutorIntegration.unit.test.js`
- `tests/customerAccess/customerAccessRouteQueryExecutorIntegration.unit.test.js`
- `docs/task-1880-customer-facing-report-route-safe-deny-no-raw-case-data.md`

## Route boundary

New route:

- Method: `GET`
- Path: `/customer-access/:caseId/service-report/:reportId`

Existing route preserved:

- Method: `GET`
- Path: `/customer-access/:caseId`

## Behavior

- The report route runs `customerAccessContextMiddleware` first.
- The report route checks the existing customer access controller/resolver envelope before calling projection.
- Denied, missing, invalid, organization-mismatched, unpublished, or unconfigured DB cases return the generic safe-deny envelope.
- Allowed synthetic cases call the filtered projection handler and return only the projection service DTO.
- The route does not return raw Case, Appointment, Completion Report, FSR, or DB rows.

## Safety boundaries

- No real DB connection.
- No `DATABASE_URL` usage.
- No migration.
- No seed.
- No runtime server start.
- No customer-visible publication smoke.
- No provider sending.
- No AI/RAG execution.
- No billing execution.
- No Completion Report / FSR creation, approval, publication, or mutation.
- No `finalAppointmentId` mutation.
- No admin frontend changes.
- No Zeabur changes.
- No secrets printed.
