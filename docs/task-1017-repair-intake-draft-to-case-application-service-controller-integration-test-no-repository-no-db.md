# Task1017 Repair Intake Draft-to-Case ApplicationService Controller Integration Test

## Scope

Task1017 adds integration-style coverage proving the pure Task1015 applicationService seam works through the Task1008 controller seam, actual API module, and hardened injected HTTP mount adapter.

Implemented files only:

- `tests/repairIntake/repairIntakeDraftToCaseApplicationServiceController.integration.test.js`
- `docs/task-1017-repair-intake-draft-to-case-application-service-controller-integration-test-no-repository-no-db.md`

Production source was not modified.

## Integration Chain Verified

The test verifies this injected chain:

```text
synthetic ports
-> createRepairIntakeDraftToCaseApplicationService
-> createRepairIntakeDraftToCaseController
-> createRepairIntakeDraftToCaseApiModule
-> mountRepairIntakeDraftToCaseApiModule
-> synthetic mount target
-> synthetic request dispatch
```

ApplicationService:

- created through `createRepairIntakeDraftToCaseApplicationService`;
- uses synthetic injected ports only.

Controller:

- created through `createRepairIntakeDraftToCaseController`;
- receives the pure applicationService seam.

API module:

- created through `createRepairIntakeDraftToCaseApiModule`;
- receives the injected controller.

Mount adapter:

- mounts the actual API module through `mountRepairIntakeDraftToCaseApiModule`;
- uses only an explicitly injected synthetic mount target.

Synthetic mount target:

- dispatches synthetic plan and submit requests through mounted handlers.

## Plan Flow Verified

Port call order:

- `draftReader.getDraftForConversion`
- `casePlanner.planCaseFromDraft`

Forbidden port calls not made:

- `caseCreator.createCaseFromDraft`
- `auditWriter.recordDraftToCaseDecision`

Sanitized plan envelope:

- returns `PLAN_READY`;
- preserves safe plan fields;
- does not expose raw rows, SQL/DB markers, credentials, phone/address/customer data, LINE identity/token markers, `finalAppointmentId`, raw port objects, or stack traces.

## Submit Flow Verified

Port call order:

- `draftReader.getDraftForConversion`
- `casePlanner.planCaseFromDraft`
- `caseCreator.createCaseFromDraft`
- `auditWriter.recordDraftToCaseDecision`

Sanitized submit envelope:

- returns `SUBMIT_READY`;
- preserves safe `caseRef` and `auditEvent` fields;
- does not expose raw rows, SQL/DB markers, credentials, phone/address/customer data, LINE identity/token markers, `finalAppointmentId`, raw port objects, or stack traces.

## Request/Port Input Sanitization Verified

Safe fields forwarded:

- `params.draftId`
- `query.preview`
- `body.organizationId`
- `body.tenantId`
- `body.idempotencyKey`
- `context.organizationId`
- `context.actorId`
- `context.requestId`
- `requestId`
- `tenantId`

Unsafe fields not forwarded:

- raw HTTP/runtime fields;
- SQL/DB markers;
- credentials;
- phone/address/customer data;
- LINE identity/token markers;
- `finalAppointmentId`.

## Output/Mount Metadata Sanitization Verified

Unsafe fields/markers not returned:

- handler internals;
- raw service/controller/module/port objects;
- raw draft rows;
- DB/SQL markers;
- credentials;
- phone/address/customer data;
- LINE identity/token markers;
- `finalAppointmentId`;
- stack traces.

## Boundary Confirmation

Task1017 does not modify:

- `src/**`
- `tests/repairIntake/repairIntakeDraftToCaseApplicationService.seam.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseApplicationServiceBoundary.static.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseController.runtime-seam.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseControllerApiModuleInjectedMount.integration.test.js`
- `migrations/**`
- `admin/**`
- `package.json`
- `package-lock.json`
- `docs/PROJECT_GUARDRAILS.md`
- `docs/design/**`
- Task989-Task1016 docs

No repository implementation or import, global app mount, production route registration, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceController.integration.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationServiceBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApplicationService.seam.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerSanitizationBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerInputSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerInputShape.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerApiModuleInjectedMount.integration.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
```
