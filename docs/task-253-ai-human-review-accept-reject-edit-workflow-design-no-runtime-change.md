# Task 253 - AI Human Review And Accept-Reject-Edit Workflow Design / No Runtime Change

## Purpose And Scope

This document defines future human review boundaries for AI suggestions, RAG-grounded answers, risk flags, drafts, classifications, structured extractions, and missing-information warnings before they can influence any official workflow.

Task253 is documentation-only.

This task is not:

- AI human review runtime implementation,
- AI suggestion table implementation,
- official record write workflow,
- AI agent runtime,
- RAG runtime,
- API contract,
- Admin UI,
- migration / schema proposal,
- audit runtime,
- automated test implementation,
- AI auto-decision engine.

Task253 does not add review tables, suggestion tables, APIs, Admin UI, migrations, schema, AI runtime, RAG runtime, audit runtime, permission runtime, entitlement runtime, usage runtime, or automated tests.

## Core Human-control Principles

AI suggestion must stay under human control.

Future principles:

- AI suggestion must be reviewed by a human actor before it can affect official workflow.
- AI must not accept its own suggestion.
- AI must not reject, hide, or delete audit records.
- Human accept / reject / edit actions must be traceable.
- Human actor must be organization-scoped.
- Human actor must have the required permission for the target workflow.
- Human edits must be distinguishable from the original AI suggestion.
- AI suggestion is not an official fact.
- Uncertain content must not be written into official records as fact.
- AI confidence and explanation are review aids, not approval authority.
- Human adoption must not bypass workflow validation, role permission, feature entitlement, or organization isolation.

The purpose of human review is not to make AI slower. It is to make AI useful without turning uncertain or unauthorized output into official business state.

## Reviewable AI Output Categories

The categories below are conceptual only.

They are not:

- production enum,
- DB schema,
- API contract,
- generated client field,
- Admin UI option,
- runtime behavior.

Future reviewable categories may include:

- service summary draft,
- Field Service Report draft text,
- appointment outcome extraction,
- billing / settlement suggestion,
- quote risk suggestion,
- complaint risk flag,
- survey feedback summary,
- notification copy draft,
- customer channel identity ambiguity suggestion,
- dispatch recommendation,
- SOP answer,
- missing information warning,
- unsafe action warning.

Each category should define:

- who may review it,
- who may adopt it,
- which sources may support it,
- whether it is customer-visible or internal-only,
- whether supervisor, billing, quality, or security review is required,
- whether it can ever be copied into an official workflow.

## Accept / Reject / Edit Action Semantics

Future review actions should be explicit and auditable.

These actions are conceptual only.

They are not:

- production workflow states,
- DB status enum,
- API request fields,
- localization keys,
- Admin UI implementation.

### Accept

Accept means an authorized human adopts the AI suggestion for a defined next step.

Accept does not mean AI becomes the official writer. The official writer should be the human actor or an approved deterministic workflow.

Accept must still respect:

- organization scope,
- permission,
- entitlement if applicable,
- target workflow validation,
- official record write rules,
- audit and redaction policy.

### Reject

Reject means an authorized human explicitly does not adopt the AI suggestion.

Reject should be available when:

- the suggestion is wrong,
- the sources are not applicable,
- the confidence is too low,
- the suggestion is unsafe,
- the suggestion conflicts with policy,
- the suggestion is outside the reviewer permission scope.

Rejecting a suggestion should not delete the evidence that a suggestion was generated and reviewed.

### Edit

Edit means a human changes the AI suggestion before it can be used.

Future systems should preserve the distinction between:

- original AI suggestion,
- human edited text or structured value,
- official record candidate,
- final official record.

High-risk edits should keep a safe delta category or summary without storing raw sensitive payload.

### Dismiss

Dismiss means the reviewer closes or ignores the suggestion without making an explicit official decision.

Dismiss does not mean:

- official denial,
- customer rejection,
- quality review closure,
- complaint closure,
- billing rejection.

Dismiss is a workflow convenience, not an official business result.

### Escalate

