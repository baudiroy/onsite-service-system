# Task 255 - AI Source Visibility Permission Matrix / No Runtime Change

## Purpose And Scope

This document defines future source visibility boundaries for AI / RAG retrieval, source citation display, source detail viewing, customer-facing AI answers, internal AI suggestions, and official-record-adjacent human review.

Task255 is documentation-only.

This task is not:

- source visibility runtime implementation,
- permission runtime implementation,
- RAG runtime,
- retrieval service,
- vector DB / embedding implementation,
- AI review runtime,
- API contract,
- Admin UI,
- migration / schema proposal,
- automated test implementation,
- AI auto-decision engine.

Task255 does not add source visibility tables, permissions, roles, entitlements, APIs, Admin UI, migrations, schema, AI runtime, RAG runtime, retrieval service, vector DB, embedding, audit runtime, permission runtime, entitlement runtime, usage runtime, or automated tests.

## Core Source Visibility Principles

Source visibility must be checked independently from AI suggestion visibility.

Future principles:

- Seeing an AI suggestion does not mean the actor can see source detail.
- Seeing a source citation does not mean the actor can see full source content.
- Customer-facing AI can use only customer-visible sources.
- Internal-only source must not leak into customer-facing answer.
- Source visibility must not cross organization boundaries.
- Source visibility must not be expanded by AI.
- Missing visibility must fail closed.
- Unknown visibility must fail closed.
- Hidden source must not leak existence through citation metadata.
- Retrieval policy must include organization scope and surface-specific visibility rules.
- Display policy must be checked separately from retrieval policy.

The system should treat source visibility as a safety boundary, not a UI preference.

## Conceptual Source Visibility Categories

The categories below are conceptual only.

They are not:

- production enum,
- DB schema,
- API contract,
- generated client field,
- Admin UI option,
- runtime behavior.

Future source visibility categories may include:

- customer-visible,
- internal-only,
- role-restricted,
- supervisor-only,
- engineer-facing,
- dispatcher-facing,
- billing / settlement restricted,
- complaint / quality restricted,
- provider diagnostic restricted,
- audit / security restricted,
- AI-advisory-only source,
- disabled / expired / superseded source,
- draft / unapproved source.

Future implementation must define exact source metadata, defaults, lifecycle, and fallback policy before any runtime work.

## Actor-to-source Visibility Matrix

This matrix is proposal-only.

All rows have Runtime allowed now = No.

| Actor category | Customer-visible source | Internal-only source | Role-restricted source | Billing / settlement source | Provider diagnostic source | Audit / security source | Draft / unapproved source | Customer-facing answer allowed? | Source citation allowed? | Source detail allowed? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Customer | Yes, if approved for that customer surface | No | No | No | No | No | No | Yes, customer-safe only | Customer-safe citation only | Customer-safe detail only | No |
| Customer service | Yes | Yes, if permissioned | Yes, if role permits | No by default | No | No | No by default | Yes, but only with customer-visible output | Yes, if source visible | Yes, if source visible | No |
| Dispatcher | Yes | Yes, if permissioned | Dispatch-related only | No by default | No | No | No by default | No by default | Yes, if dispatch source visible | Yes, if dispatch source visible | No |
| Engineer | Yes for assigned work | Engineer-facing only | Assigned appointment / case scope only | No by default | No | No | No by default | No by default | Yes, if engineer-facing | Yes, if engineer-facing | No |
| Supervisor / quality manager | Yes | Yes, if permissioned | Quality / complaint scope | No by default | No by default | Restricted | Maybe, if review policy permits | No by default | Yes, if source visible | Yes, if source visible | No |
| Billing / settlement reviewer | Yes | Yes, if permissioned | Billing-related scope | Yes, if billing permissioned | No by default | No by default | Maybe, if billing review policy permits | No by default | Yes, if billing source visible | Yes, if billing source visible | No |
| Tenant admin | Yes | Yes, if permissioned | Tenant admin scope | Maybe, if permissioned | No by default | Restricted | Maybe, if tenant policy permits | No by default | Yes, if source visible | Yes, if source visible | No |
| Security / support role | Restricted | Restricted | Restricted | Restricted | Restricted | Yes, if authorized | Restricted | No by default | Yes, if security policy permits | Yes, if security policy permits | No |
| AI advisory process | Only via retrieval policy | Only via retrieval policy | Only via retrieval policy | Only via retrieval policy | No by default | No by default | No by default | No direct authority | No direct authority | No direct authority | No |
| System process | Only deterministic allowed sources | Only deterministic allowed sources | Only deterministic allowed sources | Only deterministic allowed sources | Restricted | Restricted | No by default | No direct customer output unless approved workflow | No direct authority | No direct authority | No |

## Surface-specific Source Rules

