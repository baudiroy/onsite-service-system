# Task 484 - Engineer Mobile Workbench Real Projection Data Design Packet

## Status

Task 484 is docs-only.

It designs the future real projection data boundary for Engineer Mobile Workbench. It does not authorize or implement runtime behavior.

## Current Baseline

Current branch remains skeleton-only.

Current endpoints still return `501 Not Implemented`.

Current projection skeleton returns:

- `implemented = false`
- `allowListOnly = true`
- `data = null`

Task 474 only added a placeholder projection. It does not return real task, case, appointment, customer, or completion data.

Task 482 completed the actual auth/session design packet but did not implement runtime.

Task 483 completed the real permission / assignment design packet but did not implement runtime.

Task 484 is design-only and does not authorize runtime implementation.

## Future Projection Purpose

Future Engineer Mobile Workbench projection should turn already-authorized platform data into mobile-first DTOs for engineer workflows.

Future projection may support:

- current engineer context
- task list
- task detail
- status operation result
- completion submission result

Projection must remain:

- allow-list first
- minimum necessary
- mobile-first
- low-burden
- safe for engineer role visibility
- protected against internal, sensitive, cross-engineer, and cross-organization data leakage

Projection should shape data for the engineer's immediate task. It must not become a generic Case, Appointment, Customer, Field Service Report, audit, billing, settlement, or AI payload passthrough.

## Projection Prerequisites

Future projection must not return identity data before actual auth/session validation exists and succeeds.

Future projection must not return task, Case, appointment, customer, or completion data before real permission / assignment guard allows access.

Permission allow is only a prerequisite. It is not permission to return all underlying data.

Projection must not query the DB unless a later PM task explicitly scopes repository/data access files.

Projection must not bypass:

- Data Access Control / Data Permission Model
- organization scope
- role / permission checks
- assignment checks
- feature entitlement checks, if applicable
- field-level masking
- customer visible data policy
- internal data policy
- audit and usage boundaries, if applicable

Projection must not trust client-supplied `organizationId` or `engineerId`.

Server-side authenticated context and already-authorized source data must be the only basis for projected response data.

## Proposed DTO Categories

Future projection can be organized into these DTO categories:

- current engineer context DTO
- task list item DTO
- task detail DTO
- status operation result DTO
- completion submission result DTO
- generic safe-deny / not-available envelope
- optional future draft status DTO

These categories are proposals only. They do not create API contract implementation in Task 484.

## Current Engineer Context DTO Boundary

Future current context should help the mobile workbench render a minimal authenticated state.

Candidate fields:

- session status summary
- engineer display name, if authorized
- organization display label, if authorized
- role label or engineer role summary
- workbench feature availability summary
- safe current time / timezone display metadata, if needed

Must not include:

- raw auth token
- raw session object
- raw provider identity
- internal user permission dump
- complete organization settings
- unrelated organization membership data
- sensitive personal data that is not needed for the mobile workbench

## Task List Item DTO Allow-list Candidate Fields

Future task list items should be compact and safe for mobile scanning.

Candidate fields:

- appointment / dispatch visit reference in a non-enumerable or public-safe form
- scheduled time window
- broad task status
- product category or product summary
- repair issue summary
- rough location hint, avoiding full address in list view
- urgency / SLA display label if authorized
- customer contact availability indicator, not full customer PII

Task list items must not include:

- internal note
- audit log
- AI raw payload
- billing / settlement internal data
- raw channel ids
- token / secret
- unrelated customer history
- other engineer tasks
- cross-organization data
- full address by default
- full customer contact details by default
- full Field Service Report data

## Task Detail DTO Allow-list Candidate Fields

Future task detail should provide the minimum necessary data for the assigned engineer to perform the visit.

Candidate fields:

- appointment time
- customer on-site contact, minimum necessary and role-authorized
- address only in authorized detail view
- access notes or service notes filtered from internal sensitive content
- product information
- repair issue summary
- required service reminders
- allowed previous service summary if a future policy permits it and it is minimum necessary
- status operation options based on future permission and state guard

Task detail must not include:

- internal note
- audit log
- AI raw payload
- raw LINE/provider ids
- billing / settlement internal data
- vendor contract rules
- supervisor internal review notes
- unrelated customer history
- full historical records by default
- customer-facing report data that has not been approved for engineer visibility
- raw photo or signature data
- unmasked photo content unless a later scoped file access policy permits it

