# Task2378 Depot Workshop Repair Order Pure Helper Portfolio Static Guard

## Scope

Task2378 adds a docs/static-only portfolio guard for the accepted Depot / Workshop repair order pure helper set from Task2373 through Task2377.

This task does not modify runtime/source helper behavior, route wiring, controllers, repositories, DB, migrations, provider sending, admin frontend, package dependencies, smoke tests, endpoint probes, server/listener startup, deploy, staging/prod traffic, billing, AI/RAG, Customer Access, Engineer Mobile, or Repair Intake behavior.

## Pure Helper Portfolio

The current accepted pure helper portfolio is:

- Task2373 state model helper: `src/depotWorkshop/depotWorkshopRepairOrderStateModel.js`
- Task2374 repair order contract helper: `src/depotWorkshop/depotWorkshopRepairOrderContract.js`
- Task2375 transition policy helper: `src/depotWorkshop/depotWorkshopRepairOrderTransitionPolicy.js`
- Task2376 audit event helper: `src/depotWorkshop/depotWorkshopRepairOrderAuditEvent.js`
- Task2377 customer-visible projection helper: `src/depotWorkshop/depotWorkshopRepairOrderCustomerProjection.js`

Each helper has focused unit tests and boundary/static guard tests under `tests/depotWorkshop/`.

## Portfolio Boundaries

The portfolio remains pure and unwired:

- no route/API/controller behavior
- no helper wiring into runtime modules
- no DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply
- no provider sending
- no package or package-lock changes
- no admin frontend behavior
- no billing/settlement/payment/invoice implementation
- no smoke tests, endpoint probes, server/listener startup, shared runtime, deploy, staging/prod traffic, or health checks

The helpers preserve the domain boundaries:

- state model, contract, and transition helpers remain operational/internal workflow policy helpers
- audit event helper remains internal-only and sanitized
- customer-visible projection helper remains allowlist/projection-only
- no formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior
- no `finalAppointmentId` mutation path
- no `finalAppointmentId` customer-visible exposure
- no raw customer contact, address, signature, photo, or private field exposure
- no raw DB row, SQL, token, password, or secret exposure
- no AI/RAG/OpenAI/vector DB runtime behavior or scope expansion

## Static Guard Coverage

The Task2378 static guard asserts:

- all Task2373 through Task2377 helper source files exist
- each helper has focused unit tests
- each helper has boundary/static guard tests
- each helper doc exists
- helper imports are either empty or limited to approved pure helper imports
- helpers do not import DB, repository, provider, route, app, server, env, or package modules
- helpers are not wired into routes, controllers, repositories, services, or guards
- portfolio docs preserve no-route, no-DB, no-provider, no-package, and no-runtime authorization boundaries
- customer projection remains allowlist/projection-only
- audit helper remains internal-only and sanitized
- state, contract, and transition helpers remain operational/internal

## Non-Authorized Candidates Only

Possible next tasks are non-authorized candidates only:

- route wiring decision gate
- workshop assignment service integration decision gate
- repository/migration authorization packet
- admin UI design packet
- branch closure

None of these candidates may start without explicit PM authorization.

## Non-Authorization

Task2378 does not authorize:

- Runtime/source behavior changes.
- Route path or mount changes.
- Helper wiring changes.
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
- Formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior.
- `finalAppointmentId` mutation path.

## Held Files

The 7 held historical docs remain outside Task2378 scope and must stay untracked, unstaged, and untouched.
