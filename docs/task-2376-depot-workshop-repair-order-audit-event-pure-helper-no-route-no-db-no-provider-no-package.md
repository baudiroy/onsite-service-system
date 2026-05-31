# Task2376 Depot Workshop Repair Order Audit Event Pure Helper

## Scope

Task2376 adds a pure Depot / Workshop repair order audit event helper and focused tests.

This task does not wire the helper into routes, controllers, repositories, services, DB, migrations, provider sending, admin frontend, package dependencies, smoke tests, endpoint probes, server/listener startup, deploy, staging/prod traffic, billing, AI/RAG, Customer Access, Engineer Mobile, or Repair Intake behavior.

Existing runtime behavior is not changed.

## Added files

- `src/depotWorkshop/depotWorkshopRepairOrderAuditEvent.js`
- `tests/depotWorkshop/depotWorkshopRepairOrderAuditEvent.unit.test.js`
- `tests/depotWorkshop/depotWorkshopRepairOrderAuditEventBoundary.static.test.js`
- `docs/task-2376-depot-workshop-repair-order-audit-event-pure-helper-no-route-no-db-no-provider-no-package.md`

## Pure Audit Helper

The helper exports:

- `DEPOT_WORKSHOP_REPAIR_ORDER_AUDIT_EVENT_TYPES`
- `buildDepotWorkshopRepairOrderAuditEvent(input)`
- `sanitizeDepotWorkshopRepairOrderAuditMetadata(input)`

The helper imports no runtime modules.

## Event Taxonomy

The event taxonomy is:

- `depot_workshop_repair_order_created`
- `depot_workshop_repair_status_transition_planned`
- `depot_workshop_repair_assignment_intent_prepared`
- `depot_workshop_repair_customer_projection_prepared`
- `depot_workshop_repair_audit_sanitized`

## Trusted Scope Validation

The helper requires trusted scope validation before an audit event can be built:

- `organizationId`
- `caseId`
- one source reference: `depotIntakeId` or `repairOrderId`
- `eventType`

Optional internal refs may be carried only when safe:

- `tenantId`
- `actorId`
- `actorRole`
- `requestId`
- `correlationId`

## Metadata Sanitization

The metadata sanitization allowlist includes:

- event, organization, case, repair order, depot intake, tenant, actor, request, and correlation refs
- from/to/depot status markers
- transition reason, assignment status, projection status, audit status, and data profile markers
- occurred-at timestamp text

The helper returns detached internal-only audit event objects. It never mutates input.

## Output Shape

Successful event building returns:

- `ok: true`
- `built: true`
- `reasonCode: depot_workshop_repair_order_audit_event_built`
- optional `requestId`
- `auditEvent`, a detached internal-only event with `internalOnly: true` and `customerVisible: false`

Failure responses are fail-closed and include a reason code. The helper does not write, persist, publish, send, or call external systems.

## Forbidden Field Exclusion

The helper fails closed when forbidden audit input fields are present, including:

- `finalAppointmentId`
- formal Field Service Report / Completion Report creation, approval, publication, and finalization markers
- customer-visible publication fields
- raw customer contact, address, signature, photo, and private fields
- raw DB rows and raw internal payloads
- provider payload
- billing, settlement, payment, and invoice fields
- AI/RAG/OpenAI/vector fields
- debug, SQL, token, password, secret, stack, and credential fields
- raw exception stack traces

## Boundary Preservation

Depot / Workshop repair order audit events remain operational/internal workflow records. They are not formal customer-facing Field Service Report approval records, not Completion Report approval records, and not a `finalAppointmentId` mutation path.

No route wiring is introduced. The current Depot route remains assignment-intent prepare-only.

No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.

No provider sending.

No package or package-lock changes.

No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.

No `finalAppointmentId` mutation path.

No customer-visible raw internal data is introduced.

Input mutation protection is covered by unit tests; returned audit event objects are detached from input objects.

## Non-authorization

Task2376 does not authorize:

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

- valid audit event is built from trusted fields
- missing organization, case, or source reference fails closed
- invalid event type fails closed
- optional tenant, actor, and request refs are carried only when safe
- audit metadata is sanitized and allowlisted
- forbidden field exclusion blocks formal report, final appointment, raw/private/system/provider/billing/AI/debug fields
- helper does not perform DB writes or provider sending
- input mutation protection keeps the source object unchanged and returns detached audit event objects

The static guard proves:

- the helper imports no DB, repository, provider, route, app, server, env, or package modules
- the helper is not wired into routes, controllers, repositories, services, or guards
- the helper does not approve, publish, formalize, or mutate Field Service Report / Completion Report behavior
- the helper does not mutate `finalAppointmentId`
- the existing audit boundary remains internal-only and sanitized
- no route/API/controller/DB/migration/provider/smoke/package authorization is introduced

## Held files

The 7 held historical docs remain outside Task2376 scope and must stay untracked, unstaged, and untouched.
