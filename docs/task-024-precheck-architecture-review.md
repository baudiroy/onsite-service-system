# Task 024 Precheck Architecture Review / Gap Analysis

## 1. Current Architecture Summary

This review covers the current repository state after Tasks 001-023. The repository also already contains an Organization Admin foundation from Task 024, but the review below focuses on whether the platform built through Task 023 is internally consistent and ready for the next implementation step.

### Auth / RBAC

Implemented:
- Express auth routes: login, logout, me.
- JWT-based `requireAuth` middleware.
- `requirePermission(permissionKey)` middleware.
- `users`, `roles`, `permissions`, `user_roles`, `role_permissions` schema.
- Seed script for admin user, admin role, and permissions.
- Password hash uses bcrypt; password hash is not returned in DTO.

Foundation / gaps:
- Full user / role / permission admin CRUD is not implemented except organization membership endpoints added later.
- Permission checks are action-based only; field-level authorization is not implemented.
- RBAC cache, MFA, session management, failed login lockout, and password policy remain future work.

### Organization Scope

Implemented:
- `organizations` and `line_channels` tables.
- `customers.organization_id`, `cases.organization_id`, `cases.intake_line_channel_id`, `dispatch_units.organization_id`.
- `user_organizations` membership table.
- `OrganizationAccessService` foundation with `canAccessOrganization`, `assertAccess`, and scoped filters.
- `CaseService` and `CustomerService` use organization scope for create/list/read/update.
- Admin / system roles can cross organizations; regular users are intended to be limited by `user_organizations`.

Foundation / gaps:
- Organization scope is not consistently enforced across workflow, attachments, messages, dispatch, appointments, field service, billing, notification, AI jobs, and customer inquiry.
- Several tables rely on indirect organization scope through `case_id`, but services do not always call `OrganizationAccessService` before reading or mutating records.

### Cases

Implemented:
- `cases` main table with v1 and phase 1.5 summary fields.
- Admin create/list/read/update APIs.
- Direct status updates are blocked in PATCH.
- `customer_snapshot` captures customer data at case creation.
- AdminCaseDTO includes organization summary after Task 023.

Foundation / gaps:
- Case creation supports organization context, but public case creation is not implemented.
- `case_no` remains globally unique; no organization-aware case number strategy yet.
- Optimistic locking/idempotency is not implemented.

### Customers

Implemented:
- Customer CRUD/list and customer cases APIs.
- Admin case creation can link existing customer or find/create by mobile.
- Mobile matching is now organization-scoped: `organization_id + mobile`.
- CustomerDTO masks LINE user id.

Foundation / gaps:
- `customers.line_user_id` still exists and can conflict conceptually with `customer_line_identities`. It should be treated as legacy/simple profile field, not as primary LINE identity.
- CRM-grade deduplication, multiple addresses, identity merge, and normalized mobile are future work.

### Workflow

Implemented:
- Workflow transition endpoints for submit, review, accept, reject, cancel.
- Required fields are checked before submitted.
- Status transition audit logs are written.
- AI cannot make human final decisions in WorkflowService.

Foundation / gaps:
- WorkflowService does not currently enforce organization access.
- Only early workflow transitions are centralized in WorkflowService; dispatch/appointment/field service/billing transitions are service-local.
- Missing explicit close transition.
- Missing accepted -> dispatch_pending endpoint in the centralized workflow layer.

### Attachments / R2 / OCR Lifecycle

Implemented:
- Attachment metadata table and APIs.
- Signed upload/download URL flow through backend boundary.
- R2 provider abstraction/foundation.
- OCR status fields and OCR request/update foundation.
- Attachment audit events.

Foundation / gaps:
- Attachments do not have direct `organization_id`; they rely on cases.
- AttachmentService checks case existence but does not enforce organization access.
- No real OCR provider, antivirus, MIME validation pipeline, or customer/engineer visibility field yet.

### Messages / Timeline

Implemented:
- Case message creation/list/delete foundation.
- Internal note, workflow event, customer note, and system event concepts.
- Timeline messages are created by dispatch, appointment, field service, billing, AI, and LINE flows.
- `last_internal_activity_at` and customer message update behavior exists through MessageService.

Foundation / gaps:
- Messages do not have direct `organization_id`; they rely on cases.
- MessageService checks case existence but does not enforce organization access.
- No threaded messages, message_direction, or rich external messaging integration.

### Customer Inquiry