Escalate means the reviewer sends the AI suggestion to another human role, such as supervisor, security, billing, settlement, dispatch lead, or quality reviewer.

Escalation must not expose sources or diagnostics to users who lack permission.

### Need More Evidence

Need more evidence means the reviewer cannot decide safely with the current suggestion and sources.

Future behavior may request:

- additional customer information,
- more photos,
- missing serial number,
- customer approval record,
- valid quote,
- current policy document,
- refreshed RAG retrieval,
- supervisor review.

Need more evidence should not cause AI to improvise facts.

## Official Record Write Boundary

Human acceptance should not automatically equal official record write unless a future deterministic workflow explicitly defines that behavior.

Official record writes must pass existing business rules and validation.

AI must not directly modify:

- Case,
- Appointment,
- dispatch visit result,
- Field Service Report,
- `finalAppointmentId`,
- Billing,
- Settlement,
- Quote approval,
- Customer approval record,
- Complaint,
- Survey,
- Notification,
- Customer channel identity,
- Audit log facts.

If AI content is copied into an official workflow, the future system should preserve safe traceability:

- AI suggestion reference,
- human reviewer reference,
- source citation reference when allowed,
- human edit category,
- target official record reference,
- audit reference.

`finalAppointmentId` remains backend / system determined. AI must not choose it, and normal human review must not become a manual final appointment picker.

## Required Future Review Metadata

The fields below are conceptual only.

They are not:

- DB columns,
- migration proposal,
- API schema,
- production enum,
- generated client field.

Future review metadata may include:

- suggestion reference,
- suggestion version,
- agent type,
- task type,
- organization reference,
- actor reference,
- reviewer role category,
- permission context,
- source citation reference,
- confidence category,
- explanation category,
- accept / reject / edit action,
- human edit delta category,
- review reason,
- target official record reference,
- audit reference,
- occurred at.

Metadata must be designed for accountability and redaction. It should not become a place to store raw prompts, full AI responses, raw provider payloads, full customer mobile values, full addresses, raw LINE user ids, signatures, tokens, secrets, or internal diagnostics on customer-visible surfaces.

## Source Citation And Evidence Review

AI suggestions based on RAG should show authorized source citations to reviewers who have permission to see them.

Principles:

- Reviewer must not see unauthorized source content.
- Customer-facing review surfaces must not expose internal-only sources.
- Missing citation should lower trust or require review.
- Expired source should not support current action by default.
- Superseded source should not support current action by default.
- Disabled source should not support current action.
- Reviewer may reject a source citation as not applicable.
- Source citation supports human judgment; it is not automatic approval.

Future citation display should prefer safe references and summaries over raw source dumps.

## Permission / Organization Scope Readiness

Future implementation must answer these permission questions before runtime work starts:

- Who can review AI suggestion?
- Who can accept AI suggestion?
- Who can reject AI suggestion?
- Who can edit AI suggestion?
- Who can dismiss AI suggestion?
- Who can escalate AI suggestion?
- Who can view confidence?
- Who can view explanation?
- Who can view retrieved sources?
- Who can copy AI content into official workflow?
- Which AI suggestions require supervisor review?
- Which AI suggestions require billing / settlement permission?
- Which AI suggestions require quality / complaint permission?
- Which AI suggestions require security or privacy review?

Every review action must be organization-scoped. No review action may cross tenant boundaries, line channel boundaries, or hidden resource boundaries.

## Audit Readiness

Future audit event examples:

- `ai.suggestion_review.opened`,
- `ai.suggestion_review.accepted`,
- `ai.suggestion_review.rejected`,
- `ai.suggestion_review.edited`,
- `ai.suggestion_review.dismissed`,
- `ai.suggestion_review.escalated`,
- `ai.suggestion_review.evidence_requested`,
- `ai.source_citation.viewed`,
- `ai.source_citation.rejected`,
- `ai.content_copied_to_official_workflow_by_human`,
- `ai.unsafe_suggestion.blocked`,
- `ai.low_confidence.ignored`.

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
- LINE access tokens,
- channel secrets,
- raw provider payloads,
- provider credentials,
- raw AI sensitive payloads,
- internal audit details on customer-visible surfaces.

