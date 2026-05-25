# Task 285 - SaaS Seat / Account Type Boundary Matrix / No Runtime Change

## Scope And Non-goals

This document continues the SaaS Plan / Entitlement / Usage Boundary branch after Task282 through Task284.

The purpose is to define future-only seat / account type boundaries so future SaaS packaging does not confuse seat type, user role, permission, Data Access Control, customer channel identity, usage tracking, or Enterprise SSO.

Task285 is documentation-only.

This task is not:

- seat management runtime,
- account billing runtime,
- subscription runtime,
- payment runtime,
- invoice runtime,
- SaaS billing runtime,
- entitlement runtime,
- permission runtime,
- usage metering runtime,
- feature flag runtime,
- customer self-service runtime,
- Engineer App runtime,
- mobile web runtime,
- SSO runtime,
- AI Add-on runtime,
- report / export / download runtime,
- scheduled report runtime,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- smoke / test implementation.

Task285 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, subscription runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why Seat / Account Type Boundaries Are Needed After Task284

Task284 defined future plan feature entitlement direction.

The next risk is treating a seat type as if it were a role, permission, or data access policy.

Future SaaS packaging may need different account types such as full office users, field engineers, viewers, customer access, and service/system actors. These account types may influence pricing, UI shape, limits, or identity flow, but they must not replace authorization or Data Access Control.

Task285 defines those boundaries only. It does not approve any runtime implementation.

## Seat / Account Type Definitions

These definitions are future design notes only. They are not database schema, billing rules, permission enums, API contracts, Admin UI routes, or production seat products.

### Full User Seat

Full User Seat may represent an internal office or management user who can access broader platform workflows after proper organization membership, role, permission, entitlement, Data Access Control, and masking checks.

Possible users:

- customer service,
- dispatch,
- supervisor,
- finance,
- administrator.

### Field Engineer Seat

Field Engineer Seat may represent a field technician account focused on assigned jobs and the future Engineer Mobile App / mobile web workflow.

This seat should support simple field service execution without increasing engineer form burden.

Possible workflows:

- today's schedule,
- next stop,
- arrival report,
- photos,
- parts / serial number notes,
- customer signature,
- visit result,
- concise completion input.

### Viewer / Read-only Seat

Viewer / Read-only Seat may represent an internal or partner user who can inspect limited information but cannot mutate operational records.

Read-only still means scoped, masked, audited, and permission-controlled.

### External / Customer Access

External / Customer Access is customer-facing access through LINE, APP, web portal, SMS / email link, or other verified customer channel.

It is not an internal user seat and must be restricted to customer-visible data only.

### Service / System Actor

Service / system actor is a future concept for scheduled jobs, integration actors, provider callbacks, workflow workers, or automation tasks.

It is not a human seat and must not become a cross-organization super account.

Any future service/system actor must be constrained by organization scope, purpose-specific policy, audit, usage tracking, and least privilege.

## Boundary Principles

- Seat type does not equal permission.
- Seat type does not equal role.
- Seat type does not equal Data Access visibility.
- Organization entitlement does not mean a seat has been allocated.
- Seat allocation does not mean a user can operate every feature.
- Customer channel identity must not be treated as an internal user seat.
- Field Engineer Seat must support future Engineer Mobile App / mobile web workflows without increasing engineer form burden.
- External / Customer Access may only see customer-visible data.
- External / Customer Access must never see internal-only data.
- Service / system actor must be constrained by organization scope, permission-like policy, audit, and usage tracking.
- Enterprise SSO can authenticate but cannot authorize by itself.
- Data Access Control remains authoritative for data visibility.

## Future-only Seat Boundary Matrix

This matrix is intentionally conservative. It describes future boundary guidance only.

