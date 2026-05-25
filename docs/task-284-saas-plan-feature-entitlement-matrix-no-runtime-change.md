# Task 284 - SaaS Plan Feature Entitlement Matrix / No Runtime Change

## Scope And Non-goals

This document continues the SaaS Plan / Entitlement / Usage Boundary branch after Task282 and Task283.

The purpose is to define a future-only plan feature entitlement matrix for Basic, Professional, Business, and Enterprise packaging. The matrix is guidance for future SaaS design only.

Task284 is documentation-only.

This task is not:

- plan runtime,
- subscription runtime,
- payment runtime,
- invoice runtime,
- SaaS billing runtime,
- entitlement runtime,
- usage metering runtime,
- seat management runtime,
- feature flag runtime,
- AI Add-on runtime,
- SSO runtime,
- permission runtime,
- Data Access Control runtime,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- smoke / test implementation.

Task284 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, subscription runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why A Plan Feature Entitlement Matrix Is Needed After Task283

Task283 separated SaaS concepts such as plan, subscription, entitlement, permission, seat, usage, feature flag, AI Add-on, Enterprise SSO, and data visibility.

Task284 adds a matrix so future product and engineering work can discuss plan packaging without confusing it with authorization or data access.

The matrix answers:

- which feature categories may belong to each future plan,
- which features likely require user permission,
- which features must use Data Access Control,
- which features may need usage tracking,
- which features may require AI Add-on,
- whether any runtime is allowed now.

The answer to runtime allowed now is always No.

## Future Plan Definitions

These plan definitions are future design notes only. They are not product pricing, sales commitments, tenant configuration, API contracts, or database schema.

### Basic

Basic may cover the minimum workflow for a small service team:

- customer and case management,
- basic appointment / dispatch workflow,
- basic Field Service Report,
- simple completion records,
- basic notification capability,
- basic audit and permissions.

### Professional

Professional may cover teams with office roles, dispatch coordination, and customer channel integration:

- multi-role workflows,
- multiple visits per case,
- LINE / customer channel binding,
- customer self-service lookup,
- basic billing / settlement support,
- post-completion survey capability,
- SLA reminders,
- customer approval records,
- basic reporting,
- limited AI assistance.

### Business

Business may cover larger service teams, brands, vendors, and multi-location operations:

- vendor / brand-specific settlement rules,
- quote approval,
- exception review,
- role dashboards,
- parts reservation and vehicle stock,
- advanced report / dashboard / analytics,
- export / download,
- API / webhook integration,
- higher file storage and notification usage,
- broader AI and AI/RAG capabilities.

### Enterprise

Enterprise may cover customers with custom governance, scale, security, and integration requirements:

- custom entitlements,
- multi-organization / multi-branch support,
- multiple LINE channels,
- Enterprise SSO,
- advanced audit / security,
- custom retention and compliance policies,
- API / webhook scale,
- custom reporting,
- dedicated support,
- optional private / dedicated / hybrid AI architecture.

## Plan Feature Entitlement Matrix

This matrix is intentionally conservative. It describes future entitlement direction only.

