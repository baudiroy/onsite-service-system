# Task 005 Backend Architecture Design

This document defines the Phase 1 Node.js backend architecture for the onsite service system. It assumes the current data model, RBAC model, and case workflow from Task 001 to Task 004 are already accepted.

Task 005 does not implement APIs, LINE webhook handlers, frontend screens, or SQL changes. It only defines backend boundaries, directory planning, and service responsibilities.

## 1. Backend Layering

### routes

Purpose:
- Define URL paths, HTTP methods, route-level middleware, and controller binding.
- Keep route files declarative and easy to scan.

Responsibilities:
- Attach authentication middleware.
- Attach permission middleware.
- Attach request validators.
- Call the correct controller method.

Should not contain:
- Business rules.
- SQL queries.
- OpenAI or R2 calls.
- Workflow transition logic.

### controllers

Purpose:
- Convert HTTP requests into service calls and convert service results into HTTP responses.

Responsibilities:
- Read `req.params`, `req.query`, `req.body`, and authenticated actor context.
- Call application services.
- Return response DTOs.
- Pass errors to centralized error handling.

Should not contain:
- Case workflow rules.
- RBAC lookup logic.
- Repository calls.
- AI provider calls.
- R2 signed URL generation.

### services

Purpose:
- Implement application use cases and coordinate repositories, workflows, integrations, and audit logging.

Responsibilities:
- Case creation, review, update, and inquiry use cases.
- Customer profile management.
- Attachment upload metadata persistence.
- Message recording.
- Auth and permission orchestration.
- AI/OCR orchestration.
- R2 storage orchestration through storage adapters.

Should not contain:
- Raw HTTP concerns.
- SQL embedded directly in controller style.
- Vendor-specific AI implementation details.

### repositories

Purpose:
- Encapsulate database operations only.

Responsibilities:
- Run SQL queries.
- Map database rows to plain domain/data objects.
- Provide transaction-aware methods when needed.

Should not contain:
- Workflow rules.
- Permission decisions.
- Audit policy decisions.
- AI/R2/LINE provider calls.
- Customer-visible filtering rules.

### domain/workflows

Purpose:
- Hold business rules that are not tied to HTTP or database mechanics.

Responsibilities:
- Case status transition guards.
- Required fields validation before submit/review/accept.
- Customer-visible status mapping.
- AI decision boundaries.
- Dispatch preview flow rules.
- Installation vs repair shared workflow rules with case-type-specific engineer UI guidance.

Should not contain:
- Express request/response logic.
- Raw SQL.
- Provider SDK calls.

### integrations

Purpose:
- Isolate external systems behind small adapter interfaces.

Phase 1 integrations:
- OpenAI through an AI provider adapter.
- Cloudflare R2 through a storage provider adapter.

Reserved future integrations:
- LINE Messaging API.
- Email/SMS/WhatsApp providers.
- Antivirus or malware scanning providers.
- Dedicated OCR providers.

### middlewares

Purpose:
- Reusable HTTP request pipeline concerns.

Examples:
- `requireAuth`
- `requirePermission`
- `requestId`
- `errorHandler`
- `notFoundHandler`
- `bodySizeLimit`
- `uploadParser`
- `publicInquiryRateLimit` future note

### validators

Purpose:
- Validate request shape before controller/service execution.

Responsibilities:
- Required fields.
- Type checks.
- Enum checks aligned with database constraints.
- Public inquiry input validation.

Validators should not replace workflow validation. For example, validators can check that `case_type` is a valid enum, but `WorkflowService` decides whether a case is complete enough to enter `submitted`.

### utils

Purpose:
- Shared small helpers with no business ownership.

Examples:
- PII masking helpers.
- Mobile normalization helpers for lookup only.
- Object key generation helpers.
- Safe filename helpers.
- Error classes.
- Date/time helpers.
- Case number generation helper, if application-side generation is selected.

### config

Purpose:
- Load and validate environment variables once at application startup.

Responsibilities:
- Fail fast if required config is missing.
- Parse numeric/boolean config.
- Expose typed config objects to the app.

## 2. Suggested Directory Structure

