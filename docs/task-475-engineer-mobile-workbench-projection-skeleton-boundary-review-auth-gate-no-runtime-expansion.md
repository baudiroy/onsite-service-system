# Task 475 - Engineer Mobile Workbench Projection Skeleton Boundary Review / Auth Gate

## Status

Task 475 is docs-only.

It closes the Task 474 projection DTO / allow-list response skeleton step and records the next authorization gate for any future engineer auth/session boundary work. It does not modify runtime code.

## Task 474 Acceptance Summary

Task 474 added `EngineerMobileWorkbenchProjection` as a skeleton projection layer.

The resolver now calls the projection skeleton after the guard skeleton call.

Projection methods:

- `buildCurrentContextProjection`
- `buildTaskListProjection`
- `buildTaskDetailProjection`
- `buildArrivedProjection`
- `buildStartedProjection`
- `buildCompletionSubmissionProjection`

Current behavior:

- all projection methods return skeleton placeholders
- projection returns `implemented=false`, `allowListOnly=true`, and `data=null`
- projection does not return real data
- projection does not return fake customer / task / case / appointment / Field Service Report payloads
- all existing endpoints still return `501 Not Implemented`
- no business logic
- no data read
- no data mutation
- no auth/session runtime
- no real permission runtime

## Current Runtime Boundary

The current Engineer Mobile Workbench runtime boundary is:

- route/controller/resolver/permission-guard/projection skeleton only

The following remain unauthorized:

- real projection data
- real permission decision
- real assignment lookup
- engineer auth/session runtime
- service layer
- repository
- DB access
- migration
- Migration020
- completion submission behavior
- audit / evidence runtime
- mobile UI / PWA
- upload / signature / object storage
- tests / fixtures / smoke
- browser tests
- API tests
- provider sending
- AI/RAG/vector database
- formal Case / Appointment / Field Service Report state mutation
- engineer manual `finalAppointmentId` selection

## Guardrail Confirmation

Task 474 did not break or weaken these guardrails:

- one Case still has one formal Field Service Report
- one Case can still have multiple appointments / dispatch visits
- multiple appointments do not create multiple formal Field Service Reports
- `field_service_reports.case_id` uniqueness was not touched
- `finalAppointmentId` was not manually selected or overwritten by an engineer
- no Case status was changed
- no Appointment status was changed
- no Field Service Report status was changed
- no DB, repository, or service layer was connected
- no provider sending was introduced
- no AI provider, RAG, or vector database was called
- no real or fake customer / case / appointment / Field Service Report data was returned
- no real allow/deny decision was made
- no task existence was leaked

## Next Authorization Gates

Each future step requires separate explicit authorization before implementation:

- engineer auth/session boundary skeleton
- real permission / assignment guard
- real projection DTO / allow-list response
- service layer
- DB / repository / persistence
- completion submission behavior
- audit / evidence runtime
- fixtures / tests
- smoke / browser / API tests
- mobile UI / PWA
- upload / signature / object storage
- provider sending
- AI/RAG/vector database

## Suggested Next Smallest Runtime Task

If explicitly authorized later, the next smallest runtime task could be:

- Engineer Mobile Workbench auth/session boundary skeleton only

Suggested future constraints:

- no DB
- no repository
- no service layer
- no real data access
- no real customer / case / appointment / Field Service Report data
- no real permission decision
- no actual login/session validation
- no tests / fixtures unless separately authorized
- no provider sending
- no AI/RAG/vector database
- no mobile UI
- no formal Case / Appointment / Field Service Report state mutation
- auth/session skeleton may only define interface / placeholder result, not real authentication
- no engineer manual `finalAppointmentId` selection

This is only a proposal. Task 475 does not authorize or implement it.

## Required Future Authorization Text

Future engineer auth/session boundary skeleton work should require an explicit authorization statement, such as:

```text
我明確授權 Task476：Engineer Mobile Workbench auth/session boundary skeleton only。

授權範圍：
- local-only auth/session boundary skeleton
- only exact files listed by PM in Task476
- auth/session skeleton only
- no DB
- no migration
- no Migration020
- no repository
- no service layer
- no real data access
- no actual login/session validation
- no real customer / case / appointment / FSR data
- no real permission decision
- no fixtures/tests
- no smoke/browser/API tests
- no provider sending
- no LINE/SMS/Email/App sending
- no AI/RAG/vector DB
- no mobile UI / PWA / UI component
- no upload/signature/object storage
- no production/shared/Zeabur access
- no formal Case / Appointment / Field Service Report state mutation
- no engineer manual finalAppointmentId selection
```

## Explicit Non-goals

Task 475 does not:

- modify backend `src/`
- modify `admin/src/`
- add or modify route/controller/resolver/guard/projection code
- add auth/session skeleton
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

No migration, schema, index, or Migration020 change is included in Task 475.

## Runtime Decision

No runtime behavior is changed in Task 475.

The Engineer Mobile Workbench remains at the route/controller/resolver/permission-guard/projection skeleton boundary until a later task receives separate explicit authorization.
