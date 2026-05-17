# Task 024B - Organization Scope Regression Review

Date: 2026-05-15

Scope: review Task 024A organization scope enforcement only. This document does not introduce implementation changes.

## 1. Service-Level Organization Access

| Service | Checked methods | organization_id source | Access check status | Cross-organization risk |
| --- | --- | --- | --- | --- |
| `WorkflowService` | `transitionCase` | `cases.organization_id` from `CaseRepository.getCaseById` | Present: calls `OrganizationAccessService.assertAccess(actor, existing.organization_id)` before transition validation. | Low for exposed workflow transitions. |
| `AttachmentService` | `createAttachmentMetadata`, `generateUploadUrl`, `markUploadCompleted`, `generateDownloadUrl`, `requestOcrProcessing`, `updateOcrResult`, `listCaseAttachments`, `softDeleteAttachment` | case id from route or `attachment.case_id` -> `cases.organization_id` | Present: `ensureCaseExists(..., actor)` asserts access for exposed methods. | Low. Attachment rows do not store direct organization_id, but derived case lookup is consistently used. |
| `MessageService` | `createMessage`, `createInternalMessage`, `createSystemMessage`, `listCaseMessages`, `softDeleteMessage` | route case id or `message.case_id` -> `cases.organization_id` | Present for admin/system actor paths. `ensureCaseExists` skips org assertion for actor `userType === 'customer'`. | Medium future risk: trusted LINE ingestion currently chooses the case first, but direct future customer-facing message APIs must not pass arbitrary case ids through the customer bypass. |
| `DispatchService` | `markDispatchPending`, `assignDispatchUnit`, `assignEngineer`, `reassignEngineer` | route case id -> `cases.organization_id` | Present: `ensureCaseForDispatch(..., actor)` asserts organization access. | Low for exposed dispatch endpoints. |
| `AppointmentService` | `createAppointment`, `rescheduleAppointment`, `cancelAppointment`, `listAppointments` | route case id or `appointment.case_id` -> `cases.organization_id` | Present: `ensureCase(..., actor)` asserts access. | Low. |
| `FieldServiceReportService` | `createServiceReport`, `getServiceReportByCaseId`, `updateDiagnosis`, `updateRepairResult`, `updateServiceReport`, `completeServiceReport`, `createServicePart`, `listServiceParts`, `updateServicePart`, `softDeleteServicePart` | route case id or report/service part -> report -> case -> `cases.organization_id` | Present for exposed routes. | Low for exposed endpoints. `listServiceReports(query)` has no actor or organization boundary, but it is not currently registered as an API route. |
| `BillingService` | `createBillingRecord`, `getBillingRecordByCaseId`, `updateBillingAmounts`, `submitSettlement`, `listSettlementRecords`, `markSettlementCompleted`, `updateSettlementRecord` | route case id or billing/settlement -> billing -> case -> `cases.organization_id` | Present: `ensureCaseReadyForBilling` and `assertBillingAccess` assert organization access. | Low for exposed billing/settlement endpoints. Repository-only `listBillingRecords` is unscoped and should not be exposed as-is. |
| `AIOrchestrationService` | `requestCaseSummary`, `requestCaseClassification`, `requestDispatchSuggestion`, `requestOCR`, `requestServiceReportAnalysis`, `listAIJobs`, `getAIJobById` | case id, attachment -> case, service report -> case, or `ai_jobs.organization_id` | Present: trigger methods assert via derived case; list uses `buildScopedFilter`; read asserts `job.organization_id`. | Low for newly created scoped jobs. Medium for legacy/null organization jobs, because `assertAccess` currently allows null organization ids. |
| `CustomerInquiryService` | `inquiryByCaseNoAndMobile`, `inquiryByLineUserIdAndCaseNo` | Website path uses globally unique `case_no` + mobile; LINE path uses `channelCode` -> `line_channels.organization_id` + `line_channel_id` | LINE path fixed: uses `organization_id + line_channel_id + line_user_id`. Website path has no explicit organization context. | Low for current global-unique `case_no`. Future branded inquiry pages should pass organization/channel context to avoid relying only on global case number uniqueness. |
| `LineService` | `handleWebhook`, `handleFollow`, `handleUnfollow`, `handleTextMessage`, `linkCustomerByLineIdentity`, `recordLineEvent`, `recordLineMessage`, `listLineChannels`, `createLineChannel`, `updateLineChannel` | webhook `channelCode` -> `line_channels.organization_id`; identity table scope; admin channel methods use channel/input organization | Webhook/event ingestion has organization context. Admin channel list/create/update do not call `OrganizationAccessService`. | Must fix for multi-org admin use: users with `line.read` or `line.manage` could list/create/update channels outside their membership unless RBAC only grants these to super admins. |

