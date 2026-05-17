# Task 079 - Smoke Fixture Cleanup Inventory / Dry-run Planning

## 功能範圍

本任務只規劃 smoke fixture cleanup inventory / dry-run 方案。

本任務不做：

- 不實作 cleanup script。
- 不寫 destructive SQL。
- 不刪任何資料。
- 不呼叫 API delete / disable / unlink 當作 cleanup。
- 不在 shared Zeabur runtime 清資料。
- 不新增 migration。
- 不修改 backend schema / API / auth / RBAC behavior。
- 不修改 smoke 驗證邏輯。
- 不做 AI 自動判斷。

本任務目標是定義未來 inventory-only / dry-run-only 的安全邊界，讓 smoke-created fixtures 可被盤點，但不被誤刪。

## Smoke Fixture Graph

### 1. Multi-dispatch Smokes

範圍：

- `smoke:028`
- `smoke:029`
- `smoke:071:browser`

可能建立 / 影響：

- `organizations`
- `dispatch_units`
- `customers`
- `cases`
- `dispatch_assignments`
- `appointments`
- `field_service_reports`
- `case_messages` / timeline messages
- `audit_logs`

目前通常不建立：

- `service_parts`
- billing records
- settlement records
- attachments / photos / signatures
- LINE channels / LINE identities

可搜尋 marker：

- organization code / name
- dispatch unit code / name
- customer name
- case `model_no`
- case `problem_description`
- dispatch assignment note
- appointment note
- workflow transition note
- field service report text fields
- `smokeRunId`

### 2. LINE Smokes

範圍：

- `smoke:046`
- `smoke:047`

可能建立 / 影響：

- `organizations`
- `line_channels`
- `customers`
- `cases`
- `customer_line_identities`
- `audit_logs`
- public inquiry readable state

特殊注意：

- `smoke:046` 可走 Admin API 或 `USE_DB_LINE_IDENTITY_FIXTURE=1` DB fallback 建立 `customer_line_identities`。
- `smoke:047` 會測 unlink identity，但 unlink 是產品行為驗證，不是 cleanup。
- cleanup / inventory 不得使用 raw `line_user_id` 作條件。
- output 不得顯示 raw `line_user_id`。

可搜尋 marker：

- organization code / name
- LINE channel code / name / channel ID
- customer name
- case `model_no`
- case `problem_description`
- LINE identity display name
- `smokeRunId`

### 3. Permission Smoke

範圍：

- `smoke:027e`

可能建立 / 影響：

- `roles`
- `role_permissions`
- `users`
- `user_roles`
- `user_organizations` / organization memberships
- `organizations`
- `dispatch_units`
- `audit_logs`

特殊注意：

- `smoke:027e` 需要 `DATABASE_URL` 建立 limited fixture role。
- roles / users / permissions 是最高風險 fixture graph。
- `role_permissions` 連到 core permissions，不可誤刪 permissions。
- shared runtime 中 high-risk graph 預設只 inventory，不 cleanup。

可搜尋 marker：

- role key
- role name / description
- role metadata `smokeRunId`
- organization code / name
- dispatch unit code / name
- user email
- user display name
- organization membership note

## Dry-run Query Strategy

未來 inventory script 可依以下條件做只讀查詢：

- `SMOKE_RUN_ID`
- task code prefix，例如 `Task071` / `task071`
- createdAt range
- organization code prefix
- dispatch unit code prefix
- customer name prefix
- case `problem_description` prefix
- case `model_no` prefix
- field service report text marker
- role metadata `smokeRunId`
- role key prefix
- user email prefix
- line channel code prefix
- line identity display name prefix

查詢原則：

- 必須只讀。
- 不可使用 customer mobile 作 search key。
- 不可使用 raw LINE user id 作 search key。
- 不可輸出 token / password / secret / `DATABASE_URL` / password hash / full payload。
- sample rows 應 redacted。
- shared runtime 上若執行 DB inventory，必須明確顯示這是 read-only inventory。

## Dry-run Output Format

建議每個 table / entity type 輸出一段 summary：

```json
{
  "entityType": "appointments",
  "table": "appointments",
  "riskLevel": "low",
  "count": 3,
  "sampleIds": ["..."],
  "sampleLabels": ["Task071 browser-smoke ... appointment 1"],
  "createdAtMin": "2026-05-17T00:00:00.000Z",
  "createdAtMax": "2026-05-17T00:10:00.000Z",
  "dependencyWarning": "Depends on cases and dispatch assignments.",
  "cleanupSupported": false
}
```

Output 可包含：

- table / entity type
- count
- sample ids，最多 5 筆
- sample names / codes / labels
- createdAt min / max
- dependency warning
- risk level
- whether cleanup is implemented，第一版固定 false

Output 不得包含：

- customer mobile
- raw LINE user id
- token
- secret
- password hash
- full payload
- `DATABASE_URL`

## Environment Guard Design

未來 script 可使用：

- `SMOKE_RUN_ID`
- `SMOKE_TASK_CODE` optional
- `DRY_RUN=1`
- `ALLOW_SMOKE_DB_CLEANUP=0` default
- `NODE_ENV`
- `DATABASE_URL`
- `REQUIRE_LOCAL_DB=1` optional

Guard 規則：

