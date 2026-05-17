# Task 093 - Inventory Strict Filter Guard Live DB Verification

## 功能範圍

本任務在 dedicated local/test PostgreSQL 上驗證 Task 091 strict filter guard 與 `broadQueryWarnings` 在可成功 DB inventory 情境下仍正常運作。

本任務只做 live verification / 文件：

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

## Local / Test DB 使用方式

本任務使用 Task 083～089 沿用的 dedicated local/test PostgreSQL。

本次步驟：

1. 啟動本機 PostgreSQL。
2. 執行 migration。
3. 執行 seed。
4. 啟動 local API server。
5. 建立 fresh marker-enabled Task028 fixture。
6. 執行 allowed / rejected inventory guard verification。

結果：

- `npm run db:migrate`：PASS，001～019 already applied。
- `npm run db:seed`：PASS。
- local API：`PORT=3000 npm run dev`，PASS。
- 未輸出 `DATABASE_URL` 或 DB password。

## Fixture Setup

建立 fresh fixture：

```bash
SMOKE_RUN_ID=manual-test-093-task028 API_BASE_URL=http://127.0.0.1:3000 npm run smoke:028
```

Result：PASS，13 / 13。

本次使用的 run id：

```text
manual-test-093-task028
```

Smoke 建立的是 non-sensitive test data，沒有 cleanup。

## Live Allowed Query Results

### Shared Strict + Run Id Allowed

Command：

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 SMOKE_RUN_ID=manual-test-093-task028 npm run smoke:cleanup:inventory
```

Result：PASS。

Output confirmation：

- `environment.sharedRuntime=true`
- `environment.strictSharedRuntime=true`
- `environment.allowBroadInventory=false`
- `inventoryMaxDateRangeDays=7`
- `inventoryMinPrefixLength=10`
- `cleanupSupported=false`
- `destructiveCleanupImplemented=false`
- `broadQueryWarnings=[]`
- `entities[]` live summary 正常。

Entity counts：

| Entity | Count |
|---|---:|
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

Sample labels 足夠辨識 `Task028`、`manual-test-093-task028`、primary / cross case、appointments、service report。

### Shared Strict + Only Task Code + Override Allowed

Command：

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 ALLOW_BROAD_INVENTORY=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
```

Result：PASS。

Output confirmation：

- `environment.sharedRuntime=true`
- `environment.strictSharedRuntime=true`
- `environment.allowBroadInventory=true`
- `cleanupSupported=false`
- `destructiveCleanupImplemented=false`
- `entities[]` live summary 正常。
- `broadQueryWarnings` 包含 shared runtime broad query warning 與 task code historical fixtures warning。

Task028 entity counts：

| Entity | Count |
|---|---:|
| organizations | 3 |
| dispatch_units | 3 |
| customers | 6 |
| cases | 6 |
| dispatch_assignments | 6 |
| appointments | 9 |
| field_service_reports | 3 |
| case_messages | 0 |
| audit_logs | 0 |
| line_channels | 0 |
| customer_line_identities | 0 |
| roles | 0 |
| role_permissions | 0 |
| users | 0 |
| user_roles | 0 |
| user_organizations | 0 |

此結果包含歷史 Task028 local/test fixtures，例如 `manual-test-083`、`manual-test-089-task028`、`manual-test-093-task028`。Warning 行為符合預期。

### Shared Strict + Bounded Date Range Allowed With Warning

Command：

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 CREATED_FROM=2026-05-17T00:00:00Z CREATED_TO=2026-05-18T00:00:00Z npm run smoke:cleanup:inventory
```

Result：PASS。

Output confirmation：

- `environment.sharedRuntime=true`
- `environment.strictSharedRuntime=true`
- `environment.allowBroadInventory=false`
- `cleanupSupported=false`
- `destructiveCleanupImplemented=false`
- `entities[]` live summary 正常。
- `broadQueryWarnings` 包含 shared runtime broad query warning 與 date-range-only warning。

Date range entity counts 摘要：

| Entity | Count |
|---|---:|
| organizations | 17 |
| dispatch_units | 13 |
| customers | 10 |
| cases | 10 |
| dispatch_assignments | 6 |
| appointments | 9 |
| field_service_reports | 3 |
| case_messages | 30 |
| audit_logs | 185 |
| line_channels | 4 |
| customer_line_identities | 3 |
| roles | 4 |
| role_permissions | 41 |
| users | 9 |
| user_roles | 4 |
| user_organizations | 3 |

此結果也確認 date range inventory 可能掃到多種 graph 與 seed/admin-like rows，因此 warning 對 operator 有必要。

### Local / Test Broad Task Code Allowed With Warning

Command：

```bash
DRY_RUN=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
```

Result：PASS。

Output confirmation：

- `environment.sharedRuntime=false`
- `environment.strictSharedRuntime=false`
- `environment.allowBroadInventory=false`
- `cleanupSupported=false`
- `destructiveCleanupImplemented=false`
- `entities[]` live summary 正常。
- `broadQueryWarnings` 包含 task code historical fixtures warning。

Entity counts 與 shared strict override 的 Task028 broad query 一致：

| Entity | Count |
|---|---:|
| organizations | 3 |
| dispatch_units | 3 |
| customers | 6 |
| cases | 6 |
| dispatch_assignments | 6 |
| appointments | 9 |
| field_service_reports | 3 |

Local/test broad query 沒被 shared strict guard 拒絕，符合 backward compatible 需求。

## Rejected Guard Results

### Shared Strict + Only Task Code Rejected

Command：

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
```

