# Task 467 - Engineer Mobile Workbench Route / Controller Skeleton Only

## Status

Task 467 implements only a local runtime skeleton for the future Engineer Mobile Workbench.

This task is intentionally limited to route and controller wiring. Every new endpoint returns `501 Not Implemented` with a safe skeleton error response.

## User Authorization Boundary

The approved scope is:

- local-only runtime skeleton
- exact allowed files only
- route/controller skeleton only
- no DB
- no migration
- no Migration020
- no repository
- no real resolver logic
- no fixtures/tests/smoke/browser/API tests
- no provider sending
- no LINE/SMS/Email/App sending
- no AI/RAG/vector DB
- no mobile UI / PWA / UI component
- no upload/signature/object storage
- no production/shared/Zeabur access
- no formal Case / Appointment / Field Service Report state mutation
- no engineer manual `finalAppointmentId` selection

## Exact Allowed Files

Task 467 is limited to:

- `src/controllers/EngineerMobileWorkbenchController.js`
- `src/routes/engineerMobileWorkbench.routes.js`
- `src/routes/index.js`
- `docs/task-467-engineer-mobile-workbench-route-controller-skeleton-only-no-db-no-repository.md`

## Endpoint Skeleton

The route is mounted under:

- `/api/v1/engineer/mobile-workbench`

Endpoint skeletons:

- `GET /context`
- `GET /tasks`
- `GET /tasks/:taskId`
- `POST /tasks/:taskId/arrived`
- `POST /tasks/:taskId/started`
- `POST /tasks/:taskId/completion-submissions`

All endpoints return `501`:

```json
{
  "error": {
    "code": "ENGINEER_MOBILE_WORKBENCH_NOT_IMPLEMENTED",
    "message": "Engineer Mobile Workbench endpoint is not implemented.",
    "details": [],
    "requestId": "<requestId>"
  }
}
```

## Explicit Non-Implementation

Task 467 does not implement:

- engineer authentication/session runtime
- permission middleware
- request validators
- service/repository/resolver layers
- database queries or mutations
- field service completion submission logic
- appointment status transition logic
- file upload, photo, signature, or object storage
- audit/event/timeline writes
- notification, LINE, SMS, Email, App, or provider sending
- AI/RAG/vector database integration
- mobile UI, PWA, LIFF-like UI, or Admin UI
- test fixtures, smoke tests, browser tests, or API tests

## Product Invariants Preserved

- One Case still maps to one formal Field Service Report.
- One Case may still have multiple appointments / dispatch visits.
- Existing final appointment inference remains backend/system-owned.
- Engineer Mobile Workbench does not introduce manual `finalAppointmentId` selection.
- No formal Case, Appointment, or Field Service Report state is changed by these skeleton endpoints.
- Existing admin completion and final marker behavior are not touched.

## Future Work Requires Separate Authorization

The following require separate explicit authorization before implementation:

- auth/session runtime
- permission model integration
- engineer task resolver
- DB/repository layer
- completion submission write path
- audit log write path
- route validators
- API or browser tests
- upload/signature/object storage
- provider sending
- AI/RAG features
- mobile/PWA UI

## Migration / Schema Decision

No migration, schema, index, or Migration020 change is included in Task 467.

## Runtime Decision

Runtime behavior is limited to returning `501 Not Implemented` for the new Engineer Mobile Workbench endpoint skeletons.
