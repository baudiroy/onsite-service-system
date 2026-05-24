# Task1255 — Repair Intake Draft-to-Case Pre-Route Handler Factory / Injected Components Only / No Route No DB

Status: local implementation ready for PM review.

## Scope

Task1255 adds a framework-neutral pre-route handler factory:

- `src/repairIntake/repairIntakeDraftToCasePreRouteHandlerFactory.js`
- `tests/repairIntake/repairIntakeDraftToCasePreRouteHandlerFactory.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCasePreRouteHandlerFactoryBoundary.static.test.js`

The factory composes injected components only:

- request context resolver
- idempotency policy builder
- audit intent builder
- synthetic handler
- HTTP result mapper

## Boundary

This is a pre-route handler factory only. It does not register a route, import a framework, mount app/server runtime, access DB/cache, persist audit records, persist idempotency state, or send provider/customer-visible runtime effects.

Audit and idempotency outputs are returned as safe intents/policies only.

## Behavior

`createRepairIntakeDraftToCasePreRouteHandler(options)` returns:

- `handleDraftToCasePreRoute(input)`

The input remains synthetic and framework-neutral:

- `sessionContext`
- `requestBody`
- `requestSource`
- `requestId`
- `idempotencyKey`

The handler:

1. Resolves safe context first.
2. Returns a safe HTTP envelope if context is invalid.
3. Builds idempotency policy only from safe resolved context.
4. Builds an attempt audit intent before synthetic handler execution.
5. Runs the synthetic handler only after valid context.
6. Maps the public result to `{ statusCode, body }`.
7. Builds submitted, denied, or failed final audit intent from the safe result.
8. Returns `{ statusCode, body, auditIntents, idempotencyPolicy }`.

## Future Route Work Still Requires Approval

Future real route work remains blocked until PM explicitly approves:

- route path
- HTTP method
- auth/session context source
- permission resolver source
- audit persistence
- idempotency store/cache
- DB verification
- smoke scope

## Explicit Non-goals

- No route/controller/app/server registration.
- No database access.
- No cache access or writes.
- No audit persistence.
- No idempotency persistence.
- No provider sending.
- No AI/RAG.
- No billing/settlement.
- No customer-visible runtime.
- No auth/session/JWT runtime.

## Verification

Required by PM:

- `node --test tests/repairIntake/repairIntakeDraftToCasePreRouteHandlerFactory.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePreRouteHandlerFactoryBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePreRouteRuntimeReadinessIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseFullSyntheticHttpEnvelopeIntegration.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git diff --cached --name-only`
- `git diff --name-only`
- `git log -1 --oneline`

Expected:

- Targeted tests pass.
- Diff checks pass.
- Staged area remains empty.
- Latest commit remains `4ee3d0e Document repair intake draft-to-case pre-route readiness closure`.
- Historical dirty tracked files remain unstaged and untouched.
- Task1255 files may remain untracked.
