# Task2373 Depot Workshop Repair Order State Model Pure Constants Helper

## Scope

Task2373 adds a pure Depot / Workshop repair order state model helper and focused tests.

This task does not wire the helper into routes, controllers, repositories, DB, migrations, provider sending, admin frontend, package dependencies, smoke tests, endpoint probes, server/listener startup, deploy, staging/prod traffic, billing, AI/RAG, Customer Access, Engineer Mobile, or Repair Intake behavior.

Existing runtime route behavior is not changed.

## Added files

- `src/depotWorkshop/depotWorkshopRepairOrderStateModel.js`
- `tests/depotWorkshop/depotWorkshopRepairOrderStateModel.unit.test.js`
- `tests/depotWorkshop/depotWorkshopRepairOrderStateModelBoundary.static.test.js`
- `docs/task-2373-depot-workshop-repair-order-state-model-pure-constants-helper-no-route-no-db-no-provider-no-package.md`

## Pure helper contract

The helper exports constants and pure functions only:

- `DEPOT_WORKSHOP_REPAIR_ORDER_STATUSES`
- `DEPOT_WORKSHOP_REPAIR_ORDER_TERMINAL_STATUSES`
- `DEPOT_WORKSHOP_REPAIR_ORDER_INTERNAL_ONLY_FIELDS`
- `DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_VISIBLE_FIELDS`
- `isDepotWorkshopRepairOrderStatus(value)`
- `isDepotWorkshopRepairOrderTerminalStatus(value)`
- `sanitizeDepotWorkshopRepairOrderPublicProjection(input)`

The active status model is source-backed by the current Depot repair status boundary:

- `intake_received`
- `diagnosis_pending`
- `diagnosis_completed`
- `quote_pending`
- `quote_approved`
- `repair_in_progress`
- `quality_check`
- `ready_for_return`
- `returned`
- `cancelled`
- `closed`

`repair_waiting_parts` remains a future proposal only and is not exported as an active status.

Terminal states are:

- `cancelled`
- `closed`

## Customer-visible projection

The helper keeps the customer-visible projection bounded to explicit safe fields only.

The sanitizer accepts only plain objects and returns detached projection objects/arrays. It does not mutate the input.

Customer-visible projection is allowlisted to:

- `customerRepairReference`
- `workflowType`
- `displayStatus`
- `statusSummary`
- `issueSummary`
- `workSummary`
- `nextCustomerAction`
- `estimatedReadyAt`
- `readyForReturnAt`
- `returnedAt`
- `lastCustomerUpdateAt`
- `supportContactHint`

Internal repair order fields remain internal-only. Forbidden field exclusion covers:

- `finalAppointmentId`
- formal Field Service Report / Completion Report markers
- customer-visible publication fields
- raw customer contact, address, signature, photo, and private fields
- raw DB rows and raw internal payloads
- provider payload
- billing, settlement, payment, and invoice fields
- AI/RAG/OpenAI/vector fields
- debug, SQL, token, password, secret, stack, and credential fields

## Boundary preservation

Depot / Workshop repair orders remain operational/internal workflow records. They are not formal customer-facing Field Service Report approval records, not Completion Report approval records, and not a `finalAppointmentId` mutation path.

No route wiring is introduced. The current Depot route remains assignment-intent prepare-only.

No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.

No provider sending.

No package or package-lock changes.

No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior is introduced.

No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.

No `finalAppointmentId` mutation path is introduced.

No `finalAppointmentId` mutation path.

No customer-visible raw internal data is introduced.

## Non-authorization

Task2373 does not authorize:

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

- status constants contain only approved active statuses
- `repair_waiting_parts` is not an active status
- terminal status validation recognizes only terminal states
- invalid and unknown states are rejected
- customer-safe projection uses the allowlist only
- forbidden field exclusion blocks formal report, final appointment, raw/private/system/provider/billing/AI/debug fields
- input mutation protection keeps the source object unchanged and returns detached arrays

The static guard proves:

- the helper has no DB, repository, provider, route, app, server, env, or package imports
- the helper is not wired into `src/routes/depotRepair.routes.js`
- the helper does not approve, publish, formalize, or mutate Field Service Report / Completion Report behavior
- the helper does not mutate `finalAppointmentId`
- the Task2372 repair order contract remains visible
- no route/API/controller/DB/migration/provider/smoke/package authorization is introduced

## Held files

The 7 held historical docs remain outside Task2373 scope and must stay untracked, unstaged, and untouched.
