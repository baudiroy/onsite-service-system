# Task959 Repair Intake Draft-to-Case Controller Adapter

## Scope

Task959 adds a bounded production controller-style adapter:

- `src/repairIntake/repairIntakeDraftCaseControllerAdapter.js`
- `tests/repairIntake/repairIntakeDraftCaseControllerAdapter.unit.test.js`

This prepares API wiring but does not register routes, modify router/app/server bootstrap, change DTO/OpenAPI docs, start a server, run smoke tests, send providers, execute DB directly, or create a default application service.

## Behavior

`createRepairIntakeDraftCaseControllerAdapter({ applicationService })` requires an injected application service and exposes framework-neutral handler-like methods:

- `planDraftToCase(requestLike)`
- `submitDraftToCase(requestLike)`

The request-like input may include:

- `params`
- `body`
- `headers`
- `context`

Only sanitized command fields are extracted:

- `draftId`
- `organizationId`
- `actorId`
- `requestId`
- `idempotencyKey`
- `approvalContext`
- `permissionContext`

Accepted safe locations:

- `params.draftId`
- `body.organizationId`
- `body.idempotencyKey`
- `body.approvalContext`
- `body.permissionContext`
- `context.organizationId`
- `context.actorId`
- `context.requestId`

Precedence is deterministic: `draftId` comes from `params`, `organizationId` prefers `context.organizationId` over `body.organizationId`, actor and request context come from `context`, and idempotency / approval / permission inputs come from `body`.

Unsafe body, header, or context fields are ignored. The adapter calls only the injected application service methods with sanitized input.

## Response Envelope

The adapter returns an internal controller envelope:

```js
{
  ok: boolean,
  statusCode: number,
  body: object
}
```

Successful plan or submit results map to `200`. Blocked submit/plan results map to a safe non-2xx status. Missing/invalid service methods and unexpected service throws map to `500` with generic safe bodies.

The returned body preserves only safe internal service envelope fields and strips raw phone, full address, raw customer payload, provider payload, SQL text, raw DB rows, stack traces, token, secret, LINE token, and `finalAppointmentId`.

## Out of Scope

- Route registration
- Public API shape / DTO / OpenAPI
- App/server/bootstrap
- DB execution / psql / SQL dry-run / `npm run db:migrate`
- Migration creation/apply
- Smoke/shared runtime
- Provider sending / LINE / SMS / App / email / webhook
- AI/RAG/vector/provider runtime
- Admin frontend
- Billing/settlement/payment/invoice
- Default global runtime registration
- Default application service
- Sensitive data/token/secret/full phone/address/raw payload
- `finalAppointmentId`
- Task902
- Engineer Mobile Task921-Task933

Accepted Task921-Task958 files remain local / uncommitted / untracked and must not be cleaned, reverted, relocated, or restaged by this task.

## Verification

Task959 amendment note:

- The full repairIntake suite was initially blocked by the Task948 static inventory regex because `repairIntakeDraftCaseControllerAdapter.js` matches the broad `repairIntakeDraftCase*.js` pattern.
- The Task959 source filename remains unchanged.
- The Task948 static inventory was amended only to distinguish Task934-Task945 no-DB submission modules from later repository/audit/store/runtime-composition/application-service/controller-adapter modules.
- No production behavior changed.
- No route registration or OpenAPI change was introduced.

Required commands:

```bash
node --test tests/repairIntake/repairIntakeDraftCaseControllerAdapter.unit.test.js
node --test tests/repairIntake/*.js
npm run check
git diff -- src/repairIntake/repairIntakeDraftCaseControllerAdapter.js tests/repairIntake/repairIntakeDraftCaseControllerAdapter.unit.test.js docs/task-959-repair-intake-draft-to-case-controller-adapter-injected-application-service-no-route-registration-no-openapi.md
git diff --check -- src/repairIntake/repairIntakeDraftCaseControllerAdapter.js tests/repairIntake/repairIntakeDraftCaseControllerAdapter.unit.test.js docs/task-959-repair-intake-draft-to-case-controller-adapter-injected-application-service-no-route-registration-no-openapi.md
git status --short
```
