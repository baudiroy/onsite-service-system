# Task2147 - Customer Access Production Mount HTTP Behavior Surrogate / No Server No DB No Smoke

## Scope

Task2147 adds synthetic HTTP behavior coverage for the Task2146 Customer Access production composition mount. This task is tests-only plus documentation.

Changed files:

- `tests/customerAccess/customerAccessProductionMount.http-behavior.unit.test.js`
- `docs/task-2147-customer-access-production-mount-http-behavior-surrogate-no-server-no-db-no-smoke.md`

No source/runtime files were changed.

## Coverage Summary

The new surrogate test builds production composition through:

```js
createAppRouter({
  customerAccess: {
    dbClient,
    repository,
    auditWriter,
  },
});
```

It then dispatches synthetic request/response objects through the real mounted route handlers. No server, listener, real HTTP client, smoke probe, DB connection, migration, env lookup, Zeabur lookup, or provider call is used.

Covered accepted public routes:

- `GET /customer-access/:caseId`
- `GET /customer-access/:caseId/service-report/:reportId`

The internal test route remains excluded from production composition:

- `/__internal/customer-access/service-reports/:caseId/:reportId`

## Behavior Locked

- Case overview allow envelope keeps only `status`, `messageKey`, `customerVisible`, and `data`.
- Case overview response data keeps only `data.serviceReport`.
- Case overview `serviceReport` keeps only `caseNo`, `finalAppointmentId`, `publicReportId`, `status`, and `summary`.
- Service-report allow envelope keeps only accepted service-report projection fields.
- Service-report `publicAttachments` items keep only `attachmentId`, `label`, and `mimeType`.
- Missing, malformed, or alias-only identifiers return HTTP 404 sanitized unavailable.
- Query/body/header/cookie aliases cannot supply or override route params.
- Unsupported methods and near-match paths do not dispatch Customer Access handlers.
- Audit writer results do not appear in customer response bodies or synthetic headers.

## Boundaries Preserved

- No `src/app.js` changes.
- No `src/server.js` changes.
- No `public.routes.js` changes.
- No source/runtime changes.
- No server/listener startup.
- No smoke or endpoint probes.
- No DB execution or DB connection creation.
- No migration apply or dry-run.
- No `psql`, `DATABASE_URL`, env, Zeabur, or secrets inspection.
- No new Customer Access routes.
- No internal test route public exposure.
- No customer-facing DTO contract changes.
- No audit event builder, normalizer, adapter, migration, or persistence changes.
- No repository implementation changes.
- No provider/admin/AI/RAG/model/billing/payment/package work.