```text
src/
  app.js
  server.js

  config/
    env.js
    security.js
    storage.js
    ai.js

  db/
    pool.js
    transaction.js
    migrations.js

  routes/
    index.js
    cases.routes.js
    customers.routes.js
    attachments.routes.js
    messages.routes.js
    inquiry.routes.js
    admin.routes.js
    auth.routes.js

  controllers/
    CaseController.js
    CustomerController.js
    AttachmentController.js
    MessageController.js
    CustomerInquiryController.js
    AuthController.js
    AdminController.js

  services/
    CaseService.js
    CustomerService.js
    AttachmentService.js
    MessageService.js
    AuditService.js
    AuthService.js
    PermissionService.js
    DispatchUnitService.js
    AiService.js
    OcrService.js
    CustomerInquiryService.js
    WorkflowService.js

  repositories/
    CaseRepository.js
    CustomerRepository.js
    AttachmentRepository.js
    MessageRepository.js
    AuditLogRepository.js
    UserRepository.js
    RoleRepository.js
    PermissionRepository.js
    DispatchUnitRepository.js

  workflows/
    caseStatusTransitions.js
    caseRequiredFields.js
    customerVisibleStatus.js
    dispatchPreview.js
    aiDecisionPolicy.js

  integrations/
    ai/
      AiProvider.js
      OpenAiProvider.js
    storage/
      StorageProvider.js
      R2StorageProvider.js
    line/
      LineClient.js
      README.md

  middlewares/
    requireAuth.js
    requirePermission.js
    requestId.js
    errorHandler.js
    notFoundHandler.js
    rateLimit.js

  validators/
    caseValidators.js
    customerValidators.js
    attachmentValidators.js
    inquiryValidators.js
    authValidators.js

  utils/
    errors.js
    maskPii.js
    normalizeMobile.js
    objectKeys.js
    safeFilename.js
    timestamps.js
```

Notes:
- `integrations/line` is reserved for future LINE client code. Task 005 does not implement LINE webhook handling.
- `db/migrations.js` may exist later for deployment tooling, but current migrations remain under the project migration folder.
- Tests can later mirror this structure under `tests/` or `src/**/__tests__/`.

## 3. Core Service Design

### CaseService

Purpose:
- Own case use cases at the application level.

Responsibilities:
- Create cases from LINE, website, admin, API, or migration sources.
- Update case core fields without bypassing workflow rules.
- Coordinate `WorkflowService` for status transitions.
- Maintain case summary timestamps such as `submitted_at`, `reviewed_at`, `accepted_at`, `scheduled_at`, `completed_at`, `last_customer_message_at`, and `last_internal_activity_at`.
- Coordinate `CustomerService` for `customer_snapshot` creation.
- Coordinate `AuditService` for important changes.

Should not do:
- Direct OpenAI calls.
- Direct R2 calls.
- Permission lookup without `PermissionService` or middleware.

### CustomerService

Purpose:
- Manage customer master data and case-time snapshot needs.

Responsibilities:
- Create or update Phase 1 customer profiles.
- Provide minimal customer snapshot data for cases: name, mobile, tel, city, address.
- Support lookup by mobile or LINE user ID for inquiry flows.
- Audit sensitive customer data changes.

Should not do:
- Store case content.
- Store attachments.
- Implement CRM-level deduplication in Phase 1.

### AttachmentService

Purpose:
- Manage attachment metadata and storage access boundaries.

Responsibilities:
- Validate attachment metadata and attachment type.
- Coordinate R2 upload through `StorageProvider`.
- Persist `case_attachments` metadata.
- Issue short-lived signed URLs after permission checks.
- Update OCR status and AI extraction result through controlled methods.
- Audit attachment create/delete/sensitive access events when needed.

Should not do:
- Store file binary in PostgreSQL.
- Expose permanent public URLs as the only access mechanism.
- Decide final case acceptance from OCR result.

### MessageService

Purpose:
- Record case conversation and system event history.

Responsibilities:
- Create `case_messages` records for customer, AI, admin, system, and engineer messages.
- Link message attachments through `case_attachments`.
- Update case summary timestamps:
  - customer messages update `last_customer_message_at`.
  - AI/admin/system/engineer operational messages may update `last_internal_activity_at`.
