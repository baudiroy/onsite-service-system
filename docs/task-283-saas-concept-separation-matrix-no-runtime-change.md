# Task 283 - SaaS Concept Separation Matrix / No Runtime Change

## Scope And Non-goals

This document continues the SaaS Plan / Entitlement / Usage Boundary branch opened in Task282.

The purpose is to define a docs-only separation matrix for SaaS concepts so future implementation does not confuse commercial packaging, user authorization, data visibility, usage metering, rollout flags, AI Add-ons, or Enterprise SSO.

Task283 is documentation-only.

This task is not:

- subscription runtime,
- payment runtime,
- invoice runtime,
- SaaS billing runtime,
- entitlement runtime,
- permission runtime,
- usage metering runtime,
- seat management runtime,
- feature flag runtime,
- AI Add-on runtime,
- SSO runtime,
- report / export / download runtime,
- scheduled report runtime,
- customer self-service lookup runtime,
- AI retrieval runtime,
- RAG runtime,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation.

Task283 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, subscription runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why SaaS Concept Separation Is Needed After Task282

Task282 opened the SaaS Plan / Entitlement / Usage Boundary branch and established that plan, subscription, entitlement, permission, seat, usage, feature flag, AI Add-on, SSO, and data visibility are separate concepts.

This task turns that principle into a concept separation matrix.

Without explicit separation, future implementation may accidentally:

- treat an active subscription as permission,
- treat entitlement as user authorization,
- treat a seat type as full access,
- treat usage quota as data visibility,
- treat feature flag as security authorization,
- treat AI Add-on as permission to bypass Data Access Control,
- treat Enterprise SSO as organization membership and permission,
- treat customer channel identity as an internal seat.

Task283 defines these distinctions only. It does not approve runtime implementation.

## Concept Definitions

### Plan

Plan is the future commercial package an organization may subscribe to, such as Basic, Professional, Business, or Enterprise.

Plan may define baseline feature availability and limits.

### Subscription

Subscription is the organization's commercial state for a plan, such as trial, active, past_due, cancelled, or expired.

Subscription may affect whether plan features are available.

### Account / Organization

Account / organization is the tenant boundary for customer company data, users, settings, provider configuration, usage, and billing in future SaaS design.

### Organization Membership

Organization membership links a user to an organization and role context.

Membership does not grant every permission or all data visibility.

### User Permission

User permission authorizes a user to perform a specific action within an organization and scope.

### Feature Entitlement

Feature entitlement defines whether an organization has access to a feature or quota through plan, add-on, custom contract, or admin configuration.

### Seat / Account Type

Seat / account type is a future packaging and pricing concept for user access categories.

Examples:

- Full User Seat,
- Field Engineer Seat,
- Viewer / Read-only Seat,
- External / Customer Access.

### Usage Limit

Usage limit defines quota or cost boundary for a feature.

Examples:

- AI requests,
- LINE push count,
- SMS count,
- email count,
- file storage,
- export count,
- API calls,
- webhook calls.

### Usage Tracking

Usage tracking records usage for future metering, reporting, cost control, quota enforcement, or billing.

Usage tracking must not store unnecessary sensitive payload.

### Feature Flag

Feature flag controls rollout, kill switch, or operational enablement.

Feature flag is not formal authorization.

### AI Add-on

AI Add-on is a future commercial / entitlement boundary for AI features and usage.

It does not allow AI to bypass data access, masking, audit, or official-record separation.

### Report / Export Entitlement

Report/export entitlement defines whether an organization has access to report/export capabilities.

It does not replace user-level report/export permissions or data access checks.

### Customer Self-service Entitlement

Customer self-service entitlement defines whether an organization has customer-facing lookup / portal / channel capabilities.

It does not replace customer identity verification, customer-visible policy, or safe deny.

### Enterprise SSO Future Design

Enterprise SSO is a future authentication integration for enterprise customers.

It does not replace organization membership, role, permission, data access, audit, or usage controls.

## Separation Matrix

