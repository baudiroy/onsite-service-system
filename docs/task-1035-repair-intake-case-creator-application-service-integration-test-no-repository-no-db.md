# Task1035 - Repair Intake CaseCreator + ApplicationService Integration Test

## Scope

- Added an integration-style test proving the pure caseCreator adapter can be used as the `caseCreator` port of the pure applicationService seam together with pure draftReader and casePlanner adapters.
- No production source, runtime, migration, admin, package, guardrail, or design files were modified.

## Integration Chain

- Synthetic `draftRepository`
- `createRepairIntakeDraftReaderPortAdapter`
- Synthetic `planningPolicy`
- `createRepairIntakeCasePlannerPortAdapter`
- Synthetic `caseCreationPort`
- `createRepairIntakeCaseCreatorPortAdapter`
- `createRepairIntakeDraftToCaseApplicationService`
- `submitDraftToCase(input)`

## Verified Behavior

- Submit flow:
  - Valid submit input includes idempotency, permission, and approval preconditions.
  - Call order is preserved:
    - draftRepository
    - planningPolicy
    - caseCreationPort
    - auditWriter
  - Returned submit envelope is sanitized.
- CaseCreator adapter payload:
  - Case creation port receives sanitized creation input only.
  - Payload includes sanitized draft summary.
  - Payload includes sanitized plan summary.
  - Payload preserves safe request context.
  - Payload excludes unsafe/raw fields.
- Audit payload:
  - Audit writer receives sanitized draft, plan, and caseRef summaries only.
  - Audit writer does not receive raw creation result or unsafe markers.
- Unsafe markers excluded:
  - raw rows
  - SQL/DB markers
  - credentials
  - phone/address/customer data
  - LINE identity/token markers
  - `finalAppointmentId`
  - raw repository/port objects
  - stack/token markers

## Verification

```bash
node --test tests/repairIntake/repairIntakeCaseCreatorApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCaseCreatorPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftReaderCasePlannerApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeCasePlannerPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeCasePlannerPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftReaderFullInjectedChain.integration.test.js
git diff --name-only
git diff --cached --name-only
```
