# Task1048 - Repair Intake Injected Composition Smoke Test / No Global Mount No DB

## Scope

- Add a local injected composition smoke test for the Repair Intake draft-to-Case pure runtime chain.
- Add one task doc for Task1048.
- No production source changes.
- No modification to existing tests or existing docs.
- No global app mount, production route registration, listen startup, DB, migration, repository implementation, provider, AI, billing, admin, package, staging, cleanup, reset, revert, or stash.

## Exact Allowed Files

- `tests/repairIntake/repairIntakeInjectedComposition.smoke.test.js`
- `docs/task-1048-repair-intake-injected-composition-smoke-test-no-global-mount-no-db.md`

## Read-Only Source Files Covered

- `src/repairIntake/repairIntakeIdempotencyPortAdapter.js`
- `src/repairIntake/repairIntakeDraftReaderPortAdapter.js`
- `src/repairIntake/repairIntakeCasePlannerPortAdapter.js`
- `src/repairIntake/repairIntakeCaseCreatorPortAdapter.js`
- `src/repairIntake/repairIntakeAuditWriterPortAdapter.js`
- `src/repairIntake/repairIntakeDraftToCaseApplicationService.js`
- `src/repairIntake/repairIntakeDraftToCaseController.js`
- `src/repairIntake/repairIntakeDraftToCaseApiModule.js`
- `src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js`

## Required Behavior

The smoke test proves that the current pure injected composition can be built and exercised from factories only, without global app/server/routes, DB, repository implementation, provider, or environment secret coupling.

The smoke test builds all pure port adapters with synthetic in-memory ports:

- `idempotencyPort` adapter.
- `draftReader` adapter.
- `casePlanner` adapter.
- `caseCreator` adapter.
- `auditWriter` adapter.

The smoke test builds the full injected runtime composition:

- `applicationService`.
- `controller`.
- API module.
- HTTP mount adapter.
- Synthetic mount target.

The smoke test exercises:

- plan route once.
- submit route once with no existing idempotency result.
- submit route once with existing idempotency replay.

The smoke test verifies smoke-level invariants:

- Plan route calls only `draftRepository` and `planningPolicy`.
- Plan route does not call `caseCreationPort`, `auditPort`, or idempotency record.
- No-existing submit calls `idempotencyStore.find`, `draftRepository`, `planningPolicy`, `caseCreationPort`, `auditPort`, then `idempotencyStore.record`.
- Replay submit calls only `idempotencyStore.find` and suppresses downstream ports.
- Route responses are sanitized.
- Mount summary exposes only safe route metadata.

The smoke test also checks its own source for forbidden runtime coupling markers:

- No `src/app.js`.
- No `src/server.js`.
- No `src/routes/**`.
- No `src/repositories/**`.
- No `src/db/**`.
- No provider imports.
- No `process.env`.
- No `.listen(`.
- No `db:migrate`.
- No `psql`.

## Acceptance Criteria

Task1048 is acceptable only if:

- The new injected composition smoke test passes.
- Task1046 aggregate static boundary test still passes.
- Task1044 idempotency full runtime-chain integration test still passes.
- Task1040 full port adapters injected runtime-chain integration test still passes.
- No production source files are modified.
- No forbidden files are modified.
- `git diff --cached --name-only` remains empty.

## Required Verification Commands

```bash
node --test tests/repairIntake/repairIntakeInjectedComposition.smoke.test.js
node --test tests/repairIntake/repairIntakeFullPurePortChainBoundary.static.test.js
node --test tests/repairIntake/repairIntakeIdempotencyPortFullRuntimeChain.integration.test.js
node --test tests/repairIntake/repairIntakeFullPortAdaptersInjectedRuntimeChain.integration.test.js
node --check tests/repairIntake/repairIntakeInjectedComposition.smoke.test.js
git diff --name-only
git diff --cached --name-only
git status --short -- tests/repairIntake/repairIntakeInjectedComposition.smoke.test.js docs/task-1048-repair-intake-injected-composition-smoke-test-no-global-mount-no-db.md
git diff --check -- tests/repairIntake/repairIntakeInjectedComposition.smoke.test.js docs/task-1048-repair-intake-injected-composition-smoke-test-no-global-mount-no-db.md
```

## Completion Report

Task1048 completed locally.

Implemented files:
- `tests/repairIntake/repairIntakeInjectedComposition.smoke.test.js`
- `docs/task-1048-repair-intake-injected-composition-smoke-test-no-global-mount-no-db.md`

Production source modified: no.
Existing tests modified: no.
Existing docs modified: no.

Smoke coverage added:
- Builds all pure port adapters with synthetic in-memory ports.
- Builds applicationService, controller, API module, HTTP mount adapter, and synthetic mount target from factories only.
- Exercises plan route once.
- Exercises submit route once with no existing idempotency result.
- Exercises submit route once with existing idempotency replay.
- Verifies plan route does not call caseCreator, auditWriter, or idempotency record.
- Verifies no-existing submit call order.
- Verifies replay submit suppresses downstream ports.
- Verifies sanitized route responses.
- Verifies safe mount summary metadata.
- Verifies no global app, server, route, repository, DB, provider, env secret, listen, migration, or `psql` coupling in the smoke test source.

Scope boundaries held:
- No `src/**`.
- No existing `tests/**`.
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
