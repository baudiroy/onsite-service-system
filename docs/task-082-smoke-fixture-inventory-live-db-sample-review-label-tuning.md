# Task 082 - Smoke Fixture Inventory Live DB Sample Review / Label Tuning

## 功能範圍

本任務目標是使用 Task 080 inventory-only script 在可連線 DB 上產生 live sample output，review sample labels、risk levels、skipped table behavior、query failure behavior 是否足夠人工清查。

本任務不做：

- cleanup
- DB delete / update
- API delete / disable / unlink
- migration
- backend schema / API / auth / RBAC change
- smoke validation logic change
- AI 自動判斷

本次未修改 inventory script，因為目前環境無法連線到 DB，沒有 live entity rows 可用來可靠判斷 label tuning。

## 使用環境

Current `.env` contains a `DATABASE_URL`, and it was classified as a local DB target without printing the URL.

Redacted environment observation:

```json
{
  "hasDatabaseUrl": true,
  "hostClass": "local",
  "portProvided": true,
  "databaseNameProvided": true,
  "databaseUrlRedacted": true
}
```

The configured DB endpoint is not reachable from this environment. Inventory commands reached the read-only DB inventory path and failed with `ECONNREFUSED`.

No `DATABASE_URL` value was printed.

## Executed Sample Commands

Guard tests:

```bash
npm run smoke:cleanup:inventory
DRY_RUN=1 npm run smoke:cleanup:inventory
```

Task-code inventory samples:

```bash
DRY_RUN=1 SMOKE_TASK_CODE=Task071 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task061 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task046 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task047 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task027E npm run smoke:cleanup:inventory
```

Known smokeRunId sample:

```bash
DRY_RUN=1 SMOKE_RUN_ID=manual-test-082 npm run smoke:cleanup:inventory
```

Date range sample:

```bash
DRY_RUN=1 CREATED_FROM=2026-05-17T00:00:00Z CREATED_TO=2026-05-18T00:00:00Z npm run smoke:cleanup:inventory
```

## Live Sample Output Review Summary

All valid-filter commands produced the expected inventory envelope before failing at DB connection:

```json
{
  "mode": "inventory-only",
  "dryRun": true,
  "destructiveCleanupImplemented": false,
  "cleanupSupported": false,
  "environment": {
    "nodeEnv": "development",
    "hasDatabaseUrl": true,
    "databaseUrlRedacted": true
  },
  "warning": [
    "This script is inventory-only. It does not delete, update, unlink, disable, or cleanup any records.",
    "Destructive cleanup is not implemented and must not be run against shared Zeabur runtime."
  ],
  "error": {
    "message": "Database inventory failed. No cleanup was performed.",
    "code": "ECONNREFUSED",
    "detail": null
  }
}
```

This confirms:

- Valid filters are accepted.
- The selected filters are reflected in output.
- Output is explicitly inventory-only.
- `destructiveCleanupImplemented` remains `false`.
- `cleanupSupported` remains `false`.
- DB URL is redacted.
- Error output says no cleanup was performed.

Because the DB was unreachable, this task could not review live entity counts, sample IDs, sample labels, created-at ranges, skipped table behavior, or table-level `query_failed` behavior from actual rows.

## Task-code Inventory Result Summary

The following task-code commands reached the same read-only DB connection failure:

| Filter | Result |
| --- | --- |
| `SMOKE_TASK_CODE=Task071` | DB connection failed with `ECONNREFUSED`; no entity summary available |
| `SMOKE_TASK_CODE=Task061` | DB connection failed with `ECONNREFUSED`; no entity summary available |
| `SMOKE_TASK_CODE=Task028` | DB connection failed with `ECONNREFUSED`; no entity summary available |
| `SMOKE_TASK_CODE=Task046` | DB connection failed with `ECONNREFUSED`; no entity summary available |
| `SMOKE_TASK_CODE=Task047` | DB connection failed with `ECONNREFUSED`; no entity summary available |
| `SMOKE_TASK_CODE=Task027E` | DB connection failed with `ECONNREFUSED`; no entity summary available |

