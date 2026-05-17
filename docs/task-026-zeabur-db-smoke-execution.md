# Task 026 - Zeabur DB Smoke Execution

Date: 2026-05-16

## Overall Result

Result: PASS WITH MINOR LIMITATIONS

The Zeabur backend and PostgreSQL integration smoke test was continued against:

```text
https://onsite-service-api.zeabur.app
```

Confirmed before this continuation:

- Zeabur backend service is deployed and running.
- Zeabur PostgreSQL service is running.
- `DATABASE_URL`, `JWT_SECRET`, and `APP_BASE_URL` are configured in Zeabur.
- migrations `001` through `015` are applied.
- seed completed.
- `/healthz` passes.
- `POST /api/v1/auth/login` passes.
- `GET /api/v1/auth/me` passes.
- organization create/list/read passes.
- `audit_logs_entity_type_check` was fixed by migration `015_update_audit_log_entity_type_constraint.sql`.

This continuation verified:

- case + customer create
- workflow submit/review/accept
- dispatch same-organization validation
- dispatch cross-organization rejection
- appointment create/list
- field service report + service parts
- billing + vendor-ready settlement
- AI job organization scope
- public customer inquiry generic-failure behavior
- notification global admin guard for admin/system user

## Environment Variables Confirmed

Confirmed through Zeabur runtime behavior:

```text
DATABASE_URL=[set in Zeabur; PostgreSQL migrations and seed completed]
JWT_SECRET=[set; auth login/auth me succeeded]
APP_BASE_URL=https://onsite-service-api.zeabur.app
PORT=[injected by Zeabur; backend responds on public domain]
```

Provider env not required for this smoke:

```text
LINE_CHANNEL_SECRET=[not required for this smoke]
LINE_CHANNEL_ACCESS_TOKEN=[not required for this smoke]
OPENAI_API_KEY=[not required; PlaceholderAIProvider is active]
R2_*=[not required; attachment signed-url smoke was not part of this continuation]
```

## Migration Result

Result: PASS

Zeabur Terminal confirmed the deployed migration set contains:

```text
015_update_audit_log_entity_type_constraint.sql
```

`npm run db:migrate` reported migration `015` as already applied:

```text
Skipping already applied migration: 015_update_audit_log_entity_type_constraint.sql
Database migrations complete.
```

This is expected because migration `015` had already been applied to the Zeabur database during the audit constraint fix.

## Seed Result

Result: PASS

Seed was completed before this continuation. Auth smoke confirmed seeded admin credentials and permissions are active.

Seeded admin:

```text
email: admin@example.com
role: admin
permissions include cases/customers/workflow/dispatch/appointments/service_reports/billing/notifications/ai/line/organizations management permissions
```

## Health Check Result

Result: PASS

Command:

```bash
curl https://onsite-service-api.zeabur.app/healthz
```

Response:

```json
{
  "ok": true,
  "service": "onsite-service-api",
  "requestId": "req_eca8c74f-9ab6-4703-89a6-48766071329f"
}
```

No secrets were exposed.

## Auth Smoke Result

Result: PASS

Confirmed:

- `POST /api/v1/auth/login` returns access token.
- `GET /api/v1/auth/me` with token returns admin user and permissions.
- `GET /api/v1/auth/me` without token returns `AUTH_REQUIRED`.
- response does not include `password_hash`.

No-token result:

```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required."
  }
}
```

## Organization Smoke Result

Result: PASS

Existing test organization:

```text
organizationId: 28e187eb-c95b-4801-8a82-3e2f87a2a7f3
organizationCode: client-a-1778878944
organizationName: Client A Smoke Redeploy
status: active
```

Confirmed:

- organization create works after migration `015`.
- organization list works.
- organization detail works.
- DTO does not expose secrets.

Audit write was indirectly confirmed because organization create no longer fails on `audit_logs_entity_type_check`. Direct audit read was not available because no audit log admin route is currently registered.

Additional organization created for cross-organization dispatch validation:

```text
organizationId: d8fd4345-9eeb-4707-b8cb-6237c541e319
organizationCode: other-org-1778879208
organizationName: Other Org Smoke
status: active
```

## Case / Customer Smoke Result

Result: PASS

Created case/customer under organization:

```text
organizationId: 28e187eb-c95b-4801-8a82-3e2f87a2a7f3
caseId: 70879284-a99c-4efe-94dd-db7070629db3
caseNo: TW-20260515-033076
customerId: b36092c5-9ea5-4ce8-8ff7-5bc07ecf4e66
customerMobile: 09121778879131
```

Confirmed from admin case detail:

```text
case.organizationId: 28e187eb-c95b-4801-8a82-3e2f87a2a7f3
organizationSummary.code: client-a-1778878944
organizationSummary.name: Client A Smoke Redeploy
customerSummary.name: 王小明 Smoke 1778879131
customerSummary.mobile: 09121778879131
status after full smoke: completed
```

Case DTO does not expose raw `customer_snapshot`. Snapshot organization/customer content is therefore not directly verifiable through the admin API response; it is inferred from the implemented `CaseService` snapshot builder and should be checked with a DB-level query in a later operational audit if needed.

## Workflow Smoke Result

Result: PASS

Workflow was tested on the case:

```text
caseId: 70879284-a99c-4efe-94dd-db7070629db3
caseNo: TW-20260515-033076
```

Confirmed transition sequence:

```text
draft -> submitted -> reviewing -> accepted
```

Final admin case detail confirmed timestamps:

```text
submittedAt: 2026-05-15T21:05:32.222Z
reviewedAt: 2026-05-15T21:05:59.739Z
acceptedAt: 2026-05-15T21:05:59.906Z
lastInternalActivityAt: 2026-05-15T21:13:20.507Z
```

Direct PATCH status mutation was not repeated in this continuation. Existing code-level guard remains in `CaseService` from Task 011/012.

Audit writes were not directly queryable because no audit log admin route is registered.

## Dispatch / Appointment Smoke Result

Result: PASS

Dispatch unit fixtures were inserted manually in Zeabur Terminal because there is no dispatch unit admin API registered in the current backend.

Same-organization dispatch unit:

```text
dispatchUnitId: b825ff4f-95fa-47d1-9c60-6eedc420725a
organizationId: 28e187eb-c95b-4801-8a82-3e2f87a2a7f3
code: SMOKE-SAME-1778879254703
```

Different-organization dispatch unit:

```text
dispatchUnitId: 64a6e004-8085-4561-b525-8aeb66adc2c4
organizationId: d8fd4345-9eeb-4707-b8cb-6237c541e319
code: SMOKE-OTHER-1778879254703
```

Because the primary smoke case had already progressed beyond `accepted`, dispatch same/cross organization validation was re-tested on a fresh accepted dispatch-only case:

```text
caseId: 1e74a27a-194c-4060-bf39-dcdbe49c9ed2
caseNo: TW-20260515-180693
```

Confirmed:

- same-organization dispatch succeeded.
- created dispatch assignment:

```text
dispatchAssignmentId: 87c40003-ff43-4ad3-b16d-0c2d52740d10
dispatchUnitId: b825ff4f-95fa-47d1-9c60-6eedc420725a
dispatchStatus: pending
```

