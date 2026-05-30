# Task2146 - Customer Access Production Mount Implementation / Explicit App Composition Only / No DB No Smoke

## Scope

Task2146 wires the accepted Customer Access public routes into the existing production route composition layer through the Task2142 production mount composition adapter.

Modified production composition file:

- `src/routes/index.js`

Inspected but not modified:

- `src/app.js`
- `src/server.js`

The production route owner is `src/routes/index.js` because `src/app.js` delegates public route registration through `createAppRouter(...)`. `src/server.js` only resolves the app and listener boundary and was not needed for this bounded mount.

## Implementation Summary

Explicit `customerAccess` route composition now calls:

```js
createCustomerAccessProductionMountComposition({
  router: appRouter,
  dbClient: customerAccessOptions.dbClient,
  repository: customerAccessOptions.repository,
  auditWriter: customerAccessOptions.auditWriter,
});
```

Default no-options Customer Access safe-deny registration remains delegated to `registerCustomerAccessModuleRoutes(appRouter)`.

The implementation does not manually reimplement Customer Access handlers and does not bypass `registerCustomerAccessRoutes`; the production mount composition adapter remains the single explicit mount entrypoint for injected production composition.

## Mounted Routes

Only the accepted public Customer Access routes are mounted through the explicit production composition path:

- `GET /customer-access/:caseId`
- `GET /customer-access/:caseId/service-report/:reportId`

The internal test route remains unmounted from production composition:

- `/__internal/customer-access/service-reports/:caseId/:reportId`

No new Customer Access routes were added.

## Boundaries Preserved

- No server/listener startup.
- No smoke or endpoint probes.
- No DB execution.
- No DB connection creation.
- No migration apply or dry-run.
- No `psql`, `DATABASE_URL`, env, Zeabur, or secrets inspection.
- No production or staging traffic.
- No global DB pool fallback.
- No provider sending.
- No admin frontend work.
- No AI/RAG/provider/model calls.
- No billing or payment work.
- No package or package-lock changes.
- No customer-facing DTO contract changes.
- No audit event builder, normalizer, adapter, migration, or persistence contract changes.
- No internal test route public exposure.

## Verification Plan

Targeted verification for Task2146:

- production mount composition adapter tests
- route composition tests directly impacted by `src/routes/index.js`
- app factory composition tests confirming `src/app.js` continues passing `customerAccess` options
- existing Customer Access route, mounted-route allow, mounted-route safe-deny, and static runtime hardening guards
- `git diff --check`
- `git status --short --branch`

Node tests remain local unit/static tests only. No server, smoke, DB, migration, env, or Zeabur commands are authorized by this task.
