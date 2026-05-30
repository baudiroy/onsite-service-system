# Task2200 Repair Intake Draft-to-Case Injected Adapter Failure Safe Envelope

## Scope

- Imported a narrow safe-envelope guard for the existing Repair Intake draft-to-case synthetic handler injected adapter boundary.
- No route mounting, runtime listener, DB/repository, migration, provider, AI/RAG, billing, package, admin frontend, smoke, staging, or production traffic changes.
- The 7 held historical docs remain untracked and untouched.

## Boundary Inspected

- `src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js`
- The allowed path resolves trusted context, applies the permission gate, builds sanitized adapter input, then invokes the injected controller adapter.

## Behavior

- Allowed trusted context still invokes the injected adapter exactly once.
- Thrown or rejected injected adapter failures return a sanitized failed envelope with:
  - `REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_FAILED`
- Malformed injected adapter outputs now return a sanitized failed envelope with:
  - `REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_OUTPUT_INVALID`
- Safe failure envelopes preserve only trusted public context fields and an empty `draftInput`.
- Raw exception text, stacks, SQL, tokens/passwords, provider payloads, raw request/body/draft input, AI/RAG, billing, settlement/invoice, audit internals, and customer private fields are not exposed.
- Permission-denied behavior remains unchanged and still skips the injected adapter.

## Verification

- `node --test tests/repairIntake/repairIntakeDraftToCaseInjectedAdapterFailureSafeEnvelope.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePermissionGateWiring.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePermissionDeniedAuditIntent.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePermissionDeniedAuditIntent.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseSyntheticHandler.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseSyntheticHandlerBoundary.static.test.js`
- Adjacent synthetic and HTTP envelope tests as applicable.
- `git diff --check`
- `git diff --cached --check`
