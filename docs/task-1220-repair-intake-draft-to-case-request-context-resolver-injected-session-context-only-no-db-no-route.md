# Task1220 - Repair Intake Draft-To-Case Request Context Resolver / Injected Session Context Only / No DB No Route

## Purpose

Task1220 adds a pure request-context resolver for future Repair Intake draft-to-Case route/controller usage. It resolves safe internal context from an already-injected synthetic session context and request body.

This task does not implement real auth/session/JWT runtime, does not parse tokens, does not verify JWTs, does not mount a route, and does not expose a customer-visible API.

## Added Files

- `src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js`
- `tests/repairIntake/repairIntakeDraftToCaseRequestContextResolver.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseRequestContextResolverBoundary.static.test.js`

## Resolver Contract

The resolver accepts a synthetic object:

```js
{
  sessionContext,
  requestBody,
  requestSource,
}
```

It returns a safe internal context envelope:

```js
{
  ok,
  status,
  messageKey,
  organizationId,
  actorId,
  repairIntakeDraftId,
  source,
  actorRole,
  draftInput,
}
```

## Rules Locked By Task1220

- `sessionContext.organizationId` is required.
- `sessionContext.actorId` is required.
- `requestBody.repairIntakeDraftId` is required.
- `sessionContext.actorRole` is only a safe scalar passthrough.
- `requestSource` is only a safe scalar passthrough.
- `requestBody.draftInput` is allowed only when it is a plain object.
- Body-provided `organizationId` does not override session organization.
- Body-provided `actorId` does not override session actor.
- Unsafe body, session, provider, audit, raw error, SQL, query, phone, address, email, database row, and permission trace fields are stripped.
- The resolver does not mutate `sessionContext`, `requestBody`, or returned `draftInput`.

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

## Non-Goals

- No real auth/session/JWT runtime.
- No token parsing.
- No JWT verification.
- No DB execution.
- No migration.
- No repository creation.
- No route registration.
- No controller folder integration.
- No app/server mount.
- No Express/Fastify/Koa request/response object.
- No provider sending.
- No Admin runtime.
- No AI/RAG runtime.
- No billing or settlement runtime.
- No customer-visible runtime rollout.

## Future Continuation

- Task1221 may compose the request context resolver with the controller adapter in a synthetic handler contract.
- Real HTTP route/controller mount remains blocked until separate PM approval.

## Worktree Boundary

Task1220 files may remain untracked/unstaged unless PM separately asks to stage or commit. Task1210 staged 13-path set must remain unchanged, and unrelated dirty tracked files must not be touched.
