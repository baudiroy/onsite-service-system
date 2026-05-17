# Task 047 - LINE Identity Linking Admin API Foundation

## Scope

Task 047 adds a permission-protected backend Admin API for linking customers to LINE identities.

This foundation supports:

- LINE inquiry preview success fixtures
- public LINE inquiry validation
- future LINE chatbot identity linking
- future multi-organization LINE identity management

This task does not implement a LINE chatbot, webhook conversation flow, LINE Push, Rich Menu, LIFF, LINE Login, OTP/SMS, customer portal, or secrets manager integration.

## API Routes

```http
GET    /api/v1/admin/customers/:customerId/line-identities
POST   /api/v1/admin/customers/:customerId/line-identities
DELETE /api/v1/admin/customers/:customerId/line-identities/:identityId
```

## Permissions

- List identities: `line.read`
- Link identity: `line.manage`
- Unlink identity: `line.manage`

Admin/system users are expected to have full backend permission through the existing auth/RBAC model.

## Organization Scope Rules

The backend remains the source of truth for organization access.

Rules:

- `lineUserId` is not a global identity.
- LINE identity scope is `organization_id + line_channel_id + line_user_id`.
- Customer must exist.
- LINE channel must exist.
- Customer organization must match LINE channel organization.
- Current user must have access to that organization.
- Regular users can only operate inside their allowed organization scope.
- Admin/system users can operate across organizations.

## Link Payload

```json
{
  "lineChannelId": "LINE_CHANNEL_UUID",
  "lineUserId": "Uxxxxxxxxxxxxxxxx",
  "displayName": "optional display name"
}
```

`lineUserId` is trimmed and must not be blank.

## Response DTO

The identity DTO returns safe fields only:

- `id`
- `customerId`
- `organizationId`
- `lineChannelId`
- `channelCode`
- `channelName`
- `lineUserIdMasked`
- `displayName`
- `linkedAt`
- `createdAt`

The DTO does not return:

- raw `lineUserId`
- `channelSecret`
- `channelAccessToken`
- access tokens
- raw credentials

## Masking Rule

Raw LINE user IDs are masked before returning or writing audit metadata.

Example:

```text
Utask047testuser -> Utask0***user
```

Exact masking depends on the shared mapper helper, but raw values must not appear in API responses or audit logs.

## Duplicate And Conflict Behavior

The link endpoint is idempotent when the same active identity is already linked to the same customer.

If the same `organization_id + line_channel_id + line_user_id` is already linked to another customer, the API returns a conflict instead of silently reassigning the identity.

If an active identity exists without a customer, the service may attach it to the requested customer after validating organization scope.

## Unlink Behavior

Unlink is implemented as soft unlink:

```text
customer_line_identities.unlinked_at = now()
```

The row is not hard deleted. After unlink, public LINE inquiry should fail with the same generic failure shape.

## Audit Events

Task 047 records:

- `customer_line_identity.linked`
- `customer_line_identity.unlinked`

Audit data may include:

- `customerId`
- `organizationId`
- `lineChannelId`
- `channelCode`
- `lineUserIdMasked`
- safe display name

Audit data must not include:

- raw `lineUserId`
- channel secrets
- channel access tokens
- raw credentials

The existing audit entity type constraint already includes `customer_line_identity`, so no migration is required.

## Smoke 046 Update

`npm run smoke:046` now uses the Admin LINE identity API by default.

Legacy DB fixture fallback is available only when explicitly enabled:

```bash
USE_DB_LINE_IDENTITY_FIXTURE=1 DATABASE_URL=postgres://... npm run smoke:046
```

## Smoke 047

Task 047 adds:

```bash
npm run smoke:047
```

Environment:

```bash
API_BASE_URL=https://onsite-service-api.zeabur.app
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
npm run smoke:047
```

The smoke validates:

1. admin can link a customer LINE identity
2. list returns masked identity data
3. response does not include raw `lineUserId`
4. response does not include channel secrets or access tokens
5. duplicate link is idempotent
6. same channel + `lineUserId` cannot link to another customer
7. cross-organization customer/channel link fails
8. public LINE inquiry success uses the admin-linked identity
9. wrong `lineUserId`, wrong case, and wrong channel remain generic failures
10. unlink makes public LINE inquiry fail generically

## Security Notes

- Do not log raw `lineUserId`.
- Do not log full request payloads containing LINE identity values.
- Do not return channel secrets or access tokens.
- Do not modify public inquiry generic failure behavior.
- Do not treat `lineUserId` as globally unique.
- Do not add chatbot, webhook conversation, push, portal, or notification behavior in this task.

## Known Limitations

- No admin frontend UI is added in Task 047.
- Regular-user organization-scope smoke is not fully covered by `smoke:047`; admin path and backend service scope checks are covered.
- Smoke fixture rows are not automatically cleaned up.
- There is no customer-facing LINE UX.

## Next Steps

- Add a regular-user organization-scope smoke for `line.read` / `line.manage`.
- Add cleanup or idempotent fixture mode to smoke scripts.
- Add an admin frontend read-only customer LINE identities panel.
- Add a future secure LINE identity linking UI after operator UX is designed.
