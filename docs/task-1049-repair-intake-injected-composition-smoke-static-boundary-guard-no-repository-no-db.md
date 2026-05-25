# Task1049 - Repair Intake Injected Composition Smoke Static Boundary Guard / No Repository No DB

## Scope

- Add a static boundary guard for the Task1048 injected composition smoke test.
- Add one task doc for Task1049.
- No production source changes.
- No modification to existing tests or existing docs.
- No global app mount, production route registration, listen startup, DB, migration, repository implementation, provider, AI, billing, admin, package, staging, cleanup, reset, revert, or stash.

## Exact Allowed Files

- `tests/repairIntake/repairIntakeInjectedCompositionSmokeBoundary.static.test.js`
- `docs/task-1049-repair-intake-injected-composition-smoke-static-boundary-guard-no-repository-no-db.md`

## Read-Only Files Covered

- `tests/repairIntake/repairIntakeInjectedComposition.smoke.test.js`

## Required Behavior

The static boundary guard reads the Task1048 smoke test and protects it from drifting into a production, global, DB, repository, provider, or shared-runtime smoke.

The guard asserts the smoke test still contains pure injected composition markers:

- `createRepairIntakeIdempotencyPortAdapter`
- `createRepairIntakeDraftReaderPortAdapter`
- `createRepairIntakeCasePlannerPortAdapter`
- `createRepairIntakeCaseCreatorPortAdapter`
- `createRepairIntakeAuditWriterPortAdapter`
- `createRepairIntakeDraftToCaseApplicationService`
- `createRepairIntakeDraftToCaseController`
- `createRepairIntakeDraftToCaseApiModule`
- `mountRepairIntakeDraftToCaseApiModule`

The guard asserts the smoke test still contains scenario markers using actual route, call-order, and replay symbols:

- Plan route path.
- Submit route path.
- No-existing submit marker.
- Idempotency result marker.
- `idempotencyStore.find`.
- `draftRepository`.
- `planningPolicy`.
- `caseCreationPort`.
- `auditPort`.
- `idempotencyStore.record`.
- Downstream suppression marker.
- `idempotentReplay`.
- The expected `find -> draft -> plan -> create -> audit -> record` call-order array.

The guard asserts the smoke test does not import or call forbidden production/global/runtime coupling markers:

- `require('../../src/app')`
- `require('../../src/server')`
- `require('../../src/routes')`
- `require('../../src/repositories')`
- `require('../../src/db')`
- `require('../../src/providers')`
- `app.listen`
- `server.listen`
- bare `listen(`
- `fetch(`
- `axios`
- `process.env`
- provider send markers
- OpenAI/vector markers
- billing/invoice/payment markers

The guard allows unsafe customer/provider/DB-shaped field names only inside synthetic unsafe fixtures or redaction assertions, then strips those allowed sections before asserting the runtime composition body has no escaped unsafe markers.

The guard also asserts no production smoke script markers:

- `scripts/smoke`
- `shared runtime`
- `Zeabur`
- `production`
- `staging`
- `DATABASE_URL=`

## Acceptance Criteria

Task1049 is acceptable only if:

- The new smoke static boundary test passes.
- Task1048 injected composition smoke test still passes.
- Task1046 aggregate full pure-port chain static boundary test still passes.
- Task1044 idempotency full runtime-chain integration test still passes.
- Task1040 full port adapters injected runtime-chain integration test still passes.
- No production source files are modified.
- No existing tests are modified.
- No forbidden files are modified.
- `git diff --cached --name-only` remains empty.

## Required Verification Commands

```bash
node --test tests/repairIntake/repairIntakeInjectedCompositionSmokeBoundary.static.test.js
node --test tests/repairIntake/repairIntakeInjectedComposition.smoke.test.js
node --test tests/repairIntake/repairIntakeFullPurePortChainBoundary.static.test.js
node --test tests/repairIntake/repairIntakeIdempotencyPortFullRuntimeChain.integration.test.js
node --test tests/repairIntake/repairIntakeFullPortAdaptersInjectedRuntimeChain.integration.test.js
node --check tests/repairIntake/repairIntakeInjectedCompositionSmokeBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
git status --short -- tests/repairIntake/repairIntakeInjectedCompositionSmokeBoundary.static.test.js docs/task-1049-repair-intake-injected-composition-smoke-static-boundary-guard-no-repository-no-db.md
git diff --check -- tests/repairIntake/repairIntakeInjectedCompositionSmokeBoundary.static.test.js docs/task-1049-repair-intake-injected-composition-smoke-static-boundary-guard-no-repository-no-db.md
```

## Completion Report

Task1049 completed locally.

Implemented files:
- `tests/repairIntake/repairIntakeInjectedCompositionSmokeBoundary.static.test.js`
- `docs/task-1049-repair-intake-injected-composition-smoke-static-boundary-guard-no-repository-no-db.md`

Production source modified: no.
Existing tests modified: no.
Existing docs modified: no.

Static guard coverage added:
- Confirms Task1048 smoke keeps pure injected composition factory markers.
- Confirms Task1048 smoke keeps route, submit, idempotency replay, and call-order scenario markers.
- Confirms Task1048 smoke avoids production/global app/server/routes/repository/DB/provider imports and runtime calls.
- Confirms unsafe sensitive markers remain confined to synthetic fixtures and redaction assertions.
- Confirms Task1048 smoke avoids production smoke script markers.

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
