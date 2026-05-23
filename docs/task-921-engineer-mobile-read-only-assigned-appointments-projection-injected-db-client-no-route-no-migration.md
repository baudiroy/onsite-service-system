# Task 921 - Engineer Mobile Read-Only Assigned Appointments Projection / Injected DB Client / No Route No Migration

Status: completed

## Goal

Start the next Engineer Mobile runtime branch with a small read-only assigned appointments projection service for the future engineer mobile workbench.

This task moves runtime forward without adding a production route, controller, auth runtime, real repository, DB migration, provider sending, AI/RAG, billing/settlement, admin UI, smoke/shared runtime, staging, or commit.

## Modified Files

- `src/engineerMobile/engineerAssignedAppointmentsProjectionService.js`
- `tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentsProjectionServiceClosure.static.test.js`
- `docs/task-921-engineer-mobile-read-only-assigned-appointments-projection-injected-db-client-no-route-no-migration.md`

No `admin/src/`, `README.md`, `migrations/`, route/controller/bootstrap/server/listen files, auth/session/JWT runtime files, real DB/repository/transaction files, provider files, AI/RAG/vector/search files, billing/settlement files, package/env/config/credential files, smoke/shared runtime infrastructure, Customer Access runtime files, staging, or commit was modified for Task921.

## Implementation Summary

Added `getEngineerAssignedAppointmentsProjection({ dbClient, engineerContext, dateRange, statusFilter })` as a pure read-only projection service.

The service:

- requires an injected synthetic `dbClient.query`;
- requires an authorized engineer context with `organizationId`, `engineerId`, organization scope, engineer assignment scope, and read permission;
- builds a read-only query spec with `readOnly: true`;
- scopes query parameters by organization and assigned engineer;
- re-checks returned rows for organization and engineer assignment scope;
- optionally scopes by status filter;
- returns only an allowlisted mobile appointment list projection;
- fails closed on missing context, missing DB client, unauthorized context, mismatched rows, invalid rows, and query errors;
- does not mutate Case, Appointment, Field Service Report, Completion Report, customer identity, provider state, or `finalAppointmentId`.

## Projection Allowlist

The mobile-safe appointment projection may include:

- `appointmentId`
- `caseReference`
- `appointmentWindow`
- `scheduledStart`
- `scheduledEnd`
- `serviceType`
- `customerDisplayName`
- `locationLabel`
- `status`
- `priorityLabel`
- `canOpenDetails`
- `canStartTravel`

The service does not forward raw DB rows.

## Sensitive Field Exclusion

The projection excludes top-level and nested sensitive/internal fields by construction, including:

- raw phone / mobile / tel;
- raw address;
- LINE user id;
- provider raw payload;
- auth token/header/cookie;
- customer identity binding internals;
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
- full Case, Appointment, or Report payloads.

## Preserved Boundaries

- No Route.
- No Migration.
- No real DB connection.
- No repository-backed writer or repository runtime.
- No insert/update/delete.
- No appointment mutation.
- No Case mutation.
- No Field Service Report creation/update/approval/publish.
- No Completion Report creation.
- No `finalAppointmentId` mutation.
- No engineer check-in/start/on-site/complete action.
- No production mobile API route.
- No admin UI/mobile UI.
- No provider sending.
- No AI/RAG.
- No billing/settlement.
- No smoke/shared runtime.
- No public API shape change.

## Coverage

The unit and static tests verify:

- missing `dbClient` fails closed;
- missing `engineerContext` fails closed;
- missing `organizationId` fails closed;
- missing `engineerId` fails closed;
- unauthorized engineer context fails closed;
- organization mismatch rows are excluded;
- non-assigned engineer rows are excluded;
- query error returns a generic safe-deny envelope without raw error leakage;
- valid authorized context returns only allowlisted appointment projections;
- sensitive and internal fields, including nested values, are not leaked;
- only injected synthetic `dbClient.query` is called;
- synthetic mutation methods are not called;
- source imports no real DB/repository/transaction, route/controller/server/app/listen/bootstrap, auth/session/JWT, provider/LINE/SMS/email/App/webhook, AI/RAG/vector/search, billing/settlement, env/config/credential/logger/network, smoke, or migration dependency;
- source contains no insert/update/delete/DDL or official mutation path.

## Verification

Commands to run:

```bash
node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js
node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionServiceClosure.static.test.js
node --test tests/engineerMobile/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/engineerMobile tests/engineerMobile docs/task-921-engineer-mobile-read-only-assigned-appointments-projection-injected-db-client-no-route-no-migration.md
```

Current results:

- `node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js`: PASS, 12/12.
- `node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionServiceClosure.static.test.js`: PASS, 6/6.
- `node --test tests/engineerMobile/*.js`: PASS, 626/626.
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS, 2995/2995.
- `git diff --check -- src/engineerMobile tests/engineerMobile docs/task-921-engineer-mobile-read-only-assigned-appointments-projection-injected-db-client-no-route-no-migration.md`: PASS.
