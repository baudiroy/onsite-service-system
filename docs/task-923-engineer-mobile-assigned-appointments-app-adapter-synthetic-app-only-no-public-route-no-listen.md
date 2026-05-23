# Task 923 - Engineer Mobile Assigned Appointments App Adapter / Synthetic App Only / No Public Route No Listen

Status: completed

## Goal

Add a thin synthetic app/router adapter for the Task922 Engineer Mobile assigned appointments HTTP-like handler.

This remains synthetic only:

```text
projection service -> HTTP-like handler -> synthetic app/router adapter
```

No production route, public/mobile API rollout, listen, real DB, repository, auth runtime, migration, provider sending, AI/RAG, billing/settlement, smoke/shared runtime, staging, or commit is added.

## Modified Files

- `src/engineerMobile/engineerAssignedAppointmentsAppAdapter.js`
- `tests/engineerMobile/engineerAssignedAppointmentsAppAdapter.unit.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentsAppAdapterClosure.static.test.js`
- `docs/task-923-engineer-mobile-assigned-appointments-app-adapter-synthetic-app-only-no-public-route-no-listen.md`

No `admin/src/`, `README.md`, `migrations/`, production route/controller/bootstrap/server/listen files, auth/session/JWT runtime files, real DB/repository/transaction files, provider files, AI/RAG/vector/search files, billing/settlement files, package/env/config/credential files, smoke/shared runtime infrastructure, Customer Access Task908-Task920 files, staging, or commit was modified for Task923.

## Implementation Summary

Added:

- `DEFAULT_INTERNAL_ASSIGNED_APPOINTMENTS_PATH`
- `registerEngineerAssignedAppointmentsRoute({ app, router, dbClient, path })`

The adapter:

- requires injected synthetic `app` or `router`;
- requires injected synthetic `dbClient.query`;
- accepts an explicit path or uses the internal/test-only default path `/__internal/engineer-mobile/assigned-appointments`;
- registers exactly one GET-like handler on the injected target;
- delegates handler creation to Task922 `createEngineerAssignedAppointmentsProjectionHandler`;
- does not call `listen`;
- does not call `dbClient.query` during registration;
- returns a safe registered / not-registered envelope without raw errors.

## Preserved Boundaries

- Synthetic App Only.
- No Public Route.
- No production route registration.
- No public/mobile API rollout.
- No app/server/bootstrap/listen edit.
- No listen.
- No real Express app dependency required.
- No real DB connection.
- No repository.
- No auth/session/JWT runtime.
- No migration.
- No psql.
- No `npm run db:migrate`.
- No DDL/SQL dry-run/apply.
- No provider sending.
- No AI/RAG.
- No billing/settlement.
- No smoke/shared runtime.
- No start travel / arrival / completion / report creation / report publish.
- No Case / Appointment / Field Service Report / Completion Report / customer identity / provider state / `finalAppointmentId` mutation.

## Coverage

The unit and static tests verify:

- adapter registers exactly one GET-like handler on an injected synthetic app/router;
- adapter requires injected `dbClient`;
- adapter delegates to Task922 handler factory;
- registration does not call `dbClient.query`;
- adapter does not call or import `listen`;
- adapter does not import production app/server/bootstrap/routes;
- adapter does not import DB/repository/transaction/base repository;
- adapter does not import auth/JWT/session/provider/AI/RAG/billing/env/config/network/logger dependencies;
- synthetic request through registered handler preserves Task922/Task921 behavior;
- missing app/router fails closed without leaking raw errors or sensitive detail;
- missing `dbClient` fails closed without registering a handler;
- synthetic app registration failure fails closed without raw error leakage;
- router option works without depending on a global app.

## Verification

Commands to run:

```bash
node --test tests/engineerMobile/engineerAssignedAppointmentsAppAdapter.unit.test.js
node --test tests/engineerMobile/engineerAssignedAppointmentsAppAdapterClosure.static.test.js
node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionHandler.http-behavior.unit.test.js
node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js
node --test tests/engineerMobile/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/engineerMobile tests/engineerMobile docs/task-923-engineer-mobile-assigned-appointments-app-adapter-synthetic-app-only-no-public-route-no-listen.md
```

Current results:

- `node --test tests/engineerMobile/engineerAssignedAppointmentsAppAdapter.unit.test.js`: PASS (7/7).
- `node --test tests/engineerMobile/engineerAssignedAppointmentsAppAdapterClosure.static.test.js`: PASS (6/6).
- `node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionHandler.http-behavior.unit.test.js`: PASS (8/8).
- `node --test tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js`: PASS (12/12).
- `node --test tests/engineerMobile/*.js`: PASS (652/652).
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS (3021/3021).
