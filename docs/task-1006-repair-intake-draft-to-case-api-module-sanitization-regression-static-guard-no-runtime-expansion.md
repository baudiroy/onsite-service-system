# Task1006 Repair Intake Draft-to-Case API Module Sanitization Regression Static Guard

## Scope

Task1006 adds a static regression guard for the actual API module sanitization layer built through Task1000-Task1005.

Implemented files only:

- `tests/repairIntake/repairIntakeDraftToCaseApiModuleSanitizationBoundary.static.test.js`
- `docs/task-1006-repair-intake-draft-to-case-api-module-sanitization-regression-static-guard-no-runtime-expansion.md`

Production source was not modified.

## Static Guard Coverage

The static test reads:

- `src/repairIntake/repairIntakeDraftToCaseApiModule.js`

It asserts that the source keeps static guard/sanitization concepts for:

- controller dependency validation;
- applicationService dependency validation;
- safe route handler wrapper;
- request input allowlist;
- unsafe request/raw runtime field exclusion;
- handler output sanitizer;
- sync thrown error sanitization by avoiding raw `error.message`, `error.stack`, or `throw error` forwarding;
- async rejected promise sanitization path through awaited handler output;
- sanitized failure reasonCode / requiredActions usage.

## Forbidden Runtime Coupling Markers Checked

The static test asserts the API module source does not contain newly introduced forbidden markers:

- `require('../db')`
- `require('../repositories')`
- `require('../routes')`
- `require('../controllers')`
- `express()`
- `app.listen`
- `server.listen`
- `fetch(`
- `axios`
- `lineAccessToken`
- `DATABASE_URL`
- `process.env.DATABASE_URL`
- `finalAppointmentId`

## Boundary Confirmation

Task1006 preserves:

- Task1005 handler output sanitization behavior;
- Task1004 request input sanitization behavior;
- Task1003 async rejection sanitization behavior;
- Task1002 sync thrown-error sanitization behavior;
- Task1001 applicationService adapter guard behavior;
- Task1000 controller dependency shape guard behavior;
- Task999 actual API module injected mount integration behavior;
- Task998 summary contract behavior;
- Task990 static boundary guard behavior;
- no runtime expansion.

Task1006 did not modify:

- `src/**`
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
- Task989-Task1005 docs

No repository implementation, global app mount, production route registration, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Branch Status

After Task1006, the API module / injected mount adapter branch remains local, uncommitted, unstaged, and bounded to injected runtime composition hardening. Task989-Task1005 local/uncommitted state is preserved.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleSanitizationBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleHandlerOutputSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleRequestInputSanitization.unit.test.js
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
