# Task967 Repair Intake Draft-to-Case API Module Factory

## Scope

Task967 adds a bounded injectable API module factory:

- `src/repairIntake/repairIntakeDraftToCaseApiModule.js`
- `tests/repairIntake/repairIntakeDraftToCaseApiModule.unit.test.js`

The module composes the accepted Task959 controller adapter, Task960 route factory, and Task961 injected-router registrar. It does not mount routes globally, modify app/server bootstrap, update global route indexes, change existing public API route files, publish DTO/OpenAPI docs, execute DB, run migrations, touch smoke runtime, send providers, or stage/commit files.

## Behavior

`createRepairIntakeDraftToCaseApiModule({ applicationService, controller, routes, router, basePath = '' })` builds an injectable module envelope:

```js
{
  ok: boolean,
  controller: object | null,
  routes: array,
  registration: object | null,
  reasonCode: string,
  requiredActions: string[]
}
```

If `controller` is not provided, the module requires an injected `applicationService` and creates a controller with the Task959 adapter.

If `routes` is not provided, the module creates Task960-style route definitions from the controller.

If `router` is provided, the module registers routes through the Task961 registrar. If `router` is not provided, the module returns route definitions without registration.

`basePath` is allowed only when registering onto an injected router.

The module does not create a default application service, default router, DB client, repository, runtime dependency factory, application service factory, provider, AI runtime, admin surface, billing runtime, smoke runtime, app/server bootstrap, global route index, DTO/OpenAPI surface, migration, or package runtime.

## Out of Scope

- Git staging / commit / reset / clean / restore / restage
- Global app/server bootstrap
- Global route registration/index files
- Existing public API route files
- Public API DTO/OpenAPI
- DB execution / psql / SQL dry-run / `npm run db:migrate`
- Migration creation/apply
- Smoke/shared runtime
- Provider sending / LINE / SMS / App / email / webhook
- AI/RAG/vector/provider runtime
- Admin frontend
- Billing/settlement/payment/invoice
- Default global runtime registration
- Default application service/router
- Sensitive data/token/secret/full phone/address/raw payload
- `finalAppointmentId`
- Task902
- Engineer Mobile Task921-Task933

Accepted Task921-Task966 files remain local / uncommitted / untracked and must not be cleaned, reverted, relocated, restaged, or otherwise manipulated by this task.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseApiModule.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftToCaseApiModule.js tests/repairIntake/repairIntakeDraftToCaseApiModule.unit.test.js docs/task-967-repair-intake-draft-to-case-api-module-factory-injected-runtime-composition-no-global-app-bootstrap-no-openapi.md
git diff --check -- src/repairIntake/repairIntakeDraftToCaseApiModule.js tests/repairIntake/repairIntakeDraftToCaseApiModule.unit.test.js docs/task-967-repair-intake-draft-to-case-api-module-factory-injected-runtime-composition-no-global-app-bootstrap-no-openapi.md
git status --short
git status --short -- src/repairIntake/repairIntakeDraftToCaseApiModule.js tests/repairIntake/repairIntakeDraftToCaseApiModule.unit.test.js docs/task-967-repair-intake-draft-to-case-api-module-factory-injected-runtime-composition-no-global-app-bootstrap-no-openapi.md
```
