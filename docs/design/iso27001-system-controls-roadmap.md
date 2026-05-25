# ISO27001-aligned System Controls Roadmap / 系統層級資安與稽核控制補強規劃

This roadmap is for platform-level technical controls only. It is ISO27001-aligned planning, not a claim that the platform is certified and not a replacement for a full company ISMS, policy set, internal audit program, or certification evidence package.

The goal is to make future runtime work bounded and auditable before the platform grows further into SaaS, AI/RAG, customer self-service, reporting, export, file storage, and multi-party access workflows.

## Scope

This document covers system controls that should eventually support:

- organization isolation and tenant-safe access.
- permission-aware data reads, writes, reports, exports, downloads, and scheduled reports.
- customer-visible data filtering and internal-only data separation.
- field-level visibility and sensitive data masking.
- auditability for high-risk writes, exports, file access, AI retrieval, and permission denials.
- provider secret safety for LINE, SMS, Email, App push, Cloud AI, RAG, storage, and other integrations.
- SaaS-ready entitlement, usage tracking, and multi-tenant boundaries.

It does not implement runtime, database schema, API routes, provider sending, AI/RAG retrieval, migration, smoke test, or admin UI behavior.

## Existing Guardrails Already Covered

The current guardrails already establish several security foundations:

| Existing Area | Current Boundary |
| --- | --- |
| Organization isolation | Every API and data operation must respect organization scope and must not cross tenants. |
| Permission checks | User role and permission must be checked before access, write, export, or AI use. |
| Customer-visible data policy | Customer-facing surfaces must not expose internal note, audit log, AI raw payload, internal billing / settlement data, internal dispatch reasoning, or cross-customer data. |
| Data Access Control | Reports, analytics, export, download, AI retrieval, RAG, customer self-service, and scheduled reports must share one permission model. |
| AI/RAG safety | AI must be closed-domain, permission-aware, tenant-isolated, auditable, human-controlled, and RAG-grounded. |
| Cloud AI data protection | External AI providers must receive only minimum necessary, authorized, masked, and scoped context. |
| No silent overwrite | Formal operational, completion, phone identity, and amendment data must not be silently overwritten. |
| SaaS-ready boundaries | Plan, entitlement, permission, seat, usage, add-on, and Enterprise contract concepts must remain separate. |
| Provider secrets | Token, secret, access token, webhook secret, AI provider secret, and credential data must not be stored in repo, frontend, logs, prompts, or user-visible errors. |

## Missing Or Under-specified Design Areas

These areas are already implied by guardrails but need explicit module design and later bounded runtime slices.

| Area | Gap | Priority |
| --- | --- | --- |
| Data classification | No centralized classification taxonomy for customer data, internal data, sensitive data, public directory data, provider secrets, AI context, exports, and audit evidence. | Foundational runtime first |
| Field-level visibility | Role and case relationship rules are described, but field-level allow / mask / deny rules are not yet a reusable runtime policy. | Foundational runtime first |
| Export control | Export permission, field masking, download expiry, and export audit are designed conceptually but not yet implemented as one shared control. | Foundational runtime first |
| File access control | Photos, signatures, documents, rule source files, and report downloads need file metadata, scoped access policy, download expiry, and access audit. | Foundational runtime first |
| AI retrieval guard | AI/RAG retrieval must enforce organization_id, user permission, customer-visible/internal policy, source metadata, masking, and usage tracking through a shared guard. | Foundational runtime first |
| Provider secret management | Provider secrets for LINE, SMS, Email, App push, storage, Cloud AI, and RAG must be separated from repo/frontend/logs and governed by rotation and access rules. | Foundational runtime first |
| Audit log viewer | Existing and future audit events need an admin-safe viewer with masking, scope filters, and role restrictions. | Admin/audit UI later |
| Access review report | Future managers need periodic reports of users, memberships, roles, permissions, external access, and high-risk grants. | Admin/audit UI later |
| Incident evidence | Future incident handling needs evidence records for permission denied events, suspicious export, file download, AI retrieval, provider failure, and cross-scope access attempts. | Admin/audit UI later |
| Backup / restore evidence | Future operations need backup status, restore test evidence, retention visibility, and incident recovery references without exposing secrets or raw data. | Admin/audit UI later |

## Priority Model

Foundational runtime controls should be designed and implemented before dependent high-risk features expand:

1. Data classification.
2. Field-level visibility.
3. Export control.
4. File access control.
5. AI retrieval guard.
6. Provider secret management.

Admin and audit management capabilities can follow after the underlying events and policies exist:

1. Audit log viewer.
2. Access review report.
3. Incident evidence log.
4. Backup / restore evidence report.

## Future Bounded Runtime Task Candidates

Each future task must define exact allowed files, API scope, migration scope, permission scope, audit behavior, smoke or unit tests, and non-goals before runtime work begins.

### Data Classification Runtime Baseline

Purpose:

- Define a small classification vocabulary for data fields and resources.
- Support categories such as public, customer_visible, internal, sensitive_personal, sensitive_financial, provider_secret, AI_context, audit_evidence, and file_object.

Status:

- Task 855 creates the first pure runtime baseline module. See `docs/task-855-iso-controls-data-classification-runtime-baseline-no-api-no-db.md`.

Non-goals:

- Do not rewrite all APIs in one task.
- Do not migrate historical data without a separate migration task.

### Field-level Visibility Policy Runtime Slice

Purpose:

- Add a reusable policy for allow, deny, mask, and omit decisions by organization, role, case relationship, customer visibility, and resource type.
- Make customer, engineer, brand, service provider, subcontractor, finance, and admin visibility consistent.

Status:

- Task 856 creates the first pure field-level visibility policy baseline. See `docs/task-856-iso-controls-field-level-visibility-policy-baseline-no-api-no-db.md`.

Non-goals:

- Do not implement a full policy language at once.
- Do not expose internal-only fields to customer-facing surfaces.

### Export Control Permission / Audit Slice

Purpose:

- Require export permission.
- Apply field-level masking before export.
- Record export requested, generated, downloaded, expired, failed, or denied events.

Status:

- Task 857 creates the first pure export-control policy baseline. See `docs/task-857-iso-controls-export-control-policy-baseline-no-api-no-db.md`.

Non-goals:

- Do not build scheduled reports in the first export-control slice unless separately scoped.

### File Access Control Signed URL / Audit Slice

Purpose:

- Govern photos, signatures, documents, source files, customer reports, and downloads through scoped file metadata.
- Support expiring links, revoke behavior, and file_downloaded / file_access_denied audit events.

Status:

- Task 858 creates the first pure file-access-control policy baseline. See `docs/task-858-iso-controls-file-access-control-policy-baseline-no-api-no-db.md`.

Non-goals:

- Do not store raw files in main database tables.
- Do not make permanent public links.

### AI Retrieval Guard Runtime Slice

Purpose:

- Centralize AI/RAG retrieval checks.
- Require organization_id filter, user permission, feature entitlement, source visibility, field masking, minimum necessary context, source citation metadata, and usage tracking.

Status:

- Task 859 creates the first pure AI retrieval guard policy baseline. See `docs/task-859-iso-controls-ai-retrieval-guard-policy-baseline-no-provider-no-db.md`.

Non-goals:

- Do not let AI directly query unfiltered database, vector database, file storage, or cross-tenant data.
- Do not implement autonomous AI decisions.

### Provider Secret Management Guard

Purpose:

- Prevent secrets from entering repo, frontend, logs, prompts, error responses, exports, or customer-visible data.
- Define provider secret access patterns and rotation evidence expectations for LINE, SMS, Email, App push, Cloud AI, RAG, storage, and payment/provider integrations.

Status:

- Task 860 creates the first pure provider-secret management guard baseline. See `docs/task-860-iso-controls-provider-secret-management-guard-baseline-no-provider-runtime.md`.

Non-goals:

- Do not print or inspect real secrets.
- Do not add provider sending in the same task.

### Audit Log Viewer

Purpose:

- Provide scoped audit access for authorized administrators.
- Include filters for organization, actor, action, resource type, result, time, and masked summary.

Non-goals:

- Do not expose raw payloads, complete sensitive values, secrets, raw LINE user ids, or unrestricted audit logs.

### Access Review Report

Purpose:

- Support periodic review of users, roles, permissions, organization membership, brand/service provider/subcontractor access, and high-risk grants.

Non-goals:

- Do not auto-revoke access without a separate approval workflow.

### Incident Evidence Log

Purpose:

- Capture evidence references for suspicious access, cross-scope denial, sensitive export, file download anomaly, AI retrieval anomaly, provider failure, and manual correction events.

Non-goals:

- Do not turn this into a full incident management system in the first slice.

### Backup / Restore Evidence Report

Purpose:

- Track backup status, restore test evidence, retention state, and recovery references for operational audit readiness.

Non-goals:

- Do not expose database URLs, snapshots, credentials, or raw backup payloads.

## Data Protection Rules

Future implementation must not introduce:

- token, secret, password, API key, LINE access token, LINE channel secret, webhook secret, AI provider secret, database URL, or credential values.
- full customer phone, full address, signature raw data, unmasked photo, raw LINE user id, full customer payload, full appointment payload, raw AI prompt/context/response containing sensitive data.
- cross-organization or cross-tenant data in reports, exports, AI context, customer pages, scheduled reports, or audit viewers.

## Runtime Readiness Gate

Before any item in this roadmap becomes runtime work, the task must specify:

- exact editable files.
- whether backend `src/`, admin `src/`, API, migration, smoke tests, package scripts, provider sending, AI/RAG runtime, file access, or DB/DDL are allowed.
- organization scope, role, permission, field-level visibility, customer-visible data, audit log, and SaaS entitlement rules.
- synthetic test data strategy that avoids secrets, real customer details, raw LINE user ids, full payloads, and production data.
- verification commands and smoke coverage.
- what remains non-goal.

## Current-stage Decision

Task 854 is docs-only. It creates the roadmap baseline, guardrail summary, and future task candidates only.

Tasks 855-860 created pure foundational policy baselines for data classification, field-level visibility, export control, file access control, AI retrieval guard, and provider secret guard.

Task 861 adds the first pure integration guard proving those modules compose safely without runtime wiring. See `docs/task-861-iso-controls-foundational-policy-integration-guard-no-api-no-db.md`.

No runtime, API, DB, migration, provider, AI/RAG, admin UI, permission model, audit runtime, smoke test, package, or deployment behavior is changed by this document.
