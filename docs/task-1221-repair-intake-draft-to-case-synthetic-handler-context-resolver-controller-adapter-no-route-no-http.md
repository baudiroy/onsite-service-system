# Task1221 - Repair Intake Draft-To-Case Synthetic Handler Contract / Context Resolver + Controller Adapter / No Route No HTTP

## Purpose

Task1221 adds a pure synthetic handler contract that composes the Task1220 request context resolver with the Task1217 controller adapter. This proves the future handler flow can resolve safe context from already-injected session/body/source and then pass only sanitized fields into the controller adapter.

This is not a route, controller, API, or customer-visible rollout.

## Added Files

- `src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js`
- `tests/repairIntake/repairIntakeDraftToCaseSyntheticHandler.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseSyntheticHandlerBoundary.static.test.js`

## Dependency Chain

- Task1208 repository contract output boundary.
- Task1211 repository consumer.
- Task1212 application service.
- Task1213 authorization gate.
- Task1214 orchestrator.
- Task1215 synthetic integration.
- Task1216 presenter.
- Task1217 controller adapter contract.
- Task1218 full synthetic adapter integration.
- Task1219 checkpoint.
- Task1220 request context resolver.
- Task1221 synthetic handler.

## Explicit Order

1. Resolve context first from injected synthetic input.
2. If context resolution fails, return a safe invalid/failure envelope and do not call the controller adapter.
3. If context resolution succeeds, pass only sanitized resolved fields into the controller adapter.
4. Return sanitized adapter output.

## Handler Contract

The handler factory accepts explicitly injected dependencies:

```js
createRepairIntakeDraftToCaseSyntheticHandler({
  requestContextResolver,
  controllerAdapter,
})
```

The handler accepts only a synthetic object:

```js
{
  sessionContext,
  requestBody,
  requestSource,
}
```

## Current Boundary

- No route registration.
- No HTTP framework request/response object.
- No app/server mount.
- No real auth/session/JWT.
- No DB.
- No migration.
- No provider sending.
- No Admin.
- No AI/RAG.
- No billing/settlement.
- No customer-visible runtime rollout.

## Behavior Locked By Tests

- Valid input calls resolver first, then controller adapter.
- Controller adapter is called only after safe context resolution.
- Invalid resolver output does not call the controller adapter.
- Resolver or adapter exceptions return generic safe failure envelopes.
- Missing resolver or adapter dependency returns safe invalid dependency.
- The handler does not mutate handler input, resolver result, or adapter result.
- Unsafe session/body/provider/audit/raw error/query/PII fields are not forwarded.

## Future Continuation

- A full synthetic handler integration may be added next.
- Real route/controller/API exposure remains blocked until separate PM approval.

## Worktree Boundary

Task1221 files may remain untracked/unstaged unless PM separately asks to stage or commit. Task1210 staged 13-path set must remain unchanged, and unrelated dirty tracked files must not be touched.
