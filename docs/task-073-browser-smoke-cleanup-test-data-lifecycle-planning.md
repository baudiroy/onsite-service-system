# Task 073 - Browser Smoke Cleanup / Test Data Lifecycle Planning

## 功能範圍

本任務設計 browser smoke 與 API smoke 的測試資料生命週期與 cleanup 策略，重點是 Task 071 / Task 072 browser smoke 目前會留下 fixture rows 的問題。

本任務只做 planning / inventory：

- 不直接寫 DB cleanup script。
- 不在 shared Zeabur runtime 做 destructive cleanup。
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

## 現有 Smoke Fixture 資料盤點

### smoke:028

Script：

- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`

會建立 / 產生：

- organization
- dispatch unit
- primary customer / case
- cross-case customer / case
- dispatch assignment
- first appointment
- second appointment
- cross-case appointment
- one field service report
- case workflow transitions：submit / review / accept / completed
- timeline / messages，由 workflow / service report completion 產生
- audit logs，由 create / update / workflow actions 產生

不會建立：

- billing record
- settlement record
- attachments / photos / signatures
- LINE channel / LINE identity

### smoke:029

Script：

- `scripts/smoke/029_single_open_appointment_guard_smoke.js`

會建立 / 產生：

- organization
- dispatch unit
- primary customer / case
- cross-case customer / case
- dispatch assignment
- first appointment
- second appointment
- cross-case appointment
- one field service report
- appointment reschedule / visitResult updates
- case workflow transitions：submit / review / accept / completed
- timeline / messages
- audit logs

不會建立：

- billing record
- settlement record
- attachments / photos / signatures
- LINE channel / LINE identity

### smoke:071:browser

Script：

- `scripts/smoke/browser/071_multi_dispatch_browser_smoke.js`

會建立 / 產生：

- organization
- dispatch unit
- customer
- case
- dispatch assignment
- first appointment
- second appointment
- one field service report
- appointment result updates through browser UI
- field service report completion through browser UI
- case workflow transitions：submit / review / accept / completed
- timeline / messages
- audit logs

不會建立：

- billing record
- settlement record
- attachments / photos / signatures
- LINE channel / LINE identity

### smoke:046

Script：

- `scripts/smoke/046_line_inquiry_fixture_smoke.js`

會建立 / 產生：

- organization
- LINE channel
- customer
- case
- customer LINE identity
- public LINE inquiry reads
- audit logs for supported admin actions

特殊事項：

- 若 `USE_DB_LINE_IDENTITY_FIXTURE=1`，會透過 `DATABASE_URL` 直接 insert `customer_line_identities`，因為該模式是 DB fixture fallback。
- Script 會 mask `lineUserId`，不應輸出 raw LINE user id。

### smoke:047

Script：

- `scripts/smoke/047_line_identity_admin_api_smoke.js`

會建立 / 產生：

- organization A
- organization B
- LINE channel A
- LINE channel B
- customer A / case A
- customer B / case B
- customer LINE identity
- public LINE inquiry reads
- unlink LINE identity
- audit logs for supported admin actions

特殊事項：

- Script 會測 `DELETE /api/v1/admin/customers/:customerId/line-identities/:identityId` unlink 行為。
- Unlink 是 soft state change，不是完整 cleanup organization / customer / case / channel。

### smoke:027e

Script：

- `scripts/smoke/027e_permission_regular_user_smoke.js`

會建立 / 產生：

- role through DB fixture
- role permissions
- organization A / B
- dispatch unit A / B
- regular user
- disabled user
- user roles / organization assignment records

特殊事項：

- 需要 `DATABASE_URL` 建立 limited fixture role。
- 這類 smoke 更不適合在 shared runtime 直接 DB cleanup，因為牽涉 permissions / users / roles。

## 目前 Prefix / Identity Pattern

目前 smoke scripts 已有基本 prefix，但尚未完全統一。

| Smoke | Prefix / identity pattern |
| --- | --- |
| `smoke:028` | `task028-org-<stamp>`, `task028-du-<stamp>`, `Task028 ...`, customer mobile `090028...` / `090128...`, notes contain `Task028` |
| `smoke:029` | `task061-org-<stamp>`, `task061-du-<stamp>`, `Task061 ...`, customer mobile `090061...` / `090161...`, notes contain `Task061` |
| `smoke:071:browser` | `task071-org-<stamp>`, `task071-du-<stamp>`, `Task071 Browser Smoke ...`, customer mobile `090071...`, notes contain `Task071 browser smoke` |
| `smoke:046` | `task046-org-<stamp>`, `task046-line-channel-<stamp>`, `Task046 ...`, `Utask046...`, customer mobile `090046...` |
| `smoke:047` | `task047-org-a-<stamp>`, `task047-org-b-<stamp>`, `task047-line-a/b-<stamp>`, `Task047 ...`, `Utask047...`, customer mobile `090047...` |
| `smoke:027e` | `task027e-<stamp>`, `Task 027E ...`, `task027e-dispatch-unit-*`, DB role metadata `{ task: '027E', fixture: true }` |

目前可搜尋欄位：

- organization code / name
- dispatch unit code / name
- LINE channel code / name / channelId
- customer name
- customer mobile test prefix
- case modelNo / problemDescription
- appointment note
- dispatch assignment note
- workflow transition notes
- lineUserId test prefix
- createdAt / created_at

目前較弱的地方：

- 不同 smoke 的 task code 命名大小寫與欄位放置方式不完全一致。
- `smoke:029` 檔名是 Task 061，prefix 也使用 `Task061`，但 npm script 名稱是 `smoke:029`。
- 多數資料沒有單一 `smokeRunId` 可跨表串接。
- 部分核心表沒有 metadata 欄位，只能使用現有 text fields。
- audit logs 會記錄 entity/action，但不是所有 smoke-created row 都有 cleanup-friendly metadata。

## 統一 Smoke Marker Strategy

後續 smoke-created fixture 應盡量帶以下資訊。

建議欄位概念：

- `smokeTaskCode`：例如 `task071`
- `smokeRunId`：例如 timestamp + random suffix，或 UUID
- `smokePrefix`：例如 `Task071 browser-smoke`
- `createdAt`：使用既有 `created_at`

在不新增 migration 的前提下，建議放進現有 safe text fields：

- organizationCode：`task071-org-<smokeRunId>`
- organizationName：`Task071 Browser Smoke Organization <smokeRunId>`
- dispatchUnitCode：`task071-du-<smokeRunId>`
- dispatchUnitName：`Task071 Browser Smoke Dispatch Unit <smokeRunId>`
- customerName：`Task071 Browser Smoke Customer <smokeRunId>`
- case problemDescription：`Task071 browser smoke <smokeRunId>`
- case modelNo：`T071-<shortSmokeRunId>`
- dispatch assignment note：`Task071 browser smoke <smokeRunId>`
- appointment note：`Task071 appointment <sequence> <smokeRunId>`
- workflow transition note：`Task071 browser smoke <action> <smokeRunId>`
- LINE channel code / name：`task046-line-channel-<smokeRunId>`
- LINE displayName：`Task046 LINE Fixture User <smokeRunId>`

設計原則：

- 不新增 schema。
- 不要求所有 table 立刻有 metadata。
- 優先使用既有可搜尋且非敏感欄位。
- 不把 customer mobile、raw LINE user id、password、token、secret 作為 cleanup marker。
- `smokeRunId` 可輸出到 logs，但不可包含敏感資訊。

## Cleanup 策略比較

### 策略 1：不自動 cleanup，只保留 prefix + createdAt 供人工清理

適用：

- shared Zeabur runtime
- production-like staging
- 目前沒有 dedicated test DB 的環境

優點：

- 低風險。
- 不會誤刪 seed admin / permissions / shared test data。
- 不需要新增 API 或 DB script。
- 符合目前 Zeabur shared runtime 的保守操作方式。

缺點：

- fixture data 會累積。
- 搜尋與人工清理成本逐漸升高。
- 可能影響 admin list 頁的資料量與測試辨識。

### 策略 2：API soft-delete cleanup

適用：

- 有正式 cleanup API 的 fixture graph。
- 需要留下 audit trail 的測試環境。
- shared runtime 中的低風險 cleanup，但前提是 API 行為完整且可控。

優點：

- 遵守 business rules。
- 會走正式 auth / permission / audit。
- 比 DB cleanup 安全。

缺點：

- 目前 API support 不完整。
- 很多 root fixture 例如 case / customer / organization 尚無完整 delete endpoint。
- Cascade graph 可能清不乾淨。
- 若 API 是 cancel / disable 而非 delete，仍會留下資料，只是改狀態。

### 策略 3：DB cleanup only in isolated test env

適用：

- local test DB
- CI ephemeral DB
- 可完全重建的 preview DB

優點：

- 可清完整 fixture graph。
- 適合高頻自動化。
- 不需要等待所有 cleanup API 完整。

缺點：

- 高風險。
- 必須理解 FK graph 與 soft delete semantics。
- 禁止用於 shared Zeabur runtime。
- 必須避免誤刪 seed admin / roles / permissions / core organizations。

## 第一版建議

第一版建議採：

1. shared Zeabur runtime：策略 1，不自動 cleanup。
2. browser smoke / API smoke：補強 marker strategy。
3. 後續 Task 074：只先實作 `SMOKE_RUN_ID` / consistent prefix / optional dry-run inventory，不做 destructive cleanup。
4. 等 local / CI isolated DB runbook 成熟後，再評估策略 3。
5. 若未來正式 API soft-delete coverage 足夠，再評估策略 2。

## Zeabur Shared Runtime Cleanup Rule

在 shared Zeabur runtime：

- 不做自動 DB cleanup。
- 不做 destructive cleanup。
- browser smoke / API smoke 可留下 fixture。
- fixture 必須有明確 Task prefix。
- 若需要清理，先人工 review prefix / createdAt。
- 不以 mobile / raw LINE user id / password / token 作為清理條件。
- 不直接刪 seed admin、permissions、roles、shared organization。
- 未來若有正式 API soft-delete，可再評估低風險 cleanup。

## Local / CI Test DB Cleanup Rule

在 local / CI isolated DB：

- 可評估 DB cleanup。
- cleanup 必須只刪 `smokeRunId` / prefix 命中的資料。
- cleanup script 預設應拒絕對非 local / CI env 執行。
- cleanup script 應需要顯式 env，例如 `ALLOW_SMOKE_DB_CLEANUP=1`。
- cleanup script 應先 dry-run 列出將處理的 root ids。
- 必須先刪 dependent rows，再刪 root rows。
- 必須避免誤刪 seed admin / core permissions / roles / production-like data。
- DB cleanup 應優先用 soft delete 或 transactional delete；若 hard delete，僅限 ephemeral DB。

粗略 dependent order 需評估：

1. service_parts
2. field_service_reports
3. billing_records / settlement_records，如 smoke 有建立
4. appointments
5. dispatch_assignments
6. case_messages / case_attachments / audit_logs，依 retention policy 決定是否清
7. cases
8. customer_line_identities
9. line_channels
10. customers
11. dispatch_units
12. user_organizations / role_permissions / user_roles，僅限特定 smokeRunId fixture
13. users / roles / organizations，僅限明確 smoke-created fixture

以上順序只是設計草案，不應直接在 shared runtime 執行。

## API Soft-delete Support 盤點

目前可見 API support：

- Case：
  - 有 workflow cancel：`POST /api/v1/admin/cases/:caseId/cancel`
  - 沒有完整 delete / soft-delete case endpoint。
- Appointment：
  - 有 `PATCH /api/v1/admin/appointments/:appointmentId`
  - Service 有 `cancelAppointment` 能力，但目前 route 主要透過 PATCH 更新 appointment status / visit result。
  - 沒有 dedicated delete appointment endpoint。
- Dispatch assignment：
  - 有 create / patch：`POST/PATCH /api/v1/admin/cases/:caseId/dispatch`
  - 沒有 dedicated delete dispatch assignment endpoint。
- Dispatch unit：
  - 有 disable：`DELETE /api/v1/admin/dispatch-units/:dispatchUnitId`
- Customer：
  - 有 create / read / update。
  - 沒有 delete / disable customer endpoint。
- Organization：
  - 有 create / read / update。
  - 沒有 delete / disable organization endpoint。
- LINE channel：
  - 有 create / patch。
  - 沒有 delete LINE channel endpoint。
- Customer LINE identity：
  - 有 unlink：`DELETE /api/v1/admin/customers/:customerId/line-identities/:identityId`
- Field Service Report：
  - 有 create / get / patch。
  - 沒有 delete service report endpoint。
- Service parts：
  - 有 soft delete：`DELETE /api/v1/admin/service-parts/:partId`
- Billing / settlement：
  - 有 create / get / patch。
  - 沒有 delete billing / settlement endpoint。
- Attachments / messages：
  - 有 soft delete endpoints，但 Task 071 / 028 / 029 不建立 attachments。

結論：

- 目前 API soft-delete coverage 不足以完整 cleanup smoke fixture graph。
- 不建議現在硬做 cleanup script。

## Browser Smoke Update 建議

建議 Task 074 做小範圍 smoke marker 改善：

- 在 Task071 script 加入 `SMOKE_RUN_ID` env。
- 預設 `SMOKE_RUN_ID` 用 timestamp + random suffix。
- 將 `smokeRunId` 放進 organization / dispatch unit / customer / case / dispatch / appointment note。
- Log 顯示 `smokeRunId`，但不顯示 mobile / token / password。
- 加入 `CLEANUP=1` flag 的設計保留，但第一版不啟用 destructive cleanup。
- 若未來支援 cleanup，必須限定 local / CI isolated DB，且預設 false。

不建議 Task 074 做：

- shared Zeabur DB cleanup。
- hard delete SQL。
- 自動刪 production-like runtime 的 smoke data。

## 安全規則

Smoke lifecycle / cleanup 相關規則：

- 不輸出 password / token / secret。
- 不輸出 full payload。
- 不輸出 customer mobile。
- 不輸出 raw LINE user id。
- 不把 customer mobile / raw LINE user id 作為 cleanup marker。
- 不測真實客戶資料。
- 不在 shared Zeabur runtime 執行 destructive cleanup。
- cleanup 必須預設關閉。
- cleanup 必須支援 dry-run。
- cleanup 必須拒絕不明環境。

## 為何本任務不直接實作 Cleanup

本任務不直接實作 cleanup，原因：

- shared Zeabur runtime 目前是共同測試 / production-like API runtime。
- 現有 API 不足以完整、安全地 soft-delete fixture graph。
- DB cleanup 需要完整 FK graph 與 retention policy，不能在本任務快速硬寫。
- smoke scripts 涉及 customers / cases / appointments / reports / LINE identities / roles 等不同 graph。
- 錯誤 cleanup 可能破壞 seed admin、permissions、roles 或其他測試資料。

## 下一步 Task 074 建議

建議下一步做：

**Task 074 - Smoke Fixture Marker Standardization**

範圍：

- 不做 cleanup。
- 將 Task071 browser smoke 加入 `SMOKE_RUN_ID`。
- 讓 Task071 fixture fields 更一致地包含 `Task071 browser-smoke <smokeRunId>`。
- 如低風險，也可同步文件化 028 / 029 未來 marker 改法。
- 保留 `CLEANUP` env 設計，但不實作 destructive cleanup。

驗收：

- Browser smoke fixture 可用 `smokeRunId` 跨表搜尋。
- 不改 backend schema。
- 不做 DB cleanup。
- 不影響 smoke:028 / smoke:029 / smoke:071:browser。