- Inventory-only script 必須要求 `DRY_RUN=1`，避免使用者誤解為 cleanup。
- 若沒有 `SMOKE_RUN_ID`、`SMOKE_TASK_CODE`、prefix 或 createdAt range，應拒絕執行。
- Dry-run inventory 可以在 shared runtime 只讀執行，但必須明確顯示 `destructive cleanup not implemented`。
- Destructive cleanup 永遠不能在 shared Zeabur runtime 執行。
- Destructive cleanup 若未來要做，必須同時滿足：
  - `ALLOW_SMOKE_DB_CLEANUP=1`
  - `NODE_ENV` 明確是 `test` / `ci` / `local`
  - DB host 明確不是 Zeabur / production-like host
  - 有 `SMOKE_RUN_ID` 或嚴格 prefix
  - 已先跑 dry-run
  - 使用 transaction
  - 有 dependent order
- 如果 `DATABASE_URL` 指向 Zeabur / production-like host，必須拒絕 destructive cleanup。
- `DATABASE_URL` 永遠不得輸出。

## Risk Classification

### Low

- `appointments`
- `dispatch_assignments`
- `field_service_reports`
- smoke-created cases / customers in isolated DB

注意：shared runtime 中即使 Low 也不自動刪。

### Medium

- `line_channels`
- `customer_line_identities`
- future billing / settlement fixtures
- `audit_logs`
- timeline / case messages

原因：

- LINE identities 影響 public inquiry behavior。
- billing / settlement 牽涉財務語意。
- audit logs / timeline messages 有留存與稽核考量。

### High

- `organizations`
- `users`
- `roles`
- `role_permissions`
- `user_roles`
- `user_organizations`
- seed admin / core permissions

規則：

- High 類預設只 inventory。
- 不 cleanup core permissions。
- 不 cleanup seed admin。
- 不 cleanup production-like users / roles。
- roles / users / permissions cleanup 只能在 isolated local / CI DB 另案設計。

## Future Cleanup Modes

### Mode 1 - Inventory Only

只列出 count / sample / risk / dependency warning。

建議 Task080 第一版採用此模式。

### Mode 2 - Dry-run Dependency Plan

列出如果未來要 cleanup，理論順序與原因，但仍不刪資料。

可與 Mode 1 一起做，但 output 必須清楚標示：

- no delete
- no update
- no unlink
- no disable

### Mode 3 - Soft Cleanup via API

透過正式 API cancel / disable / unlink。

目前不建議第一版做，原因：

- API coverage 不完整。
- shared runtime 仍有誤動作風險。
- unlink identity 是產品狀態變更，不應混成 fixture cleanup。

### Mode 4 - DB Cleanup Isolated Only

僅 local / CI isolated DB。

必要條件：

- `ALLOW_SMOKE_DB_CLEANUP=1`
- `NODE_ENV=test|ci|local`
- transaction
- dependent row order
- strict smokeRunId / prefix
- dry-run 先行

不在 shared runtime 執行。

## Future Script Skeleton

建議未來 script：

- `scripts/smoke/cleanup/inventory_smoke_fixtures.js`

建議 npm script：

- `npm run smoke:cleanup:inventory`

第一版 Task080 應：

- 只讀 DB。
- 只 inventory。
- 不 delete。
- 不 update。
- 不 unlink。
- 不 disable。
- 可依 `SMOKE_RUN_ID` 查。
- 可依 task prefix 查。
- output redacted。
- 明確標示 `destructive cleanup not implemented`。
- 若缺 `DRY_RUN=1`，拒絕執行。
- 若缺 marker 條件，拒絕執行。

## Shared Zeabur Runtime Rule

shared Zeabur runtime：

- 不做 destructive cleanup。
- 不自動刪 smoke data。
- 不用 DB delete。
- 不用 API delete / disable / unlink cleanup。
- 可以做 read-only inventory，但必須明確 env 與 dry-run output。
- 即使 Low risk entity，也不自動刪。
- 若需要清理，先人工 review prefix / smokeRunId / createdAt。

## Local / CI Isolated DB Conditions

local / CI isolated DB 才可評估 cleanup。

條件：

- 明確不是 shared Zeabur / production-like host。
- 明確 `NODE_ENV=test|ci|local`。
- 明確 `ALLOW_SMOKE_DB_CLEANUP=1`。
- 明確 `SMOKE_RUN_ID` 或 strict prefix。
- 先 dry-run。
- 使用 transaction。
- dependent rows 先處理。
- 不刪 seed admin。
- 不刪 core permissions。
- 不以 customer mobile / raw LINE user id 為條件。

## Safety / Redaction Rules

Inventory output 不得顯示：

- customer mobile
- raw LINE user id
- token
- password
- secret
- channel secret
- channel access token
- password hash
- full payload
- `DATABASE_URL`

Inventory 可顯示：

- smokeRunId
- task code
- entity type
- sample ids
- sample names / codes
- counts
- createdAt min / max
- risk level

## Why No Cleanup In This Task

本任務只做 planning，原因：

- shared Zeabur runtime 的誤刪成本太高。
- roles / users / permissions fixture graph 風險最高。
- API cleanup coverage 不完整。
- DB cleanup 需要 isolated DB 與更嚴格 runbook。
- 目前最需要的是可檢索、可盤點、可人工 review 的 inventory plan。

## Next Task

建議下一步：

- Task 080 - Smoke Fixture Inventory Script Minimal Implementation

Task080 建議只做 Mode 1 或 Mode 1 + Mode 2：

- `scripts/smoke/cleanup/inventory_smoke_fixtures.js`
- `npm run smoke:cleanup:inventory`
- 只讀 DB
- `DRY_RUN=1`
- redacted output
- no cleanup implemented
- shared Zeabur runtime allowed only as read-only inventory
