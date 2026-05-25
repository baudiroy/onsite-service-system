# Task 252 - AI Audit Event Catalog And Redaction Policy / No Runtime Change

## Purpose And Scope

This document defines future AI audit event families and redaction boundaries for AI agent, RAG retrieval, retrieval policy builder, source citation, AI suggestion, human accept / reject / edit, usage tracking, safe-deny, and AI safety block flows.

Task252 is documentation-only.

This task is not:

- AI audit runtime implementation,
- AI agent runtime,
- RAG runtime,
- retrieval service,
- usage metering runtime,
- API contract,
- Admin UI,
- migration / schema proposal,
- automated test implementation,
- AI auto-decision engine.

Task252 does not create audit tables, change audit tables, add APIs, add Admin UI, implement AI runtime, or execute any DB operation.

## AI Audit Principles

Future AI audit exists to support accountability, not customer-visible explanation.

Principles:

- AI audit log is internal-only.
- AI audit must not become a customer-visible response.
- AI audit must be organization-scoped.
- AI audit must be permission-aware.
- AI audit must record human accept / reject / edit where applicable.
- AI audit must not record raw sensitive payload.
- AI audit must not replace official record.
- AI audit must not become justification for AI auto-decision.
- AI audit should support redacted correlation reference.
- AI audit should distinguish human action, system evaluation, retrieval event, AI advisory output, safe-deny / safety block, and usage event.

AI audit should help reviewers answer:

- who asked,
- what type of AI task was attempted,
- what policy category allowed or denied the task,
- whether retrieval was permitted,
- whether AI suggestion was accepted, rejected, or edited by a human,
- whether an official record was later changed by a human or approved deterministic workflow,
- whether sensitive data was protected.

## Audit Event Family Catalog

The event families below are placeholders only.

They are not:

- production event names,
- DB schema values,
- production enums,
- API response fields,
- localization keys,
- generated client contracts,
- runtime behavior.

### A. AI Request Lifecycle

Future examples:

- `ai.request.created`,
- `ai.request.allowed`,
- `ai.request.denied`,
- `ai.request.safety_blocked`,
- `ai.request.completed`,
- `ai.request.failed`.

Purpose:

- record AI request lifecycle category,
- record safe allow / deny / block outcome,
- support internal troubleshooting without exposing raw prompt or response.

### B. Retrieval Policy Events

Future examples:

- `ai.retrieval_policy.built`,
- `ai.retrieval_policy.denied`,
- `ai.retrieval_policy.organization_filter_applied`,
- `ai.retrieval_policy.permission_filter_applied`,
- `ai.retrieval_policy.entitlement_filter_applied`,
- `ai.retrieval_policy.visibility_filter_applied`.

Purpose:

- record that retrieval policy was evaluated,
- record safe policy categories,
- demonstrate organization / permission / entitlement / visibility filters were applied.

### C. RAG Retrieval Events

Future examples:

- `ai.retrieval.requested`,
- `ai.retrieval.denied`,
- `ai.retrieval.result_returned`,
- `ai.retrieval.result_filtered`,
- `ai.retrieval.source_excluded`,
- `ai.retrieval.cross_org_blocked`.

Purpose:

- record retrieval decision path,
- record denied / filtered / excluded categories,
- keep cross-organization protection auditable without exposing hidden resources.

### D. Source Citation Events

Future examples:

- `ai.source.cited`,
- `ai.source.version_used`,
- `ai.source.expired_blocked`,
- `ai.source.disabled_blocked`,
- `ai.source.visibility_blocked`,
- `ai.source.citation_missing`.

Purpose:

- record safe source citation category,
- preserve version/effective-date accountability,
- record blocked source reason categories without exposing restricted source content.

### E. Suggestion Lifecycle

Future examples:

- `ai.suggestion.generated`,
- `ai.suggestion.viewed`,
- `ai.suggestion.accepted`,
- `ai.suggestion.rejected`,
- `ai.suggestion.edited`,
- `ai.suggestion.low_confidence_ignored`,
- `ai.suggestion.unsafe_blocked`.

Purpose:

- distinguish generated suggestion from human adoption,
- trace human review,
- prevent AI output from becoming official record without review.

### F. Official Record Adjacent Events

Future examples:

- `ai.official_write.proposed`,
- `ai.official_write.human_accepted`,
- `ai.official_write.human_edited`,
- `ai.official_write.rejected`,
- `ai.official_write.blocked_ai_direct_write`.

Purpose:

- record official-record-adjacent AI suggestions,
- prove AI direct write attempts are blocked,
- trace when a human or approved deterministic workflow adopts AI output.

### G. Usage / Cost Events

Future examples:

- `ai.usage.evaluated`,
- `ai.usage.recorded`,
- `ai.usage.blocked`,
- `ai.quota.reached`,
- `ai.rate_limit.applied`,
- `ai.cost_threshold.reached`.

Purpose:

- record AI usage / quota / cost control categories,
- distinguish usage evaluation from billing,
- avoid customer-visible exposure of cost or plan internals.

### H. Safe-deny / Non-leakage Events

Future examples:

- `ai.safe_deny.rendered`,
- `ai.hidden_resource_denied`,
- `ai.customer_visible_internal_source_blocked`,
- `ai.permission_denied_generic`,
- `ai.entitlement_denied_generic`.

Purpose:

