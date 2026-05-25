# Task1053 - Repair Intake Injected Runtime Composer Integration Smoke / No Global Mount No DB

## Scope

- Add a smoke-style test proving the Task1051 runtime composer is the single local factory entrypoint for the full pure injected chain.
- Add one task doc.
- No production source changes.
- No modification to existing tests or existing docs.
- No global app mount, production route registration, listen startup, DB, migration, repository implementation, provider, AI, billing, admin, package, staging, cleanup, reset, revert, or stash.

## Exact Allowed Files

- `tests/repairIntake/repairIntakeInjectedRuntimeComposer.smoke.test.js`
- `docs/task-1053-repair-intake-injected-runtime-composer-integration-smoke-no-global-mount-no-db.md`

## Read-Only Files Covered

- `src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js`

## Required Behavior

The smoke test imports only:

- `src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js`

It does not import individual port adapters, controller, API module, applicationService, or HTTP mount adapter factories directly. The composer is the sole composition entrypoint.

The smoke test covers no-mount composition:

- provides valid synthetic ports;
- omits `mountTarget`;
- asserts the returned summary is sanitized;
- asserts no HTTP mount is active;
- asserts no synthetic port methods are called during composition.

The smoke test covers explicit mounted composition:

- provides valid synthetic ports;
- provides explicit synthetic `mountTarget`;
- asserts the returned summary is sanitized;
- asserts the explicit mount path is active;
- asserts routes expose only method/path metadata.

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
- no raw service / controller / module / port / store objects;
- no handler internals.

The smoke test also checks its own source avoids direct factory imports and forbidden production/global/runtime markers:

- app / server / routes / repositories / DB;
- provider senders;
- AI / RAG / vector;
- billing / invoice / payment;
- `process.env`;
- `listen(`.

## Acceptance Criteria

Task1053 is acceptable only if:

- The new composer smoke test passes.
- Task1052 composer static boundary test still passes.
- Task1051 composer unit test still passes.
- Task1049 injected composition smoke static boundary test still passes.
- Task1048 injected composition smoke test still passes.
- Task1046 aggregate full pure-port chain static boundary test still passes.
- No production source files are modified.
- No existing tests are modified.
- No forbidden files are modified.
- `git diff --cached --name-only` remains empty.

## Required Verification Commands

```bash
node --test tests/repairIntake/repairIntakeInjectedRuntimeComposer.smoke.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposerBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.unit.test.js
node --test tests/repairIntake/repairIntakeInjectedCompositionSmokeBoundary.static.test.js
node --test tests/repairIntake/repairIntakeInjectedComposition.smoke.test.js
node --test tests/repairIntake/repairIntakeFullPurePortChainBoundary.static.test.js
node --check tests/repairIntake/repairIntakeInjectedRuntimeComposer.smoke.test.js
git diff --name-only
git diff --cached --name-only
git status --short -- tests/repairIntake/repairIntakeInjectedRuntimeComposer.smoke.test.js docs/task-1053-repair-intake-injected-runtime-composer-integration-smoke-no-global-mount-no-db.md
git diff --check -- tests/repairIntake/repairIntakeInjectedRuntimeComposer.smoke.test.js docs/task-1053-repair-intake-injected-runtime-composer-integration-smoke-no-global-mount-no-db.md
```

## Completion Report

Task1053 completed locally.

Implemented files only:
- `tests/repairIntake/repairIntakeInjectedRuntimeComposer.smoke.test.js`
- `docs/task-1053-repair-intake-injected-runtime-composer-integration-smoke-no-global-mount-no-db.md`

Production source modified: no.
Existing tests modified: no.
Existing docs modified: no.

Composer smoke coverage:
- import composer only: composer module is the only Repair Intake runtime source imported.
- no-mount composition: valid synthetic ports compose without invoking port methods.
- mounted composition: explicit synthetic mount target receives safe route handlers through composer.
- plan route: calls draft repository and planning policy only.
- submit route no-existing: calls idempotency find, draft repository, planning policy, case creation, audit, and idempotency record.
- submit route replay: calls idempotency find only and suppresses downstream ports.
- call order: verified for plan, no-existing submit, and replay.
- downstream suppression: verified for replay path.
- summary / route / response sanitization: verified with unsafe synthetic fixtures.
- no forbidden source mentions: direct factories and production/global/provider/AI/billing markers checked absent.

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
