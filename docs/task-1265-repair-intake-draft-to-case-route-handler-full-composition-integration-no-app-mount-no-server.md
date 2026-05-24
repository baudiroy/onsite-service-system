# Task1265 - Repair Intake Draft-to-Case Route Handler Full Composition Integration / No App Mount No Server

Status: local implementation ready for PM review.

## Scope

Task1265 adds one integration test:

- `tests/repairIntake/repairIntakeDraftToCaseRouteHandlerFullCompositionIntegration.unit.test.js`

The test composes the current route-handler chain from future-router-shaped input to final safe output:

- Task1263 route handler factory
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

The integration uses plain synthetic dependencies only:

- `permissionResolver.canCreateCaseFromRepairIntakeDraft`
- `repository.createCaseFromDraft`

Path params are exercised through the route handler factory. The Task1261 decision reference is:

`POST /internal/repair-intake/drafts/:repairIntakeDraftId/submit-to-case`

Path `repairIntakeDraftId` wins over any body value.

The test does not use web-framework request, response, router, or middleware objects.

It does not connect to a database, run a migration, write cache state, persist audit records, persist idempotency state, send notifications, call external integrations, call model or retrieval services, run financial logic, or expose customer-facing runtime.

## Coverage

The test covers:

- allowed success from future-router-shaped input with path params, session context, body, and headers
- path-derived `repairIntakeDraftId` flowing into adapter, pre-route handler, idempotency policy, audit intents, permission check, and repository call
- header-derived idempotency key winning over body value
- 201 safe output with body, audit intents, and idempotency policy
- path/body draft conflict with path value winning throughout downstream calls
- denied authorization returning 403 and skipping repository execution
- missing path draft id returning a safe 400 before adapter, synthetic handler, and repository execution
- repository throw returning a safe 503 without raw error leakage
- body organization, actor, and idempotency override attempts losing to session, header, and path values
- fake framework object fields and unsafe raw data not being forwarded or leaked
- original future-router-shaped input remaining unchanged
- lightweight file boundary marker checks for this task test and doc

## Future Real Route Still Requires PM Approval

Future real route work remains blocked until PM explicitly approves:

- exact application mount file
- exact server mount file
- auth/session source
- permission resolver source
- audit persistence source
- idempotency store or cache source
- database-backed verification
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
- No external integration call.
- No model or retrieval call.
- No financial runtime.
- No customer-facing runtime rollout.
- No real auth parser.
- No JWT verifier.

## Verification

Required by PM:

- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteHandlerFullCompositionIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRouteAdapterFullCompositionIntegration.unit.test.js`
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
- Latest commit remains `7b290e8 Add repair intake draft-to-case route handler factory`.
- Historical dirty tracked files remain unstaged and untouched.
- Task1265 files may remain untracked.