Implemented:
- Public case inquiry by `case_no + mobile`.
- Public LINE case inquiry by `lineUserId + caseNo`.
- Generic failure response and customer-visible DTO.
- Inquiry audit with masking.

Foundation / gaps:
- LINE inquiry still uses `customers.line_user_id` and does not include `organization_id` or `line_channel_id`; this conflicts with Task 022/023 identity scope requirements.
- Website inquiry by `case_no + mobile` has no organization context; if case_no remains globally unique this is less risky, but it does not support organization-specific public inquiry policy.
- No rate limiting or public inquiry token.

### Dispatch

Implemented:
- Dispatch assignment foundation.
- Assign dispatch unit / engineer and reassignment APIs.
- Dispatch audit contains assignment id, engineer id, dispatch unit id, and actor data.
- Timeline workflow events are created.
- Current assignment has assigned/reassigned auditability fields.

Foundation / gaps:
- No `dispatch_assignment_history` table.
- No engineer accept/reject lifecycle yet.
- DispatchService does not verify organization access or whether dispatch unit belongs to the same organization as the case.

### Appointments

Implemented:
- Appointment create/list/update/cancel foundation.
- Scheduled/rescheduled/cancelled logic updates case summary fields.
- Appointment audit and timeline events exist.

Foundation / gaps:
- Appointments rely on case/dispatch relation for organization boundary.
- AppointmentService does not enforce organization access.
- No notification delivery or external calendar integration.

### Field Service Reports

Implemented:
- Field service report CRUD foundation.
- Service parts foundation.
- Create report moves case to `on_site`.
- Complete report moves case to `completed`.
- Audit and timeline events exist.
- Shared repair/installation model is preserved; no premature split into separate report tables.

Foundation / gaps:
- No direct organization_id; relies on case.
- Service does not enforce organization access.
- No engineer mobile app, inventory costing, quote/approval flow, or customer signature table.

### Service Parts

Implemented:
- Service parts can be added/listed/updated/soft-deleted.
- Service part audit events exist.

Foundation / gaps:
- No inventory integration.
- No direct organization scope.
- No part cost calculation or vendor-specific part policy.

### Billing / Settlement

Implemented:
- Billing record foundation after completed case.
- Settlement records with vendor-ready target types and rule metadata fields.
- Billing/settlement audit and timeline events exist.

Foundation / gaps:
- No direct `organization_id` on billing or settlement tables.
- BillingService does not enforce organization access through the related case.
- No close workflow after billing/settlement.
- No payment gateway, ERP export, invoice issuance, or vendor rule engine.

### Notification Foundation

Implemented:
- Notification preferences, templates, logs.
- `shouldNotify`, template rendering placeholder, skip/sent/failed log lifecycle.
- Admin APIs for preferences/templates/logs.
- Audit for preference/template changes and manual skip.

Foundation / gaps:
- No organization_id or line_channel_id in notification preferences/templates/logs.
- Provider boundary exists conceptually, but no provider implementation.
- Future LINE notification cannot yet safely select access token by organization/channel from notification rows alone.

### AI / OCR Orchestration

Implemented:
- `AIProvider` interface and `PlaceholderAIProvider`.
- AI job table and admin trigger APIs.
- AI job request/completed/failed audit.
- AI results are kept advisory in `ai_jobs.response_payload` and do not directly overwrite workflow decisions.
- OCR orchestration integrates attachment OCR lifecycle and AI job lifecycle.

Foundation / gaps:
- `ai_jobs` has no `organization_id`, `line_channel_id`, `customer_id`, or `case_id` scope columns beyond generic entity fields.
- AIOrchestrationService does not enforce organization access for cases/attachments/service reports.
- AI conversation memory is not implemented and must be scoped by organization/channel/user/case in the future.

### LINE Integration

Implemented:
- Multi-organization LINE channel foundation.
- Webhook route: `POST /api/v1/line/webhook/:channelCode`.
- Channel lookup by channelCode and signature verification by that channel's secret.
- `line_events` include organization/channel/user context.
- `customer_line_identities` include organization/channel/user context.
- LINE message ingestion can record inbound text into case_messages if a linked customer and open case exist.

