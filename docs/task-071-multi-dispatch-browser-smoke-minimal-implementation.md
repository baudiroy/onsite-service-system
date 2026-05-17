# Task 071 - Multi-dispatch Browser Smoke Minimal Implementation

## 功能範圍

本任務新增第一版最小 browser smoke，用 API 建立測試 fixture，再用 browser 從 `/cases?caseId=<caseId>` 驗證 multi-dispatch 核心 UI flow。

本任務保持小範圍：

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

## 實作策略

採用 Task 070 建議的策略 2：

1. API helper 建立 fixture。
2. Browser login 驗證 login selectors。
3. Browser 從 `/cases?caseId=<caseId>` 開始。
4. Browser 只驗證 multi-dispatch 關鍵 UI flow。

Fixture 包含：

- organization
- dispatch unit
- customer
- case
- case workflow 到 accepted
- dispatch assignment
- first appointment

## 新增 / 補齊 Selectors

### Login

- `data-testid="login-email"`
- `data-testid="login-password"`
- `data-testid="login-submit"`

### Case Detail

- `data-testid="case-detail-panel"`
- `data-testid="case-status-label"`

### Dispatch / Appointment

- `data-testid="dispatch-appointment-panel"`
- `data-testid="appointment-card"`
- `data-appointment-id="<appointmentId>"`
- `data-testid="appointment-card-result-button"`
- `data-testid="appointment-create-submit"`
- `data-testid="visit-history-section"`
- `data-testid="visit-history-card"`
- `data-testid="visit-history-final-marker"`

既有 Task 068 selectors：

- `data-testid="appointment-create-start"`
- `data-testid="appointment-create-end"`
- `data-testid="appointment-edit-start"`
- `data-testid="appointment-edit-end"`
- `data-testid="appointment-result-arrival"`
- `data-testid="appointment-result-finished"`

### Appointment Result Modal

- `data-testid="appointment-result-modal"`
- `data-testid="appointment-result-visit-result"`
- `data-testid="appointment-result-next-action"`
- `data-testid="appointment-result-incomplete-reason"`
- `data-testid="appointment-result-submit"`

### Field Service Report

- `data-testid="service-report-panel"`
- `data-testid="service-report-diagnosis"`
- `data-testid="service-report-repair-action"`
- `data-testid="service-report-repair-result"`
- `data-testid="service-report-service-status"`
- `data-testid="service-report-submit"`
- `data-testid="service-report-final-appointment-hint"`

### Billing / Close Assertions

- `data-testid="billing-empty-state"`
- `data-testid="case-close-status"`

Selectors 不包含 customer mobile、raw LINE user id、token、password 或 secret。

## Browser Smoke Script

新增：

```bash
scripts/smoke/browser/071_multi_dispatch_browser_smoke.js
```

新增 npm script：

```bash
npm run smoke:071:browser
```

此 script 使用 Playwright，但不建立 Playwright config / suite / fixtures 目錄，也不引入大型 E2E platform。第一版只服務 Task 071。

## 環境變數

| Env | 用途 | Default |
| --- | --- | --- |
| `ADMIN_BASE_URL` | Admin frontend URL | `http://127.0.0.1:5173` |
| `API_BASE_URL` | Backend API URL | `http://localhost:3000` |
| `ADMIN_EMAIL` | Admin login email | `admin@example.com` |
| `ADMIN_PASSWORD` | Admin login password | `ChangeMe123!` |
| `HEADLESS` | Headless browser | `true` |
| `SLOW_MO` | Playwright slow motion ms | `0` |
| `BROWSER_CHANNEL` | Browser channel | `chrome` |

建議執行方式：

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

另開 terminal：

```bash
ADMIN_BASE_URL=http://127.0.0.1:5173 \
API_BASE_URL=https://onsite-service-api.zeabur.app \
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD='ChangeMe123!' \
npm run smoke:071:browser
```

## Smoke Flow

Script 驗證：

