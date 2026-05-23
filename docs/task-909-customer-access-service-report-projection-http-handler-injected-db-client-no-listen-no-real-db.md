# Task 909 - Customer Access Service Report Projection HTTP Handler

## Status

Completed.

## Goal

Add a thin HTTP-like handler layer for the Task908 customer-safe service report projection.

This task does not register a production route, start a listener, or wire a real DB connection.

## Modified Files

- `src/customerAccess/customerServiceReportProjectionHandler.js`
- `tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js`
- `tests/customerAccess/customerServiceReportProjectionHandlerClosure.static.test.js`
- `docs/task-909-customer-access-service-report-projection-http-handler-injected-db-client-no-listen-no-real-db.md`

No `admin/src/`, `migrations/`, production route/controller/bootstrap, real repository/base repository/transaction, provider, LINE/SMS/email/App push/webhook, AI/RAG/vector/search, billing/settlement, package/env/config/credential, smoke, or shared runtime file was modified.

## Implementation Summary

`customerServiceReportProjectionHandler.js` exports:

- `handleCustomerServiceReportProjectionRequest({ request, dbClient })`
- `createCustomerServiceReportProjectionHandler({ dbClient })`

The handler:

- requires an injected `dbClient`
- extracts only safe request params for `caseId` and `reportId`
- requires a pre-resolved `customerAccessContext`
- delegates projection logic to `getCustomerServiceReportProjection`
- returns HTTP-like status `200` for an allow envelope
- returns generic status `404` for safe-deny, invalid input, unauthorized context, org/customer/case/report mismatch, not found, or query error
- supports a synthetic `res.status(...).json(...)` path for unit tests without registering a route
- does not mutate request, context, DB row, Case, Appointment, or Field Service Report data

## Response Boundary

The handler does not duplicate the Task908 projection filter. The only customer-visible allow output comes from the Task908 safe projection allowlist:

- `customerReportReference`
- `caseReference`
- `serviceStatus`
- `appointmentWindow`
- `engineerDisplayName`
- `serviceSummary`
- `completionTime`
- safe `publicAttachments` metadata

All deny responses use the same generic `customerAccess.unavailable` envelope and do not reveal whether a denied report exists.

## Explicit Non-scope

- No listen.
- No `app.listen`.
- No real server.
- No production route registration.
- No route.
- No controller.
- No public API rollout.
- No API shape change.
- No real DB.
- No DB execution.
- No migration.
- No psql.
- No `npm run db:migrate`.
- No DDL/SQL apply or dry-run.
- No customer login/session implementation.
- No report creation, approval, or publish.
- No `finalAppointmentId` modification.
- No Field Service Report creation.
- No Case mutation.
- No Appointment mutation.
- No provider sending.
- No AI/RAG.
- No billing/settlement.
- No smoke/shared runtime.

## Verification

Commands to run:

```sh
node --test tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js
node --test tests/customerAccess/customerServiceReportProjectionHandlerClosure.static.test.js
node --test tests/customerAccess/customerServiceReportProjectionService.unit.test.js
node --test tests/customerAccess/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/customerAccess tests/customerAccess docs/task-909-customer-access-service-report-projection-http-handler-injected-db-client-no-listen-no-real-db.md
```

Current results:

- `node --test tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js`: PASS (8 tests)
- `node --test tests/customerAccess/customerServiceReportProjectionHandlerClosure.static.test.js`: PASS (5 tests)
- `node --test tests/customerAccess/customerServiceReportProjectionService.unit.test.js`: PASS (9 tests)
- `node --test tests/customerAccess/*.js`: PASS (623 tests)
- `npm run check`: PASS
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS (2885 tests)
- `git diff --check -- src/customerAccess tests/customerAccess docs/task-909-customer-access-service-report-projection-http-handler-injected-db-client-no-listen-no-real-db.md`: PASS
