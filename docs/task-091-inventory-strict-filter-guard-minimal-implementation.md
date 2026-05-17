# Task 091 - Inventory Strict Filter Guard Minimal Implementation

## 功能範圍

本任務對 `scripts/smoke/cleanup/inventory_smoke_fixtures.js` 做最小 strict filter guard / broad query warning 實作，目標是在 shared runtime 上避免 operator 無意間執行過寬的 read-only inventory。

本任務仍然只支援 inventory：

- 不做 cleanup。
- 不刪資料。
- 不更新資料。
- 不 unlink / disable。
- 不呼叫 API delete / disable / unlink。
- 不新增 migration。
- 不新增 index。
- 不修改 DB schema。
- 不修改 production API / auth / RBAC behavior。
- 不修改 smoke 驗證邏輯。
- 不做 AI 自動判斷。

## 新增 Env Flags

### `INVENTORY_SHARED_RUNTIME=1` / `SHARED_RUNTIME=1`

表示本次 inventory 連線目標是 shared runtime。這只會影響 guard / warning，不代表允許 cleanup。

### `REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1`

搭配 shared runtime flag 啟用 strict filter policy。啟用後，過寬的 filter 會在連 DB 前被拒絕。

### `ALLOW_BROAD_INVENTORY=1`

只允許 read-only broad inventory override。它不允許 cleanup，也不會開啟 delete / update / unlink / disable。

### `INVENTORY_MAX_DATE_RANGE_DAYS`

預設 `7`。必須是 positive integer；若值無效，script 會保守拒絕執行並輸出不含敏感資訊的錯誤。

### `INVENTORY_MIN_PREFIX_LENGTH`

預設 `10`。必須是 positive integer；若值無效，script 會保守拒絕執行。

## 保留的 Base Guards

既有 guard 仍保留：

- `DRY_RUN=1` required。
- `DATABASE_URL` required，但永遠不輸出值。
- 至少一個 filter required：
  - `SMOKE_RUN_ID`
  - `SMOKE_TASK_CODE`
  - `SMOKE_PREFIX`
  - `CREATED_FROM` / `CREATED_TO`
- output 固定包含：
  - `mode=inventory-only`
  - `dryRun=true`
  - `destructiveCleanupImplemented=false`
  - `cleanupSupported=false`

## Strict Filter Rules

### `SMOKE_RUN_ID`

`SMOKE_RUN_ID` 是 shared runtime 上最推薦的 filter。只要有 `SMOKE_RUN_ID`，strict shared mode 會放行，不因其他 broad filter 條件而拒絕。

### Open-ended Date Range

Shared runtime strict mode 下，若沒有 `SMOKE_RUN_ID` 且只提供 `CREATED_FROM` 或只提供 `CREATED_TO`，會拒絕：

```text
Open-ended date range is not allowed in shared-runtime strict mode. Provide both CREATED_FROM and CREATED_TO.
```

### Date Range Too Wide

Shared runtime strict mode 下，若 date range 超過 `INVENTORY_MAX_DATE_RANGE_DAYS`，會拒絕：

```text
Date range exceeds INVENTORY_MAX_DATE_RANGE_DAYS. Narrow the range or use SMOKE_RUN_ID.
```

若 `SMOKE_TASK_CODE` 搭配超長 date range，`ALLOW_BROAD_INVENTORY=1` 可允許 read-only inventory override，但 output 仍會帶 warning。

### Only `SMOKE_TASK_CODE`

Shared runtime strict mode 下，只有 `SMOKE_TASK_CODE` 且沒有 `ALLOW_BROAD_INVENTORY=1` 時會拒絕：

```text
Refusing broad shared-runtime inventory without ALLOW_BROAD_INVENTORY=1.
```

加入 `ALLOW_BROAD_INVENTORY=1` 後可放行，但只是 read-only inventory。

### Short `SMOKE_PREFIX`

Shared runtime 下，若 `SMOKE_PREFIX` 長度小於 `INVENTORY_MIN_PREFIX_LENGTH` 且沒有 `SMOKE_RUN_ID`，會拒絕：

