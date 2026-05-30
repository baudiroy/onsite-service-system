# Task2204 Repair Intake Draft-to-Case Idempotency Key Source Static Boundary Guard

## Scope

- Added a static boundary guard for the Task2203 idempotency key source and sanitization rules.
- No runtime/source behavior changes.
- No route mounting, DB/repository, migration, provider, AI/RAG, billing, package, admin frontend, smoke, endpoint probe, server/listener, staging, or production traffic.
- The 7 held historical docs remain untracked and untouched.

## Static Guard Coverage

- Confirms idempotency context is derived at the route-adapter/pre-route policy boundary.
- Confirms accepted sources remain limited to header-like `idempotency-key`, trusted top-level `idempotencyKey`, and trusted top-level/header-like request id fallback.
- Confirms body-level `idempotencyKey`, `requestId`, `dedupeKey`, `caseId`, `repairIntakeDraftId`, `replay`, and `duplicate` markers remain stripped.
- Confirms nested `draftInput` is not used by `policyInputFromContext()`.
- Confirms unsafe raw/private/provider/AI/RAG/billing/audit/token/password/SQL/debug/internal/stack fields remain denied near route context.
- Confirms idempotency/request-id sanitizer keeps nonblank strings only, maximum length `128`, and safe character class `[a-zA-Z0-9._:-]`.
- Confirms permission-denied synthetic branch still returns before adapter input construction or adapter invocation.
- Confirms Task2203 unit coverage remains present for body/draftInput override rejection, unsafe/overlong omission, header-like acceptance, fallback behavior, and deny-skip behavior.

## Verification

- `node --test tests/repairIntake/repairIntakeDraftToCaseIdempotencyKeySourceBoundary.static.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseIdempotencyKeySourceBoundary.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseIdempotencyAwareSyntheticHandlerIntegration.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCasePermissionGateWiring.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseServiceCommandBoundary.unit.test.js`
- `node --test tests/repairIntake/repairIntakeDraftToCaseTrustedContextBoundary.static.test.js`
- `git diff --check`
- `git diff --cached --check`
