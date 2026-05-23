# Task960 Repair Intake Draft-to-Case Route Factory

## Scope

Task960 adds a bounded framework-neutral route factory:

- `src/repairIntake/repairIntakeDraftCaseRouteFactory.js`
- `tests/repairIntake/repairIntakeDraftCaseRouteFactory.unit.test.js`

This prepares route definitions but does not mount/register them, modify app/server bootstrap, update public route indexes, change DTO/OpenAPI docs, start a server, run smoke tests, send providers, or execute DB directly.

## Behavior

`createRepairIntakeDraftCaseRoutes({ controller })` requires an injected controller and returns route definitions only:

```js
[
  {
    method: 'POST',
    path: '/repair-intake/drafts/:draftId/case/plan',
    handler: async (requestLike) => controller.planDraftToCase(requestLike)
  },
  {
    method: 'POST',
    path: '/repair-intake/drafts/:draftId/case/submit',
    handler: async (requestLike) => controller.submitDraftToCase(requestLike)
  }
]
```

The factory does not create a default controller or default application service. Handlers pass the request-like object through to the injected controller without mutation or added data.

If a controller method is missing, the handler returns a generic safe `500` envelope. If a controller method throws, the handler returns a generic safe `500` envelope without raw error leakage.

The response envelope shape remains the Task959 controller adapter shape:

```js
{
  ok: boolean,
  statusCode: number,
  body: object
}
```

## Out of Scope

- App/server bootstrap
- Global route registration
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
- Default controller/application service
- Sensitive data/token/secret/full phone/address/raw payload
- `finalAppointmentId`
- Task902
- Engineer Mobile Task921-Task933

Accepted Task921-Task959 files remain local / uncommitted / untracked and must not be cleaned, reverted, relocated, or restaged by this task.

## Amendment Note

The full repairIntake suite was initially blocked by the Task948 static inventory regex because the Task960 source filename matches `repairIntakeDraftCase*.js`. The Task960 source filename remains unchanged.

The Task948 static inventory was amended only to distinguish no-DB submission modules from later repository/audit/store/runtime-composition/application-service/controller/route-factory modules. No production behavior changed, and no route registration, app bootstrap, or OpenAPI change was introduced.

## Verification

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseRouteFactory.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftCaseRouteFactory.js tests/repairIntake/repairIntakeDraftCaseRouteFactory.unit.test.js docs/task-960-repair-intake-draft-to-case-route-factory-injected-controller-no-app-bootstrap-no-openapi.md
git diff --check -- src/repairIntake/repairIntakeDraftCaseRouteFactory.js tests/repairIntake/repairIntakeDraftCaseRouteFactory.unit.test.js docs/task-960-repair-intake-draft-to-case-route-factory-injected-controller-no-app-bootstrap-no-openapi.md
git status --short
```
