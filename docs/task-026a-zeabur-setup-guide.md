# Task 026A - Zeabur Setup Guide for Backend + PostgreSQL

Date: 2026-05-16

## 一、Zeabur 建置總覽

正式部署建議架構：

```text
Node.js backend service
+
Zeabur PostgreSQL service
```

Phase 1 目標是讓 backend 在 Zeabur 上連到 PostgreSQL，完成：

- migration
- seed
- health check
- auth smoke
- organization smoke
- case/customer smoke
- workflow submit/review/accept smoke

Future optional services:

- Redis: background jobs, rate limiting, cache, queue.
- Cloudflare R2: attachment object storage.
- OpenAI provider: future real AI provider.
- LINE provider: future LINE webhook / notification delivery.

本指南不實作新功能、不改 schema、不重構，也不實作 AI chatbot、LINE Push 或 frontend。

## 二、Zeabur 建立 PostgreSQL Service

操作步驟：

1. 登入 Zeabur Dashboard。
2. 建立一個 Project，或進入既有 onsite service project。
3. 點選 Add Service。
4. 選擇 PostgreSQL template / marketplace service。
5. 建立 PostgreSQL service。
6. 等待 PostgreSQL service 啟動完成。
7. 在 PostgreSQL service 的 Variables / Connection 頁面找出 connection string。

注意事項：

- PostgreSQL service 必須是 persistent service。
- 正式資料庫需要規劃備份與還原策略。
- 不要把 database password 或 connection string 寫進 git。
- backend service 應使用 Zeabur 提供的 connection string 連線。

## 三、Zeabur 建立 Node.js Backend Service

操作步驟：

1. 在同一個 Zeabur Project 中點選 Add Service。
2. 選擇 GitHub repository。
3. 選擇目前 backend repo。
4. 確認 Zeabur 偵測為 Node.js project。
5. 確認 install/build command。
6. 確認 start command 使用：

```bash
npm start
```

7. 確認 backend 使用 `process.env.PORT`。

目前 package scripts 已確認包含：

```text
start: node src/server.js
db:migrate: node src/db/migrate.js
db:seed: node src/db/seed.js
check: find src -name '*.js' -print0 | xargs -0 -n1 node --check
```

Zeabur 會注入 `PORT`，backend 已透過 `src/config/env.js` 讀取 `process.env.PORT`，再由 `src/server.js` listen 該 port。

## 四、Environment Variables

backend service 必要 env：

```env
DATABASE_URL=
JWT_SECRET=
APP_BASE_URL=
```

說明：

- `DATABASE_URL` 必須指向 Zeabur PostgreSQL，不可使用 `localhost`。
- `JWT_SECRET` 必須使用長隨機字串。
- `APP_BASE_URL` 必須是 Zeabur backend public domain，例如 `https://xxx.zeabur.app`。

可先留空的 provider env：

```env
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_SIGNED_URL_TTL_SECONDS=

OPENAI_API_KEY=
```

補充：

- Zeabur 會注入 `PORT`。
- 通常不需要手動設定 `PORT`，除非專案有特殊需求。
- secrets 不可 commit 到 git。
- LINE / R2 / OpenAI 可以先留空，migration、seed、`/healthz` 不應依賴這些 provider。

## 五、DATABASE_URL 設定方式

### 方式 A：直接使用 connection string

從 Zeabur PostgreSQL service 複製 connection string，貼到 backend service 的 `DATABASE_URL`。

範例格式：

```env
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE
```

### 方式 B：使用 Zeabur 變數引用

如果 Zeabur PostgreSQL service 提供拆分後的變數，可在 backend service 使用 Zeabur 的變數引用組成 `DATABASE_URL`。

實際格式依 Zeabur UI 顯示為準。原則是 backend container 內的 `DATABASE_URL` 必須能連到 PostgreSQL service。

重要提醒：

- 不要使用 `127.0.0.1`。
- 不要使用 `localhost`。
- 在 Zeabur backend container 中，`localhost` 代表 backend container 自己，不代表 PostgreSQL service。
- 若 `DATABASE_URL` 還是 localhost，migration/seed 會連錯地方。

