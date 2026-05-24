# Task1118 - Repair Intake App Factory Route Option Propagation / No DB No Repository Writer

## Status

Completed locally. Not staged.

## Implemented / Changed Files

- `src/app.js`
- `tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.static.test.js`
- `tests/repairIntake/repairIntakeAppFactoryRouteOptionsPreflight.static.test.js`
- `docs/task-1118-repair-intake-app-factory-route-option-propagation-no-db-no-repository-writer.md`

## App Factory Propagation Behavior

Target app file:

- `src/app.js`

`createApp(options = {})` signature is preserved.

Exported default app behavior is preserved:

- `const app = createApp();`
- `module.exports` still includes `app` and `createApp`.

The `createAppRouter({ ... })` invocation now includes:

```js
repairIntakeDraftToCaseRuntimePorts: options.repairIntakeDraftToCaseRuntimePorts,
repairIntakeDraftToCase: options.repairIntakeDraftToCase,
```

Direct runtime ports propagation:

- `options.repairIntakeDraftToCaseRuntimePorts`

Nested runtime ports propagation:

- `options.repairIntakeDraftToCase`

No default synthetic or real Repair Intake runtime ports are created.

No Repair Intake internals are imported by `src/app.js`.

Server startup is untouched:

- `src/server.js` was not modified;
- no `listen` behavior was changed;
- server shortcut propagation remains outside Task1118.

Existing app middleware/router behavior remains preserved.

## Static Guard Coverage

Added:

- `tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.static.test.js`

Updated:

- `tests/repairIntake/repairIntakeAppFactoryRouteOptionsPreflight.static.test.js`

The static guards verify:

- `src/app.js` still defines and exports `createApp(options = {})`;
- exported default `app` behavior is preserved;
- `src/app.js` calls `createAppRouter({ ... })`;
- direct Repair Intake runtime ports are propagated from `options.repairIntakeDraftToCaseRuntimePorts`;
- nested Repair Intake route options are propagated from `options.repairIntakeDraftToCase`;
- existing app route options for customer access, data correction, engineer mobile, and engineer mobile workbench remain present;
- `src/app.js` imports no Repair Intake internals, DB modules, repository modules, server module, or route internals;
- `src/app.js` creates no default synthetic or real Repair Intake runtime ports;
- `src/server.js` remains untouched and free of Repair Intake route option markers;
- `src/routes/index.js` remains the downstream owner of public route propagation;
- no DB, repository, provider, server/listen, OpenAPI, admin, AI/RAG, billing, settlement, payment, invoice, or package coupling is introduced in the app route option propagation block.

## Scope Boundaries Held

- No `src/server.js` change.
- No `src/routes/**` change.
- No `src/controllers/**` change.
- No `src/repositories/**` change.
- No `src/db/**` change.
- No `src/repairIntake/**` change.
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

## Rollback Notes

Rollback is limited to:

- remove the two Repair Intake option pass-through lines from `src/app.js`;
- delete `tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.static.test.js`;
- restore Task1117 preflight assertions to the pre-propagation state if needed;
- delete this Task1118 doc.

No DB, repository, provider, server/listen, admin, AI/RAG, or billing rollback is needed.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.static.test.js
node --test tests/repairIntake/repairIntakeAppFactoryRouteOptionsPreflight.static.test.js
node --test tests/repairIntake/repairIntakeAppRouterPropagationRegression.static.test.js
node --test tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.runtime-behavior.test.js
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.
