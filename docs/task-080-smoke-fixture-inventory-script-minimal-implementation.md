# Task 080 — Smoke Fixture Inventory Script Minimal Implementation

## 功能範圍

本任務新增第一版 smoke fixture inventory script，用於只讀盤點 smoke-created fixture。此 script 只輸出 inventory / dry-run summary，不做 cleanup，也不會執行 delete、update、unlink、disable 或任何 destructive API。

本任務不新增 migration、不修改 backend schema、不修改 production API behavior、不修改既有 smoke 驗證邏輯，也不引入 AI 判斷。

## Script 路徑

- `scripts/smoke/cleanup/inventory_smoke_fixtures.js`

## NPM Script

- `npm run smoke:cleanup:inventory`

實際執行：

```bash
node scripts/smoke/cleanup/inventory_smoke_fixtures.js
```

## Env Requirements

必填：

- `DRY_RUN=1`
- `DATABASE_URL`

至少需要提供一個查詢條件：

- `SMOKE_RUN_ID`
- `SMOKE_TASK_CODE`
- `SMOKE_PREFIX`
- `CREATED_FROM`
- `CREATED_TO`

若缺少 `DRY_RUN=1`，script 會拒絕執行：

```text
This inventory script is read-only and requires DRY_RUN=1. No cleanup is implemented.
```

若沒有任何 marker 或時間條件，script 會拒絕執行：

```text
Refusing to run inventory without SMOKE_RUN_ID, SMOKE_TASK_CODE, SMOKE_PREFIX, or CREATED_FROM/CREATED_TO.
```

若缺少 `DATABASE_URL`，script 會拒絕執行，而且不輸出 `DATABASE_URL`。

## Query Filters

第一版支援：

- `SMOKE_RUN_ID`：搜尋 safe text columns 與 `roles.metadata->>'smokeRunId'`
- `SMOKE_TASK_CODE`：用 case-insensitive matching 搜尋 safe marker 欄位
- `SMOKE_PREFIX`：用 case-insensitive matching 搜尋 safe marker 欄位
- `CREATED_FROM` / `CREATED_TO`：使用 `created_at` 範圍；若 table 沒有 `created_at`，該 entity 會 skipped

Inventory 不會用以下欄位作為條件：

- customer mobile / phone / tel
- raw LINE user id
- password / password hash
- token / secret
- raw payload / full payload
- `DATABASE_URL`

## Supported Entity Types

Multi-dispatch / case graph：

- `organizations`
- `dispatch_units`
- `customers`
- `cases`
- `dispatch_assignments`
- `appointments`
- `field_service_reports`
- `case_messages`
- `audit_logs`

LINE graph：

- `line_channels`
- `customer_line_identities`

Permission graph：

- `roles`
- `role_permissions`
- `users`
- `user_roles`
- `user_organizations`

其中 `role_permissions` / `user_roles` / `user_organizations` 會在可行時透過 related roles / users / organizations 做 marker matching，但仍只做 read-only inventory。

## Output Format

Script 輸出 JSON summary：

```json
{
  "mode": "inventory-only",
  "dryRun": true,
  "destructiveCleanupImplemented": false,
  "cleanupSupported": false,
  "filters": {
    "smokeRunId": "manual-test-074",
    "smokeTaskCode": null,
    "smokePrefix": null,
    "createdFrom": null,
    "createdTo": null
  },
  "environment": {
    "nodeEnv": null,
    "hasDatabaseUrl": true,
    "databaseUrlRedacted": true
  },
  "warning": [
    "This script is inventory-only. It does not delete, update, unlink, disable, or cleanup any records.",
    "Destructive cleanup is not implemented and must not be run against shared Zeabur runtime."
  ],
  "entities": [
    {
      "entityType": "appointments",
      "table": "appointments",
      "riskLevel": "low",
      "count": 0,
      "sampleIds": [],
      "sampleLabels": [],
      "createdAtMin": null,
      "createdAtMax": null,
      "dependencyWarning": "Depends on cases and dispatch assignments.",
      "cleanupSupported": false,
      "skipped": false
    }
  ]
}
```

每個 entity summary 包含：

- `entityType`
- `table`
- `riskLevel`
- `count`
- `sampleIds`，最多 5 筆
- `sampleLabels`
- `createdAtMin`
- `createdAtMax`
- `dependencyWarning`
- `cleanupSupported: false`
- `skipped`
- `skipReason`，僅 skipped 時出現

## Redaction / Safety Rules

Output 不得包含：

- `DATABASE_URL`
- customer mobile / phone / tel
- raw LINE user id
- password / password hash
- token / secret
- channel secret / channel access token
- full payload / raw payload

Script 只搜尋 safe text columns，例如 code、name、customer_name、model_no、problem_description、note、description、display_name、channel_id、role_key、email，以及 `roles.metadata` 中的 `smokeRunId` / `smokePrefix`。

## Shared Zeabur Runtime Warning

Script output 固定包含：

```text
This script is inventory-only. It does not delete, update, unlink, disable, or cleanup any records.
Destructive cleanup is not implemented and must not be run against shared Zeabur runtime.
```

Shared Zeabur runtime 只允許保守 read-only inventory，不允許 destructive cleanup。

## Skipped Table Behavior

若 table 不存在，該 entity 會回傳：

```json
{
  "skipped": true,
  "skipReason": "table_not_found"
}
```

若 table 存在但沒有可支援的 safe marker / createdAt filter columns，該 entity 會回傳：

```json
{
  "skipped": true,
  "skipReason": "no_supported_filter_columns"
}
```

若 query 失敗，script 會將該 entity 標為 `query_failed`，並只輸出 redacted error message。

## 為何不做 Cleanup

目前 shared Zeabur runtime 是共用 runtime，且 smoke fixture graph 橫跨 cases、appointments、reports、LINE identities、audit logs、roles、users、permissions 等資料。尤其 permission / RBAC fixture 風險最高。

因此 Task 080 僅實作 inventory-only / dry-run output：

- 不 delete
- 不 update
- 不 unlink
- 不 disable
- 不呼叫 API cleanup
- 不做 DB cleanup
- 不支援 cleanup mode

## 已知限制

- 第一版只做 DB read-only inventory，不做 API-based soft cleanup。
- `role_permissions` / `user_roles` / `user_organizations` 的 marker matching 依賴 related roles / users / organizations。
- 若某些 historical fixture 沒有 smokeRunId marker，只能靠 task prefix 或 createdAt range 盤點。
- 若 local DB 未啟動，script 會通過 guard 後回報 DB connection failure，不會輸出 DB URL。

## 下一步 Task 081 建議

建議下一步：

**Task 081 — Smoke Fixture Inventory Runbook / Sample Output Review**

範圍建議：

- 使用不同 filter 組合產生 sample output。
- Review inventory result 是否足夠人工清查。
- 補足必要的 safe label columns。
- 仍不做 cleanup。
- 若要設計 cleanup，也應另開 isolated local / CI DB dry-run task，且 shared Zeabur runtime 持續禁止 destructive cleanup。
