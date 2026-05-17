# Task 050 — Cases Query String Auto Filter Foundation

## 功能範圍

本任務讓 `/cases` 支援 query string prefill / auto filter，第一版只支援：

- `caseNo`

目標是讓 Customer detail 的 customer cases section 導向 `/cases?caseNo=<caseNo>` 後，案件管理頁會自動填入案件編號並載入對應列表。

本任務不做自動開啟 case detail modal、不做 `/cases?caseId=` auto open、不重構 router，也不修改 backend cases API。

## 支援 query string

```text
/cases?caseNo=TW-20260514-000001
```

`/cases` 載入時會：

1. 讀取 `window.location.search`
2. 取得 `caseNo`
3. trim 後填入案件編號搜尋欄位
4. 同步設定 applied caseNo filter
5. 自動呼叫既有 `listCases({ caseNo })`
6. 顯示「已依案件編號篩選。」

如果沒有 `caseNo`，維持既有 `/cases` 行為。

## Customer detail 導向行為

Task 049 customer cases section 的「查看案件」會導向：

```text
/cases?caseNo=<caseNo>
```

目前只帶 `caseNo`，不帶：

- customer mobile
- customerId
- raw lineUserId
- internal data

`caseNo` 由 `URLSearchParams` 產生，會做 URL encode。

## 搜尋與 URL 同步策略

使用者在 `/cases` 手動輸入案件編號並按「搜尋」時：

- 會 trim caseNo
- 更新 filter state
- 更新 URL query string 中的 `caseNo`

如果搜尋時 caseNo 是空白：

- 清除 applied caseNo filter
- 移除 URL query string 中的 `caseNo`

本任務只同步 `caseNo`，不把其他 filters 寫入 URL。

## Clear / Reset 行為

新增「清除條件」按鈕，會：

- 清空 caseNo filter
- 清空 organization / status / priority / caseType / source / created date filters
- 重設 offset
- 移除 URL query string 中的 `caseNo`
- 重新回到預設列表載入邏輯

## 為何不自動開啟 case detail

本任務只做 query string auto filter foundation。自動開啟 detail modal 需要處理：

- simple browser history routing 與 modal state
- caseId / caseNo lookup
- detail loading / close 後 URL 還原
- 與既有多個 case detail panels 的 refresh state

為避免 Task 050 範圍過大，本任務不做 `/cases?caseId=` auto open，也不自動開啟 detail。

## Loading / Error / Empty

Query string filter 使用既有 case list loading / error / empty state：

- loading：顯示「載入案件中...」
- empty：顯示「目前沒有符合條件的案件。」
- error：顯示 backend `error.message`
- 不顯示 stack trace

## 安全注意事項

- 不 hardcode Zeabur domain
- 不 console log token / password / secret
- 不 console log customer mobile / lineUserId / full payload
- 不把 customer mobile 放進 query string
- 不把 raw lineUserId 放進 query string
- 不顯示 internal notes / audit logs / AI raw payload / OCR raw output / billing data
- 不修改 backend auth/RBAC
- 不新增 migration
- 不修改 backend cases API

## 已知限制

- 只支援 `caseNo`
- 不支援 `caseId` auto-open
- 不把其他 filters 寫入 URL
- 從 customer cases 導過來後只會篩列表，不會自動打開 detail

## 下一步建議

- 後續可新增 `/cases?caseId=<caseId>` auto-open detail，但要獨立 task 處理 modal URL state
- 可評估是否把 status / priority / source 等 filters 也 URL 化，方便分享後台查詢視圖
