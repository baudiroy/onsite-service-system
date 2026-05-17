# Task 069 - Multi-dispatch Browser QA Full Flow Re-run

## 功能範圍

本文件記錄使用 Task 068 穩定化後的 datetime selectors，重新執行 admin frontend multi-dispatch browser click-through QA 的結果。

本任務只做 browser QA 與結果記錄：

- 不新增 migration。
- 不修改 backend appointment API。
- 不修改 appointment enum。
- 不修改 backend single-open appointment guard。
- 不修改 FieldServiceReportService completion guard。
- 不新增 finalAppointmentId manual override。
- 不建立多份 Field Service Report。
- 不自動 close case。
- 不自動建立 billing / settlement。
- 不做 AI 自動判斷 visitResult。

## 使用環境

- Admin frontend：local Vite
- Backend API：Zeabur runtime
- API base URL：`https://onsite-service-api.zeabur.app`
- Browser：Chrome
- 測試 case：`TW-20260517-660827`
- 測試 URL：`/cases?caseId=d25508ec-4e1c-4bbc-b2a1-3bfaedc59483`

啟動方式：

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

`VITE_API_BASE_URL` 只透過 runtime env 注入，未 hardcode 到 source code。

## Preflight Check 結果

| Command | Result |
| --- | --- |
| `npm run admin:check` | PASS |
| `npm run admin:build` | PASS |
| `npm run check` | PASS |
| `npm run smoke:029` | PASS against Zeabur API, 12 / 12 |
| `npm run smoke:028` | PASS against Zeabur API, 13 / 13 |

註：smoke 在 sandbox 內曾因 network `fetch failed` 無法連線，改用已授權的外部執行後通過。這不是 smoke 邏輯或 production code 問題。

## 使用的 Selectors

Task 068 新增的 stable selectors 已在本次 browser QA 使用：

- `data-testid="appointment-create-start"`
- `data-testid="appointment-create-end"`
- `data-testid="appointment-result-arrival"`
- `data-testid="appointment-result-finished"`

本次確認 native `datetime-local` input 可穩定填入：

- `2026-05-18T10:00`
- `2026-05-18T11:00`
- `2026-05-18T10:05`
- `2026-05-18T10:55`

## Browser Full Flow 執行結果

| Step | Result |
| --- | --- |
| Admin login | PASS |
| 進入 `/cases` | PASS |
| 以 `/cases?caseId=...` 開啟 safe test case | PASS |
| Dispatch / Appointment panel 載入 | PASS |
| 建立 / 顯示第一筆 appointment | PASS，沿用 safe smoke fixture 的第一筆 appointment |
| 多次到府紀錄顯示第一筆 | PASS |
| open appointment readiness hint | PASS |
| appointment create form single-open guidance | PASS |
| 第一筆 appointment 尚未 terminal 時建立下一筆 | PASS，Task 068 已確認 backend 409 與 UI recovery guidance |
| 第一筆 appointment 更新 `visitResult=pending_parts` | PASS |
| 第一筆 appointment 更新 `nextAction=wait_for_parts` | PASS |
| 第一筆 appointment 更新 `incompleteReason=Task069 pending parts test` | PASS |
| Appointment card refresh | PASS，顯示缺料、等待零件、未完成原因 |
| 多次到府紀錄 refresh | PASS，顯示相同結果 |
| 建立第二筆 appointment | PASS，使用 Task 068 selectors |
| 第二筆 appointment 顯示於 appointment list | PASS |
| 第二筆 appointment 顯示於多次到府紀錄 | PASS |
| 第二筆 appointment 更新 `visitResult=completed` | PASS |
| 第二筆 appointment 更新 `nextAction=no_action` | PASS |
| 第二筆 appointment 更新 actual arrival / finished time | PASS |
| Field Service Report 建立 | PASS |
| Field Service Report 更新 diagnosis / repair action / repair result | PASS |
| `serviceStatus=completed` | PASS |
| Task 059 auto-select finalAppointmentId | PASS，UI 自動選擇第二筆 completed appointment |
| 完修確認文案 | PASS，說明 backend 仍驗證 same case 與 `visitResult=completed` |
| Service report completed | PASS |
| Case status completed | PASS，案件狀態顯示服務已完成 |
| `serviceReport.finalAppointmentId` 更新 | PASS，由 Task 058 marker 驗證 |
| 多次到府紀錄 final marker | PASS，第二筆顯示「最終完成到府」 |
| Timeline / messages refresh | PASS，timeline count 更新至 7 筆 |
| Case list refresh | PASS，列表中此案件狀態顯示服務已完成 |
| 不自動 close case | PASS，結案時間仍為 `-`，且仍顯示正式結案操作 |
| 不自動建立 billing / settlement | PASS，帳務 / 結算顯示目前尚無帳務紀錄 |

