# Task1031 - Repair Intake DraftReader + CasePlanner + ApplicationService Integration Test

## Scope

- Added an integration-style test proving both pure adapters can be used together as applicationService ports.
- No production source, runtime, migration, admin, package, guardrail, or design files were modified.

## Integration Chain

- Synthetic `draftRepository`
- `createRepairIntakeDraftReaderPortAdapter`
- Synthetic `planningPolicy`
- `createRepairIntakeCasePlannerPortAdapter`
- `createRepairIntakeDraftToCaseApplicationService`
- `planDraftToCase(input)` / `submitDraftToCase(input)`

## Verified Behavior

- Plan flow:
  - `planDraftToCase(input)` calls draftReader adapter then casePlanner adapter.
  - Draft repository receives sanitized lookup only.
  - Planning policy receives sanitized planning input only.
  - Case creator and audit writer are not called.
  - Plan envelope is sanitized.
- Submit flow:
  - Valid submit input includes idempotency, permission, and approval preconditions.
  - Call order is preserved:
    - draftRepository
    - planningPolicy
    - caseCreator
    - auditWriter
  - Case creator receives sanitized draft and plan summaries.
  - Audit writer receives sanitized draft, plan, and caseRef summaries.
- Sanitization:
  - Safe fields are preserved across draftReader, casePlanner, and applicationService.
  - Unsafe request/runtime fields, raw rows, SQL/DB markers, credentials, phone/address/customer data, LINE markers, `finalAppointmentId`, raw repository/port objects, stack, and token markers are not forwarded or returned.

## Verification

```bash
node --test tests/repairIntake/repairIntakeDraftReaderCasePlannerApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeCasePlannerPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCasePlannerPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftReaderFullInjectedChain.integration.test.js
node --test tests/repairIntake/repairIntakeDraftReaderApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeDraftReaderPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftReaderPortAdapter.unit.test.js
git diff --name-only
git diff --cached --name-only
```
