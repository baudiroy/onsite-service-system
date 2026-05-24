# Task1109A - Repair Intake Public Route Mount Express Router Adapter + Runtime Behavior Test / No DB No Repository Writer

## Status

Completed locally. Not staged.

## Original Blocker

Task1109 initially requested runtime behavior coverage without production source changes.

Read-only inspection showed the Task1108 skeleton passed the Express Router function directly as `mountTarget`.

The existing Repair Intake HTTP mount adapter requires a plain object mount target, so `express.Router()` was rejected as not object-like and the wrapper returned a fail-closed mount result.

Direct wrapper usage with a synthetic plain object mount target worked, but direct wrapper usage with `express.Router()` mounted zero routes.

PM authorized Task1109A to apply a narrow `src/routes/public.routes.js` correction.

## Source Correction

Express Router adapter:

```js
mountTarget: {
  post: router.post.bind(router)
}
```

Default no-runtime-ports behavior:

- `createPublicRouter()` still creates only existing public routes.
- No Repair Intake routes are mounted by default.
- No synthetic or real Repair Intake ports are created by default.

Explicit runtime ports behavior:

- `options.repairIntakeDraftToCaseRuntimePorts` mounts Repair Intake routes.

Nested runtime ports behavior:

- `options.repairIntakeDraftToCase.runtimePorts` also mounts Repair Intake routes.

Base path:

- `/repair-intake`

Existing public routes preserved:

- `POST /case-inquiry`
- `POST /line-case-inquiry`
- `POST /brand-referral/normalize`

## Runtime Behavior Coverage

The new runtime behavior test verifies:

- default public router does not mount Repair Intake routes;
- direct `repairIntakeDraftToCaseRuntimePorts` injection mounts plan and submit routes;
- nested `repairIntakeDraftToCase.runtimePorts` injection mounts plan and submit routes;
- mounted route paths are under `/repair-intake`;
- mounting routes does not execute runtime ports;
- mounted plan and submit handlers can be directly dispatched from the Express Router stack with synthetic requests;
- plan and submit responses remain sanitized and do not expose raw request, DB/SQL, credentials, customer phone/address, LINE markers, `finalAppointmentId`, token, or stack data;
- no server/listen startup is used.

Dispatch limitation:

- no limitation remained after the Express Router adapter correction; direct route-stack handler dispatch is covered.

## Static Guard Coverage

The Task1108 public route mount static guard verifies:

- wrapper-only Repair Intake import;
- no synthetic harness import;
- explicit injection required;
- no hard-coded final route suffixes in `src/routes/public.routes.js`;
- no default synthetic/real ports;
- no DB/repository/provider/app/server/listen/OpenAPI/admin/AI/billing markers.

The updated Task1107 preflight verifies:

- `src/routes/public.routes.js` remains the confirmed route mount target;
- Task1108/Task1109A wrapper markers are narrowly allowed;
- hard-coded plan/submit route suffixes remain forbidden outside the wrapper;
- direct plan/submit handlers remain forbidden in `src/routes/public.routes.js`;
- synthetic/default ports remain forbidden in `src/routes/public.routes.js`;
- DB/repository/provider/app/server/listen/env/API/admin/AI/billing coupling remains forbidden.

## Rollback Plan

Rollback for this bounded change:

- remove the Repair Intake import from `src/routes/public.routes.js`;
- remove runtime ports extraction from `src/routes/public.routes.js`;
- remove the plain `mountTarget` adapter from `src/routes/public.routes.js`;
- remove the `createRepairIntakeDraftToCaseInjectedRouteComposition` call from `src/routes/public.routes.js`;
- remove Task1108/Task1109A tests/docs if requested;
- rerun public route static/preflight verification.

No broader cleanup, revert, reset, stash, staging, or commit is authorized by this rollback note.

## Explicit Non-Goals

This task does not authorize:

- `src/app.js` changes
- `src/server.js` changes
- `src/routes/index.js` changes
- controller changes
- DB, SQL, migration, psql, or db:migrate
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

- Production source change limited to `src/routes/public.routes.js`.
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
node --test tests/repairIntake/repairIntakePublicRouteMount.runtime-behavior.test.js
node --test tests/repairIntake/repairIntakePublicRouteMount.static.test.js
node --test tests/repairIntake/repairIntakeRouteMountTargetPreflight.static.test.js
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.
