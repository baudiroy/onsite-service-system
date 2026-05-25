# Task 282 - SaaS Plan / Entitlement / Usage Boundary Branch Kickoff / No Runtime Change

## Scope And Non-goals

This document opens a docs-only SaaS Plan / Entitlement / Usage Boundary design branch after the Data Access Control branch readiness closure in Task281.

The purpose is to clarify future boundaries among:

- plan,
- subscription,
- feature entitlement,
- user permission,
- organization membership,
- seat / account type,
- usage limit,
- usage tracking,
- AI Add-on,
- report / export entitlement,
- customer self-service entitlement,
- LINE / SMS / Email usage,
- file storage usage,
- API / webhook usage,
- Enterprise SSO future design.

Task282 is documentation-only.

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

Task282 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, subscription runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why This Branch Follows Data Access Control Readiness Closure

Task274 through Task281 clarified that all data reads, reports, exports, downloads, scheduled reports, customer self-service lookup, AI retrieval, and RAG retrieval must share a unified Data Access Control / Data Permission Model.

That branch established:

- data visibility is not the same as feature entitlement,
- permission is not the same as subscription state,
- usage tracking is not authorization,
- customer channel identity is not internal user seat,
- AI is not a permission exception,
- report/export/download cannot bypass data access controls.

The next design question is SaaS packaging and commercial boundary.

Future SaaS design must decide which organizations have which features, limits, seats, and add-ons without weakening the Data Access Control branch.

## SaaS Plan / Entitlement / Usage Branch Purpose

This branch should help future implementation avoid mixing:

- what a tenant purchased,
- whether the tenant subscription is active,
- which features are enabled,
- which user has permission,
- what type of seat the user consumes,
- how much usage remains,
- whether a feature flag is operationally enabled,
- whether sensitive data can be viewed,
- whether an action must be audited.

The branch should preserve this rule:

```text
SaaS entitlement controls feature availability.
Permission controls user action.
Data Access Control controls data visibility.
Usage controls quantity and cost.
None of these alone should authorize sensitive data access.
```

## Concept Map

The concepts below are proposal-only.

They are not:

- table names,
- schema proposals,
- API contracts,
- Admin UI routes,
- production enum values,
- billing engine classes,
- runtime feature gates.

| Concept | Primary purpose | What it controls | What it must not control | Runtime allowed now? |
| --- | --- | --- | --- | --- |
| Plan | Package of features and limits such as Basic / Professional / Business / Enterprise. | Baseline tenant feature availability and limits. | User-specific permissions or data visibility. | No |
| Subscription | Tenant commercial state such as trial, active, past_due, cancelled, expired. | Whether plan access is commercially valid. | Specific record visibility or role permissions. | No |
| Feature entitlement | Tenant-level feature availability or quota. | Whether an organization may use a feature. | Whether a specific user may operate it. | No |
| User permission | User-level action authorization. | Whether a user may view, edit, export, approve, manage, or configure. | Whether the organization purchased the feature. | No |
| Organization membership | Relationship between user and organization. | Whether a user belongs to a tenant and role context. | Full access to all records or features. | No |
| Seat / account type | Commercial / packaging category for user access. | Full user, field engineer, viewer/read-only, external/customer access. | Full permission or data visibility. | No |
| Usage limit | Quantity boundary for feature use. | Counts, quotas, included usage, overage limits. | Permission or data visibility. | No |
| Usage tracking | Measurement for SaaS cost / quota / audit readiness. | Metering events and usage categories. | Authorization to perform an action. | No |
| AI Add-on | Optional AI feature package and usage boundary. | AI feature availability and cost control. | Permission bypass, data access bypass, or AI auto-decision. | No |
| Report/export entitlement | Tenant-level feature availability for reporting/exporting. | Whether reports/exports are available by plan/add-on. | User export permission or data visibility. | No |
| Customer self-service entitlement | Tenant-level availability of customer-facing lookup / portal features. | Whether customer self-service is enabled. | Customer identity verification or customer-visible policy. | No |
| LINE / SMS / Email usage | Provider usage and cost control. | Notification/message count and provider cost tracking. | Sending permission, content safety, or channel identity scope. | No |
| File storage usage | Uploaded file / document / photo / signature storage tracking. | Storage quotas and cost tracking. | File visibility or download permission. | No |
| API / webhook usage | Integration usage and cost/rate control. | API call counts, webhook counts, limits. | Data access permission or provider secret access. | No |
| Enterprise SSO future design | Enterprise identity integration. | Authentication and enterprise login convenience. | Permission, organization isolation, audit, or data access. | No |