| Concept A | Concept B | Why they differ | What concept A may control | What concept B may control | Common implementation risk | Required guardrail | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Plan | Subscription | Plan is a package; subscription is the tenant's commercial state for that package. | Baseline features and limits. | Active/trial/past_due/cancelled/expired state. | Treating a plan definition as proof the tenant currently has access. | Check subscription state in addition to plan. | No |
| Subscription | Entitlement | Subscription is commercial state; entitlement is feature availability. | Whether plan access is commercially valid. | Whether a specific feature/quota is available. | Assuming active subscription means all features are enabled. | Check feature entitlement separately. | No |
| Entitlement | Permission | Entitlement is tenant-level; permission is user-level. | Organization feature availability. | User action authorization. | Letting every user use a feature because the organization owns it. | Require both entitlement and permission. | No |
| Permission | Role | Permission is action-specific; role is broad job context. | Specific action allowance. | Default workflow / UX / policy context. | Granting all actions to a role without granular permissions. | Use role as context, permission as action gate. | No |
| Role | Seat type | Role describes job function; seat type is packaging/pricing. | UX, workflows, default policy. | Commercial category such as full user/engineer/viewer. | Treating paid seat category as role authority. | Resolve role/permission separately from seat. | No |
| Seat type | User permission | Seat is commercial; permission is authorization. | Packaging, pricing, limits, account category. | What the user can do. | Field engineer seat gets finance/admin permissions by accident. | Seat type must not grant operations by itself. | No |
| Usage limit | Data visibility | Usage limit is quantity/cost; data visibility is access policy. | Quotas, included usage, overage controls. | Which records/fields are visible. | Remaining quota used as reason to expose data. | Data Access Control remains authoritative. | No |
| Feature flag | Entitlement | Feature flag is rollout/ops; entitlement is tenant ownership. | Enable/disable code path operationally. | Tenant access to feature by plan/add-on. | Feature flag on exposes feature to all tenants. | Require entitlement even when flag is on. | No |
| AI Add-on | AI permission | AI Add-on is tenant feature/cost boundary; AI permission is user action authorization. | AI feature availability and quota. | Whether user may invoke AI task. | AI Add-on lets unauthorized users retrieve data. | Require AI entitlement, user permission, Data Access Control, masking, audit, usage. | No |
| Report/export entitlement | Report/export permission | Entitlement enables feature for tenant; permission authorizes user action. | Tenant access to reports/exports. | User report/export action. | Any user exports because tenant plan includes export. | Require entitlement + permission + data visibility. | No |
| Customer self-service entitlement | Customer channel identity verification | Entitlement enables customer-facing feature; verification proves customer/channel relationship. | Whether tenant may offer self-service. | Whether a customer identity can access specific customer-visible data. | Self-service enabled exposes data without verification. | Require verification, organization scope, safe deny, visibility policy. | No |
| Enterprise SSO | Organization membership / permission | SSO authenticates; membership/permission authorize. | Enterprise login integration. | Tenant membership and actions. | SSO login becomes automatic access to all organizations/features. | SSO must map to membership, role, permission, audit. | No |

## Explicit Rules

- Entitlement does not equal permission.
- Permission does not equal entitlement.
- Subscription active does not mean any user can operate.
- Usage quota not exceeded does not mean data is visible.
- Seat type does not equal complete operation permission.
- Feature flag does not equal formal authorization.
- AI Add-on does not mean AI may bypass Data Access Control.
- Enterprise SSO must not bypass organization isolation, membership, permission, or audit.
- Customer channel identity must not be treated as an internal user seat.
- Data Access Control remains authoritative for data visibility.

## Interaction With Data Access Control Branch

Task274 through Task281 remain authoritative for data visibility.

SaaS branch concepts can decide whether features are available or metered, but they cannot decide which data may be seen.

### Report / Export / Download / Scheduled Report

Future report/export/download/scheduled report flows must check:

- organization scope,
- user permission,
- feature entitlement,
- subscription status where applicable,
- usage limit where applicable,
- source data scope,
- field masking,
- audit requirement,
- usage tracking.

### AI / RAG Retrieval

Future AI/RAG retrieval must check:

- `organization_id` filter,
- permission-aware filter,
- feature entitlement,
- AI Add-on availability,
- usage tracking,
- source visibility,
- minimum necessary context,
- masking/redaction,
- audit.

AI Add-on does not approve AI auto-decision or official-record writes.

### Customer Self-service

