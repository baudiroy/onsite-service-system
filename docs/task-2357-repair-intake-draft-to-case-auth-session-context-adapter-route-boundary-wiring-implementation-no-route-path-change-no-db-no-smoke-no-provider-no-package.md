# Task2357 Repair Intake Draft-to-Case Auth Session Context Adapter Route Boundary Wiring Implementation

## Scope

Task2357 wires the existing pure auth/session context adapter at the selected Repair Intake draft-to-case route request-like construction boundary.

No route path or mount changed.

No package or package-lock changes were made.

No auth/session middleware implementation changed.

No `requireAuth` or `requirePermission` middleware behavior changed.

No DB, migration, smoke, provider, env, Zeabur, secrets, endpoint, server/listener, deploy, or shared runtime work was performed.

Source behavior changed only through route-local auth session context adapter wiring inside `buildAdminRequestLike(req)`.

## Modified Files

- `src/routes/repairIntakeDraftToCase.routes.js`
- `tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapterRouteWiring.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapterRouteWiringBoundary.static.test.js`
- `docs/task-2357-repair-intake-draft-to-case-auth-session-context-adapter-route-boundary-wiring-implementation-no-route-path-change-no-db-no-smoke-no-provider-no-package.md`

## Exact Route Request-Like Boundary Changed

The route now imports `buildRepairIntakeDraftToCaseAuthSessionContext` from:

`src/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter.js`

The helper is invoked inside `buildAdminRequestLike(req)` after:

- `req.user`, `req.body`, `req.context`, and `req.params` are normalized into safe local containers
- `bodyWithoutServerOwnedContext(body)` strips body/client-owned context fields
- the route-owned admin permission context is created

The auth adapter receives only server-owned route/session metadata:

- trusted `user`
- trusted `context`
- trusted `sessionContext`
- route-owned permission context
- trusted request id
- trusted idempotency key

It does not receive raw body, `requestBody`, `draftInput`, query, header, cookie, client payloads, provider/debug/env containers, DB/secrets/package/runtime payloads, or `requireOrganizationAccess` body/query-style organization sources.

## Final Auth Session Adapter Route Wiring Behavior

The route now runs the auth session adapter before `normalizeRepairIntakeDraftToCaseTrustedContext(input)`.

On adapter success:

- adapter `sessionContext` becomes the trusted normalizer `context`
- adapter `sessionContext` becomes the trusted normalizer `sessionContext`
- route-owned permission context remains the fallback permission marker
- request id and idempotency key remain trusted route/context values
- request-like output shape remains compatible with existing route/API/controller tests

On adapter failure:

- the route passes an empty safe context to the trusted context normalizer
- trusted context normalization fails closed
- the route still returns a compatible request-like shape with stripped unsafe body/client fields
- raw auth/session, token, provider, body/query/header/client/env/debug details are not exposed

## Tests

The unit tests prove:

- normal `req.user` / `req.context` input remains compatible
- auth session adapter output flows through the route request-like boundary before trusted context normalization
- trusted source precedence is preserved
- body, `requestBody`, `draftInput`, query, header, and client fields cannot override trusted organization, actor, or session context
- missing organization id or actor identity fails closed through the current compatible request-like convention
- output request-like shape remains compatible
- input request/body objects are not mutated

The static guard proves:

- route imports and invokes the auth session adapter only at `buildAdminRequestLike(req)`
- auth adapter runs before `normalizeRepairIntakeDraftToCaseTrustedContext(input)`
- body/server-owned context stripping remains before adapter/normalizer handoff
- route path, mount, `requirePermission / cases.create`, and admin/injected-only markers remain unchanged
- request abuse guard remains downstream in the API module before controller invocation
- middleware/API/controller/application modules are not wired to the auth adapter
- no public/open/customer route expansion, package/middleware expansion, DB/smoke/provider/env coupling, or middleware behavior change was introduced

## Future Work Not Authorized

Task2357 does not authorize:

- route path or mount changes
- package or package-lock changes
- auth/session middleware implementation changes
- `requireAuth` or `requirePermission` middleware behavior changes
- permission model changes, role expansion, or organization isolation source changes beyond this accepted route-local adapter handoff
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

## Recommended Next Bounded Task

Recommended next task, not authorized by Task2357:

Task2358 - Repair Intake Draft-to-Case Auth Session Context Adapter Route Boundary Wiring Checkpoint / No Runtime Change No DB No Smoke No Provider No Package

Why this is the safest next task:

- it can checkpoint the final route-local adapter handoff before any broader production auth/session work
- it can verify route path, middleware, package, DB, smoke, provider, and public/open/customer boundaries remain closed

PM must still authorize one exact task at a time.

## Held Docs

The same 7 held historical untracked docs remain outside Task2357 scope and must stay untouched unless PM explicitly authorizes that exact action.
