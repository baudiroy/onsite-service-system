# Task 006 API Endpoint Design

This document defines the Phase 1 REST API design for the onsite service system. It is based on the accepted data model, workflow rules, RBAC design, and backend architecture from Task 001 to Task 005.

Task 006 does not implement API routes, controllers, Express code, LINE webhooks, frontend screens, or SQL changes.

## 1. API Design Principles

### REST naming convention

- Use nouns for resources: `/cases`, `/customers`, `/attachments`, `/dispatch-units`.
- Use subresources for resource-owned data: `/admin/cases/:caseId/messages`.
- Use action endpoints only for workflow commands or provider-triggered actions, such as `/submit`, `/accept`, `/dispatch-preview`, `/signed-url`.
- Use kebab-case in URL paths.
- Use camelCase in JSON request and response bodies.

### Prefix

All application APIs use:

```text
/api/v1
```

The only exception in Phase 1 is:

```text
GET /healthz
```

### JSON format

Standard success shape:

```json
{
  "data": {},
  "requestId": "req_..."
}
```

List success shape:

```json
{
  "data": [],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 120
  },
  "requestId": "req_..."
}
```

### Error response format

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

For public inquiry APIs, error details should be generic enough to avoid leaking whether a case exists.

### requestId

Every request should have a request correlation ID:

- Accept inbound `X-Request-Id` when trusted policy allows.
- Generate a server-side request ID if missing.
- Return it in response body and response header.
- Include it in logs and audit metadata when useful.

### Authentication boundary

- `/api/v1/admin/*` requires authenticated backend user or approved service account.
- `/api/v1/auth/me` requires authentication.
- `/api/v1/public/*` does not create backend user privileges.
- Public inquiry authentication is not RBAC; it is case ownership verification.

### Permission boundary

- Admin APIs require explicit permissions through `requirePermission`.
- Permission checks use `PermissionService`.
- Service-level checks still apply for sensitive operations.
- `metadata` must never be treated as a permission source.

### Public API vs admin API

Public APIs:
- Used by website intake and customer inquiry.
- Return only customer-safe fields.
- Must not expose internal IDs unless needed and safe.
- Must not expose internal notes, raw AI data, audit logs, dispatch rules, or billing data.

Admin APIs:
- Used by authenticated backend users.
- Return admin DTOs according to permission.
- Still mask sensitive data where the user does not need full access.

### Customer visible data filtering

Customer-facing responses must use `CustomerVisibleCaseDTO`.

Do not return:
- `ai_confidence`
- raw `ai_classification`
- `audit_logs`
- internal routing rules
- permission data
- internal notes
- original manufacturer or billing data
- R2 object keys or permanent public URLs

## 2. Auth APIs

### POST `/api/v1/auth/login`

Purpose:
- Authenticate backend user and return an access token/session.

Required permission:
- None before login.

Request body:

```json
{
  "email": "admin@example.com",
  "password": "secret"
}
```

Response body:

```json
{
  "data": {
    "accessToken": "jwt_or_session_token",
    "user": {
      "id": "uuid",
      "displayName": "Admin User",
      "email": "admin@example.com",
      "userType": "admin",
      "status": "active",
      "permissions": ["cases.read", "cases.update"]
    }
  },
  "requestId": "req_..."
}
```

Error cases:
- `VALIDATION_ERROR`: missing email or password.
- `AUTH_REQUIRED`: invalid credentials, inactive user, suspended user, or unsupported auth provider.
- `INTERNAL_ERROR`: unexpected auth failure.

Audit events:
- Successful login may be audited by policy.
- Failed login must be audited when repeated, suspicious, or tied to account lockout policy.

### POST `/api/v1/auth/logout`

Purpose:
- End current backend session or invalidate token when token storage supports invalidation.

Required permission:
- Authenticated user.

Request body:

```json
{}
```

Response body:

```json
{
  "data": {
    "success": true
  },
  "requestId": "req_..."
}
```

Error cases:
- `AUTH_REQUIRED`: missing or invalid auth.

Audit events:
- Optional normal logout audit.
- Required if logout is part of incident or forced session revocation.

### GET `/api/v1/auth/me`

Purpose:
- Return current authenticated backend user and effective permissions.

Required permission:
- Authenticated user.

Request body:
- None.

Response body:

```json
{
  "data": {
    "id": "uuid",
    "displayName": "Admin User",
    "email": "admin@example.com",
    "mobile": "0912***678",
    "userType": "admin",
    "status": "active",
    "roles": ["admin"],
    "permissions": ["cases.read", "cases.update"]
  },
  "requestId": "req_..."
}
```

Error cases:
- `AUTH_REQUIRED`: missing, expired, invalid, inactive, or suspended user.