- record safe-deny category,
- prevent protected resource enumeration,
- preserve non-leakage for customer-visible surfaces.

## Suggested Future Event Fields

The fields below are conceptual only.

They are not:

- DB columns,
- API schema,
- production enum,
- migration proposal,
- generated client fields.

Future event metadata may include:

- event family,
- event action,
- organization reference,
- actor reference,
- actor role category,
- agent type,
- task type,
- source type category,
- target reference type,
- target reference,
- permission context category,
- entitlement context category,
- usage context category,
- retrieval policy reference,
- source citation reference,
- suggestion reference,
- result category,
- safe reason category,
- redacted metadata category,
- correlation reference,
- occurred at.

Event metadata should use references and categories rather than raw payloads.

## Forbidden Audit Content

AI audit events must not contain:

- raw AI prompt with sensitive data,
- raw AI response with sensitive data,
- raw RAG retrieved content when internal-only,
- full customer mobile values,
- full addresses,
- signature data,
- raw LINE user ids,
- tokens,
- secrets,
- passwords,
- LINE access tokens,
- channel secrets,
- provider credentials,
- raw provider payloads,
- DATABASE_URL values,
- SQL errors,
- DB constraint names,
- stack traces,
- production translation strings,
- full customer free-text when not necessary,
- attachment binary,
- photo binary,
- signature binary.

If future audit needs evidence, it should store safe references, hashes, redacted summaries, or category values rather than raw sensitive content.

## Customer-visible vs Internal Separation

Customer-facing surfaces must not see AI audit logs.

Customer-facing surfaces must not show:

- internal source names,
- retrieval diagnostics,
- permission internals,
- entitlement internals,
- usage internals,
- cost internals,
- confidence,
- internal risk label,
- hidden source categories,
- provider diagnostics,
- raw AI prompt,
- raw AI response,
- audit event categories that reveal protected resources.

Internal surfaces must still require:

- authenticated user,
- organization scope,
- role permission,
- entitlement where applicable,
- redaction,
- audit access logging.

AI audit is internal accountability data, not customer messaging content.

## Organization Isolation And Permission Scope

AI audit must be organization-scoped.

Principles:

- cross-organization AI audit view must not exist by default,
- Admin permission must not bypass organization isolation,
- retrieval denied events must not reveal hidden resources to unauthorized users,
- source hidden events must not reveal source existence to unauthorized users,
- internal-only source blocked events must not reveal source content to unauthorized users,
- audit export, if ever implemented, requires permission, entitlement, and redaction,
- security / supervisor roles must still operate within organization scope unless an explicitly designed super-admin governance model exists.

Task252 does not define super-admin audit runtime.

## Human Control And Official Record Audit

Human accept / reject / edit is a critical future audit event family.

Principles:

- AI direct official write must be blocked,
- human adoption of AI suggestion must be traceable,
- official record writer should be human actor or approved deterministic workflow,
- AI suggestion version should be traceable,
- source citation should be traceable when used,
- human edit delta should be traceable where risk requires it,
- uncertain content must not be written into official record as fact.

Official record audit and AI audit should remain related but distinct.

AI audit records why an AI suggestion existed. Official record audit records who changed the official record and under what workflow.

## SaaS Usage Readiness

Future questions:

- Are AI audit events counted as usage?
- Are denied retrieval events counted as usage?
- Are safety-blocked requests counted as usage?
- Are human accept / reject / edit actions usage-counted?
- Does audit export require entitlement?
- Does AI audit retention differ by plan?
- Is AI audit dashboard a higher-plan feature?
- Can Enterprise tenants export AI audit?
- Can customer-facing AI audit summaries ever be offered, or should they remain internal-only?

Task252 does not implement usage, billing, export, retention, or dashboard runtime.

## AI Advisory-only Boundary

AI may:

- summarize redacted AI audit trail,
- flag audit coverage gaps,
- remind reviewers about possible sensitive data exposure,
- organize human review context,
- suggest missing audit categories for human review.

AI must not:

- automatically create audit event,
- automatically modify audit event,
- automatically delete audit event,
- automatically hide audit event,
- automatically modify official record,
- automatically approve its own suggestion,
- automatically remove safety block,
- bypass permission,
- bypass entitlement,
- bypass organization scope,
- write uncertain content into official audit fact.

AI can help inspect audit readiness. It cannot become the audit authority.

## Explicit Non-goals

Task252 does not:

- create AI audit table,
- modify audit table,
- add AI runtime,
- add RAG runtime,
- add retrieval service,
- add usage metering runtime,
- add API,
- modify backend `src/`,
- modify Admin `admin/src/`,
- add migration,
- modify schema,
- add index,
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
- implement permission runtime,
- implement entitlement runtime,
- implement AI auto-decision,
- implement billing / invoice / payment runtime.

## Verification Checklist

Task252 should be verified with:

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
- actual AI token counts,
- stack traces,
- SQL errors,
- DB constraint names,
- production translation strings.

Policy words, placeholders, prohibition lists, and guardrail references are allowed when they do not include actual sensitive values.

## Future Task Candidates

Future candidates only; not executed by Task252:

- AI Audit Redaction Allow-list / No Runtime Change,
- AI Audit Access Permission Matrix / No Runtime Change,
- AI Audit Export Policy / No Runtime Change,
- AI Safe-deny Event Matrix / No Runtime Change,
- AI Agent Branch Pause Summary / No Runtime Change.
