# Task1021 - Repair Intake Draft-to-Case ApplicationService Idempotency Port Seam

## Scope

- Added an optional pure injected `idempotencyPort` seam to the applicationService submit flow.
- Added a focused unit test for idempotency replay, normal recording, invalid port shape, precondition ordering, and sanitized error handling.
- No repository, DB, migration, global app mount, route registration, listen startup, provider, AI/RAG, billing, settlement, payment, invoice, admin, package, guardrail, or design documentation changes.

## Implemented Behavior

- `planDraftToCase(input)` does not use `idempotencyPort`.
- `submitDraftToCase(input)` still enforces Task1019R2 submit preconditions before any idempotency or core submit port call.
- If no `idempotencyPort` is provided, existing submit behavior is unchanged.
- If `idempotencyPort` is provided, both methods are required:
  - `findExistingDraftToCaseResult(input)`
  - `recordDraftToCaseResult(input)`
- Invalid idempotency port shape fails closed at factory creation with:
  - `REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_PORT_REQUIRED`
- After submit preconditions pass, `findExistingDraftToCaseResult` runs before `draftReader`.
- Existing successful idempotency results return a sanitized replay envelope and suppress:
  - `draftReader`
  - `casePlanner`
  - `caseCreator`
  - `auditWriter`
  - `recordDraftToCaseResult`
- Normal submit with an idempotency port records the sanitized submit result after audit.
- Idempotency port thrown errors and rejections return:
  - `REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_FAILED`

## Sanitization

- Idempotency find and record payloads use the same sanitized request-context boundary as the rest of the applicationService seam.
- Recorded result payloads include only sanitized submit envelopes.
- Raw input, raw draft rows, raw port objects, DB/SQL markers, credentials, phone/address/customer data, LINE identity/token markers, `finalAppointmentId`, stack traces, and raw thrown error messages are not exposed.

## Verification

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceIdempotencyPort.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceSubmitPreconditionBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceSubmitPrecondition.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServicePortPayloadSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceController.integration.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationService.seam.unit.test.js
git diff --name-only
git diff --cached --name-only
```
