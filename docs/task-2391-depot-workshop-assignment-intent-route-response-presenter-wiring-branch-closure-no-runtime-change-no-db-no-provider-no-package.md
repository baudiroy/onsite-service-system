# Task2391 Depot Workshop Assignment Intent Route Response Presenter Wiring Branch Closure

## Scope

Task2391 closes the Depot / Workshop assignment-intent route response presenter wiring branch for this phase.

This is a docs-only closure. It does not change runtime/source/test behavior, route response source, route wiring, route path or mount, helper wiring, permission, service behavior, controllers, repositories, DB, migrations, provider sending, package dependencies, smoke tests, endpoint probes, server/listener startup, deploy, staging/prod traffic, billing, AI/RAG, Customer Access, Engineer Mobile, Repair Intake, formal Field Service Report / Completion Report, or final appointment behavior.

## Accepted Outcomes

The accepted Task2385 through Task2390 outcomes are:

- Task2385 identified that helper-derived service intent sections could flow through sanitized `data.depotRepair`.
- Task2386 selected the explicit admin-safe presenter / allowlist strategy.
- Task2387 added the pure response presenter helper without route wiring.
- Task2388 wired the presenter into `src/routes/depotRepair.routes.js#successBody(result, req = {})`.
- Task2389 checkpointed the accepted route presenter wiring.
- Task2390 added the static portfolio guard for route presenter wiring.

## Current Route Response Status

The current route response status is:

- route path remains `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`
- permission remains `depot.repair.prepare`
- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`
- `successBody(result, req = {})` delegates to `presentDepotWorkshopAssignmentIntentResponse(result, { requestId })`
- existing `failureBody` remains the safe response for denied/error route results
- response remains top-level `data`, `meta`, `requestId`
- payload remains under `data.depotRepair`
- `meta.written` remains `false`
- `data.depotRepair.writeRequired` remains `false`

## Current Safety Status

The current safety status is:

- `data.depotRepair` is allowlisted by the presenter
- full helper-derived service objects are not exposed wholesale
- helper-derived sections are exposed only as summaries/previews:
  - `repairOrderDraftSummary`
  - `repairOrderTransitionPlanSummary`
  - `repairOrderAuditIntentSummary`
  - `repairOrderCustomerProjectionPreview`
- no formal Field Service Report / Completion Report markers are exposed
- no `finalAppointmentId` exposure or mutation is introduced
- no raw customer contact/address/signature/photo/private fields are exposed
- no provider/billing/AI/debug/SQL/secret payloads are exposed

## Closed For This Phase

The Depot / Workshop assignment-intent route response presenter wiring branch is closed for this phase.

This closure authorizes no additional runtime work.

Future route write scope, repository/DB persistence, provider sending, admin UI, billing, smoke, staging, or production rollout requires separate exact PM authorization.

## Non-Authorized Future Work

The following items remain non-authorized future work:

- route write scope authorization packet
- repository/migration authorization packet
- admin UI design packet
- provider/notification sending
- billing/settlement/payment/invoice implementation
- AI/RAG expansion
- smoke/staging/prod rollout
- branch-level Depot / Workshop runtime readiness packet

## Non-Authorization

Task2391 does not authorize:

- runtime/source/test behavior changes
- route response source changes
- route wiring changes
- route path or mount changes
- helper wiring changes
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

The 7 held historical docs remain outside Task2391 scope and must stay untracked, unstaged, and untouched.
