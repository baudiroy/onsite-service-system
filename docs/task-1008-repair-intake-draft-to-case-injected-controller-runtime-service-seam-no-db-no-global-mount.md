# Task1008 Repair Intake Draft-to-Case Injected Controller Runtime Service Seam

## Scope

Task1008 creates a bounded injected controller seam that can later sit between the actual API module and a real application service without connecting to DB, repositories, runtime routes, providers, or global app wiring.

Implemented / changed files:

- `src/repairIntake/repairIntakeDraftToCaseController.js`
- `tests/repairIntake/repairIntakeDraftToCaseController.runtime-seam.unit.test.js`
- `docs/task-1008-repair-intake-draft-to-case-injected-controller-runtime-service-seam-no-db-no-global-mount.md`

## Factory Export

The controller module exports:

- `createRepairIntakeDraftToCaseController(options)`
- `RepairIntakeDraftToCaseControllerError`

## Controller Seam Behavior

Valid applicationService accepted:

- requires injected `applicationService.planDraftToCase`;
- requires injected `applicationService.submitDraftToCase`;
- returns a controller with `planDraftToCase` and `submitDraftToCase`.

Plan handler behavior:

- `controller.planDraftToCase(input)` calls only `applicationService.planDraftToCase(input)`;
- returned applicationService envelope is passed through a local safe output sanitizer.

Submit handler behavior:

- `controller.submitDraftToCase(input)` calls only `applicationService.submitDraftToCase(input)`;
- returned applicationService envelope is passed through a local safe output sanitizer.

Sync thrown error behavior:

- plan handler returns reasonCode `REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_PLAN_FAILED`;
- submit handler returns reasonCode `REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_SUBMIT_FAILED`;
- raw error message and stack are not exposed.

Async rejected error behavior:

- plan handler returns reasonCode `REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_PLAN_FAILED`;
- submit handler returns reasonCode `REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_SUBMIT_FAILED`;
- raw rejection message and stack are not exposed.

Invalid applicationService behavior:

- factory throws `RepairIntakeDraftToCaseControllerError`;
- reasonCode is `REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_APPLICATION_SERVICE_REQUIRED`;
- requiredActions is `['configure_application_service']`;
- raw applicationService data is not exposed.

## Sanitization Behavior

Unsafe strings tested:

- SQL / `select *`
- `DATABASE_URL`
- postgres URL marker
- phone data
- address data
- customer data
- `lineUserId`
- LINE access token marker
- `finalAppointmentId`
- stack-like text

Unsafe fields/markers not exposed:

- raw thrown error message;
- stack trace;
- SQL/DB markers;
- credentials;
- phone/address/customer data;
- LINE identity/token markers;
- `finalAppointmentId`;
- raw applicationService object;
- handler internals.

## Boundary Confirmation

Task1008 does not modify or connect:

- `src/repairIntake/repairIntakeDraftToCaseApiModule.js`
- `src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js`
- `src/app.js`
- `src/server.js`
- `src/routes/index.js`
- `src/routes/public.routes.js`
- `src/routes/**`
- `src/controllers/**`
- `src/repositories/**`
- `src/db/**`
- `migrations/**`
- `admin/**`
- `package.json`
- `package-lock.json`
- `docs/PROJECT_GUARDRAILS.md`
- `docs/design/**`
- Task989-Task1007 docs

No repository implementation, global app mount, production route registration, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseController.runtime-seam.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleSanitizationBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleHandlerOutputSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleRequestInputSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleAsyncRejectionSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleHandlerErrorSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleApplicationServiceAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleControllerShape.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseActualApiModuleInjectedMount.integration.test.js
git diff --name-only
git diff --cached --name-only
```
