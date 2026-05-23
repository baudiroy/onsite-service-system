# Task 908 - Customer Access Read-Only Service Report Projection

## Status

Completed.

## Goal

Create the first bounded Customer Access read-only projection service for a customer-safe service report view through an injected DB client.

This task does not create a public route and does not wire a real DB connection.

## Modified Files

- `src/customerAccess/customerServiceReportProjectionService.js`
- `tests/customerAccess/customerServiceReportProjectionService.unit.test.js`
- `tests/customerAccess/customerServiceReportProjectionServiceClosure.static.test.js`
- `docs/task-908-customer-access-read-only-service-report-projection-injected-db-client-no-route-no-migration.md`

No `admin/src/`, `migrations/`, API route/controller/bootstrap, real repository/base repository/transaction, provider, LINE/SMS/email/App push/webhook, AI/RAG/vector/search, billing/settlement, package/env/config/credential, smoke, or shared runtime file was modified.

## Implementation Summary

`getCustomerServiceReportProjection` accepts:

- `dbClient`
- `customerAccessContext`
- `caseId`
- `reportId`

The service:

- requires an injected `dbClient.query`
- requires an authorized customer access context
- fails closed before query when context is missing, invalid, unauthorized, or scoped to a different case
- reads only through the injected client
- uses a read-only query spec with placeholder values
- returns a generic safe-deny envelope for missing DB client, invalid context, org/customer/case/report mismatch, not found, customer-visible policy failure, or query error
- returns only an allowlisted customer-visible service report projection for authorized rows
- excludes forbidden internal/sensitive fields and nested attachment data
- does not mutate input context or row objects

## Customer-visible Projection Allowlist

The output may include only:

- `customerReportReference`
- `caseReference`
- `serviceStatus`
- `appointmentWindow`
- `engineerDisplayName`
- `serviceSummary`
- `completionTime`
- `publicAttachments` with safe `attachmentId`, `label`, and `mimeType`

The service does not return raw DB rows.

## Forbidden Output Coverage

Tests cover exclusion of raw phone, raw address, LINE user id, `finalAppointmentId`, internal notes, technician/dispatch notes, SQL, stack traces, token/secret-like values, provider raw payload, signed URLs, and billing/settlement internals.

## Explicit Non-scope

- No DB execution.
- No real DB connection.
- No migration.
- No psql.
- No `npm run db:migrate`.
- No DDL/SQL apply or dry-run.
- No customer login/session implementation.
- No route.
- No controller.
- No public API shape change.
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
node --test tests/customerAccess/customerServiceReportProjectionService.unit.test.js
node --test tests/customerAccess/customerServiceReportProjectionServiceClosure.static.test.js
node --test tests/customerAccess/*.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- src/customerAccess tests/customerAccess docs/task-908-customer-access-read-only-service-report-projection-injected-db-client-no-route-no-migration.md
```

Current results:

- `node --test tests/customerAccess/customerServiceReportProjectionService.unit.test.js`: PASS (9 tests)
- `node --test tests/customerAccess/customerServiceReportProjectionServiceClosure.static.test.js`: PASS (5 tests)
- `node --test tests/customerAccess/*.js`: PASS (610 tests)
- `npm run check`: PASS
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS (2872 tests)
- `git diff --check -- src/customerAccess tests/customerAccess docs/task-908-customer-access-read-only-service-report-projection-injected-db-client-no-route-no-migration.md`: PASS