## Boundaries That Must Stay Separate

### Entitlement Does Not Equal Permission

Entitlement answers:

- Does this organization have this feature?

Permission answers:

- Can this user perform this action?

An organization may have export entitlement, but a specific user still needs export permission.

### Permission Does Not Equal Entitlement

A user may have a role that would normally allow an action, but if the organization lacks the feature entitlement, the feature should not be available.

### Subscription Active Does Not Equal User Can Operate

An active subscription keeps a plan commercially available. It does not grant every user every action.

### Usage Quota Not Exceeded Does Not Equal Data Visibility

Remaining quota means a feature is not blocked by usage limits. It does not decide which records or fields are visible.

### Seat Type Does Not Equal Complete Operation Permission

Seat type is a packaging and pricing concept.

Examples:

- Full User Seat may allow office/admin workflows after permissions are granted.
- Field Engineer Seat may focus on assigned jobs and completion workflow.
- Viewer Seat may allow limited read-only views.
- External / Customer Access must not become internal user permission.

Seat type still requires role, permission, scope, and visibility checks.

### Feature Flag Does Not Equal Formal Authorization

A feature flag controls rollout or kill switch state. It is not a substitute for subscription, entitlement, permission, data scope, visibility policy, audit, or usage controls.

### AI Add-on Does Not Bypass Data Access Control

AI Add-on may enable AI features and usage. It must not allow AI to:

- bypass permissions,
- retrieve unauthorized data,
- ignore organization scope,
- skip masking,
- use internal-only data for customer-visible output,
- write official records automatically,
- make business decisions.

### Enterprise SSO Does Not Bypass Security

Enterprise SSO may improve authentication and enterprise onboarding.

It must not bypass:

- organization isolation,
- membership resolution,
- role / permission checks,
- data access controls,
- audit log,
- field masking,
- usage tracking,
- ISO 27001-aligned guardrails.

## Future-only SaaS Capability Map

The capability map below is conceptual only. It is not a pricing table, contract, migration, API, or implementation plan.

| Future package / account type | Possible purpose | Possible features | Must still require | Runtime allowed now? |
| --- | --- | --- | --- | --- |
| Basic | Small service team core workflow. | Customers, Cases, appointments, basic dispatch, basic engineer completion, basic Field Service Report, basic audit. | Organization scope, permission, data visibility. | No |
| Professional | Role-separated operations team. | Multi-role permissions, dispatch board, multi-visit history, LINE binding, customer self-service, basic billing/settlement, satisfaction survey, SLA, customer fee consent. | Entitlement + user permission + data access. | No |
| Business | Multi-team, brand/vendor operational controls. | Vendor/brand rules, exception review, dashboards, quote approval, parts tracking, vehicle stock, exports, advanced audit, multi-branch. | Entitlement + role permission + audit. | No |
| Enterprise | Large organization / high-security / custom integration. | Custom seats, multiple organizations/branches, multiple LINE channels, SSO, SAML/OIDC, API access, custom roles, advanced audit, custom retention, higher AI limits. | Organization isolation + permission + audit + data access. | No |
| Full User Seat | Office/admin operating user. | Customer service, dispatch, supervisor, finance, admin workflows depending on permission. | Role/permission; seat alone is not access. | No |
| Field Engineer Seat | Onsite service user. | Today's appointments, arrival, photos, parts/serials, signature, completion workflow. | Assigned scope and engineer permission. | No |
| Viewer / Read-only Seat | Limited read or audit review. | Read-only dashboards or records where permitted. | Data scope, field masking, no write/export unless granted. | No |
| External / Customer Access | Customer-facing self-service. | Case status, appointment confirmation, quote/fee confirmation, survey, safe documents. | Customer channel identity, verification, customer-visible policy. | No |