| Feature category | Basic future entitlement | Professional future entitlement | Business future entitlement | Enterprise future entitlement | Requires user permission? | Requires Data Access Control? | Requires usage tracking? | Requires AI Add-on? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Case / appointment / Field Service Report core workflow | Basic case, appointment, completion, and one formal Field Service Report per case. | Multi-visit history and stronger customer coordination. | Multi-team / multi-location workflow and advanced operational views. | Custom workflow policies and enterprise governance. | Yes | Yes | No | No | No |
| Customer channel identity | Basic customer contact references. | LINE binding and existing case reverse binding. | Multi-channel identity readiness across service teams. | Custom identity governance and multiple channel configurations. | Yes | Yes | No | No | No |
| LINE / SMS / Email / APP notification capability | Basic internal or customer notification readiness. | LINE and customer communication workflows. | Higher volume multi-channel notification readiness. | Custom provider policy, multiple channels, and enterprise controls. | Yes | Yes | Yes | No | No |
| Customer self-service lookup | Not included or very limited future capability. | Customer case lookup and appointment confirmation. | Broader self-service with quotes, survey, and document status. | Custom portal / channel integration and enterprise policies. | Yes | Yes | Yes | No | No |
| Survey capability | Not included or very limited future capability. | Post-completion customer satisfaction survey. | Survey analytics and quality workflows. | Custom survey policy, retention, and reporting. | Yes | Yes | Yes | No | No |
| Billing / settlement design capability | Basic charge summary readiness. | Basic billing / settlement workflow. | Vendor / brand-specific rules, quote approval, settlement review. | Custom settlement policies and enterprise approval workflows. | Yes | Yes | No | No | No |
| Report / dashboard / analytics | Basic operational summaries. | Basic dashboards and service reports. | Advanced dashboards, analytics, quality and SLA reporting. | Custom analytics, governance reporting, and enterprise dashboards. | Yes | Yes | Yes | No | No |
| Export / download | Limited or unavailable future export. | Basic controlled export. | Advanced export / download with masking, audit, and quotas. | Custom export policies, retention, and enterprise controls. | Yes | Yes | Yes | No | No |
| API / webhook | Not included or very limited future access. | Limited integration readiness. | API / webhook access with quotas and audit. | Custom API / webhook scale and contract controls. | Yes | Yes | Yes | No | No |
| File storage | Basic photos / attachments readiness. | Photos, signature, and document workflows. | Larger file storage, operational document support, and reporting attachments. | Custom storage limits, retention, and enterprise file governance. | Yes | Yes | Yes | No | No |
| AI suggestion | Not included or limited trial readiness. | Basic AI summaries and missing-field suggestions. | AI completion summary, dispatch suggestions, settlement checks, and risk flags. | Custom AI governance, usage limits, and optional dedicated AI architecture. | Yes | Yes | Yes | Yes | No |
| AI / RAG | Not included. | Limited permission-aware AI knowledge lookup. | Broader permission-aware RAG across SOP, rules, and operational knowledge. | Custom RAG isolation, private / dedicated / hybrid AI options. | Yes | Yes | Yes | Yes | No |
| AI Add-on | Not included by default. | Optional add-on with limited quotas. | Optional add-on with higher quotas and more agents. | Custom AI entitlement, cost control, and provider policy. | Yes | Yes | Yes | Yes | No |
| Enterprise SSO | Not included. | Not included by default. | Possible future add-on for selected customers. | SAML / OIDC / Enterprise SSO future capability. | Yes | Yes | No | No | No |
| Advanced audit / security | Basic audit. | Standard audit and security controls. | Advanced audit views and role controls. | Enterprise audit, retention, security review, and compliance support. | Yes | Yes | No | No | No |

## Explicit Rules

- Plan entitlement does not equal user permission.
- Organization entitlement does not mean all users can operate the feature.
- Subscription state does not grant record visibility.
- Seat type does not grant workflow authority.
- Feature flag does not replace entitlement or permission.
- Report/export/download still requires report/export/download permission, Data Access Control, masking, audit, and usage tracking where applicable.
- AI Add-on cannot bypass permission, organization isolation, masking, audit, minimum necessary context, official-record separation, or human review.
- Enterprise SSO cannot bypass organization membership, permission, Data Access Control, audit, or usage controls.
- Customer channel identity is not an internal user seat.
- LINE is a channel, not the only identity model.
- Customer self-service entitlement does not remove customer identity verification or safe-deny requirements.
- Data Access Control remains authoritative for data visibility.

## Usage-tracked Capabilities

The following future capabilities should be considered usage-tracked if implemented:

- AI usage,
- LINE push,
- SMS,
- Email,
- file storage,
- photo / signature / document upload,
- export,
- API / webhook,
- customer self-service lookup,
- survey sending.

Usage tracking is not permission and not data visibility. Usage records should avoid unnecessary sensitive payload.

