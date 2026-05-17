# Task 048 — Customer LINE Identities Admin Panel Foundation

## 功能範圍

本任務在 admin frontend 的案件詳情中加入第一版 Customer LINE Identities 管理面板，讓後台使用者可以從 customer context 查看、建立與解除 LINE identity link。

本任務不包含正式 LINE chatbot、LINE webhook conversation flow、LINE Push、Rich Menu、LIFF、LINE Login、OTP/SMS、customer portal、notification sending 或 secrets manager integration。

## 使用 API routes

- `GET /api/v1/admin/customers/:customerId/line-identities`
- `POST /api/v1/admin/customers/:customerId/line-identities`
- `DELETE /api/v1/admin/customers/:customerId/line-identities/:identityId`
- `GET /api/v1/admin/line-channels`

## 權限規則

- 查看 customer LINE identities 需要 `line.read`
- 建立 / 解除 LINE identity link 需要 `line.manage`
- admin/system role 視為有完整權限
- backend 仍是最終 permission 與 organization scope source of truth

沒有 `line.read` 時，panel 顯示權限不足，不載入 identities。  
有 `line.read` 但沒有 `line.manage` 時，只能查看列表，不顯示 link form 或 unlink action。

## Organization scope

LINE identity 不以 `lineUserId` 作為全域身分。Backend scope chain 是：

- `organization_id`
- `line_channel_id`
- `line_user_id`
- `customer_id`

前端若取得 case/customer `organizationId`，LINE channel picker 會優先使用 `organizationId` 載入，並再次 client-side filter 同 organization channels。前端不提供 manual `lineChannelId` fallback，避免錯綁。Backend 仍會檢查 customer 與 line channel 必須屬於同一 organization。

## 整合位置

Panel 整合在 `/cases` 的 case detail modal，放在 Customer Snapshot 附近。

若 case detail 有 `customerId`：

- 顯示 LINE 身分綁定 panel
- 載入該 customer 的 LINE identities
- 可依權限 link / unlink

若 case detail 沒有 `customerId`：

- 顯示 unavailable state
- 不從 mobile、name、internal notes 或 messages 推測 customer

## Line channel picker

Picker 使用 `GET /api/v1/admin/line-channels`，只顯示 safe fields：

- channelName
- channelCode
- organizationName 或 organizationId
- enabled status

不可顯示：

- channelSecret
- channelAccessToken
- accessToken
- token
- secret
- raw credentials

若無法載入 channels，panel 顯示錯誤，不讓整個案件詳情 crash。

## Link payload

```json
{
  "lineChannelId": "LINE_CHANNEL_UUID",
  "lineUserId": "Uxxxxxxxxxxxxxxxx",
  "displayName": "optional display name"
}
```

`lineUserId` 只存在 component state，送出成功後會清空。前端不把 `lineUserId` 放進 query string、localStorage 或 sessionStorage，也不 console log `lineUserId` 或完整 payload。

## List safe DTO

列表只 render backend safe DTO：

- id
- customerId
- organizationId
- lineChannelId
- channelCode
- channelName
- lineUserIdMasked
- displayName
- linkedAt
- createdAt

不可 render raw `lineUserId`，也不可 render channel secrets / access tokens。

## Unlink behavior

解除綁定會先顯示確認，再呼叫：

`DELETE /api/v1/admin/customers/:customerId/line-identities/:identityId`

Backend 使用 soft unlink：`customer_line_identities.unlinked_at = now()`。

## Duplicate / conflict handling

- 同 customer + same channel + same lineUserId：backend idempotent 回傳既有 identity；前端重新整理 list 並顯示已綁定訊息
- same channel + lineUserId 已綁到不同 customer：前端顯示 backend error.message，不暴露另一個 customer 資訊
- cross organization：前端顯示 backend error.message，不嘗試繞過

## Optional shortcut

Identity list 若有 `channelCode`，可點「測試查詢」導向：

`/customer-inquiries?mode=line&channelCode=<channelCode>`

只帶 `channelCode`，不帶 raw `lineUserId`，也不自動 submit。使用者仍需手動輸入 `lineUserId`。

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
2. 進入 `/cases`
3. 打開有 `customerId` 的 case detail
4. 確認 LINE 身分綁定 panel 可載入
5. 無 identities 時顯示 empty state
6. LINE channel picker 只顯示 safe fields
7. 輸入 `lineUserId` 與 optional displayName，建立 link
8. 確認 list 只顯示 `lineUserIdMasked`
9. duplicate link 同一 customer 時顯示已綁定 / 重新整理訊息
10. same channel + lineUserId link 到另一 customer 時顯示 backend conflict
11. 解除綁定成功後 list refresh
12. 確認 `lineUserId` 不在 query string / localStorage / sessionStorage
13. 確認 console 不顯示 secrets、tokens、lineUserId 或完整 payload

## 安全注意事項

- 不顯示 raw `lineUserId`
- 不顯示 `channelSecret` / `channelAccessToken`
- 不顯示 raw credentials
- 不 console log link payload
- 不從 internal notes 或 messages 推測 customer
- 不修改 backend auth/RBAC
- 不新增 migration
- 不修改 public inquiry behavior

## 已知限制

- 尚未有獨立 Customer Admin Page
- Panel 目前整合在 case detail customer section
- 若 case detail 缺 `customerId`，只能顯示 unavailable state
- 尚未做正式 LINE identity search / audit timeline UI
- 尚未做 customer-facing LINE UX

## 下一步建議

- 補一個正式 Customer Admin Page，再重用此 panel
- 在 LINE inquiry preview 中提供從 customer identity list 帶入的安全測試流程，但仍不把 raw `lineUserId` 放 URL
- 補 regular user organization scope 的 frontend/manual QA 與 smoke 覆蓋
