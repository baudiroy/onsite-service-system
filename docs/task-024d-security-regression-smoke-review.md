# Task 024D - Security Regression + Integration Smoke Review

Date: 2026-05-15

Scope: security regression and integration smoke review after Task 024A, 024B, 024C, and Organization Admin Foundation work. No product feature work was added as part of this review.

## 1. Overall Result

Result: mostly passed, with environment-limited database integration checks.

The application boots, static JavaScript syntax checks pass, HTTP health checks pass, and targeted mock checks confirm the main Task 024A/024C security boundaries. `npm run db:migrate` and `npm run db:seed` could not complete because no PostgreSQL server is listening on localhost port 5432 in this environment. The migration runner and seed code were reviewed statically, but full DB integration remains unverified until PostgreSQL is available.

Recommendation: continue only after either starting PostgreSQL locally or accepting that DB-backed integration remains untested. No Task 024E patch is required from the code review itself, but a DB smoke run should be performed before the next data-model-sensitive feature.

## 2. Checks Passed

### Boot / Basic Health

- `npm run check`: passed.
- `npm run dev`: app started successfully on port 3000.
- `GET /healthz`: returned OK JSON response.
- No-token admin request: returned `AUTH_REQUIRED`.
- LINE webhook request with missing signature: returned `AUTH_REQUIRED` with `Missing LINE signature`.
- Dev server was stopped after smoke testing; port 3000 is no longer occupied.

### Migration / Seed Static Consistency

- `migrations/README.md` matches actual migration files `001` through `014`.
- Migration order is lexicographic and structurally correct:
  - base tables
  - cases
  - case activity tables
  - attachment/message foundation updates
  - dispatch/appointment
  - field service
  - billing/settlement
  - notifications
  - AI jobs
  - LINE integration
  - organization scope
  - AI job organization scope
- `src/db/migrate.js` creates `schema_migrations` with `version`, `checksum`, and `executed_at`.
- Migration runner computes SHA-256 checksum and throws on checksum mismatch.
- Each migration runs in an explicit transaction.
- Seed permissions include:
  - `organizations.read`
  - `organizations.manage`
  - `line.read`
  - `line.manage`
  - `notifications.read`
  - `notifications.manage`
  - `ai.read`
  - `ai.manage`
- Seed uses find-before-create patterns for permission, role, and admin user. Active duplicate prevention also depends on repository constraints and role assignment behavior.

### Auth / RBAC Regression

- `requirePermission` mock check passed for an allowed permission.
- `requirePermission` mock check returned `PERMISSION_DENIED` when permission was missing.
- No-token admin HTTP request returned `AUTH_REQUIRED`.
- Full `POST /api/v1/auth/login` and `GET /api/v1/auth/me` DB-backed checks were not completed because PostgreSQL was unavailable.

### Organization Scope Regression

Static review confirms organization access checks are present in:

- `CaseService`
- `CustomerService`
- `WorkflowService`
- `AttachmentService`
- `MessageService`
- `DispatchService`
- `AppointmentService`
- `FieldServiceReportService`
- `BillingService`
- `AIOrchestrationService`
- `LineService` admin channel methods
- `OrganizationService`

Mock checks confirmed:

- LINE channel list receives `organizationIds` scoped filter for a regular user.
- LINE channel create without organization access returns `PERMISSION_DENIED`.
- LINE channel update without organization access returns `PERMISSION_DENIED`.
- AI job list receives `organizationIds` scoped filter.
- AI job read checks organization access.

Admin/system cross-organization behavior is preserved through `isSystemOrSuperAdmin` in `OrganizationAccessService`.

### LINE Regression

Confirmed by code review and mock checks:

- Webhook route is `POST /api/v1/line/webhook/:channelCode`.
- Missing signature is rejected before DB channel lookup.
- Invalid mock signature is rejected with `AUTH_REQUIRED`.
- Valid mock signature passes and binds to the mocked `organizationId` from channel lookup.
- Signature verification uses the selected `line_channel.channel_secret`.
- `line_user_id` is not treated as globally unique.
- `CustomerLineIdentityRepository.findByLineIdentity` requires `organization_id + line_channel_id + line_user_id`.
- `LineService.handleUnfollow` includes `organizationId` in identity lookup.
- LINE channel admin list/create/update now applies organization access.
- Cross-organization customer-to-LINE identity linking returns `VALIDATION_ERROR / organization_mismatch`.

### Notification Guard Regression

Confirmed:

- Notification admin routes require `notifications.read` or `notifications.manage` plus `requireSystemOrSuperAdmin`.
- Mock regular organization user is rejected with `PERMISSION_DENIED`.
- Mock admin/system access passes the super-admin/system-only guard.
- README documents notification foundation as global/system-level until organization/channel routing is added.

