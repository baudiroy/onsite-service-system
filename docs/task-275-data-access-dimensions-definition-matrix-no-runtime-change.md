# Task 275 - Data Access Dimensions Definition Matrix / No Runtime Change

## Scope And Non-goals

This document continues the Data Access Control / Data Permission Model branch opened in Task274.

The purpose is to define each future data-access dimension clearly enough that later report, export, scheduled report, customer self-service, AI retrieval, RAG, and SaaS entitlement work does not collapse separate concepts into one unsafe flag.

Task275 is documentation-only.

This task is not:

- permission runtime,
- entitlement runtime,
- subscription runtime,
- usage tracking runtime,
- report runtime,
- analytics runtime,
- export runtime,
- download runtime,
- scheduled report runtime,
- customer self-service lookup runtime,
- AI retrieval runtime,
- RAG runtime,
- vector DB implementation,
- embedding implementation,
- retrieval service,
- API contract,
- Admin UI,
- DB schema / migration proposal,
- automated test implementation.

Task275 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why Access Dimension Definitions Are Needed After Task274

Task274 established the branch principle:

```text
Data access is the foundation.
Reports, analytics, exports, downloads, scheduled reports, customer self-service,
AI retrieval, and RAG retrieval must share the same permission model.
```

The next risk is terminology drift.

If future implementation treats a role, entitlement, subscription, feature flag, usage limit, or audit requirement as if it were the same thing as permission, the platform can accidentally expose data or block legitimate work.

This is especially important because future workflows will include:

- normal record reads,
- list / search pages,
- supervisor dashboards and analytics,
- reports, exports, and downloads,
- scheduled reports,
- customer self-service lookup,
- AI retrieval and RAG retrieval,
- SaaS plan / entitlement / seat / usage controls,
- LINE / SMS / Email / Web portal / App channel identities.

The definitions below are future guidance only. They do not approve runtime implementation.

## Access Dimension Definitions Matrix

Legend:

- Yes = this dimension should be considered for the surface in future runtime design.
- Conditional = applies when the operation, feature, tenant, channel, or data class requires it.
- No = not the main control for that surface.
- Runtime allowed now = always No for Task275.

| Dimension | Dimension purpose | What it controls | What it must not control | Normal read | List / search | Dashboard / analytics | Report / export / download | Scheduled report | Customer self-service lookup | AI retrieval / RAG | Runtime allowed now |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Organization scope | Establish tenant boundary. | Which organization's data can be accessed. | It must not grant user permission by itself. | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No |
| User identity | Identify the actor. | Who is making the request or triggering a job. | It must not replace role, permission, or membership checks. | Yes | Yes | Yes | Yes | Yes | Conditional | Yes | No |
| Organization membership | Prove the actor belongs to the organization context. | Whether the user can act inside a tenant. | It must not imply all permissions in that organization. | Yes | Yes | Yes | Yes | Yes | No | Yes | No |
| Role | Provide broad job context. | Default UI surface, workflow emphasis, and role-level policy. | It must not replace granular permissions or data visibility. | Yes | Yes | Yes | Yes | Yes | Conditional | Yes | No |
| Permission | Authorize a specific action. | Whether a user may view, edit, approve, export, download, or manage something. | It must not mean the organization owns the feature. | Yes | Yes | Yes | Yes | Yes | Conditional | Yes | No |
| Report permission | Authorize report viewing or generation. | Whether a user may access report / analytics surfaces. | It must not override source record visibility or masking. | No | No | Yes | Yes | Yes | No | Conditional | No |
| Export permission | Authorize exporting data outside normal UI. | Whether a user may create export files or datasets. | It must not grant access to fields the user cannot view. | No | No | Conditional | Yes | Yes | No | Conditional | No |
| Download permission | Authorize file or generated artifact download. | Whether a user may download files, exports, attachments, or reports. | It must not bypass document scope, expiry, or masking. | Conditional | No | Conditional | Yes | Yes | Conditional | No | No |
| Feature entitlement | Confirm tenant feature availability. | Whether the organization has a feature enabled by plan, add-on, or custom entitlement. | It must not grant a specific user permission. | Conditional | Conditional | Yes | Yes | Yes | Conditional | Yes | No |
| Subscription status | Confirm commercial access state. | Whether the organization's plan status allows feature access. | It must not define record visibility or role permission. | Conditional | Conditional | Conditional | Conditional | Conditional | Conditional | Conditional | No |
| Usage limit | Enforce quotas and cost boundaries. | Whether a quota-sensitive action may proceed. | It must not define data visibility or customer/internal policy. | No | Conditional | Conditional | Conditional | Conditional | Conditional | Conditional | No |
| Seat / account type | Classify user account for SaaS plan / pricing / packaging. | Account category such as full user, engineer, viewer, external customer access. | It must not grant complete operation authority. | Conditional | Conditional | Conditional | Conditional | Conditional | Conditional | Conditional | No |
| Feature flag | Control rollout or kill switch state. | Whether a code path or feature is operationally enabled. | It must not be treated as formal authorization. | Conditional | Conditional | Conditional | Conditional | Conditional | Conditional | Conditional | No |
| Allowed case scope | Limit cases a user/channel can access. | Which Case records are visible. | It must not imply access to all customer fields or documents. | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Allowed customer scope | Limit customers a user/channel can access. | Which Customer records are visible. | It must not imply access to all cases, reports, or internal notes. | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Allowed document scope | Limit documents, files, and RAG sources. | Which documents, attachments, photos, signatures, or knowledge sources are visible. | It must not grant general record access. | Conditional | Conditional | Conditional | Yes | Yes | Conditional | Yes | No |
| Customer-visible data policy | Define safe customer-facing data. | What can be shown through LINE, App, Web portal, SMS, email, or customer-facing AI. | It must not expose internal-only data just because a customer is authenticated. | Conditional | Conditional | Conditional | Conditional | Conditional | Yes | Yes | No |
| Internal-only data policy | Define protected internal data. | What must remain internal to authorized roles only. | It must not be used in customer-facing output or unauthorized AI context. | Yes | Yes | Yes | Yes | Yes | No | Yes | No |
| Field-level masking | Redact or exclude sensitive fields. | How phone, address, names, signatures, photos, notes, billing data, and provider diagnostics appear. | It must not be treated as proof that the underlying data does not exist. | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Audit log requirement | Decide whether access or action must be logged. | Which access, report, export, download, AI retrieval, or scheduled delivery needs traceability. | It must not authorize the action by itself. | Conditional | Conditional | Yes | Yes | Yes | Conditional | Yes | No |
| SaaS usage tracking | Meter feature usage for future SaaS billing / limits. | Usage counts for reports, exports, downloads, scheduled reports, API, customer self-service, storage, notifications. | It must not store unnecessary sensitive payload or decide data visibility. | No | Conditional | Yes | Yes | Yes | Conditional | Conditional | No |
| AI Add-on usage tracking | Meter AI-specific usage and cost. | AI request count, retrieval count, token usage category, agent type, feature key. | It must not allow AI to bypass permission or view unauthorized data. | No | No | Conditional | Conditional | Conditional | Conditional | Yes | No |

