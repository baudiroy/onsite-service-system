# Task1040 - Repair Intake Full Port Adapters Injected Runtime Chain Integration Test / No Repository No DB

## Scope

- Add one injected runtime-chain integration test that proves the full pure port-adapter chain works end-to-end through `createRepairIntakeDraftToCaseHttpMountAdapter` in a synthetic mount target.
- No production source files are modified in this task.
- No DB, migration, SQL, `db:migrate`, repository writer, real repository implementation, API shape changes, global route mount/listen, provider sending, AI/RAG, admin, billing/settlement/payment, or smoke/shared runtime work.

## Exact allowed files

- `tests/repairIntake/repairIntakeFullPortAdaptersInjectedRuntimeChain.integration.test.js`
- `docs/task-1040-repair-intake-full-port-adapters-injected-runtime-chain-integration-test-no-repository-no-db.md`

## Test scenario

- Build a synthetic mount target and compose:
  - synthetic `draftRepository` → `createRepairIntakeDraftReaderPortAdapter`
  - synthetic `planningPolicy` → `createRepairIntakeCasePlannerPortAdapter`
  - synthetic `caseCreationPort` → `createRepairIntakeCaseCreatorPortAdapter`
  - synthetic `auditPort` → `createRepairIntakeAuditWriterPortAdapter`
  - `createRepairIntakeDraftToCaseApplicationService`
  - `createRepairIntakeDraftToCaseController`
  - `createRepairIntakeDraftToCaseApiModule`
  - `mountRepairIntakeDraftToCaseApiModule`
- Verify `POST /repair-intake/drafts/:draftId/case/plan`:
  - only `draftRepository` and `planningPolicy` are called,
  - plan response is sanitized,
  - no forbidden raw/unsafe fields are surfaced.
- Verify `POST /repair-intake/drafts/:draftId/case/submit`:
  - call order is `draftRepository -> planningPolicy -> caseCreationPort -> auditPort`,
  - submit response is sanitized,
  - no forbidden raw/unsafe fields are surfaced.
- Add mount summary assertions for safe route metadata and sanitized payload behavior in both plan and submit paths.

## Verification

```bash
node --test tests/repairIntake/repairIntakeFullPortAdaptersInjectedRuntimeChain.integration.test.js
node --test tests/repairIntake/repairIntakeAuditWriterApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeAuditWriterPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeAuditWriterPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftReaderCasePlannerApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeCasePlannerPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCasePlannerPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftReaderPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftReaderPortAdapter.unit.test.js
```

`git status --short` keeps pre-existing working tree noise outside this task.

`git diff --cached --name-only` remains empty by policy.

## Task1040A completion gap closure

- Scope unchanged: no additional source/runtime/test files modified in this gap closure.

### Required commands

```bash
git diff --name-only -- tests/repairIntake/repairIntakeFullPortAdaptersInjectedRuntimeChain.integration.test.js docs/task-1040-repair-intake-full-port-adapters-injected-runtime-chain-integration-test-no-repository-no-db.md
git diff --cached --name-only
```

Observed:

- `git diff --name-only ...` returned no tracked file list in this context (new Task1040 files are untracked).
- `git diff --cached --name-only` returned no output.
