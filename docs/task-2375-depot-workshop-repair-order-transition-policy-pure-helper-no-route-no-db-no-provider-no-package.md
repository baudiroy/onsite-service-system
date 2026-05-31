# Task2375 Depot Workshop Repair Order Transition Policy Pure Helper

## Scope

Task2375 adds a pure Depot / Workshop repair order transition policy helper and focused tests.

This task does not wire the helper into routes, controllers, repositories, services, DB, migrations, provider sending, admin frontend, package dependencies, smoke tests, endpoint probes, server/listener startup, deploy, staging/prod traffic, billing, AI/RAG, Customer Access, Engineer Mobile, or Repair Intake behavior.

Existing runtime behavior is not changed.

## Added files

- `src/depotWorkshop/depotWorkshopRepairOrderTransitionPolicy.js`
- `tests/depotWorkshop/depotWorkshopRepairOrderTransitionPolicy.unit.test.js`
- `tests/depotWorkshop/depotWorkshopRepairOrderTransitionPolicyBoundary.static.test.js`
- `docs/task-2375-depot-workshop-repair-order-transition-policy-pure-helper-no-route-no-db-no-provider-no-package.md`

## Pure transition policy helper

The helper exports:

- `DEPOT_WORKSHOP_REPAIR_ORDER_ALLOWED_TRANSITIONS`
- `canTransitionDepotWorkshopRepairOrderStatus(input)`
- `planDepotWorkshopRepairOrderStatusTransition(input)`

The helper may import only the safe Task2373 state model module and the safe Task2374 contract helper.

## Trusted Scope Validation

The policy requires trusted scope validation before a transition can be planned:

- `organizationId`
- `caseId`
- one source reference: `depotIntakeId` or `repairOrderId`
- `fromStatus`
- `toStatus`

Actor references are optional and internal-only.

Both statuses are validated with the Task2373 state model. Trusted draft scope is validated with the Task2374 contract helper.

## Allowed Transition Model

The allowed transition model is:

- `intake_received` -> `diagnosis_pending`
- `diagnosis_pending` -> `diagnosis_completed`
- `diagnosis_completed` -> `quote_pending`
- `quote_pending` -> `quote_approved`
- `quote_approved` -> `repair_in_progress`
- `repair_in_progress` -> `quality_check`
- `quality_check` -> `ready_for_return`
- `ready_for_return` -> `returned`
- `returned` -> `closed`
- every non-terminal active state may transition to `cancelled`

Terminal states are:

- `cancelled`
- `closed`

Terminal states do not transition further.

## Output Shape

Successful transition planning returns:

- `ok: true`
- `allowed: true`
- `planned: true`
- `reasonCode: depot_workshop_repair_order_transition_planned`
- optional `requestId`
- `plannedTransition`, a detached internal transition plan containing organization, case, source reference, optional tenant, from/to status, optional actor, and optional request id

Failure responses are fail-closed and include a reason code. The helper does not write, persist, publish, send, or call external systems.

## Forbidden Field Exclusion

The policy fails closed when forbidden transition input fields are present, including:

- `finalAppointmentId`
- formal Field Service Report / Completion Report creation, approval, publication, and finalization markers
- customer-visible publication fields
- raw customer contact, address, signature, photo, and private fields
- raw DB rows and raw internal payloads
- provider payload
- billing, settlement, payment, and invoice fields
- AI/RAG/OpenAI/vector fields
- debug, SQL, token, password, secret, stack, and credential fields

## Boundary Preservation

Depot / Workshop repair order transitions remain operational/internal workflow planning. They are not formal customer-facing Field Service Report approval records, not Completion Report approval records, and not a `finalAppointmentId` mutation path.

No route wiring is introduced. The current Depot route remains assignment-intent prepare-only.

No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.

No provider sending.

No package or package-lock changes.

No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.

No `finalAppointmentId` mutation path.

No customer-visible raw internal data is introduced.

Input mutation protection is covered by unit tests; returned transition plans are detached from input objects.

## Non-authorization

Task2375 does not authorize:

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

- valid allowed transition returns a safe planned transition result
- invalid transition fails closed
- unknown status fails closed
- terminal status transition fails closed
- missing organization, case, or source reference fails closed
- cancellation from active states is allowed
- forbidden field exclusion blocks formal report, final appointment, raw/private/system/provider/billing/AI/debug fields
- input mutation protection keeps the source object unchanged and returns detached transition plans

The static guard proves:

- the helper imports only the safe Task2373 state model and Task2374 contract helper modules
- the helper has no DB, repository, provider, route, app, server, env, or package imports
- the helper is not wired into routes, controllers, repositories, services, or guards
- the helper does not approve, publish, formalize, or mutate Field Service Report / Completion Report behavior
- the helper does not mutate `finalAppointmentId`
- no route/API/controller/DB/migration/provider/smoke/package authorization is introduced

## Held files

The 7 held historical docs remain outside Task2375 scope and must stay untracked, unstaged, and untouched.
