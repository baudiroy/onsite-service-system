# Task2392 Depot Workshop Assignment Intent Route Write Scope Authorization Packet

## Scope

Task2392 records the authorization prerequisites for any future Depot / Workshop assignment-intent route write-scope change.

This is a docs/static-only authorization packet. It does not enable route writes, change runtime/source behavior, change route response source, change route path or mount, change helper wiring, change permissions, change service behavior, add controllers, add repositories, add DB behavior, create migrations, send providers, add packages, run smoke tests, start servers, inspect env/secrets, deploy, or touch staging/prod traffic.

## Current Accepted State

The current accepted state remains:

- route path remains `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`
- permission remains `depot.repair.prepare`
- route remains prepare-only
- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`
- `WorkshopAssignmentService.prepareAssignmentIntent` remains the accepted service boundary
- service returns `written: false`
- `assignmentIntent.writeRequired` remains `false`
- response presenter is wired through `successBody(result, req = {})`
- successful responses delegate to `presentDepotWorkshopAssignmentIntentResponse(result, { requestId })`
- response presenter exposes only admin-safe allowlisted summaries under `data.depotRepair`
- helper-derived service objects are not exposed wholesale

## Future Write-Scope Prerequisites

Before the existing route can move beyond prepare-only behavior, all of the following must be separately authorized and satisfied:

- exact write action name and route behavior must be separately authorized
- repository/persistence contract must exist before write scope is enabled
- DB/migration authorization must be explicit before persistence
- organization, tenant, brand, service-provider, and subcontractor access must be enforced
- transition policy must validate any status transition
- audit intent must remain internal-only and sanitized
- customer projection must remain allowlisted and must not become publication
- provider sending must remain separately authorized
- no formal Field Service Report / Completion Report creation, approval, publication, or finalization
- no `finalAppointmentId` mutation path
- no billing, settlement, payment, or invoice behavior without separate exact PM authorization
- no AI/RAG expansion without separate exact PM authorization
- no smoke, staging, or production rollout without separate exact PM authorization

## Future Approach Comparison

Option A: keep route prepare-only and add repository/migration authorization first.

- Pros: keeps runtime blocked while persistence shape, migration boundaries, and rollback expectations are reviewed first.
- Cons: does not yet define a pure write command contract.

Option B: add a pure write command/helper design packet before route write scope.

- Pros: defines command input/output, access prerequisites, transition validation, audit intent handling, and presenter compatibility without enabling writes.
- Cons: still requires a later repository/DB authorization packet before persistence can exist.

Option C: add route write-scope runtime behavior after repository/DB contract exists.

- Pros: closest to enabling the route to persist accepted assignment intent.
- Cons: unsafe before a write command contract, repository contract, migration authorization, and runtime verification plan exist.

Option D: keep all write behavior blocked until DB/migration tooling is available.

- Pros: lowest runtime risk.
- Cons: can delay command contract and access-rule design that can be reviewed without DB access.

## Recommended Next Bounded Task

Recommended next bounded task: pure write command/helper design packet.

Why: it is safer than route write-scope runtime changes because it can define the future write command contract, exact write action name, access prerequisites, transition validation, internal audit handling, customer projection boundaries, presenter compatibility, and non-authorization limits without changing route/source behavior or requiring DB/migration/provider/package access.

Repository/migration authorization should follow only after the pure write command/helper design packet is accepted.

## Static Guard Coverage

Task2392 adds:

- `tests/depotWorkshop/depotWorkshopAssignmentIntentRouteWriteScopeAuthorization.static.test.js`

The static guard reads source/doc/test files only and asserts:

- route write scope denial marker remains visible
- `written: false` remains visible
- `assignmentIntent.writeRequired` remains `false`
- presenter wiring remains visible
- current route path and permission remain visible
- current service boundary remains `WorkshopAssignmentService.prepareAssignmentIntent`
- Task2392 records the future write-scope prerequisites
- Task2392 recommends exactly one next bounded task
- Task2392 does not authorize DB/migration/provider/package/smoke behavior
- Task2392 does not authorize formal Field Service Report / Completion Report / `finalAppointmentId` mutation behavior

## Non-Authorization

Task2392 does not authorize:

- runtime/source behavior changes
- route response source changes
- route write-scope behavior
- route path or mount changes
- helper wiring changes
- permission changes
- service behavior changes
- controller creation
- repository implementation
- new DB behavior
- DB commands
- SQL execution
- real DB connection
- migration creation
- migration dry-run or apply
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

The 7 held historical docs remain outside Task2392 scope and must stay untracked, unstaged, and untouched.
