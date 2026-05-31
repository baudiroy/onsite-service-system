# Task2354 Repair Intake Draft-to-Case Production Auth Session Implementation Authorization Packet

## Scope

Task2354 is a docs/static-only authorization packet for a future Repair Intake draft-to-case production auth/session integration task.

No runtime, source behavior, route path, route mount, helper wiring, permission model, auth/session middleware implementation, package, package-lock, DB, migration, smoke, endpoint, server/listener, provider, env, Zeabur, secrets, repository, idempotency, case creator, draft reader, runtime factory, application service, audit persistence, Customer Access, Engineer Mobile, admin frontend, billing, or AI/RAG behavior changed.

## Production Auth Session Implementation Inventory

Current Repair Intake draft-to-case route:

- route file: `src/routes/repairIntakeDraftToCase.routes.js`
- route path: `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`
- route remains admin/injected-only
- route composition remains `createRepairIntakeDraftToCaseInjectedRouteComposition`
- route registration remains `registerRepairIntakeDraftToCaseAdminRoutes`
- permission gate remains `requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)`
- permission value remains `cases.create`
- trusted context normalizer remains wired at `buildAdminRequestLike(req)`
- request abuse guard remains in `src/repairIntake/repairIntakeDraftToCaseApiModule.js` before controller invocation

Existing auth/session middleware candidates:

- `src/middlewares/requireAuth.js`
  - extracts Bearer token from `Authorization`
  - calls `AuthService.getCurrentUserFromToken(token)`
  - assigns `req.user`
- `src/middlewares/requirePermission.js`
  - wraps `requireAuth`
  - checks `req.user.permissions` for the requested permission key
  - currently used by the Repair Intake draft-to-case admin route
- `src/middlewares/requireOrganizationAccess.js`
  - reads organization id from `req.params`, `req.body`, or `req.query`
  - not suitable as the trusted context source for this route because body/query/client fields must not become trusted context
- `src/middlewares/requestId.js`
  - sets `req.requestId` from `X-Request-Id` or a generated id
- `src/auth/EngineerMobileWorkbenchAuthSessionBoundary.js`
  - is an Engineer Mobile not-implemented auth/session skeleton and is not a Repair Intake production auth/session candidate

Existing auth route usage:

- `src/routes/auth.routes.js` uses `requireAuth` for `/me` and `/logout`
- login/token issuance remains outside this packet

Current source of context fields:

- `req.user` comes from existing route injection or from `requireAuth` through `requirePermission`
- `req.context` is accepted by `buildAdminRequestLike(req)` when already provided by trusted server-side route/middleware context
- permission context is currently route-owned: `canCreateCaseFromRepairIntakeDraft: true` and `permission: cases.create`
- `requestId` comes from `req.requestId`, then `req.context.requestId`
- `correlationId` is not currently passed by the route helper input
- `idempotencyKey` comes from `req.idempotencyKey`, then `req.context.idempotencyKey`
- organization id comes from `req.user.organizationId`, then `req.context.organizationId`
- actor id comes from `req.user.id`, `req.user.userId`, then `req.user.sub`
- tenant id comes from `req.user.tenantId`, then `req.context.tenantId`, then the accepted final body tenant fallback

## Future Implementation Boundary Decision

Exact future route file/function to modify after a separate PM authorization:

- file: `src/routes/repairIntakeDraftToCase.routes.js`
- function/boundary: `buildAdminRequestLike(req)` and the current admin `router.post(...)` middleware chain around `requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)`

Existing middleware can be used only partially:

- `requirePermission` should remain the visible `cases.create` gate and already invokes `requireAuth`
- `requireAuth` can authenticate the Bearer token and populate `req.user`
- existing `requireOrganizationAccess` should not be used as the trusted context handoff because it accepts body/query organization id sources

A new pure adapter/helper is required before direct production wiring because current `requireAuth` user DTO does not guarantee a route-ready `organizationId`, `tenantId`, `actorRole`, correlation id, or sanitized session context handoff for `normalizeRepairIntakeDraftToCaseTrustedContext`.

Middleware order for a future implementation:

1. authenticate session using existing `requireAuth` through `requirePermission`
2. preserve `requirePermission / cases.create` before the submit handler
3. build a server-owned auth/session context adapter result from authenticated `req.user` and trusted server-side context only
4. feed only the sanitized adapter output into `normalizeRepairIntakeDraftToCaseTrustedContext`
5. keep `bodyWithoutServerOwnedContext(body)` and `stripBodyContextFields` before controller/application flow

Safe-deny/fail-closed behavior for a future implementation:

- missing or invalid session must return generic unauthorized or safe-deny behavior
- missing trusted organization, actor, or draft context must fail closed without raw auth/session details
- raw token, headers, body, query, provider payload, debug data, stack trace, DB error, env value, or secret material must not appear in the response or request-like payload

## Future Implementation Requirements

Any future implementation must preserve:

- no route path or mount change
- no public/open/customer route expansion
- no package addition unless separately authorized
- no permission model change
- no role expansion
- no organization isolation weakening
- raw body/query/header/client fields cannot become trusted context
- session/auth output must be server-owned and sanitized
- failure must be generic safe-deny or unauthorized without raw auth/session details
- request abuse guard must remain before controller invocation
- trusted context normalizer must remain the route-boundary handoff into controller/application flow

## Recommended Next Bounded Runtime Task

Recommended next bounded runtime task:

Task2355 - Repair Intake Draft-to-Case Production Auth Session Context Adapter Helper / No Route Wiring No DB No Smoke No Provider No Package

Recommendation: build a pure auth/session context adapter helper first.

Why this is the safer option:

- existing `requirePermission` already invokes `requireAuth`, so direct middleware insertion is not the first unknown
- existing `requireAuth` populates `req.user`, but the current user DTO does not guarantee a complete trusted organization/session context handoff for this route
- existing `requireOrganizationAccess` reads body/query organization sources and is not suitable for trusted context normalization
- a pure adapter helper can define the exact server-owned session output contract before route runtime behavior changes
- the helper can be unit/static tested without route path, mount, package, DB, smoke, provider, or public/open/customer changes

## Static Guard

`tests/repairIntake/repairIntakeDraftToCaseProductionAuthSessionImplementationAuthorization.static.test.js` reads current source, tests, package files, and docs as text only. It asserts:

- this packet exists and names exactly one recommended next bounded runtime task
- current route remains admin/injected-only
- route path remains unchanged
- `requirePermission / cases.create` remains visible
- trusted context normalizer wiring remains visible at `buildAdminRequestLike(req)`
- request abuse guard remains visible before controller invocation
- current auth/session middleware candidates are inventoried
- no runtime middleware implementation is introduced by Task2354
- no public/open/customer route expansion markers are introduced
- no package dependency expansion is introduced
- no DB/smoke/provider/env executable coupling is introduced

## Future Work Not Authorized

Task2354 does not authorize:

- runtime/source behavior changes
- auth/session middleware implementation
- package or package-lock changes
- route path or mount changes
- helper wiring changes
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

PM must still authorize one exact task at a time.

## Held Docs

The same 7 held historical untracked docs remain outside Task2354 scope and must stay untouched unless PM explicitly authorizes that exact action.
