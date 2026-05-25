# Task1064 - Repair Intake Synthetic App Harness Smoke Static Boundary Guard / No Global Mount No DB

## Scope

Task1064 adds a static boundary guard for the Task1063 synthetic app harness smoke test.

Allowed files:

- `tests/repairIntake/repairIntakeSyntheticAppCompositionHarnessSmokeBoundary.static.test.js`
- `docs/task-1064-repair-intake-synthetic-app-harness-smoke-static-boundary-guard-no-global-mount-no-db.md`

Read-only reference:

- `tests/repairIntake/repairIntakeSyntheticAppCompositionHarness.smoke.test.js`

## Static Guard Coverage

The new static guard verifies:

- the smoke imports only `repairIntakeSyntheticAppCompositionHarness` from `src/repairIntake`
- lower-level route-composition, runtime composer, adapter, application service, controller, API module, and mount adapter imports remain absent
- `handleSyntheticRequest` remains the synthetic HTTP-like dispatch entrypoint
- the `/synthetic-harness-smoke` safe base path marker remains present
- plan, submit no-existing, submit replay, unmatched POST path, and unsupported method scenario markers remain present
- no-existing submit call order remains idempotency find -> draft -> planner -> create -> audit -> record
- replay remains idempotency find only
- app/server/routes/repositories/db, provider, env, AI/RAG, billing, invoice, payment, production, staging, shared runtime, and listener markers remain absent
- sensitive marker strings remain confined to unsafe fixtures and redaction assertions

## Verification

Required commands:

- `node --test tests/repairIntake/repairIntakeSyntheticAppCompositionHarnessSmokeBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeSyntheticAppCompositionHarness.smoke.test.js`
- `node --test tests/repairIntake/repairIntakeSyntheticAppCompositionHarnessBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeSyntheticAppCompositionHarness.unit.test.js`
- `node --test tests/repairIntake/repairIntakeInjectedRouteCompositionSmokeBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeInjectedRouteComposition.smoke.test.js`
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
