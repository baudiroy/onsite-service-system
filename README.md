# Codex-Ready Docs Package

This repository contains the documentation, database migrations, and Phase 1 Node.js backend foundation for the onsite service system.

## Future AI Platform / Product Design Principles

This project should evolve into an AI-assisted onsite service platform, not only a case, dispatch, completion, and settlement backend.

The guiding principle is:

```text
讓每一個參與到府服務流程的人，
都在最麻煩、最容易出錯、最焦慮的時刻，
被系統剛好幫上忙。
```

AI should be used to make the workflow more accurate, smoother, and more considerate. It should reduce customer-service follow-up burden, help dispatch assistants plan safely, help engineers type less and miss fewer fields, help supervisors see risk earlier, help finance handle vendor and brand-specific settlement rules, and help customers feel clearly informed.

Cost-control principles remain important:

- Do not start with expensive architecture by default.
- Keep the main workflow, data correctness, and permission safety first.
- Start AI as button-triggered assistance, not field-by-field real-time AI calls.
- Record AI input, output, human correction, and final results before model training.
- Keep large files out of PostgreSQL; store photos, signatures, PDFs, and attachments in object storage or dedicated file storage.
- Move from manual workflow to AI suggestion, then semi-automation, then low-risk automation only when evidence supports it.

See [docs/future_ai_platform_design.md](docs/future_ai_platform_design.md) for the full roadmap notes covering:

- AI-assisted field service completion normalization.
- AI feedback learning.
- Dispatch learning and future automatic dispatch.
- Alternate dispatch workflow.
- Vendor / brand-specific settlement rule flexibility.
- Large file storage principles.
- AI implementation guardrails.

## Backend Skeleton

Task 007 adds a minimal Express backend skeleton. Later tasks add reusable foundation, auth/RBAC, migrations, and the first cases domain endpoints.

### Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set at least:

```text
DATABASE_URL=postgres://postgres:postgres@localhost:5432/onsite_service
JWT_SECRET=replace-with-a-long-random-secret
```

### Run

```bash
npm run dev
```

or:

```bash
npm start
```

### Verify

```bash
curl http://localhost:3000/healthz
```

Expected response shape:

```json
{
  "ok": true,
  "service": "onsite-service-api",
  "timestamp": "2026-05-14T08:00:00.000Z",
  "requestId": "req_..."
}
```

### Scripts

```text
npm run dev    Start the server for local development.
npm start      Start the server.
npm run check  Syntax-check all JavaScript files under src/.
npm run db:migrate
               Run pending PostgreSQL migrations.
npm run db:seed
               Seed minimal admin role, permissions, and admin user.
```

## Auth And RBAC Foundation

Task 010 adds the first backend auth/RBAC implementation:

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- JWT access token issuing and verification.
- Password hash verification with bcrypt.
- RBAC permission loading from database roles and permissions.
- Failed login audit events.

It does not implement LINE, AI, R2, frontend, or full user management APIs.

### Seed Admin

Make sure migrations have run first:

```bash
npm run db:migrate
npm run db:seed
```

Default seed values come from `.env`:

```text
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=ChangeMe123!
SEED_ADMIN_DISPLAY_NAME=System Admin
```

The seed is idempotent. It creates or updates the seed admin user, creates the `admin` role, creates baseline permissions, and grants those permissions to the admin role without creating duplicate active grants.

### Login

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ChangeMe123!"}'
```

Copy the returned `accessToken`, then test the current user endpoint:

```bash
curl -s http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Calling `/api/v1/auth/me` without a token should return:

```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required.",
    "details": [],
    "requestId": "req_..."
  }
}
```

### Permission Checks

`requireAuth` verifies the JWT and loads `req.user`.

`requirePermission("permission.key")` checks `req.user.permissions`, which are loaded from active roles and active permissions in PostgreSQL. Revoked roles, revoked permissions, disabled roles, disabled permissions, and deleted records are ignored.

## Admin Cases API Foundation

Task 011 adds the first cases domain foundation. It only implements admin create/list/read/update endpoints. It does not implement submit, review, accept, reject, cancel, dispatch preview, LINE webhook, AI provider, attachment upload, customer inquiry, or full workflow transitions.

### Routes

```text
POST  /api/v1/admin/cases
GET   /api/v1/admin/cases
GET   /api/v1/admin/cases/:caseId
PATCH /api/v1/admin/cases/:caseId
```

All routes require a Bearer token:

```text
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Permissions:

```text
POST  /api/v1/admin/cases          cases.create
GET   /api/v1/admin/cases          cases.read
GET   /api/v1/admin/cases/:caseId  cases.read
PATCH /api/v1/admin/cases/:caseId  cases.update
```

### Create Case

Create now accepts a nested `customer` object and `case` object. See the Customers API And Case Linking section for the preferred Task 013 request shapes.

```json
{
  "customer": {
    "customerId": "CUSTOMER_UUID"
  },
  "case": {
    "source": "admin",
    "brand": "Brand",
    "caseType": "repair",
    "productType": "TV",
    "modelNo": "ABC-123",
    "problemDescription": "Cannot power on",
    "priority": "normal",
    "warrantyStatus": "unknown"
  }
}
```

The endpoint creates a `draft` case only. Workflow transition endpoints will be added later.

### List Cases

```bash
curl -s "http://localhost:3000/api/v1/admin/cases?status=draft&limit=20&offset=0&sort=createdAtDesc" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Supported filters:

```text
status
priority
caseType
source
customerId
caseNo
createdFrom
createdTo
limit
offset
sort
```

### Read Case

```bash
curl -s http://localhost:3000/api/v1/admin/cases/CASE_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Case

Allowed update fields:

```text
priority
warrantyStatus
brand
caseType
productType
modelNo
serialNo
invoiceDate
problemDescription
preferredVisitTime
serviceRegion
```

Example:

```bash
curl -s -X PATCH http://localhost:3000/api/v1/admin/cases/CASE_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "priority": "high",
    "warrantyStatus": "pending_review",
    "problemDescription": "Updated problem description"
  }'
```

Direct `status` changes and workflow fields are intentionally rejected by validation.

## Customers API And Case Linking

Task 013 adds Phase 1 admin customers APIs and improves admin case creation so a case can link to an existing customer or create/find a customer from submitted customer data.

### Customer Routes

```text
POST  /api/v1/admin/customers                    customers.create
GET   /api/v1/admin/customers                    customers.read
GET   /api/v1/admin/customers/:customerId        customers.read
PATCH /api/v1/admin/customers/:customerId        customers.update
GET   /api/v1/admin/customers/:customerId/cases  customers.read + cases.read
```

`CustomerDTO` returns admin-readable `mobile` and `tel`, but does not return raw `lineUserId`; it returns only `lineUserIdMasked`.

### Create Customer

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/customers \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "王小明",
    "mobile": "0912345678",
    "tel": "02-12345678",
    "lineUserId": "Uxxxxxxxxxxxxxxxx",
    "city": "Taipei",
    "address": "台北市...",
    "source": "admin"
  }'
```

### List Customers

```bash
curl -s "http://localhost:3000/api/v1/admin/customers?q=王小明&limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Supported filters:

```text
q
mobile
lineUserId
city
source
limit
offset
sort
```

### Update Customer

```bash
curl -s -X PATCH http://localhost:3000/api/v1/admin/customers/CUSTOMER_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tel": "02-87654321",
    "address": "台北市新地址..."
  }'
```

Customer updates write audit logs but do not rewrite old `cases.customer_snapshot` values.

### Customer Cases

```bash
curl -s "http://localhost:3000/api/v1/admin/customers/CUSTOMER_UUID/cases?limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Admin Create Case With Existing Customer

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "customerId": "CUSTOMER_UUID"
    },
    "case": {
      "source": "admin",
      "brand": "Brand",
      "caseType": "repair",
      "productType": "TV",
      "modelNo": "ABC-123",
      "problemDescription": "Cannot power on",
      "priority": "normal",
      "warrantyStatus": "unknown"
    }
  }'
```

### Admin Create Case With Customer Data

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "customerName": "王小明",
      "mobile": "0912345678",
      "tel": "02-12345678",
      "city": "Taipei",
      "address": "台北市..."
    },
    "case": {
      "source": "admin",
      "brand": "Brand",
      "caseType": "repair",
      "productType": "TV",
      "modelNo": "ABC-123",
      "problemDescription": "Cannot power on",
      "preferredVisitTime": "2026-05-16T06:00:00.000Z",
      "priority": "normal",
      "warrantyStatus": "unknown",
      "serviceRegion": "north"
    }
  }'
```

Customer linking behavior for admin case creation:

```text
1. If customer.customerId exists, use that customer.
2. If no customerId, find an existing customer by exact mobile match.
3. If mobile match exists, use that customer without overwriting customer data.
4. If no mobile match exists, create a new customer.
5. Always write cases.customer_snapshot from the customer row used at case creation time.
```

Case audit metadata records whether the case used `existing_customer_id`, `existing_mobile`, or `new_customer`. New customer creation also writes a `customer.created` audit event.

