# Task1263 - Repair Intake Draft-to-Case Route Handler Factory / Injected Route Adapter / No App Mount

Status: local implementation ready for PM review.

## Scope

Task1263 adds a small framework-neutral route handler factory:

- `src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js`
- `tests/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseRouteHandlerFactoryBoundary.static.test.js`

The factory consumes an injected Task1257 route adapter contract and returns a callable handler shape for a future router.

## Boundary

This is a route handler factory only. It is framework-neutral and does not register a real route.

It does not import or use Express/Fastify/Koa request/response objects, routers, middleware, route registration, server startup, database access, cache writes, audit persistence, idempotency persistence, notification sending, external integrations, model or retrieval calls, financial runtime, or customer-visible runtime.

## Behavior

`createRepairIntakeDraftToCaseRouteHandler(options)` returns:

- `handle(input)`

The future-router-shaped input remains a plain object:

- `sessionContext`
- `params`
- `body`
- `headers`
- `requestId`
- `source`

The handler:

1. Requires an injected `routeAdapter` with `handleRouteLikeRequest`, or a compatible function.
2. Extracts `params.repairIntakeDraftId`.
3. Returns a safe 400 invalid request envelope when the path draft id is missing.
4. Builds a Task1257-compatible route-like input.
5. Forwards only safe scalar headers used by the downstream adapter contract.
6. Maps body into route-like `body` with path-derived `repairIntakeDraftId`.
7. Does not trust body `organizationId`, `actorId`, or `idempotencyKey`.
8. Does not pass raw framework request objects.
9. Returns a detached sanitized adapter output.
10. Returns a generic safe failure envelope when dependency is missing or throws.

## Path / Body Draft ID Conflict Policy

Path repairIntakeDraftId wins over body repairIntakeDraftId.

If the body contains a conflicting draft id, the handler ignores it and forwards the path-derived value. This keeps the future route boundary aligned with the Task1261 decision that `repairIntakeDraftId` comes from the path.

## Future Real Route Mount Still Requires PM Approval

future real route mount still requires explicit PM approval for:

- actual route file
- application registration file
- server registration file
- auth/session middleware or source
- permission resolver source
- audit persistence source
- idempotency store or cache source
- DB-backed verification
- smoke scope

## Explicit Non-goals

- No real route registration.
- No application mount.
- No server mount.
- No controller integration.
- No database connection.
- No migration.
- No cache write.
- No audit persistence.
- No idempotency persistence.
- No notification sending.
- No external integration call.
- No model or retrieval call.
- No financial runtime.
- No customer-visible runtime rollout.
- No real auth parser.
- No JWT verifier.

## Verification

Required by PM:

- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteHandlerFactoryBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteAdapterFullCompositionIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git diff --cached --name-only`
- `git diff --name-only`
- `git log -1 --oneline`

Expected:

- Targeted tests pass.
- Diff checks pass.
- Staged area remains empty.
- Latest commit remains `6d865e0 Document repair intake draft-to-case route path decision`.
- Historical dirty tracked files remain unstaged and untouched.
- Task1263 files may remain untracked.
