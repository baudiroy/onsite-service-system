# Task2377 Depot Workshop Repair Order Customer Visible Projection Pure Helper

## Scope

Task2377 adds a pure Depot / Workshop repair order customer-visible projection helper and focused tests.

This task does not wire the helper into routes, controllers, repositories, DB, migrations, provider sending, admin frontend, package dependencies, smoke tests, endpoint probes, server/listener startup, deploy, staging/prod traffic, billing, AI/RAG, Customer Access, Engineer Mobile, or Repair Intake behavior.

Existing runtime behavior is not changed.

## Added files

- `src/depotWorkshop/depotWorkshopRepairOrderCustomerProjection.js`
- `tests/depotWorkshop/depotWorkshopRepairOrderCustomerProjection.unit.test.js`
- `tests/depotWorkshop/depotWorkshopRepairOrderCustomerProjectionBoundary.static.test.js`
- `docs/task-2377-depot-workshop-repair-order-customer-visible-projection-pure-helper-no-route-no-db-no-provider-no-package.md`

## Customer-Visible Projection Helper Contract

The customer-visible projection helper contract exports:

- `DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_PROJECTION_FIELDS`
- `buildDepotWorkshopRepairOrderCustomerProjection(input)`
- `sanitizeDepotWorkshopRepairOrderCustomerProjection(input)`

The helper imports no runtime modules.

## Allowlist

The allowlist is:

- `repairOrderReference`
- `caseReference`
- `depotStatus`
- `statusLabelKey`
- `lastUpdatedAt`
- `customerMessageKey`
- `estimatedReadyAt`
- `returnMethod`
- `publicNotes`

Only customer-safe scalar fields already present in input are emitted.

## Projection Rules

The helper accepts plain object input only for build. The sanitizer returns an empty safe projection for malformed input.

The helper returns detached safe projection objects and never mutates input.

Operational/internal workflow details remain hidden beyond the approved projection allowlist.

Diagnosis, quote, parts, and quality-check internals are not exposed unless represented as safe public message keys or safe public notes.

## Forbidden Field Exclusion

The helper omits forbidden fields including:

- `finalAppointmentId`
- formal Field Service Report / Completion Report creation, approval, publication, and finalization markers
- raw Case, Appointment, Completion Report, and Field Service Report objects
- customer-visible publication fields
- raw customer contact, address, signature, photo, and private fields
- raw DB rows and raw internal payloads
- internal workshop assignment refs, technician ids, and subcontractor internals
- provider payload
- billing, settlement, payment, and invoice fields
- AI/RAG/OpenAI/vector fields
- audit internals
- debug, SQL, token, password, secret, stack, and credential fields

## Boundary Preservation

Depot / Workshop customer-visible projection remains a projection only. It is not formal customer-facing Field Service Report publication, not Completion Report publication, and not a `finalAppointmentId` mutation path.

No route wiring is introduced. The current Depot route remains assignment-intent prepare-only.

No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.

No provider sending.

No package or package-lock changes.

No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.

No `finalAppointmentId` mutation path.

No customer-visible raw internal data is introduced.

Input mutation protection is covered by unit tests; returned projection objects are detached from input objects.

## Non-authorization

Task2377 does not authorize:

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

- valid customer projection is built from safe fields
- malformed input fails closed or returns empty safe projection according to helper contract
- only customer-safe fields are emitted
- internal assignment, workshop, subcontractor, provider, billing, AI, audit, and debug fields are omitted
- forbidden field exclusion blocks formal report, final appointment, raw Case/Appointment/report/customer data fields
- input mutation protection keeps the source object unchanged and returns detached projection objects

The static guard proves:

- the helper imports no DB, repository, provider, route, app, server, env, or package modules
- the helper is not wired into routes, controllers, repositories, services, or guards
- the helper does not approve, publish, formalize, or mutate Field Service Report / Completion Report behavior
- the helper does not mutate or expose `finalAppointmentId`
- the existing customer visible data filter remains allowlist/projection-only
- no route/API/controller/DB/migration/provider/smoke/package authorization is introduced

## Held files

The 7 held historical docs remain outside Task2377 scope and must stay untracked, unstaged, and untouched.
