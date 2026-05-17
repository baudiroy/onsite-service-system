# Task 044 - LINE Channel Admin Read Page Foundation

## Scope

Task 044 adds a read-only admin page for LINE channel configuration.

Included:

- `/line-channels` protected admin page
- `GET /api/v1/admin/line-channels`
- Safe LINE channel list
- Safe LINE channel detail modal
- `channelCode` copy helper
- Secret-like field sanitizer

Not included:

- Secret editor
- LINE webhook setup wizard
- Rich Menu
- LIFF
- LINE Push
- LINE Login
- Chatbot
- Notification sending
- Secrets manager integration

## API Routes

Primary route used by this page:

```http
GET /api/v1/admin/line-channels
```

The API client also defines create/update functions for future use:

```http
POST /api/v1/admin/line-channels
PATCH /api/v1/admin/line-channels/:channelId
```

Task 044 does not expose create/update UI because those flows involve secrets.

## Permissions

Read access:

- `line.read`

Future create/update access:

- `line.manage`

Admin/system users are treated as having full visibility by the frontend permission helper.

## Safe Display Fields

The page only renders:

- `id`
- `organizationId`
- `organizationName`, if provided
- `channelCode`
- `channelName`
- `channelId`
- `enabled` / status
- `createdAt`
- `updatedAt`

## Secret-like Fields

The frontend must not render values for:

- `channelSecret`
- `channel_secret`
- `channelAccessToken`
- `channel_access_token`
- `accessToken`
- `token`
- `secret`
- `clientSecret`
- `apiKey`
- `password`
- `password_hash`
- `passwordHash`
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `R2_SECRET_ACCESS_KEY`

If the backend returns masked secrets, the frontend still ignores those fields. In development mode it may warn by key name only and must not log values.

## channelCode Usage

`channelCode` can be copied from this page and used in Task 043 LINE inquiry preview.

LINE inquiry remains scoped by the backend through:

```text
channelCode -> organization_id + line_channel_id
organization_id + line_channel_id + lineUserId
```

`lineUserId` alone is not a global identity.

## Copy Behavior

The optional copy action copies only `channelCode`.

It does not copy:

- `channelId`
- channel secret
- access token
- any raw credentials

If Clipboard API is unavailable, the UI shows a fallback message and the operator can manually select the channelCode.

## Why Create / Update Secret UI Is Not Included

Create/update flows require handling `channelSecret` and `channelAccessToken`. Those values need a stricter secret-entry design and operational review. Task 044 intentionally avoids rendering or editing secrets.

## How to Test

1. Start the admin frontend.
2. Log in as admin/system or a user with `line.read`.
3. Open `/line-channels`.
4. Confirm list loads or empty state displays.
5. Confirm table only shows safe fields.
6. Open detail view.
7. Confirm detail only shows safe fields.
8. Confirm channel secret/access token/raw credentials are not shown.
9. Copy `channelCode` if available.
10. Confirm `/customer-inquiries` LINE preview still works.

Zeabur API example:

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

## Safety Notes

- No backend API behavior is changed.
- No migration is added.
- No LINE backend logic is changed.
- No secret-like value is rendered.
- No channel credential is logged.

## Known Limitations

- No create/update UI.
- No LINE channel picker integration in `/customer-inquiries` yet.
- No webhook setup wizard.
- No Rich Menu, LIFF, Push, Login, chatbot, or notification sending.

## Next Step

A safe next task is integrating a channelCode picker into the LINE inquiry preview using this read-only channel list, without exposing secrets or changing the backend.
