# Task2388 Depot Workshop Assignment Intent Route Response Presenter Wiring

## Scope

Task2388 wires the accepted pure presenter into the existing Depot / Workshop assignment-intent success response boundary.

Changed route response boundary:

- `src/routes/depotRepair.routes.js#successBody(result, req = {})`

The route success response now delegates to:

- `presentDepotWorkshopAssignmentIntentResponse(result, requestContext)`

No route path or mount changes.

No permission change.

No service behavior changes.

No DB, repository, provider, package, smoke, endpoint, server/listener, deploy, staging/prod, billing, AI/RAG, Customer Access, Engineer Mobile, or Repair Intake behavior changed.

## Preserved Route Boundary

The preserved route boundary is:

- route path: `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`
- permission: `depot.repair.prepare`
- route remains prepare-only
- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`
- `meta.written` remains `false`
- `data.depotRepair.writeRequired` remains `false`

Existing safe failure response behavior is preserved for denied/error route results.

## Final Route Response Presenter Wiring Behavior

Successful route results now use the presenter output as the response source.

The route response stays compatible with:

- top-level `data`
- top-level `meta`
- top-level `requestId`
- payload under `data.depotRepair`

The presenter allowlist controls `data.depotRepair` fields.

Helper-derived service intent sections are exposed only as summaries/previews:

- `repairOrderDraftSummary`
- `repairOrderTransitionPlanSummary`
- `repairOrderAuditIntentSummary`
- `repairOrderCustomerProjectionPreview`

The full service-level helper-derived objects are not exposed wholesale:

- `repairOrderDraft`
- `repairOrderTransitionPlan`
- `repairOrderAuditIntent`
- `repairOrderCustomerProjection`

## Tests

Added:

- `tests/depotWorkshop/depotWorkshopAssignmentIntentRouteResponsePresenterWiring.unit.test.js`
- `tests/depotWorkshop/depotWorkshopAssignmentIntentRouteResponsePresenterWiringBoundary.static.test.js`

The tests prove:

- route response uses `presentDepotWorkshopAssignmentIntentResponse`
- normal assignment intent response remains compatible with top-level `data`, `meta`, and `requestId`
- `data.depotRepair` is allowlisted
- full helper-derived service objects are not exposed wholesale
- helper-derived sections are exposed only as summaries/previews
- `meta.written` remains `false`
- `writeRequired` remains `false`
- route path/permission remain unchanged
- route write scope remains blocked
- failure route result stays safe
- forbidden fields are omitted
- no formal Field Service Report / Completion Report / `finalAppointmentId` exposure or mutation
- input result objects are not mutated

## Non-Authorization

Task2388 does not authorize:

- route path or mount changes
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

No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.

No provider sending.

No package or package-lock changes.

No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.

No `finalAppointmentId` mutation path.

## Held Docs

The 7 held historical docs remain outside Task2388 scope and must stay untracked, unstaged, and untouched.
