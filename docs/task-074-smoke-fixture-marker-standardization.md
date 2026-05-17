# Task 074 - Smoke Fixture Marker Standardization

## 功能範圍

本任務先標準化 smoke fixture marker，不做 cleanup。

實作範圍：

- Task071 browser smoke 支援 `SMOKE_RUN_ID`。
- Task071 fixture fields 更一致地包含 `Task071 browser-smoke <smokeRunId>`。
- Logs 顯示 `smokeRunId`，但不顯示敏感資料。
- `CLEANUP=1` 只輸出安全提示，不執行 destructive cleanup。
- 文件化 smoke:028 / smoke:029 / smoke:046 / smoke:047 / smoke:027e 未來 marker standardization 建議。

本任務不做：

- 不實作 DB cleanup。
- 不實作 destructive cleanup。
- 不在 Zeabur shared runtime 刪資料。
- 不新增 migration。
- 不修改 backend schema。
- 不修改 production API behavior。
- 不修改 appointment enum。
- 不修改 backend single-open appointment guard。
- 不修改 FieldServiceReportService completion guard。
- 不新增 finalAppointmentId manual override。
- 不建立多份 Field Service Report。
- 不自動 close case。
- 不自動建立 billing / settlement。
- 不做 AI 自動判斷 visitResult。

## 為何先標準化 Marker 而不是 Cleanup

Task 073 已確認目前 API soft-delete coverage 不足以完整、安全地清理 smoke fixture graph。

目前 shared Zeabur runtime 是共同測試 / production-like API runtime，因此第一階段不應做 destructive cleanup。更安全的第一步是讓 fixture 可被穩定辨識：

- 每次 smoke 有明確 `smokeRunId`。
- Root / child records 都能透過 safe text fields 搜尋。
- 後續人工 review、dry-run inventory、local / CI cleanup 都有可靠 marker。

## Task071 新增 SMOKE_RUN_ID 行為

Task071 browser smoke 現在支援：

```bash
SMOKE_RUN_ID=manual-test-074 npm run smoke:071:browser
```

如果未提供 `SMOKE_RUN_ID`，script 會自動產生：

```text
YYYYMMDD-HHMMSS-random
```

範例：

```text
20260517-153045-a1b2
```

Script 會 normalize `SMOKE_RUN_ID`：

- trim
- lower-case
- 非 `a-z0-9-` 字元轉成 `-`
- 多個 `-` 壓成一個
- 最長保留 48 字元

這是為了避免 organization code / dispatch unit code 等欄位收到不適合的字元或過長 marker。

## Smoke Marker Helper

Task071 使用：

```text
smokePrefix = Task071 browser-smoke <smokeRunId>
```

例如：

```text
Task071 browser-smoke manual-test-074
```

## Task071 Fixture Marker 寫入欄位

Task071 fixture 現在會把 `smokeRunId` 寫入以下 safe text fields：

| 資料 | 欄位 | 範例 |
| --- | --- | --- |
| organization | organizationCode | `task071-org-manual-test-074` |
| organization | organizationName | `Task071 Browser Smoke Organization manual-test-074` |
| dispatch unit | code | `task071-du-manual-test-074` |
| dispatch unit | name | `Task071 Browser Smoke Dispatch Unit manual-test-074` |
| customer | customerName | `Task071 Browser Smoke Customer manual-test-074` |
| case | modelNo | `T071-manualtest074` |
| case | problemDescription | `Task071 browser-smoke manual-test-074 multi-dispatch case` |
| dispatch assignment | assignmentNote | `Task071 browser-smoke manual-test-074 dispatch` |
| workflow transition | note | `Task071 browser-smoke manual-test-074 submit/review/accept` |
| first appointment | note | `Task071 browser-smoke manual-test-074 appointment 1` |
| second appointment | note | `Task071 browser-smoke manual-test-074 appointment 2` |
| appointment result | incompleteReason | `Task071 browser-smoke manual-test-074 pending parts` |
| field service report | diagnosisResult | `Task071 browser-smoke manual-test-074 diagnosis` |
| field service report | repairAction | `Task071 browser-smoke manual-test-074 repair action` |
| field service report | repairResult | `Task071 browser-smoke manual-test-074 repair result` |

Task071 不把以下資料當 marker：

- customer mobile
- raw LINE user id
- password
- token
- secret
- full request payload

## Logs / Redaction 規則

Script 開始時輸出：

- `taskCode`
- `smokeRunId`
- `adminBaseUrl`
- `apiBaseUrl`
- `adminEmail`
- `adminPasswordProvided`
- `cleanupRequested`
- `headless`
- `browserChannel`

Script 不輸出：

- `ADMIN_PASSWORD`
- token
- secret
- customer mobile
- raw LINE user id
- full payload

