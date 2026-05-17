# Task 038 - Field Service Report Panel Foundation

## Scope

Task 038 adds the first admin frontend foundation for field service reports inside the existing `/cases` case detail view.

Included:

- Field Service Report panel in case detail.
- Read/create/update service report.
- Mark service report as `completed`.
- Service parts list/add/edit/delete.
- Refresh of case detail, case list, timeline/messages, and field service data after successful operations.

Not included:

- Engineer mobile app.
- Inventory deduction.
- Quote approval.
- Billing / settlement.
- Customer signature capture.
- AI diagnosis.
- Multi-visit history.

## API Routes

Field service report:

- `GET /api/v1/admin/cases/:caseId/service-report`
- `POST /api/v1/admin/cases/:caseId/service-report`
- `PATCH /api/v1/admin/service-reports/:reportId`

Service parts:

- `GET /api/v1/admin/service-reports/:reportId/parts`
- `POST /api/v1/admin/service-reports/:reportId/parts`
- `PATCH /api/v1/admin/service-parts/:partId`
- `DELETE /api/v1/admin/service-parts/:partId`

## Permissions

- `service_reports.manage`: field service reports and service parts.
- Admin/system roles are treated as full-access by the existing frontend helper.

Backend permission checks remain the source of truth.

## Service Report Payloads

Create:

```json
{
  "diagnosisResult": "電源板異常",
  "repairAction": "更換電源板",
  "engineerNote": "現場檢測完成"
}
```

Update:

```json
{
  "diagnosisResult": "電源板異常",
  "repairAction": "更換電源板",
  "repairResult": "已更換零件並測試正常",
  "engineerNote": "現場測試正常",
  "customerNote": "客戶已知悉",
  "serviceStatus": "completed"
}
```

The frontend follows the current backend validator:

- `serviceStatus`: `in_progress`, `pending_parts`, `completed`, `cancelled`
- create fields are technically optional on the backend, but the frontend asks the user to fill at least one meaningful report field before creating.

## Complete Service Report Behavior

When `serviceStatus=completed` is submitted, the frontend asks for confirmation. The backend completes the service report and updates the case to `completed`.

The frontend does not:

- close the case automatically.
- create billing records automatically.
- create settlement records automatically.

## Service Parts

List/add/edit/delete are available after a report exists.

Create part:

```json
{
  "partName": "電源板",
  "partNo": "PWR-038",
  "quantity": 1,
  "oldSerialNo": "OLD038",
  "newSerialNo": "NEW038",
  "partStatus": "replaced"
}
```

The frontend follows the current backend validator:

- `partStatus`: `planned`, `used`, `replaced`, `returned`, `cancelled`
- `quantity` must be an integer of at least `1`.

Delete removes the service part record through the backend endpoint. It does not perform inventory deduction, stock return, or inventory mutation.

## Case Status

Create service report is shown as ready for:

- `assigned`
- `scheduled`
- `on_site`

The frontend shows a guidance message for other statuses. Backend workflow validation remains final.

## Refresh Behavior

After successful service report or service part operations, the frontend refreshes the relevant data:

- Case detail.
- Case list.
- Timeline/messages.
- Field service report.
- Service parts list.

The frontend does not create fake timeline records. It only displays messages returned by the backend.

## How To Run

```bash
npm run admin:check
npm run admin:build
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

## Manual Test Checklist

1. Login as admin.
2. Open `/cases`.
3. Open a case that has reached `assigned` or `scheduled`.
4. Verify Field Service Report panel renders.
5. Create a service report.
6. Verify case detail, case list, and timeline refresh.
7. Add a service part.
8. Edit the service part.
9. Delete the service part.
10. Update diagnosis / repair result.
11. Set service status to `completed`.
12. Confirm case status becomes `completed`.
13. Confirm no automatic case close occurs.
14. Confirm no automatic billing or settlement records are created by the frontend.

## Security Notes

- API base URL remains controlled by `VITE_API_BASE_URL`.
- No Zeabur domain is hardcoded.
- No token/password/secret/customer payload is logged.
- The panel does not display audit logs, AI raw payload, OCR raw output, or billing details.
- Inventory deduction is intentionally not implemented.

## Known Limitations

- No engineer mobile workflow.
- No customer signature capture.
- No inventory deduction or inventory availability check.
- No AI diagnosis.
- No multi-visit history.
- No automatic billing or settlement creation.

## Recommended Next Step

After field service report smoke is stable, build a Billing / Settlement panel foundation that starts from completed cases and existing service report data.
