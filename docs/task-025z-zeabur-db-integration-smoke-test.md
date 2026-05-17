# Task 025Z - Zeabur DB Integration Smoke Test Plan

Date: 2026-05-16

## Overall Goal

Prepare the backend for Zeabur PostgreSQL integration smoke testing.

Task 025 was blocked by the absence of a local PostgreSQL server on `localhost:5432`. Since the production target is Zeabur, this plan shifts the next verification step to a Zeabur-hosted PostgreSQL service and a Zeabur-hosted Node.js backend service.

This task does not add business features, change schema, implement AI chatbot behavior, LINE Push, frontend, or R2 providers.

## Zeabur Project Setup

Recommended Zeabur service layout:

- Node.js backend service for this repository.
- PostgreSQL service for application data.
- Optional Redis service in the future for queues, throttling, caching, and background jobs.
- Optional Cloudflare R2 configuration through backend environment variables.

The backend service should connect to the Zeabur PostgreSQL connection string through `DATABASE_URL`. Do not use `localhost` for the deployed backend.

## PostgreSQL Service Setup

1. Create a PostgreSQL service in the same Zeabur project as the backend.
2. Copy the PostgreSQL connection string provided by Zeabur.
3. Set the backend service `DATABASE_URL` to that connection string.
4. Confirm the connection string points to the Zeabur PostgreSQL host, not `localhost`.

Expected environment shape:

```env
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE
```

## Backend Service Setup

The backend service should use:

```bash
npm install
npm start
```

Confirmed package scripts:

```text
npm start
npm run db:migrate
npm run db:seed
npm run check
```

Zeabur will inject `PORT`. The server reads `process.env.PORT` through `env.port`, so no hard-coded port is needed for deployment.

## Environment Variables

Required:

```env
DATABASE_URL=
JWT_SECRET=
APP_BASE_URL=
```

Optional or provider-specific:

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

Notes:

- `DATABASE_URL` must use the Zeabur PostgreSQL connection string.
- Do not commit secrets to git.
- `JWT_SECRET` must be a long random value in production.
- `APP_BASE_URL` should be the Zeabur app URL, for example `https://YOUR-ZEABUR-DOMAIN`.
- LINE, R2, and OpenAI variables may be left empty for Phase 1 smoke testing.
- Missing LINE/R2/OpenAI provider config should not block `/healthz`.
- R2 signed URL endpoints may return storage configuration errors when R2 env vars are missing.

## Migration Strategy

Do not automatically run migrations inside `npm start`.

Phase 1 Zeabur strategy:

1. Deploy backend service.
2. Attach/set `DATABASE_URL`.
3. Run migrations manually from Zeabur console, shell, or one-off command:

```bash
npm run db:migrate
```

4. Run seed after migrations:

```bash
npm run db:seed
```

5. Start or restart the app:

```bash
npm start
```

Rules:

- Migration must run before seed.
- App start should not run destructive or automatic production migrations.
- The migration runner uses `schema_migrations`.
- Already-applied migrations are skipped.
- Checksums are verified for already-applied migrations.
- Each migration runs in its own transaction.

## Health Check

After deployment:

```bash
curl https://YOUR-ZEABUR-DOMAIN/healthz
```

Expected:

```json
{
  "ok": true,
  "service": "onsite-service-api",
  "timestamp": "2026-05-16T00:00:00.000Z",
  "requestId": "req_..."
}
```

Confirm:

- `ok` is `true`.
- `requestId` exists.
- No secrets are exposed.
- Health still works when LINE/R2/OpenAI env vars are empty.

## Auth Smoke

After migration and seed:

```bash
curl -s -X POST https://YOUR-ZEABUR-DOMAIN/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ChangeMe123!"}'
```

Then:

```bash
curl -s https://YOUR-ZEABUR-DOMAIN/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Confirm:

- Login succeeds.
- `auth/me` succeeds with token.
- `auth/me` without token returns `AUTH_REQUIRED`.
- Response does not include `password_hash`.

## Organization Smoke

Create organization:

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

List organizations:

```bash
curl -s https://YOUR-ZEABUR-DOMAIN/api/v1/admin/organizations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Confirm:

- `organizationCode` is unique.
- DTO does not return secrets.
- Audit records `organization.created`.

## Case / Customer Smoke

Create an organization-scoped case:

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

Confirm:

- Customer is created or matched by `organization_id + mobile`.
- Case is created with correct `organization_id`.
- `customer_snapshot` includes organization/customer context.
- Case number is generated.
- Audit records customer/case creation.

## Workflow Smoke

Run:

```bash
curl -s -X POST https://YOUR-ZEABUR-DOMAIN/api/v1/admin/cases/CASE_UUID/submit \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note":"資料確認完成"}'
```

```bash
curl -s -X POST https://YOUR-ZEABUR-DOMAIN/api/v1/admin/cases/CASE_UUID/review \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note":"開始審核"}'
```

```bash
curl -s -X POST https://YOUR-ZEABUR-DOMAIN/api/v1/admin/cases/CASE_UUID/accept \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note":"案件受理"}'
```

Confirm:

- `draft -> submitted -> reviewing -> accepted`.
- Transition timestamps update.
- `last_internal_activity_at` updates.
- Direct status update through PATCH remains rejected.
- Audit records `case.status_changed`.

## LINE Webhook URL Note

After Zeabur domain is available, LINE webhook URL format is:

```text
https://YOUR-ZEABUR-DOMAIN/api/v1/line/webhook/:channelCode
```

Example:

```text
https://xxx.zeabur.app/api/v1/line/webhook/client-a
```

Important:

- Webhook route must include `channelCode`.
- `channelCode` resolves the correct `line_channels` row.
- Signature verification must use that channel's `channel_secret`.
- LINE notification sending in the future must choose token by `organization_id + line_channel_id`.
- Do not use one global `LINE_CHANNEL_ACCESS_TOKEN` for all organizations in production.

## R2 Environment Note

If R2 env vars are not configured:

- App should still start.
- `/healthz` should still work.
- Non-storage routes should still work.
- Signed URL endpoints may return a storage configuration error.

R2 is required only when testing attachment upload/download signed URL behavior.

## Optional Smoke Areas After Core Auth Works

Run these after organization/case/workflow smoke passes:

- Dispatch / appointment smoke.
- Field service report smoke.
- Billing / settlement smoke.
- Attachment / OCR smoke.
- AI job smoke.
- Customer inquiry smoke.
- Notification guard smoke.

These are not prerequisites for proving Zeabur PostgreSQL connectivity, but they are useful before a broader staging handoff.

## Known Limitations

- This plan does not execute Zeabur commands directly.
- Migration/seed still need to be run manually through Zeabur shell or one-off command.
- LINE, R2, and OpenAI provider credentials can remain unset for the first DB smoke test.
- Notification foundation is still global/system-level until organization-specific notification routing is added.
- Redis/background jobs are future work.
- This plan does not implement rollback automation.

## Rollback / Recovery Notes

If deployment fails before migration:

- Fix env vars or app build/start command.
- No DB rollback is needed.

If migration fails:

- Capture the failing migration filename and SQL error.
- Do not rerun seed until migration succeeds.
- Patch only the smallest migration bug.
- Rerun `npm run db:migrate`; the runner will skip already-applied migrations and verify checksums.

If seed fails:

- Capture the seed error.
- Verify migration completed first.
- Fix seed idempotency or permission data only if needed.
- Rerun `npm run db:seed`.

If app health fails after successful migration/seed:

- Check Zeabur runtime logs.
- Confirm `PORT`, `DATABASE_URL`, and `JWT_SECRET`.
- Confirm missing optional provider env vars are not being treated as required.

## Recommendation

Proceed with Zeabur PostgreSQL setup and run this sequence:

```bash
npm run db:migrate
npm run db:seed
npm start
curl https://YOUR-ZEABUR-DOMAIN/healthz
```

After `/healthz` and auth smoke pass, continue with organization, case/customer, and workflow smoke tests.
