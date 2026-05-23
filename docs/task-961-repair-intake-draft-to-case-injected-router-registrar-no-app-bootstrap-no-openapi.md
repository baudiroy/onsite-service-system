# Task961 Repair Intake Draft-to-Case Injected Router Registrar

## Scope

Task961 adds a bounded injected-router registrar:

- `src/repairIntake/repairIntakeDraftToCaseRouteRegistrar.js`
- `tests/repairIntake/repairIntakeDraftToCaseRouteRegistrar.unit.test.js`

The registrar can register explicit Task960-style route definitions onto an explicitly injected router-like object. It does not import or create the Task960 route factory, controller, application service, runtime dependency factory, DB client, repository, provider, AI runtime, admin frontend, billing runtime, smoke runtime, app/server bootstrap, global route index, or OpenAPI/DTO surface.

## Behavior

`registerRepairIntakeDraftToCaseRoutes({ router, routes, basePath = '' })` requires an injected router and explicit route definitions. It validates every route before registration, then calls the router method matching each route method.

The registrar preserves the provided route handler references and does not execute route handlers during registration. It returns only sanitized method/path registration metadata:

```js
{
  ok: true,
  registered: 2,
  routes: [
    { method: 'POST', path: '/repair-intake/drafts/:draftId/case/plan' },
    { method: 'POST', path: '/repair-intake/drafts/:draftId/case/submit' }
  ],
  reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTES_REGISTERED',
  requiredActions: []
}
```

An optional safe `basePath` can prefix registered paths. Unsafe base paths, invalid route definitions, missing router methods, and router registration errors return generic safe failure summaries without raw error leakage.

## Out of Scope

- App/server bootstrap
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
- Default controller/application service/router
- Sensitive data/token/secret/full phone/address/raw payload
- `finalAppointmentId`
- Task902
- Engineer Mobile Task921-Task933

Accepted Task921-Task960 files remain local / uncommitted / untracked and must not be cleaned, reverted, relocated, or restaged by this task.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftToCaseRouteRegistrar.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftToCaseRouteRegistrar.js tests/repairIntake/repairIntakeDraftToCaseRouteRegistrar.unit.test.js docs/task-961-repair-intake-draft-to-case-injected-router-registrar-no-app-bootstrap-no-openapi.md
git diff --check -- src/repairIntake/repairIntakeDraftToCaseRouteRegistrar.js tests/repairIntake/repairIntakeDraftToCaseRouteRegistrar.unit.test.js docs/task-961-repair-intake-draft-to-case-injected-router-registrar-no-app-bootstrap-no-openapi.md
git status --short
```
