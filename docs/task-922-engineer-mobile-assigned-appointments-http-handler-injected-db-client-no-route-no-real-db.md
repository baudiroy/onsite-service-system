# Task 922 - Engineer Mobile Assigned Appointments HTTP Handler / Injected DB Client / No Route No Real DB

Status: completed

## Goal

Add a thin HTTP-like handler around Task921 `getEngineerAssignedAppointmentsProjection` for Engineer Mobile assigned appointments.

This is not a production route and does not add route registration, app/server/bootstrap/listen behavior, auth runtime, real DB connection, repository, DB migration, provider sending, AI/RAG, billing/settlement, admin UI, smoke/shared runtime, staging, or commit.

## Modified Files

- `src/engineerMobile/engineerAssignedAppointmentsProjectionHandler.js`
- `tests/engineerMobile/engineerAssignedAppointmentsProjectionHandler.http-behavior.unit.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentsProjectionHandlerClosure.static.test.js`
- `docs/task-922-engineer-mobile-assigned-appointments-http-handler-injected-db-client-no-route-no-real-db.md`

No `admin/src/`, `README.md`, `migrations/`, route/controller/bootstrap/server/listen files, auth/session/JWT runtime files, real DB/repository/transaction files, provider files, AI/RAG/vector/search files, billing/settlement files, package/env/config/credential files, smoke/shared runtime infrastructure, Customer Access Task908-Task920 files, staging, or commit was modified for Task922.

## Implementation Summary

Added:

- `handleEngineerAssignedAppointmentsProjectionRequest({ request, dbClient })`
- `createEngineerAssignedAppointmentsProjectionHandler({ dbClient })`

The handler:

- requires an injected synthetic `dbClient`;
- requires pre-resolved `request.engineerContext`;
- extracts only safe query params: `dateFrom`, `dateTo`, and `status`;
- validates unsafe date/status filters and fails closed before query;
- delegates projection and scoping to Task921 service;
- returns HTTP-like `200` only for allowed projection;
- returns generic safe-deny/unavailable `404` for missing DB client, missing/invalid/unauthorized context, invalid filters, query error, scope mismatch, and unavailable results;
- supports a synthetic `res.status(...).json(...)` style response without registering a route;
- returns a synthetic response object when no `res` is provided.

## Preserved Boundaries

- No Route.
- No production route registration.
- No public/mobile API rollout.
- No app/server/bootstrap/listen edit.
- No real DB connection.
- No repository.
- No auth/session/JWT.
- No migration.
- No psql.
- No `npm run db:migrate`.
- No DDL/SQL dry-run/apply.
- No provider sending.
- No AI/RAG.
- No billing/settlement.
- No smoke/shared runtime.
- No workflow actions such as start travel, arrival, completion, report creation, or report publish.
- No Case / Appointment / Field Service Report / Completion Report / customer identity / provider state / `finalAppointmentId` mutation.

## Sensitive Field Exclusion

The handler does not build projection rows itself and relies on Task921's allowlist boundary. Handler tests verify no leakage of:

- raw phone / mobile / tel;
- raw address;
- LINE user id;
- provider raw payload;
- auth token/header/cookie;
- internal notes;
- dispatcher notes;
- technician private notes;
- billing / settlement internals;
- AI raw payload;
- SQL;
- stack traces;
- DB URL / connection string;
- token / secret / password / API key;
- `finalAppointmentId`;
- Field Service Report / Completion Report raw ids;
- raw DB rows or full payloads.

## Coverage

The unit and static tests verify:

- missing injected `dbClient` fails closed;
- missing or invalid `engineerContext` fails closed before query;
- query throw returns generic safe-deny without raw error leakage;
- valid authorized synthetic request returns Task921 allowlist projection;
- invalid date/status filters fail closed before query;
- handler factory writes synthetic `res.status(...).json(...)`;
- handler can return a synthetic response object when no `res` is provided;
- request context and DB row objects are not mutated;
- handler imports only Task921 service;
- handler does not duplicate projection filtering;
- handler has no route registration, listen, server, app, route, controller, real DB, repository, transaction, auth/session/JWT, provider, AI/RAG, billing, env/config/credential/logger/network, smoke, or migration dependency;
- handler contains no insert/update/delete/approve/publish or official mutation path.

## Verification

Commands to run:

```bash
node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionHandler.http-behavior.unit.test.js
node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionHandlerClosure.static.test.js
node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js
node --test tests/engineerMobile/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/engineerMobile tests/engineerMobile docs/task-922-engineer-mobile-assigned-appointments-http-handler-injected-db-client-no-route-no-real-db.md
```

Current results:

- `node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionHandler.http-behavior.unit.test.js`: PASS, 8/8.
- `node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionHandlerClosure.static.test.js`: PASS, 5/5.
- `node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js`: PASS, 12/12.
- `node --test tests/engineerMobile/*.js`: PASS, 639/639.
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS, 3008/3008.
- `git diff --check -- src/engineerMobile tests/engineerMobile docs/task-922-engineer-mobile-assigned-appointments-http-handler-injected-db-client-no-route-no-real-db.md`: PASS.
