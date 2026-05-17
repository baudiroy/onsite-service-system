# Task 036 - Case Attachments Panel Foundation

## Scope

Task 036 adds the first admin-only case attachments panel to the existing `/cases` detail view.

This task does not implement a real OCR provider, AI analysis, engineer mobile UI, customer-facing attachment UI, R2 bucket management UI, batch upload, or a complex file previewer.

## API Routes

- `POST /api/v1/admin/cases/:caseId/attachments/upload-url`
- `POST /api/v1/admin/cases/:caseId/attachments/complete`
- `GET /api/v1/admin/cases/:caseId/attachments`
- `POST /api/v1/admin/attachments/:attachmentId/download-url`
- `POST /api/v1/admin/attachments/:attachmentId/ocr`
- `DELETE /api/v1/admin/attachments/:attachmentId`

## Permissions

- `attachments.read` can view attachments and generate download URLs.
- `attachments.create` can create upload URLs and complete upload metadata.
- `attachments.delete` can soft-delete attachment metadata.
- OCR is shown only when the user can read attachments and update cases. The current backend route also requires `ai.manage`, so the UI is conservative and requires `ai.manage` for non-admin users.
- Admin/system users are treated as fully authorized by the existing frontend permission helper.

The backend remains the final permission boundary.

## Attachment Type Labels

- `fault_photo` -> 故障照片
- `serial_photo` -> 序號照片
- `invoice_photo` -> 發票照片
- `product_photo` -> 產品照片
- `issue_photo` -> 問題照片
- `completion_photo` -> 完修照片
- `signature` -> 簽名
- `other` -> 其他

Future labels are reserved for:

- `faulty_part_photo`
- `new_part_photo`
- `old_serial_photo`
- `new_serial_photo`

## Upload Flow

The panel uses the direct-upload foundation:

1. User selects a file and attachment type.
2. Frontend calls `createAttachmentUploadUrl(caseId, metadata)`.
3. Backend creates attachment metadata and returns a short-lived signed PUT URL.
4. Frontend uploads the file directly to the signed URL.
5. Frontend calls `completeAttachmentUpload(caseId, metadata)`.
6. Frontend refreshes the attachment list.

The frontend does not display or log signed URLs. The file size soft limit is currently 10 MB. Checksums are not calculated in Task 036; the backend validator allows `checksumSha256` to be omitted.

If R2 environment variables, storage configuration, or CORS prevent browser PUT upload, the UI shows an upload/storage error and does not fake success.

## Download URL Behavior

The download action calls:

```json
{
  "ttlSeconds": 300
}
```

The returned signed URL is opened in a new browser context through an anchor. It is not displayed in the UI and is not logged.

## OCR Placeholder Behavior

OCR action is shown only for:

- `serial_photo`
- `invoice_photo`

The action calls the backend OCR route with an optional note. OCR output is not shown in this panel, and OCR results do not directly overwrite case fields.

The current backend route is backed by the AI/OCR orchestration foundation and may return a placeholder AI job result.

## Delete Metadata Behavior

Delete action calls the soft-delete route and then refreshes attachments.

The UI wording uses `刪除附件紀錄` because Task 014 soft-deletes PostgreSQL metadata and does not guarantee permanent object purge from R2.

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
4. Confirm the `案件附件` panel loads.
5. Confirm empty state or existing attachment rows render.
6. Select a small file and attachment type.
7. Generate upload URL and upload directly to storage.
8. Complete upload metadata and confirm the list refreshes.
9. Generate a download URL and confirm the signed URL is not shown or logged.
10. Trigger OCR for `serial_photo` or `invoice_photo` if permissions and backend config allow it.
11. Soft-delete attachment metadata and confirm the list refreshes.
12. Re-check users, organizations, dispatch units, case foundation, workflow actions, and timeline/messages.

## Safety Notes

- The frontend does not log token, password, signed URL, file content, full customer payload, mobile number, or LINE user id.
- The panel does not render audit logs, AI raw payloads, OCR raw output, or billing details.
- Signed URLs are short-lived operational values, not persistent application state.
- Binary files are not stored in PostgreSQL.

## Known Limitations

- No thumbnail or previewer is included.
- No batch upload is included.
- No checksum calculation is included.
- Browser direct PUT depends on storage CORS and signed URL compatibility.
- OCR provider remains foundation/placeholder.
- Attachment visibility and customer-facing attachment filtering are future scope.

## Next Step

The next small frontend task can add a dispatch/appointment panel in case detail, or an attachment preview/metadata refinement task if storage behavior needs more operator feedback.
