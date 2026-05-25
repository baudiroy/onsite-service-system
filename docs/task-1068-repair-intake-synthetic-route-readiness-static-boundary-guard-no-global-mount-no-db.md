# Task1068 - Repair Intake Synthetic Route Readiness Static Boundary Guard / No Global Mount No DB

## Scope

Task1068 adds a static boundary guard for the Task1067 synthetic route readiness test.

Allowed files:

- `tests/repairIntake/repairIntakeSyntheticRouteReadinessBoundary.static.test.js`
- `docs/task-1068-repair-intake-synthetic-route-readiness-static-boundary-guard-no-global-mount-no-db.md`

Read-only reference:

- `tests/repairIntake/repairIntakeSyntheticRouteReadiness.unit.test.js`

## Static Guard Coverage

The new guard verifies:

- the readiness test imports only `repairIntakeSyntheticAppCompositionHarness` from `src/repairIntake`
- lower-level route-composition, runtime composer, adapter, application service, controller, API module, and mount adapter imports remain absent
- `/synthetic-route-readiness` remains the safe base path marker
- expected plan and submit route path markers remain present
- `handleSyntheticRequest` remains the dispatch marker
- route-not-found and method-not-allowed reason codes remain present
- plan and submit success markers remain present
- global app/server/routes/repositories/db, provider, env, AI/RAG, billing, invoice, payment, production, staging, shared runtime, and listener markers remain absent
- sensitive marker strings remain confined to unsafe fixtures and redaction assertions

## Verification

Required commands:

- `node --test tests/repairIntake/repairIntakeSyntheticRouteReadinessBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeSyntheticRouteReadiness.unit.test.js`
- `node --test tests/repairIntake/repairIntakeSyntheticAppCompositionHarnessSmokeBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeSyntheticAppCompositionHarness.smoke.test.js`
- `node --test tests/repairIntake/repairIntakeSyntheticAppCompositionHarnessBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeSyntheticAppCompositionHarness.unit.test.js`
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
