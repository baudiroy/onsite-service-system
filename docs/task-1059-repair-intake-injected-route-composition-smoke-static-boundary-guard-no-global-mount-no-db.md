# Task1059 - Repair Intake Injected Route Composition Smoke Static Boundary Guard / No Global Mount No DB

## Scope

Task1059 adds a static boundary guard for the Task1058 route-composition smoke test.

Allowed files:

- `tests/repairIntake/repairIntakeInjectedRouteCompositionSmokeBoundary.static.test.js`
- `docs/task-1059-repair-intake-injected-route-composition-smoke-static-boundary-guard-no-global-mount-no-db.md`

Read-only reference:

- `tests/repairIntake/repairIntakeInjectedRouteComposition.smoke.test.js`

## Boundary

This task does not modify production source, existing tests, migrations, admin files, package files, guardrails, or design docs.

It does not add a global app mount, production route registration, listener startup, DB access, SQL, migration, repository implementation, provider sending, AI/RAG, billing, invoice, payment, staging, cleanup, revert, reset, stash, commit, or staging step.

## Static Guard Coverage

The new boundary test reads `repairIntakeInjectedRouteComposition.smoke.test.js` and verifies:

- the smoke imports only `repairIntakeDraftToCaseInjectedRouteComposition` from `src/repairIntake`
- lower-level composer, adapter, service, controller, API module, and mount adapter sources are not directly imported
- no-mount route composition scenario markers remain present
- explicit synthetic mount target scenario markers remain present
- safe base path and route dispatch markers remain present
- plan, submit no-existing, and replay scenario markers remain present
- no-existing submit call order remains idempotency find -> draft -> planner -> create -> audit -> idempotency record
- replay call order remains idempotency find only
- global app/server/routes/repositories/db, provider, AI/RAG, billing, process env, listen, smoke script, shared runtime, production, staging, and Zeabur markers remain absent
- sensitive test markers remain confined to unsafe fixtures and redaction assertions

## Verification

Required commands:

- `node --test tests/repairIntake/repairIntakeInjectedRouteCompositionSmokeBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeInjectedRouteComposition.smoke.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRouteCompositionBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.unit.test.js`
- `node --test tests/repairIntake/repairIntakeInjectedRuntimeComposerSmokeBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeInjectedRuntimeComposer.smoke.test.js`
- `git diff --name-only`
- `git diff --cached --name-only`

## Completion Notes

Task1059 is complete when the new static guard and the adjacent route-composition/composer tests pass, `git diff --cached --name-only` remains empty, and the new files remain untracked unless PM asks for a different git operation.