Audit events:
- Not required for normal self-profile read.

## 3. Admin Case APIs

### Admin case endpoint matrix

| Endpoint | Purpose | Required permission | Request body | Response body | Workflow rule | Audit requirement | Common errors |
|---|---|---|---|---|---|---|---|
| `POST /api/v1/admin/cases` | Create admin-entered case. | `cases.create` | Customer reference or customer data, product fields, source, optional attachments metadata references. | `AdminCaseDTO` | Usually creates `draft` or `submitted` depending on completeness. Must pass create validation. | Required: case created. | `VALIDATION_ERROR`, `PERMISSION_DENIED`, `CONFLICT`, `INTERNAL_ERROR` |
| `GET /api/v1/admin/cases` | Search/list admin case queue. | `cases.read` | Query params only. | List of `AdminCaseDTO` summaries. | No status change. | Not required for normal list. | `AUTH_REQUIRED`, `PERMISSION_DENIED`, `VALIDATION_ERROR` |
| `GET /api/v1/admin/cases/:caseId` | Read full admin case detail. | `cases.read` | None. | `AdminCaseDTO` detail. | No status change. | Optional, policy-based for sensitive reads. | `NOT_FOUND`, `PERMISSION_DENIED` |
| `PATCH /api/v1/admin/cases/:caseId` | Update editable case fields. | `cases.update` | Partial editable fields. | `AdminCaseDTO` | Must not bypass workflow transitions. Status changes should use action endpoints. | Required for important fields. | `VALIDATION_ERROR`, `NOT_FOUND`, `INVALID_STATUS_TRANSITION`, `CONFLICT` |
| `POST /api/v1/admin/cases/:caseId/submit` | Submit a draft or pending case for review. | `cases.update` | Optional note. | `AdminCaseDTO` | `draft -> submitted` or `pending_customer -> submitted`; required fields validation applies. | Required: status change. | `INVALID_STATUS_TRANSITION`, `VALIDATION_ERROR`, `NOT_FOUND` |
| `POST /api/v1/admin/cases/:caseId/review` | Mark case as under review. | `cases.review` | Optional reviewer note. | `AdminCaseDTO` | `submitted -> reviewing`. | Required: status change. | `INVALID_STATUS_TRANSITION`, `PERMISSION_DENIED`, `NOT_FOUND` |
| `POST /api/v1/admin/cases/:caseId/accept` | Accept case for service handling. | `cases.accept` | Optional accepted note. | `AdminCaseDTO` | `reviewing -> accepted`; AI cannot call final accept. | Required: status change. | `INVALID_STATUS_TRANSITION`, `PERMISSION_DENIED`, `VALIDATION_ERROR` |
| `POST /api/v1/admin/cases/:caseId/reject` | Reject case after review. | `cases.reject` | Required `reason`. | `AdminCaseDTO` | `reviewing -> rejected`; reason required. | Required: status change and reason. | `INVALID_STATUS_TRANSITION`, `VALIDATION_ERROR`, `PERMISSION_DENIED` |
| `POST /api/v1/admin/cases/:caseId/cancel` | Cancel case before completion. | `cases.cancel` | Required or recommended `reason`. | `AdminCaseDTO` | `submitted -> cancelled` or `reviewing -> cancelled`; not for completed/closed. | Required: status change and reason. | `INVALID_STATUS_TRANSITION`, `VALIDATION_ERROR`, `PERMISSION_DENIED` |
| `POST /api/v1/admin/cases/:caseId/dispatch-preview` | Run rule/AI-assisted dispatch preview. | `cases.update` or future dispatch preview permission. | Optional `includeAiSuggestion`. | Dispatch preview result plus `AdminCaseDTO` summary. | Rule engine first; AI advisory only. | Required if suggestion is saved. | `PROVIDER_ERROR`, `NOT_FOUND`, `PERMISSION_DENIED` |
| `PATCH /api/v1/admin/cases/:caseId/dispatch-unit` | Manually set final preview dispatch unit. | `dispatch_units.manage` or explicit future `cases.dispatch.update`. | `dispatchUnitId`, `reason`. | `AdminCaseDTO` | Manual override allowed; `ai_suggested_dispatch_unit_id` remains advisory. | Required, especially AI override. | `VALIDATION_ERROR`, `NOT_FOUND`, `PERMISSION_DENIED`, `CONFLICT` |

### Admin case list query params

Supported filters:

```text
status
priority
warrantyStatus
caseType
source
serviceRegion
dispatchUnitId
customerId
caseNo
q
createdFrom
createdTo
submittedFrom
submittedTo
scheduledFrom
scheduledTo
limit
offset
sort
```