## Status Operation Result DTO Boundary

Future arrived / started / completion submitted operations should return a minimal result only.

Candidate fields:

- operation accepted or rejected summary
- task reference
- updated broad task status, if authorized
- safe message key
- next allowed action summary, if authorized

Status operation result must not return:

- full Case
- full Appointment
- full Field Service Report
- formal Case completion
- formal Field Service Report creation
- customer-facing report visibility
- internal transition details
- audit internals
- raw state machine internals

Failures should use generic safe-deny or equivalent response shapes where appropriate.

## Completion Submission Result DTO Boundary

Future completion submission result is an acknowledgement of engineer submission. It is not the formal Field Service Report.

Completion submission result must not:

- return Field Service Report draft content unless a later PM task scopes it
- create or return a formal Field Service Report
- expose `finalAppointmentId` as engineer-selectable or engineer-overridable
- return service parts / inventory internal result
- return raw photo data
- return raw signature data
- imply final Case completion unless a later backend completion workflow has completed it

Future minimal acknowledgement may include:

- submission received summary
- task reference
- broad submitted status
- next review state, if authorized
- duplicate submit prevention summary, if applicable

Projection should avoid duplicate submit / status confusion. A submitted completion payload and a formal completed report are separate concepts.

## Customer-facing And Internal Separation

Future projection must not leak:

- internal note
- audit log
- AI raw payload
- billing / settlement internals
- vendor contract rules
- supervisor internal review notes
- engineer internal comments not intended for the current engineer role
- raw LINE/provider ids
- token / secret
- unrelated customer history
- raw photo data
- raw signature data
- unmasked photo content

Engineer mobile projection is not a customer-facing report projection and is not an internal-admin full-detail projection. It must use its own allow-list.

## Safe-deny And Response Equivalence

Future unauthenticated, unauthorized, not found, not own, and cross-organization cases should avoid leaking differences that support enumeration.

Future responses must not leak:

- whether a task exists
- whether a Case exists
- whether a customer exists
- whether an appointment exists
- whether a task belongs to another engineer
- whether an organization exists
- internal error details
- DB or repository details

Message keys and response shapes should be non-enumerable and generic where needed.

Safe-deny design should protect both direct API clients and mobile workbench UI flows.

## Future Sequencing Proposal

This proposal does not authorize implementation.

Suggested future sequence:

1. Confirm real projection runtime authorization.
2. Provide exact file touch plan.
3. Confirm actual auth/session runtime exists and is approved for use.
4. Confirm real permission / assignment runtime exists and is approved for use.
5. Define DTO allow-list constants or helper, if scoped.
6. Map only from already-authorized source data.
7. Avoid DB queries unless repository/data access is separately scoped.
8. Keep Field Service Report, inventory, billing, settlement, AI, and file access outside projection unless explicitly scoped.
9. Add tests only under a separate PM-scoped task.
10. Add sensitive scan / response fixture review only under a separate PM-scoped task.

## Future Stop Conditions

Future projection work must stop and report if it requires:

- unscoped raw DB rows
- internal note returned in response
- audit log returned in response
- AI raw payload returned in response
- raw channel ids returned in response
- billing / settlement internals returned in response
- full unrelated history returned in response
- data returned before permission allow
- Field Service Report draft returned accidentally
- formal Field Service Report returned accidentally
- `finalAppointmentId` exposed as engineer-selectable
- DB/repository added without PM scope
- provider sending
- AI/RAG call
- vector database access
- raw photo/signature streaming
- customer-facing report generation

## Explicit Non-goals

Task 484 does not:

- modify backend `src/`
- modify `admin/src/`
- modify runtime behavior
- modify route/controller/resolver/guard/projection/auth/boundary code
- add service
- add repository
- query DB
- add DB / migration / Migration020
- add tests
- add smoke
- add browser coverage
- modify API behavior
- implement mobile UI / PWA
- implement upload
- implement signature capture
- implement provider sending
- call AI/RAG/vector database
- modify `package.json`
- modify inventory docs

## Migration / Schema Decision

No migration, schema, index, or Migration020 change is included in Task 484.

## Runtime Decision

No runtime behavior is changed in Task 484.

The Engineer Mobile Workbench remains at the skeleton-only boundary until PM provides a runtime task with exact allowed files and scope.
