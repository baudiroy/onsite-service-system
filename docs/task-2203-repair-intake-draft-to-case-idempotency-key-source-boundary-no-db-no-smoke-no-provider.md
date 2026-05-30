# Task2203 Repair Intake Draft-to-Case Idempotency Key Source Boundary

## Scope

- Strengthened the Repair Intake draft-to-case idempotency context source boundary in the existing injected/pre-route path.
- Narrow runtime source change only in existing Repair Intake route-adapter/pre-route helper boundaries.
- No DB/repository behavior changes.
- No route mounting, public/open route expansion, migration, provider, AI/RAG, billing, package, admin frontend, smoke, endpoint probe, server/listener, staging, or production traffic.
- The 7 held historical docs remain untracked and untouched.

## Boundary Inspected and Changed

- `src/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.js`
- `src/repairIntake/repairIntakeDraftToCasePreRouteHandlerFactory.js`
- The idempotency policy input boundary now accepts idempotency context only from explicit trusted top-level/header-like request context already used by the injected route pattern.

## Final Idempotency Source Rule

- Accepted idempotency sources:
  - header-like `idempotency-key`
  - trusted top-level `idempotencyKey`
  - trusted top-level or header-like request id for request-id fallback
- Rejected sources:
  - request body `idempotencyKey`, `requestId`, `dedupeKey`, `caseId`, `repairIntakeDraftId`, replay, duplicate, or similar fields
  - nested `draftInput`
  - provider/providerPayload, AI/RAG, billing/settlement/invoice, audit/auditActor, token/password, SQL/debug/internal/stack/raw error, raw request/body/input, and customer private/contact/address fields
- Accepted idempotency/request-id values must be nonblank strings, at most 128 characters, and match the safe character set `[a-zA-Z0-9._:-]`.
- Unsafe, malformed, blank, or overly long values are omitted. Existing policy fallback then uses the safe actor/draft fallback when no trusted idempotency or request id is present.

## Behavior

- Body and nested `draftInput` idempotency fields cannot provide or override idempotency context.
- Header-like idempotency context wins over trusted top-level idempotency context in the route adapter.
- Permission-denied synthetic handler path still returns before injected controller/service adapter invocation.
- Inputs are not mutated.

## Verification

- `node --test tests/repairIntake/repairIntakeDraftToCaseIdempotencyKeySourceBoundary.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseIdempotencyAwareSyntheticHandlerIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseInjectedAdapterFailureSafeEnvelope.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePermissionGateWiring.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseTrustedContextBoundary.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseServiceCommandBoundary.unit.test.js`
- Adjacent route adapter / pre-route / HTTP envelope tests as applicable.
- `git diff --check`
- `git diff --cached --check`
