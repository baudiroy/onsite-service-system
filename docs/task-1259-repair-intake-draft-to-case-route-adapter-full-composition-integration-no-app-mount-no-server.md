# Task1259 - Repair Intake Draft-to-Case Route Adapter Full Composition Integration / No App Mount No Server

Status: local implementation ready for PM review.

## Scope

Task1259 adds one integration test:

- `tests/repairIntake/repairIntakeDraftToCaseRouteAdapterFullCompositionIntegration.unit.test.js`

The test composes the current route-adjacent chain from safe route-like input to final safe output:

- Task1257 route adapter contract
- Task1255 pre-route handler factory
- request context resolver
- idempotency policy builder
- audit intent builder
- synthetic handler
- controller adapter
- orchestrator
- authorization gate
- injected consumer application service
- repository consumer
- public result presenter
- HTTP result mapper

## Boundary

This remains framework-neutral only. It is not a real public route and does not mount application or server runtime.

The integration uses plain synthetic input and synthetic dependencies only:

- `permissionResolver.canCreateCaseFromRepairIntakeDraft`
- `repository.createCaseFromDraft`

It does not use web-framework request, response, router, or middleware objects.

It does not connect to a database, run a migration, write cache state, persist audit records, persist idempotency state, send notifications, call external providers, call model or retrieval services, run billing logic, or expose customer-facing runtime.

## Coverage

The test covers:

- allowed success from route-like input with session context, body, and headers
- header-derived idempotency key winning over body value
- 201 safe output with body, audit intents, and idempotency policy
- denied authorization returning 403 and skipping repository execution
- invalid session returning a safe 400 before synthetic handler and repository execution
- repository throw returning a safe 503 without raw error leakage
- body organization, actor, and idempotency override attempts losing to session and header values
- raw headers not being forwarded wholesale
- original route-like input remaining unchanged
- lightweight file boundary marker checks for this task test and doc

## Future Real Route Still Requires PM Approval

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
- No controller integration.
- No database access.
- No migration.
- No cache write.
- No audit persistence.
- No idempotency persistence.
- No notification sending.
- No external provider call.
- No model or retrieval call.
- No billing or settlement runtime.
- No customer-facing runtime rollout.
- No real auth or session runtime.

## Verification

Required by PM:

- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteAdapterFullCompositionIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.unit.test.js`
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
- Latest commit remains `6778218 Add repair intake draft-to-case route adapter contract`.
- Historical dirty tracked files remain unstaged and untouched.
- Task1259 files may remain untracked.
