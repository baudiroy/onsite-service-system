# Task 035 - Case Timeline / Messages Panel Foundation

## Scope

Task 035 adds the first admin-only case timeline and message panel to the existing case detail view in the admin frontend.

This task does not implement LINE webhook handling, external message delivery, notification delivery, realtime websocket updates, AI summarization, attachment upload, or customer-facing inquiry UI.

## API Routes

- `GET /api/v1/admin/cases/:caseId/messages`
- `POST /api/v1/admin/cases/:caseId/messages`
- `DELETE /api/v1/admin/messages/:messageId`

## Permissions

- `cases.read` can view the timeline and messages panel.
- `cases.update` can create internal notes.
- `cases.update` can soft delete internal notes.
- Admin/system users are treated as fully authorized by the existing frontend permission helpers.

When the actor lacks `cases.update`, the panel remains read-only and hides the internal-note composer and delete actions.

## Message Type Labels

- `internal_note` -> 內部備註
- `system_event` -> 系統事件
- `customer_note` -> 客戶備註
- `workflow_event` -> 流程事件
- `line_message` -> LINE 訊息
- `ai_summary` -> AI 摘要
- `dispatch_note` -> 派工備註
- `engineer_note` -> 工程師備註

Unknown future types are displayed as `其他`.

## Internal Note Payload

The admin composer sends only internal notes:

```json
{
  "messageType": "internal_note",
  "bodyText": "Task035 internal note test"
}
```

The frontend validates that `bodyText` is non-empty after trimming and limits input to 2000 characters.

## Soft Delete Behavior

The delete action is intentionally conservative:

- Only `internal_note` messages show a delete button.
- `workflow_event` and `system_event` messages do not show delete actions in the UI.
- Delete calls the backend soft-delete route and then refreshes the timeline.

If the backend rejects a delete, the panel shows the backend error message and request id when available in development mode.

## Workflow Refresh

After a case workflow action succeeds, the case detail, case list, and message timeline are refreshed. This allows backend-generated `workflow_event` messages to appear when the backend writes them.

The frontend does not fake workflow messages if the backend does not return them.

## How To Run

```bash
npm run admin:check
npm run admin:build
```

For Zeabur API manual verification:

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

## Manual Test Checklist

1. Log in as an admin user.
2. Open `/cases`.
3. Open a case detail modal.
4. Confirm the `案件時間軸 / 訊息紀錄` panel loads.
5. Toggle sort between newest-first and oldest-first.
6. Add an internal note.
7. Confirm the timeline refreshes and shows the new note.
8. Delete the internal note.
9. Confirm the timeline refreshes after deletion.
10. Run a workflow action such as submit and confirm the timeline refreshes.
11. Confirm users without `cases.update` do not see create/delete controls.

## Safety Notes

- The panel is admin-only and does not feed customer-facing inquiry UI.
- The frontend does not log note body text, tokens, passwords, full customer payloads, mobile numbers, or LINE user ids.
- The panel does not display audit logs, AI raw payloads, OCR raw output, or billing details.
- Attachment ids may be shown as indicators, but attachment upload is out of scope.

## Known Limitations

- Attachment relation is API-ready but no attachment picker/upload UI is included.
- Realtime updates are not implemented; users refresh manually or see refreshes after local actions.
- Customer-visible filtering remains a backend/customer inquiry concern for future work.
- Message delete UI is limited to internal notes.

## Next Step

The next small task can add a dispatch/appointment action panel or an attachment metadata panel, depending on which operational workflow should be surfaced first.
