# Task 041 - Customer Inquiry Admin Preview Foundation

## Scope

Task 041 adds the first admin-side customer inquiry preview page.

Included:

- `/customer-inquiries` protected admin page
- `POST /api/v1/public/case-inquiry` preview by `caseNo + mobile`
- Public API client functions with `skipAuth`
- Customer-visible result rendering
- Generic failure rendering
- Internal-only key sanitization and development-only key warning

Not included:

- Formal customer-facing portal
- LINE chatbot
- OTP / SMS
- Rate limiter
- Notification sending
- AI customer service
- Admin attachment download URL generation

## API Routes

Primary UI route:

```http
POST /api/v1/public/case-inquiry
```

Request:

```json
{
  "caseNo": "TW-20260514-000001",
  "mobile": "0912345678"
}
```

The API client also includes a future LINE inquiry function:

```http
POST /api/v1/public/line-case-inquiry
```

Request:

```json
{
  "channelCode": "client-a",
  "caseNo": "TW-20260514-000001",
  "lineUserId": "Uxxxxxxxxxxxxxxxx"
}
```

Task 041 does not build the LINE inquiry UI.

## Protected Admin Page And Public Endpoint

The `/customer-inquiries` page is protected by the admin frontend route guard and currently follows the menu visibility rule for `cases.read`.

The public inquiry endpoints themselves do not require a Bearer token. The frontend API client calls them with `skipAuth: true`.

## Customer-visible Fields

The page only renders these customer-visible fields:

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

Attachments are shown only as public response metadata. The page does not create admin download URLs.

## Generic Failure Behavior

Failed verification is shown as a generic failure:

```json
{
  "verified": false,
  "message": "Unable to verify the case with the provided information."
}
```

The UI must not infer or display whether:

- The case exists
- The mobile matched
- The LINE user ID matched

## Internal-only Fields

The frontend renders from a strict allowlist and ignores internal-only keys such as:

- internal notes
- audit logs
- AI raw output
- OCR raw output
- dispatch rules
- engineer notes
- billing data
- permissions
- password/token/secret/API key fields

In development mode, if the response contains internal-only keys, the frontend may warn by key name only. It must not log field values.

## How to Test

1. Start the admin frontend.
2. Log in as an admin user or a user with `cases.read`.
3. Open `/customer-inquiries`.
4. Submit a known `caseNo + mobile`.
5. Confirm only customer-visible fields are rendered.
6. Submit the same `caseNo` with a wrong mobile.
7. Confirm the generic failure is shown and the UI does not infer the reason.
8. Confirm the browser console does not show password, token, secret, mobile, lineUserId, or full payload values.

Zeabur API example:

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

## Safety Notes

- No backend API behavior is changed.
- No migration is added.
- The public inquiry client uses `skipAuth`.
- The page is still inside the protected admin shell.
- The page does not display internal-only data.
- The page does not create admin attachment download URLs.

## Known Limitations

- LINE inquiry has an API client function but no full UI yet.
- There is no direct shortcut from case detail to this preview page in Task 041.
- The page does not implement a formal customer portal.
- The page does not implement OTP, SMS, rate limiting, notification sending, or chatbot flows.

## Next Step

A safe next task is adding a small case detail shortcut to `/customer-inquiries` that pre-fills `caseNo` and the customer snapshot mobile when available, without changing the public inquiry backend.
