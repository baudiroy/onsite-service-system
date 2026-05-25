# Task1002 Repair Intake Draft-to-Case API Module Handler Error Sanitization Test

## Scope

Task1002 adds test coverage for actual API module route handler behavior when injected synthetic dependencies throw unsafe errors.

Changed files:

- `tests/repairIntake/repairIntakeDraftToCaseApiModuleHandlerErrorSanitization.unit.test.js`
- `docs/task-1002-repair-intake-draft-to-case-api-module-handler-error-sanitization-test-no-db-no-global-mount.md`

Production source files were not modified.

## Imported Path

Actual API module path imported:

- `src/repairIntake/repairIntakeDraftToCaseApiModule.js`

## Unsafe Error Strings Tested

Injected synthetic controller/applicationService functions throw errors containing:

- SQL text
- `DATABASE_URL`
- phone data
- address data
- customer data
- `lineUserId`
- LINE access token marker
- `finalAppointmentId`
- stack-like text

## Current Direct Handler Invocation Behavior

Controller path:

- actual route handlers catch controller-thrown errors through the route factory;
- direct handler invocation returns a sanitized failure envelope;
- failure reason: `REPAIR_INTAKE_DRAFT_CASE_ROUTE_HANDLER_FAILED`;
- unsafe thrown error text is not captured in module metadata, route summaries, or handler result.

ApplicationService path:

- the API module builds the internal controller adapter from the injected service;
- service-thrown errors are caught by the controller adapter;
- direct handler invocation returns a sanitized failure envelope;
- failure reason: `CONTROLLER_APPLICATION_SERVICE_FAILED`;
- unsafe thrown error text is not captured in module metadata, route summaries, or handler result.

The applicationService adapter path is covered.

## Boundary Confirmation

Task1002 preserves:

- Task1001 applicationService guard behavior;
- Task1000 controller shape guard behavior;
- Task999 actual API module injected mount integration behavior;
- no global route registration;
- no production route registration;
- no DB or provider access.

Task1002 did not modify:

- production source
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
- Task989-Task1001 docs

No repository implementation, global app mount, production route registration, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Branch Status

After Task1002, the API module / injected mount adapter branch remains local, uncommitted, unstaged, and bounded to injected runtime composition hardening. Task989-Task1001 local/uncommitted state is preserved.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleHandlerErrorSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleApplicationServiceAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleControllerShape.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseActualApiModuleInjectedMount.integration.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterSummaryContract.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
```
