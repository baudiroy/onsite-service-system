# Task2120 - Customer Access Route-Registration Audit Side-Channel Runtime Integration

## Status

- Implemented optional injected route-registration audit side-channel integration for `registerCustomerAccessRoutes` only.
- No context middleware audit integration was added.
- No DB/repository/query audit integration was added.
- No service-report audit behavior was changed.
- No case overview audit behavior was changed.
- No DB, audit persistence, migration, SQL, repository, query, new route, route/global mount, production mount, app, server, public routes, smoke, endpoint, listener, Zeabur/env, provider, admin, AI, RAG, model, billing, settlement, payment, invoice, package, or package-lock work was performed.
- The 7 held historical docs remain untracked and untouched.

## Changed Files

- `src/routes/customerAccessRoutes.js`
- `tests/customerAccess/customerAccessRoutes.unit.test.js`
- `tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `docs/task-2120-customer-access-route-registration-audit-side-channel-runtime-integration-injected-writer-only-no-db-no-persistence-no-provider.md`

## Dependency Injection Shape

Route-registration audit uses the existing `registerCustomerAccessRoutes` options boundary:

```js
registerCustomerAccessRoutes(router, {
  dbClient,
  repository,
  auditWriter,
})
```

`auditWriter` remains optional and must match the accepted Task2109 shape:

```js
function writer(auditEvent) {}
```

No global writer fallback is used.

## Success Audit Policy

Successful route registration emits one audit event per accepted public route when an explicit function `auditWriter` is injected.

Event 1:

- `eventType`: `customer_access.route_registration.success`
- `route`: `/customer-access/:caseId`
- `method`: `GET`
- `source`: `customer_access_route_registration`
- `decision`: `success`
- `metadata.dependencyValid`: `true`
- `metadata.registrationResult`: `success`
- no `reasonCode`

Event 2:

- `eventType`: `customer_access.route_registration.success`
- `route`: `/customer-access/:caseId/service-report/:reportId`
- `method`: `GET`
- `source`: `customer_access_route_registration`
- `decision`: `success`
- `metadata.dependencyValid`: `true`
- `metadata.registrationResult`: `success`
- no `reasonCode`

## Failure Audit Policy

Failure audit is intentionally narrow:

- `mount_target_invalid`: skip writer because no safe route registration point exists.
- `db_client_invalid`: skip writer because no safe route registration point exists.
- `route_registration_failed`: emit one failure event only when the registration control flow safely knows the accepted public route being attempted.

Failure event:

- `eventType`: `customer_access.route_registration.failure`
- `route`: the accepted public route being attempted
- `method`: `GET`
- `source`: `customer_access_route_registration`
- `decision`: `failure`
- `reasonCode`: `route_registration_failed`
- `metadata.dependencyValid`: `true`
- `metadata.registrationResult`: `failure`

No partial route list is emitted for failure.

## Call And Skip Behavior

- No `auditWriter`: no audit call and summary unchanged.
- Non-function `auditWriter`: no audit call and summary unchanged.
- Audit event builder invalid result: writer skipped and summary unchanged.
- `auditWriter` throw, rejection, or malformed result: contained through the Task2109 writer adapter path and summary unchanged.
- Audit result is not added to the registration summary.
- Audit result is not added to any customer response.

## Registration Summary Contract

Success summary remains exactly:

```js
{
  registered: true,
  routes: [
    { method: 'GET', path: '/customer-access/:caseId' },
    { method: 'GET', path: '/customer-access/:caseId/service-report/:reportId' },
  ],
}
```

Failure summary remains exactly:

```js
{
  registered: false,
  messageKey: 'customerAccess.unavailable',
  customerVisible: false,
  reasonCode,
}
```

Audit side-channel does not add fields, alter `registered`, alter `reasonCode`, or expose writer results.

## Non-Leakage Boundary

Route-registration audit events must not contain:

- raw app/router/mount target
- handler functions or function source
- raw route object
- raw dbClient or query function
- projection service or facade function source
- raw options or dependency objects
- env or Zeabur values
- provider payload or raw payload
- AI prompts or responses
- debug, stack, or SQL
- tokens or headers
- DB rows or query metadata
- internal, private, or admin-only fields
- partial route lists from failed registration

Tests inspect audit writer events and registration summaries for these boundaries.

## Verification

Executed commands:

```sh
node --test tests/customerAccess/customerAccessRoutes.unit.test.js tests/customerAccess/customerAccessMountedRouteAllow.unit.test.js tests/customerAccess/customerAccessMountedRouteSafeDeny.unit.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js
node --test tests/customerAccess/customerAccessAuditEventBuilder.unit.test.js tests/customerAccess/customerAccessAuditWriterAdapter.unit.test.js tests/customerAccess/customerAccessAuditWriterResultNormalizer.unit.test.js
```

Results:

- Customer Access route-registration targeted tests: PASS, 68/68.
- Audit builder/writer/normalizer component tests: PASS, 33/33.

Final checks:

```sh
git diff --check
git status --short --branch
```

Results:

- `git diff --check`: PASS.
- `git status --short --branch`: branch `main...origin/main` with Task2120 files plus the 7 held historical docs untracked before commit.