- Keep binary payloads out of messages.

Should not do:
- Replace audit logs.
- Store large files in `raw_payload`.
- Become an AI runtime log store in the long term.

### AuditService

Purpose:
- Centralize audit log creation and data minimization.

Responsibilities:
- Write `audit_logs` rows for required events.
- Mask or minimize PII before persistence.
- Add actor, IP address, user agent, action, entity, before/after data, and metadata.
- Keep audit append-only at the application layer.

Should not do:
- Store complete sensitive payloads when a minimized diff is enough.
- Implement business transitions itself.

### AuthService

Purpose:
- Authenticate backend users and system actors.

Responsibilities:
- Verify password or external auth provider result.
- Issue and validate JWTs or session tokens.
- Enforce disabled/suspended user behavior.
- Update `last_login_at` on successful login.
- Record failed login and account disable events through `AuditService`.

Should not do:
- Store plaintext passwords.
- Put all permissions directly on `users`.

### PermissionService

Purpose:
- Resolve RBAC permissions from users, roles, permissions, and join tables.

Responsibilities:
- Check whether an actor has a permission key such as `cases.read` or `users.manage`.
- Support middleware-level permission checks.
- Support service-level checks for sensitive internal use cases.
- Respect disabled roles, disabled permissions, revoked user roles, and revoked role permissions.

Should not do:
- Use `metadata` as an authoritative permission source.
- Implement scoped permissions in Phase 1 unless future schema adds scopes.

### DispatchUnitService

Purpose:
- Manage dispatch unit master data and dispatch preview inputs.

Responsibilities:
- Read enabled dispatch units by region, city, product type, and priority.
- Manage dispatch unit administrative updates.
- Provide candidates to `WorkflowService` or dispatch preview rules.
- Audit dispatch unit changes.

Should not do:
- Store dispatch history.
- Become a full routing workflow engine.

### AiService

Purpose:
- Provide the only application gateway into AI provider functionality.

Responsibilities:
- Call `AiProvider` methods.
- Prepare minimized prompts and input data.
- Enforce AI decision boundaries.
- Save AI summary, classification, confidence, or suggested dispatch unit through services/repositories.
- Route OCR-like extraction requests to provider adapters when appropriate.

Should not do:
- Final accept or reject cases.
- Override manual decisions.
- Modify permissions.
- Approve billing.

### OcrService

Purpose:
- Coordinate OCR/extraction for `serial_photo` and `invoice_photo`.

Responsibilities:
- Mark OCR lifecycle states: `pending`, `processing`, `completed`, `failed`, `manual_review`.
- Call `AiService` or a future OCR provider.
- Store extraction result on `case_attachments.ai_extraction_result`.
- Suggest updates for `cases.serial_no` and `cases.invoice_date` when confidence and validation are acceptable.
- Route low confidence extraction to manual review.

Should not do:
- Treat OCR as final proof without human or validation policy.

### CustomerInquiryService

Purpose:
- Support customer-safe case lookup.

Responsibilities:
- Validate inquiry credentials.
- Support `case_no + mobile`.
- Support LINE `userId + case_no`.
- Return only customer-visible fields.
- Use customer-visible status mapping.
- Write inquiry messages or audit logs according to risk.
- Return generic failure responses without revealing whether a case exists.

Should not do:
- Return internal notes, AI raw analysis, audit logs, RBAC data, internal routing rules, or billing/original manufacturer data.

### WorkflowService

Purpose:
- Own case workflow rules and workflow-related policy checks.

Responsibilities:
- Validate allowed status transitions.
- Validate required fields before submission.
- Enforce AI decision boundary.
- Apply customer-visible status mapping.
- Coordinate dispatch preview flow.
- Request audit logging for status changes and important workflow decisions.

Should not do:
- Run raw SQL directly.
- Call controller methods.
- Call OpenAI or R2 directly.

## 4. Repository Design

Repositories are database access modules. They accept a normal database client or a transaction client so service operations can be atomic.

### CaseRepository