The surfaces below are future conceptual surfaces only.

They are not Admin UI, API, runtime, or product implementation.

### Customer-facing Chat / Answer

Allowed source categories:

- customer-visible,
- customer-specific data that policy permits the customer to see,
- human-approved response templates,
- customer-visible SOP content.

Not allowed:

- internal-only source,
- billing / settlement internal source,
- provider diagnostic source,
- audit / security source,
- complaint risk label,
- hidden source,
- expired / disabled / superseded source unless transformed into approved customer-safe wording by policy.

### Admin Internal AI Suggestion

Allowed source categories depend on reviewer permission:

- customer-visible,
- internal-only,
- role-restricted,
- source categories matching the reviewer role.

Admin internal suggestion must still avoid showing hidden source to users without source permission.

### Engineer Completion Assistant

Allowed source categories:

- engineer-facing,
- assigned appointment / case source,
- customer-visible work context,
- service-history summary that the engineer may view,
- checklist / SOP sources assigned to engineer workflow.

Not allowed by default:

- billing / settlement internals,
- audit / security source,
- unrelated complaint risk detail,
- provider diagnostics.

### Billing / Settlement Assistant

Allowed source categories:

- billing / settlement restricted source when permissioned,
- vendor / brand rule source when permissioned,
- customer approval record summary when permissioned,
- service report and appointment summaries needed for settlement review.

Not allowed by default:

- unrelated complaint risk details,
- provider diagnostics,
- customer-facing-only wording as settlement proof unless policy allows.

### Quality / Complaint Assistant

Allowed source categories:

- complaint / quality restricted source when permissioned,
- customer feedback summary,
- service history summary,
- supervisor review note if permissioned.

Not allowed by default:

- billing internals unless relevant and permissioned,
- provider diagnostics,
- restricted audit details without security permission.

### Notification Copy Assistant

Allowed source categories:

- customer-visible case / appointment / completion context,
- approved template policy,
- notification policy source,
- customer communication preference summary if permissioned.

Not allowed:

- internal-only risk label,
- billing internal source,
- audit / security source,
- provider diagnostics,
- hidden channel identity details.

### Survey Feedback Assistant

Allowed source categories:

- survey response summary if permissioned,
- customer-visible feedback fields,
- complaint / quality source if permissioned,
- service completion context.

Not allowed by default:

- raw provider payload,
- raw channel identifiers,
- audit / security source,
- billing internals.

### Audit / Security Review Assistant

Allowed source categories:

- audit / security restricted source if authorized,
- provider diagnostic source if authorized,
- redacted AI audit events,
- safe policy categories.

Not allowed:

- customer-visible output reuse without policy transformation,
- unredacted sensitive payload,
- unrestricted cross-tenant source access.

## Source Citation Display Policy

Citation display must check source visibility.

Principles:

- Citation title may leak hidden source existence.
- Customer-facing citation may display only customer-visible sources.
- Internal citation may show redacted source title only when permissioned.
- Hidden or restricted citation should collapse to generic unavailable.
- Expired / superseded source citation should show safe warning only to authorized internal reviewer.
- Disabled / deleted source citation should not support current action.
- Source version display must be permission-aware.
- Effective date display must be permission-aware.
- Citation metadata should not reveal inaccessible source type, title, owner, customer, case, provider, or diagnostic details.

Source citation is evidence for review. It is not permission to show full source content.

## Retrieval vs Display Separation

Retrieval, display, and official write are separate checks.

Principles:

- Retrieval allowed does not necessarily mean display allowed.
- Display allowed does not necessarily mean official write allowed.
- Citation allowed does not necessarily mean full source detail allowed.
- Internal reviewer access does not necessarily mean customer-facing reuse is allowed.
- AI may summarize only within surface-specific visibility constraints.
- Policy builder output must include retrieval scope and display surface.
- A source can be relevant for internal review while forbidden for customer-visible output.

Example: an internal quality risk source may be retrieved for supervisor review, but the customer-facing response must not reveal that internal risk source exists.

## Official Workflow And Source Visibility

Official-record-adjacent AI suggestions require source visibility discipline.

Principles:

- Official record write based on AI suggestion should preserve authorized source trace.
- Source hidden from writer means that writer cannot officially adopt that source-backed suggestion.
- Billing official action requires billing source visibility.
- Complaint / quality action requires complaint / quality source visibility.
- Field Service Report write must not cite customer-invisible internal analysis as customer-facing fact.
- Notification content must not expose source categories that are internal-only.
- Survey follow-up must not expose hidden quality / complaint diagnostics to the customer.
- `finalAppointmentId` must not be decided by AI or source suggestion.

Official writer must be a human actor or approved deterministic workflow with the target workflow permission.

