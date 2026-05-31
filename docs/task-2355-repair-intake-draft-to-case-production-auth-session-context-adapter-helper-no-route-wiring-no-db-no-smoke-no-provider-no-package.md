# Task2355 Repair Intake Draft-to-Case Production Auth Session Context Adapter Helper

## Scope

Task2355 adds a pure auth/session context adapter helper for future Repair Intake draft-to-case production auth/session integration.

No route/runtime wiring was added. Existing route, middleware, controller, API module, application service, repository, idempotency, case creator, draft reader, runtime factory, audit persistence, Customer Access, Engineer Mobile, admin frontend, billing, and AI/RAG behavior is unchanged.

Production auth/session middleware implementation remains non-authorized.

No package or package-lock changes were made.

No DB, migration, smoke, provider, env, Zeabur, secrets, endpoint, server/listener, deploy, or shared runtime work was performed.

## Modified Files

- `src/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter.js`
- `tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapterBoundary.static.test.js`
- `docs/task-2355-repair-intake-draft-to-case-production-auth-session-context-adapter-helper-no-route-wiring-no-db-no-smoke-no-provider-no-package.md`

## Helper Contract

The helper exports:

`buildRepairIntakeDraftToCaseAuthSessionContext(input = {})`

Accepted trusted inputs:

- already-authenticated `user` / `req.user`-like object
- trusted `context` / `req.context`-like object
- trusted `sessionContext` if already produced by server-side middleware
- trusted permission context marker
- trusted request id
- trusted correlation id
- trusted idempotency key
- explicitly passed trusted scalar organization, tenant, actor, actor role, or source values

Forbidden sources are ignored:

- raw body
- `requestBody`
- `draftInput`
- query, header, cookie, or client payloads
- provider, debug, or env containers
- body-derived organization, tenant, actor, or draft values
- `requireOrganizationAccess` body/query-style organization source

## Output Shape

Success output:

- `ok: true`
- `status: ready`
- `reasonCode: auth_session_context_ready`
- `sessionContext` with detached allowlisted trusted scalar fields only

Allowlisted `sessionContext` fields:

- `organizationId`
- `tenantId` when trusted
- `actorId`
- `actorRole`
- `source`
- `requestId`
- `correlationId`
- `idempotencyKey`
- `permissionContext`

Fail-closed output:

- `ok: false`
- `status: failed`
- safe `reasonCode`
- `sessionContext: null`

Missing trusted organization identity fails closed with `auth_session_context_organization_required`.

Missing trusted actor identity fails closed with `auth_session_context_actor_required`.

Malformed input fails closed with `auth_session_context_invalid`.

## Tests

The unit tests prove:

- valid authenticated user/context input returns a safe ready envelope
- trusted-source precedence falls back through context and session fields only
- raw body, `requestBody`, `draftInput`, query, header, cookie, and client payloads cannot override trusted context
- missing organization or actor identity fails closed
- malformed input fails closed
- unsafe strings, SQL markers, stack traces, tokens, passwords, secrets, provider payload markers, AI/RAG markers, and billing markers are dropped or fail closed
- output does not expose raw user/session/token/auth provider payloads
- input objects are not mutated
- output objects are detached

The static guard proves:

- helper has no runtime/server/DB/provider/package imports
- helper is not imported or wired into route/API/controller/application/middleware runtime paths
- no auth/session middleware implementation is added
- no package dependency expansion is added
- no public/open/customer route expansion is added
- this document records future wiring as non-authorized

## Future Wiring Not Authorized

Future route-boundary wiring remains non-authorized by Task2355.

Future wiring must require separate exact PM authorization and must preserve:

- no route path or mount change
- no package addition unless separately authorized
- no public/open/customer route expansion
- no permission model change
- no role expansion
- no organization isolation weakening
- no DB, migration, smoke, provider, env, Zeabur, secrets, endpoint, server/listener, deploy, staging/prod traffic, or shared runtime work
- raw body/query/header/client fields cannot become trusted context
- session/auth output must be server-owned and sanitized
- failure must be generic safe-deny or unauthorized without raw auth/session details

## Recommended Next Bounded Task

Recommended next task, not authorized by Task2355:

Task2356 - Repair Intake Draft-to-Case Production Auth Session Context Adapter Route Boundary Wiring Design / No Runtime Change No DB No Smoke No Provider No Package

Why this is the safest next task:

- it can decide the exact route wiring shape before changing route runtime behavior
- it can specify how adapter output feeds `normalizeRepairIntakeDraftToCaseTrustedContext`
- it can keep production middleware behavior, package changes, route path changes, DB, smoke, provider, and public/open/customer route expansion non-authorized

PM must still authorize one exact task at a time.

## Held Docs

The same 7 held historical untracked docs remain outside Task2355 scope and must stay untouched unless PM explicitly authorizes that exact action.
