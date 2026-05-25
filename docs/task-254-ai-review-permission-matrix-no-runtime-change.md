# Task 254 - AI Review Permission Matrix / No Runtime Change

## Purpose And Scope

This document defines a future, proposal-only permission matrix for AI suggestion review, source citation viewing, confidence / explanation viewing, accept / reject / edit, escalation, copy-to-official workflow, AI audit viewing, and AI usage summary viewing.

Task254 is documentation-only.

This task is not:

- permission runtime implementation,
- entitlement runtime implementation,
- AI review runtime,
- AI suggestion API contract,
- Admin UI,
- migration / schema proposal,
- audit runtime,
- automated test implementation,
- AI auto-decision engine.

Task254 does not add permissions, roles, entitlements, seeds, APIs, Admin UI, migrations, schema, audit runtime, AI runtime, permission enforcement, entitlement enforcement, usage metering, or automated tests.

## Core Permission Principles

AI review permissions must be narrower than general AI access.

Future principles:

- AI suggestion visibility does not imply adoption permission.
- AI summary visibility does not imply retrieved source visibility.
- Source citation visibility does not imply full internal-only source detail visibility.
- Accepting AI suggestion does not imply permission to write official record.
- Editing AI suggestion does not bypass official workflow validation.
- Permission and entitlement must not be confused.
- Organization scope must be checked before AI review permission.
- AI must not become a permission subject that executes actions by itself.
- Customer-visible surfaces must not expose internal suggestion, confidence, source, audit, permission, or entitlement diagnostics.
- Official record writes require target workflow permissions even when AI produced the draft.

Permission answers "who can do this action." Entitlement answers "whether this organization has this feature." Both must pass before future runtime can allow AI review capability.

## Future Permission Catalog Draft

The permissions below are placeholders only.

They are not:

- production permissions,
- RBAC seeds,
- DB enum values,
- API enforcement,
- generated client fields,
- Admin UI permissions,
- localization keys,
- runtime behavior.

Future placeholder permissions:

- `ai.suggestion.view`,
- `ai.suggestion.accept`,
- `ai.suggestion.reject`,
- `ai.suggestion.edit`,
- `ai.suggestion.dismiss`,
- `ai.suggestion.escalate`,
- `ai.confidence.view`,
- `ai.explanation.view`,
- `ai.source_citation.view`,
- `ai.source_detail.view`,
- `ai.official_write.propose`,
- `ai.official_write.approve`,
- `ai.audit.view`,
- `ai.audit.export`,
- `ai.usage.view`.

These names are planning handles. A future RBAC task must decide actual naming, grouping, role defaults, seed strategy, migration strategy, API enforcement, and Admin visibility.

## Capability-to-permission Matrix

This matrix is proposal-only.

All rows have Runtime allowed now = No.

| Future capability | Placeholder permission | Actor category | Requires organization scope | Requires entitlement | Requires source visibility | Requires official workflow permission | Customer-visible or internal-only | Requires audit | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| View AI suggestion | `ai.suggestion.view` | Internal authorized role | Yes | Yes, if AI feature gated | No, unless source preview shown | No | Internal-only by default | Yes | No |
| View confidence | `ai.confidence.view` | Supervisor / specialist role | Yes | Yes, if AI feature gated | No | No | Internal-only | Yes | No |
| View explanation | `ai.explanation.view` | Internal authorized role | Yes | Yes, if AI feature gated | May require source visibility | No | Internal-only by default | Yes | No |
| View source citation | `ai.source_citation.view` | Role with source access | Yes | Yes, if AI feature gated | Yes | No | Internal-only unless source is customer-visible | Yes | No |
| View source detail | `ai.source_detail.view` | Role with source detail access | Yes | Yes, if source feature gated | Yes | No | Internal-only or source-policy gated | Yes | No |
| Accept suggestion | `ai.suggestion.accept` | Authorized human reviewer | Yes | Yes, if AI feature gated | Depends on category | No by itself | Internal action | Yes | No |
| Reject suggestion | `ai.suggestion.reject` | Authorized human reviewer | Yes | Yes, if AI feature gated | Depends on category | No | Internal action | Yes | No |
| Edit suggestion | `ai.suggestion.edit` | Authorized human reviewer | Yes | Yes, if AI feature gated | Depends on category | No by itself | Internal action | Yes | No |
| Escalate suggestion | `ai.suggestion.escalate` | Authorized human reviewer | Yes | Yes, if AI feature gated | Depends on category | No | Internal action | Yes | No |
| Dismiss suggestion | `ai.suggestion.dismiss` | Authorized human reviewer | Yes | Yes, if AI feature gated | No | No | Internal action | Yes | No |
| Copy AI draft into official workflow | `ai.official_write.propose` | Role allowed to propose target update | Yes | Yes, if AI feature gated | Depends on category | Yes | Internal action; output may become official only after validation | Yes | No |
| Approve official write after AI suggestion | `ai.official_write.approve` | Target workflow approver | Yes | Yes, if AI feature gated | Depends on category | Yes | Internal action; final official content follows target policy | Yes | No |
| View AI audit trail | `ai.audit.view` | Tenant admin / security / supervisor role | Yes | Maybe, if advanced audit gated | No raw source by default | No | Internal-only | Yes | No |
| Export AI audit | `ai.audit.export` | Restricted tenant admin / security role | Yes | Maybe, if advanced audit gated | No raw source by default | No | Internal-only | Yes | No |
| View AI usage summary | `ai.usage.view` | Tenant admin / billing admin | Yes | Maybe, if usage dashboard gated | No | No | Internal-only | Yes | No |