Future customer self-service must check:

- customer self-service entitlement,
- verified customer channel identity,
- organization scope,
- customer-visible data policy,
- safe deny / non-enumeration,
- field masking,
- audit where required.

Customer channel identity must not become an internal user seat.

## SaaS-ready Future Design Notes

The following examples are future-only and must not be hard-coded into runtime by Task283.

### Plan Examples

- Basic,
- Professional,
- Business,
- Enterprise.

These can be future plan examples but are not current runtime plans.

### Seat Examples

- Full User Seat,
- Field Engineer Seat,
- Viewer / Read-only Seat,
- External / Customer Access.

These can be future seat examples but are not current runtime seats.

### Usage-tracked Capability Examples

- AI Add-on usage,
- API / webhook usage,
- LINE push,
- SMS,
- Email,
- file storage,
- report generation,
- export/download,
- scheduled reports,
- customer self-service lookup.

These can be future usage categories but are not current usage runtime.

## Guardrail Alignment

### Organization Isolation

All SaaS concepts must be scoped to organization/tenant.

Plan, subscription, entitlement, usage, seats, AI Add-ons, provider settings, SSO, and exports must not allow cross-tenant data access.

### AI-ready Boundary

AI remains advisory and human-controlled.

AI Add-on does not approve:

- AI auto-dispatch,
- AI auto-completion,
- AI auto-settlement,
- AI fee decisions,
- AI complaint closure,
- AI official-record write automation.

### Customer Identity Boundary

Customer channel identity is not internal membership.

LINE is a channel, not the identity model.

Raw `line_user_id` must remain scoped by:

```text
organization_id + line_channel_id + line_user_id
```

### Security Boundary

Higher plan, Enterprise SSO, AI Add-on, or custom entitlement must not weaken:

- organization isolation,
- permission checks,
- data visibility,
- masking,
- audit,
- customer-visible / internal-only separation,
- ISO 27001-aligned guardrails.

## Future Test Ideas

These are future test ideas only. Task283 does not add tests.

Future coverage should include:

- active subscription but missing entitlement denies feature,
- entitlement present but permission missing denies action,
- permission present but entitlement missing denies feature,
- feature flag on but entitlement missing denies feature,
- usage quota remaining but data scope missing denies access,
- Field Engineer Seat cannot access finance exports,
- Viewer Seat cannot write or export without explicit permission,
- customer channel identity cannot become internal user,
- AI Add-on entitlement cannot bypass Data Access Control,
- Enterprise SSO user still requires organization membership and permissions.

## Non-goals

Task283 does not:

- modify backend `src/`,
- modify Admin `admin/src/`,
- add or modify API routes,
- add or modify migrations / schema / indexes,
- connect to DB,
- execute DDL,
- execute `psql`,
- execute `npm run db:migrate`,
- run Migration020 dry-run or apply,
- add subscription runtime,
- add payment runtime,
- add invoice runtime,
- add SaaS billing runtime,
- add entitlement runtime,
- add permission runtime,
- add usage metering runtime,
- add seat management runtime,
- add feature flag runtime,
- add AI Add-on runtime,
- add SSO runtime,
- add report / export / download runtime,
- add scheduled report runtime,
- add customer self-service lookup runtime,
- add AI retrieval / RAG runtime,
- modify tests / smoke / fixtures,
- modify `package.json`,
- modify inventory docs,
- touch provider sending,
- send LINE / SMS / Email / APP notifications,
- expose sensitive data.

## Verification Plan

For Task283, verification is limited to documentation safety:

- `npm run check`,
- `npm run admin:check`,
- `git diff --check`,
- sensitive text scan for accidental secrets or real customer/provider data.

No smoke, DB, migration, API, Admin runtime, SaaS runtime, billing runtime, entitlement runtime, usage runtime, SSO runtime, provider sending, or inventory verification is required.

## Conclusion

Task283 defines the SaaS concept separation matrix.

The key rule is:

```text
Plan, subscription, entitlement, permission, seat, usage, feature flag,
AI Add-on, SSO, and data visibility are different concepts.
Do not collapse them into one unsafe authorization flag.
```

Task283 is docs-only concept separation guidance and does not approve SaaS runtime implementation.
