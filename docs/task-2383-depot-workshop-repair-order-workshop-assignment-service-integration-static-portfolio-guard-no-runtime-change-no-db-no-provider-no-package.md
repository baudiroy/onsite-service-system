# Task2383 Depot Workshop Repair Order Workshop Assignment Service Integration Static Portfolio Guard

## Scope

Task2383 adds a docs/static-only portfolio guard for the accepted Depot / Workshop repair order helper integration into `WorkshopAssignmentService.prepareAssignmentIntent`.

This task does not modify runtime/source helper behavior, route wiring, controllers, repositories, DB, migrations, provider sending, admin frontend, package dependencies, smoke tests, endpoint probes, server/listener startup, deploy, staging/prod traffic, billing, AI/RAG, Customer Access, Engineer Mobile, or Repair Intake behavior.

## Static Service Integration Portfolio

The current accepted service integration portfolio is:

- Task2380 decision gate selected the WorkshopAssignmentService prepare-assignment-intent boundary.
- Task2381 integrated the accepted pure helper set only inside `src/services/WorkshopAssignmentService.js#createWorkshopAssignmentService().prepareAssignmentIntent`.
- Task2382 checkpointed the service-level integration state.

WorkshopAssignmentService.prepareAssignmentIntent remains the only accepted integration boundary.

The helper imports in WorkshopAssignmentService are limited to accepted pure helpers:

- `buildDepotWorkshopRepairOrderDraft`
- `planDepotWorkshopRepairOrderStatusTransition`
- `buildDepotWorkshopRepairOrderAuditEvent`
- `buildDepotWorkshopRepairOrderCustomerProjection`

The service integration remains prepare-only:

- service still returns `written: false`
- `assignmentIntent.writeRequired` remains `false`
- existing injected read-only `depotIntakeRepository.findDepotIntakeState` remains the only repository call
- depotIntakeRepository.findDepotIntakeState remains the only repository call
- helper-derived sections remain optional and safe:
  - `repairOrderDraft`
  - `repairOrderTransitionPlan`
  - `repairOrderAuditIntent`
  - `repairOrderCustomerProjection`
- invalid transition targets are omitted safely rather than writing state
- audit intent remains internal-only / `customerVisible: false` and is not persisted
- customer projection remains allowlisted/projection-only and is not publication
- subcontractor boundary remains preserved

## Static Guard Coverage

The Task2383 static guard asserts:

- Task2380 decision gate exists
- Task2381 integration doc/tests exist
- Task2382 checkpoint exists
- Task2373 through Task2378 pure helper docs/tests remain visible
- WorkshopAssignmentService.prepareAssignmentIntent remains the only accepted integration boundary
- helper imports in WorkshopAssignmentService are limited to accepted pure helpers
- service still returns `written: false`
- `assignmentIntent.writeRequired` remains `false`
- `depotIntakeRepository.findDepotIntakeState` remains the only repository call
- helper-derived sections remain safe and optional
- invalid transition targets are omitted safely rather than writing state
- audit intent remains internal-only / `customerVisible: false` and not persisted
- customer projection remains allowlisted/projection-only and not publication
- subcontractor boundary remains preserved
- `depot_repair_route_write_scope_not_approved` remains visible
- no route helper wiring is introduced
- no route/API/controller/DB/provider/package authorization is introduced

## Preserved Forbidden Behavior

Task2383 preserves:

- No route path or mount changes.
- No route write scope approval.
- No controller creation.
- No repository implementation.
- No new DB behavior.
- No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.
- No provider sending.
- No package or package-lock changes.
- No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.
- No `finalAppointmentId` mutation path.
- No raw customer contact/address/signature/photo/private exposure.
- No billing/settlement/payment/invoice behavior.
- No AI/RAG/OpenAI/vector DB runtime behavior.

## Non-Authorization

Task2383 does not authorize:

- runtime/source behavior changes
- helper wiring changes
- route path or mount changes
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

The 7 held historical docs remain outside Task2383 scope and must stay untracked, unstaged, and untouched.
