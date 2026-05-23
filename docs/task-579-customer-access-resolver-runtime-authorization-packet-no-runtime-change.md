# Task 579 - Customer Access Resolver Runtime Authorization Packet

## Scope

Task579 is a docs-only runtime authorization packet for any future Customer Access Resolver runtime work.

Task579 does not authorize:

- resolver runtime.
- customer-facing API runtime.
- DB access.
- migration.
- provider sending.
- AI / RAG / vector DB.
- customer-facing endpoint implementation.

This document defines the authorization conditions, file boundaries, command boundaries, test boundaries, and no-go conditions that must be satisfied before any future resolver runtime task can begin.

## Current Baseline Summary

The Customer Access Resolver static baseline is closed:

- Task574: resolver implementation sequencing completed as docs-only / no runtime.
- Task575: resolver contract proposal completed as docs-only / no runtime.
- Task576: fixture marker extension completed as fixture-only / no runtime.
- Task577: decision matrix static test completed as test-only / no runtime, with PASS 10/0.
- Task578: static baseline closure review completed as docs-only / no runtime.

Current branch status:

- static baseline closed.
- resolver runtime still blocked.
- customer-facing API runtime still blocked.
- no DB, migration, provider sending, or AI authorization granted.

## Runtime Authorization Gate

Future resolver runtime work requires all of the following:

- explicit user authorization for the exact task.
- an exact task name and scope.
- exact files allowed to modify.
- exact commands allowed to run.
- explicit statement whether `src/` changes are allowed.
- explicit statement whether tests are allowed.
- explicit statement whether fixtures are allowed.
- explicit statement whether DB access is allowed.
- explicit statement whether migration is allowed.
- explicit audit log boundary.
- explicit permission / entitlement boundary.
- explicit rollback or fail-closed expectations.
- explicit stop conditions.

Unless separately authorized, the following remain forbidden:

- DB access.
- migration draft, dry-run, or apply.
- provider sending.
- AI / RAG / vector DB.
- customer-facing endpoint implementation.
- route / controller / DTO / projection / repository / service implementation.

General phrases such as "繼續", "go ahead", "可以", "下一步", "continue", or "next step" do not constitute runtime authorization.

## Possible Future First-runtime Candidate Boundary

The safest future first-runtime candidate, if separately authorized, would be a pure customer access resolver module skeleton.

This is only a future proposal. Task579 does not implement it.

Possible future first-runtime boundary:

- pure function or module skeleton only.
- no route / controller.
- no repository.
- no DB.
- no provider.
- no LINE / SMS / Email / App sending.
- no customer-facing endpoint.
- no formal Field Service Report creation / approval / publication.
- no completion source-data mutation.
- no finalAppointmentId modification.
- static or unit-test only, if separately authorized.

Even for a pure skeleton, a future task must provide exact files, exact commands, and explicit stop conditions before implementation begins.

## Mandatory Invariants

Any future resolver work must preserve:

- One Case equals one final formal Field Service Report.
- A Case may have multiple appointments / dispatch visits.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver cannot create, approve, or publish a Field Service Report.
- Resolver cannot modify completion source-data.
- Resolver cannot modify finalAppointmentId.
- Publication allowed does not equal formal Field Service Report approval.
- LINE is not a global identity.
- `organization_id + line_channel_id + line_user_id` alone is not sufficient authorization.
- Raw phone, address, or LINE id alone cannot authorize access.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.
- Customer-facing denial must not reveal whether the Case, report, organization, or customer linkage exists.

## Explicit No-go Boundaries

The following remain active:

- No resolver runtime.
- No customer-facing API runtime.
- No route / controller / DTO / projection / repository / service.
- No DB / SQL / DDL / psql.
- No migration draft / dry-run / apply.
- No provider sending / LINE / SMS / Email / App push.
- No survey runtime.
- No billing / settlement runtime.
- No AI / RAG / vector DB.
- No package.json change.
- No smoke / browser / API / full test suite.

## Future Task Candidates

Candidates only; do not execute from Task579:

- Task580 - Customer Access Resolver Minimal Runtime Skeleton Proposal / No Runtime Change.
- Task581 - Customer Access Resolver Pure Function Skeleton / Exact Files Only / No API / No DB.
- Task582 - Customer Access Resolver Unit Test Plan / No Runtime Change.
- Task583 - Customer-Facing Access Response Envelope Proposal / No Runtime Change.

Task579 does not start Task580.

## Non-goals

Task579 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task578 documents.

Task579 does not run:

- `npm test`.
- `npm run test`.
- `npm run smoke`.
- `npm run db:migrate`.
- `psql`.
- any DB command.
- any migration command.
- any API command.
- any browser command.
- any provider sending command.

## Guardrails Review

Task579 remains aligned with `PROJECT_GUARDRAILS.md`:

- documentation-only.
- no runtime behavior change.
- no schema or migration change.
- no provider sending.
- no AI auto decision.
- no customer-facing endpoint implementation.
- no sensitive data output.
- no customer channel identity runtime change.
- no organization isolation runtime change.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