## Case Workflow Transition APIs

Task 012 adds Phase 1 workflow transition endpoints for admin users. These endpoints are the only supported way to change `cases.status`; `PATCH /api/v1/admin/cases/:caseId` still rejects direct status updates.

### Routes

```text
POST /api/v1/admin/cases/:caseId/submit   cases.update
POST /api/v1/admin/cases/:caseId/review   cases.review
POST /api/v1/admin/cases/:caseId/accept   cases.accept
POST /api/v1/admin/cases/:caseId/reject   cases.reject
POST /api/v1/admin/cases/:caseId/cancel   cases.cancel
POST /api/v1/admin/cases/:caseId/close    cases.close
```

Implemented Phase 1 transitions:

```text
draft            -> submitted
pending_customer -> submitted
submitted        -> reviewing
reviewing        -> accepted
reviewing        -> rejected
submitted        -> cancelled
reviewing        -> cancelled
completed        -> closed
```

Not implemented in Task 012/027C:

```text
accepted -> dispatch_pending
assigned / scheduled / on_site / completed transitions
dispatch-preview
dispatch-unit update
```

### Submit

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases/CASE_UUID/submit \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note":"資料確認完成"}'
```

Submit validates the required Phase 1 intake fields before moving to `submitted`. Serial number and invoice date can still be handled later through OCR or manual review policy.

### Review

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases/CASE_UUID/review \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note":"開始審核"}'
```

### Accept

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases/CASE_UUID/accept \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note":"符合受理條件"}'
```

### Reject

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases/CASE_UUID/reject \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"非服務範圍","note":"建議轉客服說明"}'
```

### Cancel

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases/CASE_UUID/cancel \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"客戶取消","note":"客戶表示暫不維修"}'
```

Each transition updates the matching timestamp (`submitted_at`, `reviewed_at`, `accepted_at`, `rejected_at`, or `cancelled_at`) and `last_internal_activity_at`, then writes a `case.status_changed` audit event with minimal before/after status data plus transition/note/reason metadata. Reject/cancel reasons can move to `case_messages` later when MessageService is implemented.

### Close

Task 027C adds an explicit case close workflow. `PATCH /api/v1/admin/cases/:caseId` still cannot directly change `status`; close must use the command endpoint and requires the dedicated `cases.close` permission.

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases/CASE_UUID/close \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note":"服務與帳務已確認，正式結案"}'
```

Close rules:

```text
case.status must be completed
cases.completed_at must exist
if a billing record exists, billing_status must be approved or settled
if settlement records exist, none may remain pending or submitted
AI users cannot close cases
closed cases cannot be closed again
```

Close updates:

```text
cases.status = closed
cases.closed_at = now()
cases.last_internal_activity_at = now()
```

Audit/timeline behavior:

```text
audit action: case.closed
audit entity_type: case
timeline message: 案件已結案
```

The customer inquiry status mapping already returns `closed / 案件已結案` for closed cases.

## Dispatch And Appointment Foundation

Task 017 adds the first dispatch and appointment foundation. It does not implement engineer mobile app, route optimization, map providers, realtime GPS, notifications, AI dispatch engine, billing, or field service reports.

### Dispatch Routes

```text
POST  /api/v1/admin/cases/:caseId/dispatch  dispatch.manage
PATCH /api/v1/admin/cases/:caseId/dispatch  dispatch.manage
```

### Dispatch Unit Admin Routes

Task 027B adds the first dispatch unit master data admin API. It does not implement route optimization, map/GPS logic, engineer mobile workflows, AI dispatch engine, or frontend management screens.

Routes:

```text
GET    /api/v1/admin/dispatch-units                  dispatch_units.manage
POST   /api/v1/admin/dispatch-units                  dispatch_units.manage
GET    /api/v1/admin/dispatch-units/:dispatchUnitId  dispatch_units.manage
PATCH  /api/v1/admin/dispatch-units/:dispatchUnitId  dispatch_units.manage
DELETE /api/v1/admin/dispatch-units/:dispatchUnitId  dispatch_units.manage
```

`DELETE` disables a dispatch unit by setting its status to `disabled`; it does not hard-delete the record.

Dispatch unit API fields:

```text
id
organizationId
name
code
serviceRegion
status: active | disabled
city
productTypes
priority
routingRules
createdAt
updatedAt
```

The database stores status as `enabled boolean`; the API maps `enabled=true` to `active` and `enabled=false` to `disabled`.

Organization scope:

- `POST` requires `organizationId`.
- Production must not create organization-less dispatch units.
- `PATCH` does not allow changing `organizationId`.
- admin/system users can manage dispatch units across organizations.
- regular users can only manage dispatch units in organizations allowed by `user_organizations`.
- legacy/dev dispatch units with `organization_id IS NULL` are only readable/manageable by admin/system users through this service.

List filters:

```text
organizationId
q
status
serviceRegion
limit
offset
sort=createdAtDesc|createdAtAsc|nameAsc
```

Create dispatch unit:

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/dispatch-units \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "ORGANIZATION_UUID",
    "name": "北區派工單位",
    "code": "NORTH-TV",
    "serviceRegion": "north",
    "status": "active",
    "city": "Taipei",
    "productTypes": ["TV"],
    "priority": 100,
    "routingRules": {
      "default": true
    }
  }'
```

List dispatch units:

```bash
curl -s 'http://localhost:3000/api/v1/admin/dispatch-units?organizationId=ORGANIZATION_UUID&status=active' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Read dispatch unit:

```bash
curl -s http://localhost:3000/api/v1/admin/dispatch-units/DISPATCH_UNIT_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Update dispatch unit:

```bash
curl -s -X PATCH http://localhost:3000/api/v1/admin/dispatch-units/DISPATCH_UNIT_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "北區派工單位 A",
    "serviceRegion": "north",
    "status": "active"
  }'
```

Disable dispatch unit:

```bash
curl -s -X DELETE http://localhost:3000/api/v1/admin/dispatch-units/DISPATCH_UNIT_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Audit events:

```text
dispatch_unit.created
dispatch_unit.updated
dispatch_unit.disabled
```

Dispatch assignment safety remains unchanged: `DispatchService` still rejects a dispatch unit whose `organization_id` does not match the case `organization_id`.

### Appointment Routes

```text
POST  /api/v1/admin/cases/:caseId/appointments     appointments.manage
GET   /api/v1/admin/cases/:caseId/appointments     appointments.manage
PATCH /api/v1/admin/appointments/:appointmentId    appointments.manage
```

### Dispatch Flow

```text
accepted case
-> create dispatch assignment
-> case summary moves to dispatch_pending or assigned
-> workflow_event timeline message is created
-> audit is written
```

Create dispatch assignment:

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases/CASE_UUID/dispatch \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dispatchUnitId": "DISPATCH_UNIT_UUID",
    "assignedEngineerId": "ENGINEER_USER_UUID",
    "assignmentNote": "北區維修單位處理"
  }'
```

Update or reassign engineer:

```bash
curl -s -X PATCH http://localhost:3000/api/v1/admin/cases/CASE_UUID/dispatch \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignedEngineerId": "ENGINEER_USER_UUID",
    "assignmentNote": "改派工程師"
  }'
```

Dispatch status values:

```text
pending
assigned
accepted
rejected
cancelled
completed
```

### Appointment Flow

```text
assigned or dispatch-ready case
-> create appointment
-> case summary moves to scheduled
-> cases.scheduled_at is updated
-> workflow_event timeline message is created
-> audit is written
```

Create appointment:

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases/CASE_UUID/appointments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledStartAt": "2026-05-16T06:00:00.000Z",
    "scheduledEndAt": "2026-05-16T08:00:00.000Z",
    "visitType": "repair",
    "timezone": "Asia/Taipei",
    "note": "客戶希望下午前完成"
  }'
```

Reschedule or cancel appointment:

```bash
curl -s -X PATCH http://localhost:3000/api/v1/admin/appointments/APPOINTMENT_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledStartAt": "2026-05-17T06:00:00.000Z",
    "scheduledEndAt": "2026-05-17T08:00:00.000Z",
    "rescheduleReason": "客戶改期"
  }'
```

Appointment status values:

```text
scheduled
rescheduled
cancelled
completed
no_show
```

Visit type values:

```text
repair
installation
inspection
```

Repair and installation share the same field service workflow foundation. `case_type` should guide future engineer UI, checklist, service result template, photo requirements, and parts behavior, not split the backend into unrelated systems too early.

### Audit And Timeline

Audit events:

```text
dispatch.created
dispatch.engineer_assigned
appointment.created
appointment.rescheduled
appointment.cancelled
```

Timeline events are written as `workflow_event` messages, such as:

```text
已建立派工
已指派工程師
已預約到府
到府時間改期
```

Phase 1 does not automatically transition to `on_site` or `completed`.

### Dispatch Auditability Future Note

`dispatch_assignments` represents the current active assignment summary. It now records:

```text
assigned_by_user_id
reassigned_by_user_id
reassigned_at
```

