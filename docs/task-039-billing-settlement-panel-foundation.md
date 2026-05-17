# Task 039 - Billing / Settlement Panel Foundation

## Scope

Task 039 adds the first admin frontend foundation for billing and settlement operations inside the existing `/cases` case detail view.

Included:

- Billing / Settlement panel in case detail.
- Read/create/update billing record.
- List/create/update settlement records.
- Refresh case detail, case list, timeline/messages, billing, and settlement data after successful operations.

Not included:

- Payment gateway.
- ERP integration.
- Accounting export.
- Invoice issuance.
- Inventory costing.
- AI billing analysis.
- Tax rules.
- Automatic settlement.
- Vendor-specific settlement rule engine.
- Automatic case close.

## API Routes

Billing:

- `GET /api/v1/admin/cases/:caseId/billing`
- `POST /api/v1/admin/cases/:caseId/billing`
- `PATCH /api/v1/admin/billing/:billingId`

Settlement:

- `GET /api/v1/admin/billing/:billingId/settlements`
- `POST /api/v1/admin/billing/:billingId/settlements`
- `PATCH /api/v1/admin/settlements/:settlementId`

## Permissions

- `billing.manage`: billing and settlement operations.
- Admin/system roles are treated as full-access by the existing frontend helper.

Backend permission checks remain the source of truth.

## Billing Payloads

Create:

```json
{
  "fieldServiceReportId": "SERVICE_REPORT_UUID optional",
  "laborAmount": 800,
  "partsAmount": 1200,
  "transportAmount": 300,
  "additionalAmount": 0,
  "customerChargeAmount": 2300,
  "manufacturerClaimAmount": 0,
  "warrantyAmount": 0,
  "billingStatus": "draft",
  "billingNote": "現場完修收費"
}
```

Update:

```json
{
  "laborAmount": 900,
  "partsAmount": 1200,
  "transportAmount": 300,
  "additionalAmount": 0,
  "customerChargeAmount": 2400,
  "manufacturerClaimAmount": 0,
  "warrantyAmount": 0,
  "billingStatus": "pending_review",
  "billingNote": "補登工資"
}
```

The frontend follows the current backend validator:

- `billingStatus`: `draft`, `pending_review`, `approved`, `submitted`, `settled`, `cancelled`
- amount fields must be numbers greater than or equal to `0`

The backend calculates `totalAmount` from labor, parts, transport, and additional amounts. The frontend does not send `totalAmount`.

## Billing Status And Case Status

Billing creation is shown as ready for:

- `completed`
- `closed`

The backend remains the final workflow validator. Billing creation does not close the case.

## Settlement Behavior

Settlement target type options in this frontend foundation:

- `engineer`
- `manufacturer`
- `internal`

The backend already supports additional future target types such as vendor, distributor, partner, and subcontractor, but this page does not expose vendor-specific rule behavior yet.

Settlement status options:

- `pending`
- `submitted`
- `completed`
- `rejected`

Create settlement:

```json
{
  "settlementTargetType": "engineer",
  "settlementTargetId": "ENGINEER_USER_UUID optional",
  "settlementAmount": 900,
  "settlementStatus": "submitted",
  "settlementNote": "工程師服務費"
}
```

Update settlement:

```json
{
  "settlementStatus": "completed",
  "settlementNote": "已完成結算"
}
```

Completing or rejecting a settlement asks for confirmation. The UI does not execute payment, accounting entries, ERP sync, or invoice generation.

## Refresh Behavior

After successful billing or settlement operations, the frontend refreshes:

- Case detail.
- Case list.
- Timeline/messages.
- Billing record.
- Settlement list.

The frontend does not create fake timeline records. It only displays timeline messages returned by the backend.

## Vendor-Specific Settlement Rules Future Note

This foundation intentionally keeps vendor-specific logic out of the page. Future work may introduce vendor/brand contracts, settlement rule templates, rule versions, settlement runs, settlement exceptions, and AI-assisted rule drafts.

Formal amounts should be calculated by deterministic rules or backend validation, not directly decided by AI.

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
3. Open a completed case.
4. Verify Billing / Settlement panel renders.
5. Create billing record.
6. Verify case detail, case list, and timeline refresh.
7. Update billing amounts or status.
8. Create settlement.
9. Update settlement status to `completed`.
10. Update another settlement status to `rejected`, if needed.
11. Confirm the case is not automatically closed.
12. Confirm no payment, ERP sync, invoice, inventory costing, or AI billing behavior occurs.

## Security Notes

- API base URL remains controlled by `VITE_API_BASE_URL`.
- No Zeabur domain is hardcoded.
- No token/password/secret/customer payload is logged.
- The panel does not display audit logs, AI raw payload, or OCR raw output.
- The panel does not implement payment, ERP, invoice, tax, or vendor-specific settlement rules.

## Known Limitations

- No payment gateway.
- No ERP/accounting export.
- No invoice issuance.
- No inventory costing from service parts.
- No AI billing analysis.
- No tax rules.
- No automatic settlement.
- No vendor-specific rule engine.
- No automatic case close.

## Recommended Next Step

After billing and settlement smoke is stable, add the close workflow UI for completed cases with approved/settled billing and no open pending/submitted settlements.