## 2. List APIs

| API/list operation | Boundary status | Notes |
| --- | --- | --- |
| cases list | Scoped | `CaseService.listCases` uses `OrganizationAccessService.buildScopedFilter`. |
| customers list | Scoped | `CustomerService.listCustomers` uses `buildScopedFilter`; mobile matching is organization-scoped. |
| attachments list | Scoped by case | `AttachmentController` passes `req.user`; service checks case organization. |
| messages list | Scoped by case | `MessageController` passes `req.user`; service checks case organization. |
| appointments list | Scoped by case | `AppointmentController` passes `req.user`; service checks case organization. |
| billing list | Not currently exposed | There is no registered billing-record list endpoint. `BillingRepository.listBillingRecords` is unscoped and should not be exposed before adding derived case/organization filtering. Settlement list is scoped through billing -> case. |
| AI jobs list | Scoped | `AIController` passes `req.user`; service uses `buildScopedFilter` and repository filters `organization_id`. |
| notification logs list | Unscoped | `NotificationService.listNotificationLogs` filters event/channel/target/status only. Notification tables lack `organization_id`. |
| LINE channels list | Unscoped | `LineController.listLineChannels` does not pass `req.user`; `LineService.listLineChannels` does not apply organization membership filtering. |

## 3. Detail APIs

| Detail/read operation | Boundary status | Notes |
| --- | --- | --- |
| case detail | Scoped | `CaseService.getCaseById` asserts `row.organization_id`. |
| customer detail | Scoped | `CustomerService.getCustomerById` asserts `customer.organization_id`. |
| attachment detail/download | Scoped | Download URL uses attachment -> case -> organization assertion. No permanent public URL is returned. |
| message detail/delete | Scoped for delete | Delete loads message -> case and asserts organization. There is no standalone message detail route. |
| appointment update | Scoped | Update loads appointment -> case and asserts organization. |
| service report read/update | Scoped | Read by case and update by report both assert through case. |
| service part update/delete | Scoped | Part -> report -> case organization assertion. |
| billing read/update | Scoped | Read by case and update by billing both assert through case. |
| settlement update | Scoped | Settlement -> billing -> case organization assertion. |
| AI job read | Scoped | `getAIJobById` asserts `ai_jobs.organization_id`. Legacy/null organization jobs remain broadly accessible to users with `ai.read`. |
| LINE channel read/update | Partially missing | No detail GET route exists, but update is exposed and lacks organization access. List is also unscoped. |

## 4. Mutation APIs

