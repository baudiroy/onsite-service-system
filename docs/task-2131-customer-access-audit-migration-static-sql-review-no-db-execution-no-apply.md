# Task2131 - Customer Access Audit Migration Static SQL Review

## Status

- Added a static SQL text review for the Task2130 Customer Access audit migration.
- The migration SQL file was not modified.
- This task did not execute SQL.
- This task did not apply or dry-run migrations.
- This task did not run `psql`.
- This task did not inspect `DATABASE_URL`, env, Zeabur, staging, production, or any DB connection.
- This task did not change source/runtime code, package files, repository/query code, audit persistence code, DB writer code, route/controller/global mount code, production mount code, app/server/public routes, provider/admin/AI/billing code, seed data, backfills, triggers, functions, or policies.
- The 7 held historical docs remain untracked and untouched.

## Baseline

- Branch: `main`.
- Starting HEAD/origin baseline: `0d55f825cd00eef74327080490e2abb2183e615c`.
- `git status --short --branch` before work showed local `main...origin/main` and only the 7 held historical docs untracked.

## Files Changed

- `tests/customerAccess/customerAccessAuditMigration.static.test.js`
- `docs/task-2131-customer-access-audit-migration-static-sql-review-no-db-execution-no-apply.md`

## Static SQL Assertions Added

The new static test reads `migrations/027_create_customer_access_audit_events.sql` as text only and asserts:

- The migration file exists.
- The file creates only `customer_access_audit_events`.
- Required columns from Task2130 are present.
- Core type/default conventions are present for `id`, `metadata_json`, and `created_at`.
- The six Customer Access audit event types are present.
- `decision` allows `allow`, `deny`, `success`, and `failure`.
- `method` is constrained to `GET`.
- `reason_code` allows null.
- `metadata_json` is checked as a JSON object.
- Required indexes are present:
  - `idx_customer_access_audit_events_org_created`
  - `idx_customer_access_audit_events_org_case_created`
  - `idx_customer_access_audit_events_org_report_created`
  - `idx_customer_access_audit_events_event_created`
  - `idx_customer_access_audit_events_org_request`
  - `idx_customer_access_audit_events_created`
- Raw/sensitive column names are absent from executable SQL text.
- Executable data operations, trigger/function/policy creation, table drops, and env-style references are absent from executable SQL text.

The test strips SQL line comments before forbidden-operation checks so the authoring-only safety header can remain explicit without failing on documentation text.

## Verification

Planned static verification only:

```sh
node --test tests/customerAccess/customerAccessAuditMigration.static.test.js
git diff --check
git status --short --branch
```

Results:

- `node --test tests/customerAccess/customerAccessAuditMigration.static.test.js`: PASS, 5/5 tests.
- `git diff --check`: PASS.
- `git status --short --branch`: branch `main...origin/main` with only this Task2131 doc, the Task2131 static test, and the 7 held historical docs untracked before commit.

No DB command, migration command, smoke/endpoint probe, server/listener command, env/secret inspection, or network command is required for this task.