### MessageService trustedCustomerIngress Regression

Confirmed:

- `MessageService` no longer skips organization checks solely because `actor.userType === 'customer'`.
- Customer actor without `trustedCustomerIngress` returns `PERMISSION_DENIED` in mock check.
- Customer actor with `{ trustedCustomerIngress: true }` succeeds in mock check.
- Static scan shows `trustedCustomerIngress` is passed by `LineService.recordLineMessage` after LINE channel/customer/case ingestion.

### Customer Inquiry Regression

Confirmed by static review:

- Generic failure response is preserved through `GENERIC_FAILURE_MESSAGE`.
- LINE inquiry validator requires `channelCode`, `caseNo`, and `lineUserId`.
- LINE inquiry resolves `channelCode -> line_channel.organization_id / line_channel.id` before identity verification.
- LINE inquiry uses `organization_id + line_channel_id + line_user_id`, then `case_no + customer_id`.
- `CustomerVisibleCaseDTO` exposes customer-safe fields and does not include internal notes, audit logs, billing records, permission data, or AI/OCR raw payload.

### AI Job Scope Regression

Confirmed:

- `ai_jobs` migration `014` adds `organization_id`, `line_channel_id`, `customer_id`, and `case_id`.
- Case AI jobs write `organizationId`, `customerId`, and `caseId` from the loaded case.
- Attachment OCR jobs load attachment -> case and write organization/case/customer scope.
- Service report analysis loads report -> case and writes organization/case/customer scope.
- AI job list/read is organization-scoped.
- AI orchestration remains advisory: summary/classification/dispatch/OCR analysis do not directly accept, reject, settle, or assign cases.

## 3. Checks Failed / Blocked

### Database Migration

Command:

```bash
npm run db:migrate
```

Result:

- Initial sandbox run failed with `EPERM` connecting to `localhost:5432`.
- Escalated run reached the host but failed with `ECONNREFUSED` for `::1:5432` and `127.0.0.1:5432`.

Interpretation: PostgreSQL is not running or not listening on localhost port 5432 in this environment.

### Database Seed

Command:

```bash
npm run db:seed
```

Result:

- Initial sandbox run failed with `EPERM` connecting to `localhost:5432`.
- Escalated run failed with `ECONNREFUSED` for `::1:5432` and `127.0.0.1:5432`.

Interpretation: seed script could not be integration-tested because PostgreSQL is unavailable.

### Auth Integration

Blocked DB-backed checks:

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me` with real token
- permission-denied behavior with a real non-admin user

Reason: these require migrated/seeded PostgreSQL data.

### Full Workflow Smoke

Blocked DB-backed sequence:

```text
create case -> submit -> review -> accept -> dispatch -> appointment -> service report -> complete service report -> billing -> settlement
```

Reason: this requires a live PostgreSQL database with migrations and seed data.

## 4. Risks Found

### Environment Risk

The largest current risk is not a code regression but unavailable DB infrastructure for integration testing. Until PostgreSQL is running and `npm run db:migrate` / `npm run db:seed` pass, DB schema and workflow integration remain unproven in this environment.

### Legacy Null Organization Risk

`organization_id` remains nullable for transitional/dev data. `OrganizationAccessService.canAccessOrganization` currently returns true when `organizationId` is null. This behavior is documented, but production multi-organization deployments should backfill and tighten null organization handling.

### Notification Scope Risk

Notification tables still do not have `organization_id` or `line_channel_id`. Task 024C mitigates this by limiting notification admin APIs to super admin/system admin, but true multi-organization notification routing still needs a future schema/policy patch.

### Full Workflow Untested Against DB

Static review shows organization guards in the relevant services, but the full operational chain was not executed against a database.

## 5. Must Fix Before Next Feature

No source-code must-fix was identified from the regression review.

Operational must-fix before any DB-sensitive next feature:

1. Start or configure PostgreSQL.
2. Run `npm run db:migrate` successfully.
3. Run `npm run db:seed` successfully.
4. Perform at least one authenticated smoke flow with a real token.

## 6. Can Fix Later

- Backfill legacy/dev rows with `organization_id` and make production create/read paths stricter for null organization.
- Add organization/channel scope to notification preferences, templates, and logs before implementing providers.
- Add automated integration tests for cross-organization access denial.
- Add a DB-backed smoke fixture covering the full workflow chain.
- Add security audit events for suspicious cross-organization access attempts.

## 7. Recommendation

Recommendation: no Task 024E code patch is required right now. The security hardening from Task 024A/024C appears intact in static and mock checks.

However, do not treat Task 024D as a complete integration pass until PostgreSQL is available and the blocked DB-backed checks pass. If the next task depends on schema correctness or real workflow persistence, start PostgreSQL and rerun migrate/seed/auth/workflow smoke first.

