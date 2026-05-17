# Task 051 — Cases CaseId Auto Open Detail Foundation

## 功能範圍

本任務讓 `/cases` 支援 `caseId` query string，自動開啟指定案件 detail modal。

支援：

- `/cases?caseId=<caseId>`
- `/cases?caseNo=<caseNo>&caseId=<caseId>`

本任務不修改 backend cases API、不新增 migration、不重構 router、不自動執行 workflow action，也不自動修改案件狀態。

## 支援的 query string

### `caseId`

`/cases` 載入時會讀取：

```text
caseId
```

若存在：

1. trim `caseId`
2. 設定 `detailCaseId`
3. 使用既有 `getCase(caseId)` flow
4. 顯示 detail loading
5. 成功後開啟案件 detail modal

Case list 仍照常載入，不受 `caseId` 影響。

### 與 Task 050 `caseNo` 共存

如果 URL 是：

```text
/cases?caseNo=ABC&caseId=UUID
```

策略是：

- `caseNo` 繼續套用 list filter
- `caseId` 只用於開啟 detail
- 兩者互不覆蓋
- `getCase(caseId)` 失敗時不清除 `caseNo` filter

## Detail close URL 行為

關閉 detail modal 時會移除 URL 中的 `caseId`，並保留其他 query。

範例：

```text
/cases?caseNo=ABC&caseId=UUID
```

關閉後變成：

```text
/cases?caseNo=ABC
```

如果只有：

```text
/cases?caseId=UUID
```

關閉後變成：

```text
/cases
```

此行為使用 `history.replaceState`，不重新載入整頁，也不清除 list filters。

## Table 查看同步 URL

本任務同步更新 case table 的「查看」行為：

- 點擊「查看」會設定 `detailCaseId`
- 同時把 `caseId` 寫入 URL query string
- 如果目前有 `caseNo` filter，會保留 `caseNo`

這讓使用者 refresh 後仍可回到同一案件 detail。

## Error handling

如果 `getCase(caseId)` 失敗：

- detail modal 顯示「無法開啟指定案件」
- 顯示 backend `error.message`
- 提供「清除指定案件」按鈕
- list page 不 crash
- 不清除 `caseNo` filter

## 為何不做 router 大重構

目前 admin frontend 使用 simple browser history routing，不使用 React Router。Task 051 只在 `/cases` 內部管理 `caseId` query 與 modal state，避免改動全域 router、layout 或其他頁面的 routing 行為。

## 安全注意事項

- Query string 只支援 `caseId` / `caseNo` 這類 routing identifier
- 不把 customer mobile 放進 query string
- 不把 raw lineUserId 放進 query string
- 不 console log token / password / secret / customer sensitive payload
- 不顯示 internal notes / audit logs / AI raw payload / OCR raw output / billing data，除非既有安全 panel 已明確允許顯示
- 不修改 backend auth/RBAC
- 不修改 backend cases API

## 已知限制

- 不支援從其他頁面自動判斷 caseId；其他頁面需自行產生 `/cases?caseId=...`
- 不支援 detail modal close 後回復 browser previous state，只使用 replaceState 移除 `caseId`
- 不把 status / priority / source 等其他 filters URL 化

## 下一步建議

- 讓 customer cases section 在 backend DTO 有 caseId 時改導 `/cases?caseId=<caseId>`，達成真正一鍵開 detail
- 後續 dashboard / notification / audit log / AI jobs 可統一導向 `/cases?caseId=<caseId>`
- 若 URL state 需求增多，再評估是否導入正式 router
