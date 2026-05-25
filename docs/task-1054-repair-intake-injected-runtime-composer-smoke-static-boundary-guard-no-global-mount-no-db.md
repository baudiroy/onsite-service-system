# Task1054 - Repair Intake Injected Runtime Composer Smoke Static Boundary Guard / No Global Mount No DB

## Scope

- Add a static boundary guard for the Task1053 composer smoke test.
- Add one task doc.
- No production source changes.
- No modification to existing tests or existing docs.
- No global app mount, production route registration, listen startup, DB, migration, repository implementation, provider, AI, billing, admin, package, staging, cleanup, reset, revert, or stash.

## Exact Allowed Files

- `tests/repairIntake/repairIntakeInjectedRuntimeComposerSmokeBoundary.static.test.js`
- `docs/task-1054-repair-intake-injected-runtime-composer-smoke-static-boundary-guard-no-global-mount-no-db.md`

## Read-Only Files Covered

- `tests/repairIntake/repairIntakeInjectedRuntimeComposer.smoke.test.js`

## Required Behavior

The static guard reads the Task1053 composer smoke test and prevents it from drifting into direct component imports, production route mounting, DB / repository coupling, provider calls, AI/RAG, billing, or API shape changes.

The guard asserts the smoke imports only the composer runtime source from Repair Intake runtime code:

- `repairIntakeDraftToCaseInjectedRuntimeComposer`

The guard asserts the smoke does not directly import individual component source modules:

- `repairIntakeIdempotencyPortAdapter`
- `repairIntakeDraftReaderPortAdapter`
- `repairIntakeCasePlannerPortAdapter`
- `repairIntakeCaseCreatorPortAdapter`
- `repairIntakeAuditWriterPortAdapter`
- `repairIntakeDraftToCaseApplicationService`
- `repairIntakeDraftToCaseController`
- `repairIntakeDraftToCaseApiModule`
- `repairIntakeDraftToCaseHttpMountAdapter`

The guard asserts the smoke keeps expected composer scenario markers:

- `createRepairIntakeDraftToCaseInjectedRuntimeComposition`
- no-mount composition without port calls
- explicit synthetic `mountTarget`
- plan route
- submit route no-existing
- submit route replay
- idempotency find, draft, plan, create, audit, idempotency record call order
- replay downstream suppression

The guard asserts forbidden production/global/runtime markers are absent outside explicit unsafe fixture and redaction assertion sections:

- app / server / routes / repositories / DB imports or path markers;
- global listen/startup markers;
- provider senders;
- AI/RAG/vector markers;
- billing/invoice/payment markers;
- shared runtime / smoke script / Zeabur / production / staging markers;
- SQL / DB / credential / LINE / sensitive data markers.

## Acceptance Criteria

Task1054 is acceptable only if:

- The new composer smoke static boundary test passes.
- Task1053 composer smoke test still passes.
- Task1052 composer static boundary test still passes.
- Task1051 composer unit test still passes.
- Task1049 injected composition smoke static boundary test still passes.
- Task1048 injected composition smoke test still passes.
- No production source files are modified.
- No existing tests are modified.
- No forbidden files are modified.
- `git diff --cached --name-only` remains empty.

## Required Verification Commands

```bash
node --test tests/repairIntake/repairIntakeInjectedRuntimeComposerSmokeBoundary.static.test.js
node --test tests/repairIntake/repairIntakeInjectedRuntimeComposer.smoke.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposerBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.unit.test.js
node --test tests/repairIntake/repairIntakeInjectedCompositionSmokeBoundary.static.test.js
node --test tests/repairIntake/repairIntakeInjectedComposition.smoke.test.js
node --check tests/repairIntake/repairIntakeInjectedRuntimeComposerSmokeBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
git status --short -- tests/repairIntake/repairIntakeInjectedRuntimeComposerSmokeBoundary.static.test.js docs/task-1054-repair-intake-injected-runtime-composer-smoke-static-boundary-guard-no-global-mount-no-db.md
git diff --check -- tests/repairIntake/repairIntakeInjectedRuntimeComposerSmokeBoundary.static.test.js docs/task-1054-repair-intake-injected-runtime-composer-smoke-static-boundary-guard-no-global-mount-no-db.md
```

## Completion Report

Task1054 completed locally.

Implemented files only:
- `tests/repairIntake/repairIntakeInjectedRuntimeComposerSmokeBoundary.static.test.js`
- `docs/task-1054-repair-intake-injected-runtime-composer-smoke-static-boundary-guard-no-global-mount-no-db.md`

Production source modified: no.
Existing tests modified: no.
Existing docs modified: no.

Composer smoke static boundary coverage:
- composer-only import: confirms the smoke imports only the composer Repair Intake runtime source.
- individual component direct imports blocked: confirms individual adapter/controller/API/applicationService/mount source imports are absent.
- no-mount composition scenario: confirms no-mount scenario marker and no synthetic port calls during composition.
- explicit synthetic mountTarget scenario: confirms mounted composer scenario marker and httpMount true assertion.
- plan route scenario: confirms plan route path and draft/planner call markers.
- submit no-existing scenario: confirms submit route path and full call-order marker.
- submit replay scenario: confirms replay path and idempotent replay marker.
- call-order markers: confirms idempotency find, draft, plan, create, audit, record sequence.
- replay downstream suppression: confirms replay uses idempotency find only.
- forbidden app/server/routes/repositories/db coupling: checked absent outside allowed fixture sections.
- forbidden provider/API/env/billing markers: checked absent outside allowed fixture sections.
- sensitive markers confined to unsafe fixture/redaction assertions: checked by stripping allowed unsafe fixture/redaction sections before assertions.

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
