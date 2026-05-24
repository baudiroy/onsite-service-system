# Task1113 - Repair Intake App Router Public Route Option Propagation / No DB No Repository Writer

## Status

Completed locally. Not staged.

## Implemented / Changed Files

- `src/routes/index.js`
- `tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.static.test.js`
- `tests/repairIntake/repairIntakeAppRouterAggregationPreflight.static.test.js`
- `docs/task-1113-repair-intake-app-router-public-route-option-propagation-no-db-no-repository-writer.md`

## App Router Propagation Behavior

Target route file:

- `src/routes/index.js`

`createAppRouter(options = {})` signature is preserved.

The app router now imports the public route factory:

```js
const { createPublicRouter } = require('./public.routes');
```

The app router creates the public router inside `createAppRouter(options = {})`:

```js
const publicRouter = createPublicRouter({
  repairIntakeDraftToCaseRuntimePorts: options.repairIntakeDraftToCaseRuntimePorts,
  repairIntakeDraftToCase: options.repairIntakeDraftToCase
});
```

Direct runtime ports propagation:

- `options.repairIntakeDraftToCaseRuntimePorts`

Nested runtime ports propagation:

- `options.repairIntakeDraftToCase.runtimePorts`, still resolved inside `src/routes/public.routes.js`

Existing route aggregation is preserved:

- `appRouter.use('/api/v1/public', publicRouter)`

No default synthetic or real Repair Intake ports are created.

`src/routes/index.js` does not import Repair Intake internals. Public routes still own the Repair Intake wrapper import and mount skeleton.

## Static Guard Coverage

Added:

- `tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.static.test.js`

Updated:

- `tests/repairIntake/repairIntakeAppRouterAggregationPreflight.static.test.js`

The static guards verify:

- `src/routes/index.js` still defines and exports `createAppRouter(options = {})`;
- `src/routes/index.js` imports `createPublicRouter` from `./public.routes`;
- `src/routes/index.js` calls `createPublicRouter(...)` inside `createAppRouter(options = {})`;
- direct runtime ports are propagated through `repairIntakeDraftToCaseRuntimePorts`;
- nested runtime ports are propagated through `repairIntakeDraftToCase`;
- existing public route aggregation remains mounted at `/api/v1/public`;
- no Repair Intake lower-level imports appear in `src/routes/index.js`;
- no default synthetic or real Repair Intake ports are created in `src/routes/index.js`;
- `src/routes/public.routes.js` still owns the Repair Intake wrapper import and mount skeleton;
- app/server Repair Intake shortcut propagation is still absent;
- no DB, repository, provider, app/server/listen, OpenAPI, admin, AI/RAG, or billing coupling is introduced in the route index propagation path.

## Scope Boundaries Held

- No `src/app.js` change.
- No `src/server.js` change.
- No `src/routes/public.routes.js` change.
- No `src/controllers/**` change.
- No `src/repositories/**` change.
- No `src/db/**` change.
- No `src/repairIntake/**` change.
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

## Rollback Notes

Rollback is limited to:

- restore `src/routes/index.js` to mounting the default `publicRouter`;
- delete `tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.static.test.js`;
- restore the Task1112 preflight assertions to the pre-propagation shape if needed;
- delete this Task1113 doc.

No DB or repository rollback is needed.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.static.test.js
node --test tests/repairIntake/repairIntakeAppRouterAggregationPreflight.static.test.js
node --test tests/repairIntake/repairIntakePublicRouteMountRegression.static.test.js
node --test tests/repairIntake/repairIntakePublicRouteMount.runtime-behavior.test.js
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.
