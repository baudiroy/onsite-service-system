# Task 471 - Engineer Mobile Workbench Resolver Skeleton Boundary Review / Permission Gate

## Status

Task 471 is docs-only.

It closes the Task 470 resolver skeleton step and records the next authorization gate for any future permission / assignment guard work. It does not modify runtime code.

## Task 470 Acceptance Summary

Task 470 added `EngineerMobileWorkbenchResolver` as a skeleton resolver layer.

The controller now calls the resolver skeleton.

Resolver methods:

- `getCurrentContext`
- `listTasks`
- `getTaskDetail`
- `markArrived`
- `markStarted`
- `submitCompletion`

Current behavior:

- all resolver methods return skeleton not-implemented results
- all existing endpoints still return `501 Not Implemented`
- no business logic
- no data read
- no data mutation
- no permission runtime
- no auth/session runtime
- no service layer
- no repository layer
- no DB access
- no provider sending
- no AI/RAG/vector database call
- no customer / case / appointment / Field Service Report real or fake payload

## Current Runtime Boundary

The current Engineer Mobile Workbench runtime boundary is:

- route/controller/resolver skeleton only

The following remain unauthorized:

- service layer
- repository
- DB access
- migration
- Migration020
- permission runtime
- assignment guard runtime
- engineer auth/session runtime
- projection DTO / allow-list real response
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

Task 470 did not break or weaken these guardrails:

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

## Next Authorization Gates

Each future step requires separate explicit authorization before implementation:

- permission / assignment guard skeleton
- engineer auth/session boundary
- projection DTO / allow-list response
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

- Engineer Mobile Workbench permission / assignment guard skeleton only

Suggested future constraints:

- no DB
- no repository
- no real data access
- no auth/session runtime unless separately authorized
- no service layer
- no tests / fixtures unless separately authorized
- no provider sending
- no AI/RAG/vector database
- no mobile UI
- no formal Case / Appointment / Field Service Report state mutation
- guard skeleton may only define interface / placeholder result, not a real permission decision
- no engineer manual `finalAppointmentId` selection

This is only a proposal. Task 471 does not authorize or implement it.

## Required Future Authorization Text

Future permission / assignment guard skeleton work should require an explicit authorization statement, such as:

```text
我明確授權 Task472：Engineer Mobile Workbench permission / assignment guard skeleton only。

授權範圍：
- local-only permission / assignment guard skeleton
- only exact files listed by PM in Task472
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
- no AI/RAG/vector DB
- no mobile UI / PWA / UI component
- no upload/signature/object storage
- no production/shared/Zeabur access
- no formal Case / Appointment / Field Service Report state mutation
- no engineer manual finalAppointmentId selection
```

## Explicit Non-goals

Task 471 does not:

- modify backend `src/`
- modify `admin/src/`
- add or modify route/controller/resolver code
- add permission guard
- add auth/session runtime
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

No migration, schema, index, or Migration020 change is included in Task 471.

## Runtime Decision

No runtime behavior is changed in Task 471.

The Engineer Mobile Workbench remains at the route/controller/resolver skeleton boundary until a later task receives separate explicit authorization.