| Seat / account type | Intended actor | Possible future use cases | May access Admin UI? | May access Engineer Mobile / field flow? | May access customer self-service? | Requires organization membership? | Requires role / permission? | Requires Data Access Control? | Customer-visible only? | Internal-only data allowed? | Billable seat candidate? | Usage tracking required? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Full User Seat | Internal office / management user. | Case management, dispatch, billing, settlement, reports, dashboards, admin settings, approvals. | Future-only Yes, by permission. | Future-only No by default. | No. | Yes. | Yes, explicit role and permission required. | Yes. | No. | Future-only Yes, only by permission and masking policy. | Yes. | Yes, for metered features. | No |
| Field Engineer Seat | Field technician. | Assigned appointment view, arrival, photos, parts / serial notes, customer signature, visit result, concise completion input. | Future-only limited or No. | Future-only Yes, by assigned work scope. | No. | Yes. | Yes, engineer role and field permissions required. | Yes. | No. | Limited only to necessary assigned service data; no broad internal-only access. | Yes. | Yes, for uploads, AI, notifications, and field workflow usage. | No |
| Viewer / Read-only Seat | Internal read-only viewer, supervisor observer, partner / brand viewer if approved. | Read-only dashboards, limited case views, quality review, audit-friendly inspection. | Future-only Yes, read-only and scoped. | Future-only No by default. | No. | Yes. | Yes, read-only permission required. | Yes. | No. | Limited by permission; sensitive fields may be masked or excluded. | Yes. | Yes, for report/download/API use if enabled. | No |
| External / Customer Access | Customer, requester, contact person, verified channel identity. | Case status lookup, appointment confirmation, quote confirmation, supplement upload, completion summary, survey response. | No. | No. | Future-only Yes, verified customer-visible access only. | No internal membership. | Requires verified customer channel policy, not internal role permission. | Yes. | Yes. | No. | No internal seat; may be entitlement/usage governed. | Yes, for self-service, notification, upload, and survey usage. | No |
| Service / system actor | Scheduled job, provider callback, integration worker, automation task. | Scheduled reports, webhook processing, notification dispatch, usage aggregation, future no-send outbox worker. | No human UI by default. | No. | No. | Not human membership; must have organization/purpose scope. | Requires purpose-specific policy and least-privilege authorization. | Yes. | No. | Only if explicitly allowed by purpose policy and masking rules. | No human seat; may affect usage/cost. | Yes. | No |

## Interaction With SaaS Plan / Entitlement

Future plans may limit which seat types are available and how many seats are included.

However:

- plan may limit seat type and count, but cannot replace permission;
- subscription active does not mean unlimited seats;
- entitlement may allow a seat type to use a feature, but user still needs permission;
- usage limit may restrict usage quantity, but cannot decide data visibility;
- Enterprise SSO may assist login and identity management, but cannot bypass membership, permission, Data Access Control, or audit;
- customer channel identity is governed by customer verification and visibility policy, not internal seat management.

Example:

```text
Professional plan may include Field Engineer Seats.
That does not mean every engineer can view every case.
The engineer still needs organization membership, engineer permission, assigned case/appointment scope, Data Access Control, masking, and audit.
```

## Interaction With Data Access Control

Task274 through Task281 remain authoritative for data visibility.

### Full User Seat

Full User Seat still requires:

- organization membership,
- role,
- permission,
- feature entitlement,
- source data scope,
- masking / redaction,
- audit,
- usage tracking where applicable.

Full User Seat is not universal access.

### Field Engineer Seat

Field Engineer Seat should see only the data needed for assigned field work.

Examples:

- assigned appointment,
- route / arrival context,
- customer contact/address only when operationally necessary,
- service summary,
- required photos/signature/checklist context,
- parts / serial context when relevant.

Field Engineer Seat should not see:

- broad customer lists,
- unrelated cases,
- finance-only settlement internals,
- internal audit logs,
- AI raw payload,
- supervisor-only risk review unless explicitly authorized.

### Viewer / Read-only Seat

Viewer / Read-only Seat is still subject to:

- organization scope,
- role/permission,
- Data Access Control,
- masking,
- export/download restrictions,
- audit.

Read-only does not mean export-all.

### External / Customer Access