Responsibilities:
- Insert, update, and read `cases`.
- Query case queues by status, priority, submitted time, scheduled time, completed time, last customer message time, and last internal activity time.
- Find cases by `case_no`.
- Persist case summary fields and workflow timestamps.

No business rules:
- Does not decide whether `reviewing -> accepted` is allowed.
- Does not decide customer-visible fields.

### CustomerRepository

Responsibilities:
- Insert, update, and read `customers`.
- Lookup by mobile or LINE user ID.
- Respect `deleted_at` filters by default.

No business rules:
- Does not perform CRM-level identity resolution in Phase 1.

### AttachmentRepository

Responsibilities:
- Insert and update `case_attachments`.
- Query attachments by case, attachment type, and OCR status.
- Store R2 metadata and signed URL lifecycle timestamps.

No business rules:
- Does not decide who may view a signed URL.

### MessageRepository

Responsibilities:
- Insert and read `case_messages`.
- Query linear case conversation history.
- Link message records to same-case attachments.

No business rules:
- Does not decide whether a message should update case queue timestamps.

### AuditLogRepository

Responsibilities:
- Insert `audit_logs`.
- Query audit logs for authorized backend audit views.

No business rules:
- Does not decide audit masking.
- Does not update audit rows except future retention/archival jobs if formally approved.

### UserRepository

Responsibilities:
- Insert, update, and read `users`.
- Lookup by email, external auth, or user ID.
- Update status and last login time.

No business rules:
- Does not compute effective permissions.

### RoleRepository

Responsibilities:
- Insert, update, and read `roles`.
- Manage role metadata and enabled state.
- Read user-role assignments.

No business rules:
- Does not decide whether a user should receive a role.

### PermissionRepository

Responsibilities:
- Insert, update, and read `permissions`.
- Read role-permission assignments.
- Query effective permission rows for a user.

No business rules:
- Does not decide whether an operation is allowed outside returning data.

### DispatchUnitRepository

Responsibilities:
- Insert, update, and read `dispatch_units`.
- Query enabled units by region, city, product type, and priority.

No business rules:
- Does not decide final dispatch assignment.

## 5. Workflow Layer Design

`WorkflowService` is the core boundary for status and workflow policy. It should be used by `CaseService`, `CustomerInquiryService`, `AiService`, and later API controllers indirectly through services.

Required responsibilities:

- Status transition checks:
  - Enforce allowed transitions from Task 004.
  - Keep Phase 2 statuses reserved without implementing full dispatch/on-site/billing flows.

- Required fields validation:
  - Validate `customer_id`, `brand`, `case_type`, `product_type`, `model_no`, `problem_description`, contact method, and address before `submitted`.
  - Allow `serial_photo + OCR pending` as a controlled substitute for missing `serial_no` when policy allows.
  - Allow `invoice_photo + OCR pending` as a controlled substitute for missing `invoice_date` when policy allows.
  - Treat `preferred_visit_time` as recommended for smoother dispatch, not always mandatory in Phase 1.

- Audit log writing:
  - Coordinate with `AuditService` for status changes and important workflow events.
  - Ensure before/after data is minimized.

- Customer-visible status mapping:
  - Map internal `cases.status` to customer-safe display labels.
  - Prevent controllers from exposing internal statuses directly to customers.

- AI decision boundary:
  - AI may suggest summaries, classification, OCR extraction, dispatch units, and next transition.
  - AI may not final accept, reject, delete, approve billing, change permissions, or override manual decisions.

- Dispatch preview flow:
  - Evaluate rule-based candidates first.
  - Include AI suggestion as supplementary input.
  - Keep `ai_suggested_dispatch_unit_id` separate from final `dispatch_unit_id`.
  - Record `dispatch_assignment_source` as `rule`, `ai`, or `manual`.
  - Audit human overrides of AI suggestion.

Implementation note:
- Multi-step workflow changes should run inside a transaction controlled by the service layer, for example:
  - update case status
  - update summary timestamp
  - insert message/system event if needed
  - insert audit log

## 6. AI Adapter Design

The backend must not let routes, controllers, LINE webhook handlers, or repositories call OpenAI directly.

### Interface

Define an `AiProvider` interface with provider-neutral methods such as:

