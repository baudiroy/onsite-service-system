# Task2385 Depot Workshop Assignment Intent Route Response Shape Checkpoint

## Scope

Task2385 records the current Depot / Workshop assignment-intent route response shape after the Task2381 service integration.

This is a docs/static checkpoint. It adds a source-reading static guard and does not change runtime/source behavior, route behavior, service behavior, helper wiring, controllers, repositories, DB, migrations, provider sending, package dependencies, smoke tests, endpoint probes, server/listener startup, deploy, staging/prod traffic, billing, AI/RAG, Customer Access, Engineer Mobile, or Repair Intake behavior.

## Current Route Boundary

The current route boundary remains:

- route path: `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`
- source marker: `DEPOT_REPAIR_ROUTE_PATH`
- permission marker: `depot.repair.prepare`
- route registration: `requirePermission(DEPOT_REPAIR_ROUTE_PERMISSION)` before `createDepotRepairRouteHandler(options)`

The route remains prepare-only:

- write requests are denied before service execution
- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`
- service still returns `written: false`
- route response meta always reports `written: false`
- `assignmentIntent.writeRequired` remains `false`

## Current Response Shape

Current source reading shows:

- `src/routes/depotRepair.routes.js#successBody()` returns `data.depotRepair`
- `data.depotRepair` is built from `sanitizeValue(result.assignmentIntent || result.depotRepair || result.intent || null)`
- `src/services/WorkshopAssignmentService.js#buildAssignmentIntent()` spreads `buildRepairOrderHelperSections(...)` into `assignmentIntent`
- therefore, when `WorkshopAssignmentService.prepareAssignmentIntent` returns helper-derived sections, the current route response exposes those sections under sanitized `data.depotRepair`

The currently exposed helper-derived service intent sections are optional:

- `repairOrderDraft`
- `repairOrderTransitionPlan`
- `repairOrderAuditIntent`
- `repairOrderCustomerProjection`

This exposure is sanitized by the route response sanitizer, but there is no route-level presenter or response narrowing layer that explicitly selects or omits the helper-derived sections.

## Safety Meaning

The current route response shape does not imply:

- customer-visible publication
- audit persistence
- repository/DB persistence
- provider sending
- formal Field Service Report / Completion Report creation, approval, publication, or finalization
- `finalAppointmentId` mutation or exposure
- billing/settlement/payment/invoice behavior
- AI/RAG expansion

The helper-derived sections remain service-level intent data only. `repairOrderAuditIntent` remains internal-only and is not persisted. `repairOrderCustomerProjection` remains allowlisted/projection-only and is not publication.

## Static Guard Coverage

Task2385 adds `tests/depotWorkshop/depotWorkshopAssignmentIntentRouteResponseShape.static.test.js`.

The static guard asserts:

- the route path and permission marker remain visible
- the route write-scope denial marker remains visible
- the route success body returns sanitized `result.assignmentIntent` as `data.depotRepair`
- `WorkshopAssignmentService` still builds helper-derived sections only inside `assignmentIntent`
- `written: false` remains visible in route/service source
- `assignmentIntent.writeRequired` remains `false`
- helper-derived section names remain visible as accepted service-level intent sections
- no formal Field Service Report / Completion Report behavior is introduced
- no `finalAppointmentId` mutation or exposure is introduced
- no provider/DB/package/smoke authorization is introduced

## Recommended Next Bounded Task

Recommended next bounded task: route response presenter/helper design packet.

Reason: current source exposes sanitized helper-derived service intent sections through `data.depotRepair` whenever the service returns them. This remains prepare-only and sanitized, but a separate presenter/helper design packet should decide whether route output should keep those sections, narrow them, rename them, or split internal service intent from customer/admin-facing route response shape before any runtime source change.

## Non-Authorization

Task2385 does not authorize:

- runtime/source behavior changes
- route path or mount changes
- helper wiring changes
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

The 7 held historical docs remain outside Task2385 scope and must stay untracked, unstaged, and untouched.
