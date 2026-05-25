# Task 483 - Engineer Mobile Workbench Real Permission / Assignment Design Packet

## Status

Task 483 is docs-only.

It designs the future real permission / assignment guard for Engineer Mobile Workbench. It does not authorize or implement runtime behavior.

## Current Baseline

Current branch remains skeleton-only.

Current endpoints still return `501 Not Implemented`.

Current permission / assignment guard is skeleton only.

Task 472 only added a placeholder guard and did not implement real allow/deny decisions.

Task 482 completed the actual auth/session design packet but did not implement runtime.

Task 483 is design-only and does not authorize runtime implementation.

## Future Permission / Assignment Purpose

Future real permission / assignment guard should:

- confirm the authenticated engineer belongs to the correct organization
- confirm the appointment / dispatch visit is assigned to that engineer, or the engineer has an explicit authorized exception
- ensure engineers can only view their own tasks
- ensure status operations only apply to assigned or explicitly authorized appointment / dispatch visit records
- prevent cross-organization task lookup or operation
- prevent cross-engineer task lookup or operation
- prevent unauthorized task lookup or operation
- prevent task existence enumeration

## Permission Input Boundaries

Future permission checks must preserve these boundaries:

- permission check must not trust client-supplied `engineerId`
- permission check must not trust client-supplied `organizationId` override
- permission check must use server-side authenticated engineer context
- appointment / dispatch visit id is only a lookup target, not proof of access
- token/link must not be treated as engineer identity
- raw LINE user id must not be treated as global identity
- customer channel identity must not be mixed with engineer identity
- entitlement is not permission

## Assignment Decision Boundaries

Future assignment checks should follow these principles:

- appointment / dispatch visit must be in the same organization scope
- appointment / dispatch visit must be assigned to the authenticated engineer, or be covered by an explicit authorized exception
- one Case should not have multiple unfinished appointments at the same time
- engineers must not directly create arbitrary new appointments
- engineers must not perform formal reassignment
- cancellation or reschedule from engineer side should be field feedback, not a formal appointment change by itself
- engineers must not manually select or overwrite `finalAppointmentId`

## Safe-deny And Enumeration Protection

Future permission failures should use generic safe-deny or response equivalence for:

- unauthenticated user
- unauthorized user
- task not found
- task not assigned to this engineer
- cross-organization access
- invalid appointment / dispatch visit reference

Future behavior must not leak:

- whether appointment exists
- whether Case exists
- whether customer exists
- whether appointment is assigned to another engineer
- whether organization exists
- DB error details
- stack trace
- internal denial reason that enables enumeration

Message keys and outward error shapes should avoid resource-specific details that make enumeration easier.

## Response And Projection Boundary

Permission allow is only a prerequisite. It does not mean the endpoint can return all data.

Future responses must still use:

- allow-list projection
- minimum necessary data
- field-level masking
- organization scope
- customer visible data policy
- internal data policy

Future engineer response projection must not return:

- internal note
- audit log
- AI raw payload
- billing / settlement internal data
- raw channel ids
- token / secret
- unrelated customer history

Customer-facing report policy must not be bypassed by engineer-side projection.

## Status Operation Boundary

Future arrived / started / completion submitted actions are appointment / dispatch visit layer operations.

The permission guard must not:

- modify status by itself
- create Field Service Report draft
- create formal Field Service Report
- infer or write `finalAppointmentId`
- trigger provider sending
- call AI
- write audit/evidence records unless separately scoped

## Future Implementation Sequencing Proposal

This proposal does not authorize implementation.

Suggested sequence:

1. Real permission runtime authorization confirmation.
2. Exact file touch plan.
3. Server-side engineer context integration if actual auth/session has already been scoped.
4. Assignment lookup design.
5. Safe-deny response equivalence design.
6. No-DB path first if possible, or DB path only after separate PM scope.
7. Projection remains allow-list first.
8. Tests only after separate PM scope.
9. DB/repository only after separate PM scope.

## Future Stop Conditions

Future permission / assignment work must stop and report if it requires:

- client-supplied engineer id / organization id for authorization
- task data returned before permission allow
- resource existence leakage
- raw LINE id exposure
- raw provider payload as identity source
- DB/repository added without PM scope
- provider sending
- AI/RAG call
- customer/case/appointment/Field Service Report data returned outside projection
- permission implementation mutating Case / Appointment / Field Service Report
- accidental completion submission persistence
- `finalAppointmentId` accepted from engineer request

## Explicit Non-goals

Task 483 does not:

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

No migration, schema, index, or Migration020 change is included in Task 483.

## Runtime Decision

No runtime behavior is changed in Task 483.

The Engineer Mobile Workbench remains at the skeleton-only boundary until PM provides a runtime task with exact allowed files and scope.