```text
summarizeCase(input)
classifyCase(input)
suggestDispatchUnit(input)
extractSerialInfo(input)
extractInvoiceInfo(input)
suggestNextQuestion(input)
```

### Phase 1 provider

`OpenAiProvider` implements `AiProvider`.

Responsibilities:
- Own OpenAI SDK/client usage.
- Convert provider responses into provider-neutral objects.
- Return structured results with confidence where available.
- Avoid leaking provider-specific response shape into services.

### Future providers

Future providers may include:
- Claude.
- Gemini.
- Local LLM.
- Dedicated OCR provider.

The rest of the backend should switch providers through config and dependency injection, not through controller rewrites.

### AiService boundary

`AiService` is responsible for:
- Data minimization before provider calls.
- Prompt policy.
- Confidence interpretation notes.
- Safety checks before saving AI output.
- Recording AI-originated suggestions.

AI output rules:
- `ai_confidence` is reference-only.
- `ai_classification` raw structure should not be customer-visible.
- AI suggestions must remain distinguishable from human decisions.

## 7. OCR Design

OCR in Phase 1 is an extraction workflow around `case_attachments`, not a separate full processing platform.

### Supported attachment types

- `serial_photo`
- `invoice_photo`

### Flow

1. Customer or admin uploads a serial or invoice photo.
2. `AttachmentService` stores the file in R2 and creates `case_attachments`.
3. `OcrService` marks `ocr_status = 'pending'`.
4. Worker or synchronous Phase 1 service marks `ocr_status = 'processing'`.
5. `OcrService` calls `AiService` or future OCR provider.
6. Extraction result is stored in `ai_extraction_result`.
7. Confidence is stored in `ai_extraction_confidence` when available.
8. If extraction is valid and confidence is acceptable:
   - serial photo may suggest `cases.serial_no`.
   - invoice photo may suggest `cases.invoice_date`.
9. If extraction is unclear:
   - set `ocr_status = 'manual_review'` or `failed`.
   - ask customer/admin for correction.

### Manual review

Manual review is required when:
- OCR fails.
- Confidence is low.
- Extracted value has invalid format.
- Extracted invoice date conflicts with warranty review policy.
- Human reviewer rejects AI extraction.

Phase 1 should avoid building a full OCR job table. Future `attachment_processing_jobs` can support queue, retry, async workers, and failure reasons.

## 8. Cloudflare R2 Attachment Design

### Upload flow

1. Controller receives upload request and authenticated actor context.
2. Middleware validates body size and file shape.
3. `AttachmentService` checks case access permission.
4. `AttachmentService` validates attachment type and source channel.
5. `StorageProvider` uploads the file to R2.
6. `AttachmentRepository` stores metadata:
   - storage provider
   - bucket
   - object key
   - object version if available
   - original filename
   - content type
   - byte size
   - checksum if available
7. `MessageService` may record an image/file message.
8. `AuditService` records attachment creation when required.

### Object key strategy

Recommended shape:

```text
cases/{case_id}/{attachment_type}/{yyyy}/{mm}/{uuid}-{safe_filename}
```

Guidelines:
- Use `case_id`, not customer name or mobile.
- Do not put PII in object keys.
- Sanitize filenames.
- Keep object keys stable once stored.
- Use UUIDs to avoid collision.

### Signed URL flow

1. Request reaches controller.
2. `AttachmentService` checks case and attachment access permission.
3. `StorageProvider` generates a short-lived signed URL.
4. `AttachmentRepository` updates:
   - `last_signed_url_issued_at`
   - `last_signed_url_expires_at`
5. Sensitive access may be audited depending on role, attachment type, or future visibility policy.

Rules:
- Do not store permanent public URLs as the only access reference.
- Do not expose R2 object keys to customers unless necessary.
- Signed URLs should be short-lived.
- Backend must be the access control boundary.

### Access control boundary

The storage provider only knows how to upload and sign objects. It does not decide whether an actor may access a file.

Access decision belongs to:
- `requirePermission` middleware for backend users.
- `CustomerInquiryService` for customer-safe inquiry contexts.
- `AttachmentService` for final object-level checks.