Recommended sorts:
- `createdAtDesc`
- `submittedAtDesc`
- `prioritySubmittedAt`
- `lastCustomerMessageAtDesc`
- `lastInternalActivityAtDesc`
- `scheduledAtAsc`

### Admin create case request body

```json
{
  "customer": {
    "customerId": "uuid",
    "customerName": "王小明",
    "mobile": "0912345678",
    "tel": "02-12345678",
    "city": "Taipei",
    "address": "..."
  },
  "case": {
    "source": "admin",
    "brand": "Brand",
    "caseType": "repair",
    "productType": "TV",
    "modelNo": "ABC-123",
    "serialNo": "SN123",
    "invoiceDate": "2026-05-01",
    "problemDescription": "Cannot power on",
    "preferredVisitTime": "2026-05-16T06:00:00.000Z",
    "priority": "normal",
    "serviceRegion": "north"
  }
}
```

### Admin patch case request body

Editable examples:

```json
{
  "priority": "high",
  "warrantyStatus": "pending_review",
  "brand": "Brand",
  "caseType": "repair",
  "productType": "TV",
  "modelNo": "ABC-123",
  "serialNo": "SN123",
  "invoiceDate": "2026-05-01",
  "problemDescription": "Updated description",
  "preferredVisitTime": "2026-05-16T06:00:00.000Z",
  "serviceRegion": "north"
}
```

Not allowed here:
- Direct arbitrary `status` updates.
- Raw audit fields.
- Full dispatch history.
- Billing, field service, quote, or appointment history.

## 4. Customer APIs

### POST `/api/v1/public/cases`

Purpose:
- Create a website repair request case.

Required permission:
- Public intake authorization only. No backend RBAC permission.

Request body:

```json
{
  "customer": {
    "customerName": "王小明",
    "mobile": "0912345678",
    "tel": "02-12345678",
    "city": "Taipei",
    "address": "..."
  },
  "case": {
    "brand": "Brand",
    "caseType": "repair",
    "productType": "TV",
    "modelNo": "ABC-123",
    "serialNo": "SN123",
    "invoiceDate": "2026-05-01",
    "problemDescription": "Cannot power on",
    "preferredVisitTime": "2026-05-16T06:00:00.000Z"
  }
}
```

Response body:

```json
{
  "data": {
    "caseNo": "TW-20260514-000001",
    "customerVisibleStatus": "案件已送出",
    "createdAt": "2026-05-14T08:00:00.000Z",
    "missingFields": []
  },
  "requestId": "req_..."
}
```

Workflow rule:
- Create `customers` as needed.
- Create `cases.customer_snapshot`.
- Create case as `submitted` when required fields pass validation.
- Create case as `pending_customer` or `draft` when information is incomplete.

Audit requirement:
- Required: case created.
- Required when status moves directly to `submitted`.

Common errors:
- `VALIDATION_ERROR`
- `CONFLICT`
- `INTERNAL_ERROR`

### POST `/api/v1/public/case-inquiry`

Purpose:
- Let website customers query their own case using `case_no + mobile`.

Required permission:
- Public ownership verification.

Request body:

```json
{
  "caseNo": "TW-20260514-000001",
  "mobile": "0912345678"
}
```

Response body:

```json
{
  "data": {
    "verified": true,
    "case": {
      "caseNo": "TW-20260514-000001",
      "customerVisibleStatus": "案件審核中",
      "createdAt": "2026-05-14T08:00:00.000Z",
      "brand": "Brand",
      "productType": "TV",
      "modelNo": "ABC-123",
      "faultSummary": "Cannot power on",
      "preferredVisitTime": "2026-05-16T06:00:00.000Z",
      "scheduledAt": null,
      "supplementHint": null
    }
  },
  "requestId": "req_..."
}
```

Failed verification response:

```json
{
  "data": {
    "verified": false,
    "message": "Unable to verify the case with the provided information."
  },
  "requestId": "req_..."
}
```

Rules:
- Do not reveal whether `caseNo` exists.
- Do not reveal whether mobile matched.
- Return only `CustomerVisibleCaseDTO`.

Audit/message:
- `case_messages` may record successful inquiry when verified.
- `audit_logs` should record suspicious, repeated, or excessive failures.

### POST `/api/v1/public/line-case-inquiry`

Purpose:
- Let LINE customers query their own case using LINE user ID plus case number.

Required permission:
- Public LINE ownership verification. The LINE user ID should come from trusted LINE context in real implementation, not arbitrary client input.

Request body:

```json
{
  "caseNo": "TW-20260514-000001",
  "lineUserId": "Uxxxxxxxx"
}
```

Response body:
- Same success and failed verification shape as `/api/v1/public/case-inquiry`.

Rules:
- LINE user ID is auxiliary verification and not the only permanent identity basis.
- Do not reveal whether case number exists or LINE user ID matched.
- Return only `CustomerVisibleCaseDTO`.

