# Task2179 - Engineer Mobile Production Mount Implementation

## Status

- Implemented bounded Engineer Mobile production mount wiring through the accepted production mount composition adapter.
- Actual production composition owner inspected and modified: `src/routes/index.js`.
- `src/app.js`, `src/server.js`, and `src/routes/public.routes.js` were inspected only and not modified.
- No server/listener was started.
- No smoke or endpoint probes were run.
- No DB commands, DB connection creation, SQL execution, migration apply, or migration dry-run were performed.
- No env, Zeabur, secret, staging, or production traffic inspection was performed.
- No provider messages were sent.
- No admin frontend, AI, billing, package, migration, repository implementation, Customer Access behavior, or DTO contract work was performed.
- The 7 held historical docs remain untracked and untouched.

## Production Composition Inspection

The production route composition owner is `src/routes/index.js`.

Reasoning:

- `src/app.js` creates the Express app and mounts `createAppRouter(...)`; it is not the route registration owner for individual public routes.
- `src/server.js` owns server bootstrap/start functions and listener startup, and was not modified.
- `src/routes/public.routes.js` owns `/api/v1/public` routes only and does not own the root Engineer Mobile route family.
- `src/routes/index.js` owns the central `createAppRouter(options)` production route registry and already owns Customer Access production mount composition.

## Implementation

`src/routes/index.js` now imports:

```js
createEngineerMobileProductionMountComposition
```

from:

```js
../engineerMobile/engineerMobileProductionMountCompositionAdapter
```

It mounts Engineer Mobile through:

```js
createEngineerMobileProductionMountComposition({
  ...engineerMobileOptions,
  router: appRouter,
})
```

The direct route-index calls were removed:

- `registerEngineerMobileRoutes(appRouter, options.engineerMobile)`
- `registerEngineerMobileTaskDetailRoutes(appRouter, options.engineerMobile)`
- `registerEngineerMobileVisitActionRoutes(appRouter, options.engineerMobile)`

The accepted adapter still delegates to the approved route registration boundaries:

- `registerEngineerMobileRoutes`
- `registerEngineerMobileTaskDetailRoutes`
- `registerEngineerMobileVisitActionRoutes`

## Narrow Compatibility Fix

`src/engineerMobile/engineerMobileProductionMountCompositionAdapter.js` now accepts function-shaped Express routers as valid mount targets.

This is required because `express.Router()` is callable and has `.get(...)` and `.post(...)` methods. The compatibility change remains bounded to mount-target validation only and does not add routes, DB work, provider work, env lookup, or server startup.

## Accepted Routes

Only the accepted Engineer Mobile routes are production-mounted:

- `GET /engineer-mobile/tasks`
- `GET /engineer-mobile/tasks/:appointmentId`
- `POST /engineer-mobile/appointments/:appointmentId/actions/:action`

No internal or test Engineer Mobile route is exposed.
No new Engineer Mobile route was added.

## Preserved Behavior

- Engineer Mobile task list behavior is preserved.
- Engineer Mobile task detail behavior is preserved.
- Engineer Mobile visit action behavior is preserved.
- Engineer Mobile audit side-channel contracts from Task2167 through Task2177 are preserved.
- Task2165 production mount composition adapter contract is preserved.
- Customer Access production mount behavior is preserved.
- Customer-facing and engineer-facing DTO contracts were not changed.
- Audit event builder, normalizer, and adapter contracts were not changed.

## Changed Files

- `src/routes/index.js`
- `src/engineerMobile/engineerMobileProductionMountCompositionAdapter.js`
- `tests/engineerMobile/engineerMobileProductionMountCompositionAdapter.unit.test.js`
- `tests/engineerMobile/engineerMobileProductionMountCompositionAdapterBoundary.static.test.js`
- `tests/engineerMobile/engineerMobileRouteMount.unit.test.js`
- `docs/task-2179-engineer-mobile-production-mount-implementation-explicit-app-composition-only-no-db-no-smoke-no-provider.md`

## Verification

Commands run:

```sh
node --test tests/engineerMobile/engineerMobileProductionMountCompositionAdapter.unit.test.js tests/engineerMobile/engineerMobileProductionMountCompositionAdapterBoundary.static.test.js
node --test tests/engineerMobile/engineerMobileRoute.unit.test.js tests/engineerMobile/engineerMobileTaskDetailRoute.unit.test.js tests/engineerMobile/engineerMobileVisitActionRoute.unit.test.js tests/engineerMobile/engineerMobileRouteMount.unit.test.js
node --test tests/engineerMobile/engineerMobileAuditEventBuilder.unit.test.js tests/engineerMobile/engineerMobileAuditWriterAdapter.unit.test.js tests/engineerMobile/engineerMobileAuditWriterResultNormalizer.unit.test.js
node --test tests/customerAccess/customerAccessProductionMount.http-behavior.unit.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js
git diff --check
git status --short --branch
```

Results:

- Engineer Mobile production mount composition adapter unit/static tests: PASS, 17/17.
- Engineer Mobile route and route-index tests: PASS, 56/56.
- Engineer Mobile audit regression tests: PASS, 31/31.
- Customer Access shared route-index regression tests: PASS, 24/24.
- `git diff --check`: PASS.
- `git status --short --branch`: `main...origin/main` with Task2179 changes plus the same 7 held historical docs untracked before commit.

## Explicit Non-Goals Confirmed

- No server/listener startup.
- No smoke/endpoint probes.
- No DB execution.
- No DB connection creation.
- No migration apply/dry-run.
- No SQL execution.
- No psql, `DATABASE_URL`, env, Zeabur, staging, production traffic, secret, or credential inspection.
- No provider sending: LINE, SMS, email, webhook, or app push.
- No provider messages sent.
- No AI, RAG, provider, or model calls.
- No admin frontend work.
- No billing/payment work.
- No package or package-lock changes.
- No migration or audit persistence files changed.
- No new Engineer Mobile routes.
- No internal/test route public exposure.
- No manual route handler reimplementation outside the accepted adapter path.
- No global DB pool fallback.
- No customer-facing or engineer-facing DTO contract changes.
- No Customer Access behavior changes.
