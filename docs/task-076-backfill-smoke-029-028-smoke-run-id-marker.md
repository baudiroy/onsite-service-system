# Task 076 - Backfill smoke:029 + smoke:028 SMOKE_RUN_ID Marker

## 功能範圍

本任務只標準化 multi-dispatch 主線 API smoke 的 fixture marker：

- `npm run smoke:029`
- `npm run smoke:028`

本任務不修改 smoke 驗證邏輯、不做 cleanup、不新增 migration、不修改 backend schema / API / guard / completion guard。

## 共用 Smoke Marker Helper

新增 `scripts/smoke/helpers/smokeMarker.js`，提供 API smoke 與未來 browser smoke 可共用的 marker helper：

- `createSmokeRunId(date = new Date())`
  - 產生 `YYYYMMDD-HHMMSS-random` 格式。
- `normalizeSmokeRunId(input)`
  - `trim`
  - lower-case
  - 非 `a-z0-9-` 轉成 `-`
  - 多個 `-` 壓成一個
  - 去除頭尾 `-`
  - 最長 48 字元
  - 空值時自動產生 run id
- `shortSmokeRunId(runId, maxLength = 16)`
  - 用於 `modelNo` 或 compact code。
- `buildSmokePrefix(taskCode, smokeName, runId)`
  - 例如 `Task061 smoke029 manual-test-076`。
- `createSmokeMarker({ taskCode, smokeName, runId })`
  - 回傳 `smokeRunId`、`shortSmokeRunId`、`smokePrefix`、`codePrefix`。

Helper 不連 DB、不做 cleanup、不輸出敏感資料，也不使用 customer mobile 或 raw LINE user id 作 marker。

## smoke:029 Marker Backfill

`scripts/smoke/029_single_open_appointment_guard_smoke.js` 現在支援 `SMOKE_RUN_ID`。

Marker 格式：

- `Task061 smoke029 <smokeRunId>`

寫入 safe text fields：

- organization code / name
- dispatch unit code / name
- primary customer name
- cross-case customer name
- case `modelNo`
- case `problemDescription`
- workflow transition note
- dispatch assignment note
- appointment note
- reschedule reason
- incomplete reason
- field service report `diagnosisResult`
- field service report `repairAction`
- field service report `engineerNote`
- field service report `repairResult`

保留原本驗證：

- 同一 case open appointment 會被 409 擋下
- reschedule same appointment 仍成功
- terminal `visitResult=pending_parts` 後可建立下一筆
- cross-case open appointment 互不影響
- 第二筆 completed appointment 可作為 `finalAppointmentId` 完成 service report

## smoke:028 Marker Backfill

`scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js` 現在支援 `SMOKE_RUN_ID`。

Marker 格式：

- `Task028 smoke <smokeRunId>`

寫入 safe text fields：

- organization code / name
- dispatch unit code / name
- primary customer name
- cross-case customer name
- case `modelNo`
- case `problemDescription`
- workflow transition note
- dispatch assignment note
- appointment note
- incomplete reason
- field service report `diagnosisResult`
- field service report `repairAction`
- field service report `engineerNote`
- duplicate service report diagnosis
- negative completion `repairResult`
- final completion `repairResult`

保留原本驗證：

- 一案仍只能一份 active Field Service Report
- missing `finalAppointmentId` 不能 completed
- pending-parts appointment 不能作為 final appointment
- cross-case final appointment 會被拒絕
- completed final appointment 才可完成 service report

## Logging / Redaction

Smoke 啟動時可顯示：

- task code
- smoke name
- smokeRunId
- API base URL
- admin email

Smoke logs 不顯示：

- admin password
- token
- secret
- customer mobile
- raw LINE user id
- full payload

錯誤 response 仍走既有 `redact()` / sensitive key 防護。

## Why No Cleanup

本任務只做 marker backfill，不做 cleanup，原因：

- shared Zeabur runtime 不應執行 destructive cleanup。
- 目前 API soft-delete coverage 不足。
- DB cleanup 只能在 isolated local / CI DB 另案設計。
- fixture marker 先標準化後，才能安全盤點與人工 review。

`smoke:028` / `smoke:029` 本次不加入 `CLEANUP` flag，避免誤解為已支援清理。

## Shared Zeabur Runtime Rule

在 shared Zeabur runtime：

- 不自動 cleanup。
- 不做 destructive cleanup。
- 不 delete / disable / unlink smoke-created data。
- fixture 必須靠 Task prefix + smokeRunId + createdAt 人工追蹤。

## Known Limits

- 本任務只 backfill `smoke:028` 與 `smoke:029`。
- `smoke:046` / `smoke:047` / `smoke:027e` 尚未接上共用 marker helper。
- 既有歷史 fixture 不會回填 marker。
- 相同 `SMOKE_RUN_ID` 重複跑同一支 smoke 可能撞到唯一 code；正式使用時應讓每次 run id 保持唯一。

## Next Task

建議下一步：

- Task 077 - Backfill smoke:046 + smoke:047 SMOKE_RUN_ID Marker

Task 077 應特別注意 LINE identity 類資料，不得使用 raw `lineUserId` 作 cleanup marker，也不得在 log 中輸出 raw LINE user id。
