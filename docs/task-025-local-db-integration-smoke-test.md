# Task 025 - Local DB Integration Smoke Test

Date: 2026-05-15

## Overall Result

Result: PARTIAL PASS / BLOCKED

The backend can boot, `/healthz` works, syntax checks pass, and non-database request guards are active. The full local DB integration smoke test is blocked because no PostgreSQL server is currently listening on `localhost:5432`.

This is an environment blocker, not a confirmed migration or application logic failure.

## Environment Setup

Project directory:

```bash
/Users/roy/Documents/Codex/onsite service system/codex-ready-ai-field-service-docs
```

`.env` was present and configured with:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/onsite_service
JWT_SECRET=[redacted]
```

Local PostgreSQL availability checks:

- `localhost:5432`: no listener found
- `docker`: command not found
- `psql`: command not found
- `pg_ctl`: command not found
- `brew`: available at `/opt/homebrew/bin/brew`
- Homebrew PostgreSQL packages/services: not detected

Recommended minimal startup options:

Docker, if Docker Desktop is installed:

```bash
docker run --name onsite-service-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=onsite_service \
  -p 5432:5432 \
  -d postgres:16
```

Homebrew PostgreSQL, if Docker is not available:

```bash
brew install postgresql@16
brew services start postgresql@16
createdb onsite_service
```

Note: Homebrew PostgreSQL often uses the current macOS user by default. If using the existing `.env` URL, create or configure the `postgres` role/password/database accordingly.

## Commands Run

```bash
npm run check
npm run db:migrate
npm run db:seed
npm run dev
curl -s http://localhost:3000/healthz
curl -s -i http://localhost:3000/api/v1/auth/me
curl -s -i -X POST http://localhost:3000/api/v1/auth/login ...
curl -s -i -X POST http://localhost:3000/api/v1/line/webhook/client-a
```

The dev server was stopped after testing, and port `3000` was confirmed clear.

## Migration Result

Result: BLOCKED

`npm run db:migrate` could not connect to PostgreSQL:

```text
connect ECONNREFUSED ::1:5432
connect ECONNREFUSED 127.0.0.1:5432
```

Sandboxed execution first showed a local socket permission issue, so the command was retried with elevated execution. The elevated run reached the host network but PostgreSQL was not running.

No migration-specific error was observed because the database connection failed before any migration file could execute.

Static consistency reviewed:

- `schema_migrations` runner exists.
- Migration filenames are ordered.
- Current migration set includes base tables, cases, activity tables, dispatch/appointment, field service, billing/settlement, notification, AI jobs, LINE integration, and organization scope patches.
- `migrations/README.md` has been updated by previous tasks to describe the broader migration order.

## Seed Result

Result: BLOCKED

`npm run db:seed` could not connect to PostgreSQL:

```text
connect ECONNREFUSED ::1:5432
connect ECONNREFUSED 127.0.0.1:5432
```

Static seed expectations reviewed from implementation and README:

- Admin user seed exists.
- Admin role seed exists.
- Permission seed includes the newer namespaces such as organizations, line, notifications, and ai.
- Seed is intended to be idempotent and not repeatedly create active roles, permissions, or users.

Actual database idempotency could not be verified until PostgreSQL is running.

## App Boot Result

Result: PASS

`npm run dev` started successfully:

```text
onsite-service-api listening on port 3000
```

Health check passed:

```json
{
  "ok": true,
  "service": "onsite-service-api",
  "timestamp": "2026-05-15T15:56:36.046Z",
  "requestId": "req_e2b92981-5079-40ed-b5af-aa52050bfe06"
}
```

The health endpoint did not expose sensitive data.

## Auth Smoke Result

Result: PARTIAL

Passed:

- `GET /api/v1/auth/me` without token returns `AUTH_REQUIRED`.
- The response shape includes request id and structured error data.

Blocked:

- `POST /api/v1/auth/login` cannot be verified because the database is unavailable.
- A wrong password login attempt returned an internal database connection error, not an auth-domain result, because the user lookup could not reach PostgreSQL.
- `GET /api/v1/auth/me` with a valid token cannot be verified until seed/login succeeds.
- Password hash exclusion from successful DTOs cannot be runtime-verified yet.

## Organization Smoke Result

Result: BLOCKED

The following require a running database and seeded admin token:

- `POST /api/v1/admin/organizations`
- `GET /api/v1/admin/organizations`
- `GET /api/v1/admin/organizations/:organizationId`

Static implementation expectations:

- Organization admin routes exist.
- Organization DTO avoids secrets.
- Organization access boundary is intended to distinguish RBAC permissions from organization scope.
- Audit events are expected for organization creation and update.

## LINE Channel Smoke Result

Result: PARTIAL

Passed without DB:

- `POST /api/v1/line/webhook/:channelCode` without `x-line-signature` is rejected with `AUTH_REQUIRED`.

Blocked by DB:

- Invalid signature check requires loading the channel by `channelCode`.
- Valid mock signature requires a stored `line_channels.channel_secret`.
- Admin LINE channel create/list/update requires database and seeded auth.

Static implementation expectations:

- Webhook route is scoped by `channelCode`.
- Signature verification is intended to use the matched line channel secret.
- LINE identity scope is organization-aware and must use `organization_id + line_channel_id + line_user_id`.
- Admin line channel routes were hardened in Task 024C to pass actor user context and apply organization access.

## Case / Customer Smoke Result

Result: BLOCKED

The requested organization-scoped case creation flow requires database access:

- organization creation
- customer find-or-create by `organization_id + mobile`
- case creation
- case number generation
- customer snapshot write
- audit log writes

Static implementation expectations:

- Admin case create supports organization context.
- Customer linking must be organization-scoped.
- Customer snapshot is expected to include organization and customer fields as historical data.
- Direct status updates via `PATCH /cases/:id` remain blocked by service rules.

## Workflow Smoke Result

Result: BLOCKED

The following transition endpoints require a real case row:

- `POST /api/v1/admin/cases/:caseId/submit`
- `POST /api/v1/admin/cases/:caseId/review`
- `POST /api/v1/admin/cases/:caseId/accept`

Static implementation expectations:

- Phase 1 transitions are implemented through `WorkflowService`.
- Timestamp updates are expected for submitted/reviewed/accepted/rejected/cancelled states.
- `last_internal_activity_at` is expected to update on admin/system transitions.
- Status changes are audited.
- Invalid transitions should return `INVALID_STATUS_TRANSITION`.

## Dispatch / Appointment Smoke Result

Result: BLOCKED

The following require database rows for organization, case, dispatch unit, and auth:

- `POST /api/v1/admin/cases/:caseId/dispatch`
- `PATCH /api/v1/admin/cases/:caseId/dispatch`
- `POST /api/v1/admin/cases/:caseId/appointments`
- `GET /api/v1/admin/cases/:caseId/appointments`

Static implementation expectations:

- Dispatch unit organization must match case organization.
- Cross-organization dispatch is expected to be rejected.
- Appointment creation should update case scheduling summary fields.
- Dispatch and appointment changes should create audit and timeline events.

Known future limitation:

- Engineer organization membership checks are documented as a future hardening area if not fully available in Phase 1.

## Field Service Smoke Result

Result: BLOCKED

The following require database state:

- `POST /api/v1/admin/cases/:caseId/service-report`
- `GET /api/v1/admin/cases/:caseId/service-report`
- `PATCH /api/v1/admin/service-reports/:reportId`
- `POST /api/v1/admin/service-reports/:reportId/parts`
- `GET /api/v1/admin/service-reports/:reportId/parts`
- `PATCH /api/v1/admin/service-parts/:partId`

Static implementation expectations:

- Service report creation can move case status to `on_site`.
- Completing a service report can move case status to `completed`.
- Service parts support old/new serial numbers.
- Audit and timeline events are expected for report and part changes.

## Billing / Settlement Smoke Result

Result: BLOCKED

The following require database state:

- `POST /api/v1/admin/cases/:caseId/billing`
- `GET /api/v1/admin/cases/:caseId/billing`
- `PATCH /api/v1/admin/billing/:billingId`
- `POST /api/v1/admin/billing/:billingId/settlements`
- `GET /api/v1/admin/billing/:billingId/settlements`
- `PATCH /api/v1/admin/settlements/:settlementId`

Static implementation expectations:

- Billing records act as case-level billing summaries.
- Settlements preserve actual settlement results.
- `settlement_target_type` supports future-ready values:
  - `engineer`
  - `manufacturer`
  - `internal`
  - `vendor`
  - `distributor`
  - `partner`
  - `subcontractor`
- Vendor-specific settlement rule fields are supported:
  - `settlement_rule_code`
  - `settlement_policy_version`
  - `settlement_metadata`
- AI billing analysis must not directly approve settlement.

## Attachment / OCR Smoke Result

Result: BLOCKED

Database-backed attachment and OCR flow could not be runtime-tested:

- `POST /api/v1/admin/cases/:caseId/attachments/upload-url`
- `GET /api/v1/admin/cases/:caseId/attachments`
- `POST /api/v1/admin/attachments/:attachmentId/ocr`

Static implementation expectations:

- R2 signed URL endpoints should return a storage configuration error if R2 env vars are missing.
- Missing R2 config should not prevent app boot or non-storage routes.
- Attachment metadata is stored in PostgreSQL; binary files are not.
- OCR request should create an AI job and update attachment OCR lifecycle fields.
- AI job should include organization/case scope.

## AI Job Smoke Result

Result: BLOCKED

The following require database state:

- `POST /api/v1/admin/cases/:caseId/ai/summary`
- `POST /api/v1/admin/cases/:caseId/ai/classification`
- `POST /api/v1/admin/cases/:caseId/ai/dispatch-suggestion`
- `GET /api/v1/admin/ai-jobs`
- `GET /api/v1/admin/ai-jobs/:jobId`

Static implementation expectations:

- `ai_jobs` includes organization scope columns:
  - `organization_id`
  - `line_channel_id`
  - `customer_id`
  - `case_id`
- Case AI jobs should write `organization_id` and `case_id`.
- Attachment OCR jobs should derive organization scope through attachment -> case.
- AI results should stay in job response payloads or advisory fields, not directly modify workflow decisions.
- AI cannot directly accept, reject, settle, or assign.

## Customer Inquiry Smoke Result

Result: BLOCKED

The following require case/customer/LINE identity rows:

- `POST /api/v1/public/case-inquiry`
- `POST /api/v1/public/line-case-inquiry`

Static implementation expectations:

- Public inquiry uses generic failure responses.
- Case existence should not be leaked on mismatch.
- CustomerVisibleCaseDTO must exclude internal notes, audit logs, billing data, AI raw data, dispatch rules, and permissions.
- LINE inquiry must include `channelCode`, resolve organization/line channel context, and must not rely only on `lineUserId + caseNo`.

## Notification Guard Smoke Result

Result: BLOCKED

The following require database and user role setup:

- `GET /api/v1/admin/notification-preferences`
- `GET /api/v1/admin/notification-templates`
- `GET /api/v1/admin/notification-logs`

Static implementation expectations:

- Notification admin routes require normal notification permissions and an additional super-admin/system-only guard.
- A regular organization user should not be allowed to use global notification admin APIs, even with `notifications.read` or `notifications.manage`.
- README documents notification foundation as global/system-level until organization-specific notification routing is added.

## Failed Checks

The following checks failed due to environment unavailability:

- PostgreSQL connection on `localhost:5432`
- `npm run db:migrate`
- `npm run db:seed`
- DB-backed login
- All DB-backed admin and public workflow smoke tests

Observed database error:

```text
connect ECONNREFUSED ::1:5432
connect ECONNREFUSED 127.0.0.1:5432
```

## Known Limitations

- No live PostgreSQL database was available during this run.
- Migration order, seed idempotency, foreign keys, indexes, and constraints were not runtime-verified.
- Auth login, seeded admin access, RBAC permission checks, organization membership checks, audit writes, and workflow transitions were not runtime-verified.
- R2 signed URL behavior was not runtime-tested because attachment metadata creation requires DB access.
- LINE valid signature testing was not possible because no line channel secret could be loaded from DB.
- Notification super-admin/system guard behavior was statically reviewed but not tested with real user accounts.

## Recommendation

Start a local PostgreSQL instance first, then rerun Task 025 from migration onward.

Suggested next command sequence after PostgreSQL is running:

```bash
cd "/Users/roy/Documents/Codex/onsite service system/codex-ready-ai-field-service-docs"
npm run db:migrate
npm run db:seed
npm run dev
curl http://localhost:3000/healthz
```

No application patch is recommended yet. The current blocker is local database availability. If migrations fail after PostgreSQL is running, patch the smallest failing migration or seed issue then rerun the smoke test.
