# Task1019R2 - Repair Intake Draft-to-Case ApplicationService Submit Precondition Guard

## Scope

- Hardened only the pure applicationService submit precondition boundary.
- Updated valid-submit fixtures in the allowed regression tests so existing valid submit flows include explicit idempotency, permission, and approval context.
- Added a focused submit precondition unit test.
- No repository, DB, migration, global app mount, route registration, listen startup, provider, AI/RAG, billing, settlement, payment, invoice, admin, package, guardrail, or design documentation changes.

## Implemented Behavior

- `submitDraftToCase(input)` fails closed before any port call unless all required submit preconditions are present:
  - `body.idempotencyKey`
  - `body.permissionContext.canCreateCaseFromRepairIntakeDraft === true`
  - `body.approvalContext.accepted === true`
- Precondition failure suppresses:
  - `draftReader.getDraftForConversion`
  - `casePlanner.planCaseFromDraft`
  - `caseCreator.createCaseFromDraft`
  - `auditWriter.recordDraftToCaseDecision`
- `planDraftToCase(input)` does not require submit-only preconditions and remains read/plan only.

## Reason Codes

- `REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_REQUIRED`
- `REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PERMISSION_REQUIRED`
- `REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_APPROVAL_REQUIRED`

## Fixture Compatibility Updates

- `tests/repairIntake/repairIntakeDraftToCaseApplicationService.seam.unit.test.js`
  - Added valid submit `body.idempotencyKey`, `body.permissionContext.canCreateCaseFromRepairIntakeDraft`, and `body.approvalContext.accepted`.
- `tests/repairIntake/repairIntakeDraftToCaseApplicationServiceController.integration.test.js`
  - Added valid submit fixture permission and approval context alongside the existing idempotency key.
- `tests/repairIntake/repairIntakeDraftToCaseApplicationServicePortPayloadSanitization.unit.test.js`
  - Added valid submit fixture permission and approval context alongside the existing idempotency key.

## Verification

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceSubmitPrecondition.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationService.seam.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceController.integration.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServicePortPayloadSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerSanitizationBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerInputSanitization.unit.test.js
git diff --name-only
git diff --cached --name-only
```
