# Task1056 - Repair Intake Draft-to-Case Injected Route Composition Wrapper / No Global Mount No DB

## Scope

- Add a small injected route-composition wrapper that prepares the Task1051 runtime composer for a future router/app mount without registering anything globally.
- Add one unit test.
- Add one task doc.
- No global app mount, production route registration, listen startup, DB, migration, repository implementation, provider, AI, billing, admin, package, staging, cleanup, reset, revert, or stash.

## Exact Allowed Files

- `src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js`
- `tests/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.unit.test.js`
- `docs/task-1056-repair-intake-draft-to-case-injected-route-composition-wrapper-no-global-mount-no-db.md`

## Runtime Behavior

The wrapper exports:

- `createRepairIntakeDraftToCaseInjectedRouteComposition(options)`

The wrapper accepts:

- `runtimePorts`
- optional `basePath`
- optional `mountTarget`

The wrapper imports only:

- `src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js`

The wrapper validates `runtimePorts` is a plain object before composing.

If `mountTarget` is provided, the wrapper calls:

- `createRepairIntakeDraftToCaseInjectedRuntimeComposition({ ...runtimePorts, mountTarget, basePath })`

If `mountTarget` is not provided, the wrapper calls the composer without `mountTarget` and returns a sanitized readiness summary for a future injected mount.

## Sanitized Summary Contract

The wrapper returns only safe metadata:

- `ok`
- `mounted`
- `routes`
- `basePath`
- `components`
- `reasonCode`
- `requiredActions`

The wrapper never exposes:

- raw `runtimePorts`;
- raw `mountTarget`;
- route handler functions;
- app / server / router objects;
- raw composer internals;
- DB / SQL / credential / customer / LINE / final appointment / stack markers.

Fail-closed reason codes:

- `REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_PORTS_REQUIRED`
- `REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_FAILED`
- `REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_READY`
- `REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_MOUNTED`

## Unit Test Coverage

The new unit test verifies:

- missing `runtimePorts` fails closed with sanitized metadata;
- invalid / unsafe `basePath` does not leak;
- no-mount readiness composes through the runtime composer without calling synthetic ports;
- explicit synthetic `mountTarget` mounts through the runtime composer;
- mounted plan route calls draft repository and planning policy only;
- mounted submit route calls idempotency find, draft repository, planning policy, case creation, audit, and idempotency record in order;
- summaries, routes, responses, and captured payloads do not expose raw ports, mount target, handlers, DB strings, credentials, customer-sensitive fields, LINE markers, final appointment markers, or stack traces;
- wrapper source imports only the runtime composer and avoids app/server/routes/repositories/db/provider/env/AI/billing coupling markers.

## Acceptance Criteria

Task1056 is acceptable only if:

- The new route composition wrapper unit test passes.
- Task1055 remains docs-only and unchanged.
- Task1053 composer smoke test still passes.
- Task1052 composer static boundary test still passes.
- Task1051 composer unit test still passes.
- Task1049 injected composition smoke static boundary test still passes.
- Production source change is limited to `src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js`.
- No forbidden files are modified.
- No API shape changes are made.
- `git diff --cached --name-only` remains empty.

## Required Verification Commands

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.unit.test.js
node --test tests/repairIntake/repairIntakeInjectedRuntimeComposer.smoke.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposerBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.unit.test.js
node --test tests/repairIntake/repairIntakeInjectedCompositionSmokeBoundary.static.test.js
node --check src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js
node --check tests/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.unit.test.js
git diff --name-only
git diff --cached --name-only
git status --short -- src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js tests/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.unit.test.js docs/task-1056-repair-intake-draft-to-case-injected-route-composition-wrapper-no-global-mount-no-db.md
git diff --check -- src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js tests/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.unit.test.js docs/task-1056-repair-intake-draft-to-case-injected-route-composition-wrapper-no-global-mount-no-db.md
```

## Completion Report

Task1056 completed locally.

Implemented files:
- `src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js`
- `tests/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.unit.test.js`
- `docs/task-1056-repair-intake-draft-to-case-injected-route-composition-wrapper-no-global-mount-no-db.md`

Route composition wrapper behavior:
- factory export: `createRepairIntakeDraftToCaseInjectedRouteComposition(options)`.
- runtimePorts validation: requires plain object `runtimePorts`.
- no-mount readiness: calls runtime composer without `mountTarget` and returns sanitized readiness metadata.
- explicit mountTarget composition: calls runtime composer with explicit synthetic `mountTarget`.
- basePath handling: normalizes safe base paths and suppresses unsafe base path values.
- sanitized failure behavior: fails closed with route-composition reason codes.

Sanitization behavior:
- safe metadata returned: `ok`, `mounted`, `routes`, `basePath`, `components`, `reasonCode`, `requiredActions`.
- raw ports / mountTarget / handlers / internals not exposed.
- unsafe fields / markers not returned.
- reasonCodes used: ports required, failed, ready, mounted.

Scope boundaries held:
- No global app mount, production route registration, or listen startup.
- No DB / SQL / migration / `psql` / `db:migrate`.
- No real repository implementation or repository writer.
- No API shape change.
- No admin.
- No provider sending.
- No AI / RAG.
- No billing / settlement / payment / invoice.
- No staging / cleanup / revert / reset / stash.
