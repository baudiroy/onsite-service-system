# Task 049 — Customer Admin Page Foundation

## 功能範圍

本任務新增第一版 `/customers` 客戶管理頁，提供後台管理者查詢、建立、查看與更新 customer master data，並在 customer detail 中重用 Task 048 的 Customer LINE Identities panel 與 customer cases API。

本任務不包含正式 customer portal、OTP/SMS、客戶登入、LINE chatbot、LINE webhook conversation flow、AI customer service、行銷 CRM、會員分級或大量匯入。

## 使用 API routes

Customers：

- `GET /api/v1/admin/customers`
- `POST /api/v1/admin/customers`
- `GET /api/v1/admin/customers/:customerId`
- `PATCH /api/v1/admin/customers/:customerId`
- `GET /api/v1/admin/customers/:customerId/cases`

LINE identities：

- `GET /api/v1/admin/customers/:customerId/line-identities`
- `POST /api/v1/admin/customers/:customerId/line-identities`
- `DELETE /api/v1/admin/customers/:customerId/line-identities/:identityId`

Organization picker：

- `GET /api/v1/admin/organizations`

## 權限規則

- `/customers` page：`customers.read`
- 建立 customer：`customers.create`
- 更新 customer：`customers.update`
- customer cases section：`customers.read` + `cases.read`
- LINE identities section：`line.read`
- LINE identity link / unlink：`line.manage`
- admin/system role 視為有完整權限

Backend 仍是最終 permission 與 organization scope source of truth。

## Organization scope

Regular user 只能看與操作自己 organization scope 內的 customers；admin/system 可跨 organization。Create customer form 若使用者有 `organizations.read` 或 admin/system 權限，會顯示 organization picker。若未選 organization，前端不硬送 `organizationId`，交由 backend 依登入者 scope / validator 決定。

Edit customer form 不直接修改 `organizationId`，避免錯移資料隔離邊界。

## Customer list 行為

Toolbar 支援：

- `q`
- `mobile`
- `city`
- `source`
- refresh

Table 顯示：

- customerName
- mobile
- tel
- city
- address
- source
- lineUserIdMasked
- createdAt
- updatedAt
- 查看 / 編輯

Mobile / tel 是 admin-readable 欄位，可以顯示，但不可 console log payload。

## Create customer 行為

Create form 欄位：

- organizationId optional picker
- customerName
- mobile
- tel
- city
- address
- source，預設 `admin`

本任務不在 create form 放 raw `lineUserId`；LINE identity 由 customer detail 的 CustomerLineIdentitiesPanel 管理。

## Update customer 行為

Edit form 只送：

- customerName
- mobile
- tel
- city
- address
- source

不直接編輯：

- organizationId
- raw lineUserId

Customer updates 會由 backend 寫 audit logs，但不改寫舊 cases.customer_snapshot。

## Customer detail sections

Customer detail modal 包含：

1. 基本資料
   - id
   - organization
   - customerName
   - mobile
   - tel
   - city
   - address
   - source
   - lineUserIdMasked
   - createdAt
   - updatedAt

2. LINE 身分綁定
   - 重用 `CustomerLineIdentitiesPanel`
   - 傳入 `customerId`
   - 傳入 `organizationId`
   - 由 `line.read` / `line.manage` 控制可見與操作

3. 客戶案件歷史
   - 使用 `GET /api/v1/admin/customers/:customerId/cases`
   - 顯示 caseNo、status、brand、productType、caseType、priority、createdAt、updatedAt
   - 「查看案件」採最小變更導向 `/cases?caseNo=<caseNo>`

## Safety / Sanitization

不可顯示：

- raw lineUserId
- channelSecret
- channelAccessToken
- access token
- token
- secret
- raw credentials
- audit logs
- AI raw payload
- OCR raw output
- billing data

前端不 console log mobile、lineUserId 或完整 payload，也不把 mobile / lineUserId 放進 localStorage 或 sessionStorage。

## 如何啟動

```bash
npm run admin:dev
```

或指定 API：

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

## 如何測試

1. admin 登入
2. sidebar 可看到「客戶管理」
3. 進入 `/customers`
4. customer list 載入成功或顯示 empty state
5. 測試 `q` / mobile / city / source filters
6. 建立 customer
7. 開啟 customer detail
8. 編輯 customer
9. 確認 detail 顯示 LINE 身分綁定 panel
10. 若有 `line.read` / `line.manage`，測試 list / link / unlink LINE identity
11. 確認 detail 顯示 customer cases 或 empty state
12. 確認不顯示 raw lineUserId / channel secrets / raw credentials
13. 確認 `/cases` case detail 的 LINE identities panel 仍正常
14. 確認 `/customer-inquiries` LINE preview 與 `/line-channels` 仍正常

## 已知限制

- `/cases?caseNo=<caseNo>` 目前只是導向案件管理頁的最小 shortcut，不自動打開 case detail
- Customer Admin Page 尚未做 bulk import
- 尚未做 customer merge / duplicate resolution
- 尚未做正式 customer-facing portal
- 尚未做 LINE chatbot / webhook customer linking flow

## 下一步建議

- 讓 `/cases` 支援 query string prefill / auto filter `caseNo`
- 補 customer duplicate detection / merge workflow
- 補 regular user organization scope frontend QA
- 後續建立正式 customer portal 前，先補 OTP/SMS 與 rate limit 設計
