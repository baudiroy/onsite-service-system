# Task2344 Repair Intake Draft-to-Case Auth Session Context Boundary Inventory

## Scope

Task2344 records a source-reading inventory of the existing Repair Intake draft-to-case auth/session/context boundary. This is a no-runtime-change inventory task.

No runtime, source, route, permission model, auth/session middleware, package, DB, migration, smoke, endpoint, server/listener, provider, env, Zeabur, secrets, repository, idempotency, case creator, draft reader, runtime factory, application service, audit persistence, Customer Access, Engineer Mobile, admin frontend, billing, or AI/RAG behavior changed.

## Current Route And Permission Boundary

The current Repair Intake draft-to-case route remains:

- method/path: `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`
- route source: `src/routes/repairIntakeDraftToCase.routes.js`
- admin base path: `/api/v1/admin`
- route remains admin/injected-only
- permission gate remains `requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)`
- permission value remains `cases.create`
- route composition still uses `createRepairIntakeDraftToCaseInjectedRouteComposition`
- runtime ports still enter through explicit injected runtime ports

No public/open/customer route is authorized or introduced by this inventory.

## Current Trusted Context Sources

`src/routes/repairIntakeDraftToCase.routes.js` builds the admin request-like payload through `buildAdminRequestLike(req)`.

Current trusted context sources:

- `organizationId` comes from `req.user.organizationId` first, then `req.context.organizationId`
- `tenantId` comes from `req.user.tenantId`, then `req.context.tenantId`, then `body.tenantId`
- `actorId` comes from `req.user.id`, `req.user.userId`, or `req.user.sub`
- `requestId` comes from `req.requestId` or `req.context.requestId`
- `idempotencyKey` comes from `req.idempotencyKey` or `req.context.idempotencyKey`
- draft id comes from `req.params.draftId`
- permission context is injected by the admin route as `canCreateCaseFromRepairIntakeDraft: true` with permission `cases.create`

The route strips server-owned fields from `body` through `bodyWithoutServerOwnedContext(body)` and recursively removes body context fields through `stripBodyContextFields`.

Body fields such as actor id, actor role, case id, correlation/debug/trace ids, draft id, idempotency key, organization id, repair intake draft id, replay/duplicate markers, request id, and source are explicitly removed from the request body before the downstream request-like object is built.

## Context Resolver And Permission Gate

`src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js` derives server-owned context from `sessionContext`, not from raw request body overrides.

Current context resolver inventory:

- `organizationId` comes from `sessionContext.organizationId`
- `actorId` comes from `sessionContext.actorId`
- `actorRole` comes from `sessionContext.actorRole`
- draft id comes from top-level `repairIntakeDraftId`
- `requestBody.draftInput` is sanitized before becoming draft input
- raw request/body/header/query/session/provider/debug/env containers are treated as unsafe and are not trusted context sources

`src/repairIntake/repairIntakeDraftToCasePermissionGate.js` keeps the permission decision bounded to trusted context:

- `organizationId`
- `actorId`
- `actorRole`
- `repairIntakeDraftId`
- `source`

`src/repairIntake/repairIntakeDraftToCaseAuthorizationGate.js` validates the trusted authorization context and normalizes permission resolver results without trusting raw body/query/header fields.

## API Module And Request Abuse Guard Interaction

`src/repairIntake/repairIntakeDraftToCaseApiModule.js` now invokes `guardRepairIntakeDraftToCaseRequest(requestLike)` inside `callSafeController` before controller method invocation.

The existing API module request sanitizer remains in place. Task2342's guard prevents malformed or oversized safe request-like payloads from entering the existing controller/application flow, while the existing sanitizer strips unsafe raw fields.

This inventory does not authorize new auth/session middleware or a production auth/session runtime integration.

## Request DTO / Command / Audit Context Shape

Current request-like context flowing from the admin route/API/controller boundary includes safe variants of:

- `params.draftId`
- `body.permissionContext`
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

Downstream request DTO, command, authorization, and audit context surfaces continue to use sanitized/trusted scalar fields. Raw body, raw draft input, query, headers, cookies, session internals, provider payloads, SQL/DB errors, stack traces, tokens, passwords, secrets, customer private/contact/address fields, billing/payment fields, and AI/RAG/OpenAI/vector fields are not trusted context sources.

## Future Auth/Session Integration Candidates

Future candidates, not authorized by Task2344:

- route middleware boundary
- API module factory input boundary
- controller adapter boundary
- request DTO / command builder boundary
- permission context source boundary

## Recommended Next Bounded Source-Only Task

Recommended next task, not authorized by this inventory:

Task2345 - Repair Intake Draft-to-Case Trusted Context Normalizer Contract Static Guard / No Runtime Change No DB No Smoke No Provider No Package

Why this is the safest next task:

- it can remain source-reading/static only
- it can freeze the exact trusted context source order before middleware integration
- it can document which context fields are server-owned and which body/client fields are never trusted
- it avoids auth/session middleware implementation, package changes, route changes, DB, smoke, provider, deploy, and public/open route work

Production auth/session middleware implementation remains non-authorized until PM grants one exact bounded task.
PM must still authorize one exact task at a time.

## Static Guard

`tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextBoundary.static.test.js` reads source, tests, and docs as text only. It asserts the route path, admin/injected-only markers, `requirePermission` / `cases.create`, trusted context sources, no body override for trusted organization/actor/permission context, request abuse guard placement, no public/open/customer route expansion, and no auth/session middleware implementation authorization.

## Held Docs

The same 7 held historical untracked docs remain outside Task2344 scope and must stay untouched unless PM explicitly authorizes that exact action.
