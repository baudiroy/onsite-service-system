# Task2346 Repair Intake Draft-to-Case Trusted Context Normalizer Pure Helper Preflight Design Packet

## Scope

Task2346 is a preflight design packet for a possible pure trusted-context normalizer helper.

No runtime, source behavior, source helper implementation, route, permission model, auth/session middleware, package, DB, migration, smoke, endpoint, server/listener, provider, env, Zeabur, secrets, repository, idempotency, case creator, draft reader, runtime factory, application service, audit persistence, Customer Access, Engineer Mobile, admin frontend, billing, or AI/RAG behavior changed.

The only test behavior change is the addition of one source-reading static guard. This task does not add the helper.

No package or package-lock changes are authorized by this task.

## Preflight Decision

Helper recommended: yes, but only as a future pure helper implementation task with unit tests and no route wiring.

Reason:

- Task2344 captured the existing auth/session/context inventory.
- Task2345 froze the trusted context source-order contract.
- Current trusted context construction is visible in more than one boundary: route request-like construction, request context resolver, permission gate, and authorization gate.
- A future pure helper can reduce drift risk by centralizing the normalization contract before any production auth/session middleware integration.
- The helper should remain unused by runtime routes until a later exact PM-authorized wiring task.

## Proposed Pure Helper Boundary

Suggested future helper name:

`normalizeRepairIntakeDraftToCaseTrustedContext(input = {})`

Suggested future helper location:

`src/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.js`

This location is not created by Task2346.

## Proposed Helper Inputs

Allowed trusted inputs:

- trusted route params or top-level `repairIntakeDraftId`
- trusted `req.user`
- trusted `req.context`
- trusted permission/session context
- trusted request id or correlation id
- trusted idempotency key source
- current accepted route-layer `tenantId` fallback only after trusted user/context tenant values

Forbidden sources:

- raw request body
- `requestBody`
- `draftInput`
- nested body context
- query, header, cookie, session, or client payload unless already normalized into trusted context by the existing route layer
- provider/debug/env containers
- package/runtime/secrets/DB-derived payloads

## Proposed Helper Output Contract

Suggested normalized output fields:

- `organizationId`
- `tenantId` when present and trusted
- `actorId`
- `actorRole`
- `source`
- `repairIntakeDraftId`
- `requestId`
- `correlationId`
- `idempotencyKey`
- `permissionContext` marker when already present in the accepted flow

Suggested fail-closed result shape should align with existing trusted-context or authorization tests:

- `ok: false`
- safe `status` or `reasonCode`
- nullable trusted scalar context only
- no raw body/query/header/session/provider/debug/env values
- no stack traces, SQL/DB errors, secrets, tokens, customer private/contact/address fields, billing/payment fields, or AI/RAG/vector payloads

## Proposed Static Guard Coverage

`tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerPreflight.static.test.js` reads source, tests, package files, and docs as text only. It asserts:

- Task2344 and Task2345 docs/tests exist
- current trusted context source markers remain visible
- proposed helper contract is documented
- no runtime/source behavior is changed by Task2346
- no source helper implementation is added by Task2346
- no production auth/session middleware implementation is authorized
- no route/public/open/customer expansion is authorized
- no package/DB/smoke/provider/env coupling is introduced

## Future Work Not Authorized

Task2346 does not authorize:

- source helper implementation
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

## Recommended Next Bounded Task

Recommended next task, not authorized by Task2346:

Task2347 - Repair Intake Draft-to-Case Trusted Context Normalizer Pure Helper Implementation With Unit Tests / No Route Wiring No Runtime Behavior Change No DB No Smoke No Provider No Package

Why this is the safest next task:

- it can add the pure helper and direct unit tests without wiring runtime routes
- it can keep behavior unchanged until a later exact wiring task
- it can fail closed on missing trusted context before production auth/session integration
- it avoids route, package, DB, smoke, provider, deploy, and public/open/customer exposure work

PM must still authorize one exact task at a time.

## Held Docs

The same 7 held historical untracked docs remain outside Task2346 scope and must stay untouched unless PM explicitly authorizes that exact action.
