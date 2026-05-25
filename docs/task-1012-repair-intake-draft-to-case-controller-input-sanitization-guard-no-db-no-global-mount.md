# Task1012 Repair Intake Draft-to-Case Controller Input Sanitization Guard

## Scope

Task1012 hardens the Task1008 controller seam so valid object input is sanitized before being forwarded to the injected applicationService.

Implemented / changed files:

- `src/repairIntake/repairIntakeDraftToCaseController.js`
- `tests/repairIntake/repairIntakeDraftToCaseControllerInputSanitization.unit.test.js`
- `docs/task-1012-repair-intake-draft-to-case-controller-input-sanitization-guard-no-db-no-global-mount.md`

## Production Change

The controller now:

- preserves Task1011 invalid input fail-closed behavior;
- recursively sanitizes valid object input before calling applicationService;
- preserves safe input fields needed by the injected runtime seam;
- removes raw HTTP/runtime and sensitive fields before applicationService invocation;
- keeps handler output sanitization unchanged.

## Controller Input Sanitization Behavior

Plan handler safe fields forwarded:

- `actor`
- `body`
- `context`
- `organizationId`
- `params`
- `query`
- `requestId`
- `tenantId`

Submit handler safe fields forwarded:

- `actor`
- `body`
- `context`
- `organizationId`
- `params`
- `query`
- `requestId`
- `tenantId`

Unsafe fields removed before applicationService call:

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
- `customerName`
- `finalAppointmentId`
- `sql`
- `db`
- `rawRows`

Recursive sanitization behavior:

- unsafe keys are removed from top-level input;
- unsafe keys are removed from nested `actor`, `body`, `context`, `params`, `query`, approval, and permission structures;
- functions, symbols, and `undefined` nested values are not forwarded.

Invalid input behavior preserved:

- non-object inputs still fail closed;
- applicationService is not called for invalid inputs;
- plan invalid reason remains `REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_PLAN_INPUT_INVALID`;
- submit invalid reason remains `REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_SUBMIT_INPUT_INVALID`.

## Unsafe Data Not Exposed

Sanitized input and failure envelopes do not expose:

- raw input object;
- removed sensitive fields;
- SQL/DB markers;
- credentials;
- phone/address/customer data;
- LINE identity/token markers;
- `finalAppointmentId`;
- raw applicationService object;
- handler internals.

## Boundary Confirmation

Task1012 does not modify:

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
- Task989-Task1011 docs

No repository implementation, global app mount, production route registration, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseControllerInputSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerInputShape.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseControllerApiModuleInjectedMount.integration.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseController.runtime-seam.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleSanitizationBoundary.static.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleHandlerOutputSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleRequestInputSanitization.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
```
