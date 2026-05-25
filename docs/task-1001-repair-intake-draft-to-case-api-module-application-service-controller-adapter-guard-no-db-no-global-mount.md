# Task1001 Repair Intake Draft-to-Case API Module ApplicationService Controller Adapter Guard

## Scope

Task1001 hardens the applicationService path inside the actual Task967 API module envelope.

Changed files:

- `src/repairIntake/repairIntakeDraftToCaseApiModule.js`
- `tests/repairIntake/repairIntakeDraftToCaseApiModuleApplicationServiceAdapter.unit.test.js`
- `docs/task-1001-repair-intake-draft-to-case-api-module-application-service-controller-adapter-guard-no-db-no-global-mount.md`

## Behavior

The API module still accepts a valid injected controller as verified by Task1000.

Valid injected applicationService shape accepted:

- `planDraftToCase: Function`
- `submitDraftToCase: Function`

When the applicationService shape is valid, the API module builds the existing safe internal controller adapter and returns the Task967-style route envelope.

Invalid injected applicationService shapes rejected before route creation:

- `null`
- non-object applicationService
- object without required fields
- missing `planDraftToCase`
- missing `submitDraftToCase`
- `planDraftToCase` not a function
- `submitDraftToCase` not a function
- valid function mixed with invalid function

Final sanitized applicationService dependency failure reason:

- `REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_APPLICATION_SERVICE_REQUIRED`

Failure envelopes return sanitized metadata only:

```js
{
  ok: false,
  controller: null,
  routes: [],
  registration: null,
  reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_APPLICATION_SERVICE_REQUIRED',
  requiredActions: ['configure_application_service_or_controller']
}
```

## Boundary Confirmation

Task1001 preserves:

- valid injected controller path;
- Task999 actual API module injected mount integration behavior;
- no global route registration;
- no production route registration;
- no DB or provider access.

Task1001 did not modify:

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
- Task989-Task1000 docs

No repository implementation, global app mount, production route registration, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Branch Status

After Task1001, the API module / injected mount adapter branch remains local, uncommitted, unstaged, and bounded to injected runtime composition hardening. Task989-Task1000 local/uncommitted state is preserved.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleApplicationServiceAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleControllerShape.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseActualApiModuleInjectedMount.integration.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterSummaryContract.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
```