## Concept Boundaries

### Permission Does Not Equal Entitlement

Permission answers:

- Can this user perform this action?

Entitlement answers:

- Does this organization own this feature or quota?

A user with export permission still cannot export if the organization lacks export entitlement. An organization with export entitlement still cannot let every user export unless those users have export permission.

### Entitlement Does Not Equal Permission

Entitlement is tenant-level availability. It does not prove that a specific user, engineer, viewer, customer, vendor, or channel identity can use the feature.

### Subscription Does Not Equal Permission

Subscription status may block or limit a feature, but it does not decide which records are visible or which fields are masked.

### Usage Limit Does Not Equal Data Visibility

Usage limit controls quantity and cost. It does not decide whether a user may see a Case, customer, report, file, RAG source, or internal note.

### Seat / Account Type Does Not Equal Full Operation Permission

A field engineer seat may allow engineer workflow access but should not imply finance, settlement, export, or supervisor permissions.

A viewer seat may allow read-only access but still requires allowed data scope and masking.

Customer channel identities are not internal seats.

### Feature Flag Does Not Equal Formal Authorization

A feature flag can enable, disable, or kill switch a code path. It must not replace permission, entitlement, scope, visibility, or audit checks.

### Audit Requirement Does Not Equal Allow

Audit logging records what happened or what was denied. It does not grant authority to perform the action.

### Field Masking Does Not Mean Data Does Not Exist

Masked fields still exist. They are simply hidden, redacted, or reduced for the current actor, output, or surface.

Future implementation must avoid treating masked values as missing data in official workflow decisions.

## Guardrail Alignment

### Organization Isolation First

Organization isolation must run before all other data operations.

This applies to:

- Admin UI,
- engineer app,
- API,
- reports,
- exports,
- downloads,
- scheduled reports,
- customer self-service lookup,
- AI retrieval,
- RAG retrieval,
- file access,
- provider diagnostics.

### Reports / Exports / Downloads Cannot Bypass Normal Data Permissions

Report, export, and download are higher-risk data operations.

They must not expose records, fields, files, internal notes, billing internals, settlement internals, audit logs, AI raw payloads, raw LINE user ids, or provider raw payloads that normal permission and data visibility would deny.

### Scheduled Reports Cannot Bypass Permissions

Scheduled report delivery must be treated as automation of report / export / download, not a shortcut.

Future implementation should re-check:

- organization scope,
- report / export permission,
- recipient authorization,
- field masking,
- customer-visible / internal-only policy,
- audit requirement,
- usage tracking.

### Customer Self-service Lookup Cannot See Internal-only Data

