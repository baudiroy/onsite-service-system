# Task2205 Repair Intake Draft-to-Case Request Id Correlation Boundary

## Scope

- Strengthened requestId/correlation field handling in the existing Repair Intake draft-to-case route-adapter/pre-route/admin request shaping path.
- Narrow runtime source hardening only.
- No DB/repository behavior changes.
- No public/open route expansion, migration, provider, AI/RAG, billing, package, admin frontend, smoke, endpoint probe, server/listener, staging, or production traffic.
- The 7 held historical docs remain untracked and untouched.

## Boundary Inspected and Changed

- `src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js`
- `src/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.js`
- `src/repairIntake/repairIntakeDraftToCaseApiModule.js`
- `src/repairIntake/repairIntakeDraftCaseControllerAdapter.js`
- `src/repairIntake/repairIntakeDraftToCaseApplicationService.js`
- `src/routes/repairIntakeDraftToCase.routes.js`
- Existing pre-route policy and audit inputs were inspected and already avoid body/draftInput correlation reads after Task2203.

## Final Request Correlation Rule

- Accepted request correlation source:
  - trusted top-level `requestId`
  - header-like `x-request-id` fallback in the injected route-adapter path
  - trusted `req.requestId` or `req.context.requestId` in the admin request helper
- Rejected sources:
  - request body `requestId`, `correlationId`, `traceId`, `debugId`, `idempotencyKey`, `dedupeKey`, `caseId`, `replay`, and `duplicate`
  - nested `draftInput`
  - provider/providerPayload, AI/RAG, billing/settlement/invoice, audit/auditActor, token/password, SQL/debug/internal/stack/raw error, raw request/body/input, and customer private/contact/address fields
- Accepted request id values in the route-adapter/pre-route policy path follow the existing Task2203 sanitizer: nonblank strings, at most `128` characters, safe character class `[a-zA-Z0-9._:-]`.
- Unsafe, malformed, blank, or overly long request correlation values are omitted.

## Behavior

- Body and nested `draftInput` request/correlation fields cannot provide or override trusted request correlation.
- Pre-route policy input receives only sanitized request id context.
- Audit intent inputs do not include raw request id/correlation fields from body or draft input.
- Permission-denied synthetic path still skips injected controller/service adapter.
- Adapter failure envelope remains sanitized.
- Inputs are not mutated.
- The admin injected route path now propagates trusted top-level idempotency context through the safe API/controller/application-service boundary without trusting body-provided idempotency/correlation fields.

## Verification

- `node --test tests/repairIntake/repairIntakeDraftToCaseRequestIdCorrelationBoundary.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseIdempotencyKeySourceBoundary.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseIdempotencyKeySourceBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePermissionDeniedAuditIntent.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseInjectedAdapterFailureSafeEnvelope.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseFullSyntheticHttpEnvelopeIntegration.unit.test.js`
- Adjacent route-adapter/pre-route/synthetic handler tests as applicable.
- `node --test tests/repairIntake/repairIntakeDraftToCaseAdminRouteMount.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
