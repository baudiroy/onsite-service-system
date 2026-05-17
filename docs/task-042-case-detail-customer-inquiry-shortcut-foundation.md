# Task 042 - Case Detail Customer Inquiry Shortcut Foundation

## Scope

Task 042 adds a lightweight shortcut from admin case detail to the customer inquiry preview page.

Included:

- Case detail `客戶查詢預覽` link
- Prefill of `caseNo` and customer snapshot `mobile` when available
- `/customer-inquiries` query string prefill support
- Clear behavior that resets the form, result, and URL query string

Not included:

- Public inquiry backend changes
- Formal customer portal
- LINE chatbot
- OTP / SMS
- Rate limiting
- Notification sending
- AI customer service

## Shortcut Behavior

The shortcut is shown in the case detail `Customer Snapshot` section.

It links to:

```text
/customer-inquiries?caseNo=<CASE_NO>&mobile=<CUSTOMER_MOBILE>
```

If `caseNo` exists, it is added to the query string.

If `customerSummary.mobile` exists, it is also added. If no mobile is available, the shortcut only includes `caseNo`, and the customer inquiry page asks the user to type the mobile manually.

The shortcut is placed near customer data instead of workflow actions so it is not confused with a case status transition.

## Prefill Rules

`/customer-inquiries` reads:

- `caseNo`
- `mobile`

from the current URL query string on initial load. It then fills the form but does not submit the inquiry.

The user must review the values and click submit manually.

## Mobile Prefill Safety

Query strings can be stored in browser history. Task 042 accepts this tradeoff because:

- The shortcut is only inside the protected admin shell.
- The destination page is also protected.
- The query string is only used for short-lived operator convenience.
- Clear removes the form values and replaces the current URL without the query string.

Future work may replace this with sessionStorage or navigation state if mobile exposure in browser history becomes unacceptable.

## Why It Does Not Auto Submit

The page does not auto-submit because customer inquiry verification is a public endpoint and includes customer identifiers. Requiring a manual submit gives the admin a moment to confirm values and avoids accidental repeated lookups.

## Permissions

The case detail page already requires `cases.read`.

`/customer-inquiries` remains a protected admin page and currently uses `cases.read` for visibility. Admin/system users are treated as having full visibility by the existing frontend permission helper.

The public inquiry endpoint itself still uses `skipAuth`, as implemented in Task 041.

## How to Test

1. Start the admin frontend.
2. Log in as an admin or a user with `cases.read`.
3. Open `/cases`.
4. Open a case detail record.
5. Click `客戶查詢預覽`.
6. Confirm `/customer-inquiries` opens.
7. Confirm `caseNo` is prefilled.
8. Confirm `mobile` is prefilled when the case has customer snapshot mobile.
9. If mobile is missing, confirm the page asks for manual input.
10. Confirm the form does not auto-submit.
11. Submit manually and confirm only customer-visible fields are shown.
12. Click clear and confirm form/result are cleared and the query string is removed.

Zeabur API example:

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

## Safety Notes

- No backend API behavior is changed.
- No migration is added.
- No public inquiry backend logic is changed.
- The shortcut does not infer mobile from notes, messages, or LINE user ID.
- The page does not log mobile, lineUserId, token, password, or full payload.
- The page does not display internal notes, audit logs, AI raw output, OCR raw output, billing data, dispatch rules, engineer notes, permissions, or admin attachment download URLs.

## Known Limitations

- The shortcut uses query strings, which may remain in browser history until cleared.
- There is no LINE inquiry shortcut in this task.
- There is no formal customer portal.
- There is no OTP/SMS/rate limiting/customer notification behavior.

## Next Step

The next safe task is either a small LINE inquiry preview UI foundation or a read-only customer-visible status mapping reference panel, without changing public inquiry backend behavior.