Foundation / gaps:
- `handleUnfollow` lookup currently appears to call `findByLineIdentity` without passing `organizationId`; this is a bug risk after Task 023 changed identity lookup to require organization scope.
- Existing unique index from Task 012 on `(line_channel_id, line_user_id)` remains because Task 013 drops a different index name. This is not immediately harmful if each channel belongs to one organization, but the migration intent and actual index state are inconsistent.
- No LINE push provider, Rich Menu, LIFF, LINE Pay, or chatbot.

## 2. Data Model Consistency Check

### organization_id Consistency

Good:
- `organizations` is available.
- `line_channels.organization_id` is required.
- `customer_line_identities.organization_id` is required.
- `line_events.organization_id` is required.
- `customers.organization_id`, `cases.organization_id`, and `dispatch_units.organization_id` are present and nullable for phase 1 migration safety.

Gaps:
- `ai_jobs`, `billing_records`, `settlement_records`, `notification_preferences`, `notification_templates`, `notification_logs`, `dispatch_assignments`, `appointments`, `field_service_reports`, `service_parts`, `case_attachments`, and `case_messages` do not have direct organization_id.
- For tables tightly tied to cases, indirect scope may be acceptable initially, but service-layer access checks must consistently join through case.
- Notification and AI jobs are cross-cutting enough that direct organization scope is likely needed soon.

### Foreign Keys

Good:
- Core case relations to customers, users, and dispatch units are present.
- Activity tables reference cases.
- Service parts reference field service reports.
- Billing records reference cases and optionally field service reports.
- Settlements reference billing records.
- LINE channels reference organizations.
- LINE identities/events reference organizations and channels.

Gaps / risks:
- `dispatch_assignments.dispatch_unit_id` does not enforce same organization as the case.
- `cases.dispatch_unit_id` and `cases.ai_suggested_dispatch_unit_id` do not enforce same organization as the case.
- `customer_line_identities.customer_id` does not enforce same organization as identity; this must be enforced in service or future composite FK/constraint.
- `line_events.linked_customer_id` and `linked_case_id` do not enforce same organization as the event.

### Migration Order

Good:
- Fresh order is lexicographic and works structurally: base tables, cases, activity, extensions, dispatch/appointment, field service, billing, notification, AI, LINE, organization-scope additions.
- `012_create_line_integration_tables.sql` comes after cases/customers/users exist, so FKs resolve.
- `013_add_organization_scope.sql` comes after organizations and line_channels exist.

Gap:
- `migrations/README.md` is stale and only lists 001-003 as current order. It should be updated before another migration task.

### deleted_at / Soft Delete

Consistent:
- Most mutable domain tables have `deleted_at`.
- User roles and role permissions support revoked/deleted concepts.
- Audit logs, line events, notification logs, and schema migrations are effectively append-only.

Inconsistent / acceptable with note:
- `line_events` and `notification_logs` lack `deleted_at`; this is acceptable if they are append-only logs with retention handled later.
- `customer_line_identities` uses `unlinked_at` instead of `deleted_at`; acceptable for identity lifecycle.
- `user_organizations` has `deleted_at` but no `updated_at`; acceptable for simple membership, but less consistent than RBAC tables.

### created_at / updated_at

Consistent:
- Most mutable tables have both and updated_at triggers.

Gaps:
- `line_events`, `audit_logs`, and `notification_logs` have only created_at; acceptable for append-only logs.
- `customer_line_identities` lacks updated_at; acceptable if linked/unlinked lifecycle is enough, but future profile refresh/display_name update may need updated_at.
- `user_organizations` lacks updated_at; role_note changes are not supported yet.

### DTO vs DB Fields

Good:
- AdminCaseDTO includes organizationId and intakeLineChannelId.
- CustomerDTO includes organizationId and masked line user id.
- LineChannelDTO masks secrets/tokens.
- CustomerVisibleCaseDTO filters internal data.

Gaps:
- AIJobDTO cannot expose organization scope because DB does not store it.
- Notification DTOs cannot expose organization/channel routing because DB does not store it.
- Billing/Settlement DTOs cannot expose organization scope except through related case lookup, which is not part of DTO.

### Enum / Status Consistency

Good:
- Case status, priority, warranty, appointment summary, completion summary, source, attachment OCR, message types, dispatch status, appointment status, field service status, billing status, settlement status, notification status, AI job status, and organization status have DB constraints and validators in most places.

Gaps:
- Message design originally listed LINE-style message types; Task 015 uses internal timeline types. This is acceptable but should be clearly treated as evolved design.
- Workflow status transitions are not centralized for dispatch/appointment/field service/billing stages.

