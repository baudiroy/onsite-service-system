# Task 926 - Engineer Mobile Assigned Appointment Detail HTTP Handler / Injected DB Client / No Route No Workflow

Status: completed

## Goal

Add a thin HTTP-like handler around Task925 `getEngineerAssignedAppointmentDetailProjection`.

This continues the Engineer Mobile read-only detail pattern:

```text
detail projection service -> HTTP-like handler
```

No production route, public/mobile API rollout, production app/server/bootstrap/listen edit, real DB connection, repository, transaction, auth/session/JWT runtime, migration, provider sending, AI/RAG, billing/settlement, smoke/shared runtime, workflow action, staging, or commit is added.

## Modified Files

- `src/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler.js`
- `tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler.http-behavior.unit.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandlerClosure.static.test.js`
- `docs/task-926-engineer-mobile-assigned-appointment-detail-http-handler-injected-db-client-no-route-no-workflow.md`

No `admin/src/`, `README.md`, `migrations/`, production route/controller/bootstrap/server/listen files, auth/session/JWT runtime files, real DB/repository/transaction files, provider files, AI/RAG/vector/search files, billing/settlement files, package/env/config/credential files, smoke/shared runtime infrastructure, Customer Access Task908-Task920 files, staging, or commit was modified for Task926.

## Implementation Summary

Added:

- `handleEngineerAssignedAppointmentDetailProjectionRequest({ request, dbClient })`
- `createEngineerAssignedAppointmentDetailProjectionHandler({ dbClient })`

The handler:

- requires injected synthetic `dbClient`;
- requires pre-resolved `request.engineerContext`;
- extracts only safe `request.params.appointmentId`;
- ignores body/query appointment ids;
- delegates to Task925 `getEngineerAssignedAppointmentDetailProjection`;
- returns HTTP-like `200` only for allowed detail projection;
- returns generic safe-deny/unavailable for missing DB client, missing/invalid context, missing/invalid appointment id, unauthorized context, query error, org mismatch, engineer mismatch, or not found;
- supports synthetic `res.status(...).json(...)`;
- never registers a route or calls `listen`;
- does not mutate request, context, rows, Case, Appointment, Field Service Report, Completion Report, or `finalAppointmentId`.

## Preserved Boundaries

- No Route.
- No Workflow.
- No production route registration.
- No public/mobile API rollout.
- No app/server/bootstrap/listen edit.
- No real DB connection.
- No repository.
- No transaction.
- No auth/session/JWT runtime.
- No migration.
- No psql.
- No `npm run db:migrate`.
- No DDL/SQL dry-run/apply.
- No provider sending.
- No AI/RAG.
- No billing/settlement.
- No smoke/shared runtime.
- No check-in/start travel/arrival/completion/report creation/report publish.
- No Case / Appointment / FSR / Completion Report / customer identity / provider state / `finalAppointmentId` mutation.
- No `finalAppointmentId` exposure.

## Coverage

The HTTP behavior and static tests verify:

- handler requires injected `dbClient`;
- handler requires pre-resolved engineer context;
- handler extracts only safe `appointmentId`;
- invalid appointment ids fail closed before query;
- handler delegates to Task925 service and does not duplicate detail projection filtering;
- missing DB client fails closed;
- missing/invalid/unauthorized context fails closed;
- query/service error fails closed without raw error leakage;
- valid authorized synthetic request returns Task925 allowlist detail projection;
- wrong scope and not found return generic safe-deny;
- synthetic response object and `res.status().json()` paths both work;
- request context and DB row are not mutated;
- source imports no route/server/app/listen/bootstrap, real DB/repository/transaction, auth/JWT/session, provider, AI/RAG, billing, env/config/credential/logger/network, smoke, migration, or admin dependency;
- no workflow action is implemented.

## Verification

Commands to run:

```bash
node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler.http-behavior.unit.test.js
node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandlerClosure.static.test.js
node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js
node --test tests/engineerMobile/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/engineerMobile tests/engineerMobile docs/task-926-engineer-mobile-assigned-appointment-detail-http-handler-injected-db-client-no-route-no-workflow.md
```

Current results:

- `node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler.http-behavior.unit.test.js`: PASS, 9/9.
- `node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandlerClosure.static.test.js`: PASS, 5/5.
- `node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js`: PASS, 13/13.
- `node --test tests/engineerMobile/*.js`: PASS, 694/694.
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS, 3063/3063.
- `git diff --check -- src/engineerMobile tests/engineerMobile docs/task-926-engineer-mobile-assigned-appointment-detail-http-handler-injected-db-client-no-route-no-workflow.md`: PASS.