1. API login。
2. API 建立 Task071 fixture。
3. Browser login。
4. 開啟 `/cases?caseId=<caseId>`。
5. 等待 case detail panel。
6. 等待 dispatch / appointment panel。
7. 等待 visit history section。
8. 開啟第一筆 appointment result modal。
9. 將第一筆 appointment 更新為：
   - `visitResult=pending_parts`
   - `nextAction=wait_for_parts`
   - `incompleteReason=Task071 pending parts browser smoke`
10. 驗證 visit history 顯示缺料 / 等待零件 / incomplete reason。
11. 使用 stable datetime selectors 建立第二筆 appointment。
12. 透過 API list 找到第二筆 appointment id，作為後續 browser selector target。
13. 開啟第二筆 appointment result modal。
14. 將第二筆 appointment 更新為：
   - `visitResult=completed`
   - `nextAction=no_action`
   - actual arrival / finished time
15. 建立 Field Service Report。
16. 將 Field Service Report 更新為 `serviceStatus=completed`。
17. 驗證 final appointment hint 顯示。
18. 接受 completion confirmation dialog。
19. 驗證 final marker 顯示。
20. 驗證 case status completed。
21. 驗證 billing empty state。
22. 驗證 close workflow still present，沒有自動 close case。

## API Fixture Helper

Fixture helper 內建在 Task 071 script，避免一次抽象成大型測試平台。

測試資料前綴：

- `Task071`
- `browser-smoke`

Fixture 會留在測試環境，目前沒有自動 cleanup。後續若 browser smoke 進入高頻執行，需另設 cleanup strategy。

## Redaction / Logging

Script 只輸出：

- step name
- PASS / FAIL
- caseNo
- caseId
- appointment id
- non-sensitive status

Script 不輸出：

- password
- token
- secret
- full payload
- customer mobile
- raw LINE user id

API error summary 會經過 redaction helper。

## 為何不建立大型 E2E Infrastructure

本階段目標是把 Task 069 的 manual full flow 變成可重複的最小 smoke，而不是一次導入完整 E2E 平台。

保守做法可以：

- 降低維護成本。
- 保持失敗訊號聚焦。
- 避免把 fixture / cleanup / CI / local DB setup 一次做太大。
- 讓 selectors 與核心流程先穩定。

## 驗證結果

本任務完成後需執行：

- `npm run admin:check`
- `npm run admin:build`
- `npm run check`
- `npm run smoke:071:browser`
- `npm run smoke:029`
- `npm run smoke:028`

`smoke:071:browser` 需要 local admin frontend 已啟動，且 `ADMIN_BASE_URL` 指向該 frontend。

實作驗證結果：

- `npm run smoke:071:browser`：PASS，9 / 9。
- Browser smoke 使用 API 建 fixture，再由 browser 從 `/cases?caseId=<caseId>` 驗證 appointment result update、第二筆 appointment 建立、Field Service Report completed 與 final marker。
- 建立 Field Service Report 由 browser submit 觸發；script 會等待 POST response，確認 `serviceStatus=in_progress` 後 reload case detail，使後續 edit/completion form 穩定。
- 完成 Field Service Report 時，script 會等待 PATCH response 並確認 response `serviceStatus=completed`，再驗證 final marker、case status、billing empty state 與 close workflow still present。

## 已知限制

- 第一版 browser smoke 依賴 Playwright 與本機 Chrome channel。
- 第一版不負責啟動 Vite dev server。
- 第一版不做 cleanup。
- 第一版不測完整 UI 建 customer / case / dispatch 流程。
- 負向 backend guard 仍由 `smoke:028` / `smoke:029` 覆蓋。
- manual finalAppointmentId override 尚未實作。
- appointment-scoped attachments / photos / signatures 仍暫緩。

## 下一步建議

建議下一步做：

**Task 072 - Browser Smoke Stabilization / Selector Gap Follow-up**

重點：

- 觀察 Task 071 在不同執行環境的穩定度。
- 決定是否補 cleanup。
- 決定是否讓 script 可選擇 local API / Zeabur API。
- 若 Task 071 穩定，再考慮少量 negative browser assertions。
