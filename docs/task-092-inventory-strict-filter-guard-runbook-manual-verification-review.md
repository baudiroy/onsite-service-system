# Task 092 - Inventory Strict Filter Guard Runbook / Manual Verification Review

## 功能範圍

本任務針對 Task 091 新增的 strict filter guard 與 `broadQueryWarnings` 做 manual verification / runbook review。

本任務只做文件與驗證：

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

## Task 091 Guard Summary

Inventory script：

```text
scripts/smoke/cleanup/inventory_smoke_fixtures.js
```

npm script：

```bash
npm run smoke:cleanup:inventory
```

Base guards：

- `DRY_RUN=1` required。
- `DATABASE_URL` required，但不輸出值。
- 至少一個 filter required：
  - `SMOKE_RUN_ID`
  - `SMOKE_TASK_CODE`
  - `SMOKE_PREFIX`
  - `CREATED_FROM` / `CREATED_TO`

Strict shared runtime env：

- `INVENTORY_SHARED_RUNTIME=1` 或 `SHARED_RUNTIME=1`
- `REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1`
- `ALLOW_BROAD_INVENTORY=1`
- `INVENTORY_MAX_DATE_RANGE_DAYS`，預設 `7`
- `INVENTORY_MIN_PREFIX_LENGTH`，預設 `10`

Output fixed flags：

```text
mode=inventory-only
dryRun=true
destructiveCleanupImplemented=false
cleanupSupported=false
```

Top-level warning field：

```json
{
  "broadQueryWarnings": []
}
```

## Base Guard Verification Results

### Missing `DRY_RUN=1`

Command：

```bash
npm run smoke:cleanup:inventory
```

Result：PASS，正確拒絕。

Observed message：

```text
This inventory script is read-only and requires DRY_RUN=1. No cleanup is implemented.
```

### Missing Filters

Command：

```bash
DRY_RUN=1 npm run smoke:cleanup:inventory
```

Result：PASS，正確拒絕。

Observed message：

```text
Refusing to run inventory without SMOKE_RUN_ID, SMOKE_TASK_CODE, SMOKE_PREFIX, or CREATED_FROM/CREATED_TO.
```

## Shared Strict Guard Verification Results

### Shared Strict + Run Id Allowed

Command：

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 SMOKE_RUN_ID=manual-test-083 npm run smoke:cleanup:inventory
```

Result：PASS。

Behavior：

- 未因 broad filter 被拒絕。
- 進入 read-only DB inventory path。
- 目前環境 DB access 回 `EPERM`，output 已 redacted。
- `environment.sharedRuntime=true`。
- `environment.strictSharedRuntime=true`。
- `cleanupSupported=false`。
- `destructiveCleanupImplemented=false`。
- `broadQueryWarnings=[]`。

### Shared Strict + Only Task Code Rejected

Command：

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
```

Result：PASS，正確在 DB connect 前拒絕。

Observed message：

```text
Refusing broad shared-runtime inventory without ALLOW_BROAD_INVENTORY=1. No cleanup was performed.
```

### Shared Strict + Only Task Code + Override Allowed

Command：

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 ALLOW_BROAD_INVENTORY=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
```

Result：PASS。

Behavior：

- 未被 strict guard 拒絕。
- 進入 read-only DB inventory path。
- 目前環境 DB access 回 `EPERM`，output 已 redacted。
- `environment.allowBroadInventory=true`。
- `cleanupSupported=false`。
- `destructiveCleanupImplemented=false`。
- `broadQueryWarnings` 包含 shared runtime broad query warning 與 task code historical fixtures warning。

### Shared Strict + Open-ended Date Rejected

Command：

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 CREATED_FROM=2026-05-17T00:00:00Z npm run smoke:cleanup:inventory
```

Result：PASS，正確在 DB connect 前拒絕。

Observed message：

```text
Open-ended date range is not allowed in shared-runtime strict mode. Provide both CREATED_FROM and CREATED_TO. No cleanup was performed.
```

### Shared Strict + Date Range Too Wide Rejected

Command：

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 CREATED_FROM=2026-05-01T00:00:00Z CREATED_TO=2026-06-15T00:00:00Z npm run smoke:cleanup:inventory
```

Result：PASS，正確在 DB connect 前拒絕。

Observed message：

```text
Date range exceeds INVENTORY_MAX_DATE_RANGE_DAYS. Narrow the range or use SMOKE_RUN_ID. No cleanup was performed.
```

### Shared Strict + Bounded Date Range Allowed With Warning

Command：

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 CREATED_FROM=2026-05-17T00:00:00Z CREATED_TO=2026-05-18T00:00:00Z npm run smoke:cleanup:inventory
```