| Mutation | Guard status | Notes |
| --- | --- | --- |
| create case | Scoped | Resolves/validates organization through `CaseService` and organization-scoped customer linking. Production should require non-null organization. |
| update case | Scoped | Existing case organization is asserted before updates. |
| workflow transition | Scoped | Transition asserts case organization before changing status. |
| dispatch assignment | Scoped | Case organization asserted; dispatch unit same-organization validation added. |
| appointment create/update | Scoped | Create/update assert case organization. |
| service report create/update/complete | Scoped | All exposed mutation paths assert through case. |
| service part create/update/delete | Scoped | All exposed mutation paths assert through report -> case. |
| billing create/update | Scoped | Create/update assert through case/billing -> case. |
| settlement create/update | Scoped | Settlement operations assert through billing -> case. |
| attachment create/delete | Scoped | Create/delete assert through case or attachment -> case. |
| message create/delete | Scoped for admin/system | Admin route asserts case organization. Customer bypass is only safe if called through trusted LINE flow. |
| AI trigger | Scoped | Case/attachment/service-report triggers assert organization and write scoped `ai_jobs` fields. |
| LINE channel update | Missing | `LineService.updateLineChannel` does not assert actor membership for `existing.organization_id`. |
| LINE channel create | Missing | `LineService.createLineChannel` validates organization exists but does not assert actor access to `input.organizationId`. |

## 5. LINE Identity Scope

Findings:
- `CustomerLineIdentityRepository.findByLineIdentity` requires `organizationId + lineChannelId + lineUserId`.
- `LineService.linkCustomerByLineIdentity`, `handleUnfollow`, and message ingestion use organization/channel context from `channelCode`.
- Public `line-case-inquiry` now requires `channelCode` and resolves `organization_id + line_channel_id` before checking identity.
- The old `CaseRepository.getCaseByCaseNoAndLineUserId` helper has been removed, reducing future accidental global LINE ID usage.

Remaining risks:
- `LineService.recordLineMessage` intentionally passes a customer actor to `MessageService`, whose organization assertion is bypassed for customer actors. This is currently acceptable only because `LineService.handleTextMessage` chooses the case after channel-scoped identity lookup. Future external customer message APIs should not reuse this bypass without their own organization/case ownership guard.
- `LineService.linkCustomerByLineIdentity` accepts an optional `customerId` but does not validate that the customer belongs to the same organization. Current webhook flow creates pending identities without a customerId, so this is a future linking/admin risk rather than a current webhook issue.

## 6. Dispatch Same-Organization Validation

Confirmed:
- `DispatchService.ensureDispatchUnitForCase` loads the dispatch unit and compares `(dispatchUnit.organization_id || null)` with `(caseRow.organization_id || null)`.
- Cross-organization dispatch units return a `ValidationError` with code `organization_mismatch`.
- `DispatchService.ensureEngineer` checks active user organization membership when the case has an organization id.

Remaining risk:
- Engineer membership depends on `user_organizations` being populated. Seeded/admin-only local data may not have engineer memberships yet, so test fixtures need organization memberships before dispatch tests are meaningful.

## 7. AI Job Organization Scope

Confirmed:
- Migration `014_add_ai_job_scope.sql` adds nullable `organization_id`, `line_channel_id`, `customer_id`, and `case_id` to `ai_jobs`.
- Case AI jobs (`summary`, `classification`, `dispatch_suggestion`) write `organizationId`, `customerId`, and `caseId` from the loaded case.
- Attachment OCR loads attachment -> case, asserts organization access, and writes job organization/case/customer scope.
- Service report analysis loads report -> case, asserts organization access, and writes job organization/case/customer scope.
- `listAIJobs` uses `OrganizationAccessService.buildScopedFilter` and repository filters by `organization_id` or `organization_id = ANY(...)`.
- `getAIJobById` asserts access to `job.organization_id`.

Remaining risk:
- `OrganizationAccessService.assertAccess` treats null organization ids as accessible. This supports legacy/dev data but means old unscoped AI jobs remain visible to any user with `ai.read` until backfilled or production enforces non-null organization scope.

## 8. Migration Consistency

