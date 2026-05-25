# Task1033 - Repair Intake Draft-to-Case CaseCreator Port Adapter Seam

## Scope

- Added a pure injected caseCreator adapter seam.
- Added unit coverage for dependency shape, valid creation input, invalid input, thrown/rejected creation failures, invalid creation results, and sanitization.
- No real repository, DB, migration, global app mount, route registration, listen startup, provider, AI/RAG, billing, settlement, payment, invoice, admin, package, guardrail, or design documentation changes.

## Adapter Surface

- Factory export:
  - `createRepairIntakeCaseCreatorPortAdapter(options)`
- Error export:
  - `RepairIntakeCaseCreatorPortAdapterError`
- Required injected synthetic creation port:
  - `caseCreationPort.createCaseFromDraft(input)`
- Returned adapter method:
  - `createCaseFromDraft(input)`

## Behavior

- Missing or invalid `caseCreationPort.createCaseFromDraft` fails closed at factory creation with:
  - `REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_CREATION_PORT_REQUIRED`
- `createCaseFromDraft(input)` requires:
  - plain object input
  - plain object `draft`
  - plain object `plan`
- Invalid creation input fails closed before creation port calls with:
  - `REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_INPUT_INVALID`
- Creation port thrown errors, async rejections, and invalid creation results return:
  - `REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_CREATE_FAILED`
- Successful creation results return sanitized caseRef envelopes.
- Successful default reason marker:
  - `REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_CASE_CREATED`

## Sanitization

- Safe creation fields forwarded:
  - `draft`
  - `plan`
  - `draftId`
  - `organizationId`
  - `tenantId`
  - `requestId`
  - `actor`
  - `metadata`
  - `warnings`
- Unsafe fields and markers are not forwarded or returned:
  - raw creation port object
  - raw draft row object
  - unsafe raw plan fields
  - raw SQL/query details
  - credentials
  - phone/address/customer data
  - LINE identity/token markers
  - `finalAppointmentId`
  - stack traces
  - raw thrown error messages

## Verification

```bash
node --test tests/repairIntake/repairIntakeCaseCreatorPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftReaderCasePlannerApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeCasePlannerPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCasePlannerPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftReaderFullInjectedChain.integration.test.js
node --test tests/repairIntake/repairIntakeDraftReaderApplicationService.integration.test.js
git diff --name-only
git diff --cached --name-only
```
