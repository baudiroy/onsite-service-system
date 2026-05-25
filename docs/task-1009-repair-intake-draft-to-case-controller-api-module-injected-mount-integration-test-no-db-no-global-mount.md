# Task1009 Repair Intake Draft-to-Case Controller API Module Injected Mount Integration Test

## Scope

Task1009 adds integration-style coverage proving the Task1008 injected controller seam works with the existing actual API module and hardened injected HTTP mount adapter.

Implemented files only:

- `tests/repairIntake/repairIntakeDraftToCaseControllerApiModuleInjectedMount.integration.test.js`
- `docs/task-1009-repair-intake-draft-to-case-controller-api-module-injected-mount-integration-test-no-db-no-global-mount.md`

Production source was not modified.

## Integration Flow Verified

The test verifies this injected runtime path:

```text
synthetic request
-> hardened injected HTTP mount adapter
-> actual API module route handler
-> Task1008 injected controller seam
-> synthetic applicationService
-> sanitized response envelope
```

Controller factory:

- creates a controller through `createRepairIntakeDraftToCaseController({ applicationService })`;
- uses a deterministic synthetic applicationService.

API module:

- creates the actual API module through `createRepairIntakeDraftToCaseApiModule({ controller })`;
- preserves actual route creation.

Mount adapter:

- mounts the actual API module through `mountRepairIntakeDraftToCaseApiModule`;
- uses explicitly injected synthetic mount targets only.

Post target:

- verifies `target.post(path, handler)` mount behavior;
- dispatches the plan route through the mounted handler.

Register target:

- verifies `target.register(method, path, handler)` mount behavior;
- dispatches the submit route through the mounted handler with a safe basePath.

Plan route:

- reaches only `applicationService.planDraftToCase`;
- returns a sanitized `PLAN_READY` response envelope.

Submit route:

- reaches only `applicationService.submitDraftToCase`;
- returns a sanitized `SUBMIT_READY` response envelope.

## Request Input Sanitization Verified

Safe fields forwarded:

- `params.draftId`
- `query.preview`
- `body.organizationId`
- `body.tenantId`
- `body.idempotencyKey`
- `context.organizationId`
- `context.actorId`
- `context.requestId`
- `actor.actorId`
- `organizationId`
- `tenantId`
- `requestId`

Unsafe fields not forwarded:

- raw HTTP/runtime fields such as `req`, `res`, `response`, `socket`, `headers`, `cookies`, and `rawBody`;
- SQL/DB markers;
- credentials;
- phone/address/customer data;
- LINE identity/token markers;
- `finalAppointmentId`.

## Handler Output Sanitization Verified

Safe fields returned:

- `ok`
- `statusCode`
- `reasonCode`
- `requiredActions`
- `draftId`
- `organizationId`
- `result`
- `metadata`
- `caseRef`

Unsafe fields/markers not returned:

- handler internals;
- raw controller/applicationService objects;
- DB/SQL markers;
- credentials;
- phone/address/customer data;
- LINE identity/token markers;
- `finalAppointmentId`;
- raw rows.

## Boundary Confirmation

Task1009 does not modify:

- `src/**`
- `tests/repairIntake/repairIntakeDraftToCaseController.runtime-seam.unit.test.js`
- `migrations/**`
- `admin/**`
- `package.json`
- `package-lock.json`
- `docs/PROJECT_GUARDRAILS.md`
- `docs/design/**`
- Task989-Task1008 docs

No repository implementation, global app mount, production route registration, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseControllerApiModuleInjectedMount.integration.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseController.runtime-seam.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleSanitizationBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleHandlerOutputSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleRequestInputSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseActualApiModuleInjectedMount.integration.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterSummaryContract.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
```
