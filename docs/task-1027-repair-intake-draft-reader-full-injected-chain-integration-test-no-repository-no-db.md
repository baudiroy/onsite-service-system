# Task1027 - Repair Intake DraftReader Full Injected Chain Integration Test

## Scope

- Added an integration-style test for the full injected runtime chain using the draftReader adapter.
- No production source, runtime, migration, admin, package, guardrail, or design files were modified.

## Full Injected Chain

- Synthetic `draftRepository`
- `createRepairIntakeDraftReaderPortAdapter`
- `createRepairIntakeDraftToCaseApplicationService`
- `createRepairIntakeDraftToCaseController`
- `createRepairIntakeDraftToCaseApiModule`
- `mountRepairIntakeDraftToCaseApiModule`
- Synthetic mount target
- Synthetic request dispatch

## Verified Behavior

- Plan route flow:
  - Synthetic plan request dispatches through mounted handler.
  - Draft repository receives sanitized lookup only.
  - Case planner receives sanitized draft summary.
  - Case creator and audit writer are not called.
  - Plan response is sanitized.
- Submit route flow:
  - Synthetic submit request includes valid idempotency, permission, and approval preconditions.
  - Call order is preserved:
    - draftRepository
    - casePlanner
    - caseCreator
    - auditWriter
  - Case creator receives sanitized draft and plan summaries.
  - Audit writer receives sanitized draft, plan, and caseRef summaries plus submitted decision marker.
  - Submit response is sanitized.
- Request and inter-port sanitization:
  - Safe request fields are preserved across API module, controller, applicationService, and draftReader adapter.
  - Unsafe request/runtime/sensitive fields are not forwarded to repository or ports.
- Mount and output sanitization:
  - Mounted route summaries expose only safe metadata.
  - Returned envelopes exclude raw rows, SQL/DB markers, credentials, phone/address/customer data, LINE markers, `finalAppointmentId`, raw repository/port objects, and stack traces.

## Verification

```bash
node --test tests/repairIntake/repairIntakeDraftReaderFullInjectedChain.integration.test.js
node --test tests/repairIntake/repairIntakeDraftReaderApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeDraftReaderPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftReaderPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceIdempotencyBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceIdempotencyPort.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceSubmitPrecondition.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServicePortPayloadSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerApiModuleInjectedMount.integration.test.js
git diff --name-only
git diff --cached --name-only
```
