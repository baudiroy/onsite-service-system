# Task2350 Repair Intake Draft-to-Case Trusted Context Normalizer Route Boundary Wiring Implementation

## Scope

Task2350 wires the existing pure trusted-context normalizer at the selected route request-like construction boundary.

No route path, mount, permission middleware, package, package-lock, DB, migration, smoke, endpoint, server/listener, provider, env, Zeabur, secrets, repository, idempotency, case creator, draft reader, runtime factory, application service, audit persistence, Customer Access, Engineer Mobile, admin frontend, billing, or AI/RAG behavior changed.

Source behavior changed only through trusted context normalizer wiring inside `buildAdminRequestLike(req)`.

## Modified Files

- `src/routes/repairIntakeDraftToCase.routes.js`
- `tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerRouteWiring.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerRouteWiringBoundary.static.test.js`
- `docs/task-2350-repair-intake-draft-to-case-trusted-context-normalizer-route-boundary-wiring-implementation-no-route-path-change-no-db-no-smoke-no-provider-no-package.md`

## Exact Route Request-Like Boundary Changed

The route now imports `normalizeRepairIntakeDraftToCaseTrustedContext` from `src/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.js`.

The helper is invoked inside `buildAdminRequestLike(req)` after:

- `req.user`, `req.body`, `req.context`, and `req.params` are normalized into safe local containers
- `bodyWithoutServerOwnedContext(body)` strips body/client-owned context fields

The helper output is adapted into the existing request-like shape before the payload enters controller/application flow.

## Final Trusted Context Route Wiring Behavior

Trusted values are normalized from:

- route params
- trusted `req.user`
- trusted `req.context`
- admin route permission context
- trusted request id source
- trusted idempotency key source
- current accepted tenant id source order

Body, `requestBody`, and `draftInput` cannot override trusted organization, actor, draft, request, idempotency, source, or permission context.

The route still returns the compatible request-like shape with:

- `params`
- `query`
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

Missing required trusted organization or draft context fails closed into a compatible request-like shape with missing trusted scalar fields and stripped unsafe body fields, preserving downstream safe-failure behavior.

## Tests

The unit tests prove:

- normal trusted route/user/context input remains compatible
- helper wiring preserves trusted-source precedence
- body/requestBody/draftInput cannot override trusted context
- missing organization id or draft id fails closed without raw leakage
- request-like output shape remains compatible
- input request/body objects are not mutated

The static guard proves:

- route imports and invokes the pure helper only at the request-like boundary
- body context stripping remains before helper output is adapted
- route path, mount, permission, and injected-only markers remain unchanged
- request abuse guard remains downstream in API module before controller invocation
- no public/open/customer route expansion
- no package/middleware/DB/smoke/provider/env coupling

## Future Work Not Authorized

Task2350 does not authorize:

- route path or mount changes
- package or package-lock changes
- auth/session middleware implementation
- permission model changes, role expansion, or organization isolation source changes beyond this accepted trusted-context normalization boundary
- controller creation under `src/controllers/`
- public/open/customer route expansion
- DB, migration, smoke, endpoint probe, server/listener, provider, env, Zeabur, secrets, deploy, or shared runtime work
- Customer Access, Engineer Mobile, admin frontend, billing, settlement, payment, invoice, AI/RAG/OpenAI/vector DB runtime behavior
- cleanup, staging, deletion, stash, reset, or revert of held historical docs

## Recommended Next Bounded Task

Recommended next task, not authorized by Task2350:

Task2351 - Repair Intake Draft-to-Case Trusted Context Normalizer Route Boundary Post-Wiring Static Compatibility Review / No Runtime Change No DB No Smoke No Provider No Package

Why this is the safest next task:

- it can review the wiring against adjacent static guards before any broader behavior work
- it can verify no route exposure, package, DB, provider, or middleware scope drift
- it can decide whether any follow-up should be unit-only, static-only, or a later runtime smoke authorization gate

PM must still authorize one exact task at a time.

## Held Docs

The same 7 held historical untracked docs remain outside Task2350 scope and must stay untouched unless PM explicitly authorizes that exact action.
