# Task2390 Depot Workshop Assignment Intent Route Response Presenter Wiring Static Portfolio Guard

## Scope

Task2390 adds a static/docs portfolio guard for the accepted Depot / Workshop assignment-intent route response presenter boundary from Task2385 through Task2389.

This is a no-runtime-change static/docs task. It does not change runtime/source behavior, route response source, route wiring, route path or mount, helper wiring, permission, service behavior, controllers, repositories, DB, migrations, provider sending, package dependencies, smoke tests, endpoint probes, server/listener startup, deploy, staging/prod traffic, billing, AI/RAG, Customer Access, Engineer Mobile, or Repair Intake behavior.

## Current Presenter Wiring Status

This section records current presenter wiring status, current safe route response shape, and current safety boundaries.

The accepted presenter wiring status is:

- route success response boundary: `src/routes/depotRepair.routes.js#successBody(result, req = {})`
- `successBody` delegates to `presentDepotWorkshopAssignmentIntentResponse(result, { requestId })`
- existing `failureBody` remains the safe failure response for denied/error route results
- route path remains `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`
- permission remains `depot.repair.prepare`
- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`

## Current Safe Route Response Shape

The current successful route response shape remains:

- top-level `data`
- top-level `meta`
- top-level `requestId`
- payload under `data.depotRepair`
- `data.depotRepair` is allowlisted by the presenter
- full helper-derived service objects are not exposed wholesale
- helper-derived sections are exposed only as summaries/previews:
  - `repairOrderDraftSummary`
  - `repairOrderTransitionPlanSummary`
  - `repairOrderAuditIntentSummary`
  - `repairOrderCustomerProjectionPreview`
- `meta.written` remains `false`
- `data.depotRepair.writeRequired` remains `false`

## Current Safety Boundaries

The current safety boundaries remain:

- no route path or mount change
- no permission change
- no `WorkshopAssignmentService` behavior change
- no controller creation
- no repository implementation
- no new DB behavior
- no provider sending
- no package/package-lock changes
- no formal Field Service Report / Completion Report creation, approval, publication, or finalization
- no `finalAppointmentId` mutation or exposure
- no raw customer contact/address/signature/photo/private exposure
- no billing/settlement/payment/invoice behavior
- no AI/RAG expansion

## Static Portfolio Coverage

Task2390 adds:

- `tests/depotWorkshop/depotWorkshopAssignmentIntentRouteResponsePresenterWiringPortfolio.static.test.js`

The static guard reads source/test/doc files only and asserts:

- Task2385 checkpoint exists
- Task2386 design packet exists
- Task2387 presenter helper docs/tests exist
- Task2388 route presenter wiring docs/tests exist
- Task2389 checkpoint exists
- `src/routes/depotRepair.routes.js#successBody(result, req = {})` delegates to `presentDepotWorkshopAssignmentIntentResponse(result, { requestId })`
- existing `failureBody` remains the safe failure response for denied/error route results
- route path remains `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`
- permission remains `depot.repair.prepare`
- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`
- `meta.written` remains `false`
- `data.depotRepair.writeRequired` remains `false`
- payload remains under `data.depotRepair`
- `data.depotRepair` is allowlisted by the presenter
- full helper-derived service objects are not exposed wholesale
- helper-derived sections are exposed only as summaries/previews
- no route/API/controller/DB/migration/provider/smoke/package authorization is introduced

## Non-Authorized Candidate Tasks

The following Depot / Workshop tasks are candidates only and are not authorized by this portfolio guard:

- route response presenter wiring branch closure
- route write scope authorization packet
- repository/migration authorization packet
- admin UI design packet

## Non-Authorization

Task2390 does not authorize:

- runtime/source behavior changes
- route response source changes
- route wiring changes
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

## Safety Statements

No route path or mount changes.

No permission change.

No service behavior changes.

No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.

No provider sending.

No package or package-lock changes.

No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.

No `finalAppointmentId` mutation path.

## Held Docs

The 7 held historical docs remain outside Task2390 scope and must stay untracked, unstaged, and untouched.
