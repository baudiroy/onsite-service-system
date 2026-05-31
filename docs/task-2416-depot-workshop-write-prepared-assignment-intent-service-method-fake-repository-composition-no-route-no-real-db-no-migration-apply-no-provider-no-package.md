# Task2416 Depot Workshop Write Prepared Assignment Intent Service Method Fake Repository Composition

## Scope

Task2416 adds the bounded service method selected by Task2415:

- `WorkshopAssignmentService.writePreparedAssignmentIntent`

This method is separate from `prepareAssignmentIntent`. It uses only an explicit injected `repairOrderRepository` seam and does not wire routes, controllers, runtime factory, application flow, real DB, migration execution, provider sending, package changes, formal Field Service Report / Completion Report behavior, or `finalAppointmentId`.

## Service Boundary

Changed file:

- `src/services/WorkshopAssignmentService.js`

Added behavior:

- `createWorkshopAssignmentService(options).writePreparedAssignmentIntent(input)`
- resolves only explicit `repairOrderRepository`
- requires `repairOrderRepository.writeRepairOrder`
- builds the safe write envelope through `buildDepotWorkshopAssignmentIntentWriteCommand`
- passes the accepted command envelope to the injected repository
- normalizes repository output through `normalizeDepotWorkshopRepairOrderRepositoryResult`
- returns a safe service envelope with `repairOrderResult`
- fails closed on missing dependency, malformed input, missing trusted scope/source, missing write authorization, invalid transition, repository throw/reject, malformed repository result, and cross-scope result

Preserved behavior:

- `prepareAssignmentIntent` remains unchanged as the prepare-only read path
- `prepareAssignmentIntent` continues returning `written: false`
- prepared assignment intent continues carrying `writeRequired: false`
- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`

## Fake Repository Composition

The new method is intended for fake-runtime composition only in this phase.

Accepted fake composition:

- prepared assignment intent enters the service method
- write command helper validates trusted scope, permission, source reference, and transition policy
- injected fake repository receives only the accepted command envelope
- repository result is normalized through the accepted repository contract
- service response returns only normalized safe result fields

`written` is evidence from the normalized repository result only. It does not authorize route write scope.

## Non-Authorization Record

Task2416 does not authorize:

- route write-scope behavior
- route response source change
- route wiring changes
- route path or mount changes
- controller creation
- runtime factory wiring
- real DB execution
- DB commands
- SQL execution against a real DB
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
- formal Field Service Report / Completion Report behavior
- finalAppointmentId mutation

No route write-scope behavior is authorized.

No real DB execution is authorized.

No migration dry-run/apply is authorized.

No provider sending is authorized.

No package or package-lock changes are authorized.

No formal Field Service Report / Completion Report behavior is authorized.

No finalAppointmentId mutation is authorized.

## Test Coverage

`tests/depotWorkshop/workshopAssignmentServiceWritePreparedAssignmentIntent.unit.test.js` proves:

- `prepareAssignmentIntent` still returns `written: false` and remains prepare-only
- `writePreparedAssignmentIntent` exists as a separate method
- fake repository injection is required
- valid safe command reaches the fake repository
- fake repository success returns a normalized safe service result
- missing dependency, malformed input, missing trusted source/scope, missing write authorization, and invalid transition fail closed before write
- repository throw/reject/malformed/cross-scope results fail closed
- no raw DB rows / SQL / stack / token / password / secret leaks
- no provider / billing / AI/RAG payload leaks
- no formal FSR / Completion Report markers are emitted
- no finalAppointmentId is emitted or mutated
- input objects and fake repository result objects are not mutated

`tests/depotWorkshop/workshopAssignmentServiceWritePreparedAssignmentIntentBoundary.static.test.js` proves:

- separate prepare and write prepared methods are visible
- prepare-only markers remain visible
- write method uses accepted write command helper and injected repository dependency
- no direct SQL repository adapter import exists in the service
- no DB client / env / `DATABASE_URL` / Zeabur / secrets usage is introduced
- no route/controller/runtime factory wiring is introduced
- route write scope remains blocked
- no provider/package/formal-report/finalAppointmentId behavior is introduced

## Recommended Next Bounded Task

Recommended next bounded task: service write-method portfolio guard.

Reason: Task2416 adds the bounded source method and fake repository tests. A portfolio guard can freeze the new service boundary before any runtime factory, route write-scope, real DB, migration apply, provider, smoke, or deployment work is considered.

## Held Docs

The 7 held historical docs remain outside Task2416 scope and must stay untracked, unstaged, and untouched.
