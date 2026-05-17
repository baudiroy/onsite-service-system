# Task 034 Case Workflow Actions Foundation

## Scope

This task adds first-version case workflow action controls to the existing admin `/cases` detail view.

It only covers:

- submit
- review
- accept
- reject
- cancel

It does not implement dispatch scheduling, appointment UI, attachments, OCR, AI summary, field service reports, billing, settlement, or a full close UI.

## API Routes

- `POST /api/v1/admin/cases/:caseId/submit`
- `POST /api/v1/admin/cases/:caseId/review`
- `POST /api/v1/admin/cases/:caseId/accept`
- `POST /api/v1/admin/cases/:caseId/reject`
- `POST /api/v1/admin/cases/:caseId/cancel`
- `POST /api/v1/admin/cases/:caseId/close`

`closeCase()` exists in the frontend API client for future use, but the UI does not expose a close button in this task.

## Permission Rules

- submit requires `cases.update`
- review requires `cases.review`
- accept requires `cases.accept`
- reject requires `cases.reject`
- cancel requires `cases.cancel`
- close requires `cases.close`, but close UI remains future scope
- admin/system users are treated as fully privileged through the existing auth helper foundation

The backend remains the final permission and workflow validation authority.

## Status To Available Actions

| Status | Actions |
| --- | --- |
| `draft` | submit |
| `pending_customer` | submit |
| `submitted` | review, cancel |
| `reviewing` | accept, reject, cancel |
| `completed` | close is future/disabled note only |
| `accepted`, `rejected`, `cancelled`, `closed` | no Task 034 action buttons |

## Payloads

Submit, review, accept:

```json
{
  "note": "optional note"
}
```

Reject, cancel:

```json
{
  "reason": "required reason",
  "note": "optional note"
}
```

Close future:

```json
{
  "note": "optional note"
}
```

## Why Close Is Not Opened Yet

Close requires completed case state plus service completion, billing, and settlement conditions. The backend has a close endpoint, but the admin frontend should expose it only after the UI can clearly explain and validate those operational prerequisites.

## How To Run

```bash
npm run admin:check
npm run admin:build
```

Optional Zeabur API manual check:

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

## Manual Verification

- Login as admin.
- Open `/cases`.
- Create or open a draft case.
- Confirm draft or pending_customer can submit.
- Submit the case and confirm status becomes submitted.
- Confirm submitted can review or cancel.
- Review and confirm status becomes reviewing.
- Confirm reviewing can accept, reject, or cancel.
- Confirm reject/cancel require a reason.
- Confirm workflow success refreshes detail and list data.
- Confirm the frontend does not PATCH `status` directly.

## Safety Notes

- The workflow modal sends only note or reason/note payloads.
- It does not render audit logs, internal notes, AI raw payload, OCR raw output, or billing details.
- It does not log passwords, tokens, secrets, full customer payloads, mobile values, or LINE user IDs.
- It does not hardcode the Zeabur API domain.

## Known Limitations

- Close UI is not formally opened.
- No workflow transition timeline view yet.
- No dispatch, appointment, attachment, OCR, AI, field service, billing, or settlement operation is included.

## Suggested Next Step

A low-risk next step is a read-only Case Timeline / Messages panel so operators can see workflow events before adding more operational action surfaces.
