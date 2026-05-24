# Task1117 - Repair Intake App Factory Route Options Preflight / No Runtime Change

## Status

Completed locally. Not staged.

Task1117 is a static preflight checkpoint only. It does not modify runtime behavior.

## Inspected Files

- `src/app.js`
- `src/server.js`
- `src/routes/index.js`
- `src/routes/public.routes.js`

## Discovered App Factory / Router Wiring Shape

`src/app.js` defines and exports:

- `createApp(options = {})`
- `app`

`src/app.js` imports the app router factory:

```js
const { createAppRouter } = require('./routes');
```

`createApp(options = {})` currently calls `createAppRouter({ ... })` inside:

```js
app.use(createAppRouter({
  customerAccess: options.customerAccess,
  dataCorrection: buildDataCorrectionOptions(options),
  engineerMobile: buildEngineerMobileOptions(options),
  engineerMobileWorkbench: buildEngineerMobileWorkbenchOptions(options),
}));
```

This confirms there is an existing app-factory-to-router options object where optional Repair Intake route options can be added without changing the `createApp` public signature.

Current app-level Repair Intake propagation:

- no `repairIntakeDraftToCaseRuntimePorts` marker in `src/app.js`;
- no `repairIntakeDraftToCase` marker in `src/app.js`;
- no Repair Intake marker in `src/server.js`.

## Server Startup Separation

`src/server.js` imports:

```js
const { app: defaultApp, createApp } = require('./app');
```

It owns server bootstrap and startup behavior, including `startServer(options = {})` and `app.listen(...)`.

Task1117 does not require server startup, does not call `listen`, and does not require changes to `src/server.js`.

Future propagation must not touch `src/server.js` unless separately authorized. Server shortcut support for Repair Intake route options should be a separate bounded task if needed.

## Current Router Propagation State

`src/routes/index.js` has the accepted Task1113 app-router propagation:

- imports `createPublicRouter` from `./public.routes`;
- passes `options.repairIntakeDraftToCaseRuntimePorts`;
- passes `options.repairIntakeDraftToCase`;
- preserves `appRouter.use('/api/v1/public', publicRouter)`.

`src/routes/public.routes.js` has the accepted Task1108A explicit public route skeleton:

- imports `createRepairIntakeDraftToCaseInjectedRouteComposition` only;
- accepts direct runtime ports from `repairIntakeDraftToCaseRuntimePorts`;
- accepts nested runtime ports from `repairIntakeDraftToCase.runtimePorts`;
- creates no default synthetic or real ports;
- uses `{ post: router.post.bind(router) }` as the Express Router mount target adapter;
- keeps default no-mount behavior when runtime ports are absent.

## Future Task1118 Readiness

Future `src/app.js` propagation target is confirmed safe for a bounded source task.

Proposed exact future Task1118 allowed file:

- `src/app.js`

Suggested Task1118 behavior:

- preserve `createApp(options = {})`;
- add optional `repairIntakeDraftToCaseRuntimePorts: options.repairIntakeDraftToCaseRuntimePorts` to the existing `createAppRouter({ ... })` object;
- add optional `repairIntakeDraftToCase: options.repairIntakeDraftToCase` to the existing `createAppRouter({ ... })` object;
- create no default synthetic or real Repair Intake runtime ports;
- import no Repair Intake internals;
- leave `src/server.js` unchanged.

This would enable direct `createApp({ ... })` callers to propagate Repair Intake route options into the already accepted app-router/public-router path.

Server bootstrap shortcut support is not confirmed as part of a one-file `src/app.js` task. If PM wants `resolveServerApp(...)` or `createServerBootstrap(...)` to activate from Repair Intake shortcut options, that should be a later bounded preflight/source task for `src/server.js`.

## Rollback / Safety Notes

Task1117 added only a static test and a documentation checkpoint.

Rollback is deleting:

- `tests/repairIntake/repairIntakeAppFactoryRouteOptionsPreflight.static.test.js`
- `docs/task-1117-repair-intake-app-factory-route-options-preflight-no-runtime-change.md`

No runtime source file, app/server file, route file, migration, admin file, package file, DB artifact, provider integration, OpenAPI artifact, AI/RAG artifact, or billing artifact was modified.

No staging, cleanup, revert, reset, or stash was performed.

## Scope Boundaries Held

- No production source files modified.
- No existing tests modified.
- No app/server/route files modified.
- No migrations.
- No admin changes.
- No package changes.
- No app/server/listen startup.
- No DB, SQL, migration, psql, or db:migrate.
- No migration creation or modification.
- No real repository implementation.
- No repository writer or repository imports.
- No API shape or OpenAPI expansion.
- No provider sending.
- No LINE, SMS, App, email, or webhook work.
- No AI/RAG.
- No billing, settlement, payment, or invoice changes.
- No staging, cleanup, revert, reset, or stash.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeAppFactoryRouteOptionsPreflight.static.test.js
node --test tests/repairIntake/repairIntakeAppRouterPropagationRegression.static.test.js
node --test tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.runtime-behavior.test.js
node --test tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.static.test.js
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.