These fields identify who created the currently effective dispatch and who last reassigned it. They are not a full history model.

Future complete dispatch history should live in a dedicated `dispatch_assignment_history` table. Suggested fields:

```text
dispatch_assignment_id
action_type
before_engineer_id
after_engineer_id
before_dispatch_unit_id
after_dispatch_unit_id
changed_by_user_id
change_reason
created_at
```

Suggested `action_type` values:

```text
assigned
reassigned
cancelled
returned
escalated
```

Use `dispatch_assignment_history` as the future source of complete audit history. Keep `dispatch_assignments` focused on the current assignment state.

### Dispatch Engineer Response Future Note

Phase 1 keeps dispatch assignment as an admin-driven flow. Engineers do not yet accept or reject assignments through the system.

Future dispatch assignment may add engineer response lifecycle fields:

```text
engineer_accepted_at
engineer_rejected_at
engineer_response_note
```

Future dispatch flow can support:

```text
assigned -> engineer accepted
assigned -> engineer rejected
```

This future lifecycle may also support engineer reject reasons, automatic reassignment, escalation workflow, SLA timeout handling, and AI dispatch optimization. Do not add these fields or flows in Phase 1; keep the current implementation focused on admin-created and admin-updated dispatch assignments.

## Customer Inquiry APIs

Task 016 adds the first public customer inquiry foundation. It does not implement LINE webhook handling, AI chatbot, OTP, SMS, notifications, customer inquiry UI, or realtime behavior.

### Public Routes

```text
POST /api/v1/public/case-inquiry
POST /api/v1/public/line-case-inquiry
```

These endpoints do not require a Bearer token. They accept POST bodies only; do not use GET query string inquiry, because query strings are more likely to be logged by browsers, proxies, or gateways.

### Case Number + Mobile Inquiry

```bash
curl -s -X POST http://localhost:3000/api/v1/public/case-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "caseNo": "TW-20260514-000001",
    "mobile": "0912345678"
  }'
```

### LINE User ID + Case Number Inquiry

```bash
curl -s -X POST http://localhost:3000/api/v1/public/line-case-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "channelCode": "client-a",
    "caseNo": "TW-20260514-000001",
    "lineUserId": "Uxxxxxxxxxxxxxxxx"
  }'
```

LINE inquiry is organization/channel scoped. The backend resolves `channelCode` to `line_channels.organization_id` and `line_channels.id`, then verifies `organization_id + line_channel_id + line_user_id` through `customer_line_identities` before returning any case data. Do not use `lineUserId` alone as a global identity.

### Generic Failure Behavior

Failed verification always returns the same response shape and message. It must not reveal whether the case exists, whether the mobile matched, or whether the LINE user ID matched.

```json
{
  "data": {
    "verified": false,
    "message": "Unable to verify the case with the provided information."
  },
  "requestId": "req_..."
}
```

### Customer Visible Case Fields

Successful inquiry returns only customer-visible data:

```text
caseNo
status
customerVisibleStatus
brand
productType
modelNo
createdAt
updatedAt
preferredVisitTime
latestCustomerVisibleMessage
customerVisibleAttachments
```

It must not return internal notes, audit logs, AI raw output, OCR raw output, dispatch rules, engineer notes, billing data, permissions, or internal workflow metadata.

### Customer Visible Status Mapping

The public `status` is a customer-visible status code, not the raw internal status. The display label is returned as `customerVisibleStatus`.

```text
draft            -> processing / 處理中
pending_customer -> waiting_for_customer / 等待補件
submitted        -> submitted / 案件已送出
reviewing        -> under_review / 案件審核中
accepted         -> accepted / 已受理
rejected         -> not_accepted / 案件未受理
cancelled        -> cancelled / 已取消
dispatch_pending -> arranging_service / 安排派工中
assigned         -> engineer_assigned / 已指派工程師
scheduled        -> scheduled / 已預約到府
on_site          -> in_service / 工程師處理中
completed        -> completed / 服務已完成
closed           -> closed / 案件已結案
```

### Message Visibility

`latestCustomerVisibleMessage` may only come from:

```text
customer_note
workflow_event marked customer-visible
```

It must not return `internal_note` or internal `system_event` messages.

### Inquiry Audit And Security

The service writes audit events for success and failure:

```text
customer_inquiry.success
customer_inquiry.failed
```

Audit metadata masks mobile and LINE user ID. It does not store full mobile or raw LINE user ID. Phase 1 also includes future notes for IP throttling, mobile throttling, and abuse detection, but does not implement a real rate limiter yet.

## Case Messages And Internal Timeline Foundation

Task 015 adds the internal message and timeline foundation. It does not implement LINE webhooks, external messaging, notification delivery, realtime websocket, AI summarization, or customer inquiry UI.

### Message Routes

```text
GET    /api/v1/admin/cases/:caseId/messages   cases.read
POST   /api/v1/admin/cases/:caseId/messages   cases.update
DELETE /api/v1/admin/messages/:messageId      cases.update
```

### Message Types

```text
internal_note   admin-only internal note
system_event    admin-visible system event
customer_note   future customer-visible possible note
workflow_event  admin-visible workflow timeline event
```

Future types may include `line_message`, `ai_summary`, `dispatch_note`, and `engineer_note`.

### Visibility Policy

```text
internal_note   admin only
workflow_event  admin visible
customer_note   admin visible now, future customer-visible filtering possible
system_event    admin visible
```

The API stores visibility hints in message metadata, but public/customer filtering is future scope.

### Create Internal Timeline Message

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases/CASE_UUID/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messageType": "internal_note",
    "bodyText": "客戶補充說明：希望下午聯絡",
    "attachmentId": "ATTACHMENT_UUID"
  }'
```

`attachmentId` is optional. If provided, it must belong to the same case. Messages only reference attachment IDs; they do not copy attachment metadata or binary data.

### List Case Messages

```bash
curl -s "http://localhost:3000/api/v1/admin/cases/CASE_UUID/messages?sort=createdAtAsc&limit=50&offset=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Timeline ordering supports:

```text
createdAtAsc
createdAtDesc
```

### Delete Message

```bash
curl -s -X DELETE http://localhost:3000/api/v1/admin/messages/MESSAGE_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Messages are soft-deleted. There is no edit endpoint in Task 015.

### Activity And Audit Behavior

Creating internal/admin/system/workflow messages updates `cases.last_internal_activity_at`. Future customer-originated messages should update `cases.last_customer_message_at`.

Audit events:

```text
message.created
message.deleted
```

Normal list/read operations are not audited.

## Attachments, R2, And OCR Foundation

Task 014 adds the first attachment foundation. It stores attachment metadata in PostgreSQL, uses R2-compatible short-lived signed URLs for direct client upload/download, and adds an OCR lifecycle placeholder without implementing a real OCR or AI provider.

### Attachment Routes

```text
POST   /api/v1/admin/cases/:caseId/attachments/upload-url   attachments.create
POST   /api/v1/admin/cases/:caseId/attachments/complete     attachments.create
GET    /api/v1/admin/cases/:caseId/attachments              attachments.read
POST   /api/v1/admin/attachments/:attachmentId/download-url attachments.read
POST   /api/v1/admin/attachments/:attachmentId/ocr          attachments.read + cases.update
DELETE /api/v1/admin/attachments/:attachmentId              attachments.delete
```

### Upload Flow

```text
1. Admin asks backend for an upload URL.
2. Backend validates case access and attachment type.
3. Backend creates case_attachments metadata with an R2 object key.
4. Backend returns a short-lived signed PUT URL.
5. Client uploads file directly to R2.
6. Client calls complete API to mark upload metadata complete.
```

Signed URLs are not stored as source of truth. Attachment metadata is the source of truth. Binary files are never stored in PostgreSQL.

### Generate Upload URL

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases/CASE_UUID/attachments/upload-url \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attachmentType": "serial_photo",
    "originalFilename": "serial.jpg",
    "contentType": "image/jpeg",
    "byteSize": 123456,
    "sourceChannel": "admin"
  }'
```

Response includes `attachment` metadata and an `upload.signedUrl` for direct PUT to R2. The signed URL is short-lived and should not be persisted by clients.

### Complete Upload

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases/CASE_UUID/attachments/complete \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attachmentId": "ATTACHMENT_UUID",
    "byteSize": 123456,
    "checksumSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  }'
```

### List Case Attachments

```bash
curl -s http://localhost:3000/api/v1/admin/cases/CASE_UUID/attachments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

List responses do not include signed URLs.

### Generate Download URL

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/attachments/ATTACHMENT_UUID/download-url \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ttlSeconds": 300}'
```

The download endpoint validates access and returns a short-lived signed GET URL. It does not expose permanent public URLs or R2 credentials.

### Request OCR Placeholder

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/attachments/ATTACHMENT_UUID/ocr \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

OCR is only allowed for `serial_photo` and `invoice_photo` in this foundation. The endpoint marks OCR as `pending` and writes audit metadata; it does not call a real OCR provider.

### Delete Attachment Metadata

```bash
curl -s -X DELETE http://localhost:3000/api/v1/admin/attachments/ATTACHMENT_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Task 014 soft-deletes metadata only. It does not hard-delete the R2 object; future retention and legal-hold policy should decide purge behavior.