## 9. Auth / RBAC Design

### Data model

Auth and RBAC use:
- `users`
- `roles`
- `user_roles`
- `permissions`
- `role_permissions`

### Middleware

Recommended middleware:
- `requireAuth`: verifies JWT/session and loads actor context.
- `requirePermission(permissionKey)`: checks effective permission with `PermissionService`.
- `optionalCustomerInquiryAuth`: validates public inquiry credential without creating backend user privileges.

### Least privilege

Rules:
- Admin endpoints require explicit permissions such as `users.manage` or `dispatch_units.manage`.
- Case reading and update permissions should be separate.
- Audit log reading should be restricted to auditor/admin roles.
- Engineer access should be limited to assigned or relevant future dispatch scope once dispatch tables exist.
- AI/system accounts should have narrow service permissions and should not receive human admin permissions.

### Service accounts

System and AI actors should be represented clearly:
- `users.user_type = 'system'` for internal service account if persisted as a user.
- `audit_logs.actor_type = 'ai'` or `system` depending on the source of action.

Rules:
- Service accounts cannot login through normal password flows unless explicitly designed.
- AI/system account actions must be auditable.
- AI/system account permissions must be minimal.

## 10. Audit Design

### Services that must call AuditService

Required audit producers:
- `CaseService`: case creation and important case field changes.
- `WorkflowService`: status transitions and workflow decisions.
- `CustomerService`: customer profile changes.
- `AttachmentService`: attachment added, deleted, sensitive access, signed URL issuance where policy requires.
- `DispatchUnitService`: dispatch unit changes.
- `AiService`: AI suggested dispatch unit, AI classification saved, manual override context where relevant.
- `OcrService`: OCR result accepted, failed, or sent to manual review.
- `AuthService`: failed login, successful login if required by policy, user disabled/suspended.
- `PermissionService` or admin services: role assignment, role revocation, permission grant, permission revocation.
- `CustomerInquiryService`: suspicious inquiry, repeated failed lookup, verification failure, sensitive masking event.

### Data minimization

Audit logs should store:
- Action name.
- Entity type and ID.
- Actor type and ID when available.
- Minimal before/after diff.
- Masked PII.
- IP address and user agent when available.

Audit logs should not store:
- Complete customer objects when only one field changed.
- Full message bodies unless required.
- Full AI prompts or raw provider payloads.
- File binary or signed URLs.
- Plaintext secrets.

### Append-only principle

Application code should treat `audit_logs` as append-only:
- Insert new audit rows.
- Do not update audit rows for normal operations.
- Do not soft-delete audit rows in Phase 1.

Future retention or immutable audit strategy can be handled by dedicated policy and jobs.

## 11. Customer Inquiry Backend Design

Customer inquiry is a public-facing read flow with strict minimum disclosure.

### Supported Phase 1 verification

Option 1:
- `case_no + mobile`

Option 2:
- LINE `userId + case_no`

Rules:
- Never allow lookup by `case_no` alone.
- Do not let customers see non-owned cases.
- Do not reveal whether the case number exists when verification fails.
- LINE user ID is auxiliary verification and should not be treated as the only permanent identity.

### Flow

1. Customer submits inquiry through LINE or website.
2. `CustomerInquiryController` validates input shape.
3. `CustomerInquiryService` normalizes lookup inputs where appropriate.
4. `CustomerInquiryService` queries by `case_no`.
5. Service verifies mobile or LINE user ID ownership.
6. If verification fails, return a generic failure response.
7. If verified, `WorkflowService` maps internal status to customer-visible status.
8. Service filters fields to customer-visible response DTO.
9. `MessageService` records inquiry conversation where appropriate.
10. `AuditService` records suspicious or sensitive inquiry events.

### Customer-visible fields

Allowed:
- Case number.
- Customer-visible status.
- Created time.
- Product brand.
- Product type.
- Model number.
- Fault summary.
- Preferred visit time.
- Scheduled visit time summary when available.
- Future engineer visit status.
- Missing data prompt.

Not allowed:
- Internal notes.
- AI raw analysis.
- `ai_confidence`.
- Raw `ai_classification`.
- Audit logs.
- Permission/RBAC data.
- Internal routing rules.
- Original manufacturer settlement or billing data.

