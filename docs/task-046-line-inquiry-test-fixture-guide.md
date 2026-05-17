# Task 046 - LINE Inquiry Test Fixture Guide / Smoke Foundation

## Scope

Task 046 documents and smoke-tests a safe LINE inquiry fixture for Task 043 and Task 045.

The goal is to verify:

- successful public LINE inquiry by `channelCode + caseNo + lineUserId`
- generic failure behavior for wrong `lineUserId`, wrong `caseNo`, and wrong `channelCode`
- customer-visible response boundaries

This task does not implement a LINE chatbot, webhook flow, LINE Push, Rich Menu, LIFF, LINE Login, notification delivery, rate limiting, OTP/SMS, or a customer portal.

## Fixture Data Model

A successful LINE inquiry fixture requires these records to be in the same organization scope:

1. `organizations`
2. `line_channels`
3. `customers`
4. `customer_line_identities`
5. `cases`

The required scope chain is:

```text
channelCode
-> line_channels.organization_id
-> line_channels.id
-> customer_line_identities.organization_id
-> customer_line_identities.line_channel_id
-> customer_line_identities.line_user_id
-> customer_line_identities.customer_id
-> cases.customer_id
-> cases.organization_id
```

`lineUserId` must never be treated as a global identity. It is scoped by `organization_id + line_channel_id + line_user_id`.

## Existing API Capability

The current backend can create fixture records through admin APIs:

- `POST /api/v1/admin/organizations`
- `POST /api/v1/admin/line-channels`
- `POST /api/v1/admin/customers`
- `POST /api/v1/admin/cases`
- `POST /api/v1/admin/customers/:customerId/line-identities`

Task 047 adds the dedicated admin API for creating `customer_line_identities`.

The default Task 046 fixture strategy is now **API-first**:

- API creates organization, LINE channel, customer/case.
- API links customer to LINE identity.

A legacy DB fixture fallback can still be enabled only for local or Zeabur test environments with `USE_DB_LINE_IDENTITY_FIXTURE=1`. It is not the default path.

## Safety Rules

- Do not commit real `channelSecret`.
- Do not commit real `channelAccessToken`.
- Do not use real customer mobile numbers.
- Do not use real customer LINE user IDs.
- Use test values such as `Utask046test...`.
- Do not log secrets, access tokens, full request payloads, or raw `lineUserId`.
- Mask `lineUserId` in smoke output.
- Keep real secrets in environment variables or dedicated test DB rows only.

## API-First Fixture Flow

Use an admin/system account with required permissions:

- `organizations.manage`
- `line.manage`
- `cases.create`

Create organization:

```bash
curl -s -X POST "$API_BASE_URL/api/v1/admin/organizations" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationCode": "task046-org-example",
    "organizationName": "Task046 Fixture Organization",
    "status": "active"
  }'
```

Create LINE channel:

```bash
curl -s -X POST "$API_BASE_URL/api/v1/admin/line-channels" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "ORG_UUID",
    "channelCode": "task046-line-channel",
    "channelName": "Task046 LINE Test Channel",
    "channelSecret": "test-secret-only",
    "channelAccessToken": "test-access-token-only",
    "enabled": true
  }'
```

Create case with customer data:

```bash
curl -s -X POST "$API_BASE_URL/api/v1/admin/cases" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "ORG_UUID",
    "customer": {
      "customerName": "Task046 Test Customer",
      "mobile": "0900000046",
      "city": "Taipei",
      "address": "Task046 Test Address",
      "source": "admin"
    },
    "case": {
      "source": "line",
      "brand": "Task046 Brand",
      "caseType": "repair",
      "productType": "TV",
      "modelNo": "T046",
      "problemDescription": "Task046 LINE inquiry fixture case",
      "priority": "normal",
      "warrantyStatus": "unknown",
      "serviceRegion": "north",
      "intakeLineChannelId": "LINE_CHANNEL_UUID"
    }
  }'
```

## Admin API For LINE Identity

Use the Task 047 identity linking API:

```bash
curl -s -X POST "$API_BASE_URL/api/v1/admin/customers/CUSTOMER_UUID/line-identities" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lineChannelId": "LINE_CHANNEL_UUID",
    "lineUserId": "Utask046testuser",
    "displayName": "Task046 LINE Fixture User"
  }'
```

