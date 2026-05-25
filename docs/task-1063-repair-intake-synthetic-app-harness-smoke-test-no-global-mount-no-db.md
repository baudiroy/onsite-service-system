# Task1063 - Repair Intake Synthetic App Harness Smoke Test / No Global Mount No DB

## Scope

Task1063 adds a harness-only smoke test for the Task1061 synthetic app-like composition harness.

Allowed files:

- `tests/repairIntake/repairIntakeSyntheticAppCompositionHarness.smoke.test.js`
- `docs/task-1063-repair-intake-synthetic-app-harness-smoke-test-no-global-mount-no-db.md`

Read-only reference:

- `src/repairIntake/repairIntakeSyntheticAppCompositionHarness.js`

## Smoke Coverage

The smoke test imports only:

- `../../src/repairIntake/repairIntakeSyntheticAppCompositionHarness`

It verifies:

- harness creation with valid synthetic runtime ports and safe base path
- safe route summary metadata
- plan dispatch through `handleSyntheticRequest`
- submit dispatch with no existing idempotency result
- submit dispatch with existing idempotency replay
- unmatched POST path response
- unsupported non-POST method response
- plan call order is draft repository then planning policy
- no-existing submit call order is idempotency find -> draft -> planner -> create -> audit -> record
- replay suppresses downstream ports and calls idempotency find only
- responses and captured port payloads stay sanitized
- source-level guard confirms the smoke does not directly import lower-level route-composition, composer, adapter, controller, API, service, mount, app/server/routes, DB, provider, AI/RAG, billing, process env, or listener markers

## Verification

Required commands:

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
