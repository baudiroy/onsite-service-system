# Task 474 - Engineer Mobile Workbench Projection DTO / Allow-list Response Skeleton Only

## Status

Task 474 adds a local-only projection DTO / allow-list response skeleton for the Engineer Mobile Workbench.

All endpoints still return `501 Not Implemented`. The projection skeleton does not return real or fake business data.

## User Authorization Boundary

The approved scope is:

- local-only projection DTO / allow-list response skeleton
- exact allowed files only
- projection skeleton only
- no DB
- no migration
- no Migration020
- no repository
- no service layer
- no real data access
- no real customer / case / appointment / Field Service Report data
- no real permission decision
- no auth/session runtime
- no fixtures/tests
- no smoke/browser/API tests
- no provider sending
- no LINE/SMS/Email/App sending
- no AI/RAG/vector database
- no mobile UI / PWA / UI component
- no upload/signature/object storage
- no production/shared/Zeabur access
- no formal Case / Appointment / Field Service Report state mutation
- no engineer manual `finalAppointmentId` selection

## Exact Allowed Files

Task 474 is limited to:

- `src/projections/EngineerMobileWorkbenchProjection.js`
- `src/resolvers/EngineerMobileWorkbenchResolver.js`
- `docs/task-474-engineer-mobile-workbench-projection-dto-allow-list-response-skeleton-only-no-real-data.md`

Task 474 does not modify controller, guard, or route files.

## Projection Skeleton

Task 474 adds `EngineerMobileWorkbenchProjection`.

Projection methods:

- `buildCurrentContextProjection`
- `buildTaskListProjection`
- `buildTaskDetailProjection`
- `buildArrivedProjection`
- `buildStartedProjection`
- `buildCompletionSubmissionProjection`

Every projection method returns only:

```json
{
  "implemented": false,
  "code": "ENGINEER_MOBILE_WORKBENCH_PROJECTION_NOT_IMPLEMENTED",
  "allowListOnly": true,
  "data": null
}
```

The projection result is a placeholder only. It is not a real response payload.

The projection does not return:

- customer data
- case data
- appointment data
- task data
- engineer assignment data
- organization data
- internal note
- audit log
- AI raw payload
- billing / settlement internal data
- raw channel id
- token / secret
- fake sample payload

## Resolver Wiring

The resolver now:

- imports `EngineerMobileWorkbenchProjection`
- creates a projection instance in the constructor
- calls the matching projection skeleton method after the guard skeleton call
- ignores projection placeholder data for outward response purposes
- returns the existing not-implemented resolver result

The resolver still returns:

```json
{
  "statusCode": 501,
  "error": {
    "code": "ENGINEER_MOBILE_WORKBENCH_NOT_IMPLEMENTED",
    "message": "Engineer Mobile Workbench endpoint is not implemented.",
    "details": []
  }
}
```

The external endpoint response remains the existing `501 Not Implemented` skeleton.

## Explicit Non-Implementation

Task 474 does not implement:

- real projection data
- fake customer / task / case / appointment / Field Service Report payloads
- real permission decision
- real assignment lookup
- engineer authentication/session runtime
- DB access
- repository layer
- service layer
- migration / schema / index changes
- Migration020 changes
- route changes
- controller changes
- guard changes
- validator / mapper / middleware
- test fixtures
- smoke/browser/API tests
- provider sending
- LINE/SMS/Email/App sending
- AI/RAG/vector database
- mobile UI / PWA / UI component
- upload / signature / object storage
- audit/event/timeline writes
- Case / Appointment / Field Service Report formal state mutation
- engineer manual `finalAppointmentId` selection

## Product Invariants Preserved

- One Case still maps to one formal Field Service Report.
- One Case may still have multiple appointments / dispatch visits.
- Multiple appointments do not create multiple formal reports.
- Existing backend/system-owned `finalAppointmentId` inference is not changed.
- Engineers cannot manually select or override `finalAppointmentId`.
- Existing Case, Appointment, and Field Service Report states are not changed.
- Existing admin completion behavior is not changed.

## Future Authorization Gates

The following still require separate explicit authorization:

- real projection response data
- real permission decision
- engineer assignment lookup
- engineer auth/session boundary
- DB / repository / persistence
- service layer
- completion submission behavior
- audit / evidence runtime
- fixtures / tests
- smoke / browser / API tests
- mobile UI / PWA
- upload / signature / object storage
- provider sending
- AI/RAG/vector database

## Migration / Schema Decision

No migration, schema, index, or Migration020 change is included in Task 474.

## Runtime Decision

Runtime behavior remains a not-implemented skeleton.

Task 474 only introduces a projection shell behind the existing resolver skeleton.
