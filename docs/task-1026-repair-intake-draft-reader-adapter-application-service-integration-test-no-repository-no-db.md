# Task1026 - Repair Intake DraftReader Adapter + ApplicationService Integration Test

## Scope

- Added an integration-style test proving the pure draftReader adapter can serve as the `draftReader` port for the pure applicationService seam.
- No production source, runtime, migration, admin, package, guardrail, or design files were modified.

## Integration Chain

- Synthetic `draftRepository`
- `createRepairIntakeDraftReaderPortAdapter`
- `createRepairIntakeDraftToCaseApplicationService`
- `planDraftToCase(input)` / `submitDraftToCase(input)`

## Verified Behavior

- Plan flow:
  - ApplicationService calls the draftReader adapter.
  - The adapter calls only `draftRepository.findDraftForConversion(sanitizedLookup)`.
  - `casePlanner.planCaseFromDraft` receives a sanitized draft summary.
  - `caseCreator` and `auditWriter` are not called.
- Submit flow:
  - Valid submit input includes `body.idempotencyKey`.
  - Valid submit input includes `body.permissionContext.canCreateCaseFromRepairIntakeDraft === true`.
  - Valid submit input includes `body.approvalContext.accepted === true`.
  - Call order is preserved:
    - draftRepository lookup
    - casePlanner
    - caseCreator
    - auditWriter
- Lookup and inter-port sanitization:
  - Draft repository receives only safe lookup fields.
  - Planner, creator, and audit writer receive sanitized draft/plan/caseRef summaries only.
- Output sanitization:
  - Plan and submit envelopes do not expose raw rows, SQL/DB markers, credentials, phone/address/customer data, LINE markers, `finalAppointmentId`, raw repository/port objects, or stack traces.

## Verification

```bash
node --test tests/repairIntake/repairIntakeDraftReaderApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeDraftReaderPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftReaderPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceIdempotencyBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceIdempotencyPort.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceSubmitPrecondition.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServicePortPayloadSanitization.unit.test.js
git diff --name-only
git diff --cached --name-only
```
