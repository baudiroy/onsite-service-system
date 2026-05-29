# Task2116 - Customer Access Service-Report Audit Side-Channel Runtime Integration

## Status

- Implemented for Customer Access service-report HTTP boundary only.
- No route-registration audit integration was added.
- No context middleware audit integration was added.
- No DB/projection repository audit integration was added.
- No DB, audit persistence, migration, SQL, repository, query, new route, route/global mount, production mount, app, server, public routes, smoke, endpoint, listener, network, Zeabur/env, provider, admin, AI, RAG, model, billing, settlement, payment, invoice, package, or package-lock work was performed.
- The 7 held historical docs remain untracked and untouched.

## Changed Files

- `src/customerAccess/customerServiceReportProjectionHandler.js`
- `src/customerAccess/customerServiceReportProjectionAppAdapter.js`
- `tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js`
- `tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js`
- `tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `docs/task-2116-customer-access-service-report-audit-side-channel-runtime-integration-injected-writer-only-no-db-no-persistence-no-provider.md`

## Dependency Injection Shape

Service-report direct handler request:

```js
handleCustomerServiceReportProjectionRequest({
  request,
  dbClient,
  projectionService,
  auditWriter,
})
```

Service-report handler factory:

```js
createCustomerServiceReportProjectionHandler({
  dbClient,
  projectionService,
  auditWriter,
})
```

Service-report app adapter:

```js
registerCustomerServiceReportProjectionRoute({
  app,
  router,
  dbClient,
  projectionService,
  auditWriter,
})
```

`auditWriter` is optional and must match the accepted Task2109 shape:

```js
function writer(auditEvent) {}
```

No global writer fallback is used.

## Audit Events

The service-report boundary uses source:

- `customer_access_projection_service`

Allow response emits:

- `eventType`: `customer_access.service_report.allow`
- `route`: `/customer-access/:caseId/service-report/:reportId`
- `method`: `GET`
- `source`: `customer_access_projection_service`
- `decision`: `allow`
- `caseId`: from validated service input only
- `reportId`: from validated service input only
- `organizationId`: from sanitized `customerAccessContext` only when safe
- `customerId`: from sanitized `customerAccessContext` only when safe
- `metadata`: `routeMatched`, `contextPresent`, `identifierValid`

Deny response emits:

- `eventType`: `customer_access.service_report.deny`
- `route`: `/customer-access/:caseId/service-report/:reportId`
- `method`: `GET`
- `source`: `customer_access_projection_service`
- `decision`: `deny`
- `reasonCode`: `customerAccess.unavailable`
- `caseId`: from validated service input only
- `reportId`: from validated service input only
- `organizationId`: from sanitized `customerAccessContext` only when safe
- `customerId`: from sanitized `customerAccessContext` only when safe
- `metadata`: `routeMatched`, `contextPresent`, `identifierValid`

## Audit Call And Skip Behavior

Audit call is attempted only when:

- an explicit injected `auditWriter` function is provided
- valid service-report input exists
- the accepted audit event builder returns a valid audit event

Audit call is skipped when:

- no `auditWriter` is provided
- `auditWriter` is not a function
- service-report input cannot be built from safe route params and context
- the audit event builder rejects the audit input

Audit result is never added to the customer response body or headers.

## Failure Isolation

The service-report HTTP boundary invokes the accepted Task2109 writer adapter:

- writer return values are normalized by the accepted adapter/normalizer path
- writer throw is contained
- writer rejection is contained
- malformed writer result is contained

Audit writer failure never changes:

- customer-facing HTTP status
- customer-facing response body
- safe-deny error envelope

## Non-Leakage Boundary

Audit events passed to the writer do not include:

- raw request or response
- headers or rawHeaders
- authorization, cookies, tokens, or session
- body, query, or params object
- user, auth, channel, access, or session raw objects
- raw `customerAccessContext`
- raw projection service result
- raw serviceReport object
- raw DB rows or query metadata
- query text or values
- provider payload or raw payload
- AI prompts or responses
- debug, stack, SQL, internal, private, or admin-only fields
- phone, address, email, or LINE raw identity

## Verification

Expected commands:

```sh
node --test tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js tests/customerAccess/customerAccessMountedRouteAllow.unit.test.js tests/customerAccess/customerAccessMountedRouteSafeDeny.unit.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js
node --test tests/customerAccess/customerAccessAuditEventBuilder.unit.test.js tests/customerAccess/customerAccessAuditWriterAdapter.unit.test.js tests/customerAccess/customerAccessAuditWriterResultNormalizer.unit.test.js
git diff --check
git status --short --branch
```

No DB, migration, smoke, endpoint, server, listener, network, Zeabur, env, or secret commands are required or authorized.
