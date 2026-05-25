# Task 248 - AI Retrieval Policy Builder Design / No Runtime Change

## Purpose And Scope

This document defines a future AI Retrieval Policy Builder design.

The future policy builder would sit before any AI / RAG retrieval service, vector store, document index, or knowledge source and produce an organization-scoped, permission-aware, visibility-aware, entitlement-aware, auditable retrieval filter.

Task248 is documentation-only.

This task is not:

- retrieval policy builder implementation,
- RAG runtime,
- AI agent runtime,
- vector DB implementation,
- embedding implementation,
- retrieval service,
- API contract,
- Admin UI,
- migration / schema proposal,
- worker / scheduler,
- automated test implementation,
- AI auto-decision engine.

Task248 does not add retrieval code, prompts, vector indexes, DB queries, runtime permissions, entitlements, audit runtime, usage tracking, or AI workflow automation.

## Core Policy Builder Principles

Future AI retrieval must never directly query DB, vector DB, document index, or knowledge source without a policy filter.

Principles:

- retrieval request must pass through policy builder first,
- policy builder must build filters from actor, organization, role, permission, entitlement, visibility, customer-visible policy, internal-only policy, and sensitive masking policy,
- retrieval must always include organization scope,
- retrieval must never omit `organization_id` filter,
- cross-organization retrieval must fail closed,
- policy builder output is not an official record,
- policy builder must not expand access,
- policy builder may only narrow the retrieval scope,
- AI suggestion must not override policy builder output,
- AI confidence must not expand retrieval scope,
- ambiguous policy inputs must fail closed.

Policy builder exists to protect the platform from accidental over-retrieval, cross-tenant leakage, role bypass, and customer-visible/internal data mixing.

## Future Retrieval Context Inputs

The inputs below are conceptual only.

They are not:

- API schema,
- DB columns,
- production enum,
- generated client contract,
- runtime behavior.

Future retrieval context inputs may include:

- actor reference,
- actor role category,
- organization reference,
- membership / role context,
- permission context,
- entitlement context,
- feature key context,
- agent type,
- task type,
- requested source types,
- customer-visible or internal surface,
- target Case reference if applicable,
- target Appointment reference if applicable,
- target Field Service Report reference if applicable,
- brand context,
- vendor context,
- locale / language,
- time / effective-date context,
- request correlation reference.

Input design should keep sensitive data out of the policy builder whenever the policy can use stable internal references instead.

## Future Policy Filter Outputs

The outputs below are conceptual only.

They are not:

- table fields,
- API response schema,
- vector index schema,
- production enum,
- migration proposal.

Future policy filter outputs may include:

- required organization filter,
- allowed source types,
- allowed visibility levels,
- allowed permission scopes,
- customer-visible only flag,
- internal-only allowed flag,
- brand / vendor filter,
- effective date filter,
- retention / deletion exclusion,
- source version constraints,
- sensitive field masking profile,
- max result limit category,
- citation requirement,
- audit requirement,
- denial reason category.

Policy output should be deterministic, auditable, and safe to record in redacted internal diagnostics.

Policy output must not contain raw secrets, raw provider identifiers, customer contact values, raw AI payload, or full source payload.

## Data Source Visibility Policy

Future source visibility categories may include:

- customer-visible,
- internal-only,
- role-restricted,
- supervisor-only,
- billing / settlement restricted,
- engineer-facing restricted,
- provider diagnostic restricted,
- audit-restricted,
- AI-advisory-source,
- disabled source,
- expired source,
- superseded source.

These are conceptual categories only.

They are not production enums, DB fields, API response values, localization keys, or migration contents.

Visibility policy should answer:

- Can this source be used in customer-facing output?
- Can this source be used only for internal advice?
- Which roles can retrieve it?
- Which permission scopes are required?
- Is the source valid at the request time?
- Has the source expired, been disabled, superseded, or deleted?
- Does the source require masking before AI context is built?

If visibility is missing, unknown, or ambiguous, retrieval should fail closed.

## Retrieval Denial And Safe-deny

Future policy builder should deny retrieval in these cases:

- missing organization scope,
- actor not authenticated,
- no organization membership,
- permission missing,
- entitlement missing,
- subscription state disallows the feature,
- source visibility unknown,
- source deleted,
- source expired,
- source disabled,
- source superseded and not valid for the request time,
- customer-visible surface requesting internal-only source,
- role-restricted source requested by unauthorized role,
- billing / settlement restricted source requested by non-authorized role,
- provider diagnostic restricted source requested by non-authorized role,
- cross-organization source match,
- ambiguous source ownership,
- sensitive field cannot be masked safely,
- AI-only confidence tries to expand access.

Customer-facing surfaces must not leak:

- whether a hidden source exists,
- whether an internal SOP exists,
- whether a billing rule exists,
- whether provider diagnostics exist,
- whether organization has AI add-on,
- whether hidden Case exists,
- whether hidden customer exists,
- whether hidden report exists,
- whether LINE binding exists.

Safe-deny output should use generic wording for unauthorized users and customer-facing surfaces.

Internal diagnostics may record safe denial categories only when role, organization scope, and permission are confirmed.

## Audit Readiness

Future audit event families may include:

- `ai.retrieval_policy.built`,
- `ai.retrieval_policy.denied`,
- `ai.retrieval_policy.organization_filter_applied`,
- `ai.retrieval_policy.permission_filter_applied`,
- `ai.retrieval_policy.entitlement_filter_applied`,
- `ai.retrieval_policy.visibility_filter_applied`,
- `ai.retrieval_policy.masking_profile_applied`,
- `ai.retrieval.source_excluded`,
- `ai.retrieval.request_sent`,
- `ai.retrieval.result_returned`,
- `ai.retrieval.result_cited`,
- `ai.retrieval.result_rejected_by_policy`,
- `ai.suggestion.generated_from_retrieved_sources`,
- `ai.suggestion.accepted_by_human`,
- `ai.suggestion.rejected_by_human`,
- `ai.suggestion.edited_by_human`.

These are future placeholders only.

They are not production event names, DB values, localization keys, API responses, or audit runtime.

Audit redaction must prohibit:

- full customer mobile values,
- full addresses,
- raw LINE user ids,
- tokens,
- secrets,
- LINE access tokens,
- channel secrets,
- raw provider payloads,
- provider credentials,
- raw AI sensitive payloads,
- internal retrieval diagnostics on customer-visible surfaces.

Audit should record enough to support accountability without exposing protected data.

## SaaS Usage And Entitlement Readiness

Future policy builder should be compatible with SaaS entitlement and usage controls.

Future questions:

- Which agent types require AI add-on entitlement?
- Which source types require higher plan entitlement?
- Which source types are allowed for customer-facing AI?
- How is retrieval count calculated?
- Are denied retrieval attempts counted?
- Are source count and result count metered?
- Is token usage recorded?
- How are billing periods defined?
- How are rate limits and quotas applied?
- Is customer-facing AI metered separately from internal AI?
- Is retrieval audit export a separate entitlement?
- How does usage exceeded produce safe-deny?

Possible future usage categories:

- AI request,
- RAG retrieval request,
- retrieval result returned,
- cited source count,
- AI generated response,
- AI suggestion viewed,
- AI suggestion accepted,
- AI suggestion rejected,
- denied retrieval.

These are design categories only and do not add runtime usage metering.

## AI Advisory-only Boundary

AI may use authorized retrieval results to:

- summarize,
- cite sources,
- remind missing fields,
- flag risks,
- draft suggestions,
- classify issues for review,
- prepare candidate wording for human review.

AI must not:

- modify retrieval filter,
- request privilege expansion,
- retrieve unauthorized source,
- query across organizations,
- write retrieved suggestion into official record by itself,
- modify Case official status,
- modify Appointment official status,
- modify Field Service Report official status,
- select or change `finalAppointmentId`,
- approve quote,
- approve billing / settlement,
- approve refund / compensation,
- send notification,
- close complaint,
- hide negative feedback,
- bypass organization scope,
- bypass permission,
- bypass entitlement.

AI is not the source of authority for retrieval access.

Policy builder and deterministic authorization layers are the source of authority.

## Failure Mode Examples

Future policy builder should fail closed for examples like:

| Scenario | Expected future behavior |
| --- | --- |
| User asks about another organization | Deny retrieval; do not reveal whether target exists. |
| Customer-visible assistant asks for internal settlement rule | Deny internal-only source; return generic safe wording. |
| Dispatcher lacks billing permission | Exclude billing / settlement restricted sources. |
| Engineer asks for audit log | Deny audit-restricted source unless explicitly permitted. |
| AI says more context would improve answer | Do not expand retrieval without policy authorization. |
| Source is expired or superseded | Exclude unless request time and policy explicitly allow historical version. |
| Source ownership is ambiguous | Deny retrieval. |
| Sensitive field cannot be masked | Exclude sensitive field or deny source. |

These examples are not tests, fixtures, or runtime behavior.

## Explicit Non-goals

Task248 does not:

- add retrieval policy builder,
- add retrieval service,
- add RAG runtime,
- add AI agent runtime,
- add vector DB,
- add embedding,
- add document index,
- add prompt registry,
- add tool execution,
- add API,
- modify backend `src/`,
- modify Admin `admin/src/`,
- add migration,
- modify schema,
- add index,
- add audit runtime,
- add permission runtime,
- add entitlement runtime,
- add usage runtime,
- add worker,
- add scheduler,
- add tests,
- add fixtures,
- add smoke tests,
- modify `package.json`,
- modify inventory docs,
- touch Migration020,
- connect to DB,
- run psql,
- run DDL,
- run `npm run db:migrate`,
- operate shared Zeabur runtime,
- send provider notifications,
- implement notification runtime,
- implement survey runtime,
- implement AI auto-decision.

## Verification Checklist

Task248 should be verified with:

- `npm run check`,
- `npm run admin:check`,
- `git diff --check`,
- sensitive / internal diagnostic scan.

Sensitive scan should confirm there are no actual:

- DATABASE_URL values,
- passwords,
- tokens,
- secrets,
- LINE access tokens,
- channel secrets,
- raw LINE user ids,
- customer mobile values,
- full addresses,
- signature data,
- raw provider payloads,
- provider credentials,
- real tenant IDs,
- real organization IDs,
- real usage values,
- real pricing values,
- AI token counts,
- stack traces,
- SQL errors,
- DB constraint names,
- production translation strings.

Policy words, placeholders, prohibition lists, and guardrail references are allowed when they do not include actual sensitive values.

## Future Task Candidates

Future candidates only; not executed by Task248:

- AI Retrieval Policy Matrix / No Runtime Change,
- AI Source Visibility Classification Matrix / No Runtime Change,
- AI Retrieval Safe-deny Error Matrix / No Runtime Change,
- AI RAG Metadata Proposal / No Migration,
- AI Audit Event Catalog / No Runtime Change,
- AI Usage Metering Matrix / No Runtime Change,
- AI Agent Branch Pause Summary / No Runtime Change.