### Failed lookup response

Recommended response:

```text
Unable to verify the case with the provided information. Please check the information or contact customer service.
```

Do not distinguish:
- Case number does not exist.
- Mobile does not match.
- LINE user ID does not match.
- Case is deleted or archived.

### Rate limiting future note

Phase 1 can start with simple application or gateway throttling. Future inquiry protection may require:
- Per-IP throttling.
- Per-mobile throttling.
- Per-LINE-user throttling.
- Suspicious behavior monitoring.
- `customer_inquiry_logs`.
- Public inquiry token support.

## 12. Error Handling

### Validation error

When:
- Request shape is invalid.
- Enum value is invalid.
- Required request field is missing.

Response:
- HTTP 400.
- Safe field-level error messages for authenticated admin APIs.
- Generic public message for customer inquiry where needed.

### Auth error

When:
- Missing token.
- Invalid token.
- Expired token.
- Disabled user.

Response:
- HTTP 401.
- No internal auth details.

### Permission error

When:
- Actor is authenticated but lacks permission.

Response:
- HTTP 403.
- Record audit for sensitive permission failures when policy requires.

### Not found / generic response

Internal APIs:
- HTTP 404 may be acceptable when actor is authorized.

Public inquiry:
- Do not reveal whether the case exists.
- Return a generic verification failure response.

### Provider error

When:
- OpenAI, R2, LINE future, or OCR provider fails.

Response:
- HTTP 502 or 503 depending on retryability.
- Log provider error with request ID.
- Do not expose provider secrets or raw payloads.

### Database error

When:
- Constraint failure.
- Connection failure.
- Transaction failure.

Response:
- Known constraint errors can map to 400 or 409.
- Unknown database errors return 500.
- Log request ID and sanitized details.

### Upload error

When:
- File too large.
- Unsupported MIME type.
- R2 upload fails.
- Checksum mismatch.

Response:
- HTTP 400 for validation failures.
- HTTP 502/503 for storage provider failures.
- Ensure partial metadata is not committed if upload fails.

### Error response shape

Recommended internal API shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request.",
    "requestId": "..."
  }
}
```

Public inquiry responses should be more generic and avoid case existence leaks.

## 13. Configuration / Environment Variables

Required or expected environment variables:

```text
NODE_ENV
PORT
APP_BASE_URL

DATABASE_URL

JWT_SECRET
JWT_EXPIRES_IN

LINE_CHANNEL_SECRET
LINE_CHANNEL_ACCESS_TOKEN

OPENAI_API_KEY
AI_PROVIDER

R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
R2_SIGNED_URL_TTL_SECONDS