Audit/message:
- Record verified inquiry in `case_messages` where useful.
- Record suspicious verification failures in `audit_logs`.

## 5. Attachment APIs

### POST `/api/v1/admin/cases/:caseId/attachments`

Purpose:
- Upload an admin-side attachment for a case and store R2 metadata.

Required permission:
- `attachments.create` or `cases.update` plus attachment policy.

Request body:
- Multipart form-data or pre-negotiated upload payload.

Fields:

```json
{
  "attachmentType": "fault_photo",
  "sourceChannel": "admin",
  "file": "binary"
}
```

Response body:

```json
{
  "data": {
    "id": "uuid",
    "caseId": "uuid",
    "attachmentType": "fault_photo",
    "storageProvider": "cloudflare_r2",
    "originalFilename": "photo.jpg",
    "contentType": "image/jpeg",
    "byteSize": 123456,
    "ocrStatus": "not_started",
    "createdAt": "2026-05-14T08:00:00.000Z"
  },
  "requestId": "req_..."
}
```

R2 upload flow:
- Validate actor permission and case access.
- Validate file size and MIME type.
- Upload to R2.
- Store `bucket`, `object_key`, metadata, and checksum when available.
- Do not store binary in PostgreSQL.

OCR trigger:
- If `attachmentType` is `serial_photo` or `invoice_photo`, set OCR status to `pending` or allow admin-triggered OCR endpoint.

Audit events:
- Required: attachment added.

Common errors:
- `VALIDATION_ERROR`
- `PERMISSION_DENIED`
- `NOT_FOUND`
- `STORAGE_ERROR`

### GET `/api/v1/admin/cases/:caseId/attachments`

Purpose:
- List case attachments for admin review.

Required permission:
- `attachments.read`.

Request body:
- None.

Response body:
- List of `AttachmentDTO`.

Rules:
- Do not return permanent public URLs.
- Include signed URL only if explicitly requested through signed URL endpoint.

Audit events:
- Optional for normal list.
- Required by policy for sensitive attachment categories in future.

### POST `/api/v1/admin/attachments/:attachmentId/signed-url`

Purpose:
- Generate short-lived signed URL for authorized attachment access.

Required permission:
- `attachments.read`.

Request body:

```json
{
  "purpose": "admin_preview",
  "ttlSeconds": 300
}
```

Response body:

```json
{
  "data": {
    "attachmentId": "uuid",
    "signedUrl": "https://...",
    "expiresAt": "2026-05-14T08:05:00.000Z"
  },
  "requestId": "req_..."
}
```

Rules:
- Backend checks permission before signing.
- Signed URL must be short-lived.
- Do not expose object key as access authority.
- Update signed URL lifecycle timestamps.

Audit events:
- Required when policy marks access as sensitive.
- Recommended for signature, invoice, and future billing-only attachments.

### DELETE `/api/v1/admin/attachments/:attachmentId`

Purpose:
- Soft-delete attachment metadata and optionally schedule object deletion according to retention policy.

Required permission:
- `attachments.delete` or admin-level attachment policy.

Request body:

```json
{
  "reason": "Wrong file uploaded"
}
```

Response body:

```json
{
  "data": {
    "success": true
  },
  "requestId": "req_..."
}
```

Rules:
- Phase 1 should prefer soft delete.
- Do not hard-delete R2 object unless retention policy allows.

Audit events:
- Required: attachment deleted or soft-deleted.

### Public/LINE upload future note

Public website and LINE attachment upload APIs can be added later. They must:
- Link uploads to a verified case/intake session.
- Avoid exposing R2 credentials.
- Preserve the same `AttachmentService` and R2 boundary.
- Support OCR trigger for serial and invoice photos.

## 6. Message APIs

### GET `/api/v1/admin/cases/:caseId/messages`

Purpose:
- Read linear case conversation and system event history.

Required permission:
- `cases.read`.

Request body:
- None.

Query params:

```text
limit
offset
channel
senderType
messageType
```

Response body:
- List of `MessageDTO`.

Rules:
- Attachment messages may include attachment metadata reference.
- Do not include signed URLs automatically.
- Raw provider payload should be minimized or omitted unless debug permission exists in future.

Audit events:
- Optional for normal reads.

### POST `/api/v1/admin/cases/:caseId/messages`

Purpose:
- Add admin message or system event to a case.

Required permission:
- `cases.update`.

Request body:

```json
{
  "senderType": "admin",
  "channel": "admin",
  "messageType": "text",
  "bodyText": "Customer called and confirmed address.",
  "attachmentId": null
}
```

Response body:
- `MessageDTO`.