## 3. Workflow Gap Check

Target flow:

```text
case created
-> submitted
-> reviewing
-> accepted
-> dispatch_pending
-> assigned
-> scheduled
-> on_site
-> completed
-> billing
-> settlement
-> closed
```

### Implemented

- case created: Admin Case API.
- submitted: WorkflowService `submit`.
- reviewing: WorkflowService `review`.
- accepted: WorkflowService `accept`.
- rejected/cancelled early exceptions: WorkflowService `reject` and `cancel`.
- assigned / dispatch_pending: DispatchService creates assignments and updates case summary.
- scheduled: AppointmentService creates appointments and updates case summary.
- on_site: FieldServiceReportService creates service report and updates case summary.
- completed: FieldServiceReportService completes report and updates case summary.
- billing: BillingService creates billing record for completed/closed cases.
- settlement: BillingService creates/updates settlement records.

### Foundation Exists But Not Complete

- accepted -> dispatch_pending: implemented as service behavior in dispatch flow, not as centralized workflow transition endpoint.
- assigned -> scheduled: appointment service updates case status without centralized transition guard.
- scheduled -> on_site: field service report creation updates case status without centralized transition guard.
- on_site -> completed: field service completion updates case status without centralized transition guard.
- completed -> billing/settlement: billing module exists, but not part of a unified workflow state machine.

### Missing Transitions

- accepted -> dispatch_pending explicit transition endpoint.
- dispatch_pending -> assigned as workflow transition record/history.
- assigned -> scheduled as workflow transition record/history.
- scheduled -> on_site as workflow transition record/history.
- on_site -> completed as workflow transition record/history.
- completed -> closed close endpoint.
- billing approved/submitted/settled -> case closed policy.

### Exception Flows

Implemented partially:
- reject/cancel before dispatch.
- appointment cancelled/rescheduled.
- pending parts through field service report status.
- settlement rejected.

Missing or only future notes:
- duplicate case handling.
- OCR failure resolution workflow.
- customer cancellation after assigned/scheduled/on_site.
- dispatch unit unavailable/no engineer available.
- appointment no-show and reschedule loop policy.
- billing dispute and re-open case policy.
- SLA breach/escalation policy.
- idempotency and concurrent transition protection.

## 4. Organization Scope / Data Isolation Check

### cases

Status: partial direct boundary.

- Has `organization_id` and service-level checks in CaseService create/list/read/update.
- WorkflowService and downstream services do not yet enforce organization access.

Recommendation: all case-derived services should call `OrganizationAccessService.assertAccess(actor, caseRow.organization_id)` after loading the case.

### customers

Status: partial direct boundary.

- Has `organization_id` and CustomerService checks.
- Mobile lookup is organization-scoped.
- Customer LINE profile field remains a legacy risk.

Recommendation: prefer `customer_line_identities` for LINE identity and deprecate business use of `customers.line_user_id`.

### dispatch_units

Status: direct boundary column exists.

- `dispatch_units.organization_id` exists and DispatchUnitRepository supports it.
- No dispatch unit admin API was found.
- DispatchService does not verify selected dispatch unit organization matches case organization.

Recommendation: enforce same organization in dispatch assignment.

### line_channels

Status: strong direct boundary.

- Required `organization_id`.
- Webhook uses channelCode to find channel and organization.
- Secrets are masked in DTO.

Recommendation: admin list/read/update line channel APIs should also enforce organization access for non-admin users.

### customer_line_identities

Status: intended strong boundary, with one implementation risk.

- Table includes organization/channel/user scope.
- Repository lookup requires organizationId/channelId/lineUserId.
- `handleFollow` and text message flows pass organizationId.
- `handleUnfollow` appears to omit organizationId in lookup; should be fixed.

Recommendation: add tests around follow/unfollow/message identity scope.

### billing

Status: indirect only.

- Billing records reference case but do not store organization_id.
- BillingService does not enforce organization access.

Recommendation: service-level organization access through case is required before exposing billing APIs broadly. Direct organization_id can be considered for reporting/performance.

### settlements

Status: indirect only.

- Settlement records reference billing record.
- No direct organization_id.

Recommendation: enforce organization access through billing -> case chain. Add organization_id later if reporting/export demands it.

### notifications

Status: no organization boundary.

- Preferences/logs/templates use target_type/target_id but no organization_id or line_channel_id.

Recommendation: this is a near-term gap before multi-organization LINE notification sending. Add organization/channel routing before provider implementation.

