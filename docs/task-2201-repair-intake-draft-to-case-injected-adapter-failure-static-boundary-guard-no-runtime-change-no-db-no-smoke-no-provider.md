# Task2201 Repair Intake Draft-to-Case Injected Adapter Failure Static Boundary Guard

## Scope

- Added a static boundary guard for the Task2200 injected adapter failure safe-envelope behavior.
- No runtime/source behavior changes.
- No route mounting, DB/repository, migration, provider, AI/RAG, billing, package, admin frontend, smoke, endpoint probe, server/listener, staging, or production traffic.
- The 7 held historical docs remain untracked and untouched.

## Static Guard Coverage

- Confirms the allowed path reaches `createAdapterInput(resolverResult)` only after trusted context resolution and the permission gate.
- Confirms the adapter invocation goes through `callControllerAdapter(adapterInput)`.
- Confirms thrown/rejected adapter failures are caught and mapped to:
  - `REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_FAILED`
- Confirms malformed adapter output is normalized through `normalizeAdapterOutput()` and mapped to:
  - `REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_OUTPUT_INVALID`
- Confirms the safe failure envelope includes trusted context fields only and `draftInput: {}`.
- Confirms permission-denied path returns before adapter input construction and controller adapter invocation.
- Confirms Task2200 unit coverage remains present for thrown, rejected, malformed, deny-skip, and mutation behavior.

## Verification

- `node --test tests/repairIntake/repairIntakeDraftToCaseInjectedAdapterFailureSafeEnvelope.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseInjectedAdapterFailureSafeEnvelope.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePermissionGateWiring.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePermissionDeniedAuditIntent.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseSyntheticHandler.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseSyntheticHandlerBoundary.static.test.js`
- `git diff --check`
- `git diff --cached --check`
