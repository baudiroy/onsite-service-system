# Task2038D Customer-facing Full Route Access-gate Contract Fix / No DB No Smoke

## Scope

Task2038D fixed the customer-facing service report full-route access-gate contract after the Task2038C approved disposable DB-backed smoke showed this mismatch:

- Direct projection handler: `200 allow`, `customerAccess.serviceReport.available`.
- Full mounted route: `404 deny`, `customerAccess.unavailable`.

This task used only no-DB synthetic tests. It did not connect to any database, run SQL, run migrations, run seed, run smoke, probe endpoints, deploy, or touch Zeabur.

## Root Cause

The full route path uses the server bootstrap customer-access read-only connector before reaching the projection handler. The projection handler sends a read-only query config object with `text`, `values`, `name`, and `readOnly: true`.

The generated read-only connector accepted only the older `query(sql, params)` string form. That caused the full route to reject the projection query object at the connector boundary before the underlying injected pool could return the same allow-shaped rows used by the direct handler.

The direct handler in Task2038C used the raw injected client and therefore did not hit this connector mismatch.

## Runtime Source Change

Updated:

- `src/customerAccess/customerAccessReadOnlyDbConnector.js`

The connector now accepts both supported read-only query input forms:

- SQL string plus params array.
- Query config object with `readOnly: true`, non-empty `text`, and array `values`.

The connector still rejects invalid query config objects, including objects that are not explicitly marked read-only. Params and values are copied before forwarding to the underlying injected query target.

## Tests Added Or Hardened

Updated:

- `tests/customerAccess/customerAccessReadOnlyDbConnector.unit.test.js`
- `tests/customerAccess/customerAccessRoutes.unit.test.js`
- `tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js`

Coverage added:

- Read-only connector accepts query config objects only when explicitly read-only.
- Read-only connector rejects query config objects that are not explicitly read-only.
- Full mounted service-report route passes the allow context through to the projection and returns the same sanitized DTO as the direct projection handler.
- Malformed allow-shaped context with missing customer scope fails closed before projection.

## Access-gate Contract

The full mounted route now preserves the intended pass-through contract:

- The customer access context provider resolves organization scope, verified customer identity, case linkage, publication, and customer-visible policy.
- The service report route reaches projection only when the context contains the required authorized customer scope.
- The projection uses the injected read-only DB client interface.
- The response remains filtered to the customer-visible allowlist.

## Deny-before-projection Preserved

The route still safe-denies before projection when access context is missing or malformed. The new regression test verifies that a context shaped like allow, but missing `customerId`, returns the generic safe-deny response and does not query the projection DB client.

## Forbidden Field Result

The full-route allow test compares the mounted route response with the direct projection handler response and verifies the filtered DTO. Internal fields remain absent, including raw DB rows, internal report fields, raw customer identifiers, `finalAppointmentId`, and sensitive markers.

## Verification

Focused customer-access no-DB tests:

```bash
node --test tests/customerAccess/customerAccessReadOnlyDbConnector.unit.test.js tests/customerAccess/customerAccessDbQueryExecutor.unit.test.js tests/customerAccess/customerAccessReadOnlyRepository.unit.test.js tests/customerAccess/customerAccessReadOnlyRepositoryQueryExecutor.unit.test.js tests/customerAccess/customerAccessContextProvider.unit.test.js tests/customerAccess/customerAccessContextMiddleware.unit.test.js tests/customerAccess/customerAccessContextProviderRepositoryInjection.unit.test.js tests/customerAccess/customerAccessContextMiddlewareRepositoryInjection.unit.test.js tests/customerAccess/customerAccessRouteDbAdapterOptions.unit.test.js tests/customerAccess/customerAccessRouteQueryExecutorIntegration.unit.test.js tests/customerAccess/customerAccessRouteRepositoryIntegration.unit.test.js tests/customerAccess/customerAccessRoutes.unit.test.js tests/customerAccess/customerAccessRouteMiddlewareIntegration.unit.test.js tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js tests/customerAccess/customerServiceReportProjectionService.unit.test.js tests/customerAccess/customerServiceReportProjectionServiceClosure.static.test.js tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js
```

Result:

- `205` tests passed.
- `0` failed.

Project checks:

- `git diff --check`
- `npm run check`

## Explicit Non-actions

- No DB connection.
- No SQL execution.
- No migration.
- No seed.
- No smoke.
- No endpoint probe.
- No `/healthz` probe.
- No Zeabur access or deployment action.
- No provider, billing, or AI execution.
- No Completion Report / Field Service Report creation, approval, publication, revocation, or mutation.
- No `finalAppointmentId` mutation.
- No customer-visible publication behavior creation or mutation.
- No admin frontend changes.
- No package or lockfile changes.
- No secrets printed.
- The 7 held historical docs were not touched.

## Recommendation

After PM acceptance, sync this Task2038D commit to GitHub. Then continue only with the next PM-assigned batch or bounded follow-up. Do not start Task2038E or Task2039 from this task.