### Supported Attachment Types

```text
fault_photo
serial_photo
invoice_photo
product_photo
issue_photo
completion_photo
signature
other
```

Future types can include `faulty_part_photo`, `new_part_photo`, `old_serial_photo`, and `new_serial_photo`.

### R2 Environment

```text
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=onsite-service-attachments
R2_SIGNED_URL_TTL_SECONDS=900
```

If R2 variables are missing, endpoints that generate signed URLs return a storage configuration error. Non-storage routes can still boot.

### Attachment Audit Events

```text
attachment.metadata_created
attachment.upload_completed
attachment.download_url_generated
attachment.ocr_requested
attachment.ocr_result_updated
attachment.deleted
```

Normal list operations are not audited.

## Backend Foundation

Task 009 adds shared backend foundation only. It does not implement LINE, AI, R2, or workflow behavior.

### Middleware Order

Current app middleware order:

```text
requestId
requestLogger
helmet
cors
json/urlencoded body parsing
routes
notFoundHandler
errorHandler
```

`requestId` runs first so every log line and error response can include the same request correlation ID.

### Error Strategy

Shared error classes live in [src/utils/errors.js](/Users/roy/Documents/Codex/onsite%20service%20system/codex-ready-ai-field-service-docs/src/utils/errors.js).

The error response follows the Task 006 shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request.",
    "details": [],
    "requestId": "req_..."
  }
}
```

### Response Strategy

Shared response helpers live in [src/utils/responses.js](/Users/roy/Documents/Codex/onsite%20service%20system/codex-ready-ai-field-service-docs/src/utils/responses.js):

- `successResponse()`
- `paginationResponse()`
- `errorResponse()`

### Validation Strategy

Validation foundation uses `zod`.

Shared validation middleware lives in [src/middlewares/validateRequest.js](/Users/roy/Documents/Codex/onsite%20service%20system/codex-ready-ai-field-service-docs/src/middlewares/validateRequest.js). It can validate:

- `req.params`
- `req.query`
- `req.body`

Validation failures are converted into field-level `VALIDATION_ERROR` details.

### Auth Middleware Foundation

Auth middleware started as Task 009 foundation and is now backed by Task 010 JWT/RBAC behavior:

- [requireAuth.js](/Users/roy/Documents/Codex/onsite%20service%20system/codex-ready-ai-field-service-docs/src/middlewares/requireAuth.js) verifies Bearer JWTs and populates `req.user`.
- [requirePermission.js](/Users/roy/Documents/Codex/onsite%20service%20system/codex-ready-ai-field-service-docs/src/middlewares/requirePermission.js) checks active database-backed permissions on `req.user.permissions`.

### Repository Strategy

Repository foundation lives in [src/repositories/BaseRepository.js](/Users/roy/Documents/Codex/onsite%20service%20system/codex-ready-ai-field-service-docs/src/repositories/BaseRepository.js).

It provides:

- parameterized query helpers
- `queryOne()`
- `queryMany()`
- pagination normalization
- transaction access through `withTransaction()`

No ORM is used.

### Transaction Strategy

Transaction helper lives in [src/db/transaction.js](/Users/roy/Documents/Codex/onsite%20service%20system/codex-ready-ai-field-service-docs/src/db/transaction.js).

`withTransaction()`:

- opens a database client
- begins a transaction
- commits on success
- rolls back on error
- releases the client

## Database Migrations

Migration files live in [migrations/](/Users/roy/Documents/Codex/onsite%20service%20system/codex-ready-ai-field-service-docs/migrations).

The migration runner:

- Creates `schema_migrations` automatically.
- Runs `*.sql` files in filename order.
- Skips migrations that were already applied.
- Verifies checksums for already applied migrations.
- Wraps each migration file in its own transaction.

### Fresh Database Order

```text
001_create_base_tables.sql
002_create_cases.sql
003_create_case_activity_tables.sql
```

This order is required because `cases` references `customers`, `dispatch_units`, and `users`, while `case_attachments` and `case_messages` reference `cases`.

### Run Migrations

Make sure `.env` contains `DATABASE_URL`, then run:

```bash
npm run db:migrate
```

The runner uses only `DATABASE_URL`. It does not run API endpoints or business logic.

## Original Docs Package Note

Put these files into your project root:

```text
docs/
sql/
*.md
```

## Field Service Report Foundation

Task 018 adds the first engineer onsite service result foundation. It does not implement engineer mobile UI, billing, inventory, AI diagnosis, quote approval, or settlement workflows.

### Field Service Routes

```text
POST   /api/v1/admin/cases/:caseId/service-report          service_reports.manage
GET    /api/v1/admin/cases/:caseId/service-report          service_reports.manage
PATCH  /api/v1/admin/service-reports/:reportId             service_reports.manage
POST   /api/v1/admin/service-reports/:reportId/parts       service_reports.manage
GET    /api/v1/admin/service-reports/:reportId/parts       service_reports.manage
PATCH  /api/v1/admin/service-parts/:partId                 service_reports.manage
DELETE /api/v1/admin/service-parts/:partId                 service_reports.manage
```

### Field Service Workflow

```text
assigned or scheduled case
-> create service report
-> case status moves to on_site
-> engineer records diagnosis / repair result / parts
-> complete service report
-> case status moves to completed
```

Phase 1 does not auto close the case and does not create billing records.

Create service report:

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases/CASE_UUID/service-report \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "diagnosisResult": "電源板異常",
    "repairAction": "更換電源板",
    "engineerNote": "現場檢測完成"
  }'
```

Get current service report for a case:

```bash
curl -s http://localhost:3000/api/v1/admin/cases/CASE_UUID/service-report \
  -H "Authorization: Bearer $TOKEN"
```

Update diagnosis or repair result:

```bash
curl -s -X PATCH http://localhost:3000/api/v1/admin/service-reports/REPORT_UUID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repairResult": "已更換零件並測試正常",
    "customerNote": "客戶確認功能恢復"
  }'
```

Complete service report:

```bash
curl -s -X PATCH http://localhost:3000/api/v1/admin/service-reports/REPORT_UUID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceStatus": "completed",
    "repairResult": "現場服務完成"
  }'
```

### Repair vs Installation

Repair and installation share the same backend workflow. `cases.case_type` should guide engineer UI, checklist, required photos, result template, and parts behavior.

Repair reports use:

```text
diagnosis_result
repair_action
repair_result
service_parts
```

Installation remains future-ready through:

```text
installation_checklist
```

Do not split into `installation_reports` and `repair_reports` unless future field differences become too large for the shared field service model.

### Service Parts

Service parts belong to a service report, not directly to a case. They are a foundation for onsite replacement records only; they do not reserve stock, calculate cost, or create billing records.

Add service part:

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/service-reports/REPORT_UUID/parts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "partName": "電源板",
    "partNo": "PWR-001",
    "quantity": 1,
    "oldSerialNo": "OLD123",
    "newSerialNo": "NEW456",
    "partStatus": "replaced"
  }'
```

List service parts:

```bash
curl -s http://localhost:3000/api/v1/admin/service-reports/REPORT_UUID/parts \
  -H "Authorization: Bearer $TOKEN"
```

Update service part:

```bash
curl -s -X PATCH http://localhost:3000/api/v1/admin/service-parts/PART_UUID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "partStatus": "used",
    "replacedAt": "2026-05-15T10:00:00+08:00"
  }'
```

Delete service part:

```bash
curl -s -X DELETE http://localhost:3000/api/v1/admin/service-parts/PART_UUID \
  -H "Authorization: Bearer $TOKEN"
```

### Field Service Audit And Timeline

Audit events include:

```text
service_report.created
service_report.diagnosis_updated
service_report.repair_result_updated
service_report.completed
service_part.added
service_part.updated
service_part.deleted
```

Timeline `workflow_event` messages include:

```text
工程師開始到府
已完成維修
更換零件
待料追蹤
```

### Known Limits

Field service reports are Phase 1 foundation records only. They do not implement engineer mobile UI, inventory deduction, quote approval, billing, settlement, customer signature capture, AI diagnosis, or multi-visit field service history.

## Billing / Settlement Foundation

Task 019 adds the first billing and settlement foundation. It does not implement payment gateways, ERP integration, accounting export, invoice issuance, inventory costing, or AI billing analysis.

### Billing Routes

```text
POST  /api/v1/admin/cases/:caseId/billing             billing.manage
GET   /api/v1/admin/cases/:caseId/billing             billing.manage
PATCH /api/v1/admin/billing/:billingId                billing.manage
POST  /api/v1/admin/billing/:billingId/settlements    billing.manage
GET   /api/v1/admin/billing/:billingId/settlements    billing.manage
PATCH /api/v1/admin/settlements/:settlementId         billing.manage
```

### Billing Flow

```text
completed service report
-> create billing record
-> review/update billing amounts
-> submit settlement
-> complete or reject settlement
```

Phase 1 allows a billing record after the case is completed. Billing approved is future-ready for close flow, but the system does not auto-close cases and does not generate invoices.

Create billing record:

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases/CASE_UUID/billing \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "laborAmount": 800,
    "partsAmount": 1200,
    "transportAmount": 300,
    "additionalAmount": 0,
    "customerChargeAmount": 2300,
    "manufacturerClaimAmount": 0,
    "warrantyAmount": 0,
    "billingNote": "現場完修收費"
  }'
```

