# Task1022 - Repair Intake Draft-to-Case ApplicationService Idempotency Static Boundary Guard

## Scope

- Added a static regression guard for the optional `idempotencyPort` seam introduced in Task1021.
- No production source, runtime, fixture, migration, admin, package, guardrail, or design files were modified.

## Static Guard Coverage

- Confirms optional idempotency seam markers remain present:
  - `idempotencyPort`
  - `findExistingDraftToCaseResult`
  - `recordDraftToCaseResult`
  - `idempotencyPortIsValid`
  - `callIdempotencyPort`
  - `idempotentReplayEnvelope`
- Confirms sanitized idempotency reason codes remain present:
  - `REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_PORT_REQUIRED`
  - `REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_FAILED`
- Confirms submit flow ordering:
  - submit preconditions before idempotency find
  - idempotency find before core submit ports
  - replay return before core submit ports
  - record after normal submit result creation
- Confirms `planDraftToCase` does not reference the idempotency seam.
- Confirms forbidden runtime/repository coupling markers are absent.

## Verification

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceIdempotencyBoundary.static.test.js
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
