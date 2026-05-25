# Task1051 - Repair Intake Draft-to-Case Injected Runtime Composer Factory / No Global Mount No DB

## Scope

- Add one internal injected runtime composer factory for the Repair Intake draft-to-Case pure runtime chain.
- Add one composer unit test.
- Add one task doc.
- No global app mount, production route registration, listen startup, DB, migration, repository implementation, provider, AI, billing, admin, package, staging, cleanup, reset, revert, or stash.

## Exact Allowed Files

- `src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js`
- `tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.unit.test.js`
- `docs/task-1051-repair-intake-draft-to-case-injected-runtime-composer-factory-no-global-mount-no-db.md`

## Runtime Behavior

The composer exports:

- `createRepairIntakeDraftToCaseInjectedRuntimeComposition(options)`

The composer accepts injected synthetic ports only:

- optional `idempotencyStore`
- required `draftRepository`
- optional `planningPolicy`
- required `caseCreationPort`
- required `auditPort`
- optional `mountTarget`
- optional `basePath`

The composer validates required dependency shapes before composing:

- `draftRepository.findDraftForConversion`
- `caseCreationPort.createCaseFromDraft`
- `auditPort.recordDraftToCaseDecision`

When provided, the composer also validates:

- `idempotencyStore.findExistingDraftToCaseResult`
- `idempotencyStore.recordDraftToCaseResult`
- `planningPolicy.planCaseFromDraft`

The composer assembles the existing pure chain only through already-built factories:

- `createRepairIntakeIdempotencyPortAdapter`
- `createRepairIntakeDraftReaderPortAdapter`
- `createRepairIntakeCasePlannerPortAdapter`
- `createRepairIntakeCaseCreatorPortAdapter`
- `createRepairIntakeAuditWriterPortAdapter`
- `createRepairIntakeDraftToCaseApplicationService`
- `createRepairIntakeDraftToCaseController`
- `createRepairIntakeDraftToCaseApiModule`
- `mountRepairIntakeDraftToCaseApiModule`

If `mountTarget` is provided, the composer mounts only onto that explicit target through the injected HTTP mount adapter.

If `mountTarget` is not provided, the composer returns an unmounted sanitized readiness summary.

## Sanitized Summary Contract

The composer returns only sanitized summary metadata:

- `ok`
- `components`
- `mounted`
- `routes`
- `reasonCode`
- `requiredActions`

The composer does not expose raw injected ports, route handlers, controller internals, API module internals, thrown errors, stack traces, customer-sensitive fields, provider secrets, DB / SQL details, or production runtime references.

Fail-closed reason codes:

- `REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_PORTS_REQUIRED`
- `REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_COMPOSE_FAILED`
- `REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_READY`
- `REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_MOUNTED`

## Unit Test Coverage

The new unit test verifies:

- missing required ports fail closed with a sanitized summary;
- unmounted composition builds a safe readiness summary without invoking synthetic ports;
- explicit synthetic mount target mounts the two draft-to-Case routes through the injected HTTP mount adapter;
- mounted chain exercises plan and submit using synthetic ports only;
- submit call order remains idempotency find, draft read, plan, create, audit, idempotency record;
- optional idempotency store and planning policy shapes are validated;
- summary and route metadata do not expose raw handlers, ports, repositories, stores, request objects, sensitive fields, provider tokens, DB strings, or stack traces;
- composer source does not import or call global app/server/routes/repositories/db/providers, listen startup, provider sending, AI, billing, or SQL runtime.

## Acceptance Criteria

Task1051 is acceptable only if:

- the new composer unit test passes;
- Task1049 smoke static boundary test still passes;
- Task1048 injected composition smoke test still passes;
- Task1046 aggregate static boundary test still passes;
- Task1044 idempotency full runtime-chain integration test still passes;
- production source change is limited to the new composer file;
- no forbidden files are modified;
- no staging occurs;
- `git diff --cached --name-only` remains empty.

## Required Verification Commands

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.unit.test.js
node --test tests/repairIntake/repairIntakeInjectedCompositionSmokeBoundary.static.test.js
node --test tests/repairIntake/repairIntakeInjectedComposition.smoke.test.js
node --test tests/repairIntake/repairIntakeFullPurePortChainBoundary.static.test.js
node --test tests/repairIntake/repairIntakeIdempotencyPortFullRuntimeChain.integration.test.js
node --check src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js
node --check tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.unit.test.js
git diff --name-only
git diff --cached --name-only
git status --short -- src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.unit.test.js docs/task-1051-repair-intake-draft-to-case-injected-runtime-composer-factory-no-global-mount-no-db.md
git diff --check -- src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.unit.test.js docs/task-1051-repair-intake-draft-to-case-injected-runtime-composer-factory-no-global-mount-no-db.md
```

## Completion Report

Task1051 completed locally.

Implemented files:
- `src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js`
- `tests/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.unit.test.js`
- `docs/task-1051-repair-intake-draft-to-case-injected-runtime-composer-factory-no-global-mount-no-db.md`

Runtime source added:
- internal injected runtime composer factory only.

Existing runtime files modified: no.
Existing tests modified: no.
Existing docs modified: no.

Behavior added:
- validates injected synthetic port shapes before composition;
- assembles idempotency, draft reader, case planner, case creator, audit writer, applicationService, controller, API module, and optional HTTP mount adapter through existing pure factories;
- mounts only onto explicit injected `mountTarget`;
- returns sanitized summary metadata for mounted and unmounted composition;
- fails closed with sanitized reason codes.

Scope boundaries held:
- No `src/app.js`.
- No `src/server.js`.
- No `src/routes/**`.
- No `src/controllers/**`.
- No `src/repositories/**`.
- No `src/db/**`.
- No existing Repair Intake pure files modified.
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
