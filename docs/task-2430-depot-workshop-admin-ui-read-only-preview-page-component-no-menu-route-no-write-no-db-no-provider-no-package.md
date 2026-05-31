# Task2430 - Depot Workshop Admin UI Read-Only Preview Page Component

## Scope

Task2430 adds an unmounted admin frontend read-only preview page/component for Depot / Workshop assignment intent.

Allowed implementation files:

- `admin/src/pages/DepotWorkshopAssignmentIntentPreviewPage.tsx`
- `tests/depotWorkshop/depotWorkshopAdminUiReadOnlyPreviewPageBoundary.static.test.js`
- adjacent static guard alignment where required for the newly accepted unmounted page
- this Task2430 document

No admin-side test file was added because no existing admin `*.test.tsx` convention is present.

## Page Contract

The page is read-only and unmounted.

It uses the accepted API client:

- `previewDepotWorkshopAssignmentIntent`
- `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`

It displays only the accepted admin-safe preview fields:

- `data.depotRepair`
- `repairOrderDraftSummary`
- `repairOrderTransitionPlanSummary`
- `repairOrderAuditIntentSummary`
- `repairOrderCustomerProjectionPreview`
- `meta.written: false`
- `writeRequired: false`
- safe `requestId`

The page filters unsafe summary keys before display and avoids raw full helper-derived object rendering.

## Blocked Behavior Display

The page displays disabled/blocker state for write behavior:

- route write scope blocked
- DB dry-run not completed
- write action not available

No enabled write action button is present.

## Preserved Non-Implementation Boundaries

Task2430 does not implement or authorize:

- admin menu/router wiring
- `admin/src/App.tsx` route registration
- `admin/src/config/menu.ts` changes
- write action button
- additional API client implementation
- write API client function
- package or package-lock changes
- backend runtime/source behavior changes
- route write-scope behavior
- route response/path/mount/wiring changes
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

## Backend Blockers

Route write scope remains blocked by `depot_repair_route_write_scope_not_approved`.

`writePreparedAssignmentIntent` remains not route-wired.

DB dry-run has not been completed.

## Held Docs

The 7 held historical docs remain outside Task2430 scope and must stay untracked, untouched, and unstaged.
