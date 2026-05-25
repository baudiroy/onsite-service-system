# Task 481 - Engineer Mobile Workbench Minimal Skeleton Continuation Handoff

## Status

Task 481 is docs-only.

It records the current Engineer Mobile Workbench minimal skeleton branch state for future PM / Codex continuation. It does not modify runtime code.

## Current Branch Status

Engineer Mobile Workbench minimal runtime skeleton branch:

- skeleton-only

Current endpoints:

- `501 Not Implemented`

No real runtime behavior is authorized or implemented.

## Completed Runtime Skeleton Tasks

- Task 467: route/controller skeleton only
- Task 468: route/controller skeleton boundary review
- Task 469: resolver skeleton authorization packet
- Task 470: resolver skeleton only
- Task 471: resolver skeleton boundary review
- Task 472: permission / assignment guard skeleton only
- Task 473: permission guard skeleton boundary review
- Task 474: projection DTO / allow-list response skeleton only
- Task 475: projection skeleton boundary review
- Task 476: auth/session boundary skeleton only
- Task 477: auth/session skeleton boundary review
- Task 478: completion submission boundary skeleton only
- Task 479: minimal runtime skeleton closure
- Task 480: static verification checklist

## Existing Skeleton Files

Current skeleton files:

- `src/controllers/EngineerMobileWorkbenchController.js`
- `src/routes/engineerMobileWorkbench.routes.js`
- `src/routes/index.js`
- `src/resolvers/EngineerMobileWorkbenchResolver.js`
- `src/guards/EngineerMobileWorkbenchPermissionGuard.js`
- `src/projections/EngineerMobileWorkbenchProjection.js`
- `src/auth/EngineerMobileWorkbenchAuthSessionBoundary.js`
- `src/boundaries/EngineerMobileWorkbenchCompletionSubmissionBoundary.js`

## Current Endpoints

Current endpoint skeletons:

- `GET /api/v1/engineer/mobile-workbench/context`
- `GET /api/v1/engineer/mobile-workbench/tasks`
- `GET /api/v1/engineer/mobile-workbench/tasks/:taskId`
- `POST /api/v1/engineer/mobile-workbench/tasks/:taskId/arrived`
- `POST /api/v1/engineer/mobile-workbench/tasks/:taskId/started`
- `POST /api/v1/engineer/mobile-workbench/tasks/:taskId/completion-submissions`

All endpoints still return `501 Not Implemented`.

## What Is Still Not Implemented

The following are not implemented:

- actual auth/session validation
- real engineer identity context
- real organization context
- real permission decision
- real assignment lookup
- real projection data
- service layer
- repository
- DB / persistence
- migration / Migration020
- completion submission persistence
- Field Service Report draft creation
- formal Field Service Report creation
- appointment status mutation
- Case / Appointment / Field Service Report state mutation
- service parts runtime
- photo / signature metadata runtime
- audit / evidence runtime
- fixtures / tests
- smoke / browser / API tests
- mobile UI / PWA
- upload / signature / object storage
- provider sending
- AI/RAG/vector database
- production/shared/Zeabur access

## Guardrails To Preserve

Future work must preserve:

- one Case has one formal Field Service Report
- one Case may have multiple appointments / dispatch visits
- multiple appointments do not create multiple formal Field Service Reports
- Field Service Report is a Case-level final summary, not a visit-level report
- `field_service_reports.case_id` uniqueness must not be broken
- `finalAppointmentId` is system-determined from the final completed appointment
- engineers should not manually select `finalAppointmentId` in normal flow
- completion submission is future Field Service Report draft/source data design, not a formal Field Service Report by itself
- LINE is not required for engineer task management
- AI remains advisory-only and does not participate in current runtime
- customer-facing report must not expose internal note / audit log / AI raw payload / billing settlement internal data
- photos / signatures / attachments should use object/file storage in future implementation

## PM Workflow Rule

The user has agreed that future tasks explicitly planned by PM, with exact allowed files and exact scope, may be executed by Codex.

This is not unlimited authorization.

Every future task must remain:

- single-purpose
- explicitly scoped
- tied to exact allowed files
- bounded by forbidden changes
- bounded by verification commands
- bounded by stop conditions

Codex must not expand scope from a general "continue" request. If implementation requires anything beyond the PM-scoped task, Codex must stop and report.

## Recommended Next Safe Branches

The following are only recommendations and are not implemented by Task 481:

- docs-only: real auth/session design packet
- docs-only: real permission / assignment design packet
- docs-only: synthetic fixture/test authorization packet
- runtime: actual auth/session validation only if PM scopes exact files
- runtime: real permission / assignment only if PM scopes exact files
- tests: only if PM explicitly scopes synthetic fixtures/tests

## Explicit Non-goals

Task 481 does not:

- modify backend `src/`
- modify `admin/src/`
- add or modify route/controller/resolver/guard/projection/auth/boundary code
- add actual auth/session validation
- add real permission decision
- add service
- add repository
- add DB / migration / Migration020
- add tests / fixtures / smoke
- run DB / migration / psql
- run smoke / browser / API tests
- implement mobile UI / PWA
- implement upload / signature / object storage
- trigger provider sending
- call AI/RAG/vector database
- modify `package.json`
- modify inventory docs

## Migration / Schema Decision

No migration, schema, index, or Migration020 change is included in Task 481.

## Runtime Decision

No runtime behavior is changed in Task 481.

The Engineer Mobile Workbench remains at the skeleton-only boundary until PM provides another task with exact allowed files and scope.
