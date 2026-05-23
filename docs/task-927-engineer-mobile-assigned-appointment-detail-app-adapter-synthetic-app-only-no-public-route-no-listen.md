# Task 927 - Engineer Mobile Assigned Appointment Detail App Adapter / Synthetic App Only / No Public Route No Listen

Status: completed

## Goal

Add a thin synthetic app/router adapter for the Task926 assigned appointment detail HTTP-like handler.

This remains synthetic only:

```text
detail projection service -> detail HTTP-like handler -> synthetic app/router adapter
```

No production route, public/mobile API rollout, listen, real DB, repository, auth runtime, migration, provider sending, AI/RAG, billing/settlement, smoke/shared runtime, workflow action, staging, or commit is added.

## Modified Files

- `src/engineerMobile/engineerAssignedAppointmentDetailAppAdapter.js`
- `tests/engineerMobile/engineerAssignedAppointmentDetailAppAdapter.unit.test.js`
- `tests/engineerMobile/engineerAssignedAppointmentDetailAppAdapterClosure.static.test.js`
- `docs/task-927-engineer-mobile-assigned-appointment-detail-app-adapter-synthetic-app-only-no-public-route-no-listen.md`

No `admin/src/`, `README.md`, `migrations/`, production route/controller/bootstrap/server/listen files, auth/session/JWT runtime files, real DB/repository/transaction files, provider files, AI/RAG/vector/search files, billing/settlement files, package/env/config/credential files, smoke/shared runtime infrastructure, Customer Access Task908-Task920 files, staging, or commit was modified for Task927.

## Implementation Summary

Added:

- `DEFAULT_INTERNAL_ASSIGNED_APPOINTMENT_DETAIL_PATH`
- `registerEngineerAssignedAppointmentDetailRoute({ app, router, dbClient, path })`

The adapter:

- requires injected synthetic `app` or `router`;
- requires injected synthetic `dbClient.query`;
- accepts an explicit path or uses the internal/test-only default path `/__internal/engineer-mobile/assigned-appointments/:appointmentId`;
- registers exactly one GET-like handler on the injected target;
- delegates handler creation to Task926 `createEngineerAssignedAppointmentDetailProjectionHandler`;
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
- adapter delegates to Task926 handler factory;
- registration does not call `dbClient.query`;
- adapter does not call or import `listen`;
- adapter does not import production app/server/bootstrap/routes;
- adapter does not import DB/repository/transaction/base repository;
- adapter does not import auth/JWT/session/provider/AI/RAG/billing/env/config/network/logger dependencies;
- synthetic request through registered handler preserves Task926/Task925 behavior;
- missing app/router fails closed without leaking raw errors or sensitive detail;
- missing `dbClient` fails closed without registering a handler;
- synthetic app registration failure fails closed without raw error leakage;
- router option works without depending on a global app.

## Verification

Commands to run:

```bash
node --test tests/engineerMobile/engineerAssignedAppointmentDetailAppAdapter.unit.test.js
node --test tests/engineerMobile/engineerAssignedAppointmentDetailAppAdapterClosure.static.test.js
node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler.http-behavior.unit.test.js
node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js
node --test tests/engineerMobile/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/engineerMobile tests/engineerMobile docs/task-927-engineer-mobile-assigned-appointment-detail-app-adapter-synthetic-app-only-no-public-route-no-listen.md
```

Current results:

- `node --test tests/engineerMobile/engineerAssignedAppointmentDetailAppAdapter.unit.test.js`: PASS, 7/7.
- `node --test tests/engineerMobile/engineerAssignedAppointmentDetailAppAdapterClosure.static.test.js`: PASS, 6/6.
- `node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler.http-behavior.unit.test.js`: PASS, 9/9.
- `node --test tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js`: PASS, 13/13.
- `node --test tests/engineerMobile/*.js`: PASS, 707/707.
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS, 3076/3076.
- `git diff --check -- src/engineerMobile tests/engineerMobile docs/task-927-engineer-mobile-assigned-appointment-detail-app-adapter-synthetic-app-only-no-public-route-no-listen.md`: PASS.
