# Task2130 - Customer Access Audit Migration File Static Creation

## Status

- Created the static Customer Access audit migration file only.
- This task did not execute SQL.
- This task did not apply or dry-run migrations.
- This task did not inspect `DATABASE_URL`, Zeabur, env, staging, production, or any DB connection.
- This task did not change runtime/source code, route/controller/global mount code, repository/query code, tests, package files, provider/admin/AI/billing/settlement/payment/invoice code, seed data, backfills, triggers, functions, or policies.
- The 7 held historical docs remain untracked and untouched.

## Baseline

- Branch: `main`.
- Starting HEAD/origin baseline: `f2f9cbbd6138aba8ff724b61330f5b00861d74e2`.
- `git status --short --branch` before work showed local `main...origin/main`, the 7 held historical docs, and the Task2130 migration file as an untracked static artifact.
- Migration numbering inspection showed the existing sequence through `026_create_repair_intake_persistence_tables.sql`; Task2130 uses `027_create_customer_access_audit_events.sql`.

## Files Changed

- `migrations/027_create_customer_access_audit_events.sql`
- `docs/task-2130-customer-access-audit-migration-file-static-creation-no-db-execution-no-apply.md`

## Migration Convention Inspection

Read-only inspection used existing files:

- `migrations/024_create_brand_referral_contact_events.sql`
- `migrations/025_create_data_correction_decision_audit_events.sql`
- `migrations/026_create_repair_intake_persistence_tables.sql`
- `migrations/README.md`

Observed conventions applied here:

- One-way numbered PostgreSQL SQL file.
- Authoring-only header that states the migration is not applied and requires a separate apply/dry-run task.
- `CREATE TABLE IF NOT EXISTS`.
- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- `text` for event/action/status-like values.
- `timestamptz NOT NULL DEFAULT now()` for creation time.
- `jsonb NOT NULL DEFAULT '{}'::jsonb` for structured metadata.
- `CHECK` constraints for allowed values and nonblank safety where appropriate.
- `CREATE INDEX IF NOT EXISTS idx_...` index style.
- Organization-scoped request index style where request lookup is indexed.

## Static DDL Summary

Created table:

- `customer_access_audit_events`

Columns:

- `id`
- `event_type`
- `occurred_at`
- `request_id`
- `actor_type`
- `organization_id`
- `customer_id`
- `case_id`
- `report_id`
- `decision`
- `reason_code`
- `route`
- `method`
- `source`
- `metadata_json`
- `created_at`

Constraints:

- `event_type` is limited to the six currently supported Customer Access audit event types.
- `decision` is limited to `allow`, `deny`, `success`, or `failure`.
- `reason_code` is nullable and limited to known safe Customer Access reason codes.
- `method` is limited to `GET`.
- `route` and `source` must be nonblank.
- `metadata_json` must be a JSON object.

Indexes:

- `idx_customer_access_audit_events_org_created`
- `idx_customer_access_audit_events_org_case_created`
- `idx_customer_access_audit_events_org_report_created`
- `idx_customer_access_audit_events_event_created`
- `idx_customer_access_audit_events_org_request`
- `idx_customer_access_audit_events_created`

## Safety Boundaries

- No raw request headers, tokens, request bodies, query payloads, raw customer identity fields, provider-specific payloads, AI fields, private fields, or debug blobs were added.
- No existing table was altered.
- No seed data, data backfill, trigger, function, or policy was added.
- No DB repository implementation or runtime audit persistence integration was added.
- The table remains inert until a future explicitly authorized runtime integration and DB apply task.

## Verification

Static verification only:

```sh
git diff --check
git diff --check -- migrations/027_create_customer_access_audit_events.sql docs/task-2130-customer-access-audit-migration-file-static-creation-no-db-execution-no-apply.md
git status --short --branch
```

Results:

- `git diff --check`: PASS.
- `git diff --check -- migrations/027_create_customer_access_audit_events.sql docs/task-2130-customer-access-audit-migration-file-static-creation-no-db-execution-no-apply.md`: PASS.
- `git status --short --branch`: branch `main...origin/main` with only the Task2130 migration file, this Task2130 doc, and the 7 held historical docs untracked before commit.

No tests were required or run because this task created a static migration artifact and documentation only, with no source/runtime/test changes.
