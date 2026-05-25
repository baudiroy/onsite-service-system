# Task1037 - Repair Intake Draft-to-Case AuditWriter Port Adapter Seam

## Scope

- Added a pure injected auditWriter adapter seam.
- Added unit coverage for dependency shape, valid audit input, invalid input, thrown/rejected audit failures, invalid audit results, and sanitization.
- No real repository, DB, migration, global app mount, route registration, listen startup, provider, AI/RAG, billing, settlement, payment, invoice, admin, package, guardrail, or design documentation changes.

## Adapter Surface

- Factory export:
  - `createRepairIntakeAuditWriterPortAdapter(options)`
- Error export:
  - `RepairIntakeAuditWriterPortAdapterError`
- Required injected synthetic audit port:
  - `auditPort.recordDraftToCaseDecision(input)`
- Returned adapter method:
  - `recordDraftToCaseDecision(input)`

## Behavior

- Missing or invalid `auditPort.recordDraftToCaseDecision` fails closed at factory creation with:
  - `REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_AUDIT_PORT_REQUIRED`
- `recordDraftToCaseDecision(input)` requires:
  - plain object input
  - plain object `draft`
  - plain object `plan`
  - plain object `caseRef`
- Invalid audit input fails closed before audit port calls with:
  - `REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_INPUT_INVALID`
- Audit port thrown errors, async rejections, and invalid audit results return:
  - `REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_RECORD_FAILED`
- Successful audit results return sanitized audit envelopes.
- Successful default reason marker:
  - `REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_RECORDED`

## Sanitization

- Safe audit fields forwarded:
  - `draft`
  - `plan`
  - `caseRef`
  - `decision`
  - `draftId`
  - `organizationId`
  - `tenantId`
  - `requestId`
  - `actor`
  - `metadata`
  - `warnings`
- Unsafe fields and markers are not forwarded or returned:
  - raw audit port object
  - raw draft row object
  - unsafe raw plan, caseRef, or audit result fields
  - raw SQL/query details
  - credentials
  - phone/address/customer data
  - LINE identity/token markers
  - `finalAppointmentId`
  - stack traces
  - raw thrown error messages

## Verification

```bash
node --test tests/repairIntake/repairIntakeAuditWriterPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftReaderCasePlannerApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeCasePlannerPortAdapterBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
```
