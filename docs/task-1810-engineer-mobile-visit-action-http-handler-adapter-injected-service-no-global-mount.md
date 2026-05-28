# Task1810 Engineer Mobile Visit Action HTTP Handler Adapter / Injected Service Only No Global Mount

Status: implemented locally.

## Scope

Task1810 adds a bounded synthetic HTTP-style handler adapter for Engineer Mobile visit actions. The adapter translates a test-only request envelope into an injected application-service call and maps the sanitized service result to a sanitized HTTP-style response.

This task does not add DB access, route registration, global mounting, controllers, repositories, Express imports, real persistence, provider sending, Completion Report behavior, Field Service Report behavior, customer-visible publication, or final appointment mutation.

## Files

- `src/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.js`
- `tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapterBoundary.static.test.js`

## Runtime Behavior

The module exports:

- `createEngineerMobileVisitActionHttpHandlerAdapter`
- `ENGINEER_MOBILE_VISIT_ACTION_HTTP_HANDLER_ADAPTER_KIND`

The factory accepts one injected dependency only:

- `visitActionService`

The module does not import the application service. The created adapter exposes:

- `handleEngineerMobileVisitActionRequest(request)`

The request object is synthetic and test-only. The adapter extracts only safe fields needed for the service call:

- `action`
- `actor`
- `appointment`
- `visitResult`
- `now`

The adapter validates that `visitActionService.handleEngineerMobileVisitAction` exists. Missing service dependencies return `statusCode: 500` with a sanitized `VISIT_ACTION_SERVICE_REQUIRED` error code.

When `params.appointmentId` and `body.appointment.appointmentId` or `body.appointment.id` are both present but do not match, the adapter returns `statusCode: 400` with a sanitized `APPOINTMENT_ID_MISMATCH` error code and does not call the injected service.

The adapter maps service results as follows:

- accepted result to `statusCode: 202`
- denied policy result to `statusCode: 403`
- unsupported action to `statusCode: 400`
- transition writer required or failed to `statusCode: 500`
- audit write failed to `statusCode: 500`

Response bodies are sanitized and limited to safe values such as `ok`, `accepted`, `allowed`, `action`, `reasonCode`, `appointmentId`, `caseId`, `organizationId`, `transition`, `audit`, and `requestId` when provided. Sanitized error responses include only stable error codes.

The adapter does not expose raw appointment/customer data, phone, address, LINE IDs, private notes, report draft fields, provider payloads, raw writer errors, stack traces, SQL, DB details, or customer-visible publication fields.

The adapter does not mutate `request`, `actor`, `appointment`, `body`, or `params`. It does not call `Date.now()`, `new Date()`, timers, environment variables, filesystem, DB, network, repositories, Express, route registration, or global app state.

## Boundary Confirmation

- No DB
- No migration
- No SQL execution
- No psql
- No global mount
- No Express import
- No route registration
- No controller registration
- No provider sending
- Injected service only
- No real persistence
- No repository import
- No repository changes
- No smoke test
- No AI/RAG
- No billing/settlement
- No admin UI
- No package or lockfile changes
- No seed changes
- No completion report creation
- No completion report approval
- No completion report publication
- No Field Service Report creation
- No Field Service Report approval
- No Field Service Report publication
- No finalAppointmentId mutation
- No customer-visible publication

Synthetic services are used only in tests to prove service injection, safe request extraction, response mapping, sanitized output, appointment ID mismatch handling, missing dependency handling, and no input mutation.
