# Task1122 - Repair Intake Server Startup Boundary Preflight / No Runtime Change

## Status

Completed locally. Not staged.

Task1122 is a static preflight checkpoint only. It does not modify runtime behavior.

## Inspected Files

- `src/server.js`
- `src/app.js`
- `src/routes/index.js`
- `src/routes/public.routes.js`

## Server Startup Shape

`src/server.js` owns server bootstrap and startup behavior:

- `resolveServerApp(options = {})`
- `createServerBootstrap(options = {})`
- `startServer(options = {})`
- `app.listen(...)`
- `if (require.main === module) { startServer(); }`

`src/server.js` currently has no Repair Intake route option markers:

- no `repairIntakeDraftToCaseRuntimePorts`
- no `repairIntakeDraftToCase`
- no `Repair Intake`

`src/server.js` does not construct Repair Intake runtime ports, does not read Repair Intake route options, and does not enable Repair Intake routes from environment variables.

## Current Top Boundary

The current top boundary for Repair Intake route option propagation is:

- `createApp(options)` in `src/app.js`

`src/app.js` contains the accepted Task1118 app-factory propagation:

```js
repairIntakeDraftToCaseRuntimePorts: options.repairIntakeDraftToCaseRuntimePorts,
repairIntakeDraftToCase: options.repairIntakeDraftToCase,
```

This means runtime ports must be supplied explicitly to `createApp(options)`.

`src/app.js` does not import Repair Intake internals and does not create default synthetic or real Repair Intake runtime ports.

## Router / Public Propagation State

`src/routes/index.js` contains the accepted Task1113 app-router propagation:

- passes `options.repairIntakeDraftToCaseRuntimePorts`;
- passes `options.repairIntakeDraftToCase`;
- passes both into `createPublicRouter`;
- preserves the public route aggregation path.

`src/routes/public.routes.js` contains the accepted Task1108A explicit-injection-only public route skeleton:

- imports `createRepairIntakeDraftToCaseInjectedRouteComposition` only;
- accepts direct runtime ports from `repairIntakeDraftToCaseRuntimePorts`;
- accepts nested runtime ports from `repairIntakeDraftToCase.runtimePorts`;
- creates no default synthetic or real ports;
- remains conditional on runtime ports;
- uses `{ post: router.post.bind(router) }` as the Express Router mount target adapter.

## Environment-Driven Enablement

Task1122 confirms no Repair Intake route mount enablement is driven by:

- `process.env.REPAIR_INTAKE`
- `REPAIR_INTAKE_ENABLED`
- `DATABASE_URL`
- DB credentials
- provider setup
- OpenAPI/admin wiring
- AI/RAG setup
- billing, settlement, payment, or invoice setup

## Future Server-Level Decision

Server-level propagation is not needed now.

Default PM recommendation:

- keep server startup untouched unless the user explicitly asks to inject Repair Intake runtime ports from server config or environment.

If server-level propagation is requested later, it should be a separate bounded task with explicit authorization for `src/server.js`. That task should first decide whether runtime ports come from an external app object, a server option, a config composer, or a repository/DB-backed implementation. It must not be bundled into DB/repository writer work.

## Rollback / Safety Notes

Task1122 added only a static test and a documentation checkpoint.

Rollback is deleting:

- `tests/repairIntake/repairIntakeServerStartupBoundaryPreflight.static.test.js`
- `docs/task-1122-repair-intake-server-startup-boundary-preflight-no-runtime-change.md`

No runtime source file, app/server file, route file, migration, admin file, package file, DB artifact, provider integration, OpenAPI artifact, AI/RAG artifact, or billing artifact was modified.

No staging, cleanup, revert, reset, or stash was performed.

## Scope Boundaries Held

- No production source files modified.
- No existing tests modified.
- No app/server/route files modified.
- No migrations.
- No admin changes.
- No package changes.
- No server/listen startup change.
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
node --test tests/repairIntake/repairIntakeServerStartupBoundaryPreflight.static.test.js
node --test tests/repairIntake/repairIntakeAppFactoryRoutePropagationRegression.static.test.js
node --test tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.runtime-behavior.test.js
node --test tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.static.test.js
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.
