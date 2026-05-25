# Task1024 - Repair Intake Draft-to-Case DraftReader Port Adapter Seam

## Scope

- Added a pure injected draftReader adapter seam.
- Added focused unit coverage for dependency shape, lookup sanitization, invalid input, not-found, successful read, and thrown/rejected repository failures.
- No real repository, DB, migration, global app mount, route registration, listen startup, provider, AI/RAG, billing, settlement, payment, invoice, admin, package, guardrail, or design documentation changes.

## Adapter Surface

- Factory export:
  - `createRepairIntakeDraftReaderPortAdapter(options)`
- Error export:
  - `RepairIntakeDraftReaderPortAdapterError`
- Required injected synthetic port:
  - `draftRepository.findDraftForConversion(input)`
- Returned port method:
  - `getDraftForConversion(input)`

## Behavior

- Missing or invalid `draftRepository.findDraftForConversion` fails closed at factory creation with:
  - `REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_REPOSITORY_REQUIRED`
- `getDraftForConversion(input)` requires a plain object input.
- Invalid input or missing draft lookup id fails closed before repository calls with:
  - `REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_INPUT_INVALID`
- Null / not-found repository result returns:
  - `REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_DRAFT_NOT_FOUND`
- Repository thrown errors and async rejections return:
  - `REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_READ_FAILED`
- Successful repository results return a sanitized draft envelope only.

## Sanitization

- Safe lookup fields forwarded:
  - `draftId`
  - `params.draftId`
  - `organizationId`
  - `tenantId`
  - `requestId`
  - `actor.actorId`
  - `context.actorId`
  - `context.organizationId`
  - `context.tenantId`
  - `context.requestId`
- Unsafe fields and markers are not forwarded or returned:
  - raw repository object
  - raw row object
  - raw SQL/query details
  - credentials
  - phone/address/customer data
  - LINE identity/token markers
  - `finalAppointmentId`
  - stack traces
  - raw thrown error messages

## Verification

```bash
node --test tests/repairIntake/repairIntakeDraftReaderPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceIdempotencyBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceIdempotencyPort.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceSubmitPreconditionBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceSubmitPrecondition.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServicePortPayloadSanitization.unit.test.js
git diff --name-only
git diff --cached --name-only
```
