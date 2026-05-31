# Task2356 Repair Intake Draft-to-Case Auth Session Context Adapter Route Wiring Decision Gate

## Scope

Task2356 records a source-reading decision gate for future route-boundary wiring of `buildRepairIntakeDraftToCaseAuthSessionContext(input)`.

No runtime/source behavior changes.

No helper wiring.

No auth/session middleware implementation.

No package or package-lock changes.

No public/open/customer route expansion.

Production auth/session middleware implementation remains non-authorized.

## Inputs Reviewed

This decision gate uses the accepted Task2354 and Task2355 outputs plus the current route and trusted-context source:

- `src/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter.js`
- `src/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.js`
- `src/routes/repairIntakeDraftToCase.routes.js`
- Task2354 production auth/session implementation authorization packet
- Task2355 auth/session context adapter helper
- Task2344 through Task2353 auth/session trusted-context branch docs/tests

## Wiring Boundary Comparison

### Route Request-Like Construction Boundary

Candidate:

`src/routes/repairIntakeDraftToCase.routes.js`, inside or immediately adjacent to `buildAdminRequestLike(req)`.

Pros:

- `req.user`, `req.context`, `req.requestId`, and `req.idempotencyKey` are already available at this boundary
- current body/server-owned context stripping remains local through `bodyWithoutServerOwnedContext(body)` and `stripBodyContextFields`
- current trusted context normalizer wiring already runs here before controller/application flow
- adapter output can be passed into `normalizeRepairIntakeDraftToCaseTrustedContext(input)` without modifying API/controller/application modules
- route path, mount, and `requirePermission / cases.create` can stay unchanged

Cons:

- future wiring must preserve the existing request-like output shape exactly
- future wiring must not turn this task into production auth/session middleware implementation

Decision: recommended future boundary.

### Trusted Context Normalizer Input Construction Boundary

Candidate:

The object passed to `normalizeRepairIntakeDraftToCaseTrustedContext(input)` inside `buildAdminRequestLike(req)`.

Pros:

- very close to the trusted context handoff
- can use adapter `sessionContext` as the normalizer `context` / `sessionContext` input

Cons:

- too narrow to decide fallback behavior unless paired with the broader `buildAdminRequestLike(req)` request-like construction boundary
- should be treated as part of the route request-like construction boundary, not as a separate module boundary

Decision: recommended only as part of the route request-like construction boundary.

### Permission / Authorization Gate Boundary

Candidate:

Permission or authorization gates after route request-like construction.

Pros:

- already handles safe allowed/denied envelopes downstream

Cons:

- too late to define how authenticated session context becomes trusted route context
- risks mixing raw route/session concerns with permission decision concerns

Decision: not recommended.

### `requirePermission` / `requireAuth` Middleware Boundary

Candidate:

Modify `requirePermission` or `requireAuth`.

Pros:

- `requirePermission` already invokes `requireAuth`
- `requireAuth` already authenticates Bearer tokens and sets `req.user`

Cons:

- broader blast radius across all routes using these middlewares
- current issue is route-specific trusted-context handoff, not global auth implementation
- modifying shared middleware would risk unrelated admin/auth route behavior

Decision: not recommended for first adapter wiring.

Do not modify `requireAuth` or `requirePermission` for the first adapter wiring task.

### Controller / API / Application Boundary

Candidate:

Wire the adapter in API module, controller adapter, or application service.

Pros:

- downstream modules already consume request-like input

Cons:

- too late to protect the route-owned trust boundary
- would require downstream modules to know too much about route auth/session shape
- risks changing application behavior instead of the route handoff

Decision: not recommended.

## Recommended Future Boundary

Recommended exact future boundary:

Route request-like construction boundary in `src/routes/repairIntakeDraftToCase.routes.js`, inside or immediately adjacent to `buildAdminRequestLike(req)`, specifically where the route currently builds trusted context input for `normalizeRepairIntakeDraftToCaseTrustedContext(input)`.

## Future Adapter Order

A future route-boundary wiring task should preserve this order:

1. `requireAuth / requirePermission remain as-is`.
2. Route handler has trusted `req.user` / `req.context` from existing middleware or injected route context.
3. `bodyWithoutServerOwnedContext(body)` and `stripBodyContextFields` remain in place.
4. `buildRepairIntakeDraftToCaseAuthSessionContext(input) runs with server-owned user/context/request metadata only`.
5. `normalizeRepairIntakeDraftToCaseTrustedContext(input) receives auth adapter output`.
6. Existing request-like payload shape remains compatible.
7. API module request abuse guard remains downstream before controller invocation.

Future adapter input must not include raw body, `requestBody`, `draftInput`, query, header, cookie, client payload, provider/debug/env containers, or `requireOrganizationAccess` body/query-style organization sources.

## Future Fail-Closed Behavior

Future wiring must fail closed when auth session context is missing or invalid.

Accepted safe behavior:

- return a compatible safe request-like failure path, or
- use an existing safe-failure equivalent without exposing raw auth/session details

Future failure output must not expose:

- raw auth/session details
- tokens
- provider payloads
- body/query/header/client/env/debug fields
- SQL/DB errors
- stack traces
- secrets
- customer private/contact/address fields
- billing/payment fields
- AI/RAG/vector payloads

## Future Work Not Authorized

Task2356 does not authorize:

- runtime/source behavior changes
- helper wiring
- package or package-lock changes
- auth/session middleware implementation
- permission model changes, role expansion, or organization isolation source changes
- route path or mount changes
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

Recommended next task, not authorized by Task2356:

Task2357 - Repair Intake Draft-to-Case Auth Session Context Adapter Route Boundary Wiring Design Packet / No Runtime Change No DB No Smoke No Provider No Package

Why this is the safest next task:

- it can define the exact code-level patch before route runtime behavior changes
- it can specify the adapter-to-normalizer handoff shape
- it can preserve route path, mount, permission middleware, package, DB, smoke, provider, and public/open/customer boundaries

PM must still authorize one exact task at a time.

## Held Docs

The same 7 held historical untracked docs remain outside Task2356 scope and must stay untouched unless PM explicitly authorizes that exact action.
