# Task1108 - Repair Intake Public Route Mount Static Skeleton / No DB No Repository Writer

## Status

Completed locally. Not staged.

## Purpose

Add a bounded, fail-closed Repair Intake public route mount skeleton in the confirmed target:

- `src/routes/public.routes.js`

This is the first bounded production route file touch for Repair Intake route mounting, but it does not wire real DB, repository, provider, or runtime behavior.

## Implemented / Changed Files

- `src/routes/public.routes.js`
- `tests/repairIntake/repairIntakePublicRouteMount.static.test.js`
- `docs/task-1108-repair-intake-public-route-mount-static-skeleton-no-db-no-repository-writer.md`

## Public Route Mount Skeleton Behavior

Target route file:

- `src/routes/public.routes.js`

Imported wrapper:

- `createRepairIntakeDraftToCaseInjectedRouteComposition`
- imported from `../repairIntake/repairIntakeDraftToCaseInjectedRouteComposition`

Default no-runtime-ports behavior:

- `createPublicRouter()` still works without Repair Intake runtime ports.
- `publicRouter` is still created with `createPublicRouter()`.
- Repair Intake route composition is not called when runtime ports are absent.

Explicit runtime ports mount behavior:

- runtime ports may be injected through `options.repairIntakeDraftToCaseRuntimePorts`; or
- runtime ports may be injected through `options.repairIntakeDraftToCase.runtimePorts`.

When runtime ports are provided, `src/routes/public.routes.js` calls:

```js
createRepairIntakeDraftToCaseInjectedRouteComposition({
  runtimePorts,
  basePath: '/repair-intake',
  mountTarget: router
});
```

Base path:

- `/repair-intake`

Existing public routes preserved:

- `POST /case-inquiry`
- `POST /line-case-inquiry`
- `POST /brand-referral/normalize`

Fail-closed behavior:

- no runtime ports means no Repair Intake mount attempt;
- no synthetic ports are created inside `src/routes/public.routes.js`;
- no real ports are created inside `src/routes/public.routes.js`;
- no DB, repository, provider, env, app, server, listen, OpenAPI, admin, AI/RAG, billing, or package coupling was added.

## Static Guard Coverage

The new static guard verifies:

- public routes import only the injected Repair Intake route-composition wrapper from Repair Intake code;
- public routes do not import synthetic app harness;
- default public router path does not require Repair Intake runtime ports;
- Repair Intake mount is conditional on explicit injected runtime ports;
- basePath is `/repair-intake`;
- route suffixes are not hard-coded in `src/routes/public.routes.js`;
- existing public routes and exports remain present;
- no DB, repository, app, server, listen, provider, OpenAPI, admin, AI/RAG, billing, invoice, payment, psql, db:migrate, or migration markers were introduced.

## Task1108A Preflight Conflict Resolution

Original conflict:

- Task1107 preflight expected inspected route files to contain no Repair Intake route mount markers.
- Task1108 intentionally adds a wrapper-only skeleton marker to `src/routes/public.routes.js`.
- Therefore the original Task1107 preflight failed after the authorized Task1108 route-file touch.

Accepted correction:

- PM authorized a narrow Task1108A update to `tests/repairIntake/repairIntakeRouteMountTargetPreflight.static.test.js`.
- The updated preflight now treats Task1108 wrapper-only markers in `src/routes/public.routes.js` as expected.
- The updated preflight still fails on hard-coded final route suffixes, direct plan/submit handlers, synthetic harness creation, DB/repository/provider/env/listen coupling, and server/app/index route changes.

Wrapper marker presence is expected because Task1108 is the first bounded production route file touch for the Repair Intake mount skeleton. The skeleton remains explicit-injection-only and does not create runtime ports by default.

## Rollback Plan

To roll back this skeleton:

- remove the `createRepairIntakeDraftToCaseInjectedRouteComposition` import from `src/routes/public.routes.js`;
- remove `getRepairIntakeDraftToCaseRuntimePorts`;
- remove `mountRepairIntakeDraftToCaseRoutesIfConfigured`;
- remove the `mountRepairIntakeDraftToCaseRoutesIfConfigured(router, options)` call;
- remove the Task1108 static test and doc if requested;
- rerun Task1107 and Task1108 verification commands;
- confirm `src/app.js`, `src/server.js`, `src/routes/index.js`, controllers, repositories, DB, migrations, providers, admin, AI/RAG, billing, package files, and OpenAPI files remain untouched.

## Explicit Non-Goals

This task does not authorize:

- listen/server startup
- DB, SQL, migration, psql, or db:migrate
- migration creation or modification
- real repository implementation
- repository writer or repository imports
- imports from `src/repositories/**` or `src/db/**`
- OpenAPI expansion
- admin changes
- provider sending
- LINE, SMS, App, email, or webhook work
- AI/RAG
- billing, settlement, payment, or invoice work
- package changes
- staging, cleanup, revert, reset, or stash

## Boundaries Held

- No `src/app.js` changes.
- No `src/server.js` changes.
- No `src/routes/index.js` changes.
- No `src/controllers/**` changes.
- No `src/repositories/**` changes.
- No `src/db/**` changes.
- No `src/repairIntake/**` changes.
- No migrations.
- No admin changes.
- No package changes.
- No DB, SQL, migration, psql, or db:migrate.
- No real repository implementation.
- No repository writer or repository imports.
- No API shape or OpenAPI expansion.
- No provider sending.
- No AI/RAG.
- No billing, settlement, payment, or invoice changes.
- No staging, cleanup, revert, reset, or stash.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakePublicRouteMount.static.test.js
node --test tests/repairIntake/repairIntakeRouteMountTargetPreflight.static.test.js
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.
