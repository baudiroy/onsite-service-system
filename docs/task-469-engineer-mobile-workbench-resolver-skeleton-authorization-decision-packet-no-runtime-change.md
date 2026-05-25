# Task 469 - Engineer Mobile Workbench Resolver Skeleton Authorization Decision Packet

## Status

Task 469 is docs-only.

It prepares a future authorization decision packet for a possible Engineer Mobile Workbench resolver skeleton task. It does not authorize, implement, or modify any runtime code.

## Current Runtime Boundary

The current Engineer Mobile Workbench runtime boundary remains:

- route/controller skeleton only

Task 467 introduced endpoint shells mounted at `/api/v1/engineer/mobile-workbench`. Those endpoints return `501 Not Implemented` and do not read, write, or mutate business data.

Task 469 does not change that boundary.

## Why A Resolver Skeleton Would Need Separate Authorization

A resolver layer would be the first place where future endpoint handlers could begin shaping task context, engineer workbench responses, assignment checks, projections, and completion submission boundaries.

Even if a resolver skeleton returns only not-implemented responses, it introduces a new runtime layer. That means it must not be treated as automatically approved by the route/controller skeleton authorization.

The following remain unauthorized unless explicitly approved in a later task:

- resolver runtime
- service layer
- repository layer
- DB access
- migration
- Migration020
- real data access
- permission runtime
- engineer auth/session runtime
- tests / fixtures / smoke / browser / API tests
- provider sending
- AI/RAG/vector database
- mobile UI / PWA
- upload / signature / object storage
- formal Case / Appointment / Field Service Report state mutation
- engineer manual `finalAppointmentId` selection

## Proposed Future Resolver Skeleton Scope

This is only a proposal, not implementation authorization.

Future task name:

- Engineer Mobile Workbench resolver skeleton only

Suggested future constraints:

- local-only resolver skeleton
- exact PM-listed files only
- resolver skeleton only
- no DB
- no migration
- no Migration020
- no repository
- no service layer
- no real data access
- no permission runtime unless separately authorized
- no auth/session runtime unless separately authorized
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

## Proposed Resolver Skeleton Responsibility

If authorized later, a resolver skeleton may define an interface shell for future controller calls.

It should only:

- expose named resolver methods matching the future workbench endpoints
- return a skeleton not-implemented result
- avoid repository, DB, provider, storage, and AI imports
- avoid business state changes

It must not:

- query DB
- read Case / Appointment / Field Service Report data
- read customer data
- return fake customer / case / appointment / report data
- perform mutation
- make real permission decisions
- create audit logs
- call AI
- call notification providers
- call file/object storage

## Required Exact Authorization Text

Future runtime work should require an explicit authorization statement, such as:

```text
我明確授權 Task470：Engineer Mobile Workbench resolver skeleton only。

授權範圍：
- local-only resolver skeleton
- only exact files listed by PM in Task470
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
- no AI/RAG/vector DB
- no mobile UI / PWA / UI component
- no upload/signature/object storage
- no production/shared/Zeabur access
- no formal Case / Appointment / Field Service Report state mutation
- no engineer manual finalAppointmentId selection
```

## Stop Conditions For Future Resolver Task

If Task470 or a later resolver task is authorized, Codex must stop and report instead of expanding scope if implementation requires:

- DB / repository
- service layer
- permission runtime
- auth/session runtime
- route behavior beyond wiring to skeleton
- real customer / case / appointment / Field Service Report data
- mutation
- tests / fixtures
- provider sending
- AI/RAG/vector database
- mobile UI
- upload / signature / object storage
- production/shared/Zeabur access
- engineer manual `finalAppointmentId` selection

## Explicit Non-goals

Task 469 does not:

- modify backend `src/`
- modify `admin/src/`
- add or modify route/controller code
- add resolver
- add service
- add repository
- add DB / migration / Migration020
- add permission runtime
- add auth/session runtime
- add tests / fixtures / smoke
- run DB / migration / psql
- run smoke / browser / API tests
- implement mobile UI / PWA
- implement upload / signature / object storage
- trigger provider sending
- call AI/RAG/vector database
- modify `package.json`
- modify inventory docs

## Guardrail Confirmation

The current route/controller skeleton still preserves:

- one Case has one formal Field Service Report
- one Case may have many appointments / dispatch visits
- multi-visit history does not create multiple formal reports
- `field_service_reports.case_id` uniqueness remains untouched
- `finalAppointmentId` remains backend/system-owned
- engineers do not manually select `finalAppointmentId`
- no formal Case / Appointment / Field Service Report state mutation occurs
- no DB/repository access exists in the workbench skeleton
- no provider sending or AI call exists in the workbench skeleton

## Runtime Decision

No runtime behavior changes in Task 469.

The system remains at the Task 467 route/controller skeleton boundary until a later task receives separate explicit authorization.
