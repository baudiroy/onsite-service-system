# Task2427 - Depot Workshop Admin API Client Stale Design Guard Alignment

## Scope

Task2427 aligned stale Depot / Workshop admin UI design and inventory static guards after the accepted Task2426 admin API client creation.

Allowed files were limited to:

- `tests/depotWorkshop/depotWorkshopAdminUiReadOnlyPreviewDesignPortfolio.static.test.js`
- `tests/depotWorkshop/depotWorkshopAdminUiReadOnlyPreviewDesign.static.test.js`
- `tests/depotWorkshop/depotWorkshopAdminUiBoundaryInventory.static.test.js`
- this Task2427 document

## Accepted Task2426 Boundary

Task2426 intentionally added the dedicated read-only admin API client:

- `admin/src/api/depotWorkshop.ts`
- `previewDepotWorkshopAssignmentIntent(depotIntakeId, payload)`
- `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`

The three stale static guards previously asserted that no Depot / Workshop admin API client file or source marker could exist. Task2427 updates those guards to accept only the PM-authorized `admin/src/api/depotWorkshop.ts` read-only preview client.

## Guard Alignment

The aligned guards now assert the accepted API client exists and remains bounded to read-only preview use:

- `previewDepotWorkshopAssignmentIntent`
- `depotIntakePathSegment(depotIntakeId)`
- `previewPayloadFrom(payload)`
- `POST`
- `/api/v1/depot/repairs/${depotIntakePath}/assignment-intent`
- `writeRequired?: false`
- `written?: false`

The guards continue to reject Depot / Workshop implementation markers outside the accepted API client file.

## Preserved Negative Boundaries

Task2427 does not authorize or implement:

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

The route write scope remains blocked by `depot_repair_route_write_scope_not_approved`, and `writePreparedAssignmentIntent` remains not route-wired.

## Held Docs

The 7 held historical docs remain outside Task2427 scope and must stay untracked, untouched, and unstaged.
