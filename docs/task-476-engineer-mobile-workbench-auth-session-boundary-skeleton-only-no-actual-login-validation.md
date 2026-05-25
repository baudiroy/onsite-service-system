# Task 476 - Engineer Mobile Workbench Auth / Session Boundary Skeleton Only

## Status

Task 476 adds a local-only auth/session boundary skeleton for the Engineer Mobile Workbench.

All endpoints still return `501 Not Implemented`. The auth/session boundary does not validate login, session, token, identity, or authorization.

## User Authorization Boundary

The approved scope is:

- local-only auth/session boundary skeleton
- exact allowed files only
- auth/session skeleton only
- no DB
- no migration
- no Migration020
- no repository
- no service layer
- no real data access
- no actual login/session validation
- no real customer / case / appointment / Field Service Report data
- no real permission decision
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

Task 476 is limited to:

- `src/auth/EngineerMobileWorkbenchAuthSessionBoundary.js`
- `src/resolvers/EngineerMobileWorkbenchResolver.js`
- `docs/task-476-engineer-mobile-workbench-auth-session-boundary-skeleton-only-no-actual-login-validation.md`

Task 476 does not modify controller, guard, projection, or route files.

## Auth / Session Boundary Skeleton

Task 476 adds `EngineerMobileWorkbenchAuthSessionBoundary`.

Boundary methods:

- `buildCurrentContextSessionBoundary`
- `buildTaskListSessionBoundary`
- `buildTaskDetailSessionBoundary`
- `buildArrivedSessionBoundary`
- `buildStartedSessionBoundary`
- `buildCompletionSubmissionSessionBoundary`

Every boundary method returns only:

```json
{
  "implemented": false,
  "code": "ENGINEER_MOBILE_WORKBENCH_AUTH_SESSION_NOT_IMPLEMENTED",
  "authenticated": null,
  "engineerContext": null
}
```

The boundary result is a placeholder only. It is not a real authenticated or unauthenticated decision.

The boundary does not:

- read request credentials
- parse token
- validate session
- query engineer identity
- query organization
- return engineer identity
- return organization identity
- return customer data
- return case data
- return appointment data
- return task data
- return assignment data
- return internal note
- return audit log
- return provider channel ids
- return fake sample payload

## Resolver Wiring

The resolver now:

- imports `EngineerMobileWorkbenchAuthSessionBoundary`
- creates an auth/session boundary instance in the constructor
- calls the matching auth/session boundary skeleton method before guard and projection skeleton calls
- ignores auth/session placeholder data for outward response purposes
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

Task 476 does not implement:

- actual login/session validation
- real authenticated/unauthenticated decision
- real engineer / organization identity context
- real permission decision
- real assignment lookup
- DB access
- repository layer
- service layer
- migration / schema / index changes
- Migration020 changes
- route changes
- controller changes
- guard changes
- projection changes
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

- actual login/session validation
- real engineer identity context
- real organization context
- real permission decision
- engineer assignment lookup
- DB / repository / persistence
- service layer
- real projection response data
- completion submission behavior
- audit / evidence runtime
- fixtures / tests
- smoke / browser / API tests
- mobile UI / PWA
- upload / signature / object storage
- provider sending
- AI/RAG/vector database

## Migration / Schema Decision

No migration, schema, index, or Migration020 change is included in Task 476.

## Runtime Decision

Runtime behavior remains a not-implemented skeleton.

Task 476 only introduces an auth/session boundary shell behind the existing resolver skeleton.