Customer self-service through LINE, Web portal, App, SMS, or email must use a customer-visible policy.

It must not expose:

- internal note,
- audit log,
- billing internal data,
- settlement internal data,
- supervisor review note,
- engineer internal comment,
- AI raw payload,
- internal risk flag,
- provider diagnostics,
- raw LINE user id.

### AI Retrieval / RAG Cannot Query Unfiltered Data

AI and RAG must use permission-aware retrieval.

Future AI retrieval must not:

- directly query unfiltered DB,
- directly query unfiltered vector DB,
- cross organization / tenant boundaries,
- place unauthorized data into prompt context,
- use internal-only sources for customer-facing answers,
- rely on a higher SaaS plan to loosen security.

RAG retrieval must go through organization filter, source visibility filter, permission-aware filter, sensitive-data masking, audit classification, and usage classification.

### Customer Channel Identity Is Not Internal User Seat

Customer channel identities must remain separate from internal users and SaaS seats.

Customer identities may include:

- LINE identity,
- SMS / phone verification context,
- email verification context,
- Web portal identity,
- App identity.

These identities may access customer-visible information only after verification and scope checks. They do not become internal users, full seats, engineers, finance users, or supervisors.

### Generic Channel Identity Boundary

LINE, SMS, Email, Web portal, and App must use generic channel identity boundaries where possible.

LINE must not be hard-coded as the only customer identity model.

Raw `line_user_id` must not be treated as global identity; it must remain scoped by `organization_id + line_channel_id + line_user_id`.

## Future-only Validation Flow

The flow below is conceptual only. It is not runtime implementation.

```text
Request or job starts
-> identify actor
-> resolve organization context
-> resolve organization membership or customer channel identity
-> check role
-> check permission
-> check feature entitlement
-> check subscription status
-> check usage limit where applicable
-> resolve allowed case / customer / document scope
-> apply customer-visible / internal-only policy
-> apply field-level masking / redaction
-> classify audit requirement
-> classify SaaS usage tracking requirement
-> deny safely if any required gate fails
-> allow the minimum necessary data operation
```

Fail-closed principle:

- If organization scope is missing, deny.
- If membership / identity cannot be resolved, deny.
- If permission is missing, deny.
- If entitlement is required and missing, deny.
- If usage limit blocks the action, deny or route to approved limit handling.
- If visibility policy is ambiguous, deny or mask.
- If field masking cannot be applied safely, deny.
- If AI retrieval cannot be filtered safely, deny.

## Future Test Ideas

These are future test ideas only. Task275 does not add tests.

Future coverage should include:

- organization isolation denies cross-tenant reads,
- report/export cannot include records denied in normal read,
- export cannot include masked fields without export-specific permission,
- scheduled report re-checks permissions at generation time,
- customer self-service cannot read internal-only data,
- AI retrieval cannot access unfiltered DB records,
- RAG retrieval cannot omit organization filter,
- feature flag enabled but permission missing still denies,
- entitlement present but permission missing still denies,
- permission present but entitlement missing still denies,
- usage limit reached prevents quota-bound action,
- customer channel identity does not become internal seat,
- field masking does not alter official record values,
- audit events do not store sensitive payload.

## Non-goals

Task275 does not:

- modify backend `src/`,
- modify Admin `admin/src/`,
- add or modify API routes,
- add or modify migrations / schema / indexes,
- connect to DB,
- execute DDL,
- execute `psql`,
- execute `npm run db:migrate`,
- run Migration020 dry-run or apply,
- add permission runtime,
- add entitlement runtime,
- add subscription runtime,
- add usage runtime,
- add report / analytics runtime,
- add export / download runtime,
- add scheduled report runtime,
- add customer self-service lookup runtime,
- add AI retrieval / RAG runtime,
- add retrieval service,
- add vector DB,
- add embedding,
- add indexer,
- modify tests / smoke / fixtures,
- modify `package.json`,
- modify inventory docs,
- touch provider sending,
- send LINE / SMS / Email / APP notifications,
- expose sensitive data.

## Verification Plan

For Task275, verification is limited to documentation safety:

- `npm run check`,
- `npm run admin:check`,
- `git diff --check`,
- sensitive text scan for accidental secrets or real customer/provider data.

No smoke, DB, migration, API, Admin runtime, AI runtime, RAG runtime, report runtime, export runtime, scheduled report runtime, provider sending, or inventory verification is required.

## Conclusion

Task275 defines the access dimensions for the Data Access Control branch.

The main rule is:

```text
Permission, entitlement, subscription, usage, seat type, feature flag,
visibility policy, masking, audit, and usage tracking are separate dimensions.
They must work together, but they must not be collapsed into one unsafe flag.
```

Task275 is docs-only access-dimension guidance and does not approve permission, entitlement, usage, report, export, download, scheduled report, customer self-service, AI retrieval, or RAG runtime.
