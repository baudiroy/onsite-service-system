# Task 247 - AI Agent And Permission-aware RAG Readiness Planning / No Runtime Change

## Purpose And Scope

This document defines future readiness boundaries for AI agents, permission-aware RAG, retrieval policy, source metadata, audit, SaaS usage tracking, and human-controlled official-record workflows.

Task247 is documentation-only.

This task is not:

- AI agent implementation,
- RAG runtime,
- vector DB implementation,
- embedding implementation,
- retrieval service,
- API contract,
- Admin UI,
- migration / schema proposal,
- worker / scheduler,
- automated test implementation,
- AI auto-decision engine.

Task247 does not add prompts, tools, retrieval logic, vector indexes, DB queries, runtime permissions, entitlements, usage tracking, audit runtime, or AI workflow automation.

## Core AI Principles

Future platform AI must follow these principles:

- AI must be closed-domain.
- AI must be permission-aware.
- AI must be tenant-isolated.
- AI must be auditable.
- AI must be human-controlled.
- AI must be RAG-grounded.

AI must not:

- directly connect to DB to retrieve unfiltered data,
- directly query vector DB to retrieve unfiltered data,
- perform cross-organization retrieval,
- bypass permission,
- bypass entitlement,
- bypass user role,
- bypass organization scope,
- treat AI output as official record,
- make high-risk official decisions without deterministic business logic or human confirmation.

AI output must stay separate from official records.

AI suggestions should support human accept / reject / edit flows.

## Agent Boundary Draft

The agent categories below are future design placeholders only.

They are not production agents, runtime classes, prompt registries, API routes, workers, tools, or workflow automation.

| Future agent category | Possible purpose | Boundary |
| --- | --- | --- |
| Customer Service AI | Summarize customer issue, structure intake, remind missing fields, draft customer-service response. | Cannot submit official customer consent, change Case status, or expose internal-only data to customer-visible surfaces. |
| Dispatch AI | Suggest dispatch priority, time windows, route risks, SLA risks, parts risks, and repair-time estimates. | Cannot auto-dispatch, override one-open-appointment guard, or confirm appointment on behalf of customer / dispatcher. |
| Engineer Completion AI | Structure engineer notes, classify failure reason, remind missing photos / signature / serial numbers, draft completion summary. | Cannot fake arrival, fake signature, complete appointment, or finalize Field Service Report. |
| Billing / Settlement AI | Compare settlement data with brand / vendor rules, suggest missing evidence, flag possible billing items. | Cannot approve quote, approve settlement, change payable amount, or replace finance review. |
| Quality / Risk AI | Detect complaint risk, summarize survey feedback, find repeat-visit / SLA / exception patterns. | Cannot hide negative feedback, close complaint, or decide compensation. |
| Knowledge / SOP AI | Answer internal SOP, repair knowledge, brand rules, notification policy, and service process questions. | Must use permission-aware retrieval and must not expose internal-only knowledge to unauthorized roles. |
| Notification / Messaging AI | Draft safe notification copy and summarize redacted delivery diagnostics. | Cannot send, resend, queue, cancel, switch production mode, or read provider secrets. |
| Survey Feedback AI | Summarize feedback and identify low-rating or complaint risk. | Cannot alter survey response, suppress complaint, or close follow-up. |

Future implementation must give each agent category its own retrieval policy, data boundary, permission requirement, entitlement requirement, audit event family, and usage tracking category.

## Permission-aware Retrieval Principles

Future retrieval must check at least:

- `organization_id` scope,
- user identity,
- role,
- permission,
- feature entitlement,
- subscription status when applicable,
- allowed Case scope,
- allowed Customer scope,
- allowed document scope,
- customer-visible data policy,
- internal-only data policy,
- sensitive data masking / redaction,
- document visibility,
- source version / effective date,
- audit log requirement,
- SaaS usage tracking requirement.

Suggested future flow:

```text
User Request
-> Auth / Session
-> Organization Scope Check
-> Role / Permission Check
-> Feature Entitlement Check
-> AI Task Router
-> Retrieval Policy Builder
-> Permission-aware RAG Retrieval
-> Sensitive Data Masking / Redaction
-> AI Model Response
-> Human Review / Accept / Reject / Edit
-> Official Record Write, if allowed
-> Audit Log + AI Feedback Log
```

Retrieval must fail closed when scope, permission, entitlement, visibility, or data classification is ambiguous.

No AI retrieval should run without an organization filter.

No customer-visible AI answer should use internal-only sources.

No internal AI suggestion should become visible to unauthorized roles.

## RAG Source Metadata Readiness

The metadata below is conceptual only.

It is not:

- table columns,
- vector index schema,
- migration proposal,
- API schema,
- generated client contract,
- production enum.

Future RAG source metadata may include:

- `organization_id`,
- `source_type`,
- `source_id`,
- `visibility`,
- `permission_scope`,
- `customer_visible`,
- `internal_only`,
- `brand_id`,
- `vendor_id`,
- `case_id` nullable,
- `appointment_id` nullable,
- `customer_id` nullable,
- `document_id` nullable,
- `version`,
- `effective_from`,
- `effective_to`,
- `language`,
- `locale`,
- `retention_state`,
- `deletion_state`,
- `source_approval_status`,
- `created_at`,
- `updated_at`,
- `status`.

Future source categories may include:

- Case,
- Customer,
- Appointment,
- dispatch visit,
- Field Service Report,
- service parts,
- photos metadata,
- billing / settlement summary,
- repair manual,
- brand rule,
- vendor settlement rule,
- customer-service SOP,
- dispatch policy,
- quote policy,
- SLA policy,
- notification policy,
- organization settings,
- plan / entitlement policy.

RAG does not mean all data is sent to AI.

Retrieval should provide the minimum necessary context for the specific task.

## Official Record Separation

AI must not automatically:

- modify Case status,
- modify Appointment status,
- modify Field Service Report status,
- select or change `finalAppointmentId`,
- approve quote,
- approve billing / settlement,
- send notification,
- resend notification,
- close complaint,
- hide negative feedback,
- write formal customer consent,
- write formal customer approval,
- write official audit event as if a human/system action occurred,
- write uncertain content into official record.

AI may:

- organize information,
- summarize,
- suggest,
- flag risk,
- draft copy,
- remind missing fields,
- classify for review,
- provide cited sources,
- prepare an official record candidate for authorized human review.

Human review states should be explicit:

- AI suggestion generated,
- viewed by human,
- accepted by human,
- rejected by human,
- edited by human,
- written to official record by authorized human or deterministic workflow.

## Audit Readiness

Future audit event families may include:

- `ai.request.created`,
- `ai.rag_retrieval.requested`,
- `ai.retrieval_policy.applied`,
- `ai.retrieval.denied_by_scope`,
- `ai.retrieval.denied_by_permission`,
- `ai.retrieval.denied_by_entitlement`,
- `ai.source.cited`,
- `ai.response.generated`,
- `ai.suggestion.generated`,
- `ai.suggestion.viewed`,
- `ai.suggestion.accepted`,
- `ai.suggestion.rejected`,
- `ai.suggestion.edited`,
- `ai.output_written_to_official_record_by_human`,
- `ai.risk_flag.created`,
- `ai.risk_flag.dismissed_by_human`,
- `ai.usage.recorded`,
- `ai.feedback.recorded`.

These are placeholders only. They are not production event names, schema enums, localization keys, API responses, or audit runtime.

Future audit may record safe metadata:

- organization reference,
- actor reference,
- agent category,
- feature key,
- task type,
- retrieved source count,
- source type categories,
- model category,
- timestamp,
- human decision result,
- masked summary.

Audit redaction must prohibit:

- raw tokens,
- secrets,
- LINE access tokens,
- channel secrets,
- full customer mobile values,
- full addresses,
- signature data,
- raw provider payloads,
- provider credentials,
- AI raw sensitive payloads,
- internal retrieval diagnostics on customer-visible surfaces.

## SaaS Usage And Entitlement Readiness