CORS_ORIGIN
LOG_LEVEL
```

Deployment notes for low-cost Zeabur:
- Use a single Node.js web service.
- Use managed PostgreSQL through `DATABASE_URL`.
- Keep R2 for file storage instead of local disk.
- Avoid background worker complexity in Phase 1 unless OCR/upload processing requires it.
- Use environment variables managed by Zeabur project settings.
- Keep health check endpoint lightweight, for example `/healthz`.

## 14. Done Criteria

Task 005 is complete when:

- Backend layer boundaries are clear.
- Controllers do not contain business logic.
- Repositories do not contain workflow logic.
- Workflow rules are centralized in `WorkflowService` and `workflows/`.
- AI provider is replaceable through an adapter interface.
- OpenAI is only reachable through `AiService` and `AiProvider`.
- R2 files are not exposed as permanent public URLs.
- Attachment access is mediated by backend permission checks.
- Audit logging can trace important case, customer, attachment, workflow, auth, and RBAC actions.
- PII minimization and masking are part of audit design.
- RBAC can be connected through middleware and `PermissionService`.
- Customer inquiry flow avoids case existence leaks and exposes only customer-visible fields.
- The design is ready for Task 006 API endpoint design.

## Explicit Non-Goals For Task 005

- Do not implement Express routes.
- Do not implement controllers.
- Do not implement LINE webhook handling.
- Do not implement frontend screens.
- Do not change SQL migrations.
- Do not create appointment, dispatch, field service, quote, billing, or notification modules.
- Do not turn `cases` into a full workflow history table.
- Do not use `metadata` as a formal workflow or permission source.

## 15. Roadmap / Future Enhancement Notes

These notes are future architecture reminders only. They do not change the Phase 1 backend shape, and Phase 1 should remain a single Node.js service unless operational pressure proves otherwise.

### Background job architecture

Future use cases may need asynchronous workers:
- OCR async processing.
- Notification queue.
- AI retry jobs.
- Scheduled reminder jobs.

Possible future components:
- BullMQ.
- Redis queue.
- Dedicated worker services.

Phase 1 should stay with one Node.js service and avoid introducing Redis or separate workers prematurely.

### Transaction orchestration policy

Future backend work should formally define:
- Transaction boundaries.
- Retry strategy.
- Idempotency keys.
- Deadlock handling.

This is especially important for workflow transitions, upload metadata creation, AI/OCR result persistence, and future payment or settlement writes.

### API versioning strategy

Future public/admin APIs may need:
- `/v1`.
- `/v2`.
- Deprecation policy.

Phase 1 can avoid complex versioning, but route naming should not block a clean `/v1` prefix later.

### Request tracing

Future observability should include:
- Request correlation ID.
- Distributed tracing.
- Provider request tracing for OpenAI, R2, LINE, OCR, and future notification providers.

The architecture already reserves `requestId` middleware, but full tracing can wait.

### Structured logging

Future logging should use JSON logs with:
- `requestId`.
- `actorId`.
- `caseId`.
- Provider latency.
- Audit correlation.

Logs must avoid plaintext secrets, signed URLs, and excessive PII.

### Cache strategy

Future cache candidates:
- RBAC cache.
- Dispatch unit cache.
- Inquiry throttling cache.

Phase 1 does not need Redis. Database-backed reads are acceptable until load or latency justifies cache complexity.

### Notification architecture

Future notification work should introduce:
- `NotificationService`.
- Notification templates.
- Notification queue.
- Retry policy.

Notification orchestration should not be embedded directly inside `WorkflowService`. Workflow may emit intent, but notification delivery should remain a separate service boundary.

### File antivirus pipeline

Future attachment upload may need:
- Antivirus scan.
- Malware quarantine.
- MIME validation worker.

Phase 1 should keep upload validation modest, but the R2 and attachment metadata boundary should leave room for a later scanning pipeline.

### API rate limiting

Future API protection should include:
- Admin API throttling.
- Customer inquiry throttling.
- AI usage throttling.

Customer inquiry throttling is especially important because failed lookup responses intentionally avoid revealing whether a case exists.

### Webhook security

Future LINE webhook implementation should include:
- Signature validation.
- Replay protection.
- Idempotency protection.

Webhook handlers must still enter the same service and workflow layers instead of bypassing backend policy.

### Future engineer mobile app API boundary

A future engineer mobile app should reuse the same backend service layer and workflow policy. It should not create a second workflow engine or a separate installation/repair backend path.

The expected model remains:
- Shared Field Service Workflow.
- Case-Type Specific Engineer UI.

### Event-driven future consideration

Future architecture may add:
- Domain events.
- Notification events.
- Audit stream.
- Analytics events.

Phase 1 should not implement event sourcing. Events can be introduced later for integration and analytics without replacing the current relational source of truth.

### Observability roadmap

Future monitoring should include:
- Metrics.
- SLA dashboards.
- Queue monitoring.
- AI usage monitoring.
- OCR success rate.
- Dispatch performance.

These should be implemented as observability concerns, not as extra columns in core tables unless there is a clear operational need.

### Secrets management

Future production hardening should include:
- Secrets rotation.
- Vault integration.
- Environment separation.

Secrets must remain outside source control and must not appear in audit logs, structured logs, provider error payloads, or screenshots.

### Multi-environment deployment

Future deployment should distinguish:
- local.
- staging.
- production.

A config isolation policy should define which database, R2 bucket, LINE channel, AI key, and app URL belong to each environment. Production data should not be reused in local development without formal masking or export policy.
