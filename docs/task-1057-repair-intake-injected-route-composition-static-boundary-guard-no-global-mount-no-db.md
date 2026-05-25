# Task1057 - Repair Intake Injected Route Composition Static Boundary Guard / No Global Mount No DB

## Scope

- Add a static boundary guard for the Task1056 injected route-composition wrapper source.
- Add one task doc.
- No production source changes.
- No modification to existing tests or existing docs.
- No global app mount, production route registration, listen startup, DB, migration, repository implementation, provider, AI, billing, admin, package, staging, cleanup, reset, revert, or stash.

## Exact Allowed Files

- `tests/repairIntake/repairIntakeDraftToCaseInjectedRouteCompositionBoundary.static.test.js`
- `docs/task-1057-repair-intake-injected-route-composition-static-boundary-guard-no-global-mount-no-db.md`

## Read-Only Files Covered

- `src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js`

## Required Behavior

The static boundary guard reads the Task1056 wrapper source and protects it from drifting into direct component imports, global route mounting, app/server startup, DB/repository coupling, provider calls, AI/RAG, billing, or API shape changes.

The guard asserts the wrapper keeps expected source markers:

- `createRepairIntakeDraftToCaseInjectedRouteComposition`
- `createRepairIntakeDraftToCaseInjectedRuntimeComposition`
- `runtimePorts`
- `mountTarget`
- `basePath`
- `routes`
- `components`
- `requiredActions`
- `safeBasePath`
- `sanitizeComposerSummary`
- `routeReasonCode`
- `componentSummary`
- `routeSummary`

The guard asserts the wrapper keeps expected reasonCode markers:

- `REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_PORTS_REQUIRED`
- `REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_FAILED`
- `REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_READY`
- `REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_MOUNTED`

The guard asserts the wrapper imports only the runtime composer from Repair Intake runtime code and does not import individual component modules directly:

- `repairIntakeIdempotencyPortAdapter`
- `repairIntakeDraftReaderPortAdapter`
- `repairIntakeCasePlannerPortAdapter`
- `repairIntakeCaseCreatorPortAdapter`
- `repairIntakeAuditWriterPortAdapter`
- `repairIntakeDraftToCaseApplicationService`
- `repairIntakeDraftToCaseController`
- `repairIntakeDraftToCaseApiModule`
- `repairIntakeDraftToCaseHttpMountAdapter`

The guard asserts the wrapper keeps both wrapper paths:

- no-mount readiness path;
- explicit injected `mountTarget` composition path.

The guard asserts forbidden coupling markers are absent:

- app / server / routes / controller / repository / DB imports;
- global listen/startup markers;
- env/provider markers;
- SQL / DB implementation markers;
- provider sending markers;
- AI/vector markers;
- billing/invoice/payment markers.

## Acceptance Criteria

Task1057 is acceptable only if:

- The new route composition static boundary test passes.
- Task1056 route composition wrapper unit test still passes.
- Task1053 composer smoke test still passes.
- Task1052 composer static boundary test still passes.
- Task1051 composer unit test still passes.
- No production source files are modified.
- No existing tests are modified.
- No forbidden files are modified.
- `git diff --cached --name-only` remains empty.

## Required Verification Commands

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRouteCompositionBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.unit.test.js
node --test tests/repairIntake/repairIntakeInjectedRuntimeComposer.smoke.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposerBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.unit.test.js
node --check tests/repairIntake/repairIntakeDraftToCaseInjectedRouteCompositionBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
git status --short -- tests/repairIntake/repairIntakeDraftToCaseInjectedRouteCompositionBoundary.static.test.js docs/task-1057-repair-intake-injected-route-composition-static-boundary-guard-no-global-mount-no-db.md
git diff --check -- tests/repairIntake/repairIntakeDraftToCaseInjectedRouteCompositionBoundary.static.test.js docs/task-1057-repair-intake-injected-route-composition-static-boundary-guard-no-global-mount-no-db.md
```

## Completion Report

Task1057 completed locally.

Implemented files only:
- `tests/repairIntake/repairIntakeDraftToCaseInjectedRouteCompositionBoundary.static.test.js`
- `docs/task-1057-repair-intake-injected-route-composition-static-boundary-guard-no-global-mount-no-db.md`

Production source modified: no.
Existing tests modified: no.
Existing docs modified: no.

Route composition static boundary coverage:
- wrapper factory: confirms `createRepairIntakeDraftToCaseInjectedRouteComposition`.
- runtime composer import: confirms only `repairIntakeDraftToCaseInjectedRuntimeComposer` is imported.
- runtimePorts validation: confirms runtimePorts marker.
- mountTarget handling: confirms explicit mountTarget composition path.
- basePath handling: confirms basePath and safeBasePath markers.
- sanitized metadata fields: confirms routes, components, and requiredActions markers.
- route-composition reasonCodes: confirms ports required, failed, ready, and mounted codes.
- individual component direct imports blocked: confirms adapter/controller/API/applicationService/mount module markers are absent.
- forbidden app/server/routes/repositories/db coupling: checked absent.
- forbidden provider/API/env/billing markers: checked absent.

Scope boundaries held:
- No `src/**`.
- No existing tests modified.
- No `migrations/**`.
- No `admin/**`.
- No package changes.
- No global app mount, production route registration, or listen startup.
- No DB / SQL / migration / `psql` / `db:migrate`.
- No real repository implementation or repository writer.
- No API shape change.
- No provider sending.
- No AI / RAG.
- No billing / settlement / payment / invoice.
- No staging / cleanup / revert / reset / stash.