## Guardrail Alignment Review

### Organization Isolation

All SaaS concepts remain tenant-scoped.

Plans, subscriptions, entitlements, usage, seats, provider settings, AI Add-ons, reports, exports, and SSO must not allow cross-organization data access.

### Permission / Entitlement / Subscription / Usage / Seat Separation

The branch must preserve the distinction between:

- what the organization owns,
- what the subscription permits,
- what the user can do,
- what data is visible,
- how much usage remains,
- what kind of seat the user consumes.

### Data Access Control Remains Authoritative For Data Visibility

Task274 through Task281 remain authoritative for data visibility.

SaaS plan or entitlement can enable a feature, but cannot decide which records or fields a user can see.

### Customer Channel Identity Is Not Internal Seat

Customer channel identity, LINE identity, SMS identity, Email identity, Web portal identity, and App identity are not Full User, Field Engineer, Viewer, Supervisor, Finance, or Admin seats.

Customer-facing access must continue to use customer-visible policy and safe deny.

### LINE Is Channel, Not Identity Model

LINE remains the current main channel, but SaaS design must not hard-code LINE as the only customer identity.

Raw `line_user_id` must remain scoped by:

```text
organization_id + line_channel_id + line_user_id
```

### AI Add-on Boundary

AI Add-on must be controlled by:

- entitlement,
- permission,
- usage tracking,
- organization scope,
- data access,
- field masking,
- audit,
- human-in-the-loop / official-record separation.

AI Add-on does not approve AI auto-dispatch, AI auto-completion, AI auto-settlement, AI fee decisions, complaint closure, or official-record write automation.

### Report / Export / Download / Scheduled Report Boundary

Future report/export/download/scheduled report features may be plan-gated, but they still require:

- base read permission,
- report/export/download permission,
- data scope,
- field masking,
- audit,
- usage tracking,
- scheduled report re-checks.

## Runtime Forbidden Confirmation

Task282 explicitly confirms that the following remain not approved:

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
- API changes,
- Admin changes,
- DB / migration / schema / index changes.

## Suggested Future Branch Tasks

The following are future docs-only or implementation-planning tasks. They are not approved by Task282:

1. SaaS concept definition matrix.
2. Plan / entitlement / permission separation matrix.
3. Seat / account type boundary design.
4. Usage category and metering taxonomy.
5. AI Add-on cost-control and entitlement boundary.
6. Report/export/download entitlement boundary.
7. Customer self-service entitlement boundary.
8. Notification provider usage and cost-control boundary.
9. File storage usage and retention boundary.
10. Enterprise SSO security boundary.
11. SaaS branch readiness gate review.

Each future task must explicitly state whether it is docs-only or runtime implementation.

## Non-goals

Task282 does not:

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

For Task282, verification is limited to documentation safety:

- `npm run check`,
- `npm run admin:check`,
- `git diff --check`,
- sensitive text scan for accidental secrets or real customer/provider data.

No smoke, DB, migration, API, Admin runtime, SaaS runtime, billing runtime, entitlement runtime, usage runtime, SSO runtime, provider sending, or inventory verification is required.

## Conclusion

Task282 opens the SaaS Plan / Entitlement / Usage Boundary branch as a docs-only scope map.

The branch principle is:

```text
Plan, subscription, entitlement, permission, seat, usage, feature flag,
AI Add-on, SSO, and data visibility are separate concepts.
They must work together, but none of them alone authorizes sensitive data access.
```

Task282 does not approve SaaS runtime implementation.
