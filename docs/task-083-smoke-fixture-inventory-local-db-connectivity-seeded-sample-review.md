# Task 083 - Smoke Fixture Inventory Local DB Connectivity / Seeded Sample Review

## 功能範圍

本任務在 dedicated local/test PostgreSQL 環境中驗證 Task 080 inventory-only script 可以查到 live smoke fixture rows，並 review entity counts、sample labels、risk levels、skipped table behavior。

本任務不做：

- cleanup
- DB delete / update
- API delete / disable / unlink
- migration 檔案變更
- backend schema / API / auth / RBAC behavior 變更
- smoke 驗證邏輯變更
- AI 自動判斷

## Local / Test DB 使用方式

本機原本 `.env` 指向 local PostgreSQL `5432`，但 PostgreSQL server 未安裝 / 未啟動。

本任務使用 Homebrew 安裝並啟動 local PostgreSQL 16，建立 `.env` 指向的 local/test database 與 role。過程中沒有輸出 `DATABASE_URL` 或 DB password。

Redacted DB environment:

```json
{
  "hasDatabaseUrl": true,
  "hostClass": "local",
  "port": "5432",
  "databaseNameProvided": true,
  "userProvided": true,
  "databaseUrlRedacted": true
}
```

This is local/test DB usage only. Shared Zeabur runtime was not used for migration, seed, cleanup, or destructive operations.

## Migration / Seed Results

Commands:

```bash
npm run db:migrate
npm run db:seed
```

Results:

- Migration: PASS
- Seed: PASS

Migrations applied through `019_add_final_appointment_id_to_field_service_reports.sql`.

Seed completed and created / updated the seeded admin user and permissions. The seed output printed the admin email but did not print passwords or tokens.

## Smoke Fixture

Fixture smoke:

```bash
SMOKE_RUN_ID=manual-test-083 API_BASE_URL=http://127.0.0.1:3000 npm run smoke:028
```

Local API server:

```bash
PORT=3000 npm run dev
```

Result:

- `smoke:028`: PASS, 13 / 13
- `SMOKE_RUN_ID`: `manual-test-083`

The smoke created marker-enabled local/test fixture rows for:

- organization
- dispatch unit
- customers
- cases
- dispatch assignments
- appointments
- field service report

The local API server was stopped after the smoke run.

The local PostgreSQL service was also stopped after the review to avoid leaving an unnecessary background service running. The local/test database files and smoke fixture rows were not deleted.

## Inventory Commands

Known smokeRunId:

```bash
DRY_RUN=1 SMOKE_RUN_ID=manual-test-083 npm run smoke:cleanup:inventory
```

Task code filters:

```bash
DRY_RUN=1 SMOKE_TASK_CODE=Task071 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task061 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task046 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task047 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task027E npm run smoke:cleanup:inventory
```

Guard tests:

```bash
npm run smoke:cleanup:inventory
DRY_RUN=1 npm run smoke:cleanup:inventory
```

## Live Output Review Summary

Known `SMOKE_RUN_ID=manual-test-083` inventory succeeded.

Fixed safety flags remained:

```json
{
  "mode": "inventory-only",
  "dryRun": true,
  "destructiveCleanupImplemented": false,
  "cleanupSupported": false
}
```

The output did not print:

- `DATABASE_URL`
- customer mobile
- raw LINE user id
- password / password hash
- token / secret
- full payload

## Entity Counts Summary

Inventory for `SMOKE_RUN_ID=manual-test-083`:

| Entity | Count |
| --- | ---: |
| organizations | 1 |
| dispatch_units | 1 |
| customers | 2 |
| cases | 2 |
| dispatch_assignments | 2 |
| appointments | 3 |
| field_service_reports | 1 |
| case_messages | 0 |
| audit_logs | 0 |
| line_channels | 0 |
| customer_line_identities | 0 |
| roles | 0 |
| role_permissions | 0 |
| users | 0 |
| user_roles | 0 |
| user_organizations | 0 |

Task-code inventory results:

| Task Code | Result |
| --- | --- |
| Task071 | PASS, no matching rows in this local DB |
| Task061 | PASS, no matching rows in this local DB |
| Task028 | PASS, matching rows found |
| Task046 | PASS, no matching rows in this local DB |
| Task047 | PASS, no matching rows in this local DB |
| Task027E | PASS, no matching rows in this local DB |

