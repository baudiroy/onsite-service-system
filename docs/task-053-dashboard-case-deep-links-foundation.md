# Task 053 — Dashboard Case Deep Links Foundation

## 功能範圍

本任務在 Admin Dashboard 新增第一版「最近案件」區塊，讓管理者可以從首頁快速進入指定案件詳情。

本任務只做 Dashboard case deep link foundation：

- 不新增 backend dashboard analytics API
- 不修改 backend cases API
- 不新增 migration
- 不自動執行 workflow action
- 不自動修改 case status
- 不重構 router

## Dashboard 最近案件資料來源

目前沒有專用 dashboard summary API，因此 Dashboard 使用既有案件列表 API：

- `GET /api/v1/admin/cases`
- frontend client：`listCases({ limit: 5, offset: 0, sort: 'createdAtDesc' })`

顯示欄位只使用案件列表已提供的 safe fields：

- caseNo
- status
- customerSummary.name，如 response 有
- brand
- productType
- priority
- createdAt

本區塊不顯示 customer mobile、internal notes、audit logs、AI raw payload、OCR raw output、billing data 或 raw LINE identity。

## Case Deep Link Strategy

最近案件「查看」連結使用 Task 051 已建立的 `/cases?caseId=<caseId>` deep link。

策略：

1. 如果 row 有 `id` / caseId：
   - 導向 `/cases?caseId=<caseId>`
   - `/cases` 會自動開啟 case detail modal
2. 如果沒有 `id`，但有 `caseNo`：
   - fallback 導向 `/cases?caseNo=<caseNo>`
   - `/cases` 只套用案件編號 filter，不自動開啟 detail
3. 如果 `id` 與 `caseNo` 都不存在：
   - 不產生壞連結
   - 顯示「缺少案件識別資料」

Dashboard 預設不帶 `caseNo` filter，因為首頁最近案件的主要目的偏向直接開啟 detail，而不是篩選案件列表。

## 與 Task 051 的整合

Task 051 已支援：

- `/cases?caseId=<caseId>` 自動開啟 case detail
- 關閉 detail modal 時移除 `caseId`
- `/cases?caseNo=<caseNo>&caseId=<caseId>` 共存

Task 053 的 Dashboard link 直接沿用此 URL pattern，不建立新的 router state。

## 權限規則

最近案件區塊需要：

- `cases.read`
- admin/system role 視為有完整權限

沒有 `cases.read` 時：

- 不呼叫 `listCases`
- 顯示「你需要 cases.read 權限才能查看最近案件」

backend 仍是最終 permission 與 organization scope source of truth。

## Loading / Error / Empty

Dashboard 最近案件區塊處理：

- loading：顯示載入狀態
- empty：顯示「目前沒有最近案件」
- error：優先顯示 backend `error.message`
- refresh：可手動重新載入最近案件

## 安全注意事項

- 不 hardcode Zeabur domain
- 不 console.log token / password / secret
- 不 console.log customer mobile / lineUserId / full payload
- query string 只放 `caseId` 或 `caseNo`
- 不把 customer mobile 放進 query string
- 不把 customerId 放進 query string
- 不把 raw lineUserId 放進 query string
- 不顯示 internal notes / audit logs / AI raw payload / OCR raw output / billing data
- 不修改 backend auth/RBAC
- 不修改 backend cases API

## 如何啟動

```bash
npm run admin:check
npm run admin:build
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

## 如何測試

1. admin 登入
2. 進入 `/dashboard`
3. 確認最近案件區塊載入，或顯示 empty state
4. 確認最近案件不顯示 internal-only fields 或 customer mobile
5. 點擊「查看」
6. 若 row 有 caseId，確認導向 `/cases?caseId=<caseId>` 並自動開啟 detail
7. 若只有 caseNo，確認 fallback 到 `/cases?caseNo=<caseNo>`
8. 關閉 detail 後確認 URL 中 caseId 被移除
9. 確認 `/cases?caseId=<caseId>`、`/cases?caseNo=<caseNo>`、Customer cases deep link 仍正常

## 已知限制

- 最近案件使用既有 `listCases`，不是專用 dashboard summary API
- Dashboard 目前只顯示最近 5 筆案件
- 若 backend list response 缺少 `id`，只能 fallback 到 `caseNo` filter
- 不支援 notification、audit log、AI jobs、dispatch overview 的 deep link source；這些頁面後續可共用同一 URL pattern

## 下一步建議

- 建立共用 case deep link helper，供 dashboard、customers、notifications、audit log、AI jobs、dispatch overview 使用
- 未來如有 dashboard summary API，可改用專用 endpoint
- 視需求支援更多 dashboard case widgets，例如待受理、今日預約、逾期未處理案件
