# Task 003 Admin Ops Tables Design

## Scope

This design adds phase 1 admin and operations foundation tables:

- `dispatch_units`
- `users`
- `roles`
- `user_roles`
- `permissions`
- `role_permissions`

These tables support admin review, basic dispatch unit management, least-privilege access control, and ISO 27001-oriented account governance. They do not implement a full dispatch workflow, engineer on-site workflow, billing reconciliation, or APIs.

## Migration Order Note

The finalized `cases` v1 table references `dispatch_units(id)` and `users(id)`, while Task 002 `audit_logs` records user and dispatch-unit changes polymorphically. In a fresh baseline database, create `customers`, `dispatch_units`, and `users` before `cases`, then create the remaining case, attachment, message, audit, role, and permission tables. This Task 003 migration documents the admin/ops tables without refactoring existing migrations.

## dispatch_units

### Purpose

`dispatch_units` stores dispatch unit master data for phase 1 admin review and routing preview. It supports rule-assisted and AI-assisted dispatch suggestions without storing full dispatch assignment history.

### Field List

| Field | Type | Nullable | Reason |
|---|---|---:|---|
| `id` | `uuid` | no | Primary key. |
| `name` | `text` | no | Human-readable dispatch unit name. |
| `code` | `text` | no | Stable business code for integration and admin lookup. |
| `service_region` | `text` | yes | Operational region such as north, central, south, or a company-defined area. |
| `city` | `text` | yes | City covered by the dispatch unit. |
| `product_types` | `text[]` | no | Product categories this unit can handle. |
| `enabled` | `boolean` | no | Allows disabling a unit without deleting it. |
| `priority` | `integer` | no | Sorting and routing preference. Lower values can be treated as higher priority by the application. |
| `routing_rules` | `jsonb` | yes | Flexible first-phase routing hints. Must not become a hidden workflow engine. |
| `metadata` | `jsonb` | yes | Low-risk migration or integration metadata. |
| `created_at` | `timestamptz` | no | Creation timestamp. |
| `updated_at` | `timestamptz` | no | Automatically maintained on update. |
| `deleted_at` | `timestamptz` | yes | Soft-delete marker. |

### Relationships

- `cases.dispatch_unit_id` can reference `dispatch_units.id`.
- `cases.ai_suggested_dispatch_unit_id` can reference `dispatch_units.id`.
- Future `dispatches` may reference `dispatch_units.id` when the full dispatch workflow is introduced.

### What Should Not Be Placed In `dispatch_units`

- Individual engineer service histories.
- Complete dispatch assignment history.
- On-site reports, photos, signatures, or billing data.
- Long-term formal routing fields hidden permanently in `routing_rules`.

### Future Extension Notes

Future routing may move from `routing_rules` into dedicated rule tables. Full dispatch history belongs in future `dispatches`, not in `dispatch_units`.

## users

### Purpose

`users` stores backend, operations, engineer-login, and system account identities. It does not store all permissions directly; access is managed through roles and permissions.

### Field List

| Field | Type | Nullable | Reason |
|---|---|---:|---|
| `id` | `uuid` | no | Primary key. |
| `display_name` | `text` | no | User-facing name in admin and audit logs. |
| `email` | `text` | yes | Login/contact email. Unique among active, non-deleted users when present. |
| `mobile` | `text` | yes | Optional contact phone. |
| `user_type` | `text` | no | Account category: admin, customer service, dispatch manager, engineer, auditor, or system. |
| `status` | `text` | no | Account lifecycle state; supports disabling users. |
| `password_hash` | `text` | yes | Password hash only. Never store plaintext passwords. Nullable for external auth or system-only accounts. |
| `auth_provider` | `text` | no | Authentication provider, such as password, Google, Microsoft, LINE, or system. |
| `external_auth_id` | `text` | yes | Provider-specific external user id. |
| `last_login_at` | `timestamptz` | yes | Last successful login timestamp. |
| `metadata` | `jsonb` | yes | Low-risk profile or migration metadata. Must not drive formal permissions. |
| `created_at` | `timestamptz` | no | Creation timestamp. |
| `updated_at` | `timestamptz` | no | Automatically maintained on update. |
| `deleted_at` | `timestamptz` | yes | Soft-delete marker. |

### Relationships

- `cases.created_by` and `cases.updated_by` can reference `users.id`.
- `user_roles.user_id` references `users.id`.
- `user_roles.assigned_by` and `role_permissions.granted_by` can reference `users.id`.
- `audit_logs.actor_id` may point to a user when `actor_type` is admin, engineer, system, or API.

### What Should Not Be Placed In `users`

