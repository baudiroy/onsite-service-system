# Task1030 - Repair Intake CasePlanner Port Adapter Static Boundary Guard

## Scope

- Added a static boundary guard for `src/repairIntake/repairIntakeCasePlannerPortAdapter.js`.
- No production source, runtime, fixture, migration, admin, package, guardrail, or design files were modified.

## Static Guard Coverage

- Factory export:
  - `createRepairIntakeCasePlannerPortAdapter`
- Custom error:
  - `RepairIntakeCasePlannerPortAdapterError`
- Optional planning policy:
  - `planningPolicy.planCaseFromDraft`
- Returned adapter method:
  - `planCaseFromDraft`
- Plain object input validation:
  - `isObject(input)`
- Draft object validation:
  - `isObject(input.draft)`
- Safe planning input extraction:
  - `createPlanningInput`
  - `draftSummary`
  - `draftId`
  - `organizationId`
  - `tenantId`
  - `requestId`
  - `actor`
  - `metadata`
  - `warnings`
- Default planner path:
  - `defaultPlanCaseFromDraft`
- Injected planningPolicy path:
  - `await planningPolicy.planCaseFromDraft(planningInput)`
- Sanitized success envelope:
  - `planEnvelope`
- Sync thrown and async rejected policy sanitization:
  - `try`
  - `catch (error)`
  - no `error.message`, `error.stack`, or `throw error`
- Sanitized reason codes:
  - `REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_POLICY_REQUIRED`
  - `REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_INPUT_INVALID`
  - `REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_PLAN_FAILED`
  - `REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_PLAN_READY`
- Forbidden runtime/repository coupling markers are absent.

## Verification

```bash
node --test tests/repairIntake/repairIntakeCasePlannerPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCasePlannerPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftReaderFullInjectedChain.integration.test.js
node --test tests/repairIntake/repairIntakeDraftReaderApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeDraftReaderPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftReaderPortAdapter.unit.test.js
git diff --name-only
git diff --cached --name-only
```
