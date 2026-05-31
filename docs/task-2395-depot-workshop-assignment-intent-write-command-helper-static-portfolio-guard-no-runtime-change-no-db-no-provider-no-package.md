# Task2395 Depot Workshop Assignment Intent Write Command Helper Static Portfolio Guard

## Scope

Task2395 adds a static/docs portfolio guard for the accepted Depot / Workshop assignment-intent write command helper branch from Task2392 through Task2394.

This is a no-runtime-change static/docs task. No runtime/source behavior changes. No helper implementation changes. No route write-scope behavior. No route response source changes. No route wiring. No route path or mount changes. No helper wiring into existing runtime. No permission changes. No service behavior changes. No controllers, repositories, DB behavior, migrations, provider sending, packages, smoke tests, server startup, deploy, staging/prod traffic, billing, AI/RAG, Customer Access, Engineer Mobile, Repair Intake, formal Field Service Report / Completion Report, or final appointment behavior.

## Current Write Command Helper Status

This section records current write command helper status and safety boundaries.

The accepted current status is:

- Task2392 defines future route write-scope prerequisites and keeps route writes blocked.
- Task2393 defines the pure write command helper design and exact write action.
- Task2394 adds the pure helper, unit tests, static boundary guard, and helper doc.
- helper file exists: `src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand.js`
- helper export exists: `buildDepotWorkshopAssignmentIntentWriteCommand`
- exact action remains `depot_workshop.assignment_intent.write`
- helper imports only accepted pure helpers
- helper is not wired into routes, services, controllers, repositories, DB, or provider sending
- route write scope remains blocked in `src/routes/depotRepair.routes.js`
- `depot_repair_route_write_scope_not_approved` remains visible
- no route write-scope behavior is authorized

## Command Safety Status

The accepted command safety status is:

- trusted organization/case/source scope is required
- actor/write authorization is required
- transition validation remains represented through the accepted transition policy
- audit intent remains internal-only and sanitized
- customer projection preview remains safe allowlisted preview only
- no DB persistence result
- no repository write result
- no provider payload
- no formal Field Service Report / Completion Report creation, approval, publication, or finalization
- no `finalAppointmentId` mutation
- no billing/payment/invoice payload
- no AI/RAG payload
- no SQL/stack/token/password/secret/debug payload

## Static Portfolio Coverage

Task2395 adds:

- `tests/depotWorkshop/depotWorkshopAssignmentIntentWriteCommandPortfolio.static.test.js`

The static guard reads source/test/doc files only and asserts:

- Task2392 authorization packet exists
- Task2393 design packet exists
- Task2394 helper doc/tests exist
- helper file exists
- helper export and exact action remain visible
- helper imports only accepted pure helpers
- helper has no DB/repository/provider/route/app/server/env/package imports
- helper is not wired into routes/services/controllers/repositories
- route write scope remains blocked
- command safety is covered by helper source, docs, and tests
- forbidden DB/provider/package/formal-report/finalAppointmentId/billing/AI/secret behavior remains absent

## Non-Authorized Candidate Tasks

The following tasks are candidates only and are not authorized by this portfolio guard:

- write command helper branch closure
- route write-scope decision gate
- repository/migration authorization packet
- admin UI design packet

## Non-Authorization

Task2395 does not authorize:

- runtime/source behavior changes
- helper implementation changes
- route write-scope behavior
- route response source changes
- route wiring changes
- route path or mount changes
- helper wiring into existing runtime
- permission changes
- service behavior changes
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

The 7 held historical docs remain outside Task2395 scope and must stay untracked, unstaged, and untouched.