- Plaintext passwords.
- Full permission flags or one column per permission.
- Complete engineer profile, skills, settlement rules, or service history.
- Customer profile data.

### Future Extension Notes

Full engineer data can move to a future `engineers` table linked to `users.id`. SSO, MFA, password rotation, device sessions, and login history should be separate future security tables.

## roles

### Purpose

`roles` stores reusable access-control roles. Roles group permissions and are assigned to users through `user_roles`.

### Field List

| Field | Type | Nullable | Reason |
|---|---|---:|---|
| `id` | `uuid` | no | Primary key. |
| `role_key` | `text` | no | Stable role key, such as admin or customer_service. |
| `name` | `text` | no | Human-readable role name. |
| `description` | `text` | yes | Role purpose and intended assignment guidance. |
| `enabled` | `boolean` | no | Allows disabling a role without deleting it. |
| `metadata` | `jsonb` | yes | Low-risk migration or display metadata. |
| `created_at` | `timestamptz` | no | Creation timestamp. |
| `updated_at` | `timestamptz` | no | Automatically maintained on update. |
| `deleted_at` | `timestamptz` | yes | Soft-delete marker. |

### Relationships

- `user_roles.role_id` references `roles.id`.
- `role_permissions.role_id` references `roles.id`.

### What Should Not Be Placed In `roles`

- User lists.
- Permission details beyond role metadata.
- Case, dispatch, engineer, or billing records.

### Future Extension Notes

Default roles can include `admin`, `customer_service`, `dispatch_manager`, `engineer`, `auditor`, and `system`. Role changes should be recorded in `audit_logs` by application behavior.

## user_roles

### Purpose

`user_roles` stores the many-to-many relationship between users and roles. It supports assignment and revocation tracking while preventing duplicate active role grants.

### Field List

| Field | Type | Nullable | Reason |
|---|---|---:|---|
| `id` | `uuid` | no | Primary key. |
| `user_id` | `uuid` | no | User receiving the role. |
| `role_id` | `uuid` | no | Assigned role. |
| `assigned_by` | `uuid` | yes | User who assigned the role. |
| `assigned_at` | `timestamptz` | no | Assignment timestamp. |
| `revoked_at` | `timestamptz` | yes | Revocation timestamp. |
| `metadata` | `jsonb` | yes | Low-risk assignment metadata. |
| `created_at` | `timestamptz` | no | Creation timestamp. |
| `updated_at` | `timestamptz` | no | Automatically maintained on update. |
| `deleted_at` | `timestamptz` | yes | Soft-delete marker. |

### Relationships

- `user_roles.user_id` references `users.id`.
- `user_roles.role_id` references `roles.id`.
- `user_roles.assigned_by` optionally references `users.id`.

### What Should Not Be Placed In `user_roles`

- Permission definitions.
- Case or dispatch visibility rules.
- Complete audit history; assignment and revocation should also be logged to `audit_logs`.

### Future Extension Notes

Future access control may add scoped roles by service region or dispatch unit. Do not add that complexity in phase 1 unless the workflow requires it.

## permissions

### Purpose

`permissions` stores atomic permission definitions used by roles. Permissions should be named in a module-action format such as `cases.read` or `dispatch_units.manage`.

### Field List

| Field | Type | Nullable | Reason |
|---|---|---:|---|
| `id` | `uuid` | no | Primary key. |
| `permission_key` | `text` | no | Stable permission key, recommended as `{module}.{action}`. |
| `module` | `text` | no | Functional area, such as cases or users. |
| `action` | `text` | no | Allowed action, such as read, update, review, accept, or manage. |
| `description` | `text` | yes | Human-readable permission purpose. |
| `enabled` | `boolean` | no | Allows disabling a permission without deleting it. |
| `metadata` | `jsonb` | yes | Low-risk display or migration metadata. |
| `created_at` | `timestamptz` | no | Creation timestamp. |
| `updated_at` | `timestamptz` | no | Automatically maintained on update. |
| `deleted_at` | `timestamptz` | yes | Soft-delete marker. |

### Relationships

- `role_permissions.permission_id` references `permissions.id`.

### What Should Not Be Placed In `permissions`

- User assignments.
- Role assignments.
- Business records or workflow data.
- Dynamic policy expressions hidden in `metadata`.

### Future Extension Notes

Suggested initial permission keys include `cases.read`, `cases.update`, `cases.review`, `cases.accept`, `customers.read`, `attachments.read`, `dispatch_units.manage`, `audit_logs.read`, and `users.manage`.

## role_permissions

### Purpose

`role_permissions` stores the many-to-many relationship between roles and permissions. It supports grant and revocation tracking while preventing duplicate active grants.