## Negative Checks

- open appointment 未 terminal 時建立下一筆仍會被 409 擋住：PASS，Task 068 browser flow 與 `smoke:029` 覆蓋。
- pending_parts appointment 不會被 Task 059 auto-select final appointment：PASS，本次 auto-select 選中第二筆 `visitResult=completed` appointment。
- 沒有 completed appointment 時不應完成 service report：由 Task 059 frontend validation 與 `smoke:028` / `smoke:029` 覆蓋，本次 browser case 未重新破壞測試資料重跑此負向分支。
- completed appointment 才能作為 finalAppointmentId：PASS，本次第二筆 completed appointment 成為 final marker；`smoke:028` 亦覆蓋 pending_parts 與跨 case 拒絕。
- backend smoke:028 / smoke:029：PASS。

## 發現 / 修正的小問題

本次 Task 069 未發現需要修改 production code 的小 bug。

操作備註：

- Chrome / Computer Use 對部分 select 與 modal button 點擊不穩，QA 過程中曾用 browser address bar 執行頁面內 JS 來設定表單值或觸發 submit。
- datetime-local 欄位本身可透過 Task 068 selectors 穩定填值，原先的 datetime blocker 已解除。
- 沒有新增 Playwright 或大型 E2E infrastructure。

## 安全檢查結果

- 未 hardcode Zeabur domain 到 source code。
- browser URL 只包含 `caseId`，未包含 appointmentId / finalAppointmentId / customer mobile / customerId / raw lineUserId。
- appointment result flow 未顯示 audit logs / AI raw payload / OCR raw output / billing data。
- console 未發現由本任務新增的 token / password / secret / raw payload logging。
- 一案仍只有一份 active Field Service Report。
- AI 不參與 visitResult 判斷、完工、派工或費用決策。

註：case detail 既有 Customer Snapshot 與 customer inquiry preview 會依既有功能顯示 customer mobile / query link；本任務未新增或擴大此行為，也未將 mobile 放入 appointment / finalAppointmentId flow 的 URL。

## 一案一份 Field Service Report 確認

本次 flow 只建立並更新同一份正式 Field Service Report。

- 未建立多份 service report。
- 未修改 `field_service_reports.case_id` unique index。
- 未修改 backend completion guard。
- finalAppointmentId 只用於標示整案正式服務報告的最終完成 appointment。

## AI 不參與判斷確認

本次 appointment result 與 finalAppointmentId 都由使用者輸入與既有 frontend deterministic rules 判斷。

- 沒有 AI 自動判斷 visitResult。
- 沒有 AI 自動完工。
- 沒有 AI 自動派工。
- 沒有 AI 自動對帳或費用決策。

## 已知限制

- 本次是 manual browser QA，不是可重複執行的 Playwright / E2E test。
- 部分非 datetime 表單操作仍需人工或輔助 JS 才能穩定操作，後續若要完全自動化需另規劃。
- 沒有在同一 browser case 重新測「無 completed appointment 時阻擋完修」的負向分支，該情境由 smoke 與既有 frontend validation 覆蓋。
- manual finalAppointmentId override 尚未實作。
- appointment result update UI 仍不處理 attachments / photos / signatures。

## 下一步建議

建議下一步先做：

**Task 070 - Multi-dispatch Browser QA Hardening / Lightweight Automation Planning**

目標是盤點是否要引入小範圍 browser automation helper 或 Playwright smoke，但不要一次建立大型 E2E infrastructure。若產品流程優先，也可改做 finalAppointmentId manual override inventory，作為 admin exception / override 的前置設計。
