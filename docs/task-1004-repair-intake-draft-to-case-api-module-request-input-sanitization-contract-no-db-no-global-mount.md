# Task1004 Repair Intake Draft-to-Case API Module Request Input Sanitization Contract

## Scope

Task1004 locks the actual API module route handlers so injected controller and applicationService paths receive sanitized request input instead of raw HTTP/runtime objects.

Changed files:

- `src/repairIntake/repairIntakeDraftToCaseApiModule.js`
- `tests/repairIntake/repairIntakeDraftToCaseApiModuleRequestInputSanitization.unit.test.js`
- `docs/task-1004-repair-intake-draft-to-case-api-module-request-input-sanitization-contract-no-db-no-global-mount.md`

## Production Change

The API module now wraps the selected controller before route creation and forwards only a sanitized request-like envelope to route handlers.

Safe top-level fields preserved:

- `actor`
- `body`
- `context`
- `organizationId`
- `params`
- `query`
- `requestId`
- `tenantId`

Unsafe raw/runtime fields and sensitive field names are removed recursively before controller invocation.

## Request Input Sanitization Behavior

Controller path:

- plan route receives only sanitized request input;
- submit route receives only sanitized request input;
- safe fields such as `params.draftId`, `body.organizationId`, `query`, `context.actorId`, `context.requestId`, `actor`, `organizationId`, `tenantId`, and `requestId` are preserved;
- raw HTTP/runtime objects and sensitive markers are not forwarded.

ApplicationService adapter path:

- plan route receives sanitized request input from the API module, then the existing adapter maps it to the application service input contract;
- submit route receives sanitized request input from the API module, then the existing adapter maps it to the application service input contract;
- adapter input still preserves `draftId`, `organizationId`, `actorId`, `requestId`, `idempotencyKey`, `approvalContext`, and `permissionContext`;
- raw HTTP/runtime objects and sensitive markers are not forwarded.

## Unsafe Fields Covered

The test verifies that these raw/runtime and sensitive field names are not forwarded:

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
- `originalUrl`
- `baseUrl`
- `ip`
- `ips`
- `protocol`
- `hostname`
- `files`
- `file`
- `rawBody`
- `DATABASE_URL`
- `authorization`
- `cookie`
- `lineUserId`
- `lineAccessToken`
- `phone`
- `address`
- `customerPhone`
- `finalAppointmentId`
- `sql`

## Boundary Confirmation

Task1004 preserves:

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

Task1004 did not modify:

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
- Task989-Task1003 docs

No repository implementation, global app mount, production route registration, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Branch Status

After Task1004, the API module / injected mount adapter branch remains local, uncommitted, unstaged, and bounded to injected runtime composition hardening. Task989-Task1003 local/uncommitted state is preserved.

## Verification

Required commands:

```bash
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
