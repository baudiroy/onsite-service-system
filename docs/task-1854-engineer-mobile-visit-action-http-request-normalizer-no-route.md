# Task1854 - Engineer Mobile Visit Action HTTP Request Normalizer / No Route

## Purpose

Task1854 adds a pure HTTP request normalizer for Engineer Mobile visit action requests and refactors the existing injected HTTP handler adapter to call that normalizer before the injected application service.

The local runtime chain remains:

synthetic request -> HTTP request normalizer -> injected HTTP handler adapter -> injected application service

Synthetic request only.

This task does not add Express, route registration, global mount, DB access, repository access, provider sending, Completion Report behavior, Field Service Report behavior, or finalAppointmentId behavior.

## Changed Files

- `src/engineerMobile/engineerMobileVisitActionHttpRequestNormalizer.js`
- `src/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.js`
- `tests/engineerMobile/engineerMobileVisitActionHttpRequestNormalizer.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionHttpRequestNormalizerBoundary.static.test.js`
- `tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.unit.test.js`
- `docs/task-1854-engineer-mobile-visit-action-http-request-normalizer-no-route.md`

## Runtime Summary

The new normalizer exports:

- `normalizeEngineerMobileVisitActionHttpRequest`
- `ENGINEER_MOBILE_VISIT_ACTION_HTTP_REQUEST_NORMALIZER_KIND`

The normalizer accepts the synthetic request shape:

- `actor`
- `params.appointmentId`
- `params.action`
- `body.appointment`
- `body.visitResult`
- `now`
- `requestId`

It returns only sanitized normalized fields for the handler:

- `ok`
- `normalized`
- `normalizerKind`
- `action`
- `actor`
- `appointment`
- `visitResult`
- `now`
- `requestId`
- `appointmentId`

The existing injected HTTP handler adapter now uses the normalizer result before calling the injected service. It still does not import or construct the application service directly.

## Sanitized request field allowlist

The normalizer allowlists only known safe actor and appointment fields needed by the current Engineer Mobile visit-action synthetic boundary.

It does not copy unknown root, params, or body fields into output.

It does not copy or expose:

- raw request object
- headers
- cookies
- authorization
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
- repository names
- stack traces
- customer-visible publication fields
- Completion Report fields
- Field Service Report fields
- finalAppointmentId mutation fields

## Appointment ID Mismatch

Appointment ID mismatch handling is preserved.

If `params.appointmentId` and an appointment id from `body.appointment.id`, `body.appointment.appointmentId`, or `body.appointment.appointment_id` are both present, they must match.

Mismatch remains a sanitized HTTP 400 response with `APPOINTMENT_ID_MISMATCH`.

Missing appointment remains allowed to flow downstream so existing service and policy denial behavior can respond safely.

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

1. keep handler/normalizer tests green.
2. create real route/controller only after separate approval.
3. global route/mount only after separate approval.
4. real DB persistence only after approved DB dry-run and repository implementation.

## Verification Plan

Run:

- `git status --short --branch`
- `git diff --name-only`
- `git diff --cached --name-only`
- `git diff --check -- src/engineerMobile/engineerMobileVisitActionHttpRequestNormalizer.js src/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.js tests/engineerMobile/engineerMobileVisitActionHttpRequestNormalizer.unit.test.js tests/engineerMobile/engineerMobileVisitActionHttpRequestNormalizerBoundary.static.test.js tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.unit.test.js docs/task-1854-engineer-mobile-visit-action-http-request-normalizer-no-route.md`
- `node --test tests/engineerMobile/engineerMobileVisitActionHttpRequestNormalizer.unit.test.js tests/engineerMobile/engineerMobileVisitActionHttpRequestNormalizerBoundary.static.test.js tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.unit.test.js`
- `node --test tests/engineerMobile/*VisitAction*.js`
- `npm run check`
- precise credential/sensitive scan limited to the six Task1854 files
