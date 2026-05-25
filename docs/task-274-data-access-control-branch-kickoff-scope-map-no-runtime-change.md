# Task 274 - Data Access Control / Data Permission Model Branch Kickoff Scope Map / No Runtime Change

## Purpose And Scope

This document opens a docs-only Data Access Control / Data Permission Model design branch after the Operations / Quality branch readiness closure in Task273.

The purpose is to map the shared access-control foundation that future reports, analytics, exports, downloads, scheduled reports, customer self-service lookup, AI retrieval, RAG retrieval, and AI-assisted import / export must use.

Task274 is documentation-only.

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

Task274 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why This Branch Follows Operations / Quality Readiness Closure

Task266 through Task273 clarified that Operations / Quality, complaint review, callback, follow-up, supervisor review, metrics, dashboards, reports, exports, scheduled reports, and AI risk summaries must not become official records or permission shortcuts.

The next design question is shared access control.

The platform will eventually support many data applications:

- Admin case views,
- supervisor dashboards,
- operations risk queues,
- financial review screens,
- customer self-service lookup,
- reports,
- analytics,
- exports,
- downloads,
- scheduled reports,
- AI summaries,
- AI filtering,
- AI import / export assistance,
- RAG knowledge search.

These must not each invent their own permission model. Data access is the foundation, and every data application must build on the same access-control boundaries.

## Branch Purpose

The future Data Access Control branch should define how the platform consistently answers:

- who is asking,
- which organization / tenant they belong to,
- which role and permissions they have,
- which feature entitlement and subscription status apply,
- which records are inside their allowed case / customer / document scope,
- which fields must be hidden, masked, or excluded,
- whether the output is customer-visible or internal-only,
- whether a report / export / download / scheduled report is allowed,
- whether AI / RAG may retrieve the data,
- whether the action must be audited,
- whether SaaS usage tracking applies.

This branch should keep future runtime fail-closed: if scope, permission, entitlement, visibility, masking, or audit requirements are ambiguous, the future implementation should deny or require explicit design clarification.

## Concept Map

The concepts below are proposal-only.

They are not:

- table names,
- schema proposals,
- API contracts,
- Admin UI routes,
- production enum values,
- runtime classes,
- generated policy engines.

| Concept | Primary purpose | Applies to | Core guardrail | Runtime allowed now? |
| --- | --- | --- | --- | --- |
| Organization scope | Tenant isolation boundary | All data operations | Every query and retrieval must be scoped to the current organization / tenant. | No |
| User identity | Identify actor | Admin, engineer app, API, customer self-service, scheduled jobs | Actor must be known or represented by an authorized system context. | No |
| Organization membership | Connect user to organization | Internal users and multi-tenant SaaS users | User must have valid membership for the organization context. | No |
| Role | High-level user category | Customer service, dispatcher, engineer, supervisor, finance, admin, viewer | Role narrows default surfaces and workflows. | No |
| Permission | User-level operation authority | View, edit, approve, export, download, review, manage | Permission controls whether a user can perform an action. | No |
| Feature entitlement | Organization-level feature availability | SaaS plan, AI add-on, export, SLA, dashboard, LINE binding | Entitlement controls whether the organization has access to a feature. | No |
| Subscription status | Organization commercial availability | SaaS-ready future | Past-due / expired / trial states may affect feature availability. | No |
| Usage limit | Quota and cost control | AI, SMS, LINE push, email, export, storage, report generation | Usage may block or throttle future actions but must not expose sensitive payload. | No |
| Allowed case scope | Which cases can be read | Case views, reports, AI retrieval, customer self-service | Engineer / vendor / customer scopes may be narrower than organization scope. | No |
| Allowed customer scope | Which customers can be read | Customer views, reports, AI retrieval, customer self-service | Customer data must follow role and visibility boundaries. | No |
| Allowed document scope | Which documents can be read | Attachments, RAG sources, reports, downloads | File and document visibility must be policy-controlled. | No |
| Customer-visible policy | Safe customer-facing output | LINE, App, Web portal, email, SMS, survey, quote confirmation | Customer output must not expose internal-only data. | No |
| Internal-only policy | Protect internal notes and operational metadata | Admin, supervisor, finance, AI, reports | Internal-only data requires role / permission checks and redaction. | No |
| Field-level masking | Hide or redact sensitive fields | UI, reports, exports, logs, AI context, downloads | Sensitive fields may be masked, excluded, or limited by role. | No |
| Audit requirement | Trace important access and exports | Report, export, download, AI retrieval, scheduled delivery | High-risk access must be auditable. | No |
| SaaS usage tracking | Future metering and cost tracking | AI, export, download, scheduled reports, API, customer self-service | Usage records must avoid unnecessary sensitive payload. | No |

