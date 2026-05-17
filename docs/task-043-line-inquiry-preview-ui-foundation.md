# Task 043 - LINE Inquiry Preview UI Foundation

## Scope

Task 043 adds a LINE inquiry preview mode to the existing `/customer-inquiries` admin page.

Included:

- LINE inquiry preview form
- `POST /api/v1/public/line-case-inquiry`
- `channelCode + caseNo + lineUserId` validation
- Shared customer-visible result rendering
- Generic failure rendering
- Clear behavior for LINE form/result/error state

Not included:

- Public inquiry backend changes
- Formal customer portal
- LINE chatbot
- LINE webhook flow
- Rich Menu / LIFF / LINE Push
- OTP / SMS
- Rate limiting
- Notification sending
- AI customer service

## API Route

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

The admin frontend uses the existing `inquiryByLineUser(payload)` API client function with `skipAuth: true`.

## Protected Admin Page And Public Endpoint

The `/customer-inquiries` page is still protected by the admin frontend route guard and currently uses `cases.read` for visibility. Admin/system users are treated as having full visibility.

The LINE inquiry endpoint itself is public and does not require a Bearer token.

## LINE Identity Scope

LINE inquiry is organization/channel scoped.

The backend resolves:

```text
channelCode -> line_channels.organization_id + line_channels.id
```

Then it verifies:

```text
organization_id + line_channel_id + lineUserId
```

against customer LINE identities. `lineUserId` alone must not be treated as a global identity.

## Customer-visible Fields

The LINE preview reuses the same customer-visible renderer as the caseNo + mobile preview.

It only renders:

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

It must not render LINE identity records, LINE channel secrets, LINE access tokens, internal notes, audit logs, AI raw output, OCR raw output, billing data, engineer notes, dispatch rules, permissions, or internal workflow metadata.

## Generic Failure Behavior

Failed LINE inquiry must show the same generic failure message:

```text
Unable to verify the case with the provided information.
```

The UI must not infer whether:

- `channelCode` exists
- the case exists
- `lineUserId` is linked
- the identity matches the organization/channel

## lineUserId Storage Rule

Task 043 keeps `lineUserId` only in component state while the form is open.

It is not stored in:

- query string
- localStorage
- sessionStorage

The page also does not log `lineUserId` or full request payload values.

## How to Test

1. Start the admin frontend.
2. Log in as an admin or a user with `cases.read`.
3. Open `/customer-inquiries`.
4. Confirm the existing caseNo + mobile mode still works.
5. Switch to `LINE 查詢預覽`.
6. Enter `channelCode`, `caseNo`, and `lineUserId`.
7. Submit with a known valid LINE identity if available.
8. Confirm only customer-visible fields are shown on success.
9. Submit with an invalid `lineUserId`.
10. Confirm generic failure is shown without identifying which field failed.
11. Use clear and confirm line form/result/error state is cleared.
12. Confirm `lineUserId` is not present in the URL or browser storage.

Zeabur API example:

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

## Safety Notes

- No backend API behavior is changed.
- No migration is added.
- No LINE webhook, chatbot, push, LIFF, or notification behavior is added.
- No admin attachment download URL is generated.
- No internal-only data is rendered.

## Known Limitations

- There is no LINE channel picker.
- There is no valid LINE identity fixture guaranteed in every environment.
- If no valid fixture exists, only generic failure behavior can be verified.
- This is an admin preview, not a customer-facing LINE UX.

## Next Step

A safe next task is a minimal LINE Channel Admin read page or fixture guide so testers can discover valid `channelCode` values without exposing channel secrets or access tokens.