Result：PASS，正確拒絕。

Observed message：

```text
Refusing broad shared-runtime inventory without ALLOW_BROAD_INVENTORY=1. No cleanup was performed.
```

### Shared Strict + Open-ended Date Rejected

Command：

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 CREATED_FROM=2026-05-17T00:00:00Z npm run smoke:cleanup:inventory
```

Result：PASS，正確拒絕。

Observed message：

```text
Open-ended date range is not allowed in shared-runtime strict mode. Provide both CREATED_FROM and CREATED_TO. No cleanup was performed.
```

### Shared Strict + Short Prefix Rejected

Command：

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 SMOKE_PREFIX=Task npm run smoke:cleanup:inventory
```

Result：PASS，正確拒絕。

Observed message：

```text
SMOKE_PREFIX is too short for shared-runtime inventory. Use a longer prefix, SMOKE_RUN_ID, or add CREATED_FROM/CREATED_TO. No cleanup was performed.
```

## `broadQueryWarnings` Review

`broadQueryWarnings` 在 allowed broad queries 中正確出現：

- shared runtime broad query：
  - `This inventory query may be broad on shared runtime. Prefer SMOKE_RUN_ID or add CREATED_FROM/CREATED_TO.`
- task code historical fixture warning：
  - `SMOKE_TASK_CODE can match historical fixtures. Prefer SMOKE_RUN_ID for a single run, or add a narrow CREATED_FROM/CREATED_TO range.`
- date-range-only warning：
  - `Date-range-only inventory can scan many non-smoke records. Keep the range narrow and review output manually.`

Run-id strict query 沒有 unnecessary broad warning，符合預期。

## Environment Flags Review

Allowed output 正確顯示：

- `sharedRuntime`
- `strictSharedRuntime`
- `allowBroadInventory`
- `inventoryMaxDateRangeDays`
- `inventoryMinPrefixLength`
- `hasDatabaseUrl`
- `databaseUrlRedacted=true`

Output 沒有顯示 `DATABASE_URL`。

## Live Entity Output Review

Live `entities[]` summary 正常：

- count 正常。
- sampleIds 最多 5 筆。
- sampleLabels 可讀且足夠人工識別 task / run id / fixture type。
- createdAtMin / createdAtMax 合理。
- riskLevel 與 dependencyWarning 維持既有行為。
- skipped table behavior 本次未觸發，所有 configured tables 可查詢。
- `cleanupSupported=false` 每個 entity 都維持。

## 是否做小修

本任務沒有修改 `scripts/smoke/cleanup/inventory_smoke_fixtures.js`。Task 091 實作在 live DB verification 中符合預期。

## Redaction / Safety Confirmation

本次 live output 未輸出：

- `DATABASE_URL`
- DB password
- API token
- admin password
- customer mobile / phone / tel
- raw LINE user id
- password hash
- token / secret
- LINE channel secret / access token
- full payload / raw payload

Inventory query 仍不使用 customer mobile 或 raw LINE user id 作條件。

## Cleanup Flags Confirmation

所有 allowed output 均確認：

```text
cleanupSupported=false
destructiveCleanupImplemented=false
```

Rejected guards 均顯示 no cleanup performed。

## 為何仍不做 Cleanup

本任務只驗證 strict filter guard 在 live DB inventory 情境中的 read-only 行為。Shared Zeabur runtime 仍禁止 destructive cleanup；local / CI cleanup 也仍未實作。`ALLOW_BROAD_INVENTORY=1` 只允許 read-only broad inventory，不代表 cleanup permission。

## 已知限制

- 本次只建立 fresh Task028 fixture，未建立 fresh RBAC / LINE fixture。
- Date range query 會匹配 local/test DB 既有 Task083～089 fixture 與 seed/admin-like records，因此只能作人工盤點 aid。
- Local/test fixture rows 仍留在本機 DB，沒有 cleanup。
- Shared runtime live DB 未執行，仍只允許 read-only inventory。

## 下一步 Task 094 建議

建議 Task 094 做 `Smoke Fixture Inventory Historical Marker Collision Review`：

- 針對 substring matching 可能造成 prefix-like run id collision 做文件與 guard 建議。
- 比較 `SMOKE_RUN_ID=manual-test-084-027e` 命中 `manual-test-084-027e-db` 的歷史限制。
- 評估是否需要 future exact marker mode，但不改 schema、不做 cleanup。