Get case billing record:

```bash
curl -s http://localhost:3000/api/v1/admin/cases/CASE_UUID/billing \
  -H "Authorization: Bearer $TOKEN"
```

Update billing amounts or status:

```bash
curl -s -X PATCH http://localhost:3000/api/v1/admin/billing/BILLING_UUID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "laborAmount": 900,
    "billingStatus": "pending_review",
    "billingNote": "補登工資"
  }'
```

### Settlement Flow

Settlement records belong to a billing record. They are used to track who should be settled with, not to execute payment or sync accounting systems.

Settlement target types:

```text
engineer
manufacturer
internal
```

Settlement statuses:

```text
pending
submitted
completed
rejected
```

Submit settlement:

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/billing/BILLING_UUID/settlements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settlementTargetType": "engineer",
    "settlementTargetId": "ENGINEER_USER_UUID",
    "settlementAmount": 900,
    "settlementNote": "工程師服務費"
  }'
```

List settlements:

```bash
curl -s http://localhost:3000/api/v1/admin/billing/BILLING_UUID/settlements \
  -H "Authorization: Bearer $TOKEN"
```

Complete settlement:

```bash
curl -s -X PATCH http://localhost:3000/api/v1/admin/settlements/SETTLEMENT_UUID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settlementStatus": "completed"
  }'
```

Reject manufacturer settlement:

```bash
curl -s -X PATCH http://localhost:3000/api/v1/admin/settlements/SETTLEMENT_UUID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settlementStatus": "rejected",
    "settlementNote": "原廠退件，待補資料"
  }'
```

### Manufacturer vs Engineer Settlement

Engineer settlement is used for internal or contractor payout tracking. Manufacturer settlement is used for warranty or claim tracking. Internal settlement is reserved for company-side adjustments.

These records are operational settlement summaries only. They do not represent accounting journal entries, payment transactions, invoice issuance, tax documents, or ERP sync records.

### Service Part Integration

Billing may reference labor and service parts summary values through amount fields and an optional `field_service_report_id`. Phase 1 does not calculate inventory cost from `service_parts`; parts cost must be provided as billing input until a future inventory/costing module exists.

### Billing Audit And Timeline

Audit events include:

```text
billing.created
billing.updated
settlement.submitted
settlement.completed
settlement.rejected
```

Timeline `workflow_event` messages include:

```text
已建立帳務
已送出請款
已完成結算
原廠退件
```

### Known Limits

Billing and settlement are Phase 1 foundation records only. They do not implement payment gateway calls, ERP sync, accounting export, invoice generation, inventory costing, AI billing analysis, tax rules, or automatic settlement.

### Vendor-Specific Settlement Rules Future Note

Future vendors, manufacturers, distributors, partners, and subcontractors may require different settlement logic. Keep `BillingService` focused on common billing and settlement workflow only; do not hard-code vendor-specific reconciliation logic inside it.

Future `settlement_target_type` values may include:

```text
vendor
distributor
partner
subcontractor
```

Phase 1 keeps `billing_records` as the case-level billing summary. Do not store vendor-specific settlement rules, contracts, claim formulas, or reconciliation conditions in `billing_records`.

`settlement_records` stores the actual settlement result and keeps future-ready rule trace fields:

```text
settlement_target_type
settlement_target_id
settlement_rule_code
settlement_policy_version
settlement_metadata
```

Future vendor settlement rule tables may include:

```text
vendors
vendor_settlement_rules
vendor_contracts
vendor_claim_policies
```

Different vendors may calculate claims or settlements by brand, product type, case type, warranty status, service region, service parts, repair result, engineer type, manufacturer case number, or SLA timeout state.

Future architecture principle:

```text
BillingService = common billing workflow
VendorSettlementPolicy / SettlementRuleEngine = vendor-specific settlement rules
```

Phase 1 does not implement a rule engine. It only preserves `settlement_rule_code`, `settlement_policy_version`, and `settlement_metadata` for future traceability.

Future AI may help identify applicable vendor rules, compare manufacturer claim data, detect abnormal differences, and summarize reconciliation issues. AI must not directly approve settlements.

## Notification Foundation

Task 020 adds the first notification preferences, templates, and logs foundation. It does not implement LINE, SMS, email, background queues, provider retries, or AI notification generation.

### Notification Routes

```text
GET   /api/v1/admin/notification-preferences              notifications.read
POST  /api/v1/admin/notification-preferences              notifications.manage
PATCH /api/v1/admin/notification-preferences/:preferenceId notifications.manage

GET   /api/v1/admin/notification-templates                notifications.read
POST  /api/v1/admin/notification-templates                notifications.manage
PATCH /api/v1/admin/notification-templates/:templateId     notifications.manage

GET   /api/v1/admin/notification-logs                     notifications.read
```

### Notification Preferences

`notification_preferences` controls whether an event should notify a target through a channel.

Target types:

```text
customer
user
role
dispatch_unit
system
```

Channels:

```text
line
sms
email
in_app
```

Example event keys:

```text
case.submitted
case.accepted
case.rejected
case.cancelled
dispatch.assigned
appointment.scheduled
appointment.rescheduled
appointment.cancelled
service.completed
billing.created
settlement.completed
```

Preference lookup is future-ready for layered notification switches:

```text
system event/channel switch
-> role or user switch
-> dispatch unit switch
-> customer switch
```

Phase 1 uses `notification_preferences` lookup only. It does not send provider notifications.

Task 024C security guard: Notification Foundation is currently global/system-level because `notification_preferences`, `notification_templates`, and `notification_logs` do not yet carry organization routing. Until multi-organization notification scope is added, notification admin APIs require a super admin or system admin user in addition to `notifications.read` / `notifications.manage`. Regular organization users must not use these global notification APIs even if they hold notification permissions.

Future multi-organization notification routing should add `organization_id` and, for LINE, `line_channel_id` or an equivalent policy layer before enabling provider delivery.

Create a system-level event switch:

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/notification-preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetType": "system",
    "eventKey": "case.accepted",
    "channel": "line",
    "enabled": true
  }'
```

Disable a role notification:

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/notification-preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetType": "role",
    "targetId": "ROLE_UUID",
    "eventKey": "settlement.completed",
    "channel": "email",
    "enabled": false
  }'
```

Update a preference:

```bash
curl -s -X PATCH http://localhost:3000/api/v1/admin/notification-preferences/PREFERENCE_UUID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false
  }'
```

### Notification Templates

`notification_templates` stores event/channel message templates. `NotificationService.renderTemplate()` is a placeholder renderer that replaces `{{variable}}` values from a variables object. Provider-specific formatting remains future work.

Create template:

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/notification-templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventKey": "appointment.scheduled",
    "channel": "sms",
    "templateName": "到府預約通知",
    "bodyTemplate": "您的案件 {{caseNo}} 已預約 {{scheduledAt}} 到府。",
    "version": 1
  }'
```

### Notification Logs

`notification_logs` records generated notification attempts and outcomes.

Statuses:

```text
pending
skipped
sent
failed
```

Phase 1 can create logs, mark sent/failed internally through `NotificationService`, and record skipped notifications with a reason. It does not call external providers.

List logs:

```bash
curl -s 'http://localhost:3000/api/v1/admin/notification-logs?status=skipped' \
  -H "Authorization: Bearer $TOKEN"
```

### Future Notification Integration Points

Workflow services can later call `NotificationService` around these events:

```text
case accepted
appointment scheduled
appointment rescheduled
dispatch assigned
service completed
settlement completed
```

Future provider modules should live behind a notification provider adapter, such as `LineNotificationProvider`, `SmsNotificationProvider`, or `EmailNotificationProvider`. Do not put provider calls directly inside workflow services.

### Notification Audit

Audit events include:

```text
notification.preference_changed
notification.template_changed
notification.skipped
```

### Known Limits

Notification foundation does not send LINE, SMS, or email. It does not implement background queues, retry policies, provider webhooks, delivery receipts, throttling, AI notification copywriting, or template localization.

## AI / OCR Orchestration Foundation

Task 021 adds the first AI and OCR orchestration foundation. It does not implement a real OpenAI provider, OCR provider, AI chatbot, autonomous AI agent, vector database, or semantic search.

### AI Provider Abstraction

AI provider calls must go through the provider interface and `AIOrchestrationService`. Controllers, workflow services, and LINE/webhook handlers must not call OpenAI or any other model provider directly.

Provider interface methods:

```text
summarizeCase()
classifyCase()
suggestDispatch()
analyzeServiceReport()
analyzeBilling()
runOCR()
```

Task 021 ships with `PlaceholderAIProvider`, which returns placeholder advisory payloads only. Future providers can implement OpenAI, Claude, Gemini, local LLM, or OCR engines behind the same interface.

### AI Routes

```text
POST /api/v1/admin/cases/:caseId/ai/summary              ai.manage
POST /api/v1/admin/cases/:caseId/ai/classification       ai.manage
POST /api/v1/admin/cases/:caseId/ai/dispatch-suggestion  ai.manage
POST /api/v1/admin/attachments/:attachmentId/ocr         ai.manage + attachments.read
GET  /api/v1/admin/ai-jobs                               ai.read
GET  /api/v1/admin/ai-jobs/:jobId                        ai.read
```

### AI Job Flow

```text
admin trigger
-> create ai_jobs row with pending status
-> mark processing
-> call provider interface
-> store result in ai_jobs.response_payload
-> mark completed or failed
-> write audit
-> optional workflow_event timeline message
```

AI results do not directly overwrite formal workflow fields. Case summaries, classifications, and dispatch suggestions stay in `ai_jobs.response_payload` until a future human approval flow promotes them into official fields.

Request case summary:

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases/CASE_UUID/ai/summary \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "請摘要客戶故障描述"
  }'
```

Request classification:

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases/CASE_UUID/ai/classification \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Request dispatch suggestion:

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/cases/CASE_UUID/ai/dispatch-suggestion \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

List AI jobs:

```bash
curl -s 'http://localhost:3000/api/v1/admin/ai-jobs?status=completed' \
  -H "Authorization: Bearer $TOKEN"
```

### OCR Orchestration

Attachment OCR uses both the attachment OCR lifecycle and the AI job lifecycle.

```text
POST /admin/attachments/:attachmentId/ocr
-> validate attachment type
-> attachment ocr_status = processing
-> create ai_jobs row with job_type = ocr
-> provider interface runOCR()
-> ai_jobs.response_payload stores extraction result
-> attachment ocr_status = manual_review
```

OCR is currently limited to:

```text
serial_photo
invoice_photo
```

Request OCR:

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/attachments/ATTACHMENT_UUID/ocr \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "辨識序號"
  }'
```

OCR output is advisory. It may update attachment OCR fields for review, but it should not automatically overwrite official case fields without human confirmation.

### AI Safety Boundary

AI may:

```text
suggest
summarize
classify
extract
```

AI must not:

```text
auto accept cases
auto reject cases
auto settle billing
auto override workflow
auto assign engineer without admin confirmation
```

### AI Audit And Timeline

Audit events include:

```text
ai.job_requested
ai.job_completed
ai.job_failed
attachment.ocr_requested
```

Timeline `workflow_event` messages include:

```text
AI 已產生案件摘要
AI 已產生案件分類
AI 建議派工
OCR 完成
AI 已產生服務報告分析
```

### AI Notification Future Note

Future AI job completion can emit notification events, such as `ai.job.completed` or `ocr.completed`. Phase 1 does not send notifications and does not enqueue background jobs.

### Known Limits

AI orchestration is synchronous placeholder execution in Phase 1. It does not implement real provider calls, provider timeout handling, retries, queues, token accounting, model routing, prompt storage, vector search, chatbot memory, autonomous actions, or semantic search.

## Multi-Organization LINE Integration Foundation

Task 022 adds the first LINE integration foundation. It does not implement AI chatbot, Rich Menu, LINE Push sending, LINE Pay, LIFF, auto case intake, or conversational AI.

### Multi-Organization LINE Architecture

The system is future-ready for multiple organizations. An organization can represent a customer, brand, manufacturer, partner, distributor, or subcontractor.

Tables added:

```text
organizations
line_channels
customer_line_identities
line_events
```

Each organization may have its own LINE Official Account and Messaging API Channel. Production must not assume a single global LINE channel.

### LINE Channel Webhook URL

Webhook routes are scoped by channel code:

```text
POST /api/v1/line/webhook/:channelCode
```

Examples:

```text
/api/v1/line/webhook/client-a
/api/v1/line/webhook/client-b
```

Webhook processing flow:

```text
channelCode
-> line_channels lookup
-> channel_secret lookup
-> LINE signature verification
-> organization_id / line_channel_id context binding
-> customer identity lookup
-> event ingestion
```

### LINE Admin Routes

```text
GET   /api/v1/admin/line-channels                 line.read
POST  /api/v1/admin/line-channels                 line.manage
PATCH /api/v1/admin/line-channels/:channelId      line.manage
```

Create LINE channel:

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/line-channels \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "ORGANIZATION_UUID",
    "channelCode": "client-a",
    "channelName": "Client A LINE OA",
    "channelId": "1234567890",
    "channelSecret": "LINE_CHANNEL_SECRET",
    "channelAccessToken": "LINE_CHANNEL_ACCESS_TOKEN",
    "enabled": true
  }'
```

List LINE channels:

```bash
curl -s http://localhost:3000/api/v1/admin/line-channels \
  -H "Authorization: Bearer $TOKEN"
```

Secrets are masked in API responses. Do not log or return `channel_secret` or `channel_access_token` in plaintext.

### LINE Identity Scope

`line_user_id` is not globally unique. It is only unique inside the same `line_channel_id`.

Customer linking must use:

```text
line_channel_id + line_user_id
```

Do not link customers by `line_user_id` alone.

`customer_line_identities` allows one customer to join multiple LINE channels across different organizations. Phase 1 can create a pending identity without forcing a full customer profile.

### LINE Event Ingestion

Supported event foundation:

```text
message
follow
unfollow
postback placeholder
```

`line_events.raw_payload` is intentionally minimal. It stores safe event metadata such as event type, message type, message id, timestamp, source type, and whether text exists. It must not store LINE secrets or access tokens.

If a LINE text message can be linked to a customer and the customer has an open case, the system may write a `case_messages` row:

```text
sender_type = customer
channel = line
message_type = text
```

If no linked customer or open case exists, the LINE event is recorded but no case is auto-created.

### LINE Inquiry Handoff Future Note

Future LINE inquiry can pass `lineUserId + caseNo` into `CustomerInquiryService`. Task 022 does not implement conversational flow or AI chatbot behavior.

### LINE Security

Webhook requests must include `x-line-signature`. The system verifies the signature with the channel-specific `channel_secret` selected by `channelCode`.

Security requirements:

```text
missing signature -> rejected
invalid signature -> rejected
no secret logging
no access token logging
minimal raw payload
```

Future security work:

```text
replay protection
webhook idempotency
secrets manager integration
provider request tracing
```

### Notification Future Note

Future LINE notification sending must choose the correct access token by:

```text
organization_id
line_channel_id
```

Do not send all customer messages through one global `LINE_CHANNEL_ACCESS_TOKEN`.

Current notification tables are provider foundations and do not yet carry direct organization routing. Before implementing LINE/SMS/email providers, add `organization_id` and any required channel routing to `notification_preferences`, `notification_templates`, and `notification_logs`, or route through a policy layer that can derive the organization and channel safely.

### Organization Data Boundary Future Note

Future workflow, customer, LINE event, notification, and RBAC layers must carry organization context. Different organizations must not see each other's data. Task 022 does not implement full multi-tenant RBAC yet, but the schema preserves the needed context.

### Local Testing

Development `.env` may still contain a single test channel:

```text
LINE_CHANNEL_SECRET
LINE_CHANNEL_ACCESS_TOKEN
```

Production multi-organization environments should store channel secrets and access tokens per `line_channels` row or in a future secrets manager. Do not rely on one `.env` channel for all organizations.

Signature verification can be tested by computing HMAC-SHA256 over the raw request body with the selected channel secret and sending it as `x-line-signature`.

### LINE Audit

Audit events include:

```text
line.follow
line.unfollow
line.customer_linked
line.channel_created
line.channel_updated
```

### Known Limits

LINE foundation does not implement AI chatbot, LINE Push provider, Rich Menu, LIFF, LINE Pay, automatic case intake, customer profile creation, full customer inquiry chat flow, or provider-side replay/idempotency protection.

## Organization Scope / Data Isolation Foundation

Task 023 adds organization scope as the data boundary foundation for future multi-customer, multi-brand, manufacturer, and partner operations.

### Schema Scope

New migration:

```bash
npm run db:migrate
```

adds:

- `customers.organization_id`
- `cases.organization_id`
- `cases.intake_line_channel_id`
- `dispatch_units.organization_id`
- `user_organizations`

`user_organizations` represents which organizations a backend user can operate. Phase 1 keeps this lightweight: `admin` / `system` roles can operate across organizations, while regular users should be limited by membership rows.

### RBAC vs Organization Scope

RBAC answers: can this user perform this action?

Examples:

- `cases.read`
- `cases.update`
- `customers.read`
- `dispatch.manage`

Organization scope answers: which organization's data can this user operate on?

Both checks are needed. A user may have `cases.read`, but still only read cases inside organizations allowed by `user_organizations`.

### Admin Create Case With Organization

Production requests should provide organization context explicitly:

```bash
curl -X POST http://localhost:3000/api/v1/admin/cases \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "ORG_UUID",
    "customer": {
      "customerName": "王小明",
      "mobile": "0912345678",
      "city": "Taipei",
      "address": "台北市測試路 1 號"
    },
    "case": {
      "source": "admin",
      "brand": "Test Brand",
      "caseType": "repair",
      "productType": "TV",
      "modelNo": "MODEL-001",
      "problemDescription": "無法開機"
    }
  }'
