# Task 914 - Customer Access Projection Handler App Adapter

## Status

Completed.

## Goal

Prepare the Customer Access service report projection handler for a future route by adding a small injected synthetic app/router adapter. This task does not expose a public route and does not register into the production app, server, or route aggregation layer.

## Modified Files

- `src/customerAccess/customerServiceReportProjectionAppAdapter.js`
- `tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js`
- `tests/customerAccess/customerServiceReportProjectionAppAdapterClosure.static.test.js`
- `docs/task-914-customer-access-projection-handler-app-adapter-no-public-route-no-listen.md`

No `admin/src/`, `migrations/`, production route registration, global app/server/bootstrap/listen, auth/session/JWT runtime, real customer identity repository, real DB/repository/transaction, provider, LINE/SMS/email/App push/webhook, AI/RAG/vector/search, billing/settlement, package/env/config/credential, smoke, or shared runtime file was modified.

## Implementation

Added `registerCustomerServiceReportProjectionRoute(options)` in `src/customerAccess/customerServiceReportProjectionAppAdapter.js`.

The adapter:

- accepts an injected synthetic `app` or `router` object;
- requires an injected `dbClient` with a `query` function;
- accepts an explicit path or uses an internal default path;
- registers exactly one GET-like handler on the injected synthetic app/router;
- delegates to Task909 `createCustomerServiceReportProjectionHandler`;
- returns a safe not-registered result when inputs are missing or synthetic registration fails;
- does not call listen;
- does not import Express, global app/server/bootstrap, route registration, real DB, repository, auth/session/JWT, provider, AI/RAG, billing/settlement, env/config, logger, network, smoke, or shared runtime modules.

## Behavior Boundary

This is an adapter boundary only. It is not a public API rollout.

The adapter prepares a future mounting boundary but remains synthetic and injected-only:

- No public route;
- No route registration;
- no production route registration;
- no route aggregation edit;
- no app/server bootstrap edit;
- No listen;
- no real Express dependency;
- No real DB connection;
- no repository;
- No auth/session/JWT runtime;
- No provider sending;
- No AI/RAG;
- No billing/settlement;
- no migration;
- No smoke/shared runtime.

Customer Access context remains pre-resolved/synthetic. The adapter does not create or resolve customer identity, does not verify bearer tokens, does not trust LINE user ids, and does not mutate Case, Appointment, Field Service Report, customer identity, provider state, or `finalAppointmentId`.

## Verification

Commands to run:

```sh
node --test tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js
node --test tests/customerAccess/customerServiceReportProjectionAppAdapterClosure.static.test.js
node --test tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js
node --test tests/customerAccess/customerAccessProjectionContextBranchClosure.static.test.js
node --test tests/customerAccess/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/customerAccess tests/customerAccess docs/task-914-customer-access-projection-handler-app-adapter-no-public-route-no-listen.md
```

Current results:

- `node --test tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js`: PASS (7 tests).
- `node --test tests/customerAccess/customerServiceReportProjectionAppAdapterClosure.static.test.js`: PASS (6 tests).
- `node --test tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js`: PASS (8 tests).
- `node --test tests/customerAccess/customerAccessProjectionContextBranchClosure.static.test.js`: PASS (9 tests).
- `node --test tests/customerAccess/*.js`: PASS (670 tests).
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS (2936 tests).
- `git diff --check -- src/customerAccess tests/customerAccess docs/task-914-customer-access-projection-handler-app-adapter-no-public-route-no-listen.md`: PASS.
