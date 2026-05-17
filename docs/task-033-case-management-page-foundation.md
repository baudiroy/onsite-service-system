# Task 033 Case Management Page Foundation

## Scope

This task promotes `/cases` from a placeholder to the first foundation version of the Case Management page in the React/Vite admin frontend.

It covers case list, filtering, create, detail, and safe-field update only. It does not implement workflow transition actions, dispatch scheduling, attachment upload, OCR, AI summary generation, service reports, billing, or settlement UI.

## API Routes

Cases:

- `GET /api/v1/admin/cases`
- `POST /api/v1/admin/cases`
- `GET /api/v1/admin/cases/:caseId`
- `PATCH /api/v1/admin/cases/:caseId`

Customers:

- `GET /api/v1/admin/customers`
- `POST /api/v1/admin/customers`
- `GET /api/v1/admin/customers/:customerId`

Organizations:

- `GET /api/v1/admin/organizations`

## Permission Rules

- `cases.read` is required to view the page, list cases, and read details.
- `cases.create` is required to show and submit the create form.
- `cases.update` is required to show and submit the edit form.
- Admin/system users are treated as fully privileged by the existing auth helper foundation.

## Organization Scope

- The create form requires `organizationId`.
- The page uses the Organization Admin API for the organization picker when available.
- If organization loading fails, the create form and filter fall back to manual `organizationId` input.
- Case list can send `organizationId` because the backend list validator supports it.
- Backend organization scope remains the source of truth for regular-user data isolation.
- Customer mobile matching for create-case is organization-scoped on the backend.

## Create Case Shape

The first UI version supports creating a case using customer data:

```json
{
  "organizationId": "ORG_UUID",
  "customer": {
    "customerName": "Task033 Test Customer",
    "mobile": "0912333033",
    "tel": "",
    "city": "Taipei",
    "address": "Test address",
    "source": "admin"
  },
  "case": {
    "source": "admin",
    "brand": "Task033 Brand",
    "caseType": "repair",
    "productType": "TV",
    "modelNo": "T033",
    "problemDescription": "Task033 test case from admin frontend",
    "priority": "normal",
    "warrantyStatus": "unknown",
    "serviceRegion": "north"
  }
}
```

The API client also supports the existing-customer shape for later customer picker work.

## Update Allowed Fields

The frontend only sends:

- `priority`
- `warrantyStatus`
- `brand`
- `caseType`
- `productType`
- `modelNo`
- `serialNo`
- `invoiceDate`
- `problemDescription`
- `preferredVisitTime`
- `serviceRegion`

It does not send `status`. Status changes must go through workflow transition endpoints in a future task.

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
- Confirm case list loads.
- Filter by case number, status, priority, case type, source, and created date range.
- Confirm organization picker loads or manual organization fallback is shown.
- Create a test case.
- Open case detail.
- Edit allowed fields.
- Confirm there is no direct status edit control.
- Re-check `/users`, `/organizations`, `/dispatch-units`, `/dashboard`, login, and logout.

## Safety Notes

- The page does not render audit logs, internal notes, AI raw payloads, OCR raw payloads, or billing details.
- The page does not log passwords, tokens, secrets, full customer payloads, or LINE user IDs.
- API base URL still comes from `VITE_API_BASE_URL`; no Zeabur domain is hardcoded.
- Secret-like response fields are ignored by API client sanitizers.

## Known Limitations

- No workflow transition action buttons yet.
- No dispatch or appointment operations.
- No attachment upload, OCR, or AI summary actions.
- No service report, billing, or settlement display.
- No full customer picker UI yet; create form uses customer data directly.

## Suggested Next Step

The next frontend task can add workflow transition actions for cases, or keep the foundation path and add a read-only case timeline/messages panel first.
