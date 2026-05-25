# Task989 Repair Intake Draft-to-Case HTTP Mount Adapter

## Scope

Task989 adds a bounded injected HTTP mount adapter:

- `src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js`
- `tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.unit.test.js`

The adapter mounts only routes from an injected Task967-style API module envelope onto an explicitly injected app/router-like target. It does not create a default app, router, API module, controller, application service, DB client, repository-backed writer, provider runtime, AI runtime, admin surface, billing runtime, smoke runtime, OpenAPI/DTO surface, migration, package runtime, global app/server bootstrap, or global route index registration.

## Behavior

`mountRepairIntakeDraftToCaseApiModule({ mountTarget, apiModule, basePath = '' })` accepts:

```js
{
  mountTarget: object,
  apiModule: {
    ok: boolean,
    routes: array,
    registration: object | null,
    reasonCode: string,
    requiredActions: string[]
  },
  basePath: string
}
```

Supported mount target shapes:

- `mountTarget.post(path, handler)`
- `mountTarget[method.toLowerCase()](path, handler)`
- `mountTarget.register(method, path, handler)`

The adapter validates the injected mount target, API module envelope, route method/path/handler, and optional safe `basePath` before mounting. Route handlers are passed through but never executed during mount.

The returned summary contains only safe metadata:

```js
{
  ok: boolean,
  mounted: number,
  routes: [
    { method: 'POST', path: '/repair-intake/drafts/:draftId/case/plan' },
    { method: 'POST', path: '/repair-intake/drafts/:draftId/case/submit' }
  ],
  reasonCode: string,
  requiredActions: string[]
}
```

Handlers, request bodies, customer payloads, SQL text, stack traces, provider payloads, tokens, secrets, LINE tokens, and `finalAppointmentId` are excluded from the summary.

## Boundary Confirmation

Task989 did not modify:

- `src/app.js`
- `src/server.js`
- `src/routes/index.js`
- `src/routes/public.routes.js`
- app/server bootstrap
- global route indexes
- existing public API route files
- DTO/OpenAPI docs
- DB migrations/schema/SQL/seed
- fixtures
- package files
- smoke/shared runtime scripts
- `admin/src/**`
- provider integrations
- LINE/SMS/App/email/webhook
- AI/RAG/vector/provider runtime
- billing/settlement/payment/invoice
- Task902
- already committed Repair Intake / Engineer Mobile / Data Correction / Customer Access paths

Git staging was intentionally not performed.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.unit.test.js docs/task-989-repair-intake-draft-to-case-http-mount-adapter-injected-api-module-no-global-bootstrap-no-openapi.md
git diff --check -- src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.unit.test.js docs/task-989-repair-intake-draft-to-case-http-mount-adapter-injected-api-module-no-global-bootstrap-no-openapi.md
git status --short -- src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js tests/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.unit.test.js docs/task-989-repair-intake-draft-to-case-http-mount-adapter-injected-api-module-no-global-bootstrap-no-openapi.md
git diff --cached --name-only
```
