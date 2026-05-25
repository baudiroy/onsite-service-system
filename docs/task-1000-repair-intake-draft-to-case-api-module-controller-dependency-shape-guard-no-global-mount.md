# Task1000 Repair Intake Draft-to-Case API Module Controller Dependency Shape Guard

## Scope

Task1000 hardens the actual Task967 API module envelope controller dependency validation.

Changed files:

- `src/repairIntake/repairIntakeDraftToCaseApiModule.js`
- `tests/repairIntake/repairIntakeDraftToCaseApiModuleControllerShape.unit.test.js`
- `docs/task-1000-repair-intake-draft-to-case-api-module-controller-dependency-shape-guard-no-global-mount.md`

## Behavior

The API module still preserves its public export/signature:

- `createRepairIntakeDraftToCaseApiModule(options)`

Valid injected controller shape accepted:

- `planDraftToCase: Function`
- `submitDraftToCase: Function`

Invalid injected controller shapes rejected:

- `null`
- non-object controller
- object without required fields
- missing `planDraftToCase`
- missing `submitDraftToCase`
- `planDraftToCase` not a function
- `submitDraftToCase` not a function
- valid function mixed with invalid function

Final sanitized controller dependency failure reason:

- `REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_CONTROLLER_REQUIRED`

Missing controller without an injected `applicationService` preserves the existing dependency failure:

- `REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_APPLICATION_SERVICE_REQUIRED`

Failure envelopes return sanitized metadata only:

```js
{
  ok: false,
  controller: null,
  routes: [],
  registration: null,
  reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_CONTROLLER_REQUIRED',
  requiredActions: ['configure_controller']
}
```

## Boundary Confirmation

Task1000 preserves:

- actual API module route envelope behavior for a valid synthetic controller;
- Task999 actual API module injected mount integration behavior;
- no global route registration;
- no production route registration;
- no handler internals exposed by failure metadata.

Task1000 did not modify:

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
- Task989-Task999 docs

No global app mount, production route registration, listen/server startup, DB client, DB query, SQL, migration, psql, `db:migrate`, provider sending, LINE/SMS/App/email/webhook, AI/RAG, DTO/OpenAPI expansion, billing, settlement, payment, invoice, git staging, cleanup, revert, reset, stash, or broad formatting was performed.

## Branch Status

After Task1000, the API module / injected mount adapter branch remains local, uncommitted, unstaged, and bounded to injected runtime composition hardening. Task989-Task999 local/uncommitted state is preserved.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseApiModuleControllerShape.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseActualApiModuleInjectedMount.integration.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterSummaryContract.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterRouteShape.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterMethod.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterDuplicateRoute.unit.test.js
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapterBoundary.static.test.js
git diff --name-only
git diff --cached --name-only
```
