# Task 068 — Admin Frontend Multi-dispatch Browser QA Follow-up / Date Input Stabilization

## 功能範圍

本任務是 Task 067 browser manual QA 的 follow-up，目標是改善 appointment datetime input 的可測性與手動 QA 穩定性。

本任務只做 admin frontend 小範圍 UX / QA stabilization：

- appointment create datetime input accessibility / test selector 補強
- appointment edit / reschedule datetime input accessibility / test selector 補強
- appointment result actual time input accessibility / test selector 補強
- appointment create form 的 manual QA help text 補強
- 記錄 local Vite 指向 Zeabur API 的 browser QA 結果

本任務不新增 migration、不修改 backend API、不修改 appointment enum、不修改 single-open appointment guard、不修改 Field Service Report completion guard、不改一案一份 Field Service Report 原則，也不新增 AI 自動判斷。

## 背景與問題

Task 067 已完成 local Vite 指向 Zeabur API 的 browser manual QA，但完整 click-through 沒有跑到第二筆 appointment create 與 Field Service Report 完修。

主要阻礙是 browser-native `datetime-local` input 在目前 desktop/browser automation 環境中呈現為分段式控制，直接對 input 做 value 設定不穩定。這導致 appointment create form 的 `scheduledStartAt` / `scheduledEndAt` 不容易由測試者或 automation 穩定填入。

這不是 backend API 或 single-open guard 的問題。`smoke:029` 與 `smoke:028` 已覆蓋 backend multi-dispatch flow。

## 實作調整

### Appointment Create Datetime Inputs

`scheduledStartAt` 與 `scheduledEndAt` 保留原生 `datetime-local` input，不引入大型 date picker。

本任務補上：

- 清楚的 `id`
- `name`
- `aria-label`
- `aria-describedby`
- `placeholder`
- `step={60}`
- `data-testid`
- `data-qa`

新增 selectors：

- `data-testid="appointment-create-start"`
- `data-testid="appointment-create-end"`

新增 help text：

```text
請選擇預約開始與結束時間。若要建立下一筆預約，上一筆到府需先有完成、缺料、客戶不在、需報價、未到或取消等結果。
```

### Appointment Edit / Reschedule Datetime Inputs

`scheduledStartAt` 與 `scheduledEndAt` 的 edit / reschedule fields 同樣補上 accessibility 與 test selectors。

新增 selectors：

- `data-testid="appointment-edit-start"`
- `data-testid="appointment-edit-end"`

新增 help text：

```text
改期仍是更新同一筆 appointment，不會建立新的到府紀錄。
```

### Appointment Result Actual Time Inputs

appointment result modal 的 `actualArrivalAt` / `actualFinishedAt` 也補上 accessibility 與 test selectors。

新增 selectors：

- `data-testid="appointment-result-arrival"`
- `data-testid="appointment-result-finished"`

新增 help text：

```text
實際時間可留空；若同時填寫，到場時間不可晚於完成時間。
```

## Datetime Format

本任務保留既有 datetime conversion 行為。

Frontend input value 仍使用 browser `datetime-local` 可接受格式：

```text
YYYY-MM-DDTHH:mm
```

送 API 前仍沿用既有 conversion helper，不改 backend expected datetime format。

## Browser QA Result

環境：

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

local Vite URL：

```text
http://127.0.0.1:5175/
```

測試 case：

```text
TW-20260517-660827
```

已確認：

- `/cases?caseId=...` 可開啟 case detail
- Dispatch / Appointment panel 可載入
- open appointment readiness hint 顯示
- appointment create form single-open guidance 顯示
- 新增 datetime help text 顯示
- accessibility tree 可辨識 `新增預約開始時間` / `新增預約結束時間`
- `data-testid` selectors 可用於穩定填入 native datetime input
- 使用 selector 填入 `2026-05-18T10:00` / `2026-05-18T11:00` 後，input value 正確更新
- 第一筆 appointment 尚未 terminal 時嘗試建立下一筆 appointment，backend 回 409
- UI 正確顯示 backend error message 與 recovery guidance

已驗證 409 文案：

```text
此案件已有尚未結束的到府預約，請先完成、取消或標記結果後再建立下一筆預約。
```

並顯示補充 guidance：

```text
這是為了避免同一案件同時有多筆未結束 appointment。請先在上一筆到府紀錄中更新到府結果，再建立下一筆預約。
```

## QA Selector Example

若 browser automation 無法直接操作 native `datetime-local` segmented control，可使用 selector-driven DOM event 方式填值：

```js
const set = (el, value) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
};

set(document.querySelector('[data-testid="appointment-create-start"]'), '2026-05-18T10:00');
set(document.querySelector('[data-testid="appointment-create-end"]'), '2026-05-18T11:00');
```

這只是 QA / automation 輔助方式，不是產品功能。

## 未完成 Browser Flow

本任務沒有重新完整跑完：

- 第一筆 appointment 標記 pending_parts
- 建立第二筆 appointment
- 第二筆 appointment 標記 completed
- Field Service Report 完修
- finalAppointmentId marker 顯示

原因：

- 本任務重點是修正 Task 067 的 datetime input 可測性阻礙。
- backend multi-dispatch flow 已由 `smoke:029` 覆蓋。
- Field Service Report completion guard 已由 `smoke:028` / `smoke:029` 覆蓋。

下一輪若需要完整 browser flow，可直接使用本任務新增的 selectors 進行更穩定操作。

## 安全檢查

本任務沒有新增任何 sensitive logging。

確認：

- 不 hardcode Zeabur domain 到 source code
- 不 console.log token / password / secret
- 不 console.log customer mobile / raw LINE user id / full payload
- 不把 appointmentId / finalAppointmentId / customer mobile / customerId / raw lineUserId 放進 URL
- appointment result flow 不顯示 audit logs / AI raw payload / OCR raw output / billing data
- 不產生多份 Field Service Report
- AI 不參與 visitResult 判斷

## 一案一份正式 Field Service Report 確認

本任務不修改 Field Service Report 資料模型與 workflow。

仍維持：

- 一個 Case 可以有多筆 appointments / visits
- 一個 Case 只有一份正式 active Field Service Report
- `field_service_reports.case_id` active unique index 應保留
- appointment result update 不會建立 service report
- datetime input stabilization 不影響 finalAppointmentId backend guard

## 已知限制

- 原生 `datetime-local` 在不同 browser / automation 工具中仍可能呈現分段式控制。
- 本任務改善 selector / accessibility，不改用 custom date picker。
- 目前仍沒有 Playwright / browser automation infrastructure。
- manual finalAppointmentId override 尚未實作。
- appointment result update UI 不處理 attachments / photos / signatures。
- AI 不參與 visitResult 判斷。

## 下一步建議

建議下一步：

Task 069 — Multi-dispatch Browser QA Full Flow Re-run with Stable Selectors

範圍建議：

- 使用 Task 068 新增的 datetime selectors
- 重新跑完整 browser click-through：
  - first appointment pending_parts
  - second appointment completed
  - Field Service Report completed
  - finalAppointmentId marker
- 仍不新增大型 E2E infrastructure
- 若 browser QA 穩定，再評估 Task 070 — Admin Frontend Multi-dispatch E2E Test Planning
