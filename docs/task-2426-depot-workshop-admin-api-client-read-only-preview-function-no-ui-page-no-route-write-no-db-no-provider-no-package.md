# Task2426 Depot Workshop Admin API Client Read-Only Preview Function

## Scope

Task2426 adds one bounded admin frontend API client function for the future Depot / Workshop read-only assignment-intent preview.

This task does not add UI pages/components, menu routes, write buttons, backend routes, packages, backend runtime behavior, route write scope, DB commands, SQL execution, real DB connection, migration changes, provider sending, billing behavior, AI/RAG behavior, formal Field Service Report / Completion Report behavior, or `finalAppointmentId` mutation.

## Modified Client Boundary

Added file:

- `admin/src/api/depotWorkshop.ts`

Exported function:

- `previewDepotWorkshopAssignmentIntent(depotIntakeId, payload)`

Target backend route:

- `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`

Client boundary:

- read-only preview oriented
- uses existing `apiRequest` convention from `admin/src/lib/apiClient.ts`
- encodes `depotIntakeId` with `encodeURIComponent`
- requires `depotIntakeId`
- accepts only a plain safe payload object
- clones the payload before sending
- returns a typed preview response aligned to current admin-safe presenter fields

## Allowed Response Contract

The client contract remains aligned with the current presenter/admin-safe response boundary:

- `data.depotRepair`
- `repairOrderDraftSummary`
- `repairOrderTransitionPlanSummary`
- `repairOrderAuditIntentSummary`
- `repairOrderCustomerProjectionPreview`
- `meta.written: false`
- `writeRequired: false`
- safe `requestId`

## Preserved Backend Blockers

Current backend blockers remain:

- route write scope remains blocked by `depot_repair_route_write_scope_not_approved`
- `writePreparedAssignmentIntent` remains not route-wired
- route remains prepare-only
- migration 028 has not been dry-run/applied
- no disposable DB target/tooling has been provided
- DB work remains paused
- SQL repository adapter is fake-client tested only

## Forbidden Client Behavior

Task2426 does not add:

- enabled write action
- mutation API client
- UI page/component
- menu/route implementation in admin UI
- package dependency expansion
- provider sending
- DB/admin migration control
- billing/payment/invoice control
- formal FSR / Completion Report creation, approval, publication, or finalization
- `finalAppointmentId` display or mutation
- raw customer private/contact/address/signature/photo fields
- SQL/stack/token/password/secret/debug/provider/billing/AI/RAG payload handling

## Static Guard Coverage

`tests/depotWorkshop/depotWorkshopAdminApiClientReadOnlyPreviewBoundary.static.test.js` verifies:

- API client function exists
- client targets the exact assignment-intent route
- function name and docs are read-only/preview oriented
- client does not expose write route/action naming
- client does not reference `writePreparedAssignmentIntent`
- UI page/menu route is not added
- package dependencies are not added
- backend route write scope remains blocked
- presenter/admin-safe response boundary remains visible
- no backend runtime/source behavior changed

## Held Docs

The 7 held historical docs remain outside Task2426 scope and must stay untracked, unstaged, and untouched.
