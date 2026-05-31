# Task2408 Depot Workshop Repair Order SQL Repository Adapter Static Portfolio Guard

## Scope

Task2408 adds a static portfolio guard for the accepted Depot / Workshop repair order SQL repository adapter from Task2406 and Task2407.

This is a no-runtime-change docs/static task. It does not change adapter implementation, wire the adapter into routes, services, controllers, runtime factories, or application flow, connect to a real DB, execute SQL against a real DB, run migration dry-run/apply, enable route write scope, send providers, change packages, create formal Field Service Report / Completion Report behavior, or mutate `finalAppointmentId`.

## Current Adapter Status

Accepted adapter file:

- `src/repositories/DepotWorkshopRepairOrderSqlRepositoryAdapter.js`

Accepted export:

- `createDepotWorkshopRepairOrderSqlRepositoryAdapter`

Current boundary:

- explicit injected `dbClient`
- `dbClient.query` or `dbClient.execute`
- no global DB pool
- no `process.env`
- no `DATABASE_URL`
- no Zeabur/env/secrets access
- no runtime factory wiring
- no route/service/controller wiring

Accepted contract helpers:

- `normalizeDepotWorkshopRepairOrderRepositoryWriteCommand`
- `normalizeDepotWorkshopRepairOrderRepositoryResult`
- `buildDepotWorkshopRepairOrderRepositorySafeFailure`

Target table:

- `depot_workshop_repair_orders`

## Fake-Client Test Coverage

Task2407 fake-client tests cover:

- valid normalized write command calls fake `dbClient` with parameterized SQL and values
- successful fake DB result normalizes into a safe repository result
- missing/malformed command fails closed before fake DB call
- fake DB thrown and rejected errors fail closed without raw leakage
- malformed fake DB result fails closed
- cross-scope-looking fake DB result fails closed
- SQL text does not interpolate raw organization/case/private values
- no formal FSR / Completion Report / finalAppointmentId fields are emitted
- input command and fake DB result objects are not mutated

Task2408 portfolio guard freezes that coverage by checking the Task2406 design packet, Task2407 doc/tests, adapter source, repository contract, migration 028, and current route write-scope denial.

## No-Real-DB And No-Runtime-Wiring Boundaries

Task2408 confirms:

- no real DB execution occurred
- no SQL execution against a real DB occurred
- no migration dry-run/apply occurred
- no real DB connection occurred
- no env/Zeabur/secrets were inspected
- no route/service/controller/runtime wiring occurred
- no adapter implementation change occurred
- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`
- migration 028 remains an unapplied schema artifact until separately authorized
- no provider sending occurred
- no package or package-lock changes occurred
- no formal Field Service Report / Completion Report behavior was added
- no finalAppointmentId mutation path was added

## Static Portfolio Guard Coverage

Added:

- `tests/depotWorkshop/depotWorkshopRepairOrderSqlRepositoryAdapterPortfolio.static.test.js`

The guard asserts:

- Task2406 design packet exists
- Task2407 adapter doc/tests exist
- adapter file exists
- `createDepotWorkshopRepairOrderSqlRepositoryAdapter` export remains present
- adapter accepts an explicit injected `dbClient`
- adapter uses the accepted repository contract helpers
- adapter targets `depot_workshop_repair_orders`
- adapter builds parameterized SQL text plus a frozen values array
- adapter has no global DB pool / `process.env` / `DATABASE_URL` / Zeabur / secrets access
- adapter is not wired into routes/services/controllers/runtime factory
- route write scope remains blocked
- migration 028 exists and targets `depot_workshop_repair_orders`
- no real DB command / migration dry-run / migration apply authorization is introduced
- no raw DB rows are returned wholesale
- no raw SQL errors / stack traces are exposed
- no token/password/secret payloads are exposed
- no provider payloads are exposed
- no billing payloads are exposed
- no AI/RAG payloads are exposed
- no raw audit payloads are exposed beyond sanitized intent handling
- no formal FSR / Completion Report behavior is introduced
- no finalAppointmentId mutation is introduced
- no package dependency expansion is introduced

## Non-Authorized Future Candidates

Possible next tasks, not authorized by Task2408:

- adapter branch closure
- disposable DB dry-run authorization packet
- runtime factory/service wiring decision gate
- route write-scope decision packet

Task2408 does not authorize any real DB, migration apply, route write-scope, runtime wiring, provider, package, billing, AI/RAG, formal report, or finalAppointmentId work.

## Held Docs

The 7 held historical docs remain outside Task2408 scope and must stay untracked, unstaged, and untouched.
