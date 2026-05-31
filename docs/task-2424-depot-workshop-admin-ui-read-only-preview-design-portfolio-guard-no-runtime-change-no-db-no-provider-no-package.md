# Task2424 Depot Workshop Admin UI Read-Only Preview Design Portfolio Guard

## Scope

Task2424 freezes the accepted Depot / Workshop admin UI read-only preview design boundary from Task2422-Task2423.

This is docs/static-only. It does not implement UI, add frontend source behavior, add API client code, add packages, change runtime/source behavior, enable route write scope, change route response source, change route wiring, change route path or mount, wire helper/service methods into routes, change permissions, change services, create controllers, change repository adapters, wire DB adapters, run DB commands, execute SQL, connect to a real DB, change migrations, perform migration dry-run/apply, inspect `DATABASE_URL`, Zeabur, env, or secrets, start servers, run smoke tests, probe endpoints, deploy, send providers, change auth/session middleware, change AI/RAG behavior, change billing behavior, change formal Field Service Report / Completion Report behavior, or mutate `finalAppointmentId`.

## Current UI Design Status

Accepted design boundary:

- `admin/` exists
- `admin/src/` exists
- no dedicated Depot / Workshop admin UI page currently exists
- no dedicated Depot / Workshop admin API client currently exists
- no frontend use of `/api/v1/depot/repairs/:depotIntakeId/assignment-intent` currently exists
- no frontend use of `writePreparedAssignmentIntent` currently exists
- future page/component names are design-only: `DepotWorkshopAssignmentIntentPreviewPage` and `DepotWorkshopAssignmentIntentPreviewPanel`
- future route/menu placement is design-only: `/depot-workshop/assignment-intent-preview`
- future API client function is design-only: `previewDepotWorkshopAssignmentIntent(depotIntakeId, payload)`
- backend route candidate is design-only and read-only preview only: `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`

Allowed future UI data fields remain:

- `data.depotRepair`
- `repairOrderDraftSummary`
- `repairOrderTransitionPlanSummary`
- `repairOrderAuditIntentSummary`
- `repairOrderCustomerProjectionPreview`
- `meta.written: false`
- `writeRequired: false`
- safe `requestId`

Forbidden future UI behaviors remain:

- no full helper-derived service objects
- no enabled write action button
- no provider sending
- no DB/admin migration controls
- no billing/payment/invoice controls
- no formal FSR / Completion Report creation, approval, publication, or finalization
- no `finalAppointmentId` display or mutation
- no raw customer private/contact/address/signature/photo fields
- no SQL/stack/token/password/secret/debug/provider/billing/AI/RAG payload display
- no package/runtime/DB/provider/billing/AI/formal-report/`finalAppointmentId` authorization

## Current Non-Implementation Status

Task2424 does not add:

- admin UI implementation
- frontend source implementation
- API client implementation
- package or package-lock changes
- route write-scope behavior
- route/API/controller wiring
- DB/runtime/provider/billing/AI/formal-report behavior

## Current Backend Blockers

Current blockers for any future write-capable UI:

- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`
- `writePreparedAssignmentIntent` remains not route-wired
- migration 028 has not been dry-run/applied
- no disposable DB target/tooling has been provided
- DB work remains paused
- repository adapter verification remains fake-client only
- real DB execution remains unauthorized

## Non-Authorized Future Work

The following are possible next tasks only. Task2424 does not authorize them:

- admin API client design packet
- admin UI read-only preview implementation packet
- admin menu/route design packet
- branch closure

## Static Portfolio Guard Coverage

`tests/depotWorkshop/depotWorkshopAdminUiReadOnlyPreviewDesignPortfolio.static.test.js` verifies:

- Task2422 inventory doc exists
- Task2423 design packet exists
- `admin/` and `admin/src/` exist
- no dedicated Depot / Workshop admin UI page currently exists
- no dedicated Depot / Workshop admin API client currently exists
- no frontend use of `/api/v1/depot/repairs/:depotIntakeId/assignment-intent` currently exists
- no frontend use of `writePreparedAssignmentIntent` currently exists
- future design-only page/component names remain documented
- future design-only route/menu placement remains documented
- future design-only API client function remains documented
- backend route candidate remains documented as read-only preview only
- current route write scope remains blocked
- `writePreparedAssignmentIntent` remains not route-wired
- presenter/admin-safe response boundary remains visible
- future UI allowed fields remain documented
- forbidden UI behavior remains documented
- no package/runtime/DB/provider/billing/AI/formal-report/`finalAppointmentId` authorization is introduced

## Held Docs

The 7 held historical docs remain outside Task2424 scope and must stay untracked, unstaged, and untouched.
