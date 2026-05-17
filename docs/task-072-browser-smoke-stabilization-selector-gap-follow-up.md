# Task 072 - Browser Smoke Stabilization / Selector Gap Follow-up

## 功能範圍

本任務針對 Task 071 第一版 multi-dispatch browser smoke 做小範圍穩定化盤點與修補。

本任務只處理 browser smoke 可測性、selector gap、錯誤定位與 runbook：

- 不新增大型 E2E infrastructure。
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

## Task 071 Smoke Review 結果

檢查範圍：

- `scripts/smoke/browser/071_multi_dispatch_browser_smoke.js`
- `package.json` 的 `smoke:071:browser`
- `admin/src/pages/CaseManagementPage.tsx` 中 Task 071 / Task 068 selectors
- `docs/task-071-multi-dispatch-browser-smoke-minimal-implementation.md`

確認結果：

- Browser smoke 已使用 API fixture + browser key UI strategy。
- Script 已有 redaction helper，不輸出 password、token、secret、mobile、raw LINE user id、full payload。
- Browser context / browser 已在 `finally` 中關閉。
- `HEADLESS`、`SLOW_MO`、`BROWSER_CHANNEL` 已由 env 控制。
- 第一版 failure message 對 API response 已有 redacted summary。
- 需要補強的是 local Vite 未啟動、env URL 無效、成功 notice stale text、final marker refresh 等瀏覽器穩定性問題。

## 補充的 Selectors

本任務只補 Task 071 實際穩定性需要的 selector：

- `data-testid="notice-message"`
- `data-testid="appointment-create-error"`
- `data-testid="appointment-result-error"`
- `data-testid="service-report-error"`

未補 selector：

- `service-report-completion-confirm`：目前完成確認是 native `window.confirm`，browser smoke 透過 dialog handler 接受並記錄，不需要 DOM selector。
- `timeline-list`：Task 071 smoke 目前不直接 assert timeline list。
- `close-workflow-status`：已有 `data-testid="case-close-status"`。
- `case-completed-at`：目前以 case status completed 與 final marker 作為最小驗證，不增加額外 selector。

## Browser Smoke Script 穩定化

本任務對 `scripts/smoke/browser/071_multi_dispatch_browser_smoke.js` 做以下小修：

- 新增 preflight config / endpoint 檢查。
- `ADMIN_BASE_URL` / `API_BASE_URL` 需為有效 URL。
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` 不可為空。
- 執行 browser flow 前先確認 Admin frontend URL reachable。
- 執行 browser flow 前先確認 Backend API URL reachable。
- Vite 未啟動時會提示啟動 local Vite 或修正 `ADMIN_BASE_URL`。
- 成功通知改用 `notice-message` selector，並等待文字符合目標內容，避免讀到上一個 stale notice。
- Field Service Report edit form 會先確認 diagnosis / repair action 已回填，再填 repair result。
- `repairResult` 填值改成 small retry，避免剛 reload 後 React state 尚未穩定時被覆蓋。
- final marker 驗證先等待正常 UI refresh；若 timeout，reload case detail 後再驗證最終狀態。

## Runbook

Terminal A：啟動 local admin frontend，指向 Zeabur API。

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

Terminal B：執行 browser smoke。

```bash
ADMIN_BASE_URL=http://127.0.0.1:5173 \
API_BASE_URL=https://onsite-service-api.zeabur.app \
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD='<admin password>' \
npm run smoke:071:browser
```

注意：

- 如果 Vite 顯示的 port 不是 `5173`，`ADMIN_BASE_URL` 必須跟著改，例如 `http://127.0.0.1:5175`。
- `HEADLESS=false` 可觀察 browser。
- `SLOW_MO=100` 可降低操作速度。
- 預設 `BROWSER_CHANNEL=chrome`。
- 如果本機沒有 Chrome channel，可嘗試依環境改 `BROWSER_CHANNEL`，但目前第一版以本機 Chrome 為主。
- 不要把 password、token、secret 寫入文件或 commit。

## 重跑結果

本任務執行 local Vite：

- Admin frontend：`http://127.0.0.1:5175`
- Backend API：`https://onsite-service-api.zeabur.app`

第一次觀察到的穩定性問題：

