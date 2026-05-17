# Task 078 - Backfill smoke:027e SMOKE_RUN_ID Marker

## 功能範圍

本任務將 permission / regular user / disabled user smoke 接上 `SMOKE_RUN_ID` marker：

- `npm run smoke:027e`

此 smoke 涉及 roles / users / permissions / organization membership / `DATABASE_URL` DB fixture，風險高，因此本任務只做 fixture marker backfill，不修改權限驗證邏輯、不做 cleanup、不新增 migration、不修改 backend schema / API / auth / RBAC behavior。

## 使用 Task 076 Smoke Marker Helper

`scripts/smoke/027e_permission_regular_user_smoke.js` 使用共用 helper：

- `scripts/smoke/helpers/smokeMarker.js`
- `createSmokeMarker({ taskCode: 'Task027E', smokeName: 'smoke', runId: process.env.SMOKE_RUN_ID })`

未新增第二套 helper。

## smoke:027e Marker Backfill

Marker 格式：

- `Task027E smoke <smokeRunId>`

Prefix：

- `task027e-<smokeRunId>`

寫入 safe text fields：

- limited role key
- limited role name
- limited role description
- limited role metadata
- organization A / B code
- organization A / B name
- dispatch unit A / B code
- dispatch unit A / B name
- regular user email
- disabled user email
- regular user display name
- disabled user display name
- regular user updated display name
- organization membership note

Email 使用 `shortSmokeRunId`，避免 email 過長。

## Role Metadata Marker

Limited role metadata 包含：

```json
{
  "task": "027E",
  "fixture": true,
  "smokeRunId": "<smokeRunId>",
  "smokePrefix": "Task027E smoke <smokeRunId>"
}
```

此 metadata 只用於後續人工追蹤 fixture，不代表 cleanup 可自動執行。

## DB Fixture Safety

`smoke:027e` 仍透過 `DATABASE_URL` 建立 limited role 與 role permissions，並維持既有 DB fixture behavior。

安全邊界：

- 不刪 roles。
- 不刪 users。
- 不刪 permissions。
- 不 cleanup `role_permissions`。
- 不 cleanup `user_roles`。
- 不 cleanup organization memberships。
- 不做 destructive DB operation。
- 只在建立 fixture role / permission assignment / users / organizations / dispatch units 時加入 marker。

本任務不改 permission keys，也不改 RBAC 驗證語意。

## Password / Token / DATABASE_URL Redaction

Smoke 啟動 logs 只顯示：

- task code
- smoke name
- smokeRunId
- API base URL
- admin email
- `hasDatabaseUrl` boolean

Smoke logs 不顯示：

- admin password
- regular user password
- disabled user password
- token
- secret
- password hash
- full payload
- `DATABASE_URL`

既有 `assertNoPasswordHash()` 保留，用於確認 create / get / list / update user response 不洩漏 password hash。

`safeState()` 會排除 `regularPassword`，summary 不輸出 regular user password。Disabled user password 只存在 local function scope，不寫入 state。

## Why No Cleanup

本任務不做 cleanup：

- roles / users / permissions fixture 屬於高風險資料。
- shared Zeabur runtime 禁止 destructive cleanup。
- API cleanup coverage 不足。
- DB cleanup 僅可在 isolated local / CI DB 另案設計。
- `SMOKE_RUN_ID` marker 的第一階段目標是人工追蹤與盤點。

本任務不加入 `CLEANUP` flag 到 `smoke:027e`。

## Why No Smoke Logic Change

本任務不修改以下驗證：

- limited role 透過 `DATABASE_URL` 建立。
- regular user 不能讀 global audit logs。
- regular user 不能讀 global notification APIs。
- regular user 只能看自己的 organization dispatch units。
- regular user 不能 cross organization。
- disabled user 不能 login。
- user responses 不得洩漏 password hash。

## Shared Zeabur Runtime Rule

在 shared Zeabur runtime：

- 不做自動 cleanup。
- 不做 destructive cleanup。
- 不刪 roles / users / permissions / org assignments。
- fixture 必須靠 Task prefix + smokeRunId + createdAt 人工追蹤。

## Known Limits

- 既有歷史 fixture 不會回填 marker。
- 相同 `SMOKE_RUN_ID` 重複跑同一支 smoke 可能撞到唯一 role key / organization code / user email。
- cleanup 仍未實作。
- `smoke:027e` 需要 `DATABASE_URL`；沒有 DB connection string 時無法建立 limited role fixture。

## Next Task

建議下一步：

- Task 079 - Smoke Fixture Cleanup Inventory / Dry-run Planning

Task 079 應只做 cleanup inventory / dry-run planning，不應在 shared Zeabur runtime 執行 destructive cleanup。
