# Task1052 - Repair Intake Injected Runtime Composer Static Boundary Guard / No Global Mount No DB

## Scope

- Add a static boundary guard for the Task1051 injected runtime composer source.
- Add one task doc.
- No production source changes.
- No modification to existing tests or existing docs.
- No global app mount, production route registration, listen startup, DB, migration, repository implementation, provider, AI, billing, admin, package, staging, cleanup, reset, revert, or stash.

## Exact Allowed Files

- `tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposerBoundary.static.test.js`
- `docs/task-1052-repair-intake-injected-runtime-composer-static-boundary-guard-no-global-mount-no-db.md`

## Read-Only Files Covered

- `src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js`

## Required Behavior

The static boundary guard reads the Task1051 composer source and protects it from drifting into global app, server, route, repository, DB, provider, AI, billing, or production runtime coupling.

The guard asserts the composer keeps expected factory and composition markers:

- `createRepairIntakeDraftToCaseInjectedRuntimeComposition`
- `createRepairIntakeIdempotencyPortAdapter`
- `createRepairIntakeDraftReaderPortAdapter`
- `createRepairIntakeCasePlannerPortAdapter`
- `createRepairIntakeCaseCreatorPortAdapter`
- `createRepairIntakeAuditWriterPortAdapter`
- `createRepairIntakeDraftToCaseApplicationService`
- `createRepairIntakeDraftToCaseController`
- `createRepairIntakeDraftToCaseApiModule`
- `mountRepairIntakeDraftToCaseApiModule`
- `validatePorts`
- `componentSummary`
- `routeSummary`

The guard asserts the composer keeps required and optional injected dependency shape checks using the actual Task1051 source symbols:

- `options.draftRepository` with `findDraftForConversion`
- `options.caseCreationPort` with `createCaseFromDraft`
- `options.auditPort` with `recordDraftToCaseDecision`
- optional `options.idempotencyStore` with `findExistingDraftToCaseResult`
- optional `options.idempotencyStore` with `recordDraftToCaseResult`
- optional `options.planningPolicy` with `planCaseFromDraft`

The guard asserts the composer keeps sanitized summary and fail-closed markers:

- `REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_PORTS_REQUIRED`
- `REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_COMPOSE_FAILED`
- `REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_READY`
- `REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_MOUNTED`
- `components`
- `mounted`
- `routes`
- `requiredActions`
- `safeCode`
- `safeActions`
- `failure`
- `catch (error)`

The guard asserts the composer keeps both composition paths:

- unmounted composition summary using API module route summary;
- explicit injected `mountTarget` composition through the HTTP mount adapter.

The guard asserts forbidden coupling markers are absent:

- global app/server/routes/controller/repository/db imports;
- global listen/startup calls;
- env/provider markers;
- SQL/DB implementation markers;
- provider sending markers;
- AI/vector markers;
- billing/invoice/payment markers.

## Acceptance Criteria

Task1052 is acceptable only if:

- The new composer static boundary test passes.
- Task1051 composer unit test still passes.
- Task1049 smoke static boundary test still passes.
- Task1048 injected composition smoke test still passes.
- Task1046 aggregate static boundary test still passes.
- Task1044 idempotency full runtime-chain integration test still passes.
- No production source files are modified.
- No existing tests are modified.
- No forbidden files are modified.
- `git diff --cached --name-only` remains empty.

## Required Verification Commands

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposerBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.unit.test.js
node --test tests/repairIntake/repairIntakeInjectedCompositionSmokeBoundary.static.test.js
node --test tests/repairIntake/repairIntakeInjectedComposition.smoke.test.js
node --test tests/repairIntake/repairIntakeFullPurePortChainBoundary.static.test.js
node --test tests/repairIntake/repairIntakeIdempotencyPortFullRuntimeChain.integration.test.js
node --check tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposerBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
git status --short -- tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposerBoundary.static.test.js docs/task-1052-repair-intake-injected-runtime-composer-static-boundary-guard-no-global-mount-no-db.md
git diff --check -- tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposerBoundary.static.test.js docs/task-1052-repair-intake-injected-runtime-composer-static-boundary-guard-no-global-mount-no-db.md
```

## Completion Report

Task1052 completed locally.

Implemented files only:
- `tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposerBoundary.static.test.js`
- `docs/task-1052-repair-intake-injected-runtime-composer-static-boundary-guard-no-global-mount-no-db.md`

Production source modified: no.
Existing tests modified: no.
Existing docs modified: no.

Composer static boundary coverage:
- composer factory: confirms `createRepairIntakeDraftToCaseInjectedRuntimeComposition`.
- imported pure factories: confirms idempotency, draftReader, casePlanner, caseCreator, auditWriter, applicationService, controller, API module, and HTTP mount adapter factory markers.
- required injected dependencies: confirms draftRepository, caseCreationPort, and auditPort method guards.
- optional injected dependencies: confirms idempotencyStore and planningPolicy optional method guards.
- sanitized summary/reasonCodes: confirms components, mounted, routes, requiredActions, safe code/action helpers, fail-closed failure path, and composer reason codes.
- unmounted composition: confirms no-mount route summary path.
- explicit mountTarget composition: confirms injected mount adapter path.
- forbidden app/server/routes/repositories/db coupling: checked absent.
- forbidden provider/API/env/billing markers: checked absent.

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
