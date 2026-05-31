# Task2351 Repair Intake Draft-to-Case Trusted Context Normalizer Route Wiring Checkpoint

## Scope

Task2351 is a docs-only checkpoint for the accepted Task2344 through Task2350 Repair Intake draft-to-case trusted-context sequence.

No runtime, source, test, route, permission model, auth/session middleware, package, package-lock, DB, migration, smoke, endpoint, server/listener, provider, env, Zeabur, secrets, repository, idempotency, case creator, draft reader, runtime factory, application service, audit persistence, Customer Access, Engineer Mobile, admin frontend, billing, or AI/RAG behavior changed.

## Accepted Outcomes

- Task2344 inventoried the existing auth/session/context boundary for the admin Repair Intake draft-to-case route.
- Task2345 froze the trusted context source-order and static contract.
- Task2346 recommended a future pure trusted context normalizer helper before any route wiring.
- Task2347 added `normalizeRepairIntakeDraftToCaseTrustedContext(input = {})` with unit/static coverage and no runtime route wiring.
- Task2348 selected the route request-like construction boundary as the future helper wiring boundary.
- Task2349 designed the exact route boundary wiring shape for `buildAdminRequestLike(req)`.
- Task2350 wired the helper into `buildAdminRequestLike(req)` and adapted the helper output into the existing compatible request-like shape.

## Current Route Wiring Status

The trusted context normalizer is currently wired only in:

`src/routes/repairIntakeDraftToCase.routes.js`

The selected boundary is:

`buildAdminRequestLike(req)`

The route path remains unchanged:

`POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`

Current route status:

- route remains admin/injected-only
- permission gate remains `requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)`
- permission value remains `cases.create`
- route composition remains `createRepairIntakeDraftToCaseInjectedRouteComposition`
- body/server-owned context stripping remains in `bodyWithoutServerOwnedContext(body)` and `stripBodyContextFields`
- API module request abuse guard remains downstream before controller invocation
- no production auth/session middleware implementation was added
- no package or package-lock changes were made
- no route path or mount changed

## Current Safety Status

Trusted organization, tenant, actor, draft, request, and idempotency context is normalized before the request-like payload enters controller/application flow.

Trusted context can be sourced only from accepted trusted route/user/context/session/top-level inputs and the admin permission context. Body, `requestBody`, `draftInput`, nested body context, raw body, query, headers, cookies, session internals, provider payloads, debug/env containers, client-owned fields, DB/secrets/package/runtime payloads, and unsafe strings cannot override trusted context.

The existing request-like output shape remains compatible with current route, API module, controller adapter, request DTO, authorization, and audit context expectations:

- `params.draftId`
- `params.repairIntakeDraftId`
- `body.permissionContext.canCreateCaseFromRepairIntakeDraft`
- `context.organizationId`
- `context.tenantId`
- `context.actorId`
- `context.requestId`
- `context.permissionContext`
- `actor.id`
- `actor.userId`
- `actor.organizationId`
- top-level `organizationId`
- top-level `tenantId`
- top-level `requestId`
- top-level `idempotencyKey`
- top-level `repairIntakeDraftId`
- top-level `draftId`

Missing or invalid trusted context follows safe-failure behavior by producing a compatible request-like shape without exposing raw helper input or unsafe body/client context.

Input request and body objects are not mutated.

## Static And Unit Coverage Checkpoint

Current coverage proves:

- trusted-source precedence through route/user/context/session inputs
- body, `requestBody`, and `draftInput` cannot override trusted context
- compatible request-like output shape is preserved
- missing organization or draft context fails closed without raw leakage
- helper output is detached and input objects are not mutated
- route helper wiring exists only at the route request-like boundary
- downstream API/controller/application modules are not wired to the helper
- route path, mount, permission gate, admin/injected-only status, and request abuse guard placement remain unchanged
- no public/open/customer route expansion, package dependency expansion, DB/smoke/provider/env coupling, or auth/session middleware implementation was introduced

## Non-Authorized Next Repair Intake Candidates

The following are candidates only and are not authorized by Task2351:

- static portfolio guard for auth/session/trusted-context readiness
- source-only production auth/session middleware implementation packet
- source-only production route composition checkpoint
- public/open Repair Intake route design only if PM explicitly chooses route scope
- wait for disposable DB tooling before retrying migration 026 dry-run

PM must still authorize one exact task at a time before any further work starts.

## Forbidden Scope Confirmation

Task2351 does not authorize and did not perform:

- runtime/source/test behavior changes
- route path or mount changes
- helper wiring changes
- package or package-lock changes
- auth/session middleware implementation
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

The same 7 held historical untracked docs remain outside Task2351 scope and must stay untouched unless PM explicitly authorizes that exact action.