Rules:
- Admin messages use `sender_type = 'admin'`.
- System event messages use `sender_type = 'system'` and `message_type = 'system_event'`.
- Customer messages through LINE/website are future webhook/public flow concerns.
- If `attachmentId` is present, attachment must belong to the same case.
- Admin/system/AI/engineer messages may update `cases.last_internal_activity_at`.
- Customer-originated messages should update `cases.last_customer_message_at`.

Audit events:
- Not required for every ordinary message.
- Required if message records important workflow reason, rejection reason, cancellation reason, or sensitive manual override.

## 7. Customer APIs For Admin

### GET `/api/v1/admin/customers/:customerId`

Purpose:
- Read customer profile for admin handling.

Required permission:
- `customers.read`.

Response body:
- `CustomerDTO`.

Rules:
- PII masking can be role-dependent.
- Do not include full case history unless requested through case endpoint.

Audit events:
- Optional for normal read.
- Required for sensitive access policy if introduced.

### PATCH `/api/v1/admin/customers/:customerId`

Purpose:
- Update customer master data.

Required permission:
- `customers.update`.

Request body:

```json
{
  "customerName": "王小明",
  "mobile": "0912345678",
  "tel": "02-12345678",
  "city": "Taipei",
  "address": "..."
}
```

Response body:
- `CustomerDTO`.

Rules:
- Does not rewrite historical `cases.customer_snapshot`.
- Does not implement CRM-grade deduplication.

Audit events:
- Required: customer data changed, with PII minimized/masked in before/after.

### GET `/api/v1/admin/customers/:customerId/cases`

Purpose:
- List cases for a customer.

Required permission:
- `customers.read` and `cases.read`.

Response body:
- List of `AdminCaseDTO` summaries.

Rules:
- No CRM analytics in Phase 1.
- No duplicate merge flow in Phase 1.

Audit events:
- Optional for normal read.

## 8. Dispatch Unit APIs

### GET `/api/v1/admin/dispatch-units`

Purpose:
- List dispatch units for admin routing preview and management.

Required permission:
- `dispatch_units.manage` or future `dispatch_units.read`.

Query params:

```text
enabled
serviceRegion
city
productType
limit
offset
```

Response body:
- List of dispatch unit DTOs.

Audit events:
- Not required for normal list.

### POST `/api/v1/admin/dispatch-units`

Purpose:
- Create dispatch unit master data.

Required permission:
- `dispatch_units.manage`.

Request body:

```json
{
  "name": "North Service Team",
  "code": "NORTH-001",
  "serviceRegion": "north",
  "city": "Taipei",
  "productTypes": ["TV", "Appliance"],
  "enabled": true,
  "priority": 100,
  "routingRules": {}
}
```

Response body:
- Dispatch unit DTO.

Audit events:
- Required: dispatch unit created.

### PATCH `/api/v1/admin/dispatch-units/:dispatchUnitId`

Purpose:
- Update dispatch unit master data or disable it.

Required permission:
- `dispatch_units.manage`.

Request body:
- Partial dispatch unit fields.

Rules:
- Prefer `enabled = false` for operational disable.
- `routingRules` may store first-phase hints but must not become a workflow engine.

Audit events:
- Required: dispatch unit changed.

### DELETE `/api/v1/admin/dispatch-units/:dispatchUnitId`

Purpose:
- Soft-delete or disable dispatch unit.

Required permission:
- `dispatch_units.manage`.

Request body:

```json
{
  "reason": "No longer active"
}
```

Rules:
- Prefer soft delete or disable.
- Do not erase historical references from cases.

Audit events:
- Required: dispatch unit deleted/disabled.

## 9. RBAC Admin APIs

### RBAC endpoint matrix

| Endpoint | Purpose | Required permission | Request body | Response body | Audit requirement | Notes |
|---|---|---|---|---|---|---|
| `GET /api/v1/admin/users` | List backend users. | `users.manage` | Query params only. | List of `UserDTO`. | Optional normal read. | Never return `password_hash`. |
| `POST /api/v1/admin/users` | Create backend user. | `users.manage` | User profile and auth setup. | `UserDTO`. | Required. | Store password hash only; never plaintext. |
| `PATCH /api/v1/admin/users/:userId` | Update user profile/status. | `users.manage` | Partial user fields. | `UserDTO`. | Required for status/auth changes. | Disable with `status`, preserve auditability. |
| `GET /api/v1/admin/roles` | List roles. | `roles.manage` or future `roles.read`. | None. | Role DTO list. | Optional. | Flat RBAC in Phase 1. |
| `POST /api/v1/admin/users/:userId/roles` | Assign role to user. | `roles.manage` or `users.manage`. | `roleId`. | User role assignment DTO. | Required. | Avoid duplicate active role. |
| `DELETE /api/v1/admin/users/:userId/roles/:roleId` | Revoke role from user. | `roles.manage` or `users.manage`. | Optional reason. | Success response. | Required. | Set `revoked_at`; do not hard-delete as normal behavior. |
| `GET /api/v1/admin/permissions` | List permissions. | `permissions.manage` or future `permissions.read`. | None. | Permission DTO list. | Optional. | Used by admin RBAC UI. |
| `POST /api/v1/admin/roles/:roleId/permissions` | Grant permission to role. | `permissions.manage`. | `permissionId`. | Role permission grant DTO. | Required. | Avoid duplicate active permission. |
| `DELETE /api/v1/admin/roles/:roleId/permissions/:permissionId` | Revoke permission from role. | `permissions.manage`. | Optional reason. | Success response. | Required. | Set `revoked_at`; preserve history. |

