# Task2399 Depot Workshop Repair Order Repository Contract Static Portfolio Guard

## Scope

Task2399 adds a focused static portfolio guard and short doc for the accepted Depot / Workshop repair order repository contract from Task2397 through Task2398.

This is a no-runtime-change static/docs task. No runtime/source behavior changes. No repository implementation changes. No DB adapter implementation. No route write-scope behavior. No route response source change. No route wiring changes. No route path or mount changes. No helper wiring changes into existing runtime. No permission changes. No service behavior changes. No controller creation. No new DB behavior. No DB commands. No SQL execution. No real DB connection. No migration creation. No migration dry-run or apply. No `DATABASE_URL`, Zeabur, env, or secrets inspection. No server/listener startup. No smoke test execution. No endpoint probes. No shared runtime. No deploy. No staging/prod traffic. No `/healthz`. No provider sending. No package or package-lock changes. No auth/session middleware changes. No permission model changes, role expansion, or organization isolation source changes. No AI/RAG/OpenAI/vector DB runtime behavior. No admin frontend behavior. No billing/settlement/payment/invoice behavior. No Customer Access runtime behavior changes. No Engineer Mobile runtime behavior changes. No Repair Intake runtime behavior changes. No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior. No `finalAppointmentId` mutation path.

## Current Repository Contract Status

The current repository contract status is:

- Task2397 created the repository/migration authorization packet.
- Task2398 added the pure repository contract helper at `src/depotWorkshop/depotWorkshopRepairOrderRepositoryContract.js`.
- Task2398 added unit and static boundary tests for the helper.
- The helper exports `DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND`.
- The helper exports `normalizeDepotWorkshopRepairOrderRepositoryWriteCommand(input)`.
- The helper exports `normalizeDepotWorkshopRepairOrderRepositoryResult(input)`.
- The helper exports `buildDepotWorkshopRepairOrderRepositorySafeFailure(reasonCode, details)`.
- The helper has no DB/repository/provider/route/app/server/env/package imports.
- The helper is not wired into routes, services, controllers, repositories, DB, migrations, or provider sending.
- The helper normalizes safe write command and future repository result envelopes only.
- The exact action remains `depot_workshop.assignment_intent.write`.
- `written` remains repository-result-only and does not authorize route write scope.
- `written` reflects only a future repository adapter result.
- written reflects only a future repository adapter result.

## Current Persistence Non-Authorization State

The current persistence non-authorization state is:

- no dedicated Depot / Workshop repair order repository implementation exists
- no DB adapter implementation exists
- no dedicated Depot / Workshop migration exists
- no migration file is added by Task2399
- no SQL, DB command, transaction, migration dry-run, or migration apply is authorized
- `DepotIntakeSqlRepositoryAdapter` remains read-only, injected DB client based, and limited to safe Repair Intake draft fields
- `recordDepotIntakeIntent` remains denied by `depot_intake_write_scope_not_approved`
- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`

## Current Safety Boundaries

The current safety boundaries are:

- trusted organization/case/source/action scope is required
- `organizationId` is required
- `caseId` is required
- `depotIntakeId` or `repairOrderId` is required
- malformed, failed, unsafe, or cross-scope-looking repository results fail closed
- repository result normalization remains safe and minimal
- no DB persistence result is executed
- no repository adapter execution is introduced
- no provider payload is emitted
- no formal Field Service Report / Completion Report creation, approval, publication, or finalization is introduced
- no `finalAppointmentId` mutation is introduced
- no billing/payment/invoice payload is emitted
- no AI/RAG payload is emitted
- no SQL/stack/token/password/secret/debug payload is emitted

## Static Portfolio Coverage

Task2399 adds:

- `tests/depotWorkshop/depotWorkshopRepairOrderRepositoryContractPortfolio.static.test.js`

The portfolio guard asserts:

- Task2397 packet exists
- Task2398 helper doc/tests exist
- helper file exists
- exported markers/functions remain visible
- helper has no DB/repository/provider/route/app/server/env/package imports
- helper is not wired into routes/services/controllers/repositories
- no migration file was added
- route write scope remains blocked
- `depot_repair_route_write_scope_not_approved` remains visible
- pure write command helper remains the upstream command source
- no SQL strings or DB client usage are present
- existing `DepotIntakeSqlRepositoryAdapter` remains read-only / injected DB client / safe Repair Intake draft fields only
- no dedicated Depot / Workshop repair order repository implementation exists
- repository contract safety coverage remains represented in source and tests
- no route/API/controller/DB/migration/provider/smoke/package authorization is introduced

## Non-Authorized Candidate Tasks

The following possible next tasks are non-authorized candidates only:

- repository contract branch closure
- migration/schema design packet
- repository adapter authorization packet
- route write-scope decision packet

## Non-Authorization

Task2399 does not authorize:

- runtime/source behavior changes
- repository implementation changes
- DB adapter implementation
- route write-scope behavior
- route response source changes
- route wiring changes
- route path or mount changes
- helper wiring into existing runtime
- permission changes
- service behavior changes
- controller creation
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

The 7 held historical docs remain outside Task2399 scope and must stay untracked, unstaged, and untouched.
