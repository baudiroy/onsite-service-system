# Task 095 - Inventory Marker Collision Warning Minimal Implementation

## 功能範圍

本任務在 smoke fixture inventory output 中加入 `SMOKE_RUN_ID` marker collision warning，提醒 operator 目前 inventory 對 safe text columns 仍使用 substring matching，因此 prefix-like run ids 可能命中 sibling 或 historical fixtures。

本任務只做 warning / documentation 類型的小修改：

- 不改 inventory 查詢結果。
- 不新增 exact mode。
- 不新增 `INVENTORY_EXACT_SMOKE_RUN_ID`。
- 不修改 smoke marker generation。
- 不新增 canonical delimiter marker。
- 不新增 migration。
- 不新增 index。
- 不修改 DB schema。
- 不修改 production API / auth / RBAC behavior。
- 不修改 smoke 驗證邏輯。
- 不做 cleanup。
- 不做 AI 自動判斷。

## 變更位置

Inventory script：

```text
scripts/smoke/cleanup/inventory_smoke_fixtures.js
```

變更點：

- `buildBroadQueryWarnings()` 在 `SMOKE_RUN_ID` 存在時加入 generic marker collision warning。
- 沿用既有 top-level `broadQueryWarnings` array。
- 不新增新的 output schema。
- 不改 query matching behavior。

## Warning Wording

當使用 `SMOKE_RUN_ID` 查詢 inventory 時，output 會包含：

```text
SMOKE_RUN_ID inventory uses substring matching on safe text fields except where structured metadata exact matching is available, such as roles.metadata smokeRunId. Prefix-like run ids may match sibling or historical fixtures. Review sample labels, createdAt, and task context before interpreting counts. Inventory is read-only and does not grant cleanup permission.
```

此 warning 不包含：

- `DATABASE_URL`
- password / password hash
- token / secret
- customer mobile / phone / tel
- raw LINE user id
- LINE channel secret / access token
- full payload / raw payload

## Current Matching Reminder

目前 inventory matching 行為維持不變：

- Safe text columns 使用 substring matching。
- `roles.metadata` 的 `smokeRunId` 支援 exact matching。
- `role_permissions` / `user_roles` / `user_organizations` 透過 related role / user / organization rows matching。

這代表 `manual-test-084-027e` 仍可能命中 `manual-test-084-027e-db` 這類 prefix-like sibling run id。Task 095 只提醒 operator，不改查詢結果。

## Output Interpretation

`broadQueryWarnings` 現在可能同時包含：

- `SMOKE_RUN_ID` marker collision warning。
- shared runtime broad query warning。
- task code historical fixture warning。
- date-range-only broad scan warning。
- short prefix warning。

Operator 應把 inventory output 視為人工 review aid：

- 檢查 `sampleLabels`。
- 檢查 `createdAtMin` / `createdAtMax`。
- 檢查 task context。
- 若看到 prefix-like sibling run id，應視為 broad inventory，不應視為 exact single-run inventory。

## Strict Guard Compatibility

Task 091 / 092 / 093 的 strict filter guard 行為應維持：

- `DRY_RUN=1` required。
- `DATABASE_URL` required。
- 至少一個 filter required。
- shared strict + `SMOKE_RUN_ID` allowed。
- shared strict + only `SMOKE_TASK_CODE` rejected unless `ALLOW_BROAD_INVENTORY=1`。
- shared strict + open-ended date rejected。
- shared strict + too-wide date range rejected。
- shared strict + short prefix rejected。
- local/test broad filters allowed with warning。

Task 095 不改上述 guard，只增加 warning。

## Cleanup Boundary

Warning 不代表 cleanup permission。

Inventory output 固定維持：

- `mode=inventory-only`
- `dryRun=true`
- `cleanupSupported=false`
- `destructiveCleanupImplemented=false`

Shared Zeabur runtime 仍禁止 destructive cleanup。不 delete、不 update、不 unlink、不 disable、不呼叫 API cleanup、不執行 DB cleanup。

## 為何不做 Exact Mode

本任務不新增 exact mode，原因：

- Historical fixtures 的 marker 格式不一致。
- Safe text fields 多數不是 structured metadata。
- 直接改 exact matching 可能漏掉歷史 fixtures。
- Canonical delimiter marker 需要各 smoke scripts 協同調整，應另案設計。

## 為何不新增 Migration / Index

本任務只處理 output warning，不需要：

- 新增 metadata 欄位。
- 新增 expression index。
- 啟用 `pg_trgm`。
- 新增 GIN / trigram index。
- 修改 schema。

## Verification Expectations

建議驗證：

```bash
npm run check
npm run smoke:028
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 SMOKE_RUN_ID=<fresh-run-id> npm run smoke:cleanup:inventory
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 ALLOW_BROAD_INVENTORY=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 CREATED_FROM=<from> CREATED_TO=<to> npm run smoke:cleanup:inventory
```

Shared strict rejected guards should still reject:

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 CREATED_FROM=<from> npm run smoke:cleanup:inventory
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 SMOKE_PREFIX=Task npm run smoke:cleanup:inventory
```

## 已知限制

- Warning 是 generic warning，不會改進 matching 精準度。
- 本任務未實作 prefix-like sample label detection。
- Historical prefix collisions 仍可能發生。
- Operator 仍需人工 review sample labels / createdAt / task context。

## Next Task 096 Suggestion

建議 Task 096 做 `Inventory Marker Collision Warning Runbook / Verification Review`：

- 實際驗證 `SMOKE_RUN_ID` output warning。
- 驗證 shared strict guard 沒有倒退。
- 驗證 warning 不含敏感資訊。
- 文件化 operator 解讀方式。
- 不新增 exact mode。
- 不做 cleanup。
