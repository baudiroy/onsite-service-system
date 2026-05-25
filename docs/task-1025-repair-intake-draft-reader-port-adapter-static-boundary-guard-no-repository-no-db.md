# Task1025 - Repair Intake DraftReader Port Adapter Static Boundary Guard

## Scope

- Added a static boundary guard for `src/repairIntake/repairIntakeDraftReaderPortAdapter.js`.
- No production source, runtime, fixture, migration, admin, package, guardrail, or design files were modified.

## Static Guard Coverage

- Factory export:
  - `createRepairIntakeDraftReaderPortAdapter`
- Custom error:
  - `RepairIntakeDraftReaderPortAdapterError`
- Injected repository-like port:
  - `draftRepository.findDraftForConversion`
- Returned adapter method:
  - `getDraftForConversion`
- Plain object input validation:
  - `if (!isObject(input))`
- Safe lookup extraction:
  - `draftId`
  - `params.draftId`
  - `organizationId`
  - `tenantId`
  - `requestId`
  - `actor.actorId`
  - `context.actorId`
- Sanitized success envelope:
  - `draftEnvelope`
- Sanitized not-found envelope:
  - `failureEnvelope`
  - `REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_DRAFT_NOT_FOUND`
- Sync thrown and async rejected read sanitization:
  - `try`
  - `await draftRepository.findDraftForConversion(lookup)`
  - `catch (error)`
  - no `error.message`, `error.stack`, or `throw error`
- Sanitized reason codes:
  - `REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_REPOSITORY_REQUIRED`
  - `REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_INPUT_INVALID`
  - `REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_DRAFT_NOT_FOUND`
  - `REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_READ_FAILED`
- Forbidden runtime/repository coupling markers are absent.

## Verification

```bash
node --test tests/repairIntake/repairIntakeDraftReaderPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftReaderPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceIdempotencyBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceIdempotencyPort.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceSubmitPreconditionBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceSubmitPrecondition.unit.test.js
git diff --name-only
git diff --cached --name-only
```
