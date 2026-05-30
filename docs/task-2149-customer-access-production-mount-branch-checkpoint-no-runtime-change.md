# Task2149 - Customer Access Production Mount Branch Checkpoint / No Runtime Change

## Scope

Task2149 checkpoints the accepted Task2142-Task2148 Customer Access production mount branch. This is docs-only. It does not authorize or perform any new runtime, source, test, package, migration, DB, smoke, server/listener, env, Zeabur, provider, admin, AI, billing, or production/staging traffic work.

## Accepted Branch Summary

### Task2142 - Production Mount Composition Adapter Skeleton

Task2142 added:

- `src/customerAccess/customerAccessProductionMountCompositionAdapter.js`

Exported API:

```js
createCustomerAccessProductionMountComposition({
  router,
  dbClient,
  repository,
  auditWriter,
});
```

Dependency boundary:

- required: `router`, `dbClient`
- optional: `repository`, `auditWriter`
- calls existing `registerCustomerAccessRoutes` through injected dependencies only
- no global app mount
- no production mount yet at Task2142
- no server/listener startup
- no DB connection creation
- no env/Zeabur inspection
- `dbClient.query` is not called during registration
- optional `auditWriter` preserves the existing route-registration audit side-channel

### Task2143 - Regression Guard

Task2143 was tests-only plus documentation. It locked:

- independent repeated composition calls
- exactly two routes per injected router
- sanitized independent registration summaries
- raw dependency non-leakage
- malformed dependency and throwing `router.get` sanitized failures
- static boundaries against app/server/public routes/global registry/DB/env/provider/AI/billing imports
- no startup calls, DB calls, or network calls

### Task2144 - Adapter Branch Checkpoint

Task2144 checkpointed the composition adapter branch and preserved:

- accepted registration summary contracts
- current non-authorized areas
- no production mount yet
- no server/listener, smoke, DB, env/Zeabur, repository implementation, or audit persistence runtime work

### Task2145 - Production Mount Authorization Packet

Task2145 created the authorization packet for future production mount implementation. It recorded:

- Task2145 itself did not authorize production mount
- explicit future authorization phrase was required
- generic phrases such as "mount it", "go ahead", "connect it", "deploy it", and "make it live" were insufficient
- stop conditions and rollback/safety expectations
- no production mount, server/listener, smoke, DB, migration, env/Zeabur, or production traffic at Task2145

### Task2146 - Production Mount Implementation

Task2146 completed the bounded production route composition implementation.

Modified production composition file:

- `src/routes/index.js`

Inspected but not modified:

- `src/app.js`
- `src/server.js`

Production composition now uses:

```js
createCustomerAccessProductionMountComposition({
  router: appRouter,
  dbClient: customerAccessOptions.dbClient,
  repository: customerAccessOptions.repository,
  auditWriter: customerAccessOptions.auditWriter,
});
```

Preserved behavior:

- default no-options Customer Access safe-deny registration remains delegated through `registerCustomerAccessModuleRoutes(appRouter)`
- no manual Customer Access route handler reimplementation
- no bypass of `registerCustomerAccessRoutes`
- no server/listener startup
- no smoke/endpoint probes
- no DB execution or connection creation
- no migration apply/dry-run
- no env/Zeabur inspection

Accepted public routes mounted through production route composition:

- `GET /customer-access/:caseId`
- `GET /customer-access/:caseId/service-report/:reportId`

Internal test route not exposed:

- `/__internal/customer-access/service-reports/:caseId/:reportId`

### Task2147 - Production Mount HTTP Behavior Surrogate

Task2147 added:

- `tests/customerAccess/customerAccessProductionMount.http-behavior.unit.test.js`

It covers synthetic production composition through:

```js
createAppRouter({
  customerAccess: {
    dbClient,
    repository,
    auditWriter,
  },
});
```

Accepted public routes covered:

- `GET /customer-access/:caseId`
- `GET /customer-access/:caseId/service-report/:reportId`

Task2147 confirms:

- only those two public route templates are exposed
- internal route is not exposed
- case overview allow response keys remain accepted and allowlisted
- service-report allow response keys remain accepted and allowlisted
- `publicAttachments` item keys remain `attachmentId`, `label`, and `mimeType`
- invalid, missing, malformed, and alias-only identifiers safe-deny with HTTP 404 sanitized unavailable
- query/body/header/cookie aliases cannot supply or override route params
- unsupported methods and near-match paths do not dispatch
- audit writer results are not added to response bodies or synthetic headers
- no real server, network, smoke, DB, env, or Zeabur work

### Task2148 - Production Mount Static Boundary Guard

Task2148 added:

- `tests/customerAccess/customerAccessProductionMountBoundary.static.test.js`

It confirms:

- `src/routes/index.js` Customer Access imports are limited to `customerAccessRouteRegistry` and `customerAccessProductionMountCompositionAdapter`
- production mount adapter has a single delegated route-registration dependency: `../routes/customerAccessRoutes`
- adapter does not directly import or wire the case overview controller, service-report projection handler, or context middleware
- production mount uses `createCustomerAccessProductionMountComposition` with injected `router`, `dbClient`, `repository`, and `auditWriter`
- no direct handler wiring or `registerCustomerAccessRoutes(appRouter, customerAccessOptions)` bypass in production composition
- scoped production mount path has no listener/server startup, direct DB connect/query, env/Zeabur/secrets, provider/network/AI/RAG/model, or billing/payment/settlement dependencies
- production composition source does not expose internal route path or extra Customer Access public routes
- app/server boundaries do not import the Customer Access production mount adapter directly
- production mount summary path does not serialize raw dependencies or audit result objects

## Current Accepted Production Mount Status

- Customer Access public routes are wired through production route composition in `src/routes/index.js`.
- `src/app.js` remains unchanged and delegates `customerAccess` options into `createAppRouter`.
- `src/server.js` remains unchanged and remains the server/listener boundary.
- No server/listener has been started.
- No smoke/endpoint probe has been run.
- No DB has been executed.
- No production/staging traffic has been exercised.
- Current verification is unit/static/synthetic HTTP behavior only.

## Current Non-Authorized Areas

- Real smoke remains not authorized.
- Server/listener startup remains not authorized.
- DB execution remains not authorized.
- Migration apply/dry-run remains not authorized.
- Zeabur/env inspection remains not authorized.
- Production/staging traffic remains not authorized.
- Audit persistence DB writer runtime integration remains not authorized.
- Provider/admin/AI/RAG/model/billing/payment integrations remain not authorized.

## Future Candidates - Not Authorized By This Checkpoint

- Customer Access production readiness final review packet.
- Production smoke authorization packet.
- Explicit authorized smoke execution.
- Audit migration disposable local/test DB dry-run.
- Engineer Mobile next runtime branch.

PM must still authorize one exact next task at a time.
