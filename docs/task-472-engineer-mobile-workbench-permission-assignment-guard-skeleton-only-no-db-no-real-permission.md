# Task 472 - Engineer Mobile Workbench Permission / Assignment Guard Skeleton Only

## Status

Task 472 adds a local-only permission / assignment guard skeleton for the Engineer Mobile Workbench.

All endpoints still return `501 Not Implemented`. The guard does not make real allow/deny decisions.

## User Authorization Boundary

The approved scope is:

- local-only permission / assignment guard skeleton
- exact allowed files only
- guard skeleton only
- no DB
- no migration
- no Migration020
- no repository
- no service layer
- no real data access
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

Task 472 is limited to:

- `src/guards/EngineerMobileWorkbenchPermissionGuard.js`
- `src/resolvers/EngineerMobileWorkbenchResolver.js`
- `docs/task-472-engineer-mobile-workbench-permission-assignment-guard-skeleton-only-no-db-no-real-permission.md`

Task 472 does not modify controller or route files.

## Guard Skeleton

Task 472 adds `EngineerMobileWorkbenchPermissionGuard`.

Guard methods:

- `checkCurrentContextAccess`
- `checkTaskListAccess`
- `checkTaskDetailAccess`
- `checkArrivedAccess`
- `checkStartedAccess`
- `checkCompletionSubmissionAccess`

Every guard method returns only:

```json
{
  "implemented": false,
  "code": "ENGINEER_MOBILE_WORKBENCH_PERMISSION_GUARD_NOT_IMPLEMENTED"
}
```

The guard result is a placeholder only. It is not a real permission decision.

The guard does not return:

- allowed / denied decisions
- customer data
- case data
- appointment data
- task data
- engineer assignment data
- organization data

## Resolver Wiring

The resolver now:

- imports `EngineerMobileWorkbenchPermissionGuard`
- creates a guard instance in the constructor
- calls the matching guard skeleton method before returning the existing not-implemented resolver result

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

Task 472 does not implement:

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

- real permission decision
- engineer assignment lookup
- engineer auth/session boundary
- DB / repository / persistence
- service layer
- projection DTO / allow-list response
- completion submission behavior
- audit / evidence runtime
- fixtures / tests
- smoke / browser / API tests
- mobile UI / PWA
- upload / signature / object storage
- provider sending
- AI/RAG/vector database

## Migration / Schema Decision

No migration, schema, index, or Migration020 change is included in Task 472.

## Runtime Decision

Runtime behavior remains a not-implemented skeleton.

Task 472 only introduces a guard shell behind the existing resolver skeleton.
