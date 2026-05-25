# Task1003 Repair Intake Draft-to-Case API Module Async Rejection Sanitization Guard

## Scope

Task1003 adds test coverage for actual API module route handler behavior when injected synthetic dependencies return unsafe async rejected promises.

Changed files:

- `tests/repairIntake/repairIntakeDraftToCaseApiModuleAsyncRejectionSanitization.unit.test.js`
- `docs/task-1003-repair-intake-draft-to-case-api-module-async-rejection-sanitization-guard-no-db-no-global-mount.md`

Production API module code was not modified.

## Imported Path

Actual API module path imported:

- `src/repairIntake/repairIntakeDraftToCaseApiModule.js`

## Async Unsafe Strings Tested

Injected synthetic controller/applicationService functions return rejected promises containing:

- SQL text
- `DATABASE_URL`
- phone data
- address data
- customer data
- `lineUserId`
- LINE access token marker
- `finalAppointmentId`
- stack-like text

## Async Rejection Behavior

Controller path:

- injected `planDraftToCase` returns an unsafe rejected promise;
- injected `submitDraftToCase` returns an unsafe rejected promise;
- direct handler invocation returns a sanitized failure envelope;
- failure reason: `REPAIR_INTAKE_DRAFT_CASE_ROUTE_HANDLER_FAILED`;
- unsafe rejection text is not captured in module metadata, route summaries, or handler results.

ApplicationService adapter path:

- injected `applicationService.planDraftToCase` returns an unsafe rejected promise;
- injected `applicationService.submitDraftToCase` returns an unsafe rejected promise;
- direct handler invocation returns a sanitized failure envelope;
- failure reason: `CONTROLLER_APPLICATION_SERVICE_FAILED`;
- unsafe rejection text is not captured in module metadata, route summaries, or handler results.

## Boundary Confirmation

Task1003 preserves:

- Task1002 sync thrown-error behavior;
- Task1001 applicationService adapter guard behavior;
- Task1000 controller dependency shape guard behavior;
- Task999 actual API module injected mount integration behavior;
- Task998 summary contract behavior;
- Task990 static boundary guard behavior;
- no global route registration;
- no production route registration;
- no DB or provider access.

Task1003 did not modify:

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
- Task989-Task1002 docs

No repository implementation, global app mount, production route registration, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Branch Status

After Task1003, the API module / injected mount adapter branch remains local, uncommitted, unstaged, and bounded to injected runtime composition hardening. Task989-Task1002 local/uncommitted state is preserved.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleAsyncRejectionSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleHandlerErrorSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleApplicationServiceAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleControllerShape.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseActualApiModuleInjectedMount.integration.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterSummaryContract.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
```
