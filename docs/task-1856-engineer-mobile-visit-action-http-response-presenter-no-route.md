# Task1856 - Engineer Mobile Visit Action HTTP Response Presenter / No Route

## Purpose

Task1856 adds a pure HTTP response presenter for Engineer Mobile visit action results and refactors the injected HTTP handler adapter to use it after request normalization and injected service execution.

The local runtime chain remains:

synthetic request -> HTTP request normalizer -> injected HTTP handler adapter -> injected service -> HTTP response presenter -> synthetic HTTP-style response

Synthetic HTTP-style response only.

This task does not add Express, route registration, global mount, DB access, repository access, provider sending, Completion Report behavior, Field Service Report behavior, or finalAppointmentId behavior.

## Changed Files

- `src/engineerMobile/engineerMobileVisitActionHttpResponsePresenter.js`
- `src/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.js`
- `tests/engineerMobile/engineerMobileVisitActionHttpResponsePresenter.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionHttpResponsePresenterBoundary.static.test.js`
- `tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.unit.test.js`
- `docs/task-1856-engineer-mobile-visit-action-http-response-presenter-no-route.md`

## Runtime Summary

The new presenter exports:

- `presentEngineerMobileVisitActionHttpResponse`
- `ENGINEER_MOBILE_VISIT_ACTION_HTTP_RESPONSE_PRESENTER_KIND`

The presenter accepts only synthetic presentation input:

- `responseKind`
- `statusCode`
- `reasonCode`
- `requestId`
- `serviceResult`

The handler still receives a synthetic request and still depends on an injected visit-action service. It now delegates response status/body construction to the presenter instead of constructing the response inline.

The handler still does not import or construct the application service directly.

## Relationship To Request Normalizer And Handler Adapter

The request normalizer remains responsible for extracting and sanitizing request-side fields.

The injected HTTP handler adapter remains responsible for:

- calling the request normalizer
- fail-closed service availability checks
- calling the injected visit-action service
- passing normalized service results or explicit errors to the response presenter

The response presenter remains responsible for:

- synthetic HTTP status-code mapping
- sanitized response body construction
- explicit error body construction
- service-result response body construction

## Status-code mapping

The presenter maps:

- accepted allowed service result: HTTP 202
- unsupported action: HTTP 400
- policy or assignment denial: HTTP 403
- missing service / service failure: HTTP 500
- appointment ID mismatch: HTTP 400
- writer or persistence-port failure reason codes: HTTP 500

Unknown non-error service result shapes continue to fail safely through the existing synthetic response envelope without exposing raw data.

## Sanitized response field allowlist

The presenter response body allowlist is:

- `ok`
- `accepted`
- `allowed`
- `action`
- `reasonCode`
- `appointmentId`
- `caseId`
- `organizationId`
- `transition.applied`
- `transition.mobileVisitStatus`
- `transition.visitResult`
- `audit.recorded`
- `requestId`
- `error.code`

It does not copy unknown service result fields into the response body.

It does not expose:

- raw request object
- raw service result object
- raw error message
- stack trace
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
- No completion report creation
- No completion report approval
- No completion report publication
- No Completion Report / Field Service Report creation
- No Completion Report / Field Service Report publication
- No finalAppointmentId mutation
- No customer-visible publication
- No staging
- No commit
- No push
- No cleanup/reset/stash/revert
- No touching the 7 held historical docs

## Future Sequence

1. keep handler normalizer/presenter tests green.
2. create real route/controller only after separate approval.
3. global route/mount only after separate approval.
4. real DB persistence only after approved DB dry-run and repository implementation.

## Verification Plan

Run:

- `git status --short --branch`
- `git diff --name-only`
- `git diff --cached --name-only`
- `git diff --check -- src/engineerMobile/engineerMobileVisitActionHttpResponsePresenter.js src/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.js tests/engineerMobile/engineerMobileVisitActionHttpResponsePresenter.unit.test.js tests/engineerMobile/engineerMobileVisitActionHttpResponsePresenterBoundary.static.test.js tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.unit.test.js docs/task-1856-engineer-mobile-visit-action-http-response-presenter-no-route.md`
- `node --test tests/engineerMobile/engineerMobileVisitActionHttpResponsePresenter.unit.test.js tests/engineerMobile/engineerMobileVisitActionHttpResponsePresenterBoundary.static.test.js tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.unit.test.js`
- `node --test tests/engineerMobile/*VisitAction*.js`
- `npm run check`
- precise credential/sensitive scan limited to the six Task1856 files
