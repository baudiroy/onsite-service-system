# Task2419 Depot Workshop Assignment Intent Route Write Scope Decision Packet

## Scope

Task2419 records a future route write-scope decision packet for the Depot / Workshop assignment-intent route.

This is docs/static-only. It does not enable route writes, wire `writePreparedAssignmentIntent` into the route, change runtime/source behavior, change route response source, change route path or mount, change helper/service wiring, change permissions, change service behavior, create controllers, change repository adapters, wire DB adapters, run DB commands, execute SQL, connect to a real DB, change migrations, perform migration dry-run/apply, inspect `DATABASE_URL`, Zeabur, env, or secrets, start a server/listener, run smoke tests, probe endpoints, deploy, send providers, change packages, change auth/session middleware, change permission models, change AI/RAG behavior, change admin frontend behavior, change billing behavior, change formal Field Service Report / Completion Report behavior, or mutate `finalAppointmentId`.

## Current Accepted State

Current route state:

- route path remains `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`
- route permission remains `depot.repair.prepare`
- route handler resolves the service through `prepareAssignmentIntent`
- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`
- `writePreparedAssignmentIntent` is not route-wired
- route response presenter remains the accepted admin-safe presenter

Current service and persistence state:

- `WorkshopAssignmentService.prepareAssignmentIntent` remains prepare-only
- `prepareAssignmentIntent` returns `written: false`
- prepared assignment intent carries `writeRequired: false`
- `WorkshopAssignmentService.writePreparedAssignmentIntent` exists as a separate service method
- `writePreparedAssignmentIntent` uses the accepted write command helper
- `writePreparedAssignmentIntent` uses explicit injected `repairOrderRepository.writeRepairOrder`
- `writePreparedAssignmentIntent` normalizes repository results through the accepted repository contract
- SQL repository adapter exists but remains unwired from routes/services/controllers/runtime factory
- SQL repository adapter is fake-client tested only
- write command to repository adapter fake-chain verification uses fake/in-memory injected `dbClient` only
- migration 028 exists but has not been dry-run or applied
- disposable DB dry-run remains paused because no safe disposable target/tooling was provided

## Current Blockers

The current blockers before future route write scope are:

- migration 028 exists but has not been dry-run/applied
- no disposable DB target/tooling has been provided
- SQL repository adapter is fake-client tested only
- write command to repository adapter chain is fake-only
- `writePreparedAssignmentIntent` exists but is not route-wired
- route write scope remains blocked
- real DB execution remains unauthorized
- migration dry-run/apply remains unauthorized
- env/Zeabur/secrets inspection remains forbidden

## Route Write-Scope Options

### Option A: keep current assignment-intent route prepare-only.

Pros:

- preserves the accepted route safety boundary
- keeps `depot_repair_route_write_scope_not_approved` as the active denial signal
- avoids route/runtime writes before DB dry-run and repository verification are complete
- keeps the existing presenter behavior stable

Cons:

- does not yet expose persistence through the route
- requires a later exact PM task for route write behavior

### Option B: add a separate explicit write route in future.

Pros:

- creates a clearer separation between prepare and persist actions
- can use an exact write action name and permission
- can bind only to `writePreparedAssignmentIntent` after repository/DB blockers are cleared
- makes rollback/stop conditions easier to isolate from the prepare route

Cons:

- still requires DB dry-run, repository adapter verification, request/response design, permission design, and explicit PM authorization
- may add a new route path or mount that must be reviewed separately

### Option C: add conditional write behavior to existing route.

Pros:

- keeps the current endpoint shape
- could reuse existing request context and presenter shell

Cons:

- risks blurring the accepted prepare-only route boundary
- makes write denial and write success behavior share one handler
- is unsafe before DB dry-run, repository verification, exact action/permission design, rollback conditions, and presenter behavior are accepted

### Option D: defer route write scope until disposable DB dry-run and repository verification are complete.

Pros:

- keeps runtime route behavior blocked while persistence readiness is unresolved
- matches the current paused DB status
- prevents route write behavior from becoming the first real DB integration step

Cons:

- delays route write-scope implementation until separate safe verification tasks are complete

## Recommended Future Route Strategy

Recommended future route strategy: keep current assignment-intent route prepare-only until disposable DB dry-run and repository verification are complete.

Why:

- it preserves the current accepted route boundary
- it keeps `prepareAssignmentIntent` as the only route-wired service method
- it keeps `writePreparedAssignmentIntent` available as an unwired service boundary only
- it avoids immediate route write-scope implementation while migration 028 and repository adapter verification remain blocked
- it avoids real DB, migration, provider, package, formal report, and `finalAppointmentId` risk

This packet does not recommend immediate route write-scope implementation.

## Future Route Write-Scope Prerequisites

Before any future route write scope, a separate exact PM task must authorize and define:

- explicit PM authorization for the exact route write-scope task
- DB migration dry-run or equivalent safe verification
- repository adapter verification beyond fake-client-only coverage
- exact write action name and permission
- exact route strategy and request shape
- request validation and trusted scope rules
- response presenter behavior and safe allowlisted fields
- rollback/stop conditions
- no provider sending unless separately authorized
- no billing/settlement/payment/invoice behavior unless separately authorized
- no formal Field Service Report / Completion Report behavior
- no `finalAppointmentId` mutation
- no smoke/staging/prod rollout unless separately authorized

## Static Guard Coverage

`tests/depotWorkshop/depotWorkshopAssignmentIntentRouteWriteScopeDecision.static.test.js` verifies:

- Task2419 decision packet exists
- current route write-scope denial marker remains visible
- current route remains prepare-only
- `writePreparedAssignmentIntent` remains not route-wired
- Task2419 compares the required route write-scope options
- Task2419 recommends exactly one future route strategy
- Task2419 records current blockers and prerequisites
- Task2419 introduces no source/runtime behavior change
- Task2419 introduces no DB/migration/provider/package/formal-report/`finalAppointmentId` authorization

## Non-Authorization

Task2419 does not authorize:

- runtime/source behavior changes
- route write-scope behavior
- route response source changes
- route wiring changes
- route path or mount changes
- helper/service write-method wiring into route
- permission changes
- service behavior changes
- controller creation
- repository adapter changes
- DB adapter runtime wiring
- DB commands
- SQL execution against any DB
- real DB connection
- migration file changes
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

The 7 held historical docs remain outside Task2419 scope and must stay untracked, unstaged, and untouched.