### Create user request body

```json
{
  "displayName": "Customer Service A",
  "email": "cs@example.com",
  "mobile": "0912345678",
  "userType": "customer_service",
  "status": "invited",
  "authProvider": "password",
  "password": "temporary-secret"
}
```

Rules:
- API may accept a plaintext password only transiently over TLS to hash it immediately.
- Never store or return plaintext password.
- Never return `password_hash`.
- Future invitation flow is preferred over admin setting a password manually.

## 10. Audit APIs

### GET `/api/v1/admin/audit-logs`

Purpose:
- Search audit logs for authorized audit/admin users.

Required permission:
- `audit_logs.read`.

Query params:

```text
entityType
entityId
action
actorType
actorId
createdFrom
createdTo
limit
offset
```

Response body:
- List of `AuditLogDTO`.

Rules:
- Return masked/minimized data according to audit policy.
- Preserve append-only behavior.
- No update audit log API.
- No delete audit log API.
- No public audit log API.

Common errors:
- `AUTH_REQUIRED`
- `PERMISSION_DENIED`
- `VALIDATION_ERROR`

## 11. AI / OCR APIs

### AI/OCR endpoint matrix

| Endpoint | Purpose | Required permission | Request body | Response body | Rules | Audit requirement | Common errors |
|---|---|---|---|---|---|---|---|
| `POST /api/v1/admin/cases/:caseId/ai/summary` | Generate or refresh `ai_summary`. | `cases.update` | Optional instruction/context flags. | AI summary result plus case summary. | Advisory only. | Required if saved to case. | `PROVIDER_ERROR`, `NOT_FOUND`, `PERMISSION_DENIED` |
| `POST /api/v1/admin/cases/:caseId/ai/classification` | Generate `ai_classification`. | `cases.update` | Optional classification mode. | Classification result. | Raw classification is not customer-visible. | Required if saved. | `PROVIDER_ERROR`, `VALIDATION_ERROR` |
| `POST /api/v1/admin/cases/:caseId/ai/dispatch-suggestion` | Generate AI dispatch unit suggestion. | `cases.update` | Optional candidate constraints. | Suggested dispatch unit and confidence/explanation. | Does not set final `dispatch_unit_id` unless explicit policy says save suggestion only. | Required when saved to `ai_suggested_dispatch_unit_id`. | `PROVIDER_ERROR`, `NOT_FOUND` |
| `POST /api/v1/admin/attachments/:attachmentId/ocr` | Run OCR/extraction for serial or invoice photo. | `attachments.read` and `cases.update` when writing result to case. | Optional extraction target. | OCR result DTO. | Manual review when low confidence. | Required when OCR result is saved or status changes. | `PROVIDER_ERROR`, `STORAGE_ERROR`, `VALIDATION_ERROR` |

AI rules:
- AI is advisory only.
- AI cannot accept cases.
- AI cannot reject cases.
- AI cannot cancel or delete cases.
- AI cannot override manual dispatch decisions.
- AI cannot modify users, roles, or permissions.
- Provider errors must not expose prompts, secrets, or raw provider payloads.

OCR rules:
- Only `serial_photo` and `invoice_photo` should trigger OCR in Phase 1.
- `case_attachments.ocr_status` tracks lifecycle.
- `ai_extraction_result` stores extraction output.
- `serial_no` or `invoice_date` updates require validation and may require manual review.

## 12. Health Check

### GET `/healthz`

Purpose:
- Lightweight runtime health check for Zeabur or load balancer.

Required permission:
- None.

Request body:
- None.

Response body:

```json
{
  "ok": true,
  "service": "onsite-service-api",
  "timestamp": "2026-05-14T08:00:00.000Z"
}
```

Rules:
- Do not include secrets.
- Do not include database URL.
- Do not include AI provider keys.
- Keep it fast.

Future note:
- A deeper authenticated readiness endpoint can check database/R2/provider health later.

