# Task2139 - Customer Access Audit Persistence Composition-Only Regression Tests

## Status

- Added composition-only regression coverage for injecting the persistence writer through existing `auditWriter` boundaries with synthetic repositories.
- This task is tests plus documentation only.
- No source/runtime code changes were needed.
- This task did not execute DB commands, SQL, migration apply, or migration dry-run.
- This task did not use `psql`, `DATABASE_URL`, env, Zeabur, staging, production, or any DB connection.
- This task did not implement a real repository or DB adapter.
- This task did not integrate runtime persistence into app/server/routes.
- This task did not change production mount, app/server/public routes, provider/admin/AI/billing code, package files, migration files, seed data, backfills, triggers, functions, or policies.
- The 7 held historical docs remain untracked and untouched.

## Files Changed

- `tests/customerAccess/customerAccessController.unit.test.js`
- `tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js`
- `tests/customerAccess/customerAccessRoutes.unit.test.js`
- `tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `docs/task-2139-customer-access-audit-persistence-composition-only-regression-tests-no-runtime-source-change-no-db.md`

## Coverage Added

Case overview composition:

- Injects `createCustomerAccessAuditPersistenceWriter({ auditRepository })` as existing `auditWriter`.
- Confirms customer response remains unchanged.
- Confirms synthetic repository receives exactly one sanitized record.
- Confirms audit result is not added to response.
- Confirms repository throw/reject/malformed result remains customer-invisible.

Service-report projection composition:

- Injects persistence writer as existing `auditWriter`.
- Confirms allow response remains unchanged.
- Confirms synthetic repository receives exactly one sanitized record.
- Confirms audit result is not added to response body or headers.
- Confirms repository throw/reject/malformed result remains customer-invisible.

Route-registration composition:

- Injects persistence writer into `registerCustomerAccessRoutes` as existing `auditWriter`.
- Confirms registration summary remains unchanged.
- Confirms synthetic repository receives one sanitized record per accepted public route.
- Confirms audit result is not added to registration summary.
- Confirms repository throw/reject/malformed result remains summary-invisible.

Static/no-runtime integration guard:

- Confirms the persistence writer adapter is not wired into routes/controllers/projection/app/server/public routes in this branch.
- Confirms runtime files do not import the persistence writer adapter or repository contract.
- Confirms no direct `recordCustomerAccessAuditEvent` runtime call exists.

## Sanitization And Non-Leakage

The tests assert repository records are limited to accepted repository record keys and do not include raw request/response, headers, raw headers, authorization, cookies, tokens, body/query/params objects, raw customer access context, raw facade/projection/DB data, raw app/router/mount target details, DB rows/query metadata/query text/values, provider payload, AI data, debug/stack/SQL, internal/private/admin-only fields, billing fields, or audit persistence results.

## Verification

Planned verification:

```sh
node --test tests/customerAccess/customerAccessController.unit.test.js tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js tests/customerAccess/customerAccessRoutes.unit.test.js tests/customerAccess/customerAccessAuditPersistenceWriterAdapter.unit.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js
node --test tests/customerAccess/customerAccessAuditRepositoryContract.unit.test.js tests/customerAccess/customerAccessAuditWriterResultNormalizer.unit.test.js tests/customerAccess/customerAccessAuditEventBuilder.unit.test.js tests/customerAccess/customerAccessAuditWriterAdapter.unit.test.js
git diff --check
git status --short --branch
```

Results:

- `node --test tests/customerAccess/customerAccessController.unit.test.js tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js tests/customerAccess/customerAccessRoutes.unit.test.js tests/customerAccess/customerAccessAuditPersistenceWriterAdapter.unit.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`: PASS, 131/131 tests.
- `node --test tests/customerAccess/customerAccessAuditRepositoryContract.unit.test.js tests/customerAccess/customerAccessAuditWriterResultNormalizer.unit.test.js tests/customerAccess/customerAccessAuditEventBuilder.unit.test.js tests/customerAccess/customerAccessAuditWriterAdapter.unit.test.js`: PASS, 39/39 tests.
- `git diff --check`: PASS.
- `git status --short --branch`: branch `main...origin/main` with only Task2139 files and the 7 held historical docs untracked before commit.