## Data Application Scope Map

Every future data application must call the same access-control decision layer before reading, transforming, exporting, or sending data.

| Data application | Primary data action | Must use unified Data Access Control? | Special notes | Runtime allowed now? |
| --- | --- | --- | --- | --- |
| Admin case detail | Read case / customer / appointment / report data | Yes | Respect role, organization, internal-only data, and masking. | No new runtime |
| Engineer mobile view | Read assigned appointment / case details | Yes | Engineer scope is usually assigned appointments, not all cases. | No new runtime |
| Supervisor dashboard | Aggregate risk / quality / SLA data | Yes | Dashboard summaries cannot bypass source data scope. | No |
| Finance review | Read billing / settlement evidence | Yes | Finance permission does not imply customer communication visibility. | No |
| Report / analytics | Aggregate operational and financial data | Yes | Aggregation must only include authorized source data. | No |
| Export / download | Produce files or downloadable datasets | Yes | Requires export / download permission plus field masking. | No |
| Scheduled report | Automated report generation and delivery | Yes | Schedule is automation only, not a permission shortcut. | No |
| Customer self-service lookup | Read customer-visible case status | Yes | Must use customer-visible data policy and channel identity scope. | No |
| AI summary | Retrieve and summarize records | Yes | AI may only see authorized, filtered, minimal context. | No |
| AI filtering | Help users filter or classify records | Yes | AI cannot inspect records the user cannot read. | No |
| AI import / export assistance | Help structure import/export drafts | Yes | Must not include unauthorized fields or sensitive payload. | No |
| RAG retrieval | Retrieve source documents / knowledge | Yes | Requires organization filter, visibility filter, and source metadata policy. | No |
| File / attachment download | Read photos, signatures, documents | Yes | Requires file-level permission, masking / expiry / audit policy. | No |
| Provider diagnostics | Read notification / webhook diagnostics | Yes | Must redact provider secrets and raw payloads. | No |

## Access Dimensions

Future access decisions should combine multiple dimensions instead of relying on a single role check.

At minimum, future runtime design should evaluate:

- organization scope,
- user identity,
- organization membership,
- role,
- permission,
- report / export / download permission where applicable,
- feature entitlement,
- subscription status,
- usage limit,
- allowed case scope,
- allowed customer scope,
- allowed document scope,
- customer-visible data policy,
- internal-only data policy,
- field-level masking / redaction policy,
- audit log requirement,
- SaaS usage tracking requirement.

No future data operation should skip organization scope.

No future report, export, download, AI retrieval, RAG retrieval, customer self-service lookup, or scheduled report should bypass user permission or visibility policy.

## Distinct Concepts That Must Not Be Mixed

The branch must keep these concepts separate:

| Concept | Means | Does not mean |
| --- | --- | --- |
| Permission | A user may perform an action. | The organization owns the feature. |
| Entitlement | An organization has access to a feature or limit. | A specific user has permission. |
| Subscription | Commercial state of organization plan. | Specific data visibility. |
| Usage limit | Quantity / cost boundary for a feature. | Authorization to access sensitive records. |
| Seat / account type | User billing or plan category. | Role permission by itself. |
| Feature flag | Operational rollout switch. | Security authorization. |
| Data visibility policy | Whether specific fields / sources are visible. | General feature availability. |
| Audit requirement | Whether an action must be logged. | Permission to perform the action. |
| Customer-visible policy | What customers may see. | What internal users may see. |
| Internal-only policy | Internal data classification. | Permission to expose it to AI or exports. |

If a future implementation collapses these concepts into one flag, it risks accidental data exposure or broken SaaS behavior.

## Alignment With Existing Product Invariants

### Organization Isolation

Every future data operation must be tenant-scoped.

This applies equally to:

- Admin UI,
- engineer app,
- API clients,
- reports,
- exports,
- downloads,
- scheduled reports,
- customer self-service,
- AI retrieval,
- RAG retrieval.

### Customer-visible vs Internal-only Separation

Customer-visible surfaces must not expose:

- internal notes,
- audit logs,
- billing internal data,
- settlement internal data,
- engineer internal comments,
- supervisor review notes,
- AI raw payload,
- internal risk labels,
- raw provider diagnostics,
- raw LINE user id.

