# Task2319 Repair Intake Draft-to-Case DB-Backed Persistence Seams Checkpoint

## Scope

Task2319 is a docs-only checkpoint for accepted Task2314 through Task2318 Repair Intake draft-to-case DB-backed persistence seam work.

This checkpoint does not change runtime, source, tests, package files, migrations, routes, controllers, providers, admin frontend, Customer Access, Engineer Mobile, billing, or AI/RAG behavior.

## Accepted Outcomes

### Task2314

Task2314 created the DB-backed runtime implementation authorization packet and inventory only. It documented the existing DB-capable Repair Intake seams, migration artifacts, stop conditions, and recommended first implementation slice.

Task2314 did not authorize or perform DB execution, SQL execution against a database, migration creation, migration dry-run/apply, runtime wiring, route expansion, smoke, endpoint probing, provider sending, env/Zeabur/secrets inspection, or any future task.

### Task2315

Task2315 implemented and hardened the DB-backed draft reader through the existing injected adapter/repository seam.

Accepted status:

- the draft reader adapter prefers trusted `repairIntakeDraftId`, with trusted `draftId` fallback
- trusted `organizationId` is required before repository read
- DB-backed draft lookup is parameterized by draft id and organization id
- tenant id is included in scope when present
- malformed input, missing draft id, missing organization id, missing rows, malformed rows, cross-organization rows, wrong-tenant rows, and query failures fail closed
- outputs remain sanitized and compatible with the draft-to-case application service
- focused tests use fake/injected clients only

### Task2316

Task2316 added a no-runtime-change static boundary guard for the Task2315 draft reader seam.

Accepted status:

- the guard reads source, test, and doc files as text only
- it freezes trusted draft id and organization scoping
- it freezes parameterized draft reader lookup shape
- it freezes fail-closed behavior for malformed, missing, cross-org, and wrong-tenant draft rows
- it confirms client-controlled body/draftInput/query/header-like fields do not become trusted draft or organization sources
- it confirms no direct runtime/env/provider/migration/server behavior is introduced

### Task2317

Task2317 implemented and hardened the DB-backed idempotency adapter/repository seam behind injected repository/query boundaries.

Accepted status:

- idempotency lookup uses trusted top-level `organizationId`, `idempotencyKey`, `repairIntakeDraftId`/`draftId`, and optional `tenantId`
- DB-backed idempotency lookup is parameterized and scoped by organization, operation type, idempotency key, draft id, and tenant when present
- record/write path is scoped by organization id, tenant id when present, idempotency key, operation type, draft id, and safe request fingerprint
- adapter replay and record envelopes require store/repository results to match trusted idempotency scope before returning success
- repository row mapping no longer backfills scoped row fields from lookup/record context when rows are malformed
- missing/malformed context, malformed replay/write rows, missing write rows, cross-org rows, wrong-tenant rows, wrong-draft rows, wrong-idempotency-key rows, and repository/query failures fail closed
- focused tests use fake/synthetic query clients only

### Task2318

Task2318 added a no-runtime-change static boundary guard for the Task2317 idempotency adapter/repository seam.

Accepted status:

- the guard reads source, test, and doc files as text only
- it freezes trusted idempotency context fields and client-controlled override prevention
- it freezes lookup and record scoping
- it freezes fail-closed row mapping and missing/malformed write result behavior
- it confirms raw leakage and no-mutation coverage remain present
- it confirms no forbidden runtime/env/provider/deploy/server/migration behavior is introduced

## Current DB-Backed Seam Status

### Draft Reader

- The draft reader adapter/repository now requires trusted organization and draft scope.
- Draft lookup is organization scoped and tenant scoped when tenant is present.
- Draft lookup is parameterized behind an injected query/repository client only.
- Missing/malformed/cross-org/wrong-tenant draft data fails closed.
- Draft reader tests use fake/injected clients only.

### Idempotency

- The idempotency adapter/repository now requires trusted organization, draft, operation, idempotency key, and tenant scope when tenant is present.
- Idempotency lookup and record/write paths are parameterized and scoped.
- Replay/record results must match trusted scope before success is returned.
- Missing/malformed/cross-org/wrong-tenant/wrong-draft/wrong-idempotency-key data fails closed.
- Idempotency tests use fake/synthetic clients only.

### Execution Boundary

- No real DB execution has occurred.
- No SQL has been executed against a database.
- No DB connection has been created.
- No migration has been created, dry-run, or applied.
- No route/controller/public/open route behavior has changed.
- No smoke, endpoint probe, server/listener startup, deploy, staging/prod traffic, provider sending, env/Zeabur/secrets inspection, package change, Customer Access change, Engineer Mobile change, admin frontend change, billing change, or AI/RAG runtime behavior has occurred.

## Current Safety Status

- `body`, `draftInput`, `query`, `headers`, and client-controlled fields cannot override trusted draft reader or idempotency scope.
- Cross-organization, wrong-tenant, wrong-draft, and wrong-idempotency-key data fails closed.
- Malformed rows and malformed/missing write results fail closed.
- Repository/query errors fail closed without raw leakage.
- Raw DB rows, SQL, stack traces, database errors, provider payloads, AI/RAG, billing, audit internals, token/password/secret fields, customer private/contact/address fields, and raw service payloads are not exposed by the accepted seams.
- Input objects and DB row/result objects are covered by no-mutation tests.

## Non-Authorized Candidate Next Tasks

The following are candidates only. None are authorized by this checkpoint.

- DB-backed case creator transaction skeleton, only if PM explicitly authorizes the exact source boundary.
- Case planner/creator repository contract guard before transaction work.
- Audit persistence implementation, only if PM explicitly authorizes audit table and failure-mode behavior.
- Migration/schema dry-run authorization packet, only if PM authorizes disposable DB or dry-run scope.
- Runtime port factory wiring, only if PM explicitly selects the exact source boundary.

## Verification Boundary

Task2319 requires documentation verification only:

- `git diff --check`
- `git diff --cached --check` if staged
- `git status --short --branch`

No tests are added or required for this docs-only checkpoint. No DB, migration, smoke, endpoint, server, provider, env, Zeabur, or secrets command is authorized.

## Held Docs

The same 7 held historical untracked docs remain outside Task2319 scope and must stay untouched unless PM explicitly authorizes that exact action.
