# Task2428 - Depot Workshop Admin API Client Read-Only Preview Portfolio Guard

## Scope

Task2428 freezes the accepted Depot / Workshop admin API client read-only preview boundary from Task2426 and Task2427 before any UI page implementation.

Allowed files were limited to:

- `tests/depotWorkshop/depotWorkshopAdminApiClientReadOnlyPreviewPortfolio.static.test.js`
- this Task2428 document

## Current API Client Boundary

The accepted admin API client is:

- `admin/src/api/depotWorkshop.ts`
- `previewDepotWorkshopAssignmentIntent(depotIntakeId, payload)`
- `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`

The client uses the existing admin `apiRequest` helper, safely encodes `depotIntakeId`, accepts only a plain safe payload object, clones the payload before request, and keeps the response contract limited to admin-safe read-only preview fields:

- `data.depotRepair`
- `repairOrderDraftSummary`
- `repairOrderTransitionPlanSummary`
- `repairOrderAuditIntentSummary`
- `repairOrderCustomerProjectionPreview`
- `meta.written: false`
- `writeRequired: false`
- safe `requestId`

## Current UI Status

No Depot / Workshop admin UI page or component is implemented.

No admin menu route is implemented.

No enabled write action button is implemented.

No additional API client is implemented.

The accepted API client remains read-only preview only and does not imply route write scope, DB readiness, provider sending, billing behavior, AI/RAG behavior, formal FSR / Completion Report behavior, or `finalAppointmentId` display or mutation.

## Current Backend Blockers

The backend route remains prepare-only.

Route write scope remains blocked by `depot_repair_route_write_scope_not_approved`.

`writePreparedAssignmentIntent` remains not route-wired.

DB/repository readiness remains outside this task. Migration dry-run/apply and real DB execution remain paused unless separately authorized.

## Non-Authorized Candidate Next Tasks

These are candidate tasks only and are not authorized by Task2428:

- admin UI read-only preview page implementation packet
- admin menu/route implementation packet
- admin API client branch closure
- route write-scope implementation packet only after DB/repository readiness

## Preserved Negative Boundaries

Task2428 does not authorize or implement:

- runtime/source behavior changes
- admin UI implementation
- frontend page/component implementation
- menu or route implementation
- additional API client implementation
- write API client function
- enabled write action button
- package or package-lock changes
- backend runtime/source behavior changes
- route write-scope behavior
- route response source changes
- route wiring/path/mount changes
- helper/service route wiring
- permission changes
- service behavior changes
- controller creation
- repository adapter changes
- DB adapter runtime wiring
- DB commands
- SQL execution
- real DB connection
- migration changes/dry-run/apply
- `DATABASE_URL`, Zeabur, env, or secrets inspection
- server/listener startup
- smoke/endpoint probes
- deploy/staging/prod traffic
- provider sending
- billing behavior
- AI/RAG runtime behavior
- formal FSR / Completion Report behavior
- `finalAppointmentId` display or mutation

The 7 held historical docs remain outside Task2428 scope and must stay untracked, untouched, and unstaged.