## Actor Category Boundaries

Future actor categories:

- Customer,
- customer service,
- dispatcher,
- engineer,
- supervisor / quality manager,
- billing / settlement reviewer,
- tenant admin,
- security / support role,
- system process,
- AI advisory process.

Boundary principles:

- Customer must not see internal AI suggestion, confidence, retrieved internal source, audit, permission diagnostics, entitlement diagnostics, or hidden resource existence.
- Customer service may review customer-facing draft suggestions only within organization and permission scope.
- Dispatcher may review dispatch suggestions only within assigned organization and dispatch scope.
- Engineer may review field-work assistance only for assigned or authorized appointments, and should not see billing / settlement AI suggestion by default.
- Supervisor / quality manager may review complaint risk, quality risk, escalation, and service-quality suggestions when permissioned.
- Billing / settlement reviewer may review billing / settlement suggestions, but should not see unrelated complaint risk details by default.
- Tenant admin may manage higher-level AI settings and usage summaries only if future entitlement and permission allow it.
- Security / support role access must be restricted, audited, and redacted.
- System process may act only through deterministic approved workflow.
- AI advisory process is not a permission subject and cannot grant itself access.

## Source Citation Visibility

Source visibility must be checked separately from suggestion visibility.

Principles:

- Customer-visible surface may show only customer-visible source.
- Internal-only source requires explicit source visibility permission.
- Billing / settlement source requires billing / settlement permission.
- Provider diagnostic source requires restricted support / security permission.
- Audit / security source requires restricted permission.
- Source hidden, expired, disabled, deleted, superseded, or out-of-scope should safe-deny.
- Citation metadata must not leak hidden source existence.
- Source detail viewing should be more restricted than source citation viewing.
- RAG retrieval must never omit organization scope.

Examples:

- A customer service user may view an AI response draft without seeing the internal billing source that influenced an internal risk warning.
- A billing reviewer may view settlement rule citation without seeing unrelated complaint notes.
- A customer may see a human-approved response but not the internal source citation that supported it.

## Official Write Permission Boundary

Accepting AI suggestion does not equal official write.

Official write boundaries:

- Copy-to-official requires target workflow permission.
- Field Service Report write requires report permission.
- Billing / settlement write requires billing / settlement permission.
- Complaint workflow write requires complaint permission.
- Notification send / resend requires notification permission.
- Customer approval record write requires approval-record permission.
- Quote approval requires quote / billing approval permission.
- Customer channel identity changes require channel identity permission.
- AI suggestion accept does not bypass workflow validation, audit, redaction, or status guards.
- Official writer should be the human actor or approved deterministic workflow, not AI.

`finalAppointmentId` remains backend / system determined. AI and normal manual review must not become a final appointment picker.

## Entitlement And Usage Readiness

Future implementation must answer these entitlement and usage questions:

- Which AI review capabilities require AI Add-on?
- Which source detail views require higher plan?
- Does AI audit export require advanced audit entitlement?
- Does AI usage summary require tenant admin or billing role?
- Does accept / reject / edit count toward usage?
- Does source citation viewing count toward usage?
- Does AI review dashboard belong to higher plan?
- Are AI review permissions available in Basic, Professional, Business, or Enterprise tiers?
- Which capabilities require custom Enterprise entitlement?
- Which AI capabilities should be disabled when subscription is inactive or usage limit is reached?

Entitlement denial should not reveal hidden feature internals to customer-visible surfaces.

## Safe-deny And Non-leakage

Future AI review authorization must fail safely.

Safe-deny principles:

- No permission to view suggestion -> generic not available.
- No source visibility -> citation hidden or generic unavailable.
- Cross-organization suggestion -> generic not available.
- No entitlement -> generic unavailable on customer-visible surfaces.
- Hidden source must not reveal existence.
- Internal-only confidence must not be customer-visible.
- Internal-only explanation must not be customer-visible.
- AI must not answer whether a hidden internal suggestion exists.
- AI must not reveal that an internal source, customer, case, appointment, billing item, complaint, audit event, or channel identity exists when the actor lacks permission.

Safe-deny messages should be consistent with non-enumeration policy and should not include raw diagnostics.

## Audit Readiness

Future audit event examples:

- `ai.permission.suggestion_denied`,
- `ai.permission.source_citation_view_denied`,
- `ai.source_detail.viewed`,
- `ai.suggestion.accepted`,
- `ai.suggestion.rejected`,
- `ai.suggestion.edited`,
- `ai.suggestion.escalated`,
- `ai.official_write.proposed`,
- `ai.official_write.blocked_by_permission`,
- `ai.audit.viewed`,
- `ai.audit.exported`.

These are placeholders only.

They are not:

- production event names,
- DB enum values,
- localization keys,
- API fields,
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

Audit should record permission decisions as safe categories, not as raw policy internals that leak hidden resource existence.

## AI Advisory-only Boundary

AI can:

- remind reviewer that permission may be missing,
- summarize redacted source,
- mark unsafe official write attempt,
- organize review context,
- suggest escalation target category,
- explain why a suggestion may need human review.

AI cannot:

- authorize a user,
- open entitlement,
- elevate itself,
- accept suggestion,
- reject suggestion,
- edit suggestion,
- write official record,
- bypass source visibility,
- bypass permission,
- bypass entitlement,
- perform cross-organization retrieval,
- write uncertain content into official record.

AI is not a role, user, permission subject, tenant admin, supervisor, billing approver, or security reviewer.

## Explicit Non-goals

Task254 does not:

- add permission,
- add role,
- add entitlement,
- add permission seed,
- add AI review runtime,
- add AI suggestion table,
- add official write workflow,
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
- add tests,
- add smoke tests,
- modify `package.json`,
- modify inventory docs,
- touch Migration020,
- touch shared Zeabur runtime,
- connect to DB,
- run DDL,
- implement AI agent runtime,
- implement RAG runtime,
- implement embedding,
- implement vector DB,
- implement retrieval service,
- implement provider sending,
- implement notification runtime,
- implement survey runtime,
- implement AI auto-decision,
- implement official record write by AI.

## Future Runtime Readiness Checklist

Before future implementation, a new task should verify:

- every AI review request has organization scope,
- every AI review request has actor identity,
- permission and entitlement are checked separately,
- source citation visibility is checked separately from suggestion visibility,
- source detail visibility is stricter than citation visibility,
- official write permission is checked separately from suggestion accept,
- customer-visible surfaces cannot expose internal AI review data,
- safe-deny does not leak hidden resource existence,
- audit events are redacted,
- AI cannot act as a permission subject,
- usage and cost controls are compatible with entitlement,
- all future permission names are approved before seed / migration work.

## Future Task Candidates

Future tasks may include:

- AI review RBAC naming decision packet,
- AI review role-to-permission proposal,
- AI source visibility permission matrix,
- AI official write permission boundary test plan,
- AI review safe-deny copy catalog,
- AI audit export policy,
- AI usage dashboard permission design,
- AI review entitlement mapping,
- AI review Admin UX permission-state requirements,
- AI review runtime readiness gate.

These are future candidates only. Task254 does not execute them.