## 六、Migration / Seed 策略

不要在 `npm start` 自動執行 migration / seed。

原因：

- production startup 不應執行不可預期資料庫變更。
- seed 不應每次 deploy 都跑。
- migration 應由人工或 one-off command 控制。
- 若 deploy 自動重啟多次，自動 migration/seed 會增加排查難度。

第一次部署後，請在 Zeabur backend service shell / console / one-off command 手動執行：

```bash
npm run db:migrate
```

成功後再執行：

```bash
npm run db:seed
```

再確認 backend running：

```bash
npm start
```

順序必須是：

```text
migration -> seed -> app smoke test
```

migration runner 設計：

- 建立 `schema_migrations` tracking table。
- 依檔名順序執行 migration。
- 已執行 migration 不重複執行。
- 已執行 migration 會檢查 checksum。
- 每個 migration 用 transaction 包住。

## 七、Zeabur Smoke Test

把 `YOUR_ZEABUR_DOMAIN` 換成實際 Zeabur backend public domain。

### 1. Health check

```bash
curl https://YOUR-ZEABUR-DOMAIN/healthz
```

確認：

- `ok` 是 `true`。
- `requestId` 存在。
- 不暴露 secrets。

### 2. Auth login

```bash
curl -s -X POST https://YOUR-ZEABUR-DOMAIN/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ChangeMe123!"}'
```

確認：

- 回傳 `accessToken`。
- 不回傳 `password_hash`。

### 3. Auth me

```bash
curl -s https://YOUR-ZEABUR-DOMAIN/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

確認：

- token 有效。
- 回傳目前 user。
- 不回傳 `password_hash`。

### 4. Organization create / list / read

Create:

```bash
curl -s -X POST https://YOUR-ZEABUR-DOMAIN/api/v1/admin/organizations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationCode": "client-a",
    "organizationName": "Client A",
    "status": "active"
  }'
```

List:

```bash
curl -s https://YOUR-ZEABUR-DOMAIN/api/v1/admin/organizations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Read:

```bash
curl -s https://YOUR-ZEABUR-DOMAIN/api/v1/admin/organizations/ORG_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

確認：

- organization 建立成功。
- `organizationCode` 唯一。
- DTO 不回傳 secrets。

### 5. Case / customer create

```bash
curl -s -X POST https://YOUR-ZEABUR-DOMAIN/api/v1/admin/cases \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "ORG_UUID",
    "customer": {
      "customerName": "王小明",
      "mobile": "0912345678",
      "tel": "02-12345678",
      "city": "Taipei",
      "address": "台北市測試路 1 號"
    },
    "case": {
      "source": "admin",
      "brand": "Test Brand",
      "caseType": "repair",
      "productType": "TV",
      "modelNo": "MODEL-001",
      "problemDescription": "無法開機",
      "priority": "normal",
      "warrantyStatus": "unknown",
      "serviceRegion": "north"
    }
  }'
