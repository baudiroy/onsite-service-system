# Task 054 — Shared Case Deep Link Helper Foundation

## 功能範圍

本任務新增共用 case deep link helper，統一產生到 `/cases` 的安全 URL，並將既有兩個使用點改為共用 helper：

- Dashboard 最近案件
- Customer detail 客戶案件歷史

本任務不修改 backend cases API、不新增 migration、不重構 router、不改 workflow / billing / LINE 業務邏輯。

## Helper Functions

新增檔案：

- `admin/src/utils/caseLinks.ts`

提供：

### `buildCaseDetailUrl(input)`

Input:

```ts
{
  caseId?: string | null;
  caseNo?: string | null;
  preserveCaseNo?: boolean;
}
```

行為：

- 有 `caseId` 時，預設產生 `/cases?caseId=<caseId>`
- 有 `caseId` 且 `preserveCaseNo=true` 且有 `caseNo` 時，產生 `/cases?caseNo=<caseNo>&caseId=<caseId>`
- 沒有 `caseId` 但有 `caseNo` 時，fallback 產生 `/cases?caseNo=<caseNo>`
- `caseId` / `caseNo` 都沒有時回傳 `null`

### `buildCaseFilterUrl(input)`

Input:

```ts
{
  caseNo?: string | null;
}
```

行為：

- 有 `caseNo` 時產生 `/cases?caseNo=<caseNo>`
- 沒有 `caseNo` 時回傳 `/cases`

### `getCaseLinkAvailability(input)`

Input:

```ts
{
  caseId?: string | null;
  caseNo?: string | null;
}
```

回傳：

```ts
{
  href: string | null;
  mode: 'detail' | 'filter' | 'unavailable';
  label: string;
  reason?: string;
}
```

規則：

- 有 `caseId`：`mode = detail`，`label = 查看案件`
- 沒有 `caseId` 但有 `caseNo`：`mode = filter`，`label = 依案件編號查看`
- 都沒有：`mode = unavailable`，`label = 缺少案件識別資料`

## CaseId 優先 / CaseNo Fallback

統一策略：

1. `caseId` 是 detail deep link 的優先識別資料
2. `caseNo` 是安全 fallback，可用來套用 `/cases` list filter
3. `caseId` 與 `caseNo` 可共存，但必須由呼叫端明確設定 `preserveCaseNo=true`

## Dashboard 改用 Helper

Dashboard 最近案件維持 Task 053 行為：

- 有 `caseId`：`/cases?caseId=<caseId>`
- 沒有 `caseId` 但有 `caseNo`：`/cases?caseNo=<caseNo>`
- 都沒有：不產生連結，顯示缺少案件識別資料

Dashboard 不預設保留 `caseNo`，因為首頁最近案件主要目的是直接開啟案件詳情，不是篩選列表。

## Customer Cases 改用 Helper

Customer detail 客戶案件歷史維持 Task 052 行為：

- 有 `caseId` + `caseNo`：`/cases?caseNo=<caseNo>&caseId=<caseId>`
- 有 `caseId` 但沒有 `caseNo`：`/cases?caseId=<caseId>`
- 沒有 `caseId` 但有 `caseNo`：`/cases?caseNo=<caseNo>`
- 都沒有：不產生連結，顯示缺少案件識別資料

這裡使用 `preserveCaseNo=true`，讓使用者從客戶案件歷史進入案件 detail 時，也保留列表上的案件編號 filter。

## 為何不做 Generic Query Helper

本 helper 只接受 `caseId` / `caseNo`，不接受 arbitrary query object。

原因：

- 避免未來誤把 customer mobile 放進 URL
- 避免誤把 customerId 放進 URL
- 避免誤把 raw lineUserId 放進 URL
- 避免把 internal metadata、audit、AI/OCR raw payload 等資料塞進 query string

## 安全規則

- helper 只處理 `caseId` / `caseNo`
- `caseId` / `caseNo` 會先 trim
- 使用 `URLSearchParams` 產生 query string
- 不接受 customer mobile
- 不接受 customerId
- 不接受 raw lineUserId
- 不接受 arbitrary query object
- 不把 internal metadata 放進 URL

## Helper 驗證 Cases

此專案目前沒有 frontend unit test framework，因此本任務不新增測試框架，改以 `admin:check` / `admin:build` 與手動 QA 驗證。

需覆蓋的 helper cases：

- `caseId only` -> `/cases?caseId=...`
- `caseId + caseNo + preserveCaseNo=false` -> `/cases?caseId=...`
- `caseId + caseNo + preserveCaseNo=true` -> `/cases?caseNo=...&caseId=...`
- `caseNo only` -> `/cases?caseNo=...`
- `empty` -> `null` / unavailable
- whitespace input -> trim 後處理
- special characters in caseNo -> 由 `URLSearchParams` URL encode

## 如何測試

1. 進入 `/dashboard`
2. 最近案件載入成功
3. 點擊最近案件「查看」
4. 有 `caseId` 時確認導向 `/cases?caseId=<caseId>`
5. 進入 `/customers`
6. 打開 customer detail
7. 客戶案件歷史點擊「查看案件」
8. 有 `caseId` + `caseNo` 時確認導向 `/cases?caseNo=<caseNo>&caseId=<caseId>`
9. 只有 `caseNo` 時確認 fallback 到 `/cases?caseNo=<caseNo>`
10. 確認 `/cases?caseId=<caseId>` auto-open 正常
11. 確認 `/cases?caseNo=<caseNo>` auto-filter 正常
12. 確認 URL 不包含 customer mobile / customerId / raw lineUserId

## 已知限制

- 目前只替換 Dashboard 與 Customer cases 兩個既有使用點
- `/cases` 內部 query string sync 仍保留在 CaseManagementPage
- 尚未將 notifications、audit log、AI jobs、dispatch overview 等未來來源接上 helper

## 下一步建議

- 後續所有 case deep link source 都改用 `caseLinks.ts`
- 可視需求將 `/cases` 內部 query sync 拆成專用 routing util，但不在本任務範圍內
- 未來若有 app-level router，再把 helper 產出的 href 接到正式 navigation API