## Known SmokeRunId Inventory Result Summary

Command:

```bash
DRY_RUN=1 SMOKE_RUN_ID=manual-test-082 npm run smoke:cleanup:inventory
```

Result:

- Accepted filter.
- Entered read-only inventory path.
- Failed with `ECONNREFUSED`.
- No entity summary available.

I did not run `smoke:028` just to create a `manual-test-082` fixture because the inventory DB target is currently unreachable. Creating remote/API fixture data would leave more smoke data behind while still not enabling local DB inventory review.

## Sample Label Quality Review

No live sample labels were available due to DB connectivity failure.

Based on code review, current safe label columns are reasonable for first live review:

- organizations: organization code / name
- dispatch units: code / name
- customers: customer name
- cases: case number / model number / problem description
- dispatch assignments: assignment note / dispatch status
- appointments: note / reschedule reason / incomplete reason / visit result / appointment status
- field service reports: diagnosis / repair action / repair result / service status
- case messages: sender display name / body text / message type
- audit logs: actor display name / action / entity type
- LINE channels: channel code / name / channel ID
- customer LINE identities: display name only
- roles: role key / name / description
- role permissions: role id / permission id
- users: email / display name / user type / status
- user roles: user id / role id
- user organizations: role note / user id / organization id

No label tuning was applied in this task because live output was not available.

## Skipped Table / Query Failed Behavior

Could not observe table-level skipped behavior because the DB connection failed before the script could inspect tables.

Expected behavior remains:

- missing table -> `table_not_found`
- no supported filter columns -> `no_supported_filter_columns`
- created-at filter without `created_at` -> `created_at_column_not_found`
- table query failure -> `query_failed` with redacted detail

The observed top-level DB failure was redacted and did not leak sensitive data.

## Redaction / Safety Confirmation

Confirmed from command output:

- `DATABASE_URL` was not printed.
- Passwords were not printed.
- Tokens / secrets were not printed.
- Customer mobile was not printed.
- Raw LINE user id was not printed.
- Full payload was not printed.
- Output clearly said no cleanup was performed.

The script remains inventory-only.

## Guard Test Results

Missing `DRY_RUN=1`:

```text
This inventory script is read-only and requires DRY_RUN=1. No cleanup is implemented.
```

Missing filters:

```text
Refusing to run inventory without SMOKE_RUN_ID, SMOKE_TASK_CODE, SMOKE_PREFIX, or CREATED_FROM/CREATED_TO.
```

Both guards behaved as expected.

## Verification

Executed:

```bash
npm run check
```

Result:

- PASS

## Why Cleanup Still Is Not Implemented

Cleanup is intentionally out of scope.

The inventory graph spans:

- cases / customers / appointments / reports
- LINE channels / LINE identities
- timeline / audit data
- users / roles / permissions

Shared Zeabur runtime must never run destructive cleanup. Local / CI cleanup requires a separate explicit task, isolated DB, dry-run review, dependency order, and stronger environment guards.

## Known Limitations

- The configured local DB endpoint was not reachable, so live entity counts and sample labels were not reviewed.
- No safe label column tuning was performed.
- No skipped table behavior was observed against a live DB.
- No cleanup exists.
- Historical fixture rows without markers may still require task prefix or created-at range inventory.

## Next Task Suggestion

Recommended next task:

**Task 083 - Smoke Fixture Inventory Local DB Connectivity / Seeded Sample Review**

Suggested scope:

- Start or connect to a dedicated local/test PostgreSQL database.
- Run migrations and seed only in that isolated DB.
- Run one marker-enabled smoke with a known `SMOKE_RUN_ID`.
- Run inventory against that same DB.
- Review live entity counts, sample labels, skipped tables, and risk levels.
- Tune only safe label columns if live output shows ambiguity.
- Keep cleanup unsupported.
