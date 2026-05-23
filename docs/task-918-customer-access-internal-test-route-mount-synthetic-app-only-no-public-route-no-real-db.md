# Task 918 - Customer Access Internal Test Route Mount

## Status

Completed.

## Goal

Add an internal test-only route mount helper around the Task914 synthetic app/router adapter.

This is not a production route. It is not a public customer API rollout. It does not edit production app/server/bootstrap/listen files.

## Modified Files

- `src/customerAccess/customerAccessInternalTestRouteMount.js`
- `tests/customerAccess/customerAccessInternalTestRouteMount.unit.test.js`
- `tests/customerAccess/customerAccessInternalTestRouteMountClosure.static.test.js`
- `docs/task-918-customer-access-internal-test-route-mount-synthetic-app-only-no-public-route-no-real-db.md`

## Behavior Added

`mountCustomerAccessInternalTestRoutes({ app, router, dbClient, path })` registers the Customer Access service report projection handler on an injected synthetic app/router object only.

The helper:

- requires an injected synthetic app/router with a `get` function;
- requires an injected synthetic `dbClient.query` function;
- uses the Task914 adapter through `registerCustomerServiceReportProjectionRoute`;
- uses the internal default path `/__internal/customer-access/service-reports/:caseId` unless a safe internal path is provided;
- rejects non-internal paths;
- registers exactly one GET-like handler;
- does not call `dbClient.query` during registration;
- does not call `listen`;
- returns a safe not-mounted envelope when input or registration fails.

## Explicit Boundaries

Internal test-only route mount helper. No production route. No public route. No app/server/bootstrap/listen. No real DB. No repository. No auth/session/JWT. No migration. No provider sending. No AI/RAG. No billing/settlement. No smoke/shared runtime.

No `admin/src`, no production route registration files, no global app/server/bootstrap/listen files, no auth/session/JWT runtime files, no real customer identity repository files, no real DB/repository/transaction files, no provider files, no package/env/config/credential files.

## Acceptance Criteria

- No production route/app/server/bootstrap file is modified.
- No public API route is created.
- Internal test route path is clearly non-public.
- Helper delegates to Task914 adapter.
- Task914 / Task909 / Task908 behavior remains unchanged.
- No real DB/repository/auth/provider/AI/billing/migration/smoke expansion occurs.
- Tests pass.

## Verification

Commands to run:

```sh
node --test tests/customerAccess/customerAccessInternalTestRouteMount.unit.test.js
node --test tests/customerAccess/customerAccessInternalTestRouteMountClosure.static.test.js
node --test tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js
node --test tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js
node --test tests/customerAccess/customerServiceReportProjectionService.unit.test.js
node --test tests/customerAccess/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/customerAccess tests/customerAccess docs/task-918-customer-access-internal-test-route-mount-synthetic-app-only-no-public-route-no-real-db.md
```

Current results:

- `git status --short`: PASS / observed broad pre-existing dirty and untracked worktree; Task918 files are untracked local additions:
  - `?? docs/task-918-customer-access-internal-test-route-mount-synthetic-app-only-no-public-route-no-real-db.md`
  - `?? src/customerAccess/customerAccessInternalTestRouteMount.js`
  - `?? tests/customerAccess/customerAccessInternalTestRouteMount.unit.test.js`
  - `?? tests/customerAccess/customerAccessInternalTestRouteMountClosure.static.test.js`
- `node --test tests/customerAccess/customerAccessInternalTestRouteMount.unit.test.js`: PASS, 7/7.
- `node --test tests/customerAccess/customerAccessInternalTestRouteMountClosure.static.test.js`: PASS, 6/6.
- `node --test tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js`: PASS, 7/7.
- `node --test tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js`: PASS, 8/8.
- `node --test tests/customerAccess/customerServiceReportProjectionService.unit.test.js`: PASS, 9/9.
- `node --test tests/customerAccess/*.js`: PASS, 699/699.
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS, 2965/2965.
- `git diff --check -- src/customerAccess tests/customerAccess docs/task-918-customer-access-internal-test-route-mount-synthetic-app-only-no-public-route-no-real-db.md`: PASS.