```text
SMOKE_PREFIX is too short for shared-runtime inventory. Use a longer prefix, SMOKE_RUN_ID, or add CREATED_FROM/CREATED_TO.
```

## `broadQueryWarnings`

Output top-level 新增：

```json
{
  "broadQueryWarnings": []
}
```

當 query 有風險但仍允許時，會加入 warning，例如：

```text
This inventory query may be broad on shared runtime. Prefer SMOKE_RUN_ID or add CREATED_FROM/CREATED_TO.
SMOKE_TASK_CODE can match historical fixtures. Prefer SMOKE_RUN_ID for a single run, or add a narrow CREATED_FROM/CREATED_TO range.
Date-range-only inventory can scan many non-smoke records. Keep the range narrow and review output manually.
```

Warnings 不包含 `DATABASE_URL`、password、token、secret、customer mobile、raw LINE user id 或 payload。

## Output Environment

`environment` 會多輸出 safe settings：

```json
{
  "sharedRuntime": true,
  "strictSharedRuntime": true,
  "allowBroadInventory": false,
  "inventoryMaxDateRangeDays": 7,
  "inventoryMinPrefixLength": 10
}
```

`DATABASE_URL` 只以 `hasDatabaseUrl` / `databaseUrlRedacted` 表示，不會輸出 URL。

## Command Examples

### Shared strict + run id

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 SMOKE_RUN_ID=manual-test-083 npm run smoke:cleanup:inventory
```

### Shared strict + only task code rejected

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
```

### Shared strict + broad task code override

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 ALLOW_BROAD_INVENTORY=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
```

### Shared strict + bounded date range

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 CREATED_FROM=2026-05-17T00:00:00Z CREATED_TO=2026-05-18T00:00:00Z npm run smoke:cleanup:inventory
```

### Local/test broad task code

```bash
DRY_RUN=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
```

Local/test DB 不會因 broad task code 被新增 guard 拒絕，但 output 可能帶 warning，提醒 operator 這是 broad inventory。

## Guard Rejection Behavior

Strict guard rejection 會：

- exit non-zero。
- 盡可能在 DB connection 前拒絕。
- 不輸出 `DATABASE_URL`。
- 明確顯示 `No cleanup was performed.`

## Redaction / Safety Confirmation

Inventory output 與 error handling 不得輸出：

- `DATABASE_URL`
- customer mobile / phone / tel
- raw LINE user id
- password / password hash
- token / secret
- LINE channel secret / access token
- full payload / raw payload

Query matching 仍只使用 safe text columns 與既有 safe relationship matching，不以 customer mobile 或 raw LINE user id 作條件。

## 為何不做 Cleanup

本任務只處理 read-only inventory guard。Shared Zeabur runtime 仍禁止 destructive cleanup；local / CI cleanup 也尚未實作。`ALLOW_BROAD_INVENTORY=1` 只放行 read-only broad inventory，不代表 cleanup permission。

## 為何不新增 Index / Migration

Task 089 local EXPLAIN baseline 顯示目前 local/test DB 查詢都很快。雖然 substring matching 會 Seq Scan，但目前沒有 shared DB slow query evidence，因此不新增 migration、不新增 index、不啟用 `pg_trgm`。

## 已知限制

- Strict guard 只能降低 broad query 風險，不能替代 operator 人工判讀。
- `SMOKE_TASK_CODE` 仍可能命中歷史 fixtures，shared runtime 建議搭配 `SMOKE_RUN_ID` 或 narrow date range。
- `SMOKE_PREFIX` 是文字匹配，過短 prefix 在 shared runtime 會被拒絕。
- Date range inventory 可能掃到 non-smoke rows，應只作人工 review aid。
- Cleanup 仍完全 unsupported。

## 下一步 Task 092 建議

建議 Task 092 做 `Inventory Strict Filter Guard Runbook / Manual Verification Review`：

- 彙整 guard commands 與預期結果。
- 用 local/test DB 與 shared-runtime flag 模擬 strict mode。
- 確認 `broadQueryWarnings` 對 operator 足夠清楚。
- 不做 cleanup、不新增 index、不修改 schema。
