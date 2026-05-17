# Task 070 - Multi-dispatch Browser QA Hardening / Lightweight Automation Planning

## 功能範圍

本文件盤點目前 admin frontend browser QA 自動化基礎，並規劃下一步最小可行 browser smoke。Task 070 只做 planning / inventory：

- 不新增大型 E2E infrastructure。
- 不新增 migration。
- 不修改 backend API。
- 不修改 appointment enum。
- 不修改 backend single-open appointment guard。
- 不修改 FieldServiceReportService completion guard。
- 不新增 finalAppointmentId manual override。
- 不建立多份 Field Service Report。
- 不自動 close case。
- 不自動建立 billing / settlement。
- 不做 AI 自動判斷 visitResult。

## 現有測試架構盤點

Root `package.json` 目前提供：

- `npm run check`
- `npm run admin:check`
- `npm run admin:build`
- `npm run smoke:027e`
- `npm run smoke:028`
- `npm run smoke:029`
- `npm run smoke:046`
- `npm run smoke:047`

Admin `package.json` 目前提供：

- `npm run dev`
- `npm run check`
- `npm run build`
- `npm run preview`

目前沒有發現以下 browser / frontend test infrastructure：

- Playwright
- Cypress
- Puppeteer
- Vitest / Jest frontend unit test
- Testing Library integration test
- browser E2E CI config

目前可重用的 fixture / smoke 基礎主要是 API-level scripts：

- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`

這兩支 smoke 已具備建立 organization / dispatch unit / customer / case / dispatch / appointments / service report 的流程，可作為未來 browser smoke fixture setup 的參考或抽取對象。

## 可用 Selectors 盤點

Task 068 已新增並經 Task 069 驗證可用：

| Selector | 用途 |
| --- | --- |
| `data-testid="appointment-create-start"` | 新增 appointment 開始時間 |
| `data-testid="appointment-create-end"` | 新增 appointment 結束時間 |
| `data-testid="appointment-edit-start"` | 編輯 / 改期 appointment 開始時間 |
| `data-testid="appointment-edit-end"` | 編輯 / 改期 appointment 結束時間 |
| `data-testid="appointment-result-arrival"` | 到府結果實際到場時間 |
| `data-testid="appointment-result-finished"` | 到府結果實際完成時間 |

這些 selectors 已足以穩定處理 native `datetime-local` input，解掉 Task 067 的主要 browser QA blocker。

## 缺少 Selectors 盤點

若 Task 071 要做最小 browser smoke，建議逐步補以下 stable selectors。第一版可只補必要欄位，不需要一次補完整全站：

### Login

- `login-email`
- `login-password`
- `login-submit`

目前 login form 有可用 label / input type，但沒有 stable `data-testid`。若以 automation 操作，建議補 static selectors。

### Case Navigation

- `case-search-case-no`
- `case-detail-panel`
- `case-detail-close`
- `case-status-label`

目前可用 `/cases?caseId=...` 直接開啟 detail，第一版 browser smoke 可不依賴搜尋流程。

### Dispatch / Appointment Panel

- `dispatch-appointment-panel`
- `appointment-create-submit`
- `appointment-create-note`
- `appointment-card`
- `appointment-card-result-button`
- `visit-history-section`
- `visit-history-final-marker`

Task 069 已能靠文字與既有結構完成流程，但自動化會更需要 static selectors。

### Appointment Result Modal

- `appointment-result-modal`
- `appointment-result-visit-result`
- `appointment-result-next-action`
- `appointment-result-incomplete-reason`
- `appointment-result-note`
- `appointment-result-submit`
- `appointment-result-cancel`

目前只有 actual time inputs 有 stable selectors。Task 069 的非 datetime 欄位仍需要人工或輔助 JS，這是 Task 071 前最值得補的 selector group。

### Field Service Report

- `service-report-panel`
- `service-report-diagnosis`
- `service-report-repair-action`
- `service-report-repair-result`
- `service-report-service-status`
- `service-report-engineer-note`
- `service-report-submit`
- `service-report-final-appointment-hint`

Task 069 已證明 UI 行為正確，但 automation 需要避免透過中文文字或 DOM 位置找欄位。

### Assertions / State

- `notice-message`
- `form-error`
- `case-completed-at`
- `billing-empty-state`
- `close-workflow-status`
- `timeline-list`

這些有助於 browser smoke 驗證「完成但不自動 close / billing / settlement」。

## 最小 Browser Smoke Scope

建議下一步 Task 071 命名：

**Task 071 - Multi-dispatch Browser Smoke Minimal Implementation**

最小流程：

1. Login。
2. 透過 API helper 建立 test fixture。
3. Browser 開啟 `/cases?caseId=<caseId>`。
4. 確認 case detail 與 Dispatch / Appointment panel 載入。
5. 確認多次到府紀錄可見。
6. 將第一筆 appointment result 更新為 `pending_parts` / `wait_for_parts`。
7. 建立第二筆 appointment，使用 stable datetime selectors。
8. 將第二筆 appointment result 更新為 `completed`。
9. 建立或更新 Field Service Report，設 `serviceStatus=completed`。
10. 驗證 final appointment marker 顯示。
11. 驗證 case status 為 completed。
12. 驗證沒有自動 close case。
13. 驗證沒有自動建立 billing / settlement。

第一版 browser smoke 不建議涵蓋所有負向分支。以下仍交給 API smoke 與少量 UI assertion：

- no completed appointment 不可完修。
- pending_parts appointment 不能作 finalAppointmentId。
- cross-case finalAppointmentId 被拒絕。
- 一案只能有一份 active Field Service Report。

這些已由 `smoke:028` / `smoke:029` 提供較穩定覆蓋。

## 測試資料策略比較

### 策略 1：Browser test 自己走 UI 建資料

優點：

- 最接近真實使用者操作。
- 可覆蓋 customer / case / dispatch / appointment / service report 的完整 UI 串接。

缺點：

- 慢。
- 脆弱。
- 需要大量 selectors。
- 容易因 unrelated UI copy / layout 改動失敗。
- 前置資料與權限問題較難定位。

### 策略 2：API helper 建 fixture，再用 browser 驗證關鍵 UI

優點：

- 穩定。
- 快。
- 較少 selectors。
- 失敗原因較容易分層：fixture/API vs browser UI。
- 可重用 `smoke:028` / `smoke:029` 的 fixture 流程與 redaction pattern。

缺點：

- 不是完整 end-to-end UI 建資料。
- 無法驗證 customer / case / dispatch 建立 UI 的每個欄位。

## 推薦策略

第一版建議採 **策略 2：API fixture + browser 關鍵 UI 驗證**。

建議 Task 071 流程：

1. 用 API 建立 organization / dispatch unit / customer / case / dispatch / first appointment。
2. Browser 從 `/cases?caseId=<caseId>` 開始。
3. Browser 驗證 appointment result update、第二筆 appointment create、service report completion、final marker。
4. API smoke 繼續覆蓋 backend guard 與負向分支。

等 selectors 成熟後，再評估策略 1，把 customer / case / dispatch 建立也納入 browser flow。

## 環境策略

### 1. local Vite + Zeabur API

建議第一版使用。

優點：

- 與 Task 067～069 手動 QA 路線一致。
- 不需要先部署 dedicated admin frontend。
- backend 使用目前 Zeabur runtime，可接近實際 API 行為。

風險：

- 會在 Zeabur DB 留測試資料。
- 依賴網路與 Zeabur runtime 狀態。
- 不適合高頻 CI。

### 2. local Vite + local API / local DB

適合後續 CI 或開發機穩定回歸。

優點：

- 可控。
- 可清理 DB。
- 不依賴 Zeabur runtime。

風險：

- 需要 local DB / seed admin 穩定。
- 目前先前曾遇到 local DB login `ECONNREFUSED`，需先補 local dev environment runbook。

### 3. deployed admin frontend + Zeabur API

適合正式 release QA。

優點：

- 最接近正式使用路徑。

風險：

- 目前尚無 dedicated deployed admin frontend service。
- 需確認 `VITE_API_BASE_URL`、CORS、auth token 行為。

### 第一版建議

Task 071 先使用：

- `ADMIN_BASE_URL=http://127.0.0.1:<vite-port>`
- `API_BASE_URL=https://onsite-service-api.zeabur.app`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

