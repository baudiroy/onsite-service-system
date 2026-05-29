# Task2132 - Customer Access Audit Migration Disposable DB Dry-Run Authorization Packet

## Status

- Task2132 is an authorization packet only.
- This task does not execute DB commands.
- This task does not authorize migration apply.
- This task does not authorize dry-run execution.
- This task does not authorize `psql`.
- This task does not authorize `DATABASE_URL` use.
- This task does not authorize Zeabur/env inspection.
- This task does not authorize staging or production DB access.
- This task does not change source/runtime code, tests, package files, repository/query code, audit persistence code, DB writer code, route/controller/global mount code, production mount code, app/server/public routes, provider/admin/AI/billing code, seed data, backfills, triggers, functions, or policies.
- The 7 held historical docs remain untracked and untouched.

## Accepted Artifacts

Current accepted migration artifact:

- `migrations/027_create_customer_access_audit_events.sql`

Current accepted static SQL review:

- `tests/customerAccess/customerAccessAuditMigration.static.test.js`

Task2131 static SQL review result:

- Migration file exists.
- File creates `customer_access_audit_events`.
- Required columns are present.
- Six Customer Access audit event types are present.
- `decision` allowlist is present.
- `method` is constrained to `GET`.
- `reason_code` is nullable.
- `metadata_json` object check is present.
- Required indexes are present.
- Raw/sensitive column names are absent from executable SQL text.
- Forbidden executable operations are absent from executable SQL text.

## Future Dry-Run Target Restrictions

Any future dry-run, if later explicitly authorized, must be limited to:

- Disposable local/test DB only.
- Migration `027_create_customer_access_audit_events.sql` only.
- No shared runtime DB.
- No staging DB.
- No production DB.
- No Zeabur DB.
- No user/customer data.
- No provider/network side effects.
- No persistent secrets printed.
- No real service traffic.
- No runtime integration.

## Future Explicit Authorization Phrase

A future PM must explicitly authorize the dry-run with wording equivalent to:

```text
Authorize Task2133 disposable local/test DB dry-run for migration 027 only.
```

Generic phrases are not sufficient, including:

- "run it"
- "test it"
- "try migration"
- "check DB"
- "go ahead"

The future authorization must name all of:

- migration `027`
- disposable local/test DB
- no staging/production/Zeabur
- no secrets printing

If any required item is missing, stop and ask PM before any DB-related command.

## Future Command Envelope Examples Only

The following are non-executable examples only. Do not run them in Task2132.

```sh
# Example only; do not run in Task2132.
# Create or select a disposable local/test DB with no user/customer data.
<local-test-db-create-command> task2133_customer_access_audit_disposable

# Example only; do not run in Task2132.
# Apply or dry-run migration 027 only against the disposable local/test DB.
<local-test-db-migration-command> --db task2133_customer_access_audit_disposable --file migrations/027_create_customer_access_audit_events.sql

# Example only; do not run in Task2132.
# Drop the disposable local/test DB after collecting sanitized PASS/FAIL output.
<local-test-db-drop-command> task2133_customer_access_audit_disposable
```

These examples intentionally do not include a real connection string, secrets, staging/production identifiers, Zeabur identifiers, provider endpoints, or customer/user data.

## Future Stop Conditions

Stop before any dry-run if:

- No disposable DB is explicitly identified.
- The target DB points to Zeabur, staging, production, or a shared runtime DB.
- Env inspection is needed.
- A secret would be printed.
- The migration runner would apply more than migration `027`.
- The migration requires modifying existing tables unexpectedly.
- The migration fails static review before dry-run.
- Any network/provider command would run.
- Any user/customer data would be used.
- Any real service traffic would be generated.

## Future Dry-Run Completion Report Requirements

Any future dry-run completion report must include:

- Disposable DB identifier, sanitized.
- Exact command shape without secrets.
- Migration target.
- PASS/FAIL result.
- Confirmation no staging/production/Zeabur DB was used.
- Confirmation no secrets were printed.
- Confirmation no provider/network side effects occurred.
- Confirmation no runtime integration was added.
- Any SQL error summarized without credentials or raw sensitive data.

## Explicit Non-Goals

- No DB command.
- No migration apply.
- No dry-run execution.
- No `psql`.
- No `DATABASE_URL`.
- No env/Zeabur inspection.
- No source/runtime/test/package changes except this doc.
- No repository implementation.
- No audit persistence writer implementation.
- No runtime persistence integration.
- No route/controller/global mount changes.
- No production mount.
- No smoke/server/listener/network/provider/admin/AI/billing work.
- No seed data.
- No data backfill.
- No triggers/functions/policies.

## Verification

Static docs-only verification:

```sh
git diff --check -- docs/task-2132-customer-access-audit-migration-disposable-db-dry-run-authorization-packet-no-db-execution.md
git status --short --branch
```

Results:

- `git diff --check -- docs/task-2132-customer-access-audit-migration-disposable-db-dry-run-authorization-packet-no-db-execution.md`: PASS.
- `git status --short --branch`: branch `main...origin/main` with only this Task2132 doc and the 7 held historical docs untracked before commit.

Node tests were not required or run because Task2132 is docs-only and no source or test files were changed.
