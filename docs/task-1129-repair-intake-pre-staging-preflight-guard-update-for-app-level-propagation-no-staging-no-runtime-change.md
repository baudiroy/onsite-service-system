# Task1129 - Repair Intake Pre-Staging Preflight Guard Update for App-Level Propagation / No Staging No Runtime Change

## Status

Completed locally. Not staged.

## Task1128 Failure Cause

Task1128 marked staging blocked because two stale preflight guards failed:

- `tests/repairIntake/repairIntakeRouteMountTargetPreflight.static.test.js`
- `tests/repairIntake/repairIntakeAppRouterAggregationPreflight.static.test.js`

Both failures came from preflight expectations that still treated `src/app.js` Repair Intake markers as forbidden even after Task1118 accepted app-factory route option propagation.

## Accepted Correction

Task1129 updates only the stale preflight guards.

No production source files are modified.

No staging occurs.

## Route Mount Target Preflight Correction

Updated:

- `tests/repairIntake/repairIntakeRouteMountTargetPreflight.static.test.js`

The guard now accepts:

- Task1108A public route wrapper-only markers in `src/routes/public.routes.js`;
- Task1113 app-router pass-through markers in `src/routes/index.js`;
- Task1118 app-factory pass-through markers in `src/app.js`.

The guard still forbids:

- Repair Intake route composition wrapper outside public routes;
- synthetic app composition harness;
- hard-coded plan/submit route suffixes outside the approved public route skeleton;
- default synthetic or real runtime ports;
- DB/repository imports;
- `process.env.REPAIR_INTAKE`;
- `DATABASE_URL`;
- app/server/listen coupling.

`src/server.js` must still contain no Repair Intake markers.

## App Router Aggregation Preflight Correction

Updated:

- `tests/repairIntake/repairIntakeAppRouterAggregationPreflight.static.test.js`

The guard now accepts:

- Task1113 route-index propagation markers;
- Task1118 app-factory propagation markers.

The guard still confirms:

- `src/routes/index.js` owns app-router propagation into `createPublicRouter`;
- `src/routes/public.routes.js` owns the explicit-injection-only public route skeleton;
- `src/server.js` has no Repair Intake markers.

The guard still blocks:

- Repair Intake internals in `src/app.js` or `src/routes/index.js`;
- default synthetic or real ports;
- DB/repository imports;
- provider/admin/API/OpenAPI/AI/billing coupling;
- server/listen startup coupling.

## Accepted `src/app.js` Markers

The following markers are now accepted in `src/app.js`:

- `repairIntakeDraftToCaseRuntimePorts`
- `repairIntakeDraftToCase`

They are accepted only as option pass-through markers into `createAppRouter`.

## Still-Forbidden Markers

Still forbidden in the app/router pass-through path:

- `createRepairIntakeDraftToCaseInjectedRouteComposition` outside `src/routes/public.routes.js`;
- `repairIntakeDraftToCaseInjectedRuntimeComposer`;
- `repairIntakeDraftToCaseHttpMountAdapter`;
- `createRepairIntakeSyntheticAppCompositionHarness`;
- `new DraftRepository`;
- `new CaseRepository`;
- DB/repository imports;
- `process.env.REPAIR_INTAKE`;
- `DATABASE_URL`;
- app/server/listen coupling;
- provider sending;
- API/OpenAPI/admin coupling;
- AI/RAG coupling;
- billing, settlement, payment, or invoice coupling.

## Verification

- `git diff --cached --name-only` before verification: empty.
- `node --test tests/repairIntake/repairIntakeRouteMountTargetPreflight.static.test.js`: PASS, 7/7.
- `node --test tests/repairIntake/repairIntakeAppRouterAggregationPreflight.static.test.js`: PASS, 6/6.
- `node --test tests/repairIntake/repairIntakePublicRouteMount.static.test.js tests/repairIntake/repairIntakeRouteMountTargetPreflight.static.test.js tests/repairIntake/repairIntakePublicRouteMount.runtime-behavior.test.js tests/repairIntake/repairIntakePublicRouteMountRegression.static.test.js tests/repairIntake/repairIntakeAppRouterAggregationPreflight.static.test.js tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.static.test.js tests/repairIntake/repairIntakeAppRouterPublicRoutePropagation.runtime-behavior.test.js tests/repairIntake/repairIntakeAppRouterPropagationRegression.static.test.js tests/repairIntake/repairIntakeAppFactoryRouteOptionsPreflight.static.test.js tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.static.test.js tests/repairIntake/repairIntakeAppFactoryRouteOptionPropagation.runtime-behavior.test.js tests/repairIntake/repairIntakeAppFactoryRoutePropagationRegression.static.test.js tests/repairIntake/repairIntakeServerStartupBoundaryPreflight.static.test.js`: PASS, 84/84.