Confirmed:
- Migration order is structurally correct and `migrations/README.md` now lists `001` through `014`.
- `013_add_organization_scope.sql` adds `organization_id` to `customers`, `cases`, and `dispatch_units`, plus `intake_line_channel_id` and `user_organizations`.
- `013` also replaces LINE identity uniqueness with `organization_id + line_channel_id + line_user_id`.
- `014_add_ai_job_scope.sql` runs after organizations/LINE channels and adds AI job scope columns.
- Seed permissions include `organizations.read`, `organizations.manage`, `line.read`, `line.manage`, `ai.read`, `ai.manage`, `notifications.read`, and `notifications.manage`.
- Nullable/future-required behavior is documented in `migrations/README.md` and README.

Risks:
- `organization_id` remains nullable for transition safety. This is acceptable for development migration compatibility but should be tightened before production multi-organization rollout.
- Notification tables still have no direct organization scope migration.

## 9. Remaining Risks

### Must Fix Before Next Multi-Organization Feature

1. LINE channel admin APIs are not organization-scoped.
   - `LineController.listLineChannels` does not pass `req.user`.
   - `LineService.listLineChannels` does not call `buildScopedFilter`.
   - `LineService.createLineChannel` does not assert access to `input.organizationId`.
   - `LineService.updateLineChannel` does not assert access to `existing.organization_id`.
   - Suggested patch: inject `OrganizationAccessService` into `LineService`; pass `req.user` from controller; use `buildScopedFilter` for list and `assertAccess` for create/update.

2. Notification admin APIs are not organization-scoped.
   - `notification_preferences`, `notification_templates`, and `notification_logs` do not carry organization_id.
   - `NotificationService.listNotificationLogs` can expose all logs to any user with `notifications.read`.
   - Suggested patch: either add organization columns now, or explicitly restrict notification admin APIs to super admin/system roles until organization-aware notification routing exists.

### Should Fix Soon

1. Null organization data is broadly accessible through `OrganizationAccessService`.
   - Suggested patch: add production policy to reject null organization access for non-super-admin users, or backfill and make organization_id required where appropriate.

2. Customer LINE identity linking should validate customer organization when `customerId` is supplied.
   - Suggested patch: in `LineService.linkCustomerByLineIdentity`, if `customerId` is provided, load customer and require `customer.organization_id === organization.id`.

3. MessageService customer bypass should be made harder to misuse.
   - Suggested patch: replace the broad `actor.userType === 'customer'` bypass with an explicit trusted option or a customer/case ownership check.

4. Repository-only list helpers should remain internal until scoped.
   - `BillingRepository.listBillingRecords` and `FieldServiceReportService.listServiceReports` are not currently exposed, but they should require organization context before any future route uses them.

### Future Note Only

1. Website public inquiry currently relies on global unique `case_no + mobile`.
   - This is acceptable in phase 1, but branded public inquiry pages should eventually pass organization/channel context.

2. Direct organization columns on derived tables may improve reporting.
   - Attachments/messages/appointments/field service/billing/settlements currently derive organization through case. This is acceptable for transactional access control, but reporting/export may eventually need denormalized organization_id.

3. Suspicious cross-organization access attempts are not separately audited.
   - Current behavior returns permission errors. A future security audit stream can record repeated or high-risk attempts.

## 10. Recommendation

Recommendation: do a small Task 024C patch before the next business feature.

Reason: Task 024A correctly hardened the main case-derived services, LINE identity lookup, and AI job scope. However, LINE channel admin APIs and notification admin APIs remain cross-organization risks. The LINE channel issue is directly tied to Task 022/023 multi-organization architecture and should be fixed before additional LINE or organization administration work proceeds.

Suggested Task 024C scope:
- Add organization access enforcement to `LineService` list/create/update and pass `req.user` from `LineController`.
- Add a short-term guard for notification admin APIs: either super-admin/system-only enforcement or a minimal organization scope migration, depending on how soon notification providers will be implemented.
- Add customer organization validation when linking a `customerId` to a LINE identity.
- Tighten or document the MessageService customer bypass with an explicit trusted ingestion boundary.