### ai_jobs

Status: no organization boundary.

- AI jobs store generic entity_type/entity_id only.
- Request payload may include caseId but there is no indexed organization scope.

Recommendation: add organization_id and optional line_channel_id/customer_id/case_id fields before real AI provider or conversation memory.

### RBAC vs Organization Scope Separation

Good:
- RBAC middleware is action permission only.
- OrganizationAccessService is a separate data boundary foundation.

Gap:
- The separation exists architecturally but is only applied in CaseService and CustomerService so far.

## 5. Permission / RBAC Check

### Current Permission Namespaces

Seeded namespaces:
- `cases.*`: create/read/update/review/accept/reject/cancel.
- `customers.*`: create/read/update.
- `attachments.*`: create/read/delete.
- `dispatch_units.manage`.
- `dispatch.manage`.
- `appointments.manage`.
- `service_reports.manage`.
- `billing.manage`.
- `notifications.read`, `notifications.manage`.
- `ai.read`, `ai.manage`.
- `line.read`, `line.manage`.
- `organizations.read`, `organizations.manage`.
- `audit_logs.read`.
- `users.manage`, `roles.manage`, `permissions.manage`.

### Naming Consistency

Mostly consistent:
- Module/action format is stable.
- Most operational modules use either `read/manage` or specific case workflow verbs.

Potential inconsistencies:
- `dispatch_units.manage` vs `dispatch.manage` is acceptable but should be documented: master data vs assignment workflow.
- `service_reports.manage` covers field reports and service parts; may later need `service_parts.manage` if parts become inventory-sensitive.
- `billing.manage` covers billing and settlements; may later need `settlements.manage/read` if finance roles split.
- Message APIs reuse `cases.read/update` instead of `messages.read/manage`; acceptable for timeline foundation, but may be too broad later.
- Appointment APIs only have `appointments.manage`; no read-only permission.
- Attachments OCR route uses `attachments.read + ai.manage`; acceptable but worth documenting.

### Missing or Not Implemented

- No audit log route implementation was found despite `audit_logs.read` permission.
- Full RBAC admin endpoints for users/roles/permissions are not implemented.
- Dispatch unit admin APIs are not implemented despite permission existing.
- Organization membership uses `organizations.manage`; if the desired policy is `users.manage + organizations.manage`, route middleware currently only checks `organizations.manage`.

## 6. AI Safety Check

### Provider Boundary

Good:
- AI calls route through `AIOrchestrationService` and `AIProvider` / `PlaceholderAIProvider`.
- Controllers do not call OpenAI directly.
- Provider is placeholder; no real AI provider is implemented.

### No Direct Formal Decision Writes

Good:
- AI jobs do not accept/reject/settle/assign directly.
- AI request payload includes advisory safety boundary.
- WorkflowService blocks `actor.userType === 'ai'` from final human decisions.

Gaps:
- AIOrchestrationService writes timeline messages and attachment OCR results, but does not enforce organization access.
- `ai_jobs` lacks organization_id, so AI job list/read can become cross-organization visible if non-admin users get `ai.read`.
- Future AI conversation context isolation has only README notes, not schema or service guardrails.

High-priority recommendation:
- Before real AI provider or chatbot, add direct organization scope to `ai_jobs` and enforce access by entity organization.

## 7. LINE Integration Check

### LINE User Identity

Good:
- Design and table support organization/channel/user scope.
- Repository lookup now expects `organizationId + lineChannelId + lineUserId`.
- README warns not to use `line_user_id` alone.

Risks:
- CustomerInquiryService still uses `case_no + customers.line_user_id`, which violates the new scope model.
- LineService `handleUnfollow` appears to omit organizationId in lookup.

### Webhook Signature

Good:
- Webhook route includes `:channelCode`.
- Channel is loaded by code.
- Signature is verified using that channel's `channel_secret`.
- Raw body is preserved in Express JSON verify hook.

### LINE Event Organization Context

Good:
- `line_events` include organization_id and line_channel_id.
- Minimal raw payload avoids secrets and does not store message text in raw payload.

### Future Notification Token Selection

Gap:
- `line_channels` has per-channel access token, but notification logs/preferences do not include organization/channel routing.
- Future LINE sending must derive the correct line_channel_id from customer identity or event policy, not a global env token.

## 8. Notification Check

### Preference Hierarchy

