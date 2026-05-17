# Task 040 - Case Close Workflow UI Foundation

## Scope

Task 040 connects the existing backend case close workflow to the admin case detail UI.

Included:

- Case detail close readiness checklist
- Close confirmation modal
- `POST /api/v1/admin/cases/:caseId/close`
- Refresh of case detail, case list, timeline messages, billing, and settlements after close

Not included:

- Automatic case close
- Payment gateway
- ERP sync
- Invoice issuance
- Accounting export
- Vendor settlement rule engine
- AI automatic close decision

## API Route

```http
POST /api/v1/admin/cases/:caseId/close
```

Payload:

```json
{
  "note": "服務與帳務已確認，正式結案"
}
```

The existing admin frontend `closeCase(caseId, payload)` API client function is used.

## Permission

The close action requires:

- `cases.close`

Admin/system users are treated as having full access by the frontend permission helper.

Users with `cases.read` can see the readonly close readiness section. Users without `cases.close` cannot submit the close action from the UI.

## Close Readiness Checklist

The frontend shows a readiness checklist before allowing the user to open the close modal:

- Case status is `completed`
- Completed time exists, if the frontend can confirm it
- If a billing record exists, `billingStatus` is `approved` or `settled`
- No settlement records remain `pending` or `submitted`
- Case is not already `closed`

The frontend checklist is only a user-experience guard. The backend remains the final validator for close rules, permissions, AI-user restrictions, duplicate close protection, and data consistency.

## Success Behavior

After a successful close:

- The modal closes
- Case detail refreshes
- Case list refreshes
- Timeline/messages refreshes
- Billing/settlement state refreshes
- A success message is shown

Expected backend effects:

- `cases.status = closed`
- `cases.closed_at = now()`
- `cases.last_internal_activity_at = now()`
- Audit log action `case.closed`
- Timeline message: `案件已結案`

## Failure Handling

If the backend rejects the close request, the UI shows `error.message` from the backend error shape.

In development mode, `requestId` may be displayed when available through the shared API client error handling. Stack traces are not shown in the UI.

## How to Test

1. Start the admin frontend with the desired API base URL.
2. Log in as an admin/system user.
3. Open `/cases`.
4. Open a completed case.
5. Confirm billing is `approved` or `settled` if billing exists.
6. Confirm settlements have no `pending` or `submitted` records.
7. Open the close confirmation modal.
8. Submit close with an optional note.
9. Confirm case status changes to `closed`.
10. Confirm timeline/messages refresh and show the close workflow event if the backend writes it.

Zeabur API example:

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

## Safety Notes

- The UI never directly patches `case.status`.
- The UI does not auto-close cases.
- The UI does not perform payment, ERP, invoice, accounting export, or AI judgment.
- The UI does not display audit logs, AI raw payload, OCR raw output, or sensitive secrets.
- The backend remains the source of truth for close authorization and business validation.

## Known Limitations

- Close readiness depends on the case detail, billing record, and settlement list currently loaded in the case detail view.
- If the frontend cannot confirm `completedAt`, it shows a warning and lets the backend validate.
- There is no automatic close workflow.
- There is no customer-facing close notification in this task.

## Next Step

The next safe frontend task is to add a read-only customer inquiry/admin preview or improve completed/closed case status history visibility, without changing backend workflow rules.
