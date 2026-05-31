# Task2361 Repair Intake Draft-to-Case Admin Route Composition Synthetic Test

## Scope

Task2361 adds focused synthetic test coverage for the existing Repair Intake draft-to-case admin route composition using fake router and fake injected runtime port dependencies only.

No runtime/source behavior changes.

No route path or mount changes.

No package or package-lock changes.

No auth/session middleware implementation changes.

No `requireAuth` or `requirePermission` middleware behavior changes.

No server/listener startup.

No smoke test execution.

No endpoint probes.

No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.

No provider sending.

## Modified Files

- `tests/repairIntake/repairIntakeDraftToCaseAdminRouteCompositionSynthetic.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseAdminRouteCompositionSyntheticBoundary.static.test.js`
- `docs/task-2361-repair-intake-draft-to-case-admin-route-composition-synthetic-test-no-server-no-db-no-smoke-no-provider-no-package.md`

## Synthetic Route Composition Coverage

The synthetic unit test uses a fake router and calls `registerRepairIntakeDraftToCaseAdminRoutes` with fake injected runtime ports.

It verifies:

- the registered route remains `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`
- the route remains admin/injected-only through `registerRepairIntakeDraftToCaseAdminRoutes`
- the `requirePermission / cases.create` gate runs before the submit handler
- mounting the route does not execute runtime ports
- trusted `req.user`, `req.context`, and route params produce compatible downstream request-like input
- auth session context adapter output feeds trusted context normalization through the accepted `buildAdminRequestLike(req)` boundary
- body, `requestBody`, `draftInput`, query, header, and client fields cannot override trusted organization, actor, draft, request, or idempotency context
- missing trusted organization context fails closed without case creation or audit write
- request abuse guard rejects an unsafe deep request before downstream controller ports
- request/body objects are not mutated
- raw auth/session/token/body/client/provider/debug/env fields do not leak into downstream trusted context or response

## Static Guard Coverage

The static boundary guard asserts:

- the new synthetic test and this doc exist
- the synthetic test imports only `node:assert/strict`, `node:test`, and the route module under test
- the synthetic test uses a fake router instead of server/listener/endpoint/smoke behavior
- no DB/env/Zeabur/secrets usage is introduced
- no provider sending is introduced
- no package dependency expansion is introduced
- route path and mount markers remain unchanged
- no public/open/customer route expansion is introduced
- request abuse guard remains downstream before controller invocation

## Future Work Not Authorized

Task2361 does not authorize:

- runtime/source behavior changes
- route path or mount changes
- package or package-lock changes
- auth/session middleware implementation changes
- `requireAuth` or `requirePermission` middleware behavior changes
- permission model changes, role expansion, or organization isolation source changes
- controller creation under `src/controllers/`
- public/open/customer route expansion
- changes under `src/openRepairIntake/` or `tests/openRepairIntake/`
- DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply
- `DATABASE_URL`, Zeabur, env, or secrets inspection
- repository, idempotency, case creator, draft reader, runtime factory, application service, or audit persistence behavior changes
- server/listener startup, smoke tests, endpoint probes, shared runtime, deploy, staging/prod traffic, or `/healthz`
- provider sending
- AI/RAG/OpenAI/vector DB runtime behavior
- admin frontend work
- billing, settlement, payment, or invoice behavior
- Customer Access or Engineer Mobile runtime behavior changes
- cleanup, staging, deletion, stash, reset, or revert of held historical docs

## Held Docs

The same 7 held historical untracked docs remain outside Task2361 scope and must stay untouched unless PM explicitly authorizes that exact action.
