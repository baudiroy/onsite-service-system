# Task2348 Repair Intake Draft-to-Case Trusted Context Normalizer Route Wiring Decision Gate

## Scope

Task2348 records a route-wiring decision gate for the pure trusted-context normalizer helper.

No runtime, source behavior, helper wiring, route, permission model, auth/session middleware, package, DB, migration, smoke, endpoint, server/listener, provider, env, Zeabur, secrets, repository, idempotency, case creator, draft reader, runtime factory, application service, audit persistence, Customer Access, Engineer Mobile, admin frontend, billing, or AI/RAG behavior changed.

The only test behavior change is the addition of one source-reading static guard.

No package or package-lock changes are authorized by this task.

## Existing Inputs

This decision gate uses the accepted Task2344, Task2345, Task2346, and Task2347 docs/tests:

- Task2344 accepted the current auth/session/context inventory.
- Task2345 froze the trusted context source-order contract.
- Task2346 recommended a future pure helper implementation before wiring.
- Task2347 added the pure helper and direct unit/static tests without route/API/controller/application wiring.

## Wiring Boundary Comparison

### Route Request-Like Construction Boundary

`src/routes/repairIntakeDraftToCase.routes.js` currently constructs the admin request-like payload in `buildAdminRequestLike(req)`.

Pros:

- trusted route params, `req.user`, and `req.context` are available
- body/client-owned context is stripped through `bodyWithoutServerOwnedContext(body)` and `stripBodyContextFields`
- route remains admin/injected-only
- `requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)` with `cases.create` remains visible before handler execution
- output can adapt directly to the existing request-like shape before controller/application flow
- narrowest boundary that already owns server-owned request-like context construction

Cons:

- future wiring must preserve current request-like output shape exactly
- future wiring must not turn this into auth/session middleware implementation

Decision: recommended future wiring boundary.

### API Module Safe Controller Boundary

`src/repairIntake/repairIntakeDraftToCaseApiModule.js` runs `guardRepairIntakeDraftToCaseRequest(requestLike)` before controller invocation.

Pros:

- request abuse guard is already before controller invocation
- common controller safety path is centralized

Cons:

- trusted `req.user` / `req.context` source order is no longer local here
- this boundary is after route request-like construction, so wiring here risks normalizing after unsafe context shape has already been built

Decision: not recommended for first wiring.

### Controller Adapter Boundary

The controller adapter sits closer to service commands.

Pros:

- command shaping can see downstream needs

Cons:

- too late to define route/session/user trusted-source precedence
- higher risk of mixing DTO/application concerns with request trust boundaries

Decision: not recommended.

### Request DTO / Command Builder Boundary

This boundary is close to application command construction.

Pros:

- can enforce application-facing scalar context

Cons:

- too late for route/body/client-owned context separation
- does not own permission/session context source order

Decision: not recommended.

### Authorization Gate / Permission Context Boundary

Authorization and permission gates validate trusted scalar context.

Pros:

- already fail closed on missing required trusted scalar values
- good place to preserve safe-deny behavior

Cons:

- should consume normalized trusted context, not decide raw request source precedence
- wiring here risks coupling permission decisions to raw request shapes

Decision: not recommended for first wiring.

## Recommended Future Wiring Boundary

Recommended exact future boundary:

Route request-like construction boundary in `src/routes/repairIntakeDraftToCase.routes.js`, inside or immediately adjacent to `buildAdminRequestLike(req)`, after trusted route/session/user/context inputs are available and after body/client-owned context stripping remains in place, before the request-like payload enters controller/application flow.

Why:

- it is the narrowest existing boundary that already constructs server-owned request-like context
- it already strips body/client-owned context fields
- it can preserve admin/injected-only route behavior and `requirePermission / cases.create`
- it can adapt helper output to the existing compatible request/context shape
- it keeps production auth/session middleware implementation non-authorized

## Future Wiring Requirements

Any future wiring task must:

- run the helper after trusted route/session/user/context inputs are available
- run before request-like payload enters controller/application flow
- preserve `bodyWithoutServerOwnedContext(body)` and `stripBodyContextFields`
- adapt helper output to the existing compatible request/context shape
- preserve existing safe-deny/fail-closed behavior
- preserve request abuse guard before controller invocation
- preserve route path and mount
- preserve admin/injected-only route behavior
- preserve `requirePermission / cases.create`
- avoid package or middleware additions
- avoid DB/provider/smoke/env behavior

## Future Work Not Authorized

Task2348 does not authorize:

- helper wiring
- runtime/source behavior changes
- auth/session middleware implementation
- permission model changes
- role expansion
- organization isolation source changes
- route path or mount changes
- public/open/customer route expansion
- package or package-lock changes
- DB, migration, smoke, endpoint probe, server/listener, provider, env, Zeabur, secrets, deploy, or shared runtime work
- Customer Access, Engineer Mobile, admin frontend, billing, settlement, payment, invoice, AI/RAG/OpenAI/vector DB runtime behavior
- cleanup, staging, deletion, stash, reset, or revert of held historical docs

## Static Guard

`tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerRouteWiringDecisionGate.static.test.js` reads source, tests, package files, and docs as text only. It asserts:

- pure helper exists
- helper is not yet imported or wired into route/API/controller/application modules
- decision gate doc recommends exactly one future boundary
- route remains admin/injected-only
- `requirePermission / cases.create` markers remain visible
- request abuse guard remains before controller invocation
- no public/open/customer route expansion markers
- no auth/session middleware implementation is authorized

## Recommended Next Bounded Task

Recommended next task, not authorized by Task2348:

Task2349 - Repair Intake Draft-to-Case Trusted Context Normalizer Route Boundary Wiring Design Packet / No Runtime Change No DB No Smoke No Provider No Package

Why this is the safest next task:

- it can define the exact code-level wiring patch before runtime source changes
- it can specify adapter shape from helper output to existing request-like payload
- it can keep production auth/session middleware implementation non-authorized
- it avoids DB, package, smoke, provider, deploy, and public/open/customer exposure work

PM must still authorize one exact task at a time.

## Held Docs

The same 7 held historical untracked docs remain outside Task2348 scope and must stay untouched unless PM explicitly authorizes that exact action.