- `notice-message` 初版等待只確認 visible，曾讀到上一個「到府結果已更新。」notice，導致建立第二筆 appointment 後等待「預約已建立」失敗。
- 修正：等待同一個 selector 的文字符合目標 pattern。

第二次觀察到的穩定性問題：

- 建立 service report 後，edit form reload 回填偶發尚未穩定，`repairResult` 填值後被空值覆蓋。
- 修正：等待 diagnosis / repair action 回填後再填 repair result，並加入 small retry。

第三次觀察到的穩定性問題：

- 完成 service report 後，final marker 曾在 20 秒內未顯示。
- 修正：先等正常 UI refresh；若 final marker 未出現，reload case detail 後再驗證。

穩定化後重跑：

- `npm run smoke:071:browser`：PASS，10 / 10。
- 第二次 `npm run smoke:071:browser`：PASS，10 / 10。
- 兩次穩定化後重跑皆未觀察到 flaky。
- 兩次 `finalMarkerReloaded` 皆為 `false`，表示最終 marker 正常由 UI refresh 顯示。

## Check / Build / Smoke 結果

本任務驗證結果：

- `npm run admin:check`：PASS。
- `npm run admin:build`：PASS。
- `npm run check`：PASS。
- `npm run smoke:071:browser`：PASS，10 / 10。
- 第二次 `npm run smoke:071:browser`：PASS，10 / 10。
- `npm run smoke:029`：PASS，12 / 12，against Zeabur API。
- `npm run smoke:028`：PASS，13 / 13，against Zeabur API。

## Cleanup 策略盤點

Task 071 / Task 072 browser smoke 目前不做自動 cleanup，fixture 會留在測試環境。

如果未來高頻執行，建議評估：

1. 透過 API soft delete smoke-created cases / appointments，如 API 支援。
2. DB cleanup 僅限 test env，避免在 shared / production-like Zeabur runtime 直接清資料。
3. 使用 `Task071` / `browser-smoke` prefix 與 `createdAt` 篩選後人工清理。

本任務不直接新增 DB cleanup。

## 環境策略盤點

第一版推薦：

- local Vite + Zeabur API。
- 優點：最接近目前手動 QA 環境，且不需要部署 admin frontend。
- 注意：需手動確認 Vite port，並設定 `ADMIN_BASE_URL`。

後續可評估：

- local Vite + local API / local DB：適合作為 CI 方向，但需要完整 local DB / seed / migration runbook。
- deployed admin frontend + Zeabur API：適合 release QA，但需先有 dedicated admin frontend deployment 與正確 CORS / auth 設定。

## 安全檢查

已確認：

- Script 不輸出 `ADMIN_PASSWORD`。
- Script 不輸出 token / secret。
- Script 不輸出 full payload。
- Script 不輸出 customer mobile。
- Script 不輸出 raw LINE user id。
- Browser URL 只使用 `/cases?caseId=<caseId>`，不放 appointmentId / finalAppointmentId / customer mobile / customerId / raw lineUserId。
- Appointment result flow 不顯示 audit logs / AI raw payload / OCR raw output / billing data。
- AI 不參與 visitResult 判斷。
- Smoke 不建立多份 Field Service Report。

## 一案一份 Field Service Report 確認

本任務沒有修改 field_service_reports schema、unique index、backend completion guard 或 service report 建立邏輯。

Browser smoke 仍以一個 case 建立一份正式 Field Service Report，並在 completed 時驗證 final appointment marker 與 case completed 狀態。

## 已知限制

- 仍不是大型 E2E framework。
- Browser smoke 仍依賴 local Vite 與本機 Chrome channel。
- Browser smoke 不負責啟動 Vite dev server。
- Browser smoke 不做 cleanup。
- Browser smoke 不測完整 UI 建 customer / case / dispatch 流程。
- 負向 backend guard 仍主要由 `smoke:028` / `smoke:029` 覆蓋。
- manual finalAppointmentId override 尚未實作。
- appointment-scoped attachments / photos / signatures 仍暫緩。

## 下一步建議

建議下一步做：

**Task 073 - Browser Smoke Cleanup / Test Data Lifecycle Planning**

重點：

- 設計 smoke-created fixture lifecycle。
- 決定是否需要 API soft-delete helper。
- 明確區分 Zeabur shared runtime 與未來 local/CI test DB 的 cleanup 規則。
- 保持 browser smoke 小型，不擴成大型 E2E platform。
