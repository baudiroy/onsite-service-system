# Task1011 Repair Intake Draft-to-Case Controller Invalid Input Shape Guard

## Scope

Task1011 hardens only the Task1008 controller seam handler input boundary.

Implemented / changed files:

- `src/repairIntake/repairIntakeDraftToCaseController.js`
- `tests/repairIntake/repairIntakeDraftToCaseControllerInputShape.unit.test.js`
- `docs/task-1011-repair-intake-draft-to-case-controller-invalid-input-shape-guard-no-db-no-global-mount.md`

## Production Change

The controller now fails closed before calling the injected applicationService when handler input is not a plain object.

Minimal change summary:

- added an invalid-handler-input sentinel so omitted/`undefined` input is invalid;
- added input shape validation inside the shared applicationService call helper;
- added route-specific invalid input reason codes;
- preserved output sanitization for valid applicationService results and applicationService thrown/rejected errors.

## Input Shape Behavior

Valid plan input:

- forwarded unchanged to `applicationService.planDraftToCase(input)`;
- output remains sanitized.

Valid submit input:

- forwarded unchanged to `applicationService.submitDraftToCase(input)`;
- output remains sanitized.

Invalid plan inputs:

- `undefined`
- `null`
- string
- number
- boolean
- array
- function

Invalid submit inputs:

- `undefined`
- `null`
- string
- number
- boolean
- array
- function

ApplicationService call suppression on invalid input:

- invalid plan input does not call `applicationService.planDraftToCase`;
- invalid submit input does not call `applicationService.submitDraftToCase`.

## Sanitized Invalid-Input ReasonCodes

Plan:

- `REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_PLAN_INPUT_INVALID`

Submit:

- `REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_SUBMIT_INPUT_INVALID`

## Unsafe Data Not Exposed

Invalid-input failure envelopes do not expose:

- raw input object;
- stack trace;
- SQL/DB markers;
- credentials;
- phone/address/customer data;
- LINE identity/token markers;
- `finalAppointmentId`;
- raw applicationService object;
- handler internals.

## Boundary Confirmation

Task1011 does not modify:

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
- Task989-Task1010 docs

No repository implementation, global app mount, production route registration, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Verification

Required commands:

```bash
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