## Interaction With Permission And Data Access Control

Future runtime should evaluate feature use with layered checks.

At minimum:

```text
organization scope
-> subscription state, if applicable
-> feature entitlement
-> usage limit, if applicable
-> user membership
-> role / permission
-> Data Access Control
-> masking / redaction
-> audit requirement
-> official workflow rules
```

No future plan or entitlement should allow bypassing:

- organization isolation,
- role / permission checks,
- customer-visible policy,
- internal-data policy,
- field-level masking,
- audit log,
- AI output / official-record separation,
- one Case = one formal Field Service Report,
- finalAppointmentId backend/system ownership.

## AI Add-on Boundary

AI Add-on may package AI capabilities commercially, but it must not turn AI into an unrestricted data access tool.

Future AI Add-on checks should include:

- organization AI entitlement,
- subscription / add-on status,
- user AI permission,
- AI usage quota,
- permission-aware retrieval,
- minimum necessary context,
- sensitive data masking / redaction,
- audit log,
- AI feedback log where applicable,
- official-record human accept / reject / edit workflow.

AI Add-on does not approve:

- AI auto-dispatch,
- AI auto-completion,
- AI auto-settlement,
- AI automatic fee decisions,
- AI customer approval,
- AI complaint closure,
- AI retrieval across tenant boundaries,
- AI access to unfiltered database, vector database, file storage, or raw payload.

## Enterprise SSO Boundary

Enterprise SSO may improve authentication for enterprise customers, but it is not authorization.

Future SSO must still resolve:

- organization membership,
- role,
- permission,
- feature entitlement,
- data access scope,
- audit context.

SSO must not:

- create cross-organization access,
- grant all permissions by login alone,
- bypass Data Access Control,
- bypass export/download controls,
- bypass audit logging,
- bypass SaaS entitlement or subscription controls.

## Customer Channel Identity Boundary

Customer channel identity is not an internal user account and not a paid internal seat.

Future customer-facing access must distinguish:

- internal user identity,
- organization membership,
- customer identity,
- LINE identity,
- APP identity,
- SMS / email contact,
- verified channel binding,
- customer-visible data policy.

LINE identity must remain scoped by:

```text
organization_id + line_channel_id + line_user_id
```

LINE must not be hard-coded as the only future customer identity model.

## Runtime Forbidden Confirmation

Task284 explicitly does not implement:

- plan runtime,
- subscription runtime,
- payment runtime,
- invoice runtime,
- SaaS billing runtime,
- entitlement runtime,
- usage metering runtime,
- seat management runtime,
- feature flag runtime,
- AI Add-on runtime,
- SSO runtime,
- permission runtime,
- Data Access Control runtime,
- API / webhook runtime,
- report / export / download runtime,
- customer self-service runtime,
- survey runtime,
- notification sending,
- AI / RAG runtime,
- DB schema,
- migration,
- index,
- Admin UI,
- smoke / test changes.

## Future Implementation Questions

Before any SaaS runtime work begins, future tasks must answer:

- Which plan definitions are product-approved?
- Which feature keys are stable enough for runtime?
- Which features are tenant entitlements vs user permissions?
- Which features are controlled by feature flags vs entitlements?
- Which usage dimensions are metered?
- Which usage events are billable vs operational only?
- Which AI features require AI Add-on?
- Which features need hard limits vs soft warnings?
- Which export/report features require additional approval?
- Which customer self-service features need customer identity verification?
- Which Enterprise SSO providers are in scope?
- Which audit events are mandatory before launch?

## Conclusion

Task284 adds docs-only entitlement matrix guidance.

It does not approve or implement SaaS runtime.

Future implementation must preserve:

- entitlement is not permission,
- permission is not data visibility,
- usage is not authorization,
- AI Add-on is not a permission bypass,
- Enterprise SSO is not authorization,
- customer channel identity is not an internal seat,
- Data Access Control remains authoritative,
- runtime allowed now is No.
