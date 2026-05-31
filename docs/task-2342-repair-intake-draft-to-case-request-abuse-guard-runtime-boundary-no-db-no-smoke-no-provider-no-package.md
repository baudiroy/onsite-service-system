# Task2342 Repair Intake Draft-to-Case Request Abuse Guard Runtime Boundary

## Scope

Task2342 adds a narrow source-only request abuse guard at the existing Repair Intake draft-to-case API module safe controller boundary.

The selected boundary is `src/repairIntake/repairIntakeDraftToCaseApiModule.js`, immediately before `callSafeController` invokes the selected controller method and before sanitized request-like input enters the existing controller/application flow.

No route mount, route path, public/open/customer route, package, middleware package, DB, migration, smoke, endpoint, server/listener, provider, staging, production, deploy, env, Zeabur, secrets, admin frontend, Customer Access, Engineer Mobile, billing, AI/RAG, repository, idempotency, case creator, draft reader, runtime factory, audit persistence, auth/session, permission model, rate-limit middleware, or payload-size middleware behavior was introduced.

## Implemented Behavior

Task2342 adds `src/repairIntake/repairIntakeDraftToCaseRequestAbuseGuard.js`.

The guard is pure and internal. It checks only the existing request-like input shape accepted by the API module:

- `actor`
- `body`
- `context`
- `idempotencyKey`
- `organizationId`
- `params`
- `query`
- `requestId`
- `tenantId`

The guard fails closed with a generic safe failure envelope when:

- request-like input is null, non-object, or malformed
- the serialized safe request payload exceeds the conservative internal max size
- known string fields exceed the conservative internal max length
- arrays exceed the conservative internal item limit
- objects exceed the conservative internal key limit
- nesting exceeds the conservative internal depth limit
- circular or non-serializable values are detected

The existing API module request sanitizer continues to strip unsafe raw fields and unsafe text before controller/application flow. The new guard also skips unsafe raw field branches while inspecting the safe request payload so unsafe raw content cannot expand the accepted safe payload.

The generic failure reason is:

- `REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_ABUSE_REJECTED`

Required action:

- `submit_safe_request`

## Safety Boundary

The guard and tests preserve these boundaries:

- normal valid request input still succeeds through the selected API module boundary
- oversized payloads fail closed before controller invocation
- oversized string fields fail closed before controller invocation
- oversized arrays/objects fail closed before controller invocation
- malformed/null/non-object/circular/non-serializable input fails closed
- unsafe raw fields do not leak
- request body or client-controlled values cannot override trusted context through the application service adapter
- input objects are not mutated
- existing route remains admin/injected-only
- no public/open/customer route expansion occurred
- no package dependency was added

## Verification Coverage

Added focused tests:

- `tests/repairIntake/repairIntakeDraftToCaseRequestAbuseGuard.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseRequestAbuseGuardBoundary.static.test.js`

The unit test proves normal success, oversized payload failure, oversized string failure, oversized array/object failure, malformed request failure, unsafe raw field non-leakage, trusted context preservation, and no mutation.

The static guard reads source/test/doc/package text only and asserts API module guard wiring, pure helper limits, denied unsafe markers, package dependency boundary, route boundary, focused unit coverage, and this task document boundary.

## Runtime Statement

- No DB commands were run.
- No SQL was executed against any database.
- No real DB connection was opened.
- No migration was created, dry-run, modified, or applied.
- Migration 026 was not applied.
- No `DATABASE_URL`, env, Zeabur, or secrets were inspected.
- No server/listener was started.
- No smoke test or endpoint probe was run.
- No provider sending occurred.
- No package or package-lock changes occurred.
- No route path or mount behavior changed.
- No public/open/customer route expansion occurred.

Future implementation remains blocked until PM authorizes one exact bounded task.

## Held Docs

The same 7 held historical untracked docs remain outside Task2342 scope and must stay untouched unless PM explicitly authorizes that exact action.
