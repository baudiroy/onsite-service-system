# Task1005 Repair Intake Draft-to-Case API Module Handler Output Sanitization Contract

## Scope

Task1005 locks the actual API module route handlers so injected controller and applicationService return values are sanitized before being returned from route handlers.

Changed files:

- `src/repairIntake/repairIntakeDraftToCaseApiModule.js`
- `tests/repairIntake/repairIntakeDraftToCaseApiModuleHandlerOutputSanitization.unit.test.js`
- `docs/task-1005-repair-intake-draft-to-case-api-module-handler-output-sanitization-contract-no-db-no-global-mount.md`

## Production Change

The API module safe controller wrapper now sanitizes handler output recursively after the selected controller returns and before the route factory returns the handler result.

This preserves the existing public export/signature:

- `createRepairIntakeDraftToCaseApiModule(options)`

## Handler Output Sanitization Behavior

Controller path:

- plan route output is sanitized recursively;
- submit route output is sanitized recursively;
- safe success envelope fields remain available;
- raw runtime objects, DB/SQL markers, credentials, personal data markers, handler references, controller references, and error/stack fields are not forwarded.

ApplicationService adapter path:

- plan route output remains sanitized by the existing adapter and the API module output sanitizer;
- submit route output remains sanitized by the existing adapter and the API module output sanitizer;
- safe adapter output fields remain available;
- unsafe fields returned by applicationService are not forwarded.

## Safe Output Fields Preserved

The test covers preservation of safe fields such as:

- `ok`
- `status`
- `statusCode`
- `reasonCode`
- `requiredActions`
- `draftId`
- `organizationId`
- `caseRef`
- `caseId`
- `plan`
- `result`
- `warnings`
- `metadata`

## Unsafe Output Fields Covered

The test verifies that these raw/runtime and sensitive output fields are removed recursively:

- `req`
- `res`
- `response`
- `next`
- `socket`
- `connection`
- `headers`
- `rawHeaders`
- `cookies`
- `signedCookies`
- `session`
- `app`
- `route`
- `raw`
- `rawRows`
- `sql`
- `query`
- `paramsSql`
- `db`
- `databaseUrl`
- `DATABASE_URL`
- `authorization`
- `cookie`
- `lineUserId`
- `lineAccessToken`
- `phone`
- `address`
- `customerPhone`
- `customerName`
- `finalAppointmentId`
- `stack`
- `error`
- `handler`
- `controller`
- `applicationService`

## Boundary Confirmation

Task1005 preserves:

- Task1004 request input sanitization behavior;
- Task1003 async rejection sanitization behavior;
- Task1002 sync thrown-error sanitization behavior;
- Task1001 applicationService adapter guard behavior;
- Task1000 controller dependency shape guard behavior;
- Task999 actual API module injected mount integration behavior;
- Task998 summary contract behavior;
- Task990 static boundary guard behavior;
- no global route registration;
- no production route registration;
- no DB or provider access.

Task1005 did not modify:

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
- Task989-Task1004 docs

No repository implementation, global app mount, production route registration, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Branch Status

After Task1005, the API module / injected mount adapter branch remains local, uncommitted, unstaged, and bounded to injected runtime composition hardening. Task989-Task1004 local/uncommitted state is preserved.

## Verification

Required commands:

```bash
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
