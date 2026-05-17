# Task 045 - LINE Inquiry ChannelCode Picker Integration

## Scope

Task 045 integrates the read-only LINE channel list from Task 044 into the `/customer-inquiries` LINE inquiry preview mode.

This task only adds a safe `channelCode` picker and manual fallback for admin preview testing. It does not modify backend APIs, create or update LINE channels, expose secrets, build a LINE webhook setup flow, or implement customer-facing LINE UX.

## API Routes

Admin protected route:

```http
GET /api/v1/admin/line-channels
```

Public inquiry route:

```http
POST /api/v1/public/line-case-inquiry
```

The LINE inquiry request shape remains:

```json
{
  "channelCode": "client-a",
  "caseNo": "TW-20260514-000001",
  "lineUserId": "Uxxxxxxxxxxxxxxxx"
}
```

The public inquiry request uses `skipAuth: true`. The admin page itself remains protected.

## Permissions

- `/customer-inquiries` visibility continues to use `cases.read`.
- The channelCode picker attempts to load channels only when the current user has `line.read` or is admin/system.
- Users without `line.read` can still manually type `channelCode`.
- Backend remains the final permission and inquiry validation source of truth.

## Picker Behavior

The LINE inquiry preview form now supports:

- read-only LINE channel picker
- manual `channelCode` fallback input
- refresh channel list button
- loading, empty, and error states

The picker label displays only safe fields:

- channelName
- channelCode
- organizationName or organizationId
- enabled/disabled status

Disabled channels are still shown with a disabled label so admins can test configured but disabled channel codes when needed. Manual input remains available for channels not returned by the list endpoint.

## Secret-Like Fields

The picker reuses the sanitized LINE channel API client from Task 044. The frontend does not render values for secret-like fields, including:

- channelSecret
- channel_secret
- channelAccessToken
- channel_access_token
- accessToken
- token
- secret
- clientSecret
- apiKey
- password
- password_hash
- passwordHash
- DATABASE_URL
- JWT_SECRET
- OPENAI_API_KEY
- R2_SECRET_ACCESS_KEY

Development warnings may mention key names only. Values are not rendered or logged.

## lineUserId Storage Rule

`lineUserId` remains only in React component state while the form is open.

It is not written to:

- query string
- localStorage
- sessionStorage

The optional `/line-channels` shortcut only passes `mode=line` and `channelCode`; it never passes `lineUserId` and never auto-submits an inquiry.

## Generic Failure

Failed LINE inquiry verification continues to show the generic failure message:

```text
Unable to verify the case with the provided information.
```

The UI must not infer whether:

- channelCode exists
- the case exists
- lineUserId is linked
- the LINE identity matches the channel or organization

## How To Start

```bash
npm run admin:check
npm run admin:build
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

## How To Test

1. Log in as an admin/system user or a user with `cases.read`.
2. Open `/customer-inquiries`.
3. Switch to LINE inquiry preview.
4. If the user has `line.read`, confirm the channelCode picker loads or shows an empty/error state.
5. Confirm the picker shows only safe fields.
6. Select a channelCode, enter `caseNo` and `lineUserId`, then submit.
7. If a valid LINE identity fixture exists, confirm only customer-visible fields are rendered.
8. If no fixture exists, confirm failed verification is generic.
9. Use manual channelCode input and confirm the same behavior.
10. Use clear and confirm channelCode, selected channel, caseNo, lineUserId, result, and error are cleared.
11. Confirm `lineUserId` is absent from URL, localStorage, and sessionStorage.
12. Confirm `/line-channels` can open the LINE inquiry preview with only `channelCode` prefilled.

## Safety Notes

- Do not log `lineUserId` or full inquiry payloads.
- Do not display LINE channel secrets, access tokens, raw credentials, internal notes, audit logs, AI raw output, OCR raw output, billing data, dispatch rules, engineer notes, or permissions.
- Do not create admin attachment download URLs from public inquiry results.
- Do not modify backend auth, RBAC, LINE backend, or public inquiry backend.

## Known Limitations

- There is no LINE channel create/update UI.
- There is no LINE channel picker inside other workflows.
- A valid LINE identity fixture may not exist in every environment.
- This remains an admin preview tool, not a customer-facing LINE UX.

## Next Steps

- Add a small fixture guide for creating safe LINE inquiry test data.
- Consider a future channel picker that supports organization filtering.
- Build formal LINE Channel Management only after a secure secrets-handling design is approved.
