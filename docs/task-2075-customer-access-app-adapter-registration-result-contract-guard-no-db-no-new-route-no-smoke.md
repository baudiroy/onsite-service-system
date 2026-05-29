# Task2075 - Customer Access App Adapter Registration Result Contract Guard

## Purpose

Task2075 hardens the Customer Access service report projection app adapter registration result contract.

The adapter may register a handler on an explicitly injected safe target, but the returned result must be only a sanitized summary. It must not expose raw mount targets, handler functions, route objects, thrown errors, stacks, provider/debug fields, DB/env data, request-like containers, or arbitrary target properties.

## Guarded Registration Result Shapes

Successful registration result shape:

```js
{
  registered: true,
  method: 'GET',
  path,
}
```

Failed registration result shape:

```js
{
  registered: false,
  messageKey: 'customerAccess.unavailable',
  customerVisible: false,
  reasonCode,
}
```

Current reason codes:

- `mount_target_invalid`
- `db_client_invalid`
- `route_registration_failed`

The handler function is still registered on the injected app/router target, but it is no longer returned from the adapter result.

## Preserved Runtime Contract

The Task2074 mount target boundary remains:

- explicit injected safe plain-object target only
- supported method: `get(path, handler)` only
- no `route().get`
- no `register`
- no `listen`
- no global app/server/public route fallback

The registered route path remains:

- `GET /customer-access/:caseId/service-report/:reportId`

The projection service input DTO remains exactly:

- `dbClient`
- `customerAccessContext`
- `caseId`
- `reportId`

## Files Changed

- `src/customerAccess/customerServiceReportProjectionAppAdapter.js`
- `tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js`
- `tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `docs/task-2075-customer-access-app-adapter-registration-result-contract-guard-no-db-no-new-route-no-smoke.md`

The source change is limited to registration result sanitization:

- failed results now include stable `reasonCode`
- registration failure caused by `target.get` returns `route_registration_failed`
- invalid injected db client returns `db_client_invalid`
- all other invalid target/options failures return `mount_target_invalid`
- successful results no longer include the raw handler function

## Explicit Non-Goals

Task2075 does not authorize:

- new route creation
- global route mounting
- `src/app.js`, `src/server.js`, or `public.routes.js` changes
- DB changes or DB execution
- migrations, SQL, seeds, schema, indexes, psql, migration dry-run, or migration apply
- repository query text or parameter changes
- projection service behavior changes
- HTTP handler behavior changes
- listener/server startup
- Zeabur, environment, smoke, endpoint, or secret inspection
- provider sending
- admin frontend work
- AI/RAG/model calls
- billing, settlement, payment, or invoice work
- package or lockfile changes
- cleanup, reset, stash, revert, or mutation of the 7 held historical untracked docs

## Verification Plan

Expected verification:

- `node --test tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `git diff --check`
- `git status --short --branch`

If route or handler behavior is impacted, run the directly related customerAccess route/handler tests.

DB, migration, smoke, endpoint, Zeabur, environment, and secret inspection commands are not authorized.
