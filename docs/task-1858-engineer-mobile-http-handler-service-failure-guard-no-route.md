# Task1858 - Engineer Mobile HTTP Handler Service Failure Guard / No Route

## Purpose

Task1858 adds a narrow service failure guard to the Engineer Mobile visit-action HTTP handler path.

When the injected visit-action service throws or rejects, the handler now returns a sanitized synthetic HTTP-style failure response with `service_invocation_failed` and HTTP 500.

This keeps raw service errors out of the response while preserving the safe `requestId`.

## Relationship To Existing Runtime Pieces

The request normalizer still owns synthetic request extraction and request-side sanitization.

The injected HTTP handler adapter still owns:

- calling the request normalizer
- checking whether an injected service handler exists
- calling the injected visit-action service
- converting thrown service failures into a safe presenter input

The response presenter still owns:

- mapping `service_invocation_failed` to HTTP 500
- constructing the sanitized synthetic HTTP-style response body
- preserving safe `requestId`
- excluding raw error fields and stack data

Synthetic HTTP-style failure handling only.

No route/controller/global mount is added.

## Service Failure Mapping

`service_invocation_failed` maps to HTTP 500.

The response body includes only safe fields:

- `ok`
- `accepted`
- `allowed`
- `reasonCode`
- `requestId`
- `error.code`

Raw service errors and stacks must never be exposed.

The response must not include:

- raw error message
- stack trace
- thrown error object
- raw service result object
- headers
- cookies
- authorization material
- session
- IP or user-agent
- phone
- address
- LINE IDs
- customer raw data
- private notes
- report draft fields
- provider payloads
- DB metadata
- query details
- customer-visible publication fields
- Completion Report fields
- Field Service Report fields
- finalAppointmentId mutation fields

## Boundary Confirmation

- No DB
- No SQL
- No raw SQL strings
- No SQL statement builder
- No migration
- No DDL
- No schema or index change
- No route registration
- No global mount
- No Express import
- No listen call
- No repository import
- No repository implementation
- No DB client import
- No real DB connection
- No real persistence
- No audit log persistence
- No provider sending
- No AI/RAG
- No billing/settlement
- No admin UI
- No package or lockfile change
- No seed change
- No smoke test
- No permission table migration
- No completion report creation
- No completion report approval
- No completion report publication
- No Completion Report / Field Service Report creation
- No Completion Report / Field Service Report approval
- No Completion Report / Field Service Report publication
- No finalAppointmentId creation
- No finalAppointmentId mutation
- No customer-visible publication
- No staging
- No commit
- No push
- No cleanup/reset/stash/revert
- No touching the 7 held historical docs

## Future Gate

Future real route/controller/global mount still requires separate approval.

Future DB-backed repository work, persistence, audit log persistence, smoke tests, provider sending, Completion Report behavior, Field Service Report behavior, or finalAppointmentId behavior also requires separate bounded approval.

## Verification Plan

Run:

- `git status --short --branch`
- `git diff --name-only`
- `git diff --cached --name-only`
- `git diff --check -- src/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.js src/engineerMobile/engineerMobileVisitActionHttpResponsePresenter.js tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.unit.test.js tests/engineerMobile/engineerMobileVisitActionHttpResponsePresenter.unit.test.js tests/engineerMobile/engineerMobileVisitActionHttpResponsePresenterBoundary.static.test.js docs/task-1858-engineer-mobile-http-handler-service-failure-guard-no-route.md`
- `node --test tests/engineerMobile/engineerMobileVisitActionHttpResponsePresenter.unit.test.js tests/engineerMobile/engineerMobileVisitActionHttpResponsePresenterBoundary.static.test.js tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.unit.test.js`
- `node --test tests/engineerMobile/*VisitAction*.js`
- `npm run check`
- precise credential/sensitive scan limited to the six Task1858 files
