# Task 482 - Engineer Mobile Workbench Actual Auth / Session Design Packet

## Status

Task 482 is docs-only.

It designs the future actual auth/session validation boundary for Engineer Mobile Workbench. It does not authorize or implement runtime behavior.

## Current Baseline

Current branch remains skeleton-only.

Current endpoints still return `501 Not Implemented`.

Current auth/session boundary is skeleton only.

Task 476 only added a placeholder boundary and did not implement actual login/session validation.

Task 482 is design-only and does not authorize runtime implementation.

## Future Auth / Session Purpose

Future actual auth/session validation should:

- verify engineer login state
- establish engineer context
- establish organization scope
- provide the identity prerequisite for engineer role / assignment gates
- support mobile web / PWA / LIFF-like entry as future design
- avoid making LINE push a required dependency for engineer task management

Auth/session validation is only the identity boundary. It is not sufficient by itself to authorize task access or completion submission.

## Identity Source Boundaries

Future implementation must preserve these identity boundaries:

- token/link must not be treated as the engineer identity itself
- raw LINE user id must not be treated as global identity
- if LINE is used as an entry point, it can only be quick login / identity binding / shortcut
- engineer identity must be resolved through organization scope and verified binding
- client must not be allowed to submit arbitrary `engineerId` or `organizationId` override
- unverified channel identity must not grant task data access
- customer channel identity and engineer identity must not be mixed

## Auth / Session Request Boundary

Future request handling should use minimum necessary auth/session inputs.

Principles:

- accept only minimum necessary headers / cookies / session reference
- do not log full token
- do not write token into audit log
- do not send raw credential to AI
- do not accept raw provider payload as the auth source
- do not return token/session details in error responses
- do not accept identity override from request body
- do not use customer channel identity as engineer identity

## Auth / Session Response Boundary

Future auth/session response shape should be allow-list first.

Principles:

- return only necessary engineer context
- do not return full credential
- do not return raw channel ids
- do not return internal auth decision details
- do not return other engineer data
- do not return customer data
- do not return case data
- do not return appointment data
- unauthenticated, expired session, unauthorized, or cross-organization failures should use generic safe-deny or equivalent failure behavior
- do not leak whether a task, Case, customer, or appointment exists

## Organization Isolation And Task Isolation

Actual auth/session validation is an identity prerequisite, not task authorization.

Future implementation must preserve:

- engineer task assignment / permission guard remains an independent check
- organization isolation must be enforced consistently across auth/session, permission, projection, and repository layers
- entitlement is not permission
- admin permission must not hide or bypass organization isolation problems
- a valid session must not automatically mean access to every task in the organization

## Future Implementation Sequencing Proposal

This proposal does not authorize implementation.

Suggested sequence:

1. Auth/session runtime authorization confirmation.
2. Exact file touch plan.
3. Auth/session boundary implementation.
4. No-DB path first if possible, or DB path only after separate PM scope.
5. Permission guard remains skeleton until separately scoped.
6. Projection remains skeleton until separately scoped.
7. Tests only after separate PM scope.
8. DB/repository only after separate PM scope.

## Future Stop Conditions

Future auth/session work must stop and report if it requires:

- client-supplied engineer id / organization id override
- raw token logging
- raw provider payload as auth source
- raw LINE id exposure
- task data returned before assignment guard
- DB/repository added without exact scope
- provider sending
- AI/RAG call
- customer/case/appointment/Field Service Report data returned
- auth/session implementation mutating Case / Appointment / Field Service Report
- accidental completion submission persistence

## Explicit Non-goals

Task 482 does not:

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

No migration, schema, index, or Migration020 change is included in Task 482.

## Runtime Decision

No runtime behavior is changed in Task 482.

The Engineer Mobile Workbench remains at the skeleton-only boundary until PM provides a runtime task with exact allowed files and scope.
