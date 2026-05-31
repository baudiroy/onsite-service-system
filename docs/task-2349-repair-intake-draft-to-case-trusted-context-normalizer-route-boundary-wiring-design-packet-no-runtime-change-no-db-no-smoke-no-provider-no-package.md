# Task2349 Repair Intake Draft-to-Case Trusted Context Normalizer Route Boundary Wiring Design Packet

## Scope

Task2349 records the exact route boundary wiring design for the pure trusted-context normalizer helper.

No runtime, source behavior, helper wiring, route, permission model, auth/session middleware, package, DB, migration, smoke, endpoint, server/listener, provider, env, Zeabur, secrets, repository, idempotency, case creator, draft reader, runtime factory, application service, audit persistence, Customer Access, Engineer Mobile, admin frontend, billing, or AI/RAG behavior changed.

The only test behavior change is the addition of one source-reading static guard.

No package or package-lock changes are authorized by this task.

## Route Boundary Wiring Design Summary

Task2348 selected the route request-like construction boundary as the future wiring point. Task2349 defines the exact future wiring design but does not implement it.

Future wiring file:

`src/routes/repairIntakeDraftToCase.routes.js`

Future wiring boundary:

Inside or immediately adjacent to `buildAdminRequestLike(req)`.

Future helper:

`normalizeRepairIntakeDraftToCaseTrustedContext(input)`

Future wiring order:

1. Read trusted route/session/user/context inputs.
2. Preserve `bodyWithoutServerOwnedContext(body)` and `stripBodyContextFields`.
3. Call the pure helper with trusted inputs only.
4. Adapt helper `context` output into the existing request-like shape.
5. Preserve current request-like payload compatibility.
6. Keep request abuse guard in the API module before controller invocation.

## Future Adapter Shape

Future helper input should be built only from:

- `params`
- trusted `user`
- trusted `context`
- trusted permission/session context
- trusted top-level request id / correlation id / idempotency key sources
- trusted top-level or route draft id source

Future helper input must not include:

- raw body
- `requestBody`
- `draftInput`
- query/header/cookie/session/client-owned payloads unless already normalized into trusted context by the existing route layer
- provider/debug/env containers
- DB/secrets/package/runtime payloads

Future helper success output must adapt to the existing compatible request-like fields:

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
- `params.draftId`
- `params.repairIntakeDraftId`

Future wiring must not change the route path, mount, permission middleware, response envelope, controller method, API module request abuse guard, or downstream application behavior.

## Future Fail-Closed Behavior

If the helper returns failed or invalid trusted context, future route/request-like construction must produce an existing compatible safe failure or equivalent safe request-like failure path.

Future failure handling must not expose:

- raw helper input
- body, query, header, cookie, session, provider, debug, env, or client-owned fields
- stack traces
- SQL/DB errors
- secrets or tokens
- customer private/contact/address fields
- billing/payment fields
- AI/RAG/vector payloads

## Future Tests Needed

A future wiring implementation task should include tests proving:

- normal trusted route/user/context input remains compatible
- body/requestBody/draftInput cannot override trusted context
- missing organization id fails closed
- missing draft id fails closed
- helper output is detached and input is not mutated
- route remains admin/injected-only
- no public/open/customer route expansion
- no package or middleware is added
- request abuse guard remains before controller invocation

## Future Work Not Authorized

Task2349 does not authorize:

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

`tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerRouteWiringDesign.static.test.js` reads source, tests, package files, and docs as text only. It asserts:

- Task2348 decision gate exists and recommends route request-like construction boundary
- route file contains `buildAdminRequestLike`
- route file contains body context stripping markers
- pure helper exists but is not imported or wired into route/API/controller/application modules yet
- design packet names exactly one future wiring file and boundary
- no auth/session middleware implementation is authorized
- no public/open/customer route expansion markers are introduced

## Recommended Next Bounded Task

Recommended next task, not authorized by Task2349:

Task2350 - Repair Intake Draft-to-Case Trusted Context Normalizer Route Boundary Wiring Implementation / No Route Path Change No DB No Smoke No Provider No Package

Why this is the safest next task:

- it can wire the already-tested pure helper at the selected route boundary
- it can keep route path, mount, permission middleware, and API abuse guard unchanged
- it can verify compatibility with current request-like shape
- it can keep production auth/session middleware implementation non-authorized

PM must still authorize one exact task at a time.

## Held Docs

The same 7 held historical untracked docs remain outside Task2349 scope and must stay untouched unless PM explicitly authorizes that exact action.