Audit should answer who reviewed, adopted, edited, rejected, dismissed, escalated, or blocked an AI output. It must not make AI the official actor.

## Customer-visible vs Internal-only Separation

Customer-visible surfaces must not expose:

- internal AI confidence,
- internal risk flag,
- internal source citation,
- reviewer decision note,
- permission diagnostics,
- entitlement diagnostics,
- raw AI payload,
- internal audit,
- rejected AI suggestion,
- hidden resource existence,
- provider diagnostics,
- billing / settlement internals.

Customer-visible surfaces may show:

- human-approved response,
- customer-visible AI-assisted wording after approval,
- safe source-based answer if policy permits,
- approved next-step wording,
- human-reviewed explanation written for customer context.

Internal review surfaces must remain role-gated, organization-scoped, and redacted.

## AI Advisory-only Boundary

AI can:

- generate suggestion,
- provide draft,
- remind missing information,
- flag risk,
- provide source citation,
- suggest review priority,
- draft safe wording,
- summarize authorized context,
- classify candidate data for human review.

AI cannot:

- automatically accept,
- automatically reject,
- automatically edit,
- automatically write official record,
- automatically modify Case,
- automatically modify Appointment,
- automatically modify Field Service Report,
- automatically approve quote,
- automatically approve settlement,
- automatically approve refund,
- automatically approve compensation,
- automatically create or close complaint,
- automatically send notification,
- automatically unsuppress notification,
- automatically bypass permission,
- automatically bypass entitlement,
- automatically bypass organization scope,
- treat uncertain content as fact.

AI remains a copilot. Human or deterministic workflow remains the accountable actor.

## Suggested Future Review Flow

The following is a conceptual flow only:

1. Authorized user requests AI help.
2. System checks organization scope, permission, entitlement, and usage policy.
3. AI task router selects allowed agent and task type.
4. Retrieval policy builder creates permission-aware policy.
5. RAG retrieval returns authorized sources only.
6. AI generates suggestion, confidence category, explanation category, and safe citations.
7. Suggestion appears on an internal review surface.
8. Human reviews the suggestion and sources.
9. Human accepts, rejects, edits, dismisses, escalates, or requests more evidence.
10. Official workflow write occurs only through approved human action or deterministic business workflow.
11. Audit records the review action with redaction.
12. Usage and cost tracking records safe usage categories if future entitlement policy requires it.

This flow is not runtime approval.

## Explicit Non-goals

Task253 does not:

- create AI review table,
- create AI suggestion table,
- add accept / reject / edit runtime,
- add official record write workflow,
- add AI agent runtime,
- add RAG runtime,
- add retrieval service,
- add embedding,
- add vector DB,
- add prompt runtime,
- add API,
- modify backend source,
- modify Admin source,
- add migration,
- change schema,
- add indexes,
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
- send provider messages,
- implement AI auto-decision,
- let AI write official records.

## Verification Checklist For Future Implementation

Before any future runtime implementation, a new task should verify:

- review actions are organization-scoped,
- reviewers have required permission,
- entitlement is checked before feature use,
- customer-visible surfaces exclude internal-only data,
- AI output and official record remain separated,
- AI cannot accept / reject / edit itself,
- AI cannot write official record directly,
- source citations are permission-filtered,
- missing or expired citation lowers trust,
- review action creates redacted audit event,
- usage tracking records safe categories only,
- no raw sensitive payload is stored in audit,
- no cross-organization retrieval is possible,
- no customer-facing output leaks hidden resources.

## Future Task Candidates

Future tasks may include:

- AI review permission matrix,
- AI review action audit event catalog hardening,
- AI suggestion storage schema proposal,
- AI source citation display policy,
- AI review Admin UX wireframe requirements,
- AI suggestion adoption API contract draft,
- AI official-record write guard design,
- AI review safe-deny copy catalog,
- AI feedback learning policy,
- AI review runtime readiness gate.

These are future candidates only. Task253 does not execute them.