- cross-organization dispatch update was rejected:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "dispatchUnitId must belong to the same organization as the case.",
  "details": [
    {
      "field": "dispatchUnitId",
      "code": "organization_mismatch"
    }
  ]
}
```

Appointment was tested on the primary smoke case:

```text
appointmentId: 4590d6e4-e3c2-4ca5-a389-01fb1b321b06
appointmentStatus: scheduled
scheduledAt on case: 2026-05-18T02:00:00.000Z
```

Confirmed:

- `POST /api/v1/admin/cases/:caseId/appointments` succeeds.
- `GET /api/v1/admin/cases/:caseId/appointments` returns records.
- case summary fields update to appointment status/scheduled timestamp.

## Field Service Smoke Result

Result: PASS

Tested on:

```text
caseId: 70879284-a99c-4efe-94dd-db7070629db3
```

Created field service report:

```text
serviceReportId: f688f5bc-d5b8-4b06-be27-fb588aec502c
initialServiceStatus: in_progress
```

Confirmed:

- `POST /api/v1/admin/cases/:caseId/service-report` succeeds.
- `GET /api/v1/admin/cases/:caseId/service-report` succeeds.
- `PATCH /api/v1/admin/service-reports/:reportId` succeeds.
- completing report sets `serviceStatus=completed`.
- final case status is `completed`.
- final case `completedAt` is `2026-05-18T03:30:00.000Z`.

Created service part:

```text
servicePartId: efade879-05e9-4f93-bcd8-e8fe982c5c20
partName: Smoke power board
partNo: PB-SMOKE-001
oldSerialNo: OLD-SMOKE-001
newSerialNo: NEW-SMOKE-001
partStatus: replaced
```

Confirmed:

- `POST /api/v1/admin/service-reports/:reportId/parts` succeeds.
- `GET /api/v1/admin/service-reports/:reportId/parts` returns the part.

## Billing / Settlement Smoke Result

Result: PASS

Created billing record:

```text
billingId: 0084d6ac-b5d1-459e-a39c-ae14a9496259
caseId: 70879284-a99c-4efe-94dd-db7070629db3
initialBillingStatus: draft
updatedBillingStatus: pending_review
totalAmount: 2800
customerChargeAmount: 2800
```

Confirmed:

- completed case can create billing.
- `GET /api/v1/admin/cases/:caseId/billing` succeeds.
- `PATCH /api/v1/admin/billing/:billingId` succeeds.

Created settlement:

```text
settlementId: 1c736bb5-aeaa-4bd5-8e48-5becaed36dc1
settlementTargetType: vendor
settlementRuleCode: VENDOR-SMOKE
settlementPolicyVersion: 2026-smoke-v1
settlementMetadata.smoke: true
initialSettlementStatus: submitted
updatedSettlementStatus: completed
```

Confirmed:

- vendor-ready target type is accepted.
- settlement rule code/policy version/metadata can be saved.
- settlement can be listed and updated.

## AI Job Smoke Result

Result: PASS

Created AI summary job:

```text
aiJobId: 0a7692f8-60fd-4b6b-998a-5538c657aba7
jobType: case_summary
provider: placeholder
status: completed
organizationId: 28e187eb-c95b-4801-8a82-3e2f87a2a7f3
caseId: 70879284-a99c-4efe-94dd-db7070629db3
customerId: b36092c5-9ea5-4ce8-8ff7-5bc07ecf4e66
lineChannelId: null
```

Confirmed:

- `POST /api/v1/admin/cases/:caseId/ai/summary` creates an AI job.
- `GET /api/v1/admin/ai-jobs` lists the job.
- `GET /api/v1/admin/ai-jobs/:jobId` shows organization/case/customer scope.
- AI response is stored in `responsePayload`.
- AI did not directly change workflow, accept/reject, assign, settle, or overwrite formal fields.

## Customer Inquiry Smoke Result

Result: PASS

Correct inquiry:

```bash
POST /api/v1/public/case-inquiry
```

Body:

```json
{
  "caseNo": "TW-20260515-033076",
  "mobile": "09121778879131"
}
```

Response behavior:

```json
{
  "verified": true,
  "case": {
    "caseNo": "TW-20260515-033076",
    "status": "completed",
    "customerVisibleStatus": "服務已完成",
    "brand": "Test Brand",
    "productType": "TV",
    "modelNo": "MODEL-001",
    "preferredVisitTime": null,
    "latestCustomerVisibleMessage": null,
    "customerVisibleAttachments": []
  }
}
```

Wrong mobile inquiry:

```json
{
  "verified": false,
  "message": "Unable to verify the case with the provided information."
}
```

Confirmed:

- correct `caseNo + mobile` can query.
- wrong mobile returns generic failure with HTTP 200 and does not reveal whether the case exists.
- customer-visible response does not expose internal notes, audit logs, billing records, AI raw payloads, OCR raw payloads, permissions, dispatch rules, or engineer notes.

## Notification Guard Smoke Result

Result: PASS FOR ADMIN / PARTIAL FOR NON-ADMIN

Admin/system user access:

```text
GET /api/v1/admin/notification-preferences -> 200
GET /api/v1/admin/notification-templates   -> 200
GET /api/v1/admin/notification-logs        -> 200
```

All returned empty lists, which is valid for the current foundation.

General organization user rejection was not tested because there is no user admin API fixture available in the current backend to create a non-admin organization-scoped user through HTTP. Code-level guard is expected through the Task 024C super-admin/system-only notification restriction, but this should be covered by a future DB fixture or automated integration test.

## Smoke Tests Performed

Commands/endpoints exercised:

```text
GET  /healthz
POST /api/v1/auth/login
GET  /api/v1/auth/me
GET  /api/v1/auth/me without token
POST /api/v1/admin/cases
POST /api/v1/admin/cases/:caseId/submit
POST /api/v1/admin/cases/:caseId/review
POST /api/v1/admin/cases/:caseId/accept
POST /api/v1/admin/cases/:caseId/dispatch
PATCH /api/v1/admin/cases/:caseId/dispatch
POST /api/v1/admin/cases/:caseId/appointments
GET  /api/v1/admin/cases/:caseId/appointments
POST /api/v1/admin/cases/:caseId/service-report
GET  /api/v1/admin/cases/:caseId/service-report
PATCH /api/v1/admin/service-reports/:reportId
POST /api/v1/admin/service-reports/:reportId/parts
GET  /api/v1/admin/service-reports/:reportId/parts
POST /api/v1/admin/cases/:caseId/billing
GET  /api/v1/admin/cases/:caseId/billing
PATCH /api/v1/admin/billing/:billingId
POST /api/v1/admin/billing/:billingId/settlements
GET  /api/v1/admin/billing/:billingId/settlements
PATCH /api/v1/admin/settlements/:settlementId
POST /api/v1/admin/cases/:caseId/ai/summary
GET  /api/v1/admin/ai-jobs
GET  /api/v1/admin/ai-jobs/:jobId
POST /api/v1/public/case-inquiry
GET  /api/v1/admin/notification-preferences
GET  /api/v1/admin/notification-templates
GET  /api/v1/admin/notification-logs
```

Manual Zeabur Terminal fixture:

```text
Inserted two dispatch_units for same-organization and cross-organization dispatch validation.
```

## Pass / Fail Summary

Passed:

- Zeabur health check
- auth login/auth me
- organization create/list/read
- case/customer create
- workflow submit/review/accept
- appointment create/list
- field service report create/read/update/complete
- service part create/list
- billing create/read/update
- settlement create/list/update
- AI summary job create/list/read
- public customer inquiry success and generic failure
- notification admin/system access
- same-organization dispatch on clean accepted case
- cross-organization dispatch rejection on clean accepted case

Partial / not directly verified:

- audit log rows were not directly queried because no audit log admin route is currently registered.
- raw `cases.customer_snapshot` was not directly queried because the API intentionally exposes only DTO summaries.
- non-admin notification guard was not HTTP-tested because no non-admin user fixture/API is currently available.
- attachment/R2/OCR signed-url smoke was not part of this continuation.
- LINE webhook smoke was not part of this continuation.

Failed:

- No blocking application failure remains from this continuation.

Expected validation failure:

- Cross-organization dispatch returned `VALIDATION_ERROR`, which is the expected security behavior.

## Created Test IDs

Primary smoke case:

```text
organizationId: 28e187eb-c95b-4801-8a82-3e2f87a2a7f3
customerId: b36092c5-9ea5-4ce8-8ff7-5bc07ecf4e66
caseId: 70879284-a99c-4efe-94dd-db7070629db3
caseNo: TW-20260515-033076
appointmentId: 4590d6e4-e3c2-4ca5-a389-01fb1b321b06
serviceReportId: f688f5bc-d5b8-4b06-be27-fb588aec502c
servicePartId: efade879-05e9-4f93-bcd8-e8fe982c5c20
billingId: 0084d6ac-b5d1-459e-a39c-ae14a9496259
settlementId: 1c736bb5-aeaa-4bd5-8e48-5becaed36dc1
aiJobId: 0a7692f8-60fd-4b6b-998a-5538c657aba7
```

Dispatch validation case:

```text
caseId: 1e74a27a-194c-4060-bf39-dcdbe49c9ed2
caseNo: TW-20260515-180693
dispatchAssignmentId: 87c40003-ff43-4ad3-b16d-0c2d52740d10
```

Dispatch unit fixtures:

```text
sameOrgDispatchUnitId: b825ff4f-95fa-47d1-9c60-6eedc420725a
otherOrgDispatchUnitId: 64a6e004-8085-4561-b525-8aeb66adc2c4
otherOrganizationId: d8fd4345-9eeb-4707-b8cb-6237c541e319
```

## Failed Checks

None blocking.

Non-blocking gaps:

1. Audit rows were not directly verifiable via API.
2. Customer snapshot was not directly verifiable via API DTO.
3. General organization user notification rejection was not tested via HTTP.
4. R2/attachment signed URL and LINE webhook were not included in this continuation.

## Blocking Issues

None.

## Minimal Patch Suggestions

No immediate schema or code patch is required from this smoke continuation.

Suggested follow-up test hardening:

1. Add a read-only audit log admin route or DB-level smoke script for audit verification.
2. Add an integration-test fixture for non-admin organization-scoped users to verify notification global guard and organization access boundaries.
3. Add a safe debug-only or DB-level operational check for `customer_snapshot` during smoke tests, without exposing it in customer-visible DTOs.
4. Add a dedicated attachment/R2 smoke once R2 credentials are configured.
5. Add a dedicated LINE webhook signature smoke once a test `line_channel` secret is available.

## Recommendation

Continue with the next backend hardening or feature task. The Zeabur PostgreSQL integration is operational for core admin/auth/organization/case/workflow/dispatch/appointment/field-service/billing/AI/inquiry foundations.

Recommended next step:

```text
Proceed to the next planned task, or create an integration test harness for the smoke paths above before adding more provider integrations.
```
