# Task1257 - Repair Intake Draft-to-Case Injected Route Adapter Contract / No App Mount No Server

Status: local implementation ready for PM review.

## Scope

Task1257 adds a framework-neutral route adapter contract:

- `src/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.js`
- `tests/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseRouteAdapterContractBoundary.static.test.js`

The adapter accepts only an injected Task1255-compatible pre-route handler.

## Boundary

This is a route-like adapter contract only. It does not register a real route, mount an application, start a server, call a database, write cache state, persist audit records, persist idempotency state, send notifications, or expose customer-facing runtime.

The contract does not use web-framework request, response, router, or middleware objects. It only maps a safe route-like input object into the Task1255 pre-route handler input.

## Behavior

`createRepairIntakeDraftToCaseRouteAdapterContract(options)` returns:

- `handleRouteLikeRequest(routeLikeInput)`

Route-like input may contain:

- `sessionContext`
- `body`
- `headers`
- `requestId`
- `source`
- `idempotencyKey`

The adapter maps these fields to:

- `sessionContext`
- `requestBody`
- `requestSource`
- `requestId`
- `idempotencyKey`

It extracts only safe scalar header values needed for request source, request id, and idempotency key. It does not pass raw headers or raw request objects.

Body-provided organization and actor overrides are stripped. The adapter keeps the future auth and permission source outside the request body boundary.

If the injected dependency is missing or throws, the adapter returns a generic safe `{ statusCode, body }` envelope without leaking raw error details.

Pre-route handler output is returned as a detached sanitized value.

## Future Real Route Mount Still Requires PM Approval

Future real route work remains blocked until PM explicitly approves:

- exact external path
- HTTP method
- application integration file
- server integration file
- real auth and session source
- permission resolver source
- audit persistence source
- idempotency store or cache source
- database verification
- smoke scope

## Explicit Non-goals

- No real route registration.
- No application mount.
- No server mount.
- No database access.
- No migration.
- No cache write.
- No audit persistence.
- No idempotency persistence.
- No notification sending.
- No customer-facing runtime rollout.
- No real auth or session runtime.

## Verification

Required by PM:

- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteAdapterContractBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePreRouteHandlerFactory.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePreRouteRuntimeReadinessIntegration.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git diff --cached --name-only`
- `git diff --name-only`
- `git log -1 --oneline`

Expected:

- Targeted tests pass.
- Diff checks pass.
- Staged area remains empty.
- Latest commit remains `2b053c0 Add repair intake draft-to-case pre-route handler factory`.
- Historical dirty tracked files remain unstaged and untouched.
- Task1257 files may remain untracked.