Future AI and RAG capabilities should be governed by entitlement, permission, and usage controls.

Future questions:

- Which organizations have AI add-on entitlement?
- Which agent categories require separate entitlement?
- Which agent categories require separate user permission?
- How is `request_count` calculated?
- How is `retrieval_count` calculated?
- Should token usage be stored?
- What is the billing period?
- What are rate limits and quotas?
- How are AI costs controlled by organization / feature key / agent category?
- Are customer-facing AI and internal AI metered separately?
- How are AI failures, safe-deny, and denied retrieval attempts counted?
- Which AI actions require supervisor review?

Placeholder feature keys may include:

- `ai_case_summary`,
- `ai_intake_structuring`,
- `ai_dispatch_suggestion`,
- `ai_repair_time_estimation`,
- `ai_completion_summary`,
- `ai_fault_classification`,
- `ai_settlement_check`,
- `ai_customer_feedback_summary`,
- `ai_sla_risk_detection`,
- `ai_risk_radar`,
- `ai_rag_knowledge_query`,
- `ai_notification_copy_assist`,
- `ai_survey_feedback_summary`,
- `ai_sop_assistant`.

These are future design placeholders only.

Task247 does not add entitlement runtime, usage metering runtime, billing, pricing, seed data, API checks, Admin UI, or feature flags.

## Safe-deny And Non-leakage

Future AI and RAG safe-deny principles:

- unauthorized retrieval must fail closed,
- cross-organization retrieval must fail closed,
- hidden source existence must not be revealed,
- missing entitlement must not reveal plan detail on customer-visible surfaces,
- AI must not answer whether an unauthorized Case, customer, document, LINE binding, provider config, or billing record exists,
- AI must not disclose internal SOP / billing / settlement / audit / provider diagnostics on customer-visible surfaces,
- AI must not explain denial with sensitive internal policy details to unauthorized users,
- customer-facing output must use generic unavailable wording when necessary,
- internal diagnostics must remain role-gated, organization-scoped, redacted, and auditable.

Examples:

- If source scope is ambiguous, do not retrieve.
- If source visibility is internal-only and the user is in a customer-visible context, do not retrieve.
- If permission is missing, do not reveal whether the source exists.
- If entitlement is missing, do not expose subscription or plan internals to the customer.
- If sensitive data cannot be safely masked, do not include it in AI context.

## Future Readiness Checklist

Before any AI agent or RAG runtime is implemented, future tasks should define:

- retrieval policy builder,
- organization scope enforcement,
- permission mapping,
- entitlement mapping,
- source visibility model,
- source metadata model,
- source versioning policy,
- sensitive data redaction policy,
- customer-visible / internal data separation,
- audit event catalog,
- usage metering design,
- safe-deny response matrix,
- prompt and context allow-list,
- human accept / reject / edit workflow,
- official record write boundary,
- AI feedback log,
- model/provider configuration policy,
- no raw secret / token / provider payload policy,
- test / smoke strategy.

Task247 does not implement any checklist item.

## Explicit Non-goals

Task247 does not:

- add AI agent runtime,
- add RAG runtime,
- add embeddings,
- add vector DB,
- add retrieval service,
- add prompt registry,
- add tool execution,
- add worker,
- add scheduler,
- add migration,
- modify schema,
- add index,
- add API,
- modify backend `src/`,
- modify Admin `admin/src/`,
- add audit runtime,
- add permission runtime,
- add entitlement runtime,
- add usage runtime,
- add feature flags,
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

Task247 should be verified with:

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

Future candidates only; not executed by Task247:

- AI Agent Retrieval Policy Matrix / No Runtime Change,
- AI RAG Source Metadata Proposal / No Migration,
- AI Audit Event Catalog / No Runtime Change,
- AI Safe-deny And Non-leakage Matrix / No Runtime Change,
- AI Usage Metering And Entitlement Matrix / No Runtime Change,
- AI Official Record Write Boundary Design / No Runtime Change,
- AI Agent Branch Pause Summary / No Runtime Change.
