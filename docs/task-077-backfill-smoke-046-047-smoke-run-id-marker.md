# Task 077 - Backfill smoke:046 + smoke:047 SMOKE_RUN_ID Marker

## 功能範圍

本任務只將 LINE inquiry / LINE identity 相關 API smoke 接上 `SMOKE_RUN_ID` marker：

- `npm run smoke:046`
- `npm run smoke:047`

本任務不修改 smoke 驗證邏輯、不做 cleanup、不新增 migration、不修改 backend schema / API / LINE identity behavior。

## 使用 Task 076 Smoke Marker Helper

本任務沿用 `scripts/smoke/helpers/smokeMarker.js`：

- `createSmokeMarker({ taskCode, smokeName, runId })`
- `normalizeSmokeRunId`
- `shortSmokeRunId`
- `buildSmokePrefix`

未新增第二套 helper。

## smoke:046 Marker Backfill

`scripts/smoke/046_line_inquiry_fixture_smoke.js` 現在支援 `SMOKE_RUN_ID`。

Marker 格式：

- `Task046 smoke <smokeRunId>`

寫入 safe text fields：

- organization code / name
- LINE channel code / name
- LINE channel `channelId`
- customer name
- case `modelNo`
- case `problemDescription`
- LINE identity `displayName`

`USE_DB_LINE_IDENTITY_FIXTURE=1` 時，DB fallback insert 的 `display_name` 也會使用同一個 marker。

Raw `lineUserId` 仍只用作測試識別值，不作 cleanup marker，也不輸出到 logs。

## smoke:047 Marker Backfill

`scripts/smoke/047_line_identity_admin_api_smoke.js` 現在支援 `SMOKE_RUN_ID`。

Marker 格式：

- `Task047 smoke <smokeRunId>`

寫入 safe text fields：

- org A / B code
- org A / B name
- LINE channel A / B code
- LINE channel A / B name
- LINE channel A / B `channelId`
- customer A / B name
- case A / B `modelNo`
- case A / B `problemDescription`
- LINE identity `displayName`

Org A / B、channel A / B、customer A / B、case A / B 都使用同一個 `smokeRunId`，unlink 後仍可透過 org / channel / customer / case marker 人工追查。

## LINE Identity Redaction / Masking

保留既有 masking / internal-only checks：

- smoke 啟動 logs 只顯示 masked LINE user id。
- summary state 只顯示 `lineUserIdMasked`。
- 不輸出 raw `lineUserId`。
- 不輸出 admin password。
- 不輸出 token / secret / channel secret / channel access token。
- 不輸出 customer mobile。
- 不輸出 full payload。

Raw `lineUserId` 不可作為 cleanup marker。Customer mobile 也不可作為 cleanup marker。

## DB Fallback 注意事項

`smoke:046` 的 `USE_DB_LINE_IDENTITY_FIXTURE=1` 路徑仍保留既有行為：

- 只在環境提供 `DATABASE_URL` 且明確設定 `USE_DB_LINE_IDENTITY_FIXTURE=1` 時使用。
- 只補 `display_name` marker。
- 不新增 DB cleanup。
- 不修改 insert graph。
- 不輸出 raw `lineUserId`。

## Why No Cleanup

本任務只做 marker backfill：

- shared Zeabur runtime 禁止 destructive cleanup。
- API soft-delete coverage 仍不足。
- LINE identity unlink / delete 行為不應被當成 fixture cleanup。
- local / CI DB cleanup 需獨立 task 設計。

本任務不加入 `CLEANUP` flag 到 `smoke:046` / `smoke:047`。

## Why No Smoke Logic Change

本任務只更換 fixture safe text fields 與 smoke config log，不修改：

- public LINE inquiry success assertion
- generic failure assertion
- internal-only field checks
- Admin API vs DB fallback behavior
- raw LINE user id masking behavior
- idempotent link assertion
- same line user conflict assertion
- cross-organization assertion
- unlink disables public inquiry assertion

## Shared Zeabur Runtime Rule

在 shared Zeabur runtime：

- 不做自動 cleanup。
- 不做 destructive cleanup。
- 不 delete / disable / unlink smoke-created data 作為 cleanup。
- fixture 必須靠 Task prefix + smokeRunId + createdAt 人工追蹤。

## Known Limits

- 本任務只 backfill `smoke:046` 與 `smoke:047`。
- 既有歷史 fixture 不會回填 marker。
- 相同 `SMOKE_RUN_ID` 重複跑同一支 smoke 可能撞到唯一 code；正式使用時每次 run id 應保持唯一。
- `smoke:027e` 尚未接上共用 marker helper。
- cleanup 仍未實作。

## Next Task

建議下一步：

- Task 078 - Backfill smoke:027e SMOKE_RUN_ID Marker

Task 078 牽涉 roles / users / permissions，應比 LINE smoke 更保守，仍不可實作 destructive cleanup。