## 13. Response DTO Principles

### AdminCaseDTO

Used by admin APIs.

May include:
- `id`
- `caseNo`
- `customerId`
- `customerSummary`
- `status`
- `priority`
- `warrantyStatus`
- `appointmentStatus`
- `completionStatus`
- `source`
- `brand`
- `caseType`
- `productType`
- `modelNo`
- `serialNo`
- `invoiceDate`
- `problemDescription`
- `preferredVisitTime`
- `serviceRegion`
- `aiSummary`
- `aiClassification` when permission/policy allows
- `aiConfidence`
- `aiSuggestedDispatchUnitId`
- `aiOcrStatus`
- `dispatchUnitId`
- `dispatchAssignmentSource`
- lifecycle timestamps
- queue timestamps

Should not include:
- Raw audit logs inline.
- Attachment signed URLs inline.
- Hidden billing or field service data.

### CustomerVisibleCaseDTO

Used by public inquiry and customer-facing responses.

Allowed fields:
- `caseNo`
- `customerVisibleStatus`
- `createdAt`
- `brand`
- `productType`
- `modelNo`
- `faultSummary`
- `preferredVisitTime`
- `scheduledAt`
- `engineerVisitStatus` future summary only
- `supplementHint`

Must not include:
- internal `status` if the visible mapping differs
- internal notes
- raw AI data
- `aiConfidence`
- raw `aiClassification`
- audit logs
- dispatch rules
- permissions
- billing/manufacturer/settlement data

### AttachmentDTO

May include:
- `id`
- `caseId`
- `attachmentType`
- `storageProvider`
- `originalFilename`
- `contentType`
- `byteSize`
- `ocrStatus`
- `aiExtractionConfidence`
- `createdAt`
- `deletedAt` for admin views when needed

Must not include:
- Permanent public URL.
- R2 secret data.
- Signed URL unless the signed URL endpoint is called.
- File binary.

### MessageDTO

May include:
- `id`
- `caseId`
- `attachmentId`
- `senderType`
- `senderDisplayName`
- `channel`
- `messageType`
- `bodyText`
- `createdAt`

Should minimize:
- `rawPayload`
- provider-specific message metadata

### CustomerDTO

May include:
- `id`
- `customerName`
- `mobile` masked or full depending on permission
- `tel` masked or full depending on permission
- `lineUserId` masked or omitted depending on permission
- `city`
- `address` masked or full depending on permission
- `source`
- timestamps

Should not include:
- Case content inline unless requested through customer cases endpoint.
- CRM-grade duplicate analysis in Phase 1.

### AuditLogDTO

May include:
- `id`
- `actorType`
- `actorId`
- `actorDisplayName`
- `action`
- `entityType`
- `entityId`
- masked `beforeData`
- masked `afterData`
- `ipAddress`
- `userAgent`
- `createdAt`

Must not include:
- Unmasked secrets.
- Full sensitive customer objects.
- File binary.
- Signed URLs.
- Full AI prompts or raw provider responses.

### UserDTO

May include:
- `id`
- `displayName`
- `email`
- `mobile`
- `userType`
- `status`
- `authProvider`
- `lastLoginAt`
- `roles`
- timestamps

Must not include:
- `password_hash`
- plaintext password
- password reset token
- session secrets

## 14. Error Codes

| Code | Meaning | Typical HTTP status |
|---|---|---:|
| `VALIDATION_ERROR` | Request body, params, query, or workflow input is invalid. | 400 |
| `AUTH_REQUIRED` | Authentication is missing, invalid, expired, or user is inactive. | 401 |
| `PERMISSION_DENIED` | Actor lacks required permission. | 403 |
| `NOT_FOUND` | Resource not found for authorized admin context. | 404 |
| `CONFLICT` | Unique constraint, duplicate action, stale state, or conflicting data. | 409 |
| `INVALID_STATUS_TRANSITION` | Workflow transition is not allowed from current status. | 409 |
| `INQUIRY_VERIFICATION_FAILED` | Public inquiry could not verify ownership. Response must not reveal existence. | 200 or 400 by policy |
| `PROVIDER_ERROR` | AI/OCR/LINE future provider failed or timed out. | 502 or 503 |
| `STORAGE_ERROR` | R2 upload, signing, or storage operation failed. | 502 or 503 |
| `RATE_LIMITED` | Too many requests or future throttling triggered. | 429 |
| `INTERNAL_ERROR` | Unexpected backend error. | 500 |

Guidance:
- Public inquiry may return HTTP 200 with `verified: false` to avoid existence leaks.
- Admin APIs can use HTTP 404 when the caller is authorized and resource absence is safe to disclose.
- Error messages must not include secrets, SQL text, provider prompts, or signed URLs.