## Safe-deny And Non-leakage

Future source visibility denial must fail safely.

Safe-deny principles:

- No source permission -> generic unavailable.
- Source hidden -> do not disclose existence.
- Source expired -> generic unavailable unless authorized internal surface may see safe warning.
- Source disabled -> generic unavailable unless authorized internal surface may see safe warning.
- Source deleted -> generic unavailable unless authorized internal audit requires redacted trace.
- Cross-organization source match -> deny without disclosure.
- Customer-facing answer must not say "I found an internal SOP but cannot show it."
- AI must not imply a hidden source supports a conclusion.
- AI must not use hidden source content to produce customer-facing answer.

The absence of a visible source should not reveal whether a hidden source exists.

## Audit Readiness

Future audit event examples:

- `ai.source_visibility.evaluated`,
- `ai.source_visibility.denied`,
- `ai.source_citation.hidden`,
- `ai.source_detail.viewed`,
- `ai.source_detail.denied`,
- `ai.customer_facing_internal_source.blocked`,
- `ai.source_visibility_mismatch.detected`,
- `ai.source_display_policy.applied`,
- `ai.source_version.warning_shown`,
- `ai.hidden_source_leakage.prevented`.

These are placeholders only.

They are not:

- production event names,
- DB enum values,
- localization keys,
- API response fields,
- generated client contracts,
- audit runtime.

Audit redaction must prohibit:

- full customer mobile values,
- full addresses,
- raw LINE user ids,
- tokens,
- secrets,
- raw provider payloads,
- raw AI sensitive payloads,
- internal audit details on customer-visible surfaces.

Audit should record source visibility decisions as safe categories without exposing hidden source content.

## Permission / Entitlement Readiness

Future implementation must answer:

- Which roles may view source citation?
- Which roles may view source detail?
- Which source types require higher plan?
- Does provider diagnostic source require special entitlement?
- Does AI source detail view count toward usage?
- Should source visibility denied create audit?
- Does customer-facing AI require an independent source allow-list?
- Which source categories are allowed for each AI agent?
- Which source categories are allowed for each customer-facing channel?
- Which source categories are allowed for official record adoption?

These are future design questions only.

## AI Advisory-only Boundary

AI can:

- use authorized source to generate suggestion,
- display authorized citation,
- remind source visibility mismatch,
- suggest human reviewer gather visible source,
- classify source visibility gap,
- produce customer-safe answer from customer-visible source.

AI cannot:

- change source visibility,
- display hidden source,
- cite unauthorized source to customer-facing surface,
- perform cross-organization retrieval,
- write hidden source content into official record,
- modify Case,
- modify Appointment,
- modify Field Service Report,
- approve quote,
- approve settlement,
- approve refund,
- approve compensation,
- send notification,
- close complaint,
- decide `finalAppointmentId`.

AI has no authority to expand visibility or override a source policy.

## Explicit Non-goals

Task255 does not:

- add source visibility table,
- add permission,
- add role,
- add entitlement,
- add RAG runtime,
- add retrieval service,
- add AI review runtime,
- add API,
- modify backend source,
- modify Admin source,
- add migration,
- change schema,
- add index,
- add audit runtime,
- add permission runtime,
- add entitlement runtime,
- add usage metering runtime,
- add worker,
- add scheduler,
- add tests,
- add smoke tests,
- modify `package.json`,
- modify inventory docs,
- touch Migration020,
- touch shared Zeabur runtime,
- connect to DB,
- run DDL,
- implement AI agent runtime,
- implement embedding,
- implement vector DB,
- implement provider sending,
- implement notification runtime,
- implement survey runtime,
- implement AI auto-decision,
- implement official record write by AI.

## Future Runtime Readiness Checklist

Before future implementation, a new task should verify:

- every source has explicit visibility category or fail-closed default,
- every retrieval includes organization scope,
- retrieval policy includes display surface,
- source citation display checks source visibility,
- source detail viewing checks stricter permission than citation,
- customer-facing output allows only customer-visible source,
- hidden source existence cannot be inferred from citation metadata,
- expired / disabled / superseded sources cannot support current action by default,
- official write cannot adopt hidden-source-backed suggestion by unauthorized writer,
- audit records source visibility decisions with redaction,
- AI cannot expand source visibility.

## Future Task Candidates

Future tasks may include:

- AI source visibility metadata schema proposal,
- AI source visibility role mapping,
- customer-facing source allow-list policy,
- AI source citation display UX requirements,
- AI source detail safe-deny copy catalog,
- AI source visibility audit event hardening,
- AI source visibility test plan,
- AI retrieval policy builder source visibility extension,
- AI official write source trace policy,
- AI source visibility runtime readiness gate.

These are future candidates only. Task255 does not execute them.
