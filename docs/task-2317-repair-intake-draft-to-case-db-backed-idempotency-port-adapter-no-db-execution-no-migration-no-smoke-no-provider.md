# Task2317 Repair Intake Draft-to-Case DB-Backed Idempotency Port Adapter

## Scope

Task2317 hardens the Repair Intake draft-to-case idempotency adapter and DB-backed repository seam only.

No route, controller, public/open customer flow, provider, migration, package, server, smoke, endpoint, Zeabur, env, or secret scope was changed or executed.

## Runtime Boundary

- Idempotency lookup now uses trusted top-level `organizationId`, `idempotencyKey`, `repairIntakeDraftId`/`draftId`, and optional `tenantId`.
- DB-backed lookup SQL is parameterized and scoped by organization, operation, idempotency key, draft id, and tenant when present.
- Adapter replay and record envelopes now require store/repository results to match the trusted idempotency scope before returning success.
- Repository row mapping no longer backfills scoped fields from lookup/record context when rows are malformed.
- Missing/malformed context, malformed replay/write rows, cross-org/wrong-tenant rows, repository/query failures, and missing write rows fail closed with sanitized results.
- Client-controlled `body`, `draftInput`, `headers`, `query`, or `client` fields are not used to override trusted idempotency scope.

## Verification

Verification is text-only and synthetic-client only. No real DB, migration, smoke, server/listener, provider, env, Zeabur, or secret command is required for this task.

Required focused verification:

- `node --test tests/repairIntake/repairIntakeIdempotencyPortAdapterDbBacked.unit.test.js`
- adjacent idempotency adapter/repository/contract tests
- PM-listed draft-to-case idempotency boundary tests
- `git diff --check`
- `git diff --cached --check` after staging
- `git status --short --branch`
