# Task2387 Depot Workshop Assignment Intent Route Response Presenter Pure Helper

## Scope

Task2387 adds a pure Depot / Workshop assignment-intent response presenter/helper.

The helper is not wired into `src/routes/depotRepair.routes.js` in this task. Existing route response behavior is unchanged.

No route response behavior changes.

No route wiring, route response behavior, route path or mount, controller, repository, DB, migration, provider, package, smoke, endpoint, server/listener, deploy, staging/prod, billing, AI/RAG, Customer Access, Engineer Mobile, or Repair Intake behavior changed.

## Added Helper

Added:

- `src/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter.js`

Primary export:

- `presentDepotWorkshopAssignmentIntentResponse(result, requestContext = {})`

The helper accepts a plain `WorkshopAssignmentService.prepareAssignmentIntent` result and returns a detached route-compatible envelope:

- success: `data`, `meta`, `requestId`
- payload: `data.depotRepair`
- failure: safe `error.code`, `error.message`, `error.reasonCode`, `error.requestId`

The helper is pure:

- no imports
- no DB/repository/provider/route/app/server/env/package access
- no mutation of input objects
- detached output objects
- no provider sending
- no persistence
- no route write scope approval

## Allowlist Contract

Allowed `data.depotRepair` fields are:

- `depotIntakeId`
- `organizationId`
- `tenantId`
- `workflowType`
- `depotStatus`
- `brandId`
- `serviceProviderId`
- `itemRef`
- `productRef`
- `issueSummaryRef`
- `workshopId`
- `workshopTeamId`
- `assignedTechnicianId`
- `subcontractorOrganizationId`
- `assignmentNote`
- `assignedByActorId`
- `actorRole`
- `permission`
- `writeRequired`
- `requestId`
- `repairOrderDraftSummary`
- `repairOrderTransitionPlanSummary`
- `repairOrderAuditIntentSummary`
- `repairOrderCustomerProjectionPreview`

`meta.written` remains `false`.

`data.depotRepair.writeRequired` remains `false`.

## Helper-Derived Section Handling

The presenter summarizes helper-derived service intent sections:

- `repairOrderDraft` becomes `repairOrderDraftSummary`
- `repairOrderTransitionPlan` becomes `repairOrderTransitionPlanSummary`
- `repairOrderAuditIntent` becomes `repairOrderAuditIntentSummary`
- `repairOrderCustomerProjection` becomes `repairOrderCustomerProjectionPreview`

The full helper-derived service intent objects are not exposed wholesale.

Invalid or unsafe transition targets are omitted safely.

Audit summaries require `customerVisible: false` and do not imply persistence.

Customer projection preview remains within the accepted customer projection allowlist and is not publication.

## Forbidden Output

The presenter omits:

- `finalAppointmentId`
- formal Field Service Report / Completion Report creation, approval, publication, or finalization markers
- raw customer contact, address, signature, photo, or private fields
- raw DB rows, SQL, stack, token, password, or secret
- provider payloads
- billing, settlement, payment, or invoice internals
- AI/RAG/OpenAI/vector payloads
- internal audit payloads beyond safe references/summaries
- subcontractor-private fields beyond accepted minimized visibility

## Tests

Added:

- `tests/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter.unit.test.js`
- `tests/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenterBoundary.static.test.js`

The unit tests prove:

- valid assignment intent presents an allowlisted admin-safe response
- helper-derived sections are summarized, not exposed wholesale
- `meta.written` and `writeRequired` remain `false`
- malformed/failure input returns a safe failure envelope
- forbidden fields are omitted
- no formal Field Service Report / Completion Report / `finalAppointmentId` exposure or mutation
- input objects are not mutated and output is detached

The static guard proves:

- helper has no DB/repository/provider/route/app/server/env/package imports
- helper is not wired into `src/routes/depotRepair.routes.js`
- helper does not approve, publish, formalize, or finalize Field Service Report / Completion Report behavior
- helper does not mutate or expose `finalAppointmentId`
- Task2386 design packet remains visible
- no route/API/controller/DB/migration/provider/smoke/package authorization is introduced

## Safety Statements

No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.

No provider sending.

No package or package-lock changes.

No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.

No `finalAppointmentId` mutation path.

## Non-Authorization

Task2387 does not authorize:

- route response source changes
- route response behavior changes
- route wiring
- route path or mount changes
- helper wiring into existing runtime
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

The 7 held historical docs remain outside Task2387 scope and must stay untracked, unstaged, and untouched.
