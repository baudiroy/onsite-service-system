# Task2417 Depot Workshop Write Prepared Assignment Intent Service Method Static Portfolio Guard

## Scope

Task2417 freezes the accepted `WorkshopAssignmentService.writePreparedAssignmentIntent` service method boundary from Task2416.

This is a docs/static-only task. Task2417 authorizes no runtime/source behavior changes.

## Current Service Method Boundary

Accepted service boundary:

- `WorkshopAssignmentService.prepareAssignmentIntent`
- `WorkshopAssignmentService.writePreparedAssignmentIntent`

Current boundary status:

- `prepareAssignmentIntent` remains prepare-only
- `prepareAssignmentIntent` keeps `written: false`
- prepared assignment intent keeps `writeRequired: false`
- `writePreparedAssignmentIntent` remains separate from `prepareAssignmentIntent`
- `writePreparedAssignmentIntent` uses `buildDepotWorkshopAssignmentIntentWriteCommand`
- `writePreparedAssignmentIntent` uses injected `repairOrderRepository`
- `writePreparedAssignmentIntent` requires `repairOrderRepository.writeRepairOrder`
- `writePreparedAssignmentIntent` normalizes results with `normalizeDepotWorkshopRepairOrderRepositoryResult`
- `written` is normalized repository result evidence only and does not authorize route write scope

## Current Safety Status

Accepted Task2416 tests prove:

- missing repository dependency fails closed
- malformed input fails closed before fake write
- missing trusted scope fails closed before fake write
- missing write authorization fails closed before fake write
- invalid transition fails closed before fake write
- repository throw/reject/malformed/cross-scope results fail closed
- no raw DB rows / SQL / stack / token / password / secret leakage
- no provider / billing / AI/RAG payload leakage
- no formal FSR / Completion Report behavior
- no finalAppointmentId mutation
- input objects and fake repository result objects are not mutated

## No-Real-DB / No-Route-Write / No-Runtime-Wiring Boundaries

Current non-authorization boundary:

- no direct SQL repository adapter import into `WorkshopAssignmentService`
- no SQL repository adapter instantiation in `WorkshopAssignmentService`
- no DB client creation
- no env access
- no `DATABASE_URL` access
- no Zeabur or secrets access
- no route/controller/runtime factory wiring
- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`
- no route path or mount changes
- no provider sending
- no package or package-lock changes
- no formal Field Service Report / Completion Report behavior
- no finalAppointmentId mutation path

## Non-Authorized Next Candidates

The following are possible next tasks only. Task2417 does not authorize them:

- service write-method branch closure
- runtime factory/service wiring decision follow-up
- route write-scope decision packet
- disposable DB dry-run tooling check
- repository adapter disposable DB verification packet

## Static Portfolio Guard Coverage

`tests/depotWorkshop/workshopAssignmentServiceWritePreparedAssignmentIntentPortfolio.static.test.js` verifies:

- Task2415 decision gate exists
- Task2416 doc/tests exist
- `WorkshopAssignmentService` has separate `prepareAssignmentIntent` and `writePreparedAssignmentIntent`
- `prepareAssignmentIntent` remains prepare-only with `written: false` / `writeRequired: false`
- `writePreparedAssignmentIntent` uses accepted write command helper and injected repository dependency only
- `writePreparedAssignmentIntent` does not import or instantiate SQL repository adapter directly
- `writePreparedAssignmentIntent` has no DB client / env / `DATABASE_URL` / Zeabur / secrets usage
- `writePreparedAssignmentIntent` is not wired into routes/controllers/runtime factory
- route write scope remains blocked
- fail-closed and no-leakage coverage remains visible

## Non-Execution Record

No runtime/source behavior changed.

No service method implementation changed.

No repository adapter wiring occurred.

No DB adapter runtime wiring occurred.

No route write-scope behavior changed.

No route response source changed.

No route wiring/path/mount changed.

No helper wiring into existing runtime occurred.

No permission changes occurred.

No controller was created.

No DB commands were run.

No SQL execution against a real DB occurred.

No real DB connection occurred.

No migration file changed.

No migration dry-run/apply occurred.

No `DATABASE_URL`, Zeabur, env, or secrets were inspected.

No server/listener was started.

No smoke test or endpoint probe was run.

No shared runtime, deploy, staging, or production traffic occurred.

No `/healthz` probe was run.

No provider sending occurred.

No package or package-lock changes occurred.

No formal Field Service Report / Completion Report behavior was added.

No finalAppointmentId mutation path was added.

## Held Docs

The 7 held historical docs remain outside Task2417 scope and must stay untracked, unstaged, and untouched.
