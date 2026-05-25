# Task1018 - Repair Intake Draft-to-Case ApplicationService Port Payload Sanitization Guard

## Scope

- Hardened only the repair intake draft-to-case application service port payload boundary.
- Added a focused unit test for port payload sanitization across plan and submit flows.
- No repository, DB, migration, global app mount, route registration, listen startup, provider, AI/RAG, billing, settlement, payment, invoice, admin, package, or design documentation changes.

## Implemented Behavior

- `draftReader.getDraftForConversion(payload)` receives a sanitized allowlisted request payload.
- `casePlanner.planCaseFromDraft(payload)` receives sanitized request context plus a sanitized draft summary.
- `caseCreator.createCaseFromDraft(payload)` receives sanitized request context plus sanitized draft and plan summaries.
- `auditWriter.recordDraftToCaseDecision(payload)` receives sanitized request context plus sanitized draft, plan, and caseRef summaries with the submitted decision marker.

## Safe Fields Preserved

- `draftId`
- `organizationId`
- `actorId`
- `requestId`
- `idempotencyKey`
- `tenantId`
- `approvalContext`
- `permissionContext`
- Sanitized nested `params`, `query`, `body`, and `context`
- Sanitized draft summary
- Sanitized plan summary
- Sanitized caseRef summary

## Unsafe Data Excluded

- Raw input objects
- Raw draft rows
- Raw port output objects
- SQL / DB markers
- Credentials and authorization headers
- Phone, address, and customer data
- LINE identity and token markers
- `finalAppointmentId`
- Stack traces and raw error details

## Verification

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServicePortPayloadSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceController.integration.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationService.seam.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerSanitizationBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerApiModuleInjectedMount.integration.test.js
git diff --name-only
git diff --cached --name-only
```
