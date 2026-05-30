# Task2206 Repair Intake Draft-to-Case Request Id Correlation Static Boundary Guard

## Scope

- Added a focused static boundary guard for the Task2205 requestId/correlation/idempotency-like context rules.
- No runtime/source behavior changes.
- No DB, repository, migration, env, Zeabur, smoke, endpoint, server/listener, provider, AI/RAG, billing, package, admin frontend, Customer Access, or Engineer Mobile changes.
- The 7 held historical docs remain untracked and untouched.

## Static Boundary Covered

- Trusted request correlation sources stay top-level or header-like in the route/admin/adapter boundary.
- Body-level `requestId`, `correlationId`, `traceId`, `debugId`, `idempotencyKey`, `dedupeKey`, `caseId`, `replay`, and `duplicate` fields stay stripped before trusted context.
- Nested `draftInput` cannot provide or override request correlation context because admin body context stripping is recursive and route handler/adapter body override sets contain the same correlation-like fields.
- Unsafe, blank, malformed, and overlong request correlation values stay omitted by the shared `128` character safe-pattern sanitizer.
- API/controller/application-service handoff keeps trusted top-level idempotency context available without allowing raw framework/request fields through the safe API boundary.
- Audit intent and adapter failure envelope paths stay sanitized and do not expose raw or unsafe client-provided correlation values.
- Permission-denied path still returns before injected controller/service adapter input or invocation.

## Verification

- `node --test tests/repairIntake/repairIntakeDraftToCaseRequestIdCorrelationBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseRequestIdCorrelationBoundary.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseIdempotencyKeySourceBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseIdempotencyKeySourceBoundary.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseInjectedAdapterFailureSafeEnvelope.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePermissionGateWiring.unit.test.js`
- `git diff --check`
- `git diff --cached --check`