### Field List

| Field | Type | Nullable | Reason |
|---|---|---:|---|
| `id` | `uuid` | no | Primary key. |
| `role_id` | `uuid` | no | Role receiving the permission. |
| `permission_id` | `uuid` | no | Granted permission. |
| `granted_by` | `uuid` | yes | User who granted the permission. |
| `granted_at` | `timestamptz` | no | Grant timestamp. |
| `revoked_at` | `timestamptz` | yes | Revocation timestamp. |
| `metadata` | `jsonb` | yes | Low-risk grant metadata. |
| `created_at` | `timestamptz` | no | Creation timestamp. |
| `updated_at` | `timestamptz` | no | Automatically maintained on update. |
| `deleted_at` | `timestamptz` | yes | Soft-delete marker. |

### Relationships

- `role_permissions.role_id` references `roles.id`.
- `role_permissions.permission_id` references `permissions.id`.
- `role_permissions.granted_by` optionally references `users.id`.

### What Should Not Be Placed In `role_permissions`

- User-specific overrides.
- Business workflow data.
- Audit trail details beyond grant and revocation timestamps.

### Future Extension Notes

Permission changes should be recorded in `audit_logs`. Future policy engines or scoped permissions can be introduced later without changing the phase 1 RBAC baseline.

## Security Notes

- Use least privilege: assign permissions to roles, then assign roles to users.
- Disable users through `users.status`; do not delete operational history.
- Do not store plaintext passwords in `users`.
- Use partial unique indexes for active email, role, and permission assignments so soft delete and revocation remain auditable.
- Role and permission changes should be recorded in `audit_logs` by the application layer.
- `metadata` must not be used as a formal permission source.

## Future Enhancement Roadmap

These notes are future enhancements only. They should not change the phase 1 schema or introduce multi-tenant, full authentication, workflow-engine, or advanced RBAC complexity too early.

### Organization / Tenant Readiness

Future SaaS readiness may add identifiers such as `organization_id`, `tenant_id`, or `company_id`. Phase 1 should not add multi-tenant complexity.

### MFA / Authentication Security

Future authentication security may add `mfa_enabled`, `password_changed_at`, `failed_login_count`, `locked_at`, and session management. Phase 1 should not overbuild the auth system.

### Password Hash Policy

Future credential policy should formally define bcrypt or Argon2 usage, password rotation, and password/credential rules.

### RBAC Caching Strategy

Future permission lookup optimization may add a cache layer, role versioning, or permission snapshots. Phase 1 does not need this optimization.

### Scoped Permissions

Future authorization may need service-region scope, dispatch-unit scope, or company scope. Phase 1 keeps RBAC global and flat.

### Dispatch Rule Engine Separation

Future routing may split `routing_rules` into tables such as `dispatch_rules`, `dispatch_conditions`, and `dispatch_priorities`. Phase 1 should not create a workflow engine.

Future `dispatch_units` may also need structured fields or related tables for `business_hours`, `holiday_policy`, and `supported_brands`. These would help AI or rule-based routing decide whether a dispatch unit is open, supports a specific brand, accepts holiday work, or requires manufacturer authorization. Phase 1 should not add these columns yet, and `routing_rules` should not become a complete workflow engine.

### Engineer Profile Separation

Future `engineers` tables may include skills, certifications, service regions, work schedules, and settlement configs. These should not be packed into `users`.

### Audit Immutability

Future role and permission changes should support append-only audit, signed audit records, and immutable retention.

### Permission Naming Governance

Future permission governance should define naming conventions, module ownership, and deprecated-permission policy to avoid permission chaos.

### Soft Delete Governance

Future `deleted_at` usage should be paired with retention policy, archive jobs, legal hold, and recovery policy.

### Role Hierarchy

Future RBAC may support inherited roles, composite roles, or temporary elevation. Phase 1 keeps RBAC flat.

### Operational Region Modeling

Future `service_region` may move into a `service_regions` table with geographic mapping and SLA zones. Phase 1 keeps it as text.

### Independent Engineers Table

Future engineer profiles should live in an `engineers` table independent from `users`. `users` remains the login/account identity table, while `engineers` can hold skills, certifications, service regions, schedules, and settlement-related configuration.

### Service Regions Table

Future operational region modeling may move from `dispatch_units.service_region` into a dedicated `service_regions` table. `dispatch_units.service_region` remains a phase 1 text field and should not become the full geographic/SLA model.

### Notification Settings Separation

Future notification settings should not be packed into `users` or `dispatch_units`. Use future tables such as `notification_preferences`, `notification_channels`, or `notification_logs` for user, team, and dispatch-unit notification behavior.
