# Task2398 Depot Workshop Repair Order Repository Contract Pure Helper

## Scope

Task2398 adds a pure source-level contract helper for future Depot / Workshop repair order repository persistence.

This is a source-level contract task with unit/static tests only. It does not implement a DB repository, create migrations, execute SQL/DB, enable route write scope, wire the helper into runtime, change route responses, change route path or mount, change permissions, change service behavior, create controllers, add provider sending, change package dependencies, run smoke tests, start servers, inspect env/Zeabur/secrets, deploy, touch billing, touch AI/RAG, touch Repair Intake runtime behavior, create or mutate formal Field Service Report / Completion Report data, or mutate `finalAppointmentId`.

## Added Contract Helper

Task2398 adds:

- `src/depotWorkshop/depotWorkshopRepairOrderRepositoryContract.js`

The helper exports:

- `DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND`
- `normalizeDepotWorkshopRepairOrderRepositoryWriteCommand(input)`
- `normalizeDepotWorkshopRepairOrderRepositoryResult(input)`
- `buildDepotWorkshopRepairOrderRepositorySafeFailure(reasonCode, details)`

The helper has no imports. It does not import DB clients, repositories, providers, routes, app/server modules, env, package metadata, or migration files.

## Repository Write Command Contract

`normalizeDepotWorkshopRepairOrderRepositoryWriteCommand(input)` accepts only a safe command envelope from `buildDepotWorkshopAssignmentIntentWriteCommand`.

The normalized repository command requires:

- `ok: true`
- exact action `depot_workshop.assignment_intent.write`
- `organizationId`
- `caseId`
- `depotIntakeId` or `repairOrderId`
- optional trusted `tenantId`
- safe assignment/workshop references
- safe actor/request references

The normalized repository command returns:

- `ok`
- `status`
- `reasonCode`
- `repositoryKind`
- `action`
- safe detached `command`
- sanitized internal `auditIntent` when present
- safe `customerProjectionPreview` when present
- `written: false`
- `requestId` when present

The contract does not write. `written: false` remains the pure contract state before any future repository adapter result exists.

## Repository Result Contract

`normalizeDepotWorkshopRepairOrderRepositoryResult(input)` normalizes only safe future adapter result envelopes.

The minimal success result contains:

- `ok`
- `status`
- `reasonCode`
- `repositoryKind`
- `repairOrderReference`
- `organizationId`
- `tenantId` when present
- `caseId`
- `depotIntakeId` or `repairOrderId`
- `written`
- `requestId` when present

`written` only reflects a future repository adapter result. It does not authorize route write scope.

Malformed, failed, unsafe, or cross-scope-looking results fail closed.

## Forbidden Field Handling

The contract fails closed or omits unsafe fields for:

- `finalAppointmentId`
- formal Field Service Report / Completion Report creation, approval, publication, finalization markers
- raw customer contact, address, signature, photo, or private fields
- raw DB rows
- SQL, stack, token, password, and secret content
- provider payloads
- billing, settlement, payment, and invoice internals
- AI/RAG/OpenAI/vector payloads
- raw repository errors
- raw audit payloads beyond sanitized internal audit intent

## Tests

Task2398 adds:

- `tests/depotWorkshop/depotWorkshopRepairOrderRepositoryContract.unit.test.js`
- `tests/depotWorkshop/depotWorkshopRepairOrderRepositoryContractBoundary.static.test.js`

The unit tests prove:

- valid safe write command normalizes into repository command contract
- missing trusted organization/case/source/action fails closed
- malformed command fails closed
- unsafe or cross-scope-looking result fails closed
- safe repository success result is normalized without raw payload leakage
- forbidden FSR / Completion Report / `finalAppointmentId` fields are not emitted
- no DB/repository adapter/provider result is executed
- input objects are not mutated and output is detached

The static guard asserts:

- helper has no DB/repository/provider/route/app/server/env/package imports
- helper is not wired into routes/services/controllers/repositories
- no migration file is added
- route write scope remains blocked in `src/routes/depotRepair.routes.js`
- pure write command helper remains the upstream command source
- no SQL strings or DB client usage
- no formal FSR / Completion Report / `finalAppointmentId` mutation behavior
- Task2397 packet remains visible
- no route/API/controller/DB/migration/provider/smoke/package authorization is introduced

No DB commands. No SQL execution. No migration creation. No route write-scope behavior. No provider sending. No package or package-lock changes. No formal Field Service Report / Completion Report creation, approval, publication, or finalization behavior. No `finalAppointmentId` mutation path.

## Current Boundary Status

Task2398 keeps the current boundaries unchanged:

- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`
- `WorkshopAssignmentService` remains prepare-only
- `DepotIntakeSqlRepositoryAdapter` remains read-only
- pure write command helper remains unwired
- no dedicated Depot / Workshop repair order repository implementation exists
- no dedicated Depot / Workshop migration exists

## Non-Authorization

Task2398 does not authorize:

- runtime/source behavior changes outside adding the pure contract helper
- repository implementation
- DB adapter implementation
- route write-scope behavior
- route response source changes
- route wiring changes
- route path or mount changes
- helper wiring into existing runtime
- permission changes
- service behavior changes
- controller creation
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

The 7 held historical docs remain outside Task2398 scope and must stay untracked, unstaged, and untouched.