`Task028` non-zero entities matched the known `manual-test-083` fixture graph.

## Sample Label Quality Review

The live sample labels were sufficient to identify task / smokeRunId / fixture type.

Examples:

- Organization:
  - `task028-smoke-org-manual-test-083 | Task028 Multi Dispatch Guard Organization manual-test-083`
- Dispatch unit:
  - `task028-smoke-du-manual-test-083 | Task028 Dispatch Unit manual-test-083`
- Customers:
  - `Task028 Cross Case Customer manual-test-083`
  - `Task028 Multi Dispatch Customer manual-test-083`
- Cases:
  - `TW-... | T028-manual-test-083-cross | Task028 smoke manual-test-083 multi dispatch guard cross`
  - `TW-... | T028-manual-test-083-primary | Task028 smoke manual-test-083 multi dispatch guard primary`
- Field service report:
  - `Task028 smoke manual-test-083 diagnosis | Task028 smoke manual-test-083 repair action | Task028 smoke manual-test-083 repair result | completed`

### Label Tuning Applied

Appointment labels were improved because multiple cases can have `appointment 1`, and the original label was less clear when reviewing multi-case smoke output.

Changed safe label columns for `appointments`:

```js
labelColumns: [
  'note',
  'visit_sequence',
  'reschedule_reason',
  'incomplete_reason',
  'next_action',
  'visit_result',
  'appointment_status'
]
```

This is safe because it uses existing non-sensitive appointment fields only.

Improved appointment sample labels:

- `Task028 smoke manual-test-083 appointment 1 | 1 | no_action | completed | completed`
- `Task028 smoke manual-test-083 appointment 2 | 2 | close_case | completed | completed`
- `Task028 smoke manual-test-083 appointment 1 | 1 | Task028 smoke manual-test-083 pending parts | wait_for_parts | pending_parts | scheduled`

No unsafe fields were added.

## Skipped Table / Query Failed Behavior

In this local migrated DB, all configured inventory tables existed and no entity summary was skipped for the tested filters.

Observed:

- `skipped: false` for all configured entity summaries
- no table-level `query_failed`
- no top-level DB failure after local DB was started

Expected behavior still remains:

- missing table -> `table_not_found`
- no supported filter columns -> `no_supported_filter_columns`
- created-at filter without `created_at` -> `created_at_column_not_found`
- table query failure -> `query_failed` with redacted detail

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

## Redaction / Safety Confirmation

Confirmed:

- No `DATABASE_URL` in output.
- No customer mobile in inventory output.
- No raw LINE user id in inventory output.
- No password / password hash in inventory output.
- No token / secret in inventory output.
- No full payload in inventory output.
- `cleanupSupported` stayed `false`.
- `destructiveCleanupImplemented` stayed `false`.

The local API request logs printed request ids, paths, statuses, and actor ids only. They did not print request bodies, tokens, passwords, customer mobile values, or raw LINE user ids.

## Verification

Executed:

```bash
npm run check
```

Result:

- PASS

## Why Cleanup Still Is Not Implemented

This task proves inventory visibility only. It does not make cleanup safe.

Cleanup remains out of scope because fixture graphs can include:

- cases / customers / appointments / reports
- LINE channels / LINE identities
- audit and timeline records
- users / roles / permissions

Shared Zeabur runtime must not run destructive cleanup. Future cleanup design must be a separate task, isolated to local / CI DBs, with dry-run, dependency order, and explicit environment guards.

## Known Limitations

- Only `smoke:028` was used to create a seeded fixture.
- LINE smoke graphs and RBAC smoke graphs were not populated in this local DB during this task.
- `case_messages` and `audit_logs` counted 0 for the marker because the current marker matching does not search structured metadata / details payloads, by design, to avoid unsafe payload output.
- Local PostgreSQL was installed and started for this task.
- Local PostgreSQL was stopped after the review; start `postgresql@16` again before re-running local DB inventory.
- No cleanup was performed, so local/test smoke fixture rows remain in the local DB.

## Next Task Suggestion

Recommended next task:

**Task 084 - Smoke Fixture Inventory Additional Graph Sample Review**

Suggested scope:

- In the same local/test DB, run marker-enabled `smoke:046`, `smoke:047`, and optionally `smoke:027e`.
- Inventory each known `SMOKE_RUN_ID`.
- Review LINE and RBAC entity labels.
- Tune only safe label columns if needed.
- Keep cleanup unsupported.
