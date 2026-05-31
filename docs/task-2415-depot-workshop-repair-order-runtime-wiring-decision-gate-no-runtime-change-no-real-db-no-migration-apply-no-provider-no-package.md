# Task2415 Depot Workshop Repair Order Runtime Wiring Decision Gate

## Scope

Task2415 records a future runtime wiring decision gate for the Depot / Workshop repair order write command and SQL repository adapter.

This is docs/static-only. It does not change runtime/source behavior, adapter implementation, repository adapter wiring, DB adapter runtime wiring, route write scope, route response source, route path or mount, service behavior, controller behavior, permissions, migration files, package files, provider sending, billing behavior, AI/RAG behavior, formal Field Service Report / Completion Report behavior, or `finalAppointmentId`.

## Current Accepted Context

The following artifacts are accepted context for this decision:

- pure repair order helpers exist for state model, contract, transition policy, audit event, and customer projection
- `WorkshopAssignmentService.prepareAssignmentIntent` remains prepare-only and returns `written: false`
- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`
- route response presenter remains admin-safe and allowlisted
- `buildDepotWorkshopAssignmentIntentWriteCommand` exists as a pure write command helper
- `normalizeDepotWorkshopRepairOrderRepositoryWriteCommand` and `normalizeDepotWorkshopRepairOrderRepositoryResult` define the repository contract
- `createDepotWorkshopRepairOrderSqlRepositoryAdapter` exists and accepts only explicit injected `dbClient`
- fake-chain verification proved write command -> repository contract -> fake SQL adapter -> safe repository result with fake/in-memory injected `dbClient` only
- migration 028 exists at `migrations/028_create_depot_workshop_repair_orders.sql`
- migration 028 has not been applied or dry-run
- DB dry-run authorization is closed/paused because no disposable target/tooling was provided

## Current Blockers

Current blockers before any real runtime wiring are:

- migration 028 exists but has not been applied or dry-run
- no disposable DB target/tooling has been provided
- repository adapter is fake-client tested only and unwired
- route write scope remains blocked
- DB work remains paused by the Task2414 closure
- env/secret discovery remains forbidden
- real DB execution and SQL execution remain unauthorized

## Compared Future Wiring Boundaries

### `WorkshopAssignmentService.prepareAssignmentIntent`

Decision: not recommended.

Reason: this boundary is already accepted as prepare-only. It builds internal draft, transition, audit, and customer projection previews and deliberately returns `written: false` and `writeRequired: false`. Wiring repository writes here would blur the read/prepare path with persistence and would weaken the existing route denial signal.

### New service method separate from prepare intent

Decision: recommended.

Recommended future boundary: `src/services/WorkshopAssignmentService.js#createWorkshopAssignmentService().writePreparedAssignmentIntent`

Reason: a separate method keeps `prepareAssignmentIntent` read/prepare-only, gives future runtime wiring a narrow command boundary, and can require explicit dependency injection for the repository adapter. It can accept an already prepared assignment intent plus trusted scope, call the write command helper, pass the normalized command to the injected repository, and return only the accepted repository contract result. This boundary can be fake-composition tested without route write-scope enablement or real DB execution.

### Route write-scope handler

Decision: not recommended.

Reason: route write scope remains blocked. Enabling route write behavior before repository/DB readiness and before a separate PM authorization would bypass the current safety gates. Future route work must stay downstream of repository readiness, dependency composition readiness, and a separate route write-scope authorization.

### Runtime factory / dependency composition boundary

Decision: not recommended.

Reason: dependency composition is required later, but it is not the first runtime behavior boundary. It should compose an already accepted service method and injected repository after the fake-only service method contract is proven. It must not create global DB access, inspect env, or touch `DATABASE_URL`.

### Repository adapter direct use

Decision: not recommended.

Reason: direct adapter use would skip service-level permission, trusted scope, status transition, and presenter-safe result boundaries. Repository access must stay behind the write command and service boundary so raw DB rows, raw errors, route internals, provider payloads, formal report data, and final appointment mutation paths remain excluded.

## Recommended Boundary Rules

The recommended future boundary is exactly one: `WorkshopAssignmentService.writePreparedAssignmentIntent` as a new service method separate from `prepareAssignmentIntent`.

Required rules for that future boundary:

- repository adapter must be provided through explicit dependency injection
- no global DB access
- no env access
- no `DATABASE_URL` access
- route write scope requires separate authorization
- write command helper must validate trusted scope and permission
- transition policy must validate status transitions
- repository result must be normalized through the accepted contract
- presenter response must remain admin-safe and must not expose raw internals
- no provider sending
- no formal Field Service Report / Completion Report behavior
- no `finalAppointmentId` mutation

## Future Runtime Wiring Prerequisites

Before any future runtime wiring, a separate exact PM task must authorize the specific bounded step and preserve:

- explicit injected repository dependency
- fake-only composition unless a disposable DB target/tooling is separately authorized
- no global DB pool
- no env/Zeabur/secrets inspection
- no real DB connection
- no migration dry-run/apply
- no route write-scope behavior unless separately authorized
- no provider sending
- no billing/settlement/payment/invoice behavior
- no AI/RAG/OpenAI/vector DB runtime behavior
- no formal Field Service Report / Completion Report behavior
- no `finalAppointmentId` mutation path

## Recommended Next Bounded Task

Recommended next bounded task: fake-runtime composition test only for `WorkshopAssignmentService.writePreparedAssignmentIntent`.

Reason: fake-chain verification is already accepted, and a fake-runtime composition test can prove the recommended service method boundary with an injected fake repository only. It must not authorize real DB execution, SQL execution against a real DB, migration dry-run/apply, env/secret inspection, route write scope, provider sending, package changes, smoke tests, endpoint probes, or runtime factory/global DB wiring.

Do not recommend real DB execution.

Do not recommend migration apply.

Do not recommend route write-scope implementation.

Do not recommend runtime factory/global DB wiring yet.

## Static Guard Coverage

`tests/depotWorkshop/depotWorkshopRepairOrderRuntimeWiringDecisionGate.static.test.js` reads docs/source/migration text only. It verifies:

- decision gate doc exists
- pure helpers / write command / repository contract / adapter / fake-chain / migration 028 artifacts remain visible
- DB dry-run paused closure remains visible
- route write scope remains blocked
- decision gate compares the required future wiring boundaries
- decision gate recommends exactly one future boundary
- decision gate recommends exactly one next bounded task
- no runtime/source behavior is changed by Task2415
- no DB/migration/provider/package/formal-report/finalAppointmentId authorization is introduced
- no executable DB/migration command authorization or real-looking credential appears

## Non-Authorization Record

Task2415 does not authorize runtime/source behavior changes.

Task2415 does not authorize adapter implementation changes.

Task2415 does not authorize repository adapter wiring.

Task2415 does not authorize DB adapter runtime wiring.

Task2415 does not authorize route write-scope behavior.

Task2415 does not authorize route response source changes.

Task2415 does not authorize route path or mount changes.

Task2415 does not authorize helper wiring into existing runtime.

Task2415 does not authorize permission changes.

Task2415 does not authorize service behavior changes.

Task2415 does not authorize controller creation.

Task2415 does not authorize DB commands.

Task2415 does not authorize SQL execution against any DB.

Task2415 does not authorize real DB connection.

Task2415 does not authorize migration file changes.

Task2415 does not authorize migration dry-run/apply.

Task2415 does not authorize `DATABASE_URL`, Zeabur, env, or secrets inspection.

Task2415 does not authorize server/listener startup.

Task2415 does not authorize smoke test execution.

Task2415 does not authorize endpoint probes.

Task2415 does not authorize shared runtime, deploy, staging, or production traffic.

Task2415 does not authorize `/healthz`.

Task2415 does not authorize provider sending.

Task2415 does not authorize package or package-lock changes.

Task2415 does not authorize auth/session middleware changes.

Task2415 does not authorize permission model changes, role expansion, or organization isolation source changes.

Task2415 does not authorize AI/RAG/OpenAI/vector DB runtime behavior.

Task2415 does not authorize admin frontend behavior.

Task2415 does not authorize billing/settlement/payment/invoice behavior.

Task2415 does not authorize Customer Access runtime behavior changes.

Task2415 does not authorize Engineer Mobile runtime behavior changes.

Task2415 does not authorize Repair Intake runtime behavior changes.

Task2415 does not authorize formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.

Task2415 does not authorize `finalAppointmentId` mutation path.

## Held Docs

The 7 held historical docs remain outside Task2415 scope and must stay untracked, unstaged, and untouched.
