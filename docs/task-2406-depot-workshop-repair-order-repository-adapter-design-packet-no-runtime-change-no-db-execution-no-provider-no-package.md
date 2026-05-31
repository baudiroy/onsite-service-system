# Task2406 Depot Workshop Repair Order Repository Adapter Design Packet

## Scope

Task2406 adds a repository adapter design packet for a future Depot / Workshop repair order SQL repository adapter.

This is docs/static-only. It does not implement the adapter, execute DB/SQL, run migration dry-run/apply, enable route write scope, change runtime/source behavior, inspect env/Zeabur/secrets, send provider payloads, change packages, create formal Field Service Report / Completion Report behavior, or mutate `finalAppointmentId`.

## Future Adapter Boundary

Suggested future adapter file:

- `src/repositories/DepotWorkshopRepairOrderSqlRepositoryAdapter.js`

Suggested future exported factory/function name:

- `createDepotWorkshopRepairOrderSqlRepositoryAdapter`

Accepted dependency shape:

- explicit injected `dbClient`
- optional clock only if needed
- optional id generator only if needed
- no global DB pool
- no `process.env`
- no `DATABASE_URL`
- no Zeabur/env/secrets access

Accepted input:

- normalized repository write command from `normalizeDepotWorkshopRepairOrderRepositoryWriteCommand`

Accepted output:

- normalized result through `normalizeDepotWorkshopRepairOrderRepositoryResult`

Target table:

- `depot_workshop_repair_orders`

Write rule:

- no write if contract normalization fails
- fail closed on thrown, rejected, malformed DB result, missing organization scope, missing case scope, missing source reference, or unsafe projection/audit content

## Future SQL Behavior Design

Future SQL behavior is design-level only in this task.

Candidate write shape:

- parameterized insert/upsert candidate only
- organization/tenant scoped write candidate
- `repair_order_ref` uniqueness within organization scope
- `request_id` idempotency behavior candidate when present
- safe JSON handling for `metadata_safe`
- safe JSON handling for `customer_projection_safe`
- no raw DB row return
- no raw SQL/error/stack exposure

The future adapter should map only the repository contract's safe fields to migration 028 columns. It should return a normalized repository result and keep raw database results internal.

## Forbidden Adapter Behavior

The future adapter must not include:

- global DB creation
- global DB pool creation
- `process.env`
- `DATABASE_URL`
- SQL execution in Task2406
- migration apply/dry-run
- route write scope
- provider sending
- formal Field Service Report behavior
- formal Completion Report behavior
- `finalAppointmentId`
- billing/payment/invoice behavior
- AI/RAG raw output
- raw DB row exposure
- raw SQL/error/stack exposure
- password/token/secret/debug payload exposure

## Next Task Options

Possible next tasks:

- pure adapter implementation with fake injected `dbClient` tests
- disposable DB dry-run authorization packet
- route write-scope integration decision gate

Recommended next bounded task: pure adapter implementation with fake injected `dbClient` tests.

Reason: migration 028 static review is closed for this phase, and the repository contract is already accepted. A fake-injected-db implementation task can validate parameterized query specs, fail-closed behavior, and result normalization without real DB execution, migration apply, route write scope, provider sending, or package changes.

Do not recommend real DB execution until a disposable DB target/tooling is explicitly authorized by PM.

## Non-Authorization

Task2406 does not authorize:

- runtime/source behavior changes
- repository adapter implementation
- DB adapter implementation
- migration file changes
- route write-scope behavior
- route response source changes
- route wiring changes
- route path or mount changes
- helper wiring into existing runtime
- permission changes
- service behavior changes
- controller creation
- DB commands
- SQL execution against DB
- real DB connection
- migration dry-run/apply
- `DATABASE_URL`, Zeabur, env, or secrets inspection
- server/listener startup
- smoke test execution
- endpoint probes
- shared runtime
- deploy
- staging/prod traffic
- `/healthz`
- provider sending
- package or package-lock changes
- auth/session middleware changes
- permission model changes, role expansion, or organization isolation source changes
- AI/RAG/OpenAI/vector DB runtime behavior
- admin frontend behavior
- billing/settlement/payment/invoice behavior
- Customer Access runtime behavior changes
- Engineer Mobile runtime behavior changes
- Repair Intake runtime behavior changes
- formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior
- `finalAppointmentId` mutation path

## Held Docs

The 7 held historical docs remain outside Task2406 scope and must stay untracked, unstaged, and untouched.
