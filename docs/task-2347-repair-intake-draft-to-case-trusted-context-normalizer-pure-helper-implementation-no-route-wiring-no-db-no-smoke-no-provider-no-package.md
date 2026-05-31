# Task2347 Repair Intake Draft-to-Case Trusted Context Normalizer Pure Helper Implementation

## Scope

Task2347 adds a pure trusted-context normalizer helper with direct unit tests.

No runtime route/API/controller/application wiring was added. Existing runtime behavior is unchanged because no existing runtime module imports the helper.

No package, package-lock, DB, migration, smoke, endpoint, server/listener, provider, env, Zeabur, secrets, repository, idempotency, case creator, draft reader, runtime factory, application service, audit persistence, Customer Access, Engineer Mobile, admin frontend, billing, or AI/RAG behavior changed.

## Modified Files

- `src/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.js`
- `tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizerHelperBoundary.static.test.js`
- `docs/task-2347-repair-intake-draft-to-case-trusted-context-normalizer-pure-helper-implementation-no-route-wiring-no-db-no-smoke-no-provider-no-package.md`

## Pure Helper Contract And Output Shape

The helper exports:

`normalizeRepairIntakeDraftToCaseTrustedContext(input = {})`

Success output:

- `ok: true`
- `status: ready`
- `reasonCode: trusted_context_ready`
- `context` with allowlisted trusted scalar fields only

Fail-closed output:

- `ok: false`
- `status: failed`
- safe `reasonCode`
- `context: null`

Allowlisted output context fields:

- `organizationId`
- `tenantId` when present and trusted
- `actorId`
- `actorRole`
- `source`
- `repairIntakeDraftId`
- `requestId`
- `correlationId`
- `idempotencyKey`
- `permissionContext` marker when already present in accepted trusted flow

Trusted values are sourced from accepted trusted route params, top-level trusted ids, `user`, `context`, `sessionContext`, and explicit trusted permission context. Raw body, `requestBody`, `draftInput`, nested body context, query/header/cookie/session/client payload, provider/debug/env containers, package/runtime/secrets/DB-derived payloads, and unsafe strings are not trusted sources.

Missing required trusted `organizationId`, `repairIntakeDraftId`, or `actorId` fails closed.

## Tests

The unit test covers:

- trusted-source precedence over raw/client-controlled fields
- forbidden-source rejection
- fail-closed behavior for malformed input and missing required trusted context
- unsafe string dropping or fail-closed behavior
- no raw leakage
- no mutation of input
- detached allowlisted permission context output

The static guard covers:

- helper exists and has no runtime imports
- helper is not wired into existing route/API/controller/application paths
- no public/open/customer route expansion
- no package dependency expansion markers
- no DB/smoke/provider/env/runtime coupling markers
- future route wiring remains non-authorized

## Future Work Not Authorized

Task2347 does not authorize:

- runtime route/API/controller/application wiring
- existing runtime behavior changes
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

Recommended next task, not authorized by Task2347:

Task2348 - Repair Intake Draft-to-Case Trusted Context Normalizer Route Wiring Decision Gate / No Runtime Change No DB No Smoke No Provider No Package

Why this is the safest next task:

- it can decide whether and where to wire the pure helper before runtime behavior changes
- it can compare route, API module, controller adapter, and request DTO boundaries
- it keeps production auth/session middleware implementation non-authorized
- it avoids DB, package, smoke, provider, deploy, and public/open/customer exposure work

PM must still authorize one exact task at a time.

## Held Docs

The same 7 held historical untracked docs remain outside Task2347 scope and must stay untouched unless PM explicitly authorizes that exact action.
