# Task2381 Depot Workshop Repair Order Helper Workshop Assignment Service Integration

## Scope

Task2381 integrates the accepted pure Depot / Workshop repair order helpers into the existing WorkshopAssignmentService prepare-only boundary.

Exact service boundary changed:

- `src/services/WorkshopAssignmentService.js#createWorkshopAssignmentService().prepareAssignmentIntent`

No route, controller, repository implementation, DB, migration, SQL execution, real DB connection, provider sending, package, package-lock, smoke, endpoint, server/listener startup, shared runtime, deploy, staging/prod traffic, `/healthz`, admin frontend, Customer Access, Engineer Mobile, Repair Intake, billing, settlement, payment, invoice, AI/RAG/OpenAI/vector DB, env, Zeabur, or secrets behavior changed.

## Final Service Integration Behavior

The service still performs the same accepted prepare-only flow:

- validates command and assignment intent input
- rejects `writeRequested`, `writeApproved`, and `persist`
- reads depot intake state through the existing injected `depotIntakeRepository.findDepotIntakeState`
- validates organization, tenant, brand, service-provider, and subcontractor boundaries
- returns `written: false`
- returns `writeRequired: false` inside the assignment intent
- preserves the existing route write-scope boundary outside the service

When the read-only depot intake state contains enough safe repair-order context, the assignment intent is enriched with detached helper-derived sections:

- `repairOrderDraft`
- `repairOrderTransitionPlan`
- `repairOrderAuditIntent`
- `repairOrderCustomerProjection`

When required helper context is absent, helper-derived sections are omitted safely and the existing base assignment intent remains compatible.

Invalid transition planning is omitted safely. It does not fail the base prepare-only assignment intent and does not write state.

## Helper Usage

The service imports only accepted pure helpers:

- `buildDepotWorkshopRepairOrderDraft`
- `planDepotWorkshopRepairOrderStatusTransition`
- `buildDepotWorkshopRepairOrderAuditEvent`
- `buildDepotWorkshopRepairOrderCustomerProjection`

Helper usage remains bounded:

- repair order contract helper shapes internal draft intent only
- transition policy helper plans/validates only and does not write state
- audit event helper prepares an internal-only audit intent only and does not write DB/audit persistence
- customer projection helper prepares allowlisted projection only and does not publish

## Safety Status

Task2381 preserves:

- `written: false`
- prepare-only route behavior
- `depot_repair_route_write_scope_not_approved`
- injected repository read behavior only
- no direct SQL or DB write behavior
- no route helper wiring
- brand, service-provider, and subcontractor access boundaries
- customer-visible minimization
- sanitized failure envelopes
- detached helper-derived output sections

Task2381 does not introduce or expose:

- `finalAppointmentId`
- formal Field Service Report / Completion Report creation, approval, publication, or finalization markers
- raw customer contact/address/signature/photo/private fields
- provider payload
- billing/settlement/payment/invoice fields
- AI/RAG/OpenAI/vector fields
- debug/internal raw SQL/token/password/secret fields

## Static Guard Coverage

The Task2381 static guard asserts:

- helper imports in `WorkshopAssignmentService` are limited to accepted pure helpers
- service remains prepare-only and `written: false`
- service does not import DB, repository implementation, provider, route, app, server, env, or package modules beyond the accepted pure helper imports
- service does not approve route write scope
- service does not approve, publish, formalize, or mutate Field Service Report / Completion Report behavior
- service does not mutate `finalAppointmentId`
- route file still blocks write scope
- no route/API/controller/DB/migration/provider/smoke/package authorization is introduced

## Non-Authorization

Task2381 does not authorize:

- No route path or mount changes.
- controller creation
- repository implementation
- new DB behavior
- No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.
- `DATABASE_URL`, Zeabur, env, or secrets inspection
- server/listener startup
- smoke test execution
- endpoint probes
- shared runtime
- deploy
- staging/prod traffic
- `/healthz`
- No provider sending.
- No package or package-lock changes.
- auth/session middleware changes
- permission model changes, role expansion, or organization isolation source changes
- AI/RAG/OpenAI/vector DB runtime behavior
- admin frontend behavior
- billing/settlement/payment/invoice behavior
- Customer Access runtime behavior changes
- Engineer Mobile runtime behavior changes
- Repair Intake runtime behavior changes
- No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.
- No `finalAppointmentId` mutation path.

## Held Docs

The 7 held historical docs remain outside Task2381 scope and must stay untracked, unstaged, and untouched.