Implemented:
- System-level preference can disable an event/channel globally.
- Target-specific preference can override if present.

Gaps:
- Role/dispatch_unit/customer/user target concepts exist, but no organization-aware hierarchy.
- No explicit priority order beyond system then target.

### event_key Naming

Good:
- Event keys are free-form and examples are documented.

Risk:
- No central registry or enum means event key drift is likely as modules grow.

### Channel Switch

Implemented:
- Channels constrained to line/sms/email/in_app.

Gaps:
- No provider implementation.
- No per-channel provider config.
- No organization/channel routing for LINE.

### Notification Log Lifecycle

Implemented:
- pending/skipped/sent/failed statuses.
- sent_at exists.

Gaps:
- No retry count, next_retry_at, provider message id, organization_id, line_channel_id, or deleted_at/retention strategy.

### Future Provider Boundary

Foundation exists in service concepts, but no NotificationProvider interface is implemented yet.

## 9. Audit Coverage Check

### Covered

- case created / updated / status changed: yes.
- customer created / updated: yes.
- dispatch created / engineer assigned or reassigned: yes.
- appointment created / rescheduled / cancelled: yes.
- service report created / updated / completed: yes.
- service part added / updated / deleted: yes.
- billing created / updated: yes.
- settlement submitted / completed / rejected / updated: yes.
- notification preference/template changed: yes.
- notification skipped: yes if used.
- AI job requested / completed / failed: yes.
- OCR requested: yes through attachment and AI orchestration paths.
- LINE follow / unfollow / customer_linked: yes.
- LINE channel created / updated: yes.
- organization created / updated and user organization assigned/removed: present in current repo.
- login success/failure and inactive login attempts: yes.

### Gaps

- Normal attachment list/read is intentionally not audited; download URL generation is audited.
- Customer inquiry success/failure is audited, but not organization scoped.
- No audit API route found despite permission existing.
- No immutable audit enforcement at DB level; audit_logs has no update/delete API, but DB permissions are not addressed.
- Organization access denial events are not separately audited.

## 10. Missing Critical Items

### Must Fix Now / Before More Feature Work

1. Apply organization access checks consistently in workflow and downstream services.
   - WorkflowService
   - AttachmentService
   - MessageService
   - DispatchService
   - AppointmentService
   - FieldServiceReportService
   - BillingService
   - AIOrchestrationService
   - NotificationService where applicable

2. Fix LINE identity scope regressions.
   - CustomerInquiry LINE path must not use global `customers.line_user_id`.
   - LineService unfollow lookup should pass organizationId.

3. Add or enforce same-organization checks for assignments.
   - dispatch_unit must belong to the same organization as case.
   - linked customer/case/line identity should be same organization.

4. Decide AI job organization scope before real AI provider.
   - Add direct organization_id or enforce strict derived lookup for every AI job list/read.

5. Update migration documentation.
   - `migrations/README.md` is stale and should list 001-013 current order.

### Can Fix In Next Phase

- Add audit log read API.
- Add dispatch unit admin APIs or remove from exposed plan until implemented.
- Add read-only permissions for appointments, service reports, billing, and messages if roles need least privilege.
- Add close workflow and billing/settlement-to-close policy.
- Add idempotency keys for command endpoints.
- Add optimistic locking/versioning for case workflow transitions.
- Add notification provider interface and organization-aware notification routing.
- Add public inquiry token and rate limiting.

### Future Note Only

- SaaS tenant billing/plans.
- Organization switcher frontend.
- Full ABAC / field-level permissions.
- AI conversation memory tables.
- Workflow engine abstraction.
- Vendor settlement rule engine.
- Event sourcing.
- Search optimization and vector search.

## 11. Recommended Next Task

Recommendation: do not proceed directly into new business feature modules yet.

The next task should be a small hardening task before further expansion:

```text
Task 024A: Organization Scope Enforcement Patch
```

Suggested scope:
- Add organization access checks to WorkflowService and all case-derived services.
- Fix LINE unfollow lookup to include organizationId.
- Replace public LINE inquiry flow with channel-scoped identity lookup or mark it disabled until channel context is available.
- Add same-organization validation for dispatch unit assignment.
- Add tests or verification scripts for cross-organization denial paths.

After that, proceed with:
- Task 024 Organization Admin Foundation if not already applied in the target branch/environment.
- If Task 024 is already applied, proceed to Audit API or Dispatch Unit Admin API depending on operational priority.
