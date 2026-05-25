# Task1046 - Repair Intake Full Pure-Port Chain Aggregate Static Boundary Guard / No Repository No DB

## Scope

- Add one aggregate static boundary guard for the Repair Intake draft-to-Case pure-port chain.
- Add one task doc for Task1046.
- No production source changes.
- No modification to existing tests or existing docs.
- No DB, migration, repository implementation, provider, AI, billing, admin, global app mount, route registration, or listen startup.
- No staging, commit, cleanup, reset, revert, or stash.

## Exact Allowed Files

- `tests/repairIntake/repairIntakeFullPurePortChainBoundary.static.test.js`
- `docs/task-1046-repair-intake-full-pure-port-chain-aggregate-static-boundary-guard-no-repository-no-db.md`

## Read-Only Source Files Covered

- `src/repairIntake/repairIntakeDraftReaderPortAdapter.js`
- `src/repairIntake/repairIntakeCasePlannerPortAdapter.js`
- `src/repairIntake/repairIntakeCaseCreatorPortAdapter.js`
- `src/repairIntake/repairIntakeAuditWriterPortAdapter.js`
- `src/repairIntake/repairIntakeIdempotencyPortAdapter.js`
- `src/repairIntake/repairIntakeDraftToCaseApplicationService.js`
- `src/repairIntake/repairIntakeDraftToCaseController.js`
- `src/repairIntake/repairIntakeDraftToCaseApiModule.js`
- `src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js`

## Required Behavior

The aggregate static guard reads the full Repair Intake draft-to-Case pure-port chain source files and asserts that the branch remains pure, injected, no-DB, no-provider, and not globally mounted.

The test asserts expected factory / seam markers:
- `createRepairIntakeDraftReaderPortAdapter`
- `createRepairIntakeCasePlannerPortAdapter`
- `createRepairIntakeCaseCreatorPortAdapter`
- `createRepairIntakeAuditWriterPortAdapter`
- `createRepairIntakeIdempotencyPortAdapter`
- `createRepairIntakeDraftToCaseApplicationService`
- `createRepairIntakeDraftToCaseController`
- `createRepairIntakeDraftToCaseApiModule`
- `mountRepairIntakeDraftToCaseApiModule`

The test asserts expected injected port markers:
- `draftRepository.findDraftForConversion`
- `planningPolicy.planCaseFromDraft`
- `caseCreationPort.createCaseFromDraft`
- `auditPort.recordDraftToCaseDecision`
- `idempotencyStore.findExistingDraftToCaseResult`
- `idempotencyStore.recordDraftToCaseResult`

The test asserts sanitization and boundary concepts using current source markers:
- sanitized request input
- sanitized lookup / planning / creation / audit / idempotency payloads
- sanitized output envelopes
- sync thrown / async rejected error sanitization
- submit precondition guard
- idempotency replay guard
- duplicate route / method / path safety through the mount adapter

The test asserts forbidden coupling markers are absent from runtime body source:
- DB / repository / route / controller parent imports
- global app mount / listen startup
- network/provider sending markers
- SQL / ORM / database-client markers
- provider / LINE / SMS / email markers
- AI / RAG markers
- billing / settlement / payment / invoice markers

Sensitive forbidden markers that appear only as unsafe-field redaction entries remain allowed only inside unsafe-field lists and are asserted absent after those lists are stripped.

## Acceptance Criteria

Task1046 is acceptable only if:

- The new aggregate static boundary test passes.
- Task1044 idempotency full runtime-chain integration test still passes.
- Task1043 idempotency static boundary test still passes.
- Task1042 idempotency adapter unit test still passes.
- Task1040 full port adapters injected runtime-chain integration test still passes.
- Task1039 auditWriter + applicationService integration test still passes.
- No production source files are modified.
- No forbidden files are modified.
- `git diff --cached --name-only` remains empty.

## Required Verification Commands

```bash
node --test tests/repairIntake/repairIntakeFullPurePortChainBoundary.static.test.js
node --test tests/repairIntake/repairIntakeIdempotencyPortFullRuntimeChain.integration.test.js
node --test tests/repairIntake/repairIntakeIdempotencyPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeFullPortAdaptersInjectedRuntimeChain.integration.test.js
node --test tests/repairIntake/repairIntakeAuditWriterApplicationService.integration.test.js
git diff --name-only
git diff --cached --name-only
git status --short -- tests/repairIntake/repairIntakeFullPurePortChainBoundary.static.test.js docs/task-1046-repair-intake-full-pure-port-chain-aggregate-static-boundary-guard-no-repository-no-db.md
git diff --check -- tests/repairIntake/repairIntakeFullPurePortChainBoundary.static.test.js docs/task-1046-repair-intake-full-pure-port-chain-aggregate-static-boundary-guard-no-repository-no-db.md
```

## Completion Report

Task1046 completed locally.

Implemented files:
- `tests/repairIntake/repairIntakeFullPurePortChainBoundary.static.test.js`
- `docs/task-1046-repair-intake-full-pure-port-chain-aggregate-static-boundary-guard-no-repository-no-db.md`

Production source modified: no.
Existing tests modified: no.
Existing docs modified: no.

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

Verification:
- `node --test tests/repairIntake/repairIntakeFullPurePortChainBoundary.static.test.js` -> PASS (6/6)
- `node --test tests/repairIntake/repairIntakeIdempotencyPortFullRuntimeChain.integration.test.js` -> PASS (2/2)
- `node --test tests/repairIntake/repairIntakeIdempotencyPortAdapterBoundary.static.test.js` -> PASS (6/6)
- `node --test tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js` -> PASS (6/6)
- `node --test tests/repairIntake/repairIntakeFullPortAdaptersInjectedRuntimeChain.integration.test.js` -> PASS (2/2)
- `node --test tests/repairIntake/repairIntakeAuditWriterApplicationService.integration.test.js` -> PASS (1/1)
- `node --check tests/repairIntake/repairIntakeFullPurePortChainBoundary.static.test.js` -> PASS
- `git diff --name-only` -> existing tracked patch stack only:
  - `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
  - `migrations/README.md`
  - `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
  - `scripts/smoke/029_single_open_appointment_guard_smoke.js`
  - `src/app.js`
  - `src/repositories/DispatchRepository.js`
  - `src/repositories/FieldServiceReportRepository.js`
  - `src/routes/index.js`
  - `src/routes/public.routes.js`
  - `src/server.js`
  - `src/services/AppointmentService.js`
  - `src/services/FieldServiceReportService.js`
- `git diff --cached --name-only` -> PASS / no output.
- `git status --short -- tests/repairIntake/repairIntakeFullPurePortChainBoundary.static.test.js docs/task-1046-repair-intake-full-pure-port-chain-aggregate-static-boundary-guard-no-repository-no-db.md` -> two untracked Task1046 files only.
- `git diff --check -- tests/repairIntake/repairIntakeFullPurePortChainBoundary.static.test.js docs/task-1046-repair-intake-full-pure-port-chain-aggregate-static-boundary-guard-no-repository-no-db.md` -> PASS / no output.
