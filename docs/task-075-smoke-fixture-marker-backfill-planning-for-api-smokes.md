# Task 075 - Smoke Fixture Marker Backfill Planning for API Smokes

## 功能範圍

本任務針對既有 API smoke scripts 規劃 `SMOKE_RUN_ID` backfill，目標是讓 smoke-created fixture 可以用一致 marker 搜尋與人工 review。

本任務只做 planning / design：

- 不一次修改全部 smoke。
- 不實作 cleanup。
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

## 現有 API Smoke Marker 盤點

### smoke:028

Script：

- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`

目前 marker pattern：

- `stamp = Date.now() + random`
- organization code：`task028-org-<stamp>`
- dispatch unit code：`task028-du-<stamp>`
- customer names：`Task028 Multi Dispatch Customer` / `Task028 Cross Case Customer`
- customer mobile test prefix：`090028...` / `090128...`
- case modelNo：`T028-<marker>`
- case problemDescription：`Task028 multi dispatch guard smoke <marker>`
- dispatch assignment note：`Task028 dispatch <marker>`
- appointment note：`Task028 appointment <sequence>`
- service report fields：`Task028 初步診斷`, `Task028 第二次到府完修`

會建立：

- organization
- dispatch unit
- primary customer / case
- cross-case customer / case
- dispatch assignment
- first appointment
- second appointment
- cross-case appointment
- one field service report
- timeline / audit logs

Redaction / masking：

- 有 `redact()`，遮蔽 key 包含 password / token / secret / mobile。
- 沒有 raw LINE user id 類資料。

Cleanup / unlink：

- 沒有 cleanup。
- 沒有 destructive 行為。

Backfill suitability：

- 優先 backfill。
- 與 multi-dispatch 主線直接相關。
- 不牽涉 DB fixture fallback。

### smoke:029

Script：

- `scripts/smoke/029_single_open_appointment_guard_smoke.js`

目前 marker pattern：

- `stamp = Date.now() + random`
- organization code：`task061-org-<stamp>`
- dispatch unit code：`task061-du-<stamp>`
- customer names：`Task061 Guard Customer` / `Task061 Cross Case Customer`
- customer mobile test prefix：`090061...` / `090161...`
- case modelNo：`T061-<marker>`
- case problemDescription：`Task061 single open appointment guard smoke <marker>`
- appointment note：`Task061 appointment <sequence>`
- reschedule reason：`Task061 reschedule same appointment`
- service report fields：`Task061 初步診斷`, `Task061 第二次到府完修`

會建立：

- organization
- dispatch unit
- primary customer / case
- cross-case customer / case
- dispatch assignment
- first appointment
- second appointment
- cross-case appointment
- one field service report
- timeline / audit logs

Redaction / masking：

- 有 `redact()`，遮蔽 password / token / secret / mobile。
- 有 `hasSensitiveKey()`，確認 error response 不包含 sensitive keys。

Cleanup / unlink：

- 沒有 cleanup。
- 沒有 destructive 行為。

Backfill suitability：

- 最高優先之一。
- 與 Task061 single-open appointment guard 直接相關。
- npm script 是 `smoke:029`，但任務語意是 Task061，marker 應同時反映兩者。

### smoke:046

Script：

- `scripts/smoke/046_line_inquiry_fixture_smoke.js`

目前 marker pattern：

- `stamp = Date.now() + random`
- organization code：`task046-org-<stamp>`
- LINE channel code：`task046-line-channel-<stamp>`
- channel id：`task046-channel-<stamp>`
- line user id test prefix：`Utask046test...`
- wrong line user id test prefix：`Utask046wrong...`
- customerName：`Task046 Test Customer`
- case modelNo：`T046`
- case problemDescription：`Task046 LINE inquiry fixture case`
- displayName：`Task046 LINE Fixture User`

會建立：

- organization
- LINE channel
- customer
- case
- customer LINE identity
- public LINE inquiry reads
- audit logs for supported admin actions

DB fixture fallback：

- 若 `USE_DB_LINE_IDENTITY_FIXTURE=1`，會使用 `DATABASE_URL` 直接 insert `customer_line_identities`。
- 這是因為當時沒有 admin customer_line_identity fixture API，或需 fallback。

Redaction / masking：

- 有 `mask()`，log 只顯示 masked line user id。
- 有 `assertNoInternalOnlyFields()`。
- Admin API link response 若回傳 raw `lineUserId` 會 fail。

Cleanup / unlink：

- 沒有 cleanup。
- DB fallback 不 cleanup。

Backfill suitability：

- 第二批。
- 需特別避免將 raw `lineUserId` 當 cleanup marker。
- DB fallback displayName 可放 smoke marker，但 raw line user id 仍需 mask。

### smoke:047

Script：

- `scripts/smoke/047_line_identity_admin_api_smoke.js`

目前 marker pattern：

- `stamp = Date.now() + random`
- org A code：`task047-org-a-<stamp>`
- org B code：`task047-org-b-<stamp>`
- channel A code：`task047-line-a-<stamp>`
- channel B code：`task047-line-b-<stamp>`
- channel ids：`task047-channel-a/b-<stamp>`
- line user id test prefix：`Utask047test...`
- wrong line user id test prefix：`Utask047wrong...`
- customer names：`Task047 Test Customer A/B`
- case modelNo：`T047-A/B`
- case problemDescription：`Task047 LINE identity admin API smoke A/B`
- displayName：`Task047 LINE Fixture User`

會建立：

- organization A / B
- LINE channel A / B
- customer A / B
- case A / B
- customer LINE identity
- public LINE inquiry reads
- unlink customer LINE identity
- audit logs for supported admin actions

Redaction / masking：

- 有 `mask()`，log 只顯示 masked line user id。
- 有 `assertNoInternalOnlyFields()`。
- `lineUserId` 列為 internal-only key。

Cleanup / unlink：

- 有 unlink identity 驗證，這是產品行為測試，不是 cleanup。
- 不 cleanup organizations / channels / customers / cases。

Backfill suitability：

- 第二批。
- org A / B、channel A / B、customer A / B 應使用同一 `smokeRunId`。

### smoke:027e

Script：

- `scripts/smoke/027e_permission_regular_user_smoke.js`

目前 marker pattern：

- `stamp = Date.now() + random`
- prefix：`task027e-<stamp>`
- organization code：`<prefix>-org-a/b`
- dispatch unit code：`<prefix>-du-a/b`
- regular user email：`task027e-regular-a-<stamp>@example.com`
- disabled user email：`task027e-disabled-<stamp>@example.com`
- role metadata：`{ task: '027E', fixture: true }`

會建立：

- limited fixture role through DB
- role permissions
- organization A / B
- dispatch unit A / B
- regular user
- disabled user
- role assignment / organization membership records

DB fixture fallback:

- 需要 `DATABASE_URL` 建立 limited fixture role。
- 直接操作 roles / role_permissions。

Redaction / masking：

- 有 `assertNoPasswordHash()`。
- Login / payload 不應輸出 password hash。

Cleanup / unlink：

- 沒有 cleanup。
- 不刪 roles / users / permissions。

Backfill suitability：

- 最後做。
- 牽涉 role / permission / user fixture，最高風險。

### smoke:071:browser 參考

Task071 已完成：

- 支援 `SMOKE_RUN_ID`。
- 未提供時自動產生 `YYYYMMDD-HHMMSS-random`。
- Normalize `SMOKE_RUN_ID`。
- 使用 `Task071 browser-smoke <smokeRunId>`。
- 將 marker 寫入 safe text fields。
- `CLEANUP=1` 只輸出安全提示，不執行 cleanup。
- Log 顯示 `smokeRunId`，不顯示 password / token / mobile / raw LINE user id / full payload。

## 共用 Marker Helper 草案

建議未來建立：

```text
scripts/smoke/helpers/smokeMarker.js
```

建議 API：

```js
function createSmokeRunId(date = new Date())
function normalizeSmokeRunId(input)
function shortSmokeRunId(runId, maxLength = 16)
function buildSmokePrefix(taskCode, smokeName, runId)
function createSmokeMarker({ taskCode, smokeName, runId })
```

設計要求：

- 不依賴 browser。
- 可供 API smoke 與 browser smoke 共用。
- 不輸出敏感資料。
- 不使用 customer mobile / raw LINE user id 作 marker。
- 對 code 類欄位輸出 lowercase / hyphen safe string。
- 對 display text 類欄位輸出可讀 prefix，例如 `Task061 smoke029 manual-test`。
- 不做 cleanup。
- 不連 DB。

本任務只文件化 helper 草案，不建立 helper，原因：

- 避免一次修改所有 smoke。
- 先讓 backfill 設計收斂。
- 下一步可以先在 smoke:028 / smoke:029 小範圍驗證共用 helper，再推到 LINE / permission smoke。

## smoke:028 Backfill 設計

建議最小修改：

- 支援 `SMOKE_RUN_ID`。
- 使用 common marker helper，或先 inline Task071 同款 helper。
- marker：

```text
Task028 smoke <smokeRunId>
```

建議寫入欄位：

- organizationCode：`task028-org-<smokeRunId>`
- organizationName：`Task028 Multi Dispatch Guard Organization <smokeRunId>`
- dispatchUnitCode：`task028-du-<smokeRunId>`
- dispatchUnitName：`Task028 Dispatch Unit <smokeRunId>`
- customerName：`Task028 Multi Dispatch Customer <smokeRunId>`
- otherCustomerName：`Task028 Cross Case Customer <smokeRunId>`
- case modelNo：`T028-<shortSmokeRunId>-<marker>`
- case problemDescription：`Task028 smoke <smokeRunId> multi dispatch guard <marker>`
- dispatch assignment note：`Task028 smoke <smokeRunId> dispatch <marker>`
- appointment note：`Task028 smoke <smokeRunId> appointment <sequence>`
- workflow transition note：`Task028 smoke <smokeRunId> <action>`
- service report diagnosisResult：`Task028 smoke <smokeRunId> diagnosis`
- service report repairAction：`Task028 smoke <smokeRunId> repair action`
- service report repairResult：`Task028 smoke <smokeRunId> repair result`

不改：

- service report completion guard 驗證邏輯。
- finalAppointmentId negative / positive assertions。
- one active FSR assertion。
- customer mobile test value pattern，且不拿 mobile 當 marker。

## smoke:029 Backfill 設計

注意：

- npm script 是 `smoke:029`。
- 任務語意是 Task061 single-open appointment guard。

建議 marker：

```text
Task061 smoke029 <smokeRunId>
```

建議寫入欄位：

- organizationCode：`task061-smoke029-org-<smokeRunId>`
- organizationName：`Task061 Smoke029 Single Open Appointment Guard Organization <smokeRunId>`
- dispatchUnitCode：`task061-smoke029-du-<smokeRunId>`
- dispatchUnitName：`Task061 Smoke029 Dispatch Unit <smokeRunId>`
- customerName：`Task061 Smoke029 Guard Customer <smokeRunId>`
- otherCustomerName：`Task061 Smoke029 Cross Case Customer <smokeRunId>`
- case modelNo：`T061-<shortSmokeRunId>-<marker>`
- case problemDescription：`Task061 smoke029 <smokeRunId> single open appointment guard <marker>`
- dispatch assignment note：`Task061 smoke029 <smokeRunId> dispatch <marker>`
- appointment note：`Task061 smoke029 <smokeRunId> appointment <sequence>`
- rescheduleReason：`Task061 smoke029 <smokeRunId> reschedule same appointment`
- incompleteReason：`Task061 smoke029 <smokeRunId> pending parts`
- service report diagnosisResult：`Task061 smoke029 <smokeRunId> diagnosis`
- service report repairAction：`Task061 smoke029 <smokeRunId> repair action`
- engineerNote：`Task061 smoke029 <smokeRunId> engineer note`
- repairResult：`Task061 smoke029 <smokeRunId> final repair result`

不改：

- single-open guard 409 assertion。
- reschedule same appointment assertion。
- terminal visitResult 後可建立第二筆 assertion。
- cross-case independent assertion。
- service report finalAppointmentId completion assertion。

## smoke:046 Backfill 設計

建議 marker：

```text
Task046 smoke <smokeRunId>
```

建議寫入欄位：

- organizationCode：`task046-org-<smokeRunId>`
- organizationName：`Task046 LINE Inquiry Fixture Organization <smokeRunId>`
- channelCode：`task046-line-channel-<smokeRunId>`
- channelName：`Task046 LINE Inquiry Test Channel <smokeRunId>`
- channelId：`task046-channel-<smokeRunId>`
- customerName：`Task046 Test Customer <smokeRunId>`
- case modelNo：`T046-<shortSmokeRunId>`
- case problemDescription：`Task046 smoke <smokeRunId> LINE inquiry fixture case`
- LINE identity displayName：`Task046 LINE Fixture User <smokeRunId>`

DB fallback:

- `USE_DB_LINE_IDENTITY_FIXTURE=1` 時，DB insert 的 `display_name` 也應帶 marker。
- 不改 raw `lineUserId` 測試語意。
- 不輸出 raw `lineUserId`。

不改：

- public LINE inquiry success / generic failure assertions。
- internal-only key checks。
- Admin API vs DB fallback behavior。

## smoke:047 Backfill 設計

建議 marker：

```text
Task047 smoke <smokeRunId>
```

建議寫入欄位：

- org A code：`task047-org-a-<smokeRunId>`
- org B code：`task047-org-b-<smokeRunId>`
- org A / B name：append `<smokeRunId>`
- channel A code：`task047-line-a-<smokeRunId>`
- channel B code：`task047-line-b-<smokeRunId>`
- channel A / B name：append `<smokeRunId>`
- channel A / B channelId：append `<smokeRunId>`
- customer A / B name：`Task047 Test Customer A/B <smokeRunId>`
- case A / B modelNo：`T047-A/B-<shortSmokeRunId>`
- case A / B problemDescription：`Task047 smoke <smokeRunId> LINE identity admin API smoke A/B`
- identity displayName：`Task047 LINE Fixture User <smokeRunId>`

注意：

- org A / B 使用同一 `smokeRunId`。
- channel A / B 使用同一 `smokeRunId`。
- customer A / B 使用同一 `smokeRunId`。
- identity unlink 後，仍可透過 org / channel / customer / case marker 人工追查。

不改：

- idempotent link assertion。
- same line user conflict assertion。
- cross-organization assertion。
- unlink disables public inquiry assertion。

## smoke:027e Backfill 設計

建議 marker：

```text
Task027E smoke <smokeRunId>
```

建議寫入欄位：

- prefix：`task027e-<smokeRunId>`
- roleKey：`task027e-limited-<shortSmokeRunId>`
- role name：`Task 027E Limited Smoke Role <smokeRunId>`
- role description：append marker。
- role metadata：

```json
{
  "task": "027E",
  "fixture": true,
  "smokeRunId": "<smokeRunId>",
  "smokePrefix": "Task027E smoke <smokeRunId>"
}
```

- organization codes：`task027e-<smokeRunId>-org-a/b`
- dispatch unit codes：`task027e-<smokeRunId>-du-a/b`
- regular user email：`task027e-regular-a-<smokeRunId>@example.com`
- disabled user email：`task027e-disabled-<smokeRunId>@example.com`

注意：

- 027e 涉及 roles / users / permissions / org assignments。
- cleanup 必須最保守。
- 不應在 shared runtime 自動刪 roles / users / permissions。

不改：

- permission isolation assertions。
- regular user / disabled user behavior。
- password hash leak checks。
- DB role fixture behavior。

## Backfill 優先順序

建議分批：

1. **Task076 - Backfill smoke:029 + smoke:028 marker**
   - 與 multi-dispatch 主線直接相關。
   - 不涉及 LINE raw id。
   - 不涉及 roles / users / permissions。
   - 風險最低，驗證最直接。

2. **Task077 - Backfill smoke:046 + smoke:047 marker**
   - LINE identity 類，需要更小心 raw lineUserId masking。
   - 046 有 DB fallback，需確認 displayName marker 但 raw lineUserId 不輸出。

3. **Task078 - Backfill smoke:027e marker**
   - 涉及 roles / users / permissions。
   - 需要 DATABASE_URL。
   - 最高風險，最後做。

4. **Task079+ - Cleanup inventory / dry-run planning**
   - 只做 dry-run inventory。
   - 不在 shared Zeabur runtime destructive cleanup。

## Cleanup 保留規則

本任務與後續 marker backfill 應遵守：

- 不做 cleanup。
- 不實作 destructive cleanup。
- 不在 Zeabur shared runtime 刪資料。
- 不把 cleanup 設為預設自動執行。
- `CLEANUP` env 若加入，只能預設 false。
- `CLEANUP=1` 第一階段只能輸出安全提示，不實際刪資料。
- local / CI cleanup 必須另開獨立 task 設計。
- cleanup 不得使用 customer mobile / raw LINE user id 作條件。

## 安全 / Redaction 規則

Backfill 時必須維持：

- 不輸出 token。
- 不輸出 password。
- 不輸出 secret。
- 不輸出 full payload。
- 不輸出 customer mobile。
- 不輸出 raw LINE user id。
- LINE scripts 只能輸出 masked line user id。
- Error response summary 必須走 redaction。
- 不用 customer mobile / raw LINE user id 作 cleanup marker。

## 為何不一次改全部 Smoke

不一次改全部 smoke，原因：

- 028 / 029 是 multi-dispatch 主線，應先穩定。
- 046 / 047 涉及 LINE identity，raw lineUserId masking 風險較高。
- 027e 涉及 roles / users / permissions，且使用 DATABASE_URL，風險最高。
- 分批可讓每次修改後跑對應 smoke，失敗範圍更清楚。
- Marker helper 若要共用，應先在低風險 smoke 驗證再推廣。

## 下一步 Task 076 建議

建議下一步：

**Task 076 - Backfill smoke:029 + smoke:028 SMOKE_RUN_ID Marker**

範圍：

- 可先建立 `scripts/smoke/helpers/smokeMarker.js`。
- 將 smoke:029 與 smoke:028 接上 helper。
- 支援 `SMOKE_RUN_ID`。
- Marker 寫入 safe text fields。
- 不做 cleanup。
- 不改 smoke 驗證邏輯。

驗證：

- `npm run check`
- `npm run smoke:029`
- `npm run smoke:028`

不需要：

- `admin:check`
- `admin:build`

除非同時碰 admin frontend。
