# Task1039 - Repair Intake AuditWriter + ApplicationService Integration Test

## Scope

- Added integration coverage proving the pure auditWriter port adapter can be used as the auditWriter port inside
  `createRepairIntakeDraftToCaseApplicationService`.
- No production source changes were made in this task.
- No DB, migration, repository writer, API shape changes, global route bootstrap/listen, provider sending, AI/RAG,
  admin, billing/settlement/payment, or smoke/runtime DB work.

## Source Surface

- Added integration test:
  - `tests/repairIntake/repairIntakeAuditWriterApplicationService.integration.test.js`
- Read-only files:
  - `src/repairIntake/repairIntakeDraftReaderPortAdapter.js`
  - `src/repairIntake/repairIntakeCasePlannerPortAdapter.js`
  - `src/repairIntake/repairIntakeCaseCreatorPortAdapter.js`
  - `src/repairIntake/repairIntakeAuditWriterPortAdapter.js`
  - `src/repairIntake/repairIntakeDraftToCaseApplicationService.js`

## Test Scenario

- Injected-chain composition:
  - Synthetic `draftRepository` → `createRepairIntakeDraftReaderPortAdapter`
  - Synthetic `planningPolicy` → `createRepairIntakeCasePlannerPortAdapter`
  - Synthetic `caseCreationPort` → `createRepairIntakeCaseCreatorPortAdapter`
  - Synthetic `auditPort` → `createRepairIntakeAuditWriterPortAdapter`
  - `createRepairIntakeDraftToCaseApplicationService`
- Valid `submitDraftToCase` path with required fields:
  - `body.idempotencyKey`
  - `body.permissionContext.canCreateCaseFromRepairIntakeDraft === true`
  - `body.approvalContext.accepted === true`
- The test asserts call order is:
  - `draftRepository`
  - `planningPolicy`
  - `caseCreationPort`
  - `auditPort`
- Verifies:
  - repository lookup uses sanitized top-level input
  - planning payload contains sanitized draft summary
  - creation payload contains sanitized draft/plan summaries
  - auditWriter payload contains sanitized draft/plan/caseRef summaries
  - submit output is sanitized and includes:
    - `result.ok === true`
    - `result.submitted === true`
    - `result.reasonCode === CASE_CREATED_TASK1039`
    - `result.plan.reasonCode === PLAN_READY_TASK1039`
    - `result.caseRef.id === case_task1039`
    - `result.auditEvent.reasonCode === AUDIT_RECORDED_TASK1039`
  - no raw/unsafe fields are exposed (no raw SQL / DB / credentials / phone/address/customer / line / finalAppointmentId / token / stack).

## Verification

```bash
node --test tests/repairIntake/repairIntakeAuditWriterApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeAuditWriterPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeAuditWriterPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftReaderCasePlannerApplicationService.integration.test.js
```

Required completion constraints:
- Do not stage anything (`git status --short` and `git diff --cached --name-only` expected to remain untouched for staged scope).

## Task1039A Completion Gap Closure

- Task1039 implemented test file exists: `tests/repairIntake/repairIntakeAuditWriterApplicationService.integration.test.js`
- Task1039 doc exists/updated: `docs/task-1039-repair-intake-audit-writer-application-service-integration-test-no-repository-no-db.md`
- Production source changes by Task1039A: no
- Test/runtime code changes by Task1039A: no
- Staging activity by Task1039A: no (`git diff --cached --name-only` has no output)

### Task1039A verification commands and results

```bash
node --test tests/repairIntake/repairIntakeAuditWriterApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeAuditWriterPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeAuditWriterPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftReaderCasePlannerApplicationService.integration.test.js
```

All tests passed:

- 1/1 pass
- 7/7 pass
- 4/4 pass
- 1/1 pass
- 7/7 pass
- 7/7 pass
- 2/2 pass

`git status --short` currently retains pre-existing tracked/untracked changes outside this task.

`git diff --name-only` (tracked changes in worktree) includes:

- docs/task-105-backend-owned-final-appointment-inference-api-contract.md
- migrations/README.md
- scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js
- scripts/smoke/029_single_open_appointment_guard_smoke.js
- src/app.js
- src/repositories/DispatchRepository.js
- src/repositories/FieldServiceReportRepository.js
- src/routes/index.js
- src/routes/public.routes.js
- src/server.js
- src/services/AppointmentService.js
- src/services/FieldServiceReportService.js

`git diff --cached --name-only`: no output.
