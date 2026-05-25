# Task 470 - Engineer Mobile Workbench Resolver Skeleton Only

## Status

Task 470 adds a local-only Engineer Mobile Workbench resolver skeleton and wires the existing controller skeleton to it.

All Engineer Mobile Workbench endpoints still return `501 Not Implemented`. No business behavior is implemented.

## User Authorization Boundary

The approved scope is:

- local-only resolver skeleton
- exact allowed files only
- resolver skeleton only
- no DB
- no migration
- no Migration020
- no repository
- no service layer
- no real data access
- no permission runtime
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

Task 470 is limited to:

- `src/resolvers/EngineerMobileWorkbenchResolver.js`
- `src/controllers/EngineerMobileWorkbenchController.js`
- `docs/task-470-engineer-mobile-workbench-resolver-skeleton-only-no-db-no-repository-no-service.md`

No route files are modified in Task 470.

## Resolver Skeleton

Task 470 adds `EngineerMobileWorkbenchResolver`.

Resolver methods:

- `getCurrentContext`
- `listTasks`
- `getTaskDetail`
- `markArrived`
- `markStarted`
- `submitCompletion`

Every resolver method returns the same skeleton result:

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

The resolver does not return task, customer, case, appointment, Field Service Report, photo, signature, or provider payload data.

## Controller Wiring

The controller now:

- imports `EngineerMobileWorkbenchResolver`
- creates a resolver instance in the constructor
- calls the matching resolver skeleton method for each endpoint
- translates the resolver skeleton result into an HTTP response
- preserves `requestId` in the response error object

The HTTP status remains `501`.

The error code remains:

- `ENGINEER_MOBILE_WORKBENCH_NOT_IMPLEMENTED`

## Endpoint Behavior

The existing Task 467 endpoints remain unchanged:

- `GET /api/v1/engineer/mobile-workbench/context`
- `GET /api/v1/engineer/mobile-workbench/tasks`
- `GET /api/v1/engineer/mobile-workbench/tasks/:taskId`
- `POST /api/v1/engineer/mobile-workbench/tasks/:taskId/arrived`
- `POST /api/v1/engineer/mobile-workbench/tasks/:taskId/started`
- `POST /api/v1/engineer/mobile-workbench/tasks/:taskId/completion-submissions`

All endpoints still return `501 Not Implemented`.

## Explicit Non-Implementation

Task 470 does not implement:

- DB access
- migration / schema / index changes
- Migration020 changes
- repository layer
- service layer
- real data access
- permission runtime
- auth/session runtime
- validators
- mapper
- middleware
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

- permission / assignment guard
- engineer auth/session boundary
- projection DTO / allow-list response
- real resolver logic
- DB / repository / persistence
- service layer
- fixtures / tests
- smoke / browser / API tests
- mobile UI / PWA
- upload / signature / object storage
- provider sending
- AI/RAG/vector database

## Migration / Schema Decision

No migration, schema, index, or Migration020 change is included in Task 470.

## Runtime Decision

Runtime behavior remains a not-implemented skeleton.

Task 470 only introduces a resolver layer shell behind the existing controller shell.