Result：PASS。

Behavior：

- 未被 strict guard 拒絕。
- 進入 read-only DB inventory path。
- 目前環境 DB access 回 `EPERM`，output 已 redacted。
- `broadQueryWarnings` 包含：
  - shared runtime broad query warning。
  - date-range-only inventory warning。
- `cleanupSupported=false`。
- `destructiveCleanupImplemented=false`。

### Shared Strict + Short Prefix Rejected

Command：

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 SMOKE_PREFIX=Task npm run smoke:cleanup:inventory
```

Result：PASS，正確在 DB connect 前拒絕。

Observed message：

```text
SMOKE_PREFIX is too short for shared-runtime inventory. Use a longer prefix, SMOKE_RUN_ID, or add CREATED_FROM/CREATED_TO. No cleanup was performed.
```

## Invalid Config Verification Results

### Invalid `INVENTORY_MAX_DATE_RANGE_DAYS`

Command：

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 INVENTORY_MAX_DATE_RANGE_DAYS=abc SMOKE_RUN_ID=manual-test-083 npm run smoke:cleanup:inventory
```

Result：PASS，保守拒絕。

Observed message：

```text
INVENTORY_MAX_DATE_RANGE_DAYS must be a positive integer. No cleanup was performed.
```

### Invalid `INVENTORY_MIN_PREFIX_LENGTH`

Command：

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 INVENTORY_MIN_PREFIX_LENGTH=abc SMOKE_RUN_ID=manual-test-083 npm run smoke:cleanup:inventory
```

Result：PASS，保守拒絕。

Observed message：

```text
INVENTORY_MIN_PREFIX_LENGTH must be a positive integer. No cleanup was performed.
```

## Local / Test Behavior Review

Command：

```bash
DRY_RUN=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
```

Result：PASS。

Behavior：

- 未被 shared strict guard 拒絕。
- 進入 read-only DB inventory path。
- 目前環境 DB access 回 `EPERM`，output 已 redacted。
- `environment.sharedRuntime=false`。
- `environment.strictSharedRuntime=false`。
- `broadQueryWarnings` 包含 task code historical fixtures warning。
- `cleanupSupported=false`。
- `destructiveCleanupImplemented=false`。

## `broadQueryWarnings` Review

`broadQueryWarnings` 足夠清楚：

- shared runtime broad query 會提示 prefer `SMOKE_RUN_ID` 或加 date range。
- task code query 會提示可能命中 historical fixtures。
- date-range-only query 會提示可能掃到 non-smoke records。

Warnings 沒有包含 sensitive values。

## 是否做小修

本任務沒有修改 `inventory_smoke_fixtures.js`。Task 091 實作已符合 runbook 期待，因此只新增本文件。

## Redaction / Safety Confirmation

本次 verification output 未輸出：

- `DATABASE_URL`
- customer mobile / phone / tel
- raw LINE user id
- password / password hash
- token / secret
- LINE channel secret / access token
- full payload / raw payload

Allowed query 因目前環境 DB access 回 `EPERM`，error output 仍維持：

```text
Database inventory failed. No cleanup was performed.
```

沒有輸出 DB connection string。

## Cleanup Flags Confirmation

Allowed command output 均確認：

```text
cleanupSupported=false
destructiveCleanupImplemented=false
```

Rejected command 均明確顯示 no cleanup performed 或維持 read-only guard wording。

## 為何仍不做 Cleanup

Strict filter guard 只降低 inventory query 過寬風險，不改變 cleanup policy。Shared Zeabur runtime 仍禁止 destructive cleanup；local / CI cleanup 也仍未實作。`ALLOW_BROAD_INVENTORY=1` 只放行 read-only broad inventory，不代表 cleanup permission。

## 已知限制

- 本次環境可執行 guard verification，但 DB inventory path 回 `EPERM`，因此未重新 review live entity counts。
- `broadQueryWarnings` 是 operator aid，不是 cleanup plan。
- Date range inventory 仍可能掃到 non-smoke rows，應人工 review。
- Historical fixtures 若 marker 不完整，仍可能需要 task code 或 date range 協助盤點。
- Cleanup 仍完全 unsupported。

## 下一步 Task 093 建議

建議 Task 093 做 `Inventory Strict Filter Guard Live DB Verification`：

- 在 dedicated local/test DB 上重跑 bounded date range、task code override、run id inventory。
- 確認 live entity output 仍正確帶 `broadQueryWarnings`。
- 不做 cleanup、不新增 migration、不新增 index、不改 schema。