Expected response:

- `id`
- `customerId`
- `organizationId`
- `lineChannelId`
- `channelCode`
- `channelName`
- `lineUserIdMasked`
- `displayName`
- timestamps

The response must not include raw `lineUserId`, `channelSecret`, or `channelAccessToken`.

## Legacy DB Fixture Fallback

If the Task 047 admin API is unavailable in a local branch, a test-only DB fallback can insert the identity:

```sql
INSERT INTO customer_line_identities (
  customer_id,
  organization_id,
  line_channel_id,
  line_user_id,
  display_name,
  linked_at
)
VALUES (
  'CUSTOMER_UUID',
  'ORG_UUID',
  'LINE_CHANNEL_UUID',
  'Utask046testuser',
  'Task046 LINE Fixture User',
  now()
);
```

Use this only in test environments with `USE_DB_LINE_IDENTITY_FIXTURE=1`. Do not use real customer LINE user IDs.

## Public LINE Inquiry Success Test

Request:

```bash
curl -s -X POST "$API_BASE_URL/api/v1/public/line-case-inquiry" \
  -H "Content-Type: application/json" \
  -d '{
    "channelCode": "task046-line-channel",
    "caseNo": "TW-TEST-000001",
    "lineUserId": "Utask046testuser"
  }'
```

Expected:

- `verified: true`
- customer-visible case result
- no internal-only fields

The response may include only safe customer-visible fields such as:

- `caseNo`
- `status`
- `customerVisibleStatus`
- `brand`
- `productType`
- `modelNo`
- `createdAt`
- `updatedAt`
- `preferredVisitTime`
- `latestCustomerVisibleMessage`
- `customerVisibleAttachments`

## Public LINE Inquiry Failure Tests

Test these variants:

- wrong `lineUserId`
- wrong `caseNo`
- wrong `channelCode`

Expected response:

```json
{
  "data": {
    "verified": false,
    "message": "Unable to verify the case with the provided information."
  }
}
```

The API must not reveal whether the channel, case, or LINE identity failed.

## Admin Preview Test

1. Log in to admin frontend.
2. Open `/line-channels`.
3. Confirm the fixture `channelCode` appears without secrets or access tokens.
4. Open `/customer-inquiries`.
5. Switch to LINE inquiry preview.
6. Select the fixture channel from the picker.
7. Enter the fixture `caseNo` and test `lineUserId`.
8. Submit and verify a customer-visible result.
9. Submit with a wrong `lineUserId` and verify generic failure.

## Smoke Script

Task 046 adds:

```bash
npm run smoke:046
```

Environment variables:

```bash
API_BASE_URL=https://onsite-service-api.zeabur.app
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
DATABASE_URL=postgres://...
npm run smoke:046
```

The smoke script:

1. logs in as admin
2. creates a task-specific organization
3. creates a task-specific LINE channel with test-only credentials
4. creates a task-specific customer/case through the admin case API
5. links `customer_line_identities` through the Admin LINE identity API
6. verifies public LINE inquiry success
7. verifies wrong `lineUserId`, wrong `caseNo`, and wrong `channelCode` generic failure
8. checks that public responses do not include internal-only keys

`DATABASE_URL` is only needed for the legacy fallback path:

```bash
USE_DB_LINE_IDENTITY_FIXTURE=1 DATABASE_URL=postgres://... npm run smoke:046
```

The script masks `lineUserId` in output and does not log full inquiry payloads.

## Internal-Only Fields

The smoke script fails if public inquiry responses include keys such as:

- internal notes
- audit logs
- AI raw output
- OCR raw output
- billing data
- dispatch rules
- engineer notes
- permissions
- channelSecret
- channelAccessToken
- token
- password_hash

## Known Limitations

- Legacy branches without Task 047 still need the DB fallback.
- The fixture creates test rows and does not clean them up automatically.
- Production LINE identities cannot be assumed to match synthetic test IDs.
- This is not a customer-facing LINE UX.

## Next Steps

- Add a cleanup option for Task 046 fixtures.
- Add organization filtering to the LINE channel picker.
- Design a secure LINE channel create/update UX that does not expose secrets.
