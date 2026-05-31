# Task2425 Depot Workshop Admin UI Read-Only Preview Design Branch Closure

## Scope

Task2425 closes the Depot / Workshop admin UI read-only preview design branch for this phase.

This is a docs-only closure task. It does not change runtime/source/test behavior, implement admin UI, add frontend source behavior, add API client code, change packages, enable route write scope, change route response source, change route wiring, change route path or mount, wire helper/service methods into routes, change permissions, change services, create controllers, change repository adapters, wire DB adapters, run DB commands, execute SQL, connect to a real DB, change migrations, perform migration dry-run/apply, inspect `DATABASE_URL`, Zeabur, env, or secrets, start servers, run smoke tests, probe endpoints, deploy, send providers, change auth/session middleware, change AI/RAG behavior, change billing behavior, change formal Field Service Report / Completion Report behavior, or mutate `finalAppointmentId`.

## Accepted Outcomes

Task2422 inventoried the current admin/frontend boundary:

- `admin/` exists
- `admin/src/` exists
- no dedicated Depot / Workshop admin UI page exists
- no dedicated Depot / Workshop admin API client exists
- no frontend use of `/api/v1/depot/repairs/:depotIntakeId/assignment-intent` exists
- no frontend use of `writePreparedAssignmentIntent` exists

Task2423 defined the future read-only preview design boundary:

- design-only page/component names
- design-only route/menu placement
- design-only API client function
- read-only backend route candidate
- admin-safe presenter-field consumption only
- forbidden UI fields and behaviors

Task2424 added the UI design portfolio static guard:

- froze the inventory and design packet artifacts
- confirmed no admin UI/API client implementation exists
- confirmed route write scope remains blocked
- confirmed `writePreparedAssignmentIntent` remains not route-wired
- confirmed presenter/admin-safe response fields remain the only allowed future data surface
- confirmed no package/runtime/DB/provider/billing/AI/formal-report/`finalAppointmentId` authorization was introduced

## Current Admin / Frontend Status

Current status:

- `admin/` exists
- `admin/src/` exists
- no dedicated Depot / Workshop admin UI page exists
- no dedicated Depot / Workshop admin API client exists
- no frontend use of `/api/v1/depot/repairs/:depotIntakeId/assignment-intent` exists
- no frontend use of `writePreparedAssignmentIntent` exists
- no admin UI implementation was added
- no API client implementation was added
- no package/package-lock changes were made

## Accepted Future UI Design Boundary

Accepted future design-only page/component names:

- `DepotWorkshopAssignmentIntentPreviewPage`
- `DepotWorkshopAssignmentIntentPreviewPanel`

Accepted future design-only route/menu placement:

- `/depot-workshop/assignment-intent-preview`

Accepted future design-only API client function:

- `previewDepotWorkshopAssignmentIntent(depotIntakeId, payload)`

Accepted backend route candidate remains read-only preview only:

- `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`

Accepted future UI fields:

- `data.depotRepair`
- `repairOrderDraftSummary`
- `repairOrderTransitionPlanSummary`
- `repairOrderAuditIntentSummary`
- `repairOrderCustomerProjectionPreview`
- `meta.written: false`
- `writeRequired: false`
- safe `requestId`

Forbidden UI behavior:

- no full helper-derived service objects
- no enabled write action button
- no provider sending
- no DB/admin migration controls
- no billing/payment/invoice controls
- no formal FSR / Completion Report creation, approval, publication, or finalization
- no `finalAppointmentId` display or mutation
- no raw customer private/contact/address/signature/photo fields
- no SQL/stack/token/password/secret/debug/provider/billing/AI/RAG payload display

## Current Backend Blockers

Current blockers:

- route write scope remains blocked
- `writePreparedAssignmentIntent` remains not route-wired
- migration 028 has not been dry-run/applied
- no disposable DB target/tooling has been provided
- DB work remains paused
- SQL repository adapter is fake-client tested only
- real DB execution remains unauthorized

## Closed For This Phase

The Depot / Workshop admin UI read-only preview design branch is closed for this phase.

This closure authorizes no UI implementation, no API client implementation, no package changes, and no runtime work.

Future UI/API client implementation requires separate exact PM authorization.

## Non-Authorized Future Work

The following items remain non-authorized future work only:

- admin API client design packet
- admin UI read-only preview implementation packet
- admin menu/route implementation packet
- route write-scope implementation packet
- DB dry-run / repository verification
- provider/notification sending
- billing/settlement/payment/invoice implementation
- smoke/staging/prod rollout

## Held Docs

The 7 held historical docs remain outside Task2425 scope and must stay untracked, unstaged, and untouched.
