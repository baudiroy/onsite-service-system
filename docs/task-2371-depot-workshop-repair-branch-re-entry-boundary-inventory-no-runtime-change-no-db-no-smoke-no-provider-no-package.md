# Task2371 Depot Workshop Repair Branch Re-entry Boundary Inventory

## Scope

Task2371 records a source-reading boundary inventory for Depot / Workshop Repair after the Repair Intake rollout readiness branch.

This is a no-runtime-change inventory task. It does not implement runtime behavior, route changes, controllers, repositories, DB, migrations, provider sending, package changes, smoke tests, endpoint probes, server/listener startup, admin frontend behavior, billing behavior, AI/RAG behavior, Customer Access behavior, Engineer Mobile behavior, or Repair Intake runtime behavior.

The existing module-specific test convention is `tests/depotWorkshop/`, so the Task2371 guard is added there:

- `tests/depotWorkshop/depotWorkshopRepairBranchReentryBoundaryInventory.static.test.js`

## Existing docs found

- `docs/design/depot-workshop-repair.md` exists and defines Depot / Workshop Repair as a second service workflow beside on-site service.
- `docs/design/README.md` indexes the Depot / Workshop design doc and states that design docs are not runtime approval.
- `docs/PROJECT_GUARDRAILS.md` contains the full source-of-truth guardrails.
- `docs/PROJECT_SHORT_INSTRUCTION.md` contains the compact hard-boundary instruction.
- Historical Depot / Workshop task docs exist for the prior no-DB runtime scope, including Task1908 through Task1918.

## Existing runtime source found

Depot / Workshop runtime source exists, but it is bounded and no-DB/no-write in the accepted shape:

- `src/guards/DepotRepairStatusBoundary.js`: status transition boundary for depot/carry-in/mail-in/pickup-delivery workflows.
- `src/guards/DepotAccessScopeGuard.js`: brand/service-provider/subcontractor access scope guard.
- `src/services/WorkshopAssignmentService.js`: workshop assignment intent preparation service; prepares intent with `written: false`.
- `src/routes/depotRepair.routes.js`: permission-gated route boundary for `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`.
- `src/depotWorkshop/depotRepairCustomerVisibleDataFilter.js`: customer-visible DTO allowlist filter only.
- `src/depotWorkshop/depotWorkshopAuditBoundary.js`: internal-only sanitized audit event boundary.
- `src/repositories/DepotIntakeSqlRepositoryAdapter.js`: injected `dbClient` read-only adapter over existing `repair_intake_drafts` safe fields.

## Existing tests found

Existing Depot / Workshop tests use `tests/depotWorkshop/`:

- `depotAccessScopeGuard.static.test.js`
- `depotAccessScopeGuard.unit.test.js`
- `depotIntakeSqlRepositoryAdapter.unit.test.js`
- `depotIntakeSqlRepositoryAdapterBoundary.static.test.js`
- `depotRepairCustomerVisibleDataFilter.static.test.js`
- `depotRepairCustomerVisibleDataFilter.unit.test.js`
- `depotRepairRoutePermissionGuard.static.test.js`
- `depotRepairRoutePermissionGuard.unit.test.js`
- `depotRepairStatusBoundary.static.test.js`
- `depotRepairStatusBoundary.unit.test.js`
- `depotWorkshopAuditBoundary.static.test.js`
- `depotWorkshopAuditBoundary.unit.test.js`
- `workshopAssignmentService.static.test.js`
- `workshopAssignmentService.unit.test.js`

## Route API controller repository DB migration provider admin inventory

- Route/API boundary exists: `src/routes/depotRepair.routes.js`.
- Existing route path: `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`.
- Existing permission marker: `depot.repair.prepare`.
- Existing route is prepare-only and blocks write requests with `depot_repair_route_write_scope_not_approved`.
- Depot / Workshop controller: none found under `src/controllers/`.
- Repository boundary exists: `src/repositories/DepotIntakeSqlRepositoryAdapter.js`.
- Repository is injected-client/read-only; Task2371 did not run DB or SQL.
- Dedicated Depot / Workshop DB migration: none found.
- Provider sending boundary: no Depot / Workshop provider-sending module found.
- Admin frontend Depot / Workshop UI/API client: none found in `admin/src/`.

## Project invariants preserved

Depot / Workshop Repair must preserve these invariants:

- It must not create a second formal Field Service Report / Completion Report for one Case.
- Workshop/internal repair records remain operational workflow records, not formal customer-facing report approval.
- `finalAppointmentId` remains system-owned.
- Customer-visible data remains projection/allowlist only.
- Organization/tenant isolation remains required.
- Technician/engineer/service-provider/subcontractor access remains permission scoped.
- Provider sending remains separately authorized only.
- AI/RAG must not expand scope or bypass permission.

## Expected future domain boundaries

Future Depot / Workshop work should keep these boundaries explicit:

- Case handoff to workshop/depot.
- Depot repair order / workshop job record.
- Parts, diagnosis, quote, and estimate markers from design docs.
- Status transitions.
- Assignment/ownership context.
- Customer-visible vs internal-only data.
- Audit events.
- Billing/settlement boundaries as non-authorized until a separate exact task.

## Candidate future source boundary

Because runtime source already exists, the safest next bounded source task is not a broad implementation. Recommended next exact bounded source task:

Depot Workshop Repair Order Contract and State Model Static Guard / No DB No Route No Provider No Package.

Reason: the current route can prepare assignment intent, the status boundary exists, and the repository adapter reads existing Repair Intake draft state, but there is not yet a dedicated Depot repair order / workshop job contract that freezes safe fields, state names, internal-only fields, customer-visible projection handoff, and no-Field-Service-Report mutation boundaries. A pure contract/static guard can define that next boundary without adding DB, route, controller, provider, package, smoke, or runtime write behavior.

This recommendation is non-authorized and must not start without explicit PM approval.

## Static guard coverage

The Task2371 guard asserts:

- Project guardrails mention Case / Field Service Report / Completion Report / `finalAppointmentId` boundaries.
- Depot / Workshop design doc exists.
- Inventory doc exists.
- Existing Depot / Workshop source and tests remain visible.
- No new route/API/controller/runtime behavior is authorized by Task2371.
- No DB/migration/provider/smoke/package authorization is introduced.
- No public/open/customer route is introduced.
- Future task recommendation is explicit and non-authorized.

## Non-authorized scope preserved

Task2371 does not introduce:

- Runtime/source behavior changes.
- Route path or mount changes.
- Controller creation.
- Repository implementation.
- DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.
- `DATABASE_URL`, Zeabur, env, or secrets inspection.
- Server/listener startup.
- Smoke test execution.
- Endpoint probes.
- Shared runtime, deploy, staging/prod traffic, or health checks.
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

## Held files

The 7 held historical docs remain outside Task2371 scope and must stay untracked, unstaged, and untouched.