```

確認：

- customer 使用 `organization_id + mobile` 查找或建立。
- case 建立成功。
- `organization_id` 正確。
- `customer_snapshot` 包含建案當下客戶快照。

### 6. Workflow submit / review / accept

Submit:

```bash
curl -s -X POST https://YOUR-ZEABUR-DOMAIN/api/v1/admin/cases/CASE_UUID/submit \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note":"資料確認完成"}'
```

Review:

```bash
curl -s -X POST https://YOUR-ZEABUR-DOMAIN/api/v1/admin/cases/CASE_UUID/review \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note":"開始審核"}'
```

Accept:

```bash
curl -s -X POST https://YOUR-ZEABUR-DOMAIN/api/v1/admin/cases/CASE_UUID/accept \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note":"案件受理"}'
```

確認：

- `draft -> submitted -> reviewing -> accepted`。
- timestamps 正確更新。
- `last_internal_activity_at` 更新。
- audit 有 `case.status_changed`。

## 八、LINE Webhook URL

未來 LINE webhook URL 格式：

```text
https://YOUR-ZEABUR-DOMAIN/api/v1/line/webhook/:channelCode
```

例如：

```text
https://xxx.zeabur.app/api/v1/line/webhook/client-a
```

提醒：

- 每個 LINE channel 對應不同 `channelCode`。
- webhook signature 使用該 channel 的 `channel_secret` 驗證。
- 不可只用單一 LINE token 處理所有 organization。
- 未來 LINE Push / notification 必須依 `organization_id + line_channel_id` 選擇 token。

## 九、R2 / Attachment Note

附件策略：

- 附件不放 PostgreSQL。
- PostgreSQL 只保存 attachment metadata。
- 檔案本體應放 Cloudflare R2。
- 後端負責 signed URL access control boundary。

R2 env 未設定時：

- app 仍應可啟動。
- `/healthz` 不應受 R2 設定影響。
- signed URL endpoint 可回 storage config error。
- non-storage routes 不應受影響。

## 十、OpenAI / AI Note

AI 設定策略：

- `OPENAI_API_KEY` 可以先留空。
- 目前是 placeholder/foundation 架構，不需要真的 OpenAI provider 才能跑 migration 或 health check。
- AI provider 不應影響 migration / seed / `/healthz`。
- 未來正式 AI provider 才需要設定 `OPENAI_API_KEY`。

AI 邊界仍維持：

- AI 只能 summarize / classify / suggest / extract。
- AI 不可直接 accept / reject / settle / assign。

## 十一、Rollback / Recovery Notes

Migration 失敗時：

- 不要直接手動改 production DB。
- 先看錯誤訊息與失敗 migration 檔案。
- 檢查 `schema_migrations`。
- 若 checksum mismatch，代表已執行 migration 被修改。
- 正式環境應新增新 migration 修正，不要修改舊 migration。

Seed 失敗時：

- 確認 migration 已成功。
- seed 可重跑，但仍需確認不重複建立 active records。
- 若 seed 權限缺漏，優先補 seed 的 idempotent data，不要手動在 DB 補一半。

Production DB：

- 正式資料庫要備份。
- migration 前建議確認備份或 snapshot 策略。
- 若已進 production traffic，migration 應先在 staging 驗證。

## 十二、Common Mistakes

常見錯誤：

- `DATABASE_URL` 還是 localhost。
- 忘記設定 `JWT_SECRET`。
- 忘記跑 `npm run db:migrate`。
- 忘記跑 `npm run db:seed`。
- app start command 設錯，沒有用 `npm start`。
- Zeabur service 沒有 public domain。
- `APP_BASE_URL` 仍是 `http://localhost:3000`。
- LINE webhook URL 填錯 `channelCode`。
- R2 未設定就直接測 signed URL endpoint。
- 把 Zeabur PostgreSQL password 或 connection string commit 到 git。

## 十三、Final Checklist

Zeabur service:

- [ ] PostgreSQL service created.
- [ ] PostgreSQL service is persistent.
- [ ] Backend service created from GitHub repo.
- [ ] Start command is `npm start`.
- [ ] Public domain is available.

Environment:

- [ ] `DATABASE_URL` points to Zeabur PostgreSQL.
- [ ] `JWT_SECRET` is set.
- [ ] `APP_BASE_URL` points to Zeabur backend domain.
- [ ] Provider env vars are either intentionally blank or configured.

Database:

- [ ] `npm run db:migrate` succeeded.
- [ ] `npm run db:seed` succeeded.

Smoke:

- [ ] `/healthz` works.
- [ ] auth login works.
- [ ] auth me works.
- [ ] organization create/list/read works.
- [ ] case/customer create works.
- [ ] workflow submit/review/accept works.

## Recommendation

Set up Zeabur PostgreSQL and backend service first, then run:

```bash
npm run db:migrate
npm run db:seed
```

After that, use the Zeabur public domain to run the health/auth/organization/case/workflow smoke tests above.