Internal views must still enforce role, permission, masking, and organization scope.

### AI Is Not An Exception

AI must use the same access-control model.

AI must not:

- directly query unfiltered database data,
- directly query unfiltered vector DB data,
- retrieve cross-organization data,
- place unauthorized records into prompts,
- include internal-only data in customer-visible answers,
- use higher SaaS plan status as a reason to relax security.

### Scheduled Reports Are Automation Only

Scheduled reports are report / export automation.

They must:

- re-check permissions at generation / delivery time,
- avoid unauthorized recipients,
- apply field-level masking,
- respect customer-visible / internal-only policy,
- write audit events where required,
- support future usage tracking.

Scheduled reports must not become a path to access records that manual report/export would deny.

### Official Records Remain Protected

Data access does not grant authority to mutate official records.

Reading or exporting Case, Appointment, Field Service Report, billing, settlement, survey, complaint, or quality review data must not imply permission to:

- change Case status,
- change Appointment status,
- change Field Service Report status,
- change `finalAppointmentId`,
- approve quote,
- approve settlement,
- close complaint,
- hide negative feedback,
- send notification,
- create customer approval record.

## Future-only Component Map

The following component names are conceptual only.

They are not implemented by Task274:

- access policy builder,
- data scope resolver,
- organization scope resolver,
- role permission evaluator,
- entitlement evaluator,
- subscription status evaluator,
- usage limit evaluator,
- customer-visible policy resolver,
- internal-only policy resolver,
- field masking resolver,
- report / export permission gate,
- scheduled report recipient policy,
- AI retrieval policy builder,
- RAG source visibility filter,
- file download policy resolver,
- audit event classifier,
- usage tracking classifier.

Future implementation should prefer one shared decision model that can be called by UI, API, export, report, scheduled job, and AI/RAG workflows.

## Guardrail Matrix

| Area | Required guardrail | Risk if ignored | Runtime allowed now? |
| --- | --- | --- | --- |
| Report / analytics | Aggregate only authorized data. | Cross-scope summaries leak records. | No |
| Export / download | Require export/download permission and field masking. | Sensitive data leaves platform. | No |
| Scheduled reports | Re-check permissions and recipient policy. | Automation sends data to wrong recipient. | No |
| Customer self-service | Apply customer-visible policy and channel identity scope. | Customer sees internal data or another customer's case. | No |
| AI retrieval | Use permission-aware retrieval and minimal context. | Unauthorized data enters AI prompt/context. | No |
| RAG retrieval | Require organization and visibility filters. | Cross-tenant knowledge leakage. | No |
| File access | Enforce file/document scope and expiry policies. | Photos/signatures/documents leak. | No |
| Provider diagnostics | Redact raw payloads and secrets. | Provider secrets or raw payloads leak. | No |
| Audit | Log high-risk access with masked summaries. | No trace for data exposure or exports. | No |
| Usage tracking | Meter cost-sensitive features without sensitive payload. | SaaS costs and limits cannot be controlled. | No |

## Suggested Future Branch Tasks

The following are future docs-only or implementation-planning tasks. They are not approved by Task274:

1. Data access category boundary matrix.
2. Customer-visible vs internal-only field catalog.
3. Report / export permission gate design.
4. Scheduled report recipient and permission re-check design.
5. AI retrieval policy builder contract.
6. RAG source visibility and metadata filter policy.
7. Field-level masking / redaction policy.
8. Audit event catalog for data access, report, export, download, AI retrieval, and scheduled reports.
9. SaaS usage tracking category mapping for reports, exports, AI, RAG, customer self-service, and scheduled reports.
10. Runtime readiness gate review.

Each future task must stay explicit about whether it is docs-only or runtime implementation.

## Non-goals

Task274 does not:

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

For Task274, verification is limited to documentation safety:

- `npm run check`,
- `npm run admin:check`,
- `git diff --check`,
- sensitive text scan for accidental secrets or real customer/provider data.

No smoke, DB, migration, API, Admin runtime, AI runtime, RAG runtime, report runtime, export runtime, scheduled report runtime, provider sending, or inventory verification is required.

## Conclusion

Task274 opens the Data Access Control / Data Permission Model branch as a docs-only scope map.

The branch principle is:

```text
Data access is the foundation.
Reports, analytics, exports, downloads, scheduled reports, customer self-service,
AI retrieval, and RAG retrieval must share the same permission model.
```

Task274 does not approve runtime implementation.