External / Customer Access must use verified customer channel identity and customer-visible policy.

It may only expose:

- customer-visible case status,
- appointment information,
- customer action requests,
- quote or approval content explicitly intended for the customer,
- completion summary intended for the customer,
- survey flow.

It must not expose:

- internal note,
- audit log,
- billing internal data,
- settlement internal data,
- engineer internal comments,
- AI raw payload,
- supervisor review,
- internal risk flags,
- data from another customer or organization.

### Service / System Actor

Service / system actor must be purpose-scoped.

It must not become:

- cross-organization super user,
- hidden admin user,
- unbounded export user,
- unfiltered AI retrieval identity,
- provider credential leak path.

Every future service/system actor should have:

- explicit purpose,
- organization scope where applicable,
- least privilege,
- audit event,
- usage tracking where applicable,
- safe failure mode,
- no unnecessary sensitive payload.

## Engineer Mobile App Relationship

Future Field Engineer Seat should support Engineer Mobile App / mobile web workflows.

The design must preserve:

- simple field UX,
- assigned-work scope,
- minimal necessary customer data,
- photo/signature/file storage policy,
- audit of important actions,
- no AI auto-decision,
- no engineer access to unrelated internal data,
- no conversion of field workflow into a complex admin form.

Field Engineer Seat packaging should never be used to push back-office complexity onto engineers.

## Customer Channel Identity Relationship

Customer channel identity is separate from internal account and seat design.

Future customer access may use:

- LINE identity,
- APP identity,
- web portal identity,
- SMS / email link,
- other verified channel binding.

LINE identity must remain scoped by:

```text
organization_id + line_channel_id + line_user_id
```

Customer access must be verified, customer-visible only, safe-deny, and audited where appropriate.

It must not be counted as an internal Full User Seat, Field Engineer Seat, or Viewer Seat.

## Enterprise SSO Relationship

Enterprise SSO may authenticate enterprise users, but seat, membership, role, permission, entitlement, and Data Access Control must still be resolved separately.

Future SSO must not:

- grant organization access by itself,
- grant all feature entitlements,
- grant all permissions,
- bypass seat limits,
- bypass Data Access Control,
- bypass masking,
- bypass audit,
- bypass usage tracking.

## Runtime Forbidden Confirmation

Task285 explicitly does not implement:

- seat management runtime,
- account billing runtime,
- subscription runtime,
- payment runtime,
- invoice runtime,
- SaaS billing runtime,
- entitlement runtime,
- permission runtime,
- usage metering runtime,
- feature flag runtime,
- customer self-service runtime,
- Engineer App runtime,
- mobile web runtime,
- SSO runtime,
- AI Add-on runtime,
- report / export / download runtime,
- scheduled report runtime,
- API changes,
- Admin UI changes,
- DB schema,
- migration,
- index,
- tests,
- smoke fixtures,
- provider sending.

## Future Implementation Questions

Before any seat/account runtime work begins, future tasks must answer:

- Which account types are product-approved?
- Which seat types are billable?
- Which seat types are included in each plan?
- Which seat types have hard limits vs soft warnings?
- Which roles can be assigned to each seat type?
- Which permissions are available to each role?
- Which data scopes are available to each seat type?
- How is external customer access verified and separated from internal seats?
- How are service/system actors created, rotated, audited, and constrained?
- How does Enterprise SSO map users into organization membership?
- How are seat usage and AI/storage/notification usage tracked separately?
- What happens when a tenant exceeds seat limits?

## Conclusion

Task285 adds docs-only seat / account type boundary guidance.

It does not approve or implement SaaS seat runtime.

Future implementation must preserve:

- seat type is not permission,
- seat type is not role,
- seat type is not Data Access visibility,
- organization entitlement is not user access,
- customer channel identity is not internal seat,
- Field Engineer Seat must keep engineer workflow simple,
- External / Customer Access is customer-visible only,
- Service / system actor must be scoped and auditable,
- runtime allowed now is No.