## 15. Future Notes

Record these as future endpoint areas only. Do not implement them in Phase 1 API design.

### LINE webhook APIs

Future LINE webhook endpoints should validate signature, replay protection, and idempotency before entering service layer.

### Engineer mobile APIs

Future engineer mobile APIs should reuse the same backend service layer and workflow rules. Do not build a second workflow engine.

### Appointment APIs

Future appointment endpoints should manage full appointment history in `appointments`. `cases.scheduled_at` and `appointment_status` remain summaries.

### Field service report APIs

Future field service endpoints should manage on-site reports in `field_service_reports`, not in `cases`.

### Service parts APIs

Future service parts endpoints should manage parts usage separately, likely linked to field service reports and billing.

### Quote APIs

Future quote endpoints should use `quotes` and `quote_items`, not case metadata.

### Billing APIs

Future billing and settlement endpoints should use `billing_records`, `settlements`, and related reconciliation tables.

### Notification APIs

Future notification endpoints should use a `NotificationService`, notification templates, notification logs, and retry policy. Do not put notification delivery inside `WorkflowService`.

### Public inquiry token APIs

Future public tracking links such as `/track/{token}` must use short-lived or revocable tokens, avoid exposing `case_id`, return only customer-visible fields, and record access in audit or inquiry logs.

### Idempotency support

Future command endpoints may need an `Idempotency-Key` header to protect against duplicate requests.

Likely candidates:
- submit
- accept
- reject
- cancel
- dispatch-preview
- OCR
- AI generation

The API should eventually define key scope, retention time, replay behavior, and conflict response rules.

### Optimistic locking

Future PATCH and workflow endpoints may need optimistic concurrency control to prevent multiple admins from overwriting each other.

Possible approaches:
- Add a version field.
- Require `updated_at` precondition checks.
- Support `If-Match` style request headers.

Phase 1 can rely on current validation and transaction behavior, but endpoint design should not block optimistic locking later.

### Pagination standardization

Future API standards should choose one pagination style consistently:
- cursor pagination
- offset pagination

Phase 1 can keep offset pagination for simplicity.

### API field-level authorization

Future DTO shaping may need:
- field masking
- field-level RBAC
- dynamic DTO shaping

Examples:
- Customer service may see only operational customer fields.
- Finance may see future billing fields.
- Auditor may see audit fields but still receive masked PII.

### Attachment download audit policy

Future signed URL access may need stronger audit policy:
- download audit
- sensitive attachment tracking
- invoice access tracking
- signature access tracking

Phase 1 can audit signed URL issuance based on policy, but mature access analytics can wait.

### Background processing API policy

Future OCR and AI endpoints may need asynchronous job behavior:
- async job response
- polling endpoint
- webhook callback
- job status endpoint

Phase 1 may remain synchronous or use simple async handling without a full job API.

### Notification API separation

Future notification APIs should remain separate from workflow endpoints. Workflow endpoints may create notification intent, but notification delivery, retry, templates, and logs should belong to notification-specific APIs and services.

### Public inquiry throttling

Future public inquiry APIs should add:
- IP throttling
- mobile throttling
- token bucket strategy
- abuse detection

This is important because inquiry failure responses intentionally avoid revealing whether a case exists.

### Multi-channel customer identity

Future customer verification may support:
- LINE
- SMS OTP
- email verification
- temporary inquiry token

These identity mechanisms should strengthen ownership verification without exposing internal case IDs or broad customer records.

### Engineer mobile DTO

Future engineer app APIs should use dedicated DTOs:
- `EngineerCaseDTO`
- `EngineerServiceReportDTO`

Do not reuse `AdminCaseDTO` directly for engineer mobile screens, because engineer workflows need narrower fields and case-type-specific service form data.

### Event emission policy

Future workflow transitions may emit:
- domain events
- notification events
- analytics events

Phase 1 should not introduce an event bus, but endpoint/service boundaries should leave room for event emission after successful transactions.

### API deprecation policy

Future versioning should define:
- deprecation headers
- migration window
- compatibility policy

This should align with `/api/v1`, future `/api/v2`, and client rollout expectations.

### Request size limits

Future upload APIs should standardize limits for:
- file size
- MIME type
- attachment count
- image dimensions

These limits should be enforced before R2 upload and should be documented per endpoint.

### AI response sanitization

Future AI endpoints should add:
- hallucination filtering
- unsafe output filtering
- PII sanitization

AI output should remain advisory and should be validated before being saved to case fields or shown to admins/customers.

### Case search indexing strategy

Future `GET /api/v1/admin/cases` may need stronger search:
- PostgreSQL full-text search
- trigram search
- AI semantic search

Phase 1 should keep basic query filtering and the existing PostgreSQL search direction.
