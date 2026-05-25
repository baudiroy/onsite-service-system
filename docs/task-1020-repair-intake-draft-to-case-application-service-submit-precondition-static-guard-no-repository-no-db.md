# Task1020 - Repair Intake Draft-to-Case ApplicationService Submit Precondition Static Guard

## Scope

- Added a static regression guard for the Task1019R2 submit precondition boundary.
- No production source, runtime, fixture, migration, admin, package, guardrail, or design files were modified.

## Static Guard Coverage

- Confirms submit precondition concepts remain present:
  - `idempotencyKey`
  - `permissionContext`
  - `canCreateCaseFromRepairIntakeDraft`
  - `approvalContext`
  - `accepted`
- Confirms sanitized reason codes remain present:
  - `REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_REQUIRED`
  - `REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PERMISSION_REQUIRED`
  - `REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_APPROVAL_REQUIRED`
- Confirms submit precondition validation appears before submit port calls:
  - `draftReader.getDraftForConversion`
  - `casePlanner.planCaseFromDraft`
  - `caseCreator.createCaseFromDraft`
  - `auditWriter.recordDraftToCaseDecision`
- Confirms `planDraftToCase` is not gated by submit-only preconditions and remains read/plan only.
- Confirms forbidden runtime/repository coupling markers are absent.

## Verification

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceSubmitPreconditionBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceSubmitPrecondition.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServicePortPayloadSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceController.integration.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationService.seam.unit.test.js
git diff --name-only
git diff --cached --name-only
```