並避免 hardcode Zeabur URL 到 source code。

## 安全與資料清理規則

Browser smoke 應遵守：

- 不印 token。
- 不印 password。
- 不印 secret。
- 不印 full API payload。
- 不印 customer mobile。
- 不印 raw LINE user id。
- 測試資料使用 `Task071` / `smoke-browser` 前綴。
- 不測真實客戶資料。
- URL 不放 appointmentId / finalAppointmentId / customer mobile / customerId / raw lineUserId。
- 若目前沒有 cleanup，文件與輸出需明確說明測試資料會留在測試環境。

建議沿用 smoke scripts 的 redaction pattern，將以下 key 視為敏感：

- `password`
- `token`
- `secret`
- `mobile`
- `lineUserId`
- `channelSecret`
- `channelAccessToken`
- `apiKey`

## 為何不一次建立大型 E2E Infrastructure

目前 admin frontend 還在快速補 foundation 與 workflow UI。若一次導入完整 E2E suite，會產生：

- 大量 selectors 維護成本。
- 大量 fixture / cleanup / local DB setup 工作。
- 失敗訊號不夠聚焦。
- 容易把 browser automation infrastructure 變成另一個大型專案。

Task 071 應先做小範圍、低耦合、可手動重跑的 browser smoke。當 selector / fixture / env strategy 穩定後，再逐步擴充。

## 下一步 Task 071 建議

建議 Task 071 做：

**Multi-dispatch Browser Smoke Minimal Implementation**

範圍：

- 新增最小 browser smoke script。
- 不導入大型 E2E framework，除非使用非常薄的 Playwright dependency 且 scope 清楚。
- 先用 API helper 建 fixture。
- Browser 只從 `/cases?caseId=<caseId>` 驗證關鍵 UI。
- 只補必要 selectors：
  - login fields / submit
  - appointment result modal fields / submit
  - service report fields / submit
  - visit history final marker
  - case status
  - billing empty state

Task 071 驗收重點：

- 可重複跑。
- 失敗時能知道卡在 fixture、login、appointment UI、service report UI 或 assertion。
- 不印敏感資料。
- 不改 backend guard / completion guard。
- 不改一案一份 Field Service Report 原則。
