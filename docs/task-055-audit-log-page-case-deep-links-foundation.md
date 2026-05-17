# Task 055 — Audit Log Page Case Deep Links Foundation

## 功能範圍

本任務新增 `/audit-logs` 最小 read foundation，並為 case 相關 audit log record 加上安全的 case deep link。

本任務只做 Admin Frontend：

- 不修改 backend audit log API
- 不新增 migration
- 不重構 audit logging
- 不新增 audit log write 行為
- 不修改 workflow / billing / LINE 業務邏輯

## 使用的 API Route

- `GET /api/v1/admin/audit-logs`

Frontend client：

- `admin/src/api/auditLogs.ts`
- `listAuditLogs(params)`

支援 query：

- `action`
- `entityType`
- `entityId`
- `actorUserId`
- `organizationId`
- `requestId`
- `createdFrom`
- `createdTo`
- `limit`
- `offset`
- `sort`

## 權限規則

Audit Log page：

- 需要 `audit_logs.read`
- admin/system role 視為有完整權限

Case deep link：

- 顯示可點擊 link 需要 `cases.read`
- 若沒有 `cases.read`，只顯示「需要 cases.read 才能開啟案件」

backend 仍是 audit log 與 case read permission 的最終 source of truth。現有 backend audit log service 也會限制 system / admin-like access。

## Case Audit Log 判斷規則

每筆 audit log 依下列規則建立 case link：

1. `entityType === "case"` 且 `entityId` 存在：
   - 使用 `buildCaseDetailUrl({ caseId: entityId })`
   - 顯示「查看案件」
2. `entityType === "case"` 且只有 `metadata.caseNo`，沒有可用 `entityId` / `metadata.caseId`：
   - 使用 `buildCaseDetailUrl({ caseNo: metadata.caseNo })`
   - 顯示「依案件編號查看」
3. `metadata.caseId` 存在：
   - 使用 `buildCaseDetailUrl({ caseId: metadata.caseId, caseNo: metadata.caseNo, preserveCaseNo: Boolean(metadata.caseNo) })`
   - 顯示「查看案件」
4. 都沒有：
   - 不顯示 case link

## Case Deep Link Strategy

本任務使用 Task 054 的共用 helper：

- `buildCaseDetailUrl`

不在 Audit Log page 手寫 `URLSearchParams` 的 case link 邏輯。

產生的 query string 只允許：

- `caseId`
- `caseNo`

## Metadata Sanitization

Audit log metadata 可能包含敏感資訊，因此本頁不 raw render metadata value。

目前只顯示 key-level summary，且會排除 sensitive keys。

不可顯示的 sensitive keys 包含：

- `password`
- `password_hash`
- `passwordHash`
- `token`
- `accessToken`
- `refreshToken`
- `channelSecret`
- `channelAccessToken`
- `secret`
- `apiKey`
- `lineUserId`
- `rawLineUserId`
- `line_user_id`
- `mobile`
- `customerMobile`
- `customer_mobile`
- `tel`
- `phone`
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `R2_SECRET_ACCESS_KEY`

development mode 如偵測到 sensitive keys，只做 key-level warning，不記錄 value。

## 為何不把 Metadata 放進 URL

Audit metadata 可能包含 internal workflow context、requestId、organization hints 或未來擴充欄位。

為避免敏感資料進入 browser history，本任務只從 metadata 中讀取允許的 case routing identifiers：

- `caseId`
- `caseNo`

其餘 metadata 不會進入 query string。

## 如何測試

1. admin 登入
2. 進入 `/audit-logs`
3. audit logs 載入成功，或顯示 empty state
4. 找到 `entityType=case` 的 audit log
5. 若 `entityId` 是 caseId，確認顯示「查看案件」
6. 點擊後導向 `/cases?caseId=<caseId>`
7. `/cases` 自動開啟案件 detail
8. 若只有 `metadata.caseNo`，確認 fallback 到 `/cases?caseNo=<caseNo>`
9. 若 current user 沒有 `cases.read`，確認 link 不可點擊
10. 確認 metadata 不顯示 sensitive values
11. 確認 query string 不包含 customer mobile / customerId / raw lineUserId / metadata

## 安全注意事項

- 不 hardcode Zeabur domain
- 不 console.log token / password / secret
- 不 console.log customer mobile / raw lineUserId / full payload
- 不把 metadata 放進 query string
- 不把 customer mobile 放進 query string
- 不把 customerId 放進 query string
- 不把 raw lineUserId 放進 query string
- query string 只放 `caseId` / `caseNo`
- 不顯示 sensitive metadata values
- 不修改 backend auth/RBAC
- 不修改 backend audit log API

## 已知限制

- 本任務只做最小 read foundation，沒有 audit log detail drawer
- metadata 只顯示 safe key summary，不顯示 safe value preview
- 若 backend audit metadata 沒有 `caseId` / `caseNo`，非 `entityType=case` 的紀錄無法建立 case link
- backend audit log service 目前會限制 system / admin-like access；一般使用者即使有 menu visibility 仍可能被 backend 拒絕

## 下一步建議

- 後續可新增 audit log detail drawer，但仍要維持 metadata value sanitization
- 後續可讓 notification、AI jobs、dispatch overview 共用 Task 054 caseLinks helper
- 後續可請 backend 對 case-related audit metadata 穩定提供 `caseId` / `caseNo` safe routing fields
