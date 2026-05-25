# Task1062 - Repair Intake Synthetic App Composition Harness Static Boundary Guard / No Global Mount No DB

## Scope

Task1062 adds a static boundary guard for the Task1061 synthetic app-like composition harness source.

Allowed files:

- `tests/repairIntake/repairIntakeSyntheticAppCompositionHarnessBoundary.static.test.js`
- `docs/task-1062-repair-intake-synthetic-app-composition-harness-static-boundary-guard-no-global-mount-no-db.md`

Read-only reference:

- `src/repairIntake/repairIntakeSyntheticAppCompositionHarness.js`

## Static Guard Coverage

The new boundary test reads `repairIntakeSyntheticAppCompositionHarness.js` and verifies:

- the source keeps `createRepairIntakeSyntheticAppCompositionHarness`
- the source calls `createRepairIntakeDraftToCaseInjectedRouteComposition`
- `runtimePorts`, `basePath`, `mountTarget`, and `handleSyntheticRequest` markers remain present
- the internal synthetic mount target and dispatch markers remain present
- all Task1061 harness reason codes remain present
- the harness imports only `repairIntakeDraftToCaseInjectedRouteComposition` from local Repair Intake runtime code
- lower-level composer, adapter, application service, controller, API module, and mount adapter imports remain absent
- app/server/routes/controllers/repositories/db coupling remains absent
- global listener, provider, env, DB/SQL, AI/RAG, billing, invoice, and payment markers remain absent

## Verification

Required commands:

- `node --test tests/repairIntake/repairIntakeSyntheticAppCompositionHarnessBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeSyntheticAppCompositionHarness.unit.test.js`
- `node --test tests/repairIntake/repairIntakeInjectedRouteCompositionSmokeBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeInjectedRouteComposition.smoke.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRouteCompositionBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.unit.test.js`
- `git diff --name-only`
- `git diff --cached --name-only`

## Non-Goals

- No production source changes.
- No existing test changes.
- No global app mount.
- No production route registration.
- No listener startup.
- No DB, SQL, migration, `psql`, or `db:migrate`.
- No real repository implementation or repository writer.
- No API shape change.
- No admin change.
- No provider sending.
- No AI / RAG.
- No billing, settlement, payment, or invoice.
- No staging, cleanup, revert, reset, stash, or commit.
