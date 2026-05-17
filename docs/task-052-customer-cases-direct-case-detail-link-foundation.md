# Task 052 — Customer Cases Direct Case Detail Link Foundation

## 功能範圍

本任務將 Customer Admin Page 的 customer detail「客戶案件歷史」連結升級為優先使用 `caseId` deep link，讓使用者能從客戶詳情一鍵開啟指定案件 detail modal。

本任務不修改 backend cases API、不新增 migration、不改 workflow / billing / LINE 業務邏輯。

## Link strategy

Customer cases row 使用既有 `AdminCase` DTO。

連結規則：

1. 如果 row 有 `id`：
   - 產生 `/cases?caseNo=<caseNo>&caseId=<id>`
   - `caseId` 用來 auto-open detail
   - `caseNo` 用來套用 list filter

2. 如果沒有 `id` 但有 `caseNo`：
   - fallback 到 `/cases?caseNo=<caseNo>`
   - 只套用 caseNo filter，不自動開 detail

3. 如果 `id` 與 `caseNo` 都缺：
   - 不顯示 link
   - 顯示「缺少案件識別資料」

`caseNo` 與 `caseId` 都透過 `URLSearchParams` 產生 query string，因此會做 URL encode。

## 與 Task 050 / Task 051 整合

Task 050：

- `/cases?caseNo=<caseNo>` 會自動套用 caseNo filter

Task 051：

- `/cases?caseId=<caseId>` 會自動開啟 detail modal
- `/cases?caseNo=<caseNo>&caseId=<caseId>` 可共存
- 關閉 detail 後移除 `caseId` 並保留 `caseNo`

因此 Task 052 的 preferred URL 是：

```text
/cases?caseNo=<caseNo>&caseId=<caseId>
```

## 不放入 query string 的資料

本任務只放：

- caseNo
- caseId

不放：

- customer mobile
- customerId
- raw lineUserId
- internal notes
- internal metadata

這能避免 URL、browser history 或共享連結中出現 customer sensitive data。

## Backend DTO fallback

目前 customer cases response 以 `AdminCase` 型別處理，包含 `id` 與 `caseNo`。若某環境回傳缺少 `id`，前端會自動 fallback 到 `caseNo` filter URL。若連 `caseNo` 也缺，UI 不提供壞連結。

## 如何測試

1. admin 登入
2. 進入 `/customers`
3. 打開有案件歷史的 customer detail
4. 在「客戶案件歷史」點擊「查看案件」
5. 若 row 有 `id`，確認導向 `/cases?caseNo=<caseNo>&caseId=<id>`
6. `/cases` 應套用 caseNo filter 並自動開啟 detail modal
7. 關閉 detail，URL 應移除 `caseId` 並保留 `caseNo`
8. 若 row 缺 `id` 但有 `caseNo`，確認 fallback 到 `/cases?caseNo=<caseNo>`
9. 確認 query string 不包含 customer mobile / customerId / raw lineUserId

## 安全注意事項

- 不 hardcode Zeabur domain
- 不 console log token / password / secret
- 不 console log customer mobile / lineUserId / full payload
- query string 只放 caseId / caseNo
- 不把 customer mobile 放進 query string
- 不把 customerId 放進 query string
- 不把 raw lineUserId 放進 query string
- 不修改 backend auth/RBAC
- 不新增 migration
- 不修改 backend cases API

## 已知限制

- 若 customer cases DTO 沒有 `id`，只能 fallback caseNo filter，無法自動開 detail
- Customer cases link 仍是 plain href，未做 SPA navigate state
- 不處理 browser previous state，只沿用 `/cases` 的 replaceState 行為

## 下一步建議

- 後續 dashboard / notification / audit log / AI jobs 可統一產生 `/cases?caseId=<caseId>`
- 若 customer cases DTO 在某環境缺 `id`，應檢查 backend mapper 是否可安全補上 case id
