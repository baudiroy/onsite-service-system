# Task2345 Repair Intake Draft-to-Case Trusted Context Normalizer Contract Static Guard

## Scope

Task2345 freezes the current Repair Intake draft-to-case trusted context normalizer contract as a source-reading/static guard.

No runtime, source behavior, route, permission model, auth/session middleware, package, DB, migration, smoke, endpoint, server/listener, provider, env, Zeabur, secrets, repository, idempotency, case creator, draft reader, runtime factory, application service, audit persistence, Customer Access, Engineer Mobile, admin frontend, billing, or AI/RAG behavior changed.

The only test behavior change is the addition of one static guard that reads current source, test, package, and doc artifacts as text.
No package or package-lock changes are authorized by this task.

## Accepted Task2344 Inventory

Task2344 established the accepted current inventory:

- route remains `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`
- route remains admin/injected-only
- permission remains `requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)` with value `cases.create`
- route composition remains `createRepairIntakeDraftToCaseInjectedRouteComposition`
- runtime ports remain explicit injected ports
- request abuse guard remains inside the safe-controller path before controller invocation
- no public/open/customer Repair Intake draft-to-case route is authorized or introduced
- production auth/session middleware implementation remains non-authorized

## Frozen Trusted Context Contract

The current trusted context contract is frozen as follows.

### Route Context Sources

`src/routes/repairIntakeDraftToCase.routes.js` builds the admin request-like payload through `buildAdminRequestLike(req)`.

Frozen source order:

- `organizationId`: `req.user.organizationId`, then `req.context.organizationId`
- `tenantId`: `req.user.tenantId`, then `req.context.tenantId`, then `body.tenantId`
- `actorId`: `req.user.id`, then `req.user.userId`, then `req.user.sub`
- `requestId`: `req.requestId`, then `req.context.requestId`
- `idempotencyKey`: `req.idempotencyKey`, then `req.context.idempotencyKey`
- draft id: `req.params.draftId`
- permission context: admin route injects `canCreateCaseFromRepairIntakeDraft: true` and permission `cases.create`

Client body fields must not override trusted `organizationId`, actor/admin identity, request id, idempotency key, permission context, source, or draft id. The current `tenantId` body fallback is accepted only after user/context sources, not as an override of trusted user/context values.

### Body Stripping Contract

The route continues to strip server-owned fields through `bodyWithoutServerOwnedContext(body)` and recursively through `stripBodyContextFields`.

Server-owned/client-unsafe body context names include actor id, actor role, case id, correlation/debug/trace ids, dedupe/idempotency keys, draft id, duplicate/replay markers, organization id, repair intake draft id, request id, and source.

### Resolver Contract

`src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js` derives server-owned context from `sessionContext`, not raw request body overrides.

Frozen resolver contract:

- `organizationId` comes from `sessionContext.organizationId`
- `actorId` comes from `sessionContext.actorId`
- `actorRole` comes from `sessionContext.actorRole`
- `repairIntakeDraftId` comes from top-level `safeInput.repairIntakeDraftId`
- `requestBody.draftInput` is sanitized before use
- `draftInput.source` is deleted after sanitization
- raw request/body/header/query/session/provider/debug/env containers are unsafe and are not trusted context sources

### Permission And Authorization Contract

`src/repairIntake/repairIntakeDraftToCasePermissionGate.js` keeps permission decisions bounded to trusted scalar context:

- `organizationId`
- `actorId`
- `actorRole`
- `repairIntakeDraftId`
- `source`

`src/repairIntake/repairIntakeDraftToCaseAuthorizationGate.js` validates and normalizes trusted context without trusting raw body/query/header fields.

## Future Work Not Authorized

Task2345 does not authorize:

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

`tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerContract.static.test.js` reads source, tests, package files, and docs as text only. It asserts the frozen trusted context source order, body/server-owned field stripping, resolver contract, permission/authorization scalar contract, request abuse guard placement, no route exposure expansion, no package dependency expansion markers, and the non-authorization boundary.

## Recommended Next Bounded Source-Only Task

Recommended next task, not authorized by Task2345:

Task2346 - Repair Intake Draft-to-Case Trusted Context Normalizer Pure Helper Preflight Design Packet / No Runtime Change No DB No Smoke No Provider No Package

Why this is the safest next task:

- it can stay documentation/static-design only
- it can decide whether a pure helper should be introduced before any source file is added
- it can keep production auth/session middleware implementation non-authorized
- it avoids package, DB, route, permission, provider, deploy, and runtime behavior changes

PM must still authorize one exact task at a time.

## Held Docs

The same 7 held historical untracked docs remain outside Task2345 scope and must stay untouched unless PM explicitly authorizes that exact action.
