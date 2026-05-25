# Task1029 - Repair Intake Draft-to-Case CasePlanner Port Adapter Seam

## Scope

- Added a pure injected casePlanner adapter seam.
- Added unit coverage for default planning, injected planning policy, invalid policy shape, invalid input, thrown/rejected policy failures, and sanitization.
- No real repository, DB, migration, global app mount, route registration, listen startup, provider, AI/RAG, billing, settlement, payment, invoice, admin, package, guardrail, or design documentation changes.

## Adapter Surface

- Factory export:
  - `createRepairIntakeCasePlannerPortAdapter(options)`
- Error export:
  - `RepairIntakeCasePlannerPortAdapterError`
- Optional injected synthetic planning port:
  - `planningPolicy.planCaseFromDraft(input)`
- Returned adapter method:
  - `planCaseFromDraft(input)`

## Behavior

- If no `planningPolicy` is provided, the adapter uses an internal deterministic default planner.
- If `planningPolicy` is provided, `planningPolicy.planCaseFromDraft` must be a function.
- Invalid planning policy shape fails closed at factory creation with:
  - `REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_POLICY_REQUIRED`
- `planCaseFromDraft(input)` requires a plain object input with a plain object `draft`.
- Invalid planning input fails closed before policy calls with:
  - `REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_INPUT_INVALID`
- Planning policy thrown errors, async rejections, and invalid policy results return:
  - `REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_PLAN_FAILED`
- Successful default or injected planner results return sanitized plan envelopes.
- Successful default planner uses:
  - `REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_PLAN_READY`

## Sanitization

- Safe planning fields forwarded:
  - `draft`
  - `draftId`
  - `organizationId`
  - `tenantId`
  - `requestId`
  - `actor`
  - `metadata`
  - `warnings`
- Unsafe fields and markers are not forwarded or returned:
  - raw planningPolicy object
  - raw draft row object
  - raw SQL/query details
  - credentials
  - phone/address/customer data
  - LINE identity/token markers
  - `finalAppointmentId`
  - stack traces
  - raw thrown error messages

## Verification

```bash
node --test tests/repairIntake/repairIntakeCasePlannerPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftReaderFullInjectedChain.integration.test.js
node --test tests/repairIntake/repairIntakeDraftReaderApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeDraftReaderPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftReaderPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceIdempotencyBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
```
