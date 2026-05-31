# Task2380 Depot Workshop Repair Order Helper Workshop Assignment Service Integration Decision Gate

## Scope

Task2380 adds a docs/static-only decision gate for future integration of the accepted Depot / Workshop repair order pure helpers into the existing workshop assignment prepare-only flow.

Do not wire helpers into runtime.

do not approve route writes.

This task does not wire helpers into runtime, modify source behavior, change tests outside the new static guard, add DB persistence, create migrations, run SQL, start a server, run smoke probes, send providers, change package dependencies, inspect env/secrets, or approve route writes.

## Current Context

The accepted pure helper portfolio remains closed for this phase:

- Task2373 state model helper: `src/depotWorkshop/depotWorkshopRepairOrderStateModel.js`
- Task2374 repair order contract helper: `src/depotWorkshop/depotWorkshopRepairOrderContract.js`
- Task2375 transition policy helper: `src/depotWorkshop/depotWorkshopRepairOrderTransitionPolicy.js`
- Task2376 audit event helper: `src/depotWorkshop/depotWorkshopRepairOrderAuditEvent.js`
- Task2377 customer-visible projection helper: `src/depotWorkshop/depotWorkshopRepairOrderCustomerProjection.js`
- Task2378 portfolio static guard: `tests/depotWorkshop/depotWorkshopRepairOrderPureHelperPortfolio.static.test.js`
- Task2379 branch closure: `docs/task-2379-depot-workshop-repair-order-pure-helper-branch-closure-no-runtime-change-no-db-no-provider-no-package.md`

The current prepare-only workshop assignment flow is centered on:

- `src/services/WorkshopAssignmentService.js`
- `src/routes/depotRepair.routes.js`
- `src/guards/DepotRepairStatusBoundary.js`
- `src/guards/DepotAccessScopeGuard.js`
- `src/depotWorkshop/depotRepairCustomerVisibleDataFilter.js`
- `src/depotWorkshop/depotWorkshopAuditBoundary.js`

## Integration Boundary Comparison

### WorkshopAssignmentService Prepare-Assignment-Intent Boundary

Decision: recommended.

Recommended future source boundary: `src/services/WorkshopAssignmentService.js#createWorkshopAssignmentService().prepareAssignmentIntent`

This is the narrowest prepare-only service boundary because it already:

- returns `written: false`
- produces an internal `assignmentIntent`
- rejects `writeRequested`, `writeApproved`, and `persist`
- reads depot intake state through an injected repository dependency
- preserves organization, tenant, brand, service-provider, and subcontractor assignment scope checks
- returns sanitized failures without route writes or provider sending

Future integration at this boundary can use pure repair order helpers to shape internal draft intent while preserving the current no-write contract.

### Depot Route Assignment-Intent Handler Boundary

Decision: not recommended.

The route handler should continue to enforce request shaping, access guard invocation, `depot_repair_route_write_scope_not_approved`, response sanitization, and permission middleware. Wiring repair order helper planning directly into the route would widen HTTP-facing scope before the service boundary has a source-level contract.

### Status Boundary Guard

Decision: not recommended.

The status boundary guard should stay focused on transition eligibility and forbidden mutation scope. It should not own workshop assignment intent shape, audit intent preparation, customer projection preparation, or repair order draft construction.

### Access Scope Guard

Decision: not recommended.

The access scope guard should stay focused on brand, service-provider, subcontractor, relationship, and minimization decisions. It should not own repair order draft, transition, audit, or customer projection helper orchestration.

### Customer-Visible Projection Filter

Decision: not recommended.

The customer-visible filter should remain allowlist/projection-only. It should not become the place that decides workshop assignment, repair order draft intent, route write scope, provider sending, or publication behavior.

### Audit Boundary

Decision: not recommended.

The audit boundary should remain internal-only and writer-injected. It should not become the place that constructs repair order draft intent, performs transition planning, writes DB state, or sends provider notifications.

## Future Integration Requirements

Future integration may be considered only with separate exact PM authorization and must preserve:

- `written: false`
- prepare-only route behavior
- `depot_repair_route_write_scope_not_approved`
- injected repository read behavior only
- no direct SQL or DB write behavior
- no helper wiring outside the explicitly authorized future source boundary
- brand, service-provider, and subcontractor access boundaries
- customer-visible minimization
- sanitized failure envelopes

Future integration at the recommended boundary must use helpers only as pure planning/shape functions:

- use pure repair order contract only to shape internal draft intent, not persist it
- use transition policy only for planning/validation, not writing state
- use audit event helper only for internal prepared audit intent, not DB write
- use customer projection helper only for allowlisted projection preparation, not publication

## Preserved Forbidden Domain Behavior

Task2380 preserves the following forbidden domain behavior:

- no formal Field Service Report creation, approval, publication, or finalization
- no Completion Report approval, publication, or finalization
- no `finalAppointmentId` mutation
- no `finalAppointmentId` customer-visible exposure
- no route write scope approval
- no DB, repository, migration, SQL execution, real DB connection, or persistence implementation
- no provider sending
- no package or package-lock changes
- no admin UI work
- no billing, settlement, payment, or invoice behavior
- no AI/RAG/OpenAI/vector DB runtime behavior
- no Customer Access runtime behavior changes
- no Engineer Mobile runtime behavior changes
- no Repair Intake runtime behavior changes
- no smoke, endpoint, shared runtime, server/listener startup, deploy, staging/prod traffic, or `/healthz`
- no env, Zeabur, secrets, token, password, or credential inspection

## Static Guard Coverage

The Task2380 static guard asserts:

- the pure helper portfolio exists
- the Task2371 through Task2379 docs remain visible
- `WorkshopAssignmentService` exists and remains prepare-only with `written: false`
- the current route still blocks write scope with `depot_repair_route_write_scope_not_approved`
- the decision gate doc recommends exactly one future boundary
- the recommended future source boundary is `src/services/WorkshopAssignmentService.js#createWorkshopAssignmentService().prepareAssignmentIntent`
- repair order helpers are not newly wired into the service, route, guards, customer-visible filter, or audit boundary
- no route/API/controller/DB/provider/package authorization is introduced

## Non-Authorization

Task2380 does not authorize:

- runtime/source behavior changes
- helper wiring changes
- route path or mount changes
- controller creation
- repository implementation
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

The 7 held historical docs remain outside Task2380 scope and must stay untracked, unstaged, and untouched.
