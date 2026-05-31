# Task2407 Depot Workshop Repair Order SQL Repository Adapter Fake-Client Implementation

## Scope

Task2407 implements the Depot / Workshop repair order SQL repository adapter behind an explicit injected fake/test `dbClient` seam only.

This task adds the adapter module, fake-client unit tests, a static boundary guard, and this short task note. It does not wire the adapter into routes, services, controllers, runtime factories, or application flow. It does not connect to a real DB, run migration dry-run/apply, enable route write scope, send providers, change packages, create formal Field Service Report / Completion Report behavior, or mutate `finalAppointmentId`.

## Added Adapter

Added:

- `src/repositories/DepotWorkshopRepairOrderSqlRepositoryAdapter.js`

Exported factory:

- `createDepotWorkshopRepairOrderSqlRepositoryAdapter`

Accepted dependencies:

- explicit injected `dbClient`
- `dbClient.query` or `dbClient.execute`

No global DB pool, `process.env`, `DATABASE_URL`, Zeabur/env/secrets access, or package dependency additions were introduced.

## SQL Repository Adapter Contract

The adapter uses the accepted repository contract:

- input normalization: `normalizeDepotWorkshopRepairOrderRepositoryWriteCommand`
- output normalization: `normalizeDepotWorkshopRepairOrderRepositoryResult`
- safe failure: `buildDepotWorkshopRepairOrderRepositorySafeFailure`

Target table:

- `depot_workshop_repair_orders`

Fake-client SQL behavior:

- builds parameterized SQL only
- sends SQL text plus values array to injected fake/test `dbClient`
- does not interpolate trusted values directly into SQL strings
- includes organization/case/source scope fields
- includes `depot_status` from upstream command state
- includes safe JSON `metadata_safe` and `customer_projection_safe` values only
- uses `repair_order_ref` upsert behavior aligned with migration 028
- returns normalized repository result only
- does not return raw DB rows wholesale

## Fake-Client Behavior

The unit tests prove:

- valid normalized write command calls fake `dbClient` with parameterized SQL and values
- successful fake DB result normalizes into safe repository result
- missing/malformed command fails closed before fake DB call
- fake DB thrown error fails closed without raw leakage
- fake DB rejected error fails closed without raw leakage
- malformed fake DB result fails closed
- cross-scope-looking fake DB result fails closed
- SQL is parameterized and does not contain raw organization/case/private values interpolated into SQL text
- no formal FSR / Completion Report / finalAppointmentId fields are emitted
- input command and fake DB result objects are not mutated

## Static Guard Coverage

The static boundary guard confirms:

- adapter imports only the accepted repository contract helper
- adapter has no global DB pool / env / `DATABASE_URL` / Zeabur / secrets access
- adapter remains fake-client injectable and parameterized
- adapter is not wired into routes/services/controllers/runtime factory
- route write scope remains blocked in `src/routes/depotRepair.routes.js`
- migration 028 exists and targets `depot_workshop_repair_orders`
- no real DB command / migration dry-run / migration apply authorization is introduced
- no provider/package/formal-report/finalAppointmentId behavior is introduced

## Non-Execution Record

No real DB execution occurred.

No SQL execution against a real DB occurred.

No migration dry-run/apply occurred.

No real DB connection occurred.

No env/Zeabur/secrets were inspected.

No route/service/controller/runtime wiring occurred.

No provider sending occurred.

No package or package-lock changes occurred.

No formal Field Service Report / Completion Report behavior was added.

No finalAppointmentId mutation path was added.

## Held Docs

The 7 held historical docs remain outside Task2407 scope and must stay untracked, unstaged, and untouched.