```

Development may allow a null organization fallback for older local data. This is only a dev fallback. Production must provide organization context or derive it from an intake channel such as LINE.

### LINE Organization Context

LINE webhook handling derives organization context from:

```text
/api/v1/line/webhook/:channelCode
-> line_channels.channel_code
-> line_channels.organization_id
```

Any future LINE-created customer, inquiry, case, message, or notification must carry `organization_id` and `line_channel_id`.

### Customer Linking Rule

Admin case creation now uses organization-scoped mobile matching:

```text
organization_id + mobile
```

The same phone number may exist under different brands or manufacturers and must not cause cross-organization customer reuse.

`cases.customer_snapshot` keeps a historical business snapshot at case creation time, including:

- `organization_id`
- `organization_code`
- `organization_name`
- `customer_name`
- `mobile`
- `tel`
- `city`
- `address`

Snapshots are not rewritten when customer master data changes.

### LINE Identity Scope

`line_user_id` is not globally unique for this system. LINE identity scope is:

```text
organization_id + line_channel_id + line_user_id
```

Do not link customers or inquiries using only `line_user_id`.

### Future Full Multi-Tenant Notes

Task 023 does not implement SaaS billing plans, tenant-level billing, an organization switcher UI, or full ABAC. Future work may add:

- organization management APIs
- organization-scoped RBAC administration
- tenant-aware audit export
- organization-level retention policies
- stricter production enforcement for non-null `organization_id`

### AI Conversation Context Isolation Future Note

Future AI chatbot or conversation memory must isolate context by LINE and organization scope. Do not use `line_user_id` alone as the AI conversation identity.

AI conversation scope should include:

- `organization_id`
- `line_channel_id`
- `line_user_id`
- `customer_id` nullable
- `case_id` nullable

Future tables may include:

```text
ai_conversations
- id
- organization_id
- line_channel_id
- line_user_id
- customer_id
- case_id
- conversation_status
- created_at
- updated_at

ai_conversation_messages
- id
- ai_conversation_id
- sender_type
- message_text
- message_metadata
- created_at
```

Before every AI response, the system may only load context from the same `organization_id`, `line_channel_id`, `line_user_id`, and relevant `case_id` scope.

AI prompt layers should be separated:

1. global system policy
2. organization policy
3. line channel policy
4. case context
5. customer-visible data policy

Customer-facing AI must not:

- read cases across organizations
- mix the same LINE user ID across different LINE channels
- apply warranty or service policy across brands/vendors
- expose internal notes, audit logs, billing data, or other internal-only records

Task 023 only records this future isolation rule. Actual AI chatbot, conversation memory, and AI conversation persistence should be implemented in a later AI Conversation Foundation task.

## Organization Admin Foundation

Task 024 adds backend-only organization management and user organization membership management. This does not implement SaaS billing, tenant plans, frontend organization switching, or full ABAC.

### Permissions

Organization admin APIs use:

- `organizations.read`
- `organizations.manage`

User organization membership changes require `organizations.manage`. RBAC still controls the action, while organization scope controls which data a user can access.

Access behavior:

- `admin` / `system` roles can manage and view organizations across the system.
- regular users only see organizations listed in their active `user_organizations` memberships.
- organization detail/update and membership assignment/removal require access to the target organization.
- `organizations.read` or `organizations.manage` is necessary but not sufficient for regular users; organization scope is checked separately.

Run seed after migration to ensure permissions exist:

```bash
npm run db:seed
```

### Organization APIs

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/admin/organizations
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/organizations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationCode": "client-a",
    "organizationName": "Client A",
    "status": "active"
  }'
```

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/admin/organizations/ORG_UUID
```

```bash
curl -X PATCH http://localhost:3000/api/v1/admin/organizations/ORG_UUID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Client A Updated",
    "status": "disabled"
  }'
```

Organization DTOs expose only:

- `id`
- `organizationCode`
- `organizationName`
- `status`
- `createdAt`
- `updatedAt`

They do not expose future billing metadata, LINE secrets, or unrelated channel tokens.

### User Organization Membership APIs

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/admin/users/USER_UUID/organizations
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/users/USER_UUID/organizations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "ORG_UUID",
    "roleNote": "north region operations"
  }'
```

```bash
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/admin/users/USER_UUID/organizations/ORG_UUID
```

Membership removal is soft delete through `user_organizations.deleted_at`. Active duplicates are avoided by the `idx_user_organizations_active_unique` index and repository-level reuse.

### Access Boundary Helper

`OrganizationAccessService` provides:

- `canAccessOrganization(user, organizationId)`
- `assertAccess(user, organizationId)`
- `buildScopedFilter(user, requestedOrganizationId)`

Current rule:

- `admin` / `system` role can operate across organizations.
- regular users require an active `user_organizations` membership.

This remains a foundation layer, not full ABAC.

## Organization Scope Enforcement Patch

Task 024A hardens the existing organization boundary. Case-derived services now enforce organization access before operating on related resources:

- workflow transitions
- attachments and signed URL/OCR actions
- messages and internal timeline entries
- dispatch and appointment actions
- field service reports and service parts
- billing and settlements
- AI/OCR jobs linked to cases, attachments, or service reports

Dispatch assignment also validates same-organization routing: a `dispatch_unit_id` must belong to the same organization as the case. If an engineer is assigned, the engineer must have active organization membership when the case has an organization.

`ai_jobs` now carries optional scope columns:

- `organization_id`
- `line_channel_id`
- `customer_id`
- `case_id`

Case summary, classification, dispatch suggestion, attachment OCR, and service report analysis jobs store the derived organization/case/customer context. Listing and reading AI jobs now checks organization access.

LINE identity matching is scoped by:

```text
organization_id + line_channel_id + line_user_id
```

`POST /api/v1/public/line-case-inquiry` now requires `channelCode` so the backend can derive `organization_id` and `line_channel_id` before checking a LINE identity.

Task 024C hardening:

- LINE channel admin list/create/update now enforces organization scope through `OrganizationAccessService`.
- Creating a LINE channel requires access to the requested `organizationId`.
- Updating a LINE channel requires access to the existing channel's organization. Phase 1 does not support moving a LINE channel to another organization.
- Linking a `customerId` to a LINE identity requires the customer to belong to the same organization as the LINE channel.
- Customer-originated message writes bypass organization membership only when a trusted internal ingestion flow passes `trustedCustomerIngress: true`; public controllers must not use this bypass.

Future security audit work may record suspicious cross-organization access attempts. Task 024A returns permission errors but does not add a separate security-event stream.

### Audit Events

The following actions write audit logs:

- `organization.created`
- `organization.updated`
- `user_organization.assigned`
- `user_organization.removed`

Task 026B updates the `audit_logs.entity_type` constraint through `015_update_audit_log_entity_type_constraint.sql`. The allowlist now covers the implemented audit entities for cases, customers, attachments, messages, field service, billing/settlement, notifications, AI jobs, LINE integration, organizations, users, roles, permissions, and system events. `audit_logs.action` remains constrained only as non-blank; action names are application-defined.

## Audit Log Read API

Task 027A adds the first read-only audit log API for backend administrators. It does not change audit write behavior, does not export audit logs, and does not implement immutable audit storage.

Routes:

```text
GET /api/v1/admin/audit-logs              audit_logs.read + system/super admin
GET /api/v1/admin/audit-logs/:auditLogId  audit_logs.read + system/super admin
```

Phase 1 audit log reads are global/system-level APIs. Because `audit_logs` does not yet have reliable `organization_id` scoping, these routes require both:

- `audit_logs.read`
- system or super admin access

Regular organization users must not use global audit log APIs even if they hold `audit_logs.read`.

List filters:

```text
actorUserId
action
entityType
entityId
organizationId
requestId
createdFrom
createdTo
limit
offset
sort=createdAtDesc|createdAtAsc
```

`organizationId` is a best-effort JSON payload filter only. Future audit design should add `audit_logs.organization_id` for efficient and reliable multi-organization audit filtering.

List audit logs:

```bash
curl -s 'http://localhost:3000/api/v1/admin/audit-logs?entityType=case&limit=20' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Read audit log detail:

```bash
curl -s http://localhost:3000/api/v1/admin/audit-logs/AUDIT_LOG_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Audit DTOs redact sensitive keys in `beforeData`, `afterData`, and `metadata`, including password, password hash, tokens, authorization headers, channel secrets, access tokens, API keys, `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, and `R2_SECRET_ACCESS_KEY`.

