# Task 081 - Smoke Fixture Inventory Runbook / Sample Output Review

## 功能範圍

本任務只做 smoke fixture inventory script 的 runbook 與 sample output review。

本任務不做：

- cleanup
- DB delete / update
- API delete / disable / unlink
- migration
- backend schema / API / auth / RBAC change
- smoke validation logic change
- AI 自動判斷

Task 080 inventory script 維持 inventory-only / dry-run-only。

## Script / NPM Command

Script:

- `scripts/smoke/cleanup/inventory_smoke_fixtures.js`

NPM command:

```bash
npm run smoke:cleanup:inventory
```

The script is read-only and requires explicit dry-run mode.

## Env Requirements

Required:

- `DRY_RUN=1`
- `DATABASE_URL`

At least one filter is required:

- `SMOKE_RUN_ID`
- `SMOKE_TASK_CODE`
- `SMOKE_PREFIX`
- `CREATED_FROM`
- `CREATED_TO`

The script refuses to run without `DRY_RUN=1`:

```text
This inventory script is read-only and requires DRY_RUN=1. No cleanup is implemented.
```

The script refuses to run without a marker or time filter:

```text
Refusing to run inventory without SMOKE_RUN_ID, SMOKE_TASK_CODE, SMOKE_PREFIX, or CREATED_FROM/CREATED_TO.
```

`DATABASE_URL` must be present for DB inventory, but it must never be printed.

## Sample Commands

### By Smoke Run ID

```bash
DRY_RUN=1 SMOKE_RUN_ID=manual-test-074 npm run smoke:cleanup:inventory
```

### By Task Code

```bash
DRY_RUN=1 SMOKE_TASK_CODE=Task071 npm run smoke:cleanup:inventory
```

### By Smoke Prefix

```bash
DRY_RUN=1 SMOKE_PREFIX="Task071 browser-smoke" npm run smoke:cleanup:inventory
```

### By Created-at Range

```bash
DRY_RUN=1 CREATED_FROM=2026-05-17T00:00:00Z CREATED_TO=2026-05-18T00:00:00Z npm run smoke:cleanup:inventory
```

## Sample Output Review

The current local environment has a `DATABASE_URL` configured, but the DB endpoint is not reachable from this run. The sample commands reached the read-only inventory DB connection step and returned:

```json
{
  "mode": "inventory-only",
  "dryRun": true,
  "destructiveCleanupImplemented": false,
  "cleanupSupported": false,
  "environment": {
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

- The script accepts valid filter combinations.
- The script prints the selected filters.
- The script marks the run as `inventory-only`.
- `destructiveCleanupImplemented` remains `false`.
- `cleanupSupported` remains `false`.
- `DATABASE_URL` is not printed.
- The connection failure is redacted and explicitly says no cleanup was performed.

Because the DB was unreachable, this task could not review real entity counts, sample IDs, sample labels, or created-at ranges from live data.

## Expected Successful Output Quality

When DB connectivity is available, each entity summary should show:

- `entityType`
- `table`
- `riskLevel`
- `count`
- `sampleIds`, up to 5
- `sampleLabels`
- `createdAtMin`
- `createdAtMax`
- `dependencyWarning`
- `cleanupSupported: false`
- `skipped`
- `skipReason`, when skipped

Output should be enough for manual inspection because labels are built from safe fields:

- organization code / name
- dispatch unit code / name
- customer name
- case number / model number / problem description
- assignment note
- appointment note / result fields
- field service report text fields
- LINE channel code / name / channel ID
- LINE identity display name
- role key / name / description
- user email / display name
- membership note

## Skipped Table / Query Failed Behavior

Expected skipped behavior:

- Missing table -> `skipped: true`, `skipReason: "table_not_found"`
- Missing safe filter columns -> `skipped: true`, `skipReason: "no_supported_filter_columns"`
- Created-at filter on a table without `created_at` -> `skipped: true`, `skipReason: "created_at_column_not_found"`
- Query failure -> `skipped: true`, `skipReason: "query_failed"` with redacted error detail

The current DB connection failure occurs before table-by-table inventory, so it returns a top-level DB inventory failure instead of entity-level skipped summaries.

## Redaction / Safety Confirmation

Reviewed safety behavior:

- `DATABASE_URL` is not printed.
- Customer mobile / phone / tel columns are excluded.
- Raw LINE user id columns are excluded.
- Password / password hash fields are excluded.
- Token / secret / channel secret / channel access token fields are excluded.
- Raw payload / full payload fields are excluded.
- Error output is redacted.
- The script does not use customer mobile or raw LINE user id as a filter.

The fixed warning remains present in every valid-filter output:

```text
This script is inventory-only. It does not delete, update, unlink, disable, or cleanup any records.
Destructive cleanup is not implemented and must not be run against shared Zeabur runtime.
```

## Shared Zeabur Runtime Warning

Shared Zeabur runtime may be used only for conservative read-only inventory.

Shared Zeabur runtime must not be used for:

- destructive cleanup
- automatic cleanup
- DB delete / update
- API delete / disable / unlink cleanup

This script does not implement those actions.

## Why Cleanup Still Is Not Implemented

Smoke fixture data spans several graphs:

- cases / appointments / field service reports
- LINE channels / customer LINE identities
- audit logs / timeline messages
- roles / users / permissions

The RBAC graph is especially high risk. A safe cleanup flow needs separate isolated DB rules, dry-run review, dependency ordering, and explicit environment guards. That is intentionally outside this task.

## Verification Results

Commands executed:

```bash
npm run check
npm run smoke:cleanup:inventory
DRY_RUN=1 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_RUN_ID=manual-test-074 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task071 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_PREFIX="Task071 browser-smoke" npm run smoke:cleanup:inventory
DRY_RUN=1 CREATED_FROM=2026-05-17T00:00:00Z CREATED_TO=2026-05-18T00:00:00Z npm run smoke:cleanup:inventory
```

Results:

- `npm run check`: PASS
- Missing `DRY_RUN=1`: rejected as expected
- Missing filters: rejected as expected
- Valid filters: reached read-only DB inventory path, then failed with `ECONNREFUSED` because the configured DB endpoint was not reachable from this environment
- No cleanup was performed
- No sensitive DB URL or credentials were printed

## Known Limitations

- Live entity count / sample label review could not be completed because DB connectivity failed with `ECONNREFUSED`.
- No cleanup mode exists.
- No API soft cleanup exists.
- Historical fixtures without smoke markers may only be discoverable through task prefix or date range.
- `role_permissions`, `user_roles`, and `user_organizations` matching depends on related roles / users / organizations.

## Next Task Suggestion

Recommended next step:

**Task 082 - Smoke Fixture Inventory Live DB Sample Review / Label Tuning**

Suggested scope:

- Run the inventory script against a reachable local / test DB.
- Capture sample entity summaries for `SMOKE_TASK_CODE=Task071`, `Task061`, `Task046`, `Task047`, and `Task027E`.
- Review whether sample labels are clear enough for manual cleanup planning.
- Tune only safe label columns if needed.
- Keep cleanup unsupported.