既有 redaction helper 仍保留，會遮蔽 key 名稱包含以下字樣的資料：

- password
- token
- secret
- mobile
- lineUserId
- channelAccessToken
- channelSecret
- apiKey

## CLEANUP Env

Task071 現在讀取：

```bash
CLEANUP=1
```

但本任務不實作 cleanup。

如果 `CLEANUP=1`，script 只輸出：

```text
CLEANUP=1 is not implemented for shared/runtime safety. No cleanup was performed.
```

並且保證：

- 不做 DB cleanup。
- 不呼叫 destructive API。
- 不 delete / disable / unlink smoke-created records。
- 不在 Zeabur shared runtime 清資料。

## Future Marker Standardization 建議

### smoke:028

建議未來加入：

- `SMOKE_RUN_ID`
- `Task028 smoke <smokeRunId>`

可放入：

- organizationCode / organizationName
- dispatchUnitCode / dispatchUnitName
- customerName
- case problemDescription / modelNo
- appointment note
- dispatch assignment note
- service report text fields

### smoke:029

`smoke:029` 檔名對應 Task 061 single-open appointment guard。

建議 marker 同時包含：

```text
Task061 smoke029 <smokeRunId>
```

原因：

- 保留 task 語意。
- 保留 smoke script 編號。
- 未來人工搜尋時不會混淆 `smoke:029` 與 Task061。

### smoke:046

LINE identity 類 smoke 不應使用 raw `lineUserId` 作 cleanup marker。

建議：

- 使用 line channel code。
- 使用 line channel name。
- 使用 customerName。
- 使用 case problemDescription。
- 使用 displayName。
- `lineUserId` 仍應只用測試值並在 logs mask。

### smoke:047

建議：

- org A / org B 帶同一 `smokeRunId`。
- channel A / channel B 帶同一 `smokeRunId`。
- customer A / customer B 帶同一 `smokeRunId`。
- identity unlink 後仍可透過 org / channel / customer / case marker 人工追查。

### smoke:027e

Roles / users / permissions fixture 特別高風險。

建議：

- role metadata 可包含 `smokeRunId`。
- roleKey / user email / organization code 都帶 `task027e` + `smokeRunId`。
- cleanup 更應保守，不應在 shared runtime 自動刪 roles / users / permissions。

## Shared Zeabur Runtime Cleanup 禁止規則

在 shared Zeabur runtime：

- 不做自動 DB cleanup。
- 不做 destructive cleanup。
- 不 hard delete smoke data。
- 不清 seed admin / roles / permissions / shared organizations。
- 若需要清理，先人工 review prefix / smokeRunId / createdAt。
- 未來若 API soft-delete coverage 足夠，再重新評估低風險 cleanup。

## Local / CI Isolated DB 未來 Cleanup 條件

只有在 local / CI isolated DB 才可考慮 cleanup。

未來 cleanup script 至少需要：

- `ALLOW_SMOKE_DB_CLEANUP=1`
- 明確 `SMOKE_RUN_ID`
- dry-run mode
- environment guard，拒絕 shared / production-like runtime
- 只處理 smokeRunId / prefix 命中的資料
- dependent rows 先清，再處理 root rows
- 不誤刪 seed admin / core permissions / roles / shared org

## 驗證

本任務完成後需執行：

- `npm run check`
- `npm run admin:check`
- `npm run admin:build`
- `npm run smoke:071:browser`

Browser smoke 建議執行方式：

Terminal A：

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

Terminal B：

```bash
SMOKE_RUN_ID=manual-test-074 \
ADMIN_BASE_URL=http://127.0.0.1:<vite-port> \
API_BASE_URL=https://onsite-service-api.zeabur.app \
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD='<admin password>' \
npm run smoke:071:browser
```

## 已知限制

- 目前只標準化 Task071 marker。
- smoke:028 / smoke:029 / smoke:046 / smoke:047 / smoke:027e 尚未實作 `SMOKE_RUN_ID`。
- `CLEANUP=1` 只輸出安全提示，不做 cleanup。
- Browser smoke 仍依賴 local Vite 與本機 Chrome channel。
- Browser smoke 不負責啟動 Vite dev server。
- Browser smoke fixture 仍會留在測試環境。

## 下一步 Task 075 建議

建議下一步做：

**Task 075 - Smoke Fixture Marker Backfill Planning for API Smokes**

範圍：

- 盤點 smoke:028 / smoke:029 / smoke:046 / smoke:047 / smoke:027e 改成 `SMOKE_RUN_ID` 的最小修改。
- 先更新文件與設計，不一次改全部 smoke。
- 若要實作，分批做，並每批跑對應 smoke。
- 仍不做 cleanup。