## User Admin API

Task 027D adds the first backend-only user management foundation. It does not implement password reset email, MFA, invitations, social login, LINE Login, or a complete IAM console.

Routes:

```text
GET    /api/v1/admin/users                     users.read
POST   /api/v1/admin/users                     users.manage
GET    /api/v1/admin/users/:userId             users.read
PATCH  /api/v1/admin/users/:userId             users.manage
DELETE /api/v1/admin/users/:userId             users.manage

GET    /api/v1/admin/users/:userId/roles       users.read
POST   /api/v1/admin/users/:userId/roles       users.manage
DELETE /api/v1/admin/users/:userId/roles/:roleId users.manage
```

Organization membership routes remain:

```text
GET    /api/v1/admin/users/:userId/organizations
POST   /api/v1/admin/users/:userId/organizations
DELETE /api/v1/admin/users/:userId/organizations/:organizationId
```

User API fields:

```text
id
email
displayName
userType
status: active | disabled
createdAt
updatedAt
```

The database stores disabled users as `status='inactive'`; the API maps it to `disabled`. Disabled users cannot login because AuthService only allows `active` users.

Create user:

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "regular@example.com",
    "password": "ChangeMe123!",
    "displayName": "Regular Org User",
    "status": "active"
  }'
```

List users:

```bash
curl -s 'http://localhost:3000/api/v1/admin/users?status=active&sort=emailAsc' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Read user:

```bash
curl -s http://localhost:3000/api/v1/admin/users/USER_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Update user:

```bash
curl -s -X PATCH http://localhost:3000/api/v1/admin/users/USER_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Updated Regular User"}'
```

Disable user:

```bash
curl -s -X DELETE http://localhost:3000/api/v1/admin/users/USER_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Assign role:

```bash
curl -s -X POST http://localhost:3000/api/v1/admin/users/USER_UUID/roles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roleId":"ROLE_UUID"}'
```

Remove role:

```bash
curl -s -X DELETE http://localhost:3000/api/v1/admin/users/USER_UUID/roles/ROLE_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Security rules:

- passwords are hashed with bcrypt before storage.
- responses never include `password_hash`.
- users cannot disable themselves.
- users cannot assign/remove roles on themselves through this API.
- email is normalized to lowercase and must be unique for active records.
- role assignment avoids duplicate active grants through the existing `user_roles` unique index.
- role assignment currently requires `users.manage`; future RBAC should support `users.manage + roles.manage` as a combined guard.

Audit events:

```text
user.created
user.updated
user.disabled
user_role.assigned
user_role.removed
```

Optional smoke user seed:

```env
SEED_SMOKE_USER_EMAIL=
SEED_SMOKE_USER_PASSWORD=
SEED_SMOKE_USER_DISPLAY_NAME=
```

If both email and password are set, `npm run db:seed` creates a regular `customer_service` smoke user without assigning roles or organization membership. Leave these env vars empty in production unless a deliberate smoke fixture is needed.

Regular user smoke guide:

```text
1. admin login
2. create a regular user
3. assign a limited role, or use a DB/admin fixture role with needed permissions
4. assign the user to one organization
5. login as the regular user
6. verify audit logs and notification global APIs return PERMISSION_DENIED
7. verify dispatch-units for allowed organization works when permission is granted
8. verify dispatch-units for another organization is denied or scoped away
```

## Zeabur Deployment And DB Integration Smoke

Task 025Z prepares the Zeabur deployment and PostgreSQL integration smoke test path. The production target does not need to depend on a local `localhost:5432` PostgreSQL instance.

Recommended Zeabur service layout:

- Node.js backend service for this repository.
- PostgreSQL service for application data.
- Optional Redis service in the future for queues, throttling, caching, and background jobs.
- Optional Cloudflare R2 / object storage configuration through environment variables.

### Zeabur Environment Variables

Required backend env:

```env
DATABASE_URL=
JWT_SECRET=
APP_BASE_URL=
```

Provider-specific or optional env:

```env
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_SIGNED_URL_TTL_SECONDS=

OPENAI_API_KEY=
```

Deployment notes:

- `DATABASE_URL` should point to Zeabur PostgreSQL, not `localhost`.
- Zeabur injects `PORT`; the backend reads `process.env.PORT`.
- `JWT_SECRET` must be a long random production secret.
- Secrets must be configured in Zeabur environment variables and must not be committed to git.
- LINE, R2, and OpenAI variables may be blank for the first DB smoke test. Related routes should fail gracefully when provider config is missing and must not break `/healthz`.

### Zeabur Commands

The package scripts required for Zeabur smoke testing are available:

```bash
npm start
npm run db:migrate
npm run db:seed
npm run check
```

Use `npm start` as the Zeabur app start command.

Do not run migration or seed automatically inside app start. Production migration/seed should be explicit:

```bash
npm run db:migrate
npm run db:seed
```

Migration must run before seed. The migration runner uses `schema_migrations`, verifies checksums, skips already-applied migrations, and wraps each migration in a transaction.

### Zeabur Health Smoke

After deployment:

```bash
curl https://YOUR-ZEABUR-DOMAIN/healthz
```

Confirm:

- `ok` is `true`.
- `requestId` is present.
- no secrets are exposed.

### Zeabur Auth Smoke

After migration and seed:

```bash
curl -s -X POST https://YOUR-ZEABUR-DOMAIN/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ChangeMe123!"}'
```

Then:

```bash
curl -s https://YOUR-ZEABUR-DOMAIN/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Zeabur LINE Webhook URL

After the Zeabur domain is available, LINE webhook URLs use the multi-channel route:

```text
https://YOUR-ZEABUR-DOMAIN/api/v1/line/webhook/:channelCode
```

Example:

```text
https://xxx.zeabur.app/api/v1/line/webhook/client-a
```

Do not use a single global LINE access token for all organizations in production. Future LINE sending must choose credentials by `organization_id` and `line_channel_id`.

### Zeabur R2 Note

If R2 env vars are missing:

- the app should still boot.
- `/healthz` should remain healthy.
- signed URL endpoints can return a storage configuration error.
- non-storage routes should not be affected.

### Task 027E Permission Smoke

After redeploying the latest code to Zeabur and running migrations/seeds, run:

```bash
npm run smoke:027e
```

The smoke script uses:

```bash
API_BASE_URL=https://YOUR-ZEABUR-DOMAIN
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
DATABASE_URL=...
```

It creates temporary `task027e-*` fixtures through admin APIs where possible, uses the database only to create a limited test role because role admin APIs are not available yet, and verifies:

- regular organization users cannot read global audit logs.
- regular organization users cannot read global notification admin APIs.
- regular organization users only see dispatch units inside their assigned organization.
- regular organization users cannot read or operate another organization's dispatch unit.
- disabled users cannot log in.
- user API responses do not expose `password_hash` or `passwordHash`.

## Admin Frontend Foundation

The admin frontend lives in:

```text
admin/
```

It is a React + Vite + TypeScript app for the onsite service system back office. The foundation currently includes:

- login page at `/login`.
- protected dashboard at `/dashboard`.
- shared API client with bearer token injection.
- local token persistence.
- current user loading through `GET /api/v1/auth/me`.
- logout through `POST /api/v1/auth/logout` plus local token cleanup.
- admin shell layout with sidebar, header, user summary, and dashboard.
- role/permission-aware menu helper foundation.
- `AuthProvider` / `useAuth`.
- `ProtectedRoute`.
- existing lightweight browser history routing. React Router is not currently used.

Current formal admin pages:

- `/login` - login page.
- `/dashboard` - admin dashboard.
- `/users` - User Admin Page foundation.
- `/organizations` - Organization Admin Page foundation.
- `/dispatch-units` - Dispatch Unit Admin Page foundation.
- `/cases` - Case Management Page foundation, including case workflow actions and the admin case timeline/messages panel.

Current placeholder routes:

- `/dispatch-appointments`
- `/field-service`
- `/billing-settlement`
- `/customer-inquiries`
- `/ai-jobs`
- `/audit-logs`
- `/notifications`
- `/settings`

API-integrated admin pages currently include:

- users.
- organizations.
- dispatch units.
- cases.

The cases page also has a customers API client to support the create-case flow.

Root scripts:

```bash
npm run admin:dev
npm run admin:build
npm run admin:preview
npm run admin:check
```

Frontend env:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

For testing against Zeabur:

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

Do not hardcode the production API domain in frontend source files. Use `VITE_API_BASE_URL`.

Current `/api/v1/auth/me` returns enough data for the first role-based menu foundation:

- `id`
- `email`
- `displayName`
- `userType`
- `status`
- `roles`
- `permissions`

Menu helpers tolerate missing or empty `roles` / `permissions` arrays so the UI does not crash if a future user DTO is narrower.

Full Zeabur smoke checklist:

[docs/task-025z-zeabur-db-integration-smoke-test.md](/Users/roy/Documents/Codex/onsite%20service%20system/codex-ready-ai-field-service-docs/docs/task-025z-zeabur-db-integration-smoke-test.md)
