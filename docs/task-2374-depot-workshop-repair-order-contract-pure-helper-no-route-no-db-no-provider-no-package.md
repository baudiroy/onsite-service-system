# Task2374 Depot Workshop Repair Order Contract Pure Helper

## Scope

Task2374 adds a pure Depot / Workshop repair order contract helper and focused tests.

This task does not wire the helper into routes, controllers, repositories, DB, migrations, provider sending, admin frontend, package dependencies, smoke tests, endpoint probes, server/listener startup, deploy, staging/prod traffic, billing, AI/RAG, Customer Access, Engineer Mobile, or Repair Intake behavior.

Existing runtime behavior is not changed.

## Added files

- `src/depotWorkshop/depotWorkshopRepairOrderContract.js`
- `tests/depotWorkshop/depotWorkshopRepairOrderContract.unit.test.js`
- `tests/depotWorkshop/depotWorkshopRepairOrderContractBoundary.static.test.js`
- `docs/task-2374-depot-workshop-repair-order-contract-pure-helper-no-route-no-db-no-provider-no-package.md`

## Pure contract helper

The helper exports pure functions only:

- `buildDepotWorkshopRepairOrderDraft(input)`
- `validateDepotWorkshopRepairOrderDraft(input)`
- `sanitizeDepotWorkshopRepairOrderInternalDraft(input)`

The helper may import only the Task2373 state model validator.

## Trusted internal scope

The helper requires trusted internal scope before a draft can validate.

The contract draft requires:

- `organizationId`
- `caseId`
- one source reference: `depotIntakeId` or `repairOrderId`
- a valid Depot / Workshop repair order status from Task2373

If no status is supplied, the helper safely defaults to `intake_received`.

Optional internal references may be carried only when safe:

- `tenantId`
- `workflowType`
- `workshopJobId`
- `workshopId`
- `workshopTeamId`
- `assignedTechnicianId`
- `subcontractorOrganizationId`
- `assignmentRelationship`
- `itemRef`
- `productRef`
- `issueSummaryRef`
- `diagnosisSummaryRef`
- `quoteSummaryRef`
- `estimateSummaryRef`
- `partsSummaryRef`
- `qcSummaryRef`
- `customerVisibleProjectionRef`
- `auditEventRef`
- `requestId`
- `createdByActorId`
- `updatedByActorId`

## Output shape

The output shape is a fail-closed envelope with a detached internal draft when valid.

Successful `buildDepotWorkshopRepairOrderDraft(input)` returns:

- `ok: true`
- `valid: true`
- `built: true`
- `reasonCode: depot_workshop_repair_order_draft_built`
- optional `requestId`
- `draft`, a detached internal repair order draft object

Successful `validateDepotWorkshopRepairOrderDraft(input)` returns:

- `ok: true`
- `valid: true`
- `built: false`
- `reasonCode: depot_workshop_repair_order_draft_valid`
- optional `requestId`
- `draft`, a detached internal repair order draft object

Failure responses are fail-closed and include a reason code. The helper does not write, persist, publish, send, or call external systems.

## Forbidden field exclusion

The sanitizer uses allowlisted internal fields only. It omits forbidden fields including:

- `finalAppointmentId`
- formal Field Service Report / Completion Report approval/publication/finalization markers
- customer-visible publication fields
- raw customer contact, address, signature, photo, and private fields
- raw DB rows and raw internal payloads
- provider payload
- billing, settlement, payment, and invoice fields
- AI/RAG/OpenAI/vector fields
- debug, SQL, token, password, secret, stack, and credential fields

## Boundary preservation

Depot / Workshop repair order drafts remain operational/internal workflow records. They are not formal customer-facing Field Service Report approval records, not Completion Report approval records, and not a `finalAppointmentId` mutation path.

No route wiring is introduced. The current Depot route remains assignment-intent prepare-only.

No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.

No provider sending.

No package or package-lock changes.

No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.

No `finalAppointmentId` mutation path.

No customer-visible raw internal data is introduced.

Input mutation protection is covered by unit tests; returned drafts are detached from input objects.

## Non-authorization

Task2374 does not authorize:

- Route path or mount changes.
- Controller creation.
- Repository implementation.
- DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.
- `DATABASE_URL`, Zeabur, env, or secrets inspection.
- Server/listener startup.
- Smoke test execution.
- Endpoint probes, shared runtime, deploy, staging/prod traffic, or health checks.
- Provider sending.
- Package or package-lock changes.
- Auth/session middleware changes.
- Permission model changes, role expansion, or organization isolation source changes.
- AI/RAG/OpenAI/vector DB runtime behavior.
- Admin frontend behavior.
- Billing/settlement/payment/invoice behavior.
- Customer Access runtime behavior changes.
- Engineer Mobile runtime behavior changes.
- Repair Intake runtime behavior changes.

## Test coverage

The unit test proves:

- a valid internal repair order draft is built from trusted fields
- missing organization, case, or source reference fails closed
- invalid status fails closed
- missing status defaults to `intake_received`
- optional tenant and assignment references are carried only when safe
- forbidden field exclusion omits formal report, final appointment, raw/private/system/provider/billing/AI/debug fields
- input mutation protection keeps the source object unchanged and returns detached draft objects

The static guard proves:

- the helper imports only the safe Task2373 state model module
- the helper has no DB, repository, provider, route, app, server, env, or package imports
- the helper is not wired into routes, controllers, repositories, services, or guards
- the helper does not approve, publish, formalize, or mutate Field Service Report / Completion Report behavior
- the helper does not mutate `finalAppointmentId`
- no route/API/controller/DB/migration/provider/smoke/package authorization is introduced

## Held files

The 7 held historical docs remain outside Task2374 scope and must stay untracked, unstaged, and untouched.
