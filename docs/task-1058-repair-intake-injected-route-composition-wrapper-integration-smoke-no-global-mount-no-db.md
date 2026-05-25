# Task1058 - Repair Intake Injected Route Composition Wrapper Integration Smoke / No Global Mount No DB

## Scope

- Add a smoke-style test proving the Task1056 route-composition wrapper is the single local wrapper entrypoint for a future injected route mount.
- Add one task doc.
- No production source changes.
- No modification to existing tests or existing docs.
- No global app mount, production route registration, listen startup, DB, migration, repository implementation, provider, AI, billing, admin, package, staging, cleanup, reset, revert, or stash.

## Exact Allowed Files

- `tests/repairIntake/repairIntakeInjectedRouteComposition.smoke.test.js`
- `docs/task-1058-repair-intake-injected-route-composition-wrapper-integration-smoke-no-global-mount-no-db.md`

## Read-Only Files Covered

- `src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js`

## Required Behavior

The smoke test imports only:

- `src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js`

It does not import the runtime composer, individual port adapters, controller, API module, applicationService, or mount adapter directly.

The smoke test covers no-mount route composition:

- provides valid `runtimePorts`;
- omits `mountTarget`;
- asserts the returned summary is sanitized;
- asserts the composition is not globally mounted;
- asserts no synthetic port methods are called during no-mount composition.

The smoke test covers mounted route composition:

- provides valid `runtimePorts`;
- provides explicit synthetic `mountTarget`;
- provides safe `basePath`;
- asserts the returned summary is sanitized;
- asserts mounted routes expose only safe metadata.

The smoke test dispatches through mounted synthetic routes:

- plan request once;
- submit request once with no existing idempotency result;
- submit request once with existing idempotency replay.

The smoke test verifies call behavior:

- plan uses draft + planner only;
- no-existing submit uses idempotency find, draft, planner, create, audit, idempotency record;
- replay submit uses idempotency find only and suppresses downstream ports.

The smoke test verifies no unsafe data exposure:

- no raw rows;
- no SQL / DB markers;
- no credentials;
- no phone / address / customer data;
- no LINE identity or token markers;
- no final appointment identifier;
- no stack traces;
- no raw service / controller / module / port / store / mountTarget objects;
- no handler internals.

The smoke test also checks its own source avoids:

- app / server / routes / repositories / DB;
- individual component factory module paths;
- provider senders;
- AI / RAG / vector;
- billing / invoice / payment;
- `process.env`;
- `listen(`.

## Acceptance Criteria

Task1058 is acceptable only if:

- The new route composition smoke test passes.
- Task1057 route composition static boundary test still passes.
- Task1056 route composition wrapper unit test still passes.
- Task1054 composer smoke static boundary test still passes.
- Task1053 composer smoke test still passes.
- Task1052 composer static boundary test still passes.
- No production source files are modified.
- No existing tests are modified.
- No forbidden files are modified.
- `git diff --cached --name-only` remains empty.

## Required Verification Commands

```bash
node --test tests/repairIntake/repairIntakeInjectedRouteComposition.smoke.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRouteCompositionBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.unit.test.js
node --test tests/repairIntake/repairIntakeInjectedRuntimeComposerSmokeBoundary.static.test.js
node --test tests/repairIntake/repairIntakeInjectedRuntimeComposer.smoke.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposerBoundary.static.test.js
node --check tests/repairIntake/repairIntakeInjectedRouteComposition.smoke.test.js
git diff --name-only
git diff --cached --name-only
git status --short -- tests/repairIntake/repairIntakeInjectedRouteComposition.smoke.test.js docs/task-1058-repair-intake-injected-route-composition-wrapper-integration-smoke-no-global-mount-no-db.md
git diff --check -- tests/repairIntake/repairIntakeInjectedRouteComposition.smoke.test.js docs/task-1058-repair-intake-injected-route-composition-wrapper-integration-smoke-no-global-mount-no-db.md
```

## Completion Report

Task1058 completed locally.

Implemented files only:
- `tests/repairIntake/repairIntakeInjectedRouteComposition.smoke.test.js`
- `docs/task-1058-repair-intake-injected-route-composition-wrapper-integration-smoke-no-global-mount-no-db.md`

Production source modified: no.
Existing tests modified: no.
Existing docs modified: no.

Route composition smoke coverage:
- import route composition wrapper only: route wrapper module is the only Repair Intake runtime source imported.
- no-mount route composition: valid runtimePorts compose without mountTarget and no synthetic port methods are invoked.
- mounted route composition: explicit synthetic mountTarget receives safe route handlers through the wrapper.
- safe basePath: mounted routes are normalized under the safe test basePath.
- plan route: calls draft repository and planning policy only.
- submit route no-existing: calls idempotency find, draft repository, planning policy, case creation, audit, and idempotency record.
- submit route replay: calls idempotency find only and suppresses downstream ports.
- call order: verified for plan, no-existing submit, and replay.
- downstream suppression: verified replay path.
- summary / route / response sanitization: verified with unsafe synthetic fixtures.
- no forbidden source mentions: direct composer/component imports and production/global/provider/AI/billing markers checked absent.

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
