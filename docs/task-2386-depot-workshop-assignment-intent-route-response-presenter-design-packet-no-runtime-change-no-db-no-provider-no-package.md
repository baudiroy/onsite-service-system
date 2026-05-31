# Task2386 Depot Workshop Assignment Intent Route Response Presenter Design Packet

## Scope

Task2386 records a future presenter/helper design for the Depot / Workshop assignment-intent route response.

This is a docs/static-only design packet. It does not implement a presenter/helper and does not change runtime/source behavior, route response shape, route path or mount, service behavior, helper wiring, controllers, repositories, DB, migrations, provider sending, package dependencies, smoke tests, endpoint probes, server/listener startup, deploy, staging/prod traffic, billing, AI/RAG, Customer Access, Engineer Mobile, or Repair Intake behavior.

## Current State

The current route/service state remains:

- route path: `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`
- permission: `depot.repair.prepare`
- route remains prepare-only
- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`
- `successBody()` currently returns `data.depotRepair` from sanitized `result.assignmentIntent || result.depotRepair || result.intent || null`
- `meta.written` remains `false`
- service returns `written: false`
- `assignmentIntent.writeRequired` remains `false`
- helper-derived sections currently can be exposed under sanitized `data.depotRepair`

The currently possible helper-derived sections are:

- `repairOrderDraft`
- `repairOrderTransitionPlan`
- `repairOrderAuditIntent`
- `repairOrderCustomerProjection`

## Response Shape Options

Option A: keep current sanitized full assignment intent.

- Pros: smallest future source change and keeps all current service intent details available to route callers.
- Cons: route output remains coupled to service intent shape and can accidentally expose newly added internal service intent fields if future helpers expand.

Option B: narrow route response to an explicit admin-safe allowlist.

- Pros: makes route output intentional, stable, reviewable, and resistant to accidental internal leakage.
- Cons: requires a presenter/helper implementation and ongoing allowlist updates when accepted route output changes.

Option C: split internal service intent from route response presenter.

- Pros: preserves rich internal service intent for future repository/provider/admin decisions while publishing only an explicit route response envelope.
- Cons: introduces a new design boundary that must be tested and kept synchronized with service intent.

Option D: expose only summary references for helper-derived sections.

- Pros: lets callers understand draft/transition/audit/projection availability without receiving full internal payloads.
- Cons: can be too narrow if admin operations need detail later.

## Recommended Future Strategy

Recommended future strategy: split internal service intent from route response presenter with an explicit admin-safe allowlist.

Why: Task2385 confirmed that sanitized helper-derived service intent sections can currently flow through `data.depotRepair`. Sanitization is necessary but not sufficient as a long-term response contract. A presenter boundary should preserve prepare-only service richness internally while making route output deliberate, minimal, and stable.

This recommendation combines Option B and Option C: implement a future presenter/helper that accepts `WorkshopAssignmentService.prepareAssignmentIntent` output and returns the existing route envelope shape with explicitly allowlisted fields.

## Proposed Future Presenter Contract

Future helper name suggestion:

- `presentDepotWorkshopAssignmentIntentResponse(result, requestContext)`

Accepted input shape:

- a `WorkshopAssignmentService.prepareAssignmentIntent` result
- optional route request context containing request id and actor/organization context already available to the route
- no raw request body, raw DB row, provider payload, env, secret, SQL, stack, or customer-private payload

Output envelope shape compatible with current route behavior:

- top-level `data`
- top-level `meta`
- top-level `requestId`
- `data.depotRepair` remains the route payload container
- `meta.ok`
- `meta.prepared`
- `meta.written`
- `meta.reasonCode`

Allowed top-level response fields:

- `data`
- `meta`
- `requestId`

Allowed `data.depotRepair` fields:

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

## Helper-Derived Section Handling

Future presenter behavior for `repairOrderDraft`:

- do not expose the full draft object by default
- expose only `repairOrderDraftSummary`
- allowed summary fields: `repairOrderId`, `caseId`, `depotIntakeId`, `workflowType`, `depotStatus`, `workshopId`, `workshopTeamId`, `assignedTechnicianId`, `subcontractorOrganizationId`

Future presenter behavior for `repairOrderTransitionPlan`:

- expose only `repairOrderTransitionPlanSummary`
- allowed summary fields: `fromStatus`, `toStatus`, `reasonCode`, `transitionStatus`
- omit invalid or absent transition targets
- never write or mutate state

Future presenter behavior for `repairOrderAuditIntent`:

- do not expose full audit payload or metadata
- expose only `repairOrderAuditIntentSummary`
- allowed summary fields: `eventType`, `auditStatus`, `customerVisible`
- require `customerVisible` to remain `false`
- never persist audit intent

Future presenter behavior for `repairOrderCustomerProjection`:

- expose only `repairOrderCustomerProjectionPreview`
- allowed preview fields should stay within the accepted customer projection allowlist
- this preview is not customer-visible publication
- never publish, approve, revoke, or finalize a customer-visible record

Safe-deny / failure behavior:

- malformed presenter input returns the existing safe failure envelope shape
- failure envelopes expose only `error.code`, `error.message`, `error.reasonCode`, and `error.requestId`
- no raw error, stack, SQL, provider payload, token, secret, or customer-private value is included

No-mutation requirement:

- presenter/helper must be pure and deterministic
- no DB, repository, migration, provider, billing, AI/RAG, server, smoke, endpoint, or package behavior
- no route write scope approval
- `meta.written` must remain `false`
- `writeRequired` must remain `false`

## Explicitly Forbidden Output

Future presenter output must not expose:

- `finalAppointmentId`
- formal Field Service Report / Completion Report creation, approval, publication, or finalization markers
- raw customer contact, address, signature, photo, or private fields
- raw DB rows, SQL, stack, token, password, or secret
- provider payloads
- billing, settlement, payment, or invoice internals
- AI/RAG/OpenAI/vector payloads
- internal audit payloads beyond safe references
- subcontractor-private fields beyond accepted minimized visibility

## Static Guard Coverage

Task2386 adds `tests/depotWorkshop/depotWorkshopAssignmentIntentRouteResponsePresenterDesign.static.test.js`.

The static guard asserts:

- Task2385 checkpoint exists
- current route response shape is documented
- design packet compares multiple response strategies
- design packet recommends exactly one future strategy
- proposed presenter/helper contract and allowlist are documented
- route response source is not changed by Task2386
- no presenter/helper implementation is added by Task2386
- no route/API/controller/DB/provider/package authorization is introduced

## Non-Authorization

Task2386 does not authorize:

- runtime/source behavior changes
- route response shape changes
- presenter/helper implementation
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

The 7 held historical docs remain outside Task2386 scope and must stay untracked, unstaged, and untouched.
