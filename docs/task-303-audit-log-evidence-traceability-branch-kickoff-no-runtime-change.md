# Task 303 - Audit Log / Evidence Traceability Branch Kickoff / No Runtime Change

## Scope And Non-goals

This document opens the Audit Log / Evidence Traceability branch.

Task303 defines a docs-only scope map for future audit and evidence boundaries across core service workflows, data access, AI suggestions, customer channel operations, notifications, fee consent, completion, report/export/download, permission changes, and SaaS-ready security.

Task303 is a branch kickoff and does not approve implementation.

This task is not:

- audit log runtime,
- evidence runtime,
- permission runtime,
- role runtime,
- entitlement runtime,
- usage runtime,
- seat billing runtime,
- report/export/download runtime,
- customer channel identity runtime,
- reverse binding runtime,
- verification runtime,
- consent runtime,
- notification runtime,
- provider sending runtime,
- delivery tracking runtime,
- retry runtime,
- LINE / SMS / Email / APP sending,
- customer self-service lookup runtime,
- appointment runtime change,
- Case runtime change,
- Field Service Report runtime change,
- customer fee consent runtime,
- quote runtime,
- billing runtime,
- settlement runtime,
- AI / RAG runtime,
- API contract,
- Admin UI,
- backend service change,
- DB schema / migration proposal,
- smoke / test implementation.

Task303 does not add tables, migrations, schema, indexes, backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, smoke scripts, fixtures, package changes, audit runtime, evidence runtime, permission runtime, report/export/download runtime, provider sending, AI runtime, or inventory documentation changes.

## Why This Branch Follows Customer Channel Identity / Notification Closure

Task297-Task302 established channel identity, reverse binding, verification, consent, preference, provider payload, delivery audit, and readiness boundaries.

Those boundaries repeatedly depend on auditability and evidence traceability, but they intentionally did not implement audit runtime.

The next safe docs-only branch is therefore Audit Log / Evidence Traceability: a cross-cutting planning layer that defines what should be traceable in future runtime without turning audit logs into a sensitive data dumping ground.

## Branch Purpose

Audit Log / Evidence Traceability branch should define:

- which future actions need audit events,
- what evidence should be traceable,
- what must remain internal-only,
- what can be customer-visible,
- how masking and redaction should apply,
- how audit differs from official business records,
- how audit differs from usage tracking,
- how AI suggestions remain separate from official records,
- how future implementation can support ISO 27001-aligned evidence readiness.

The branch should remain docs-only until a later task explicitly approves audit runtime, evidence runtime, schema, API, Admin UI, or tests.

## Concept Map

### Audit Event

Audit event is a future internal trace of a meaningful action, attempt, denial, state change, or administrative operation.

Audit event is not automatically customer-visible and is not a replacement for the official business record.

### Evidence Record

Evidence record is future supporting proof for a decision or state, such as customer fee consent evidence, quote approval evidence, delivery evidence, report completion evidence, or human review evidence.

Evidence record is not approval by itself.

### Actor

Actor is the future initiator or responsible party for an action, such as user, system, provider callback, customer channel, customer self-service session, worker, or AI-assisted process.

Actor identity must be scoped and masked where needed.

### Organization Scope

Organization scope is mandatory for audit and evidence.

Audit and evidence must not cross organization or tenant boundaries.

### Customer-visible Action

Customer-visible action is an action whose result may be shown to a customer, such as appointment notice, quote notice, customer fee consent request, completion notice, survey invitation, or customer self-service lookup result.

Customer-visible action must not expose internal audit details.

### Internal-only Action

Internal-only action is an action intended only for authorized internal roles, such as permission change, supervisor review, settlement approval, audit review, AI risk flag, or provider diagnostic classification.

Internal-only action must not leak to customer-facing channels.

### Data Access Event

Data access event is a future audit category for viewing, querying, exporting, downloading, or using data for AI/RAG retrieval.

Data access events must follow Data Access Control and masking policy.

### Report / Export / Download Event

Report / export / download event is a future audit category for generating, viewing, exporting, downloading, scheduling, or delivering reports.

Report events must not include complete sensitive payloads.

### AI Suggestion Event

AI suggestion event is a future trace for AI-generated drafts, summaries, classifications, risk flags, or recommendations.

AI suggestion event is not official record write approval.

### Human Accept / Reject / Edit Event

Human accept / reject / edit event records the future human decision on AI output or suggested changes.

This supports accountability and AI feedback learning.

### Notification / Provider Delivery Event

Notification / provider delivery event records future safe categories for notification generation, suppression, provider attempt, delivery status, provider failure, or retry decision.

It must not store raw provider payload.

### Customer Channel Binding Event

Customer channel binding event records future safe categories for binding invitation, verification attempt, success, failure, expiration, reuse, revocation, or conflict.

It must use safe deny and non-enumeration externally.

### Customer Fee Consent Evidence

Customer fee consent evidence is future proof that the customer agreed to a fee or approval request.

Notification delivery is not fee consent evidence by itself.

### Completion / Field Service Report Event

Completion / Field Service Report event records future traceability around report creation, update, completion, repeat completion rejection, finalAppointmentId resolution, and case completion.

It must preserve one Case = one formal Field Service Report.

## Core Boundaries

- Audit log is not usage tracking.
- Audit log is not customer-visible history.
- Audit log is not official business record.
- Evidence record is not approval.
- AI suggestion audit is not AI permission to write official data.
- Audit readiness is not runtime approval.
- Audit event is not a reason to store raw payloads.
- Audit event is not a shortcut around Data Access Control.
- Audit event is not a substitute for permission checks.
- Audit event is not a substitute for human approval where approval is required.
- Audit must not record complete token, secret, complete phone, complete address, raw LINE id, raw provider payload, signature raw data, unmasked photos, or AI raw sensitive payload.

## Future-only Audit Scope Map

This matrix is future-only guidance. It does not approve audit runtime, evidence runtime, schema, API, Admin UI, tests, provider sending, AI runtime, report/export runtime, or DB changes.

| Scope row | Event category | Actor type | Organization scope required? | Customer-visible? | Internal-only? | Contains sensitive data risk? | Requires masking/redaction? | Can include raw payload? | May trigger usage tracking separately? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Case create / update | Case lifecycle | User / system | Yes | Maybe summary only | Maybe | Yes | Yes | No | No | No |
| Appointment create / status change | Appointment lifecycle | User / system | Yes | Maybe summary only | Maybe | Yes | Yes | No | No | No |
| Field Service Report completion | Completion lifecycle | User / system | Yes | Maybe summary only | Maybe | Yes | Yes | No | No | No |
| Repeat completion rejected | Completion guard | User / system | Yes | No | Yes | Yes | Yes | No | No | No |
| finalAppointmentId inferred / overridden future candidate | Completion trace | System / admin future | Yes | No | Yes | Yes | Yes | No | No | No |
| Customer fee consent recorded | Fee consent evidence | Customer / user / system | Yes | Maybe | Maybe | Yes | Yes | No | Maybe | No |
| Quote approval / rejection future candidate | Quote evidence | Customer / user / system | Yes | Maybe | Maybe | Yes | Yes | No | Maybe | No |
| Settlement approval future candidate | Settlement evidence | Finance / supervisor | Yes | No | Yes | Yes | Yes | No | Maybe | No |
| Customer channel binding / reverse binding | Channel identity | Customer / system | Yes | Maybe generic only | Maybe | Yes | Yes | No | Maybe | No |
| Verification failed / expired / reused token | Verification guard | Customer / system | Yes | Generic only | Yes | Yes | Yes | No | Maybe | No |
| Notification sent / failed future candidate | Notification delivery | System / provider | Yes | Maybe generic only | Maybe | Yes | Yes | No | Yes | No |
| Report / export / download requested | Data access | User / system | Yes | No | Yes | Yes | Yes | No | Yes | No |
| Permission / role / entitlement changed future candidate | Access control | Admin / system | Yes | No | Yes | Yes | Yes | No | Maybe | No |
| AI suggestion generated | AI suggestion | User / system | Yes | No | Yes | Yes | Yes | No | Yes | No |
| AI suggestion accepted / rejected / edited | AI human review | User | Yes | No | Yes | Yes | Yes | No | Maybe | No |
| Customer self-service lookup attempt | Customer access | Customer / system | Yes | Generic only | Maybe | Yes | Yes | No | Yes | No |

## Evidence Traceability Principles

### Customer Fee Consent

Customer fee consent must be future traceable by source, time, amount, channel, actor, policy version, and supporting evidence.

Notification delivery is not fee consent.

AI cannot create customer consent.

### AI Suggestion

AI suggestion should be future traceable by source context, confidence, retrieved sources, model/provider category, human accept / reject / edit decision, and final official record relationship if any.

AI suggestion is not official record by itself.

### Notification Delivery

Notification delivery should be future traceable by provider category, safe delivery status category, notification category, organization scope, correlation id, and timestamp.

Raw provider payload must not be stored.

### Report / Export / Download

Report / export / download should be future traceable by actor, scope, purpose, masking policy, export/download category, expiration / download control, and result category.

Export audit must not store the exported file contents.

### Customer Channel Binding

Customer channel binding should be future traceable by verification result category, token lifecycle category, consent scope category if applicable, and safe deny category.

It must not reveal hidden Case, customer, channel, token, or provider existence externally.

## Data Protection Rules

- Audit log must not become a sensitive data dumping ground.
- Audit log must not expose internal-only data to customer-visible responses.
- Audit log must not be directly full-text retrievable by AI/RAG.
- Audit log query must require Data Access Control, permission, masking, and audit of the audit access itself.
- Audit log must not store complete token, secret, complete phone, complete address, raw LINE id, raw provider payload, signature raw data, unmasked photos, or AI raw sensitive payload.
- Audit log should store safe categories, masked summaries, scoped identifiers, timestamps, result categories, and actor summaries.
- Evidence attachments should follow file/object storage and metadata policy, not large binary content in audit tables.
- Audit output for support or QA must be redacted.

## Interaction With Previous Branches

### Billing / Settlement

Billing and settlement approvals, exceptions, evidence, customer fee consent, quote decisions, and calculation review may require future audit and evidence traceability.

AI can assist review but cannot approve official settlement.

### Operations / Quality

Complaints, callbacks, risk flags, low survey scores, corrective actions, and supervisor reviews may require audit and evidence.

Customer-visible updates must stay separate from internal quality review.

### Data Access Control

Audit access itself must follow Data Access Control.

Report/export/download/AI retrieval audit must not bypass permission or masking.

### SaaS Plan / Entitlement / Usage

Entitlement change, usage metering, seat changes, AI Add-on usage, export usage, and provider usage may require audit.

Audit is not usage tracking, and usage tracking is not billing runtime by itself.

### Engineer Mobile / Field UX

Engineer arrival, photo upload metadata, signature capture metadata, visit outcome, parts/serial entry, and completion submission may require future audit and evidence.

The engineer workflow must remain simple and not turn into an audit form.

### Customer Channel Identity / Notification

Binding, verification, consent, preference, provider delivery, retry, safe deny, and provider callback categories may require future audit readiness.

Raw provider payload and credentials must remain out of normal logs and audit records.

### AI / RAG

AI suggestions, retrieval, source usage, human review, and official write candidates may require future audit.

AI/RAG must not retrieve complete audit logs as raw context.

## SaaS-ready / Security Considerations

- Organization isolation is mandatory.
- Tenant isolation is mandatory.
- Role / permission separation is mandatory.
- Data Access Control remains authoritative.
- Audit retention requires future policy.
- Field-level masking readiness is required.
- ISO 27001-aligned evidence readiness should guide future implementation.
- Usage tracking remains separate from audit.
- AI Add-on usage needs audit readiness without storing raw sensitive prompts.
- Enterprise SSO future design should preserve audit actor traceability.
- Supplier/provider activities should support future supplier risk and incident response evidence.
- Customer-visible data and internal-only audit data must remain separated.

## Explicit Runtime Forbidden Confirmation

Task303 does not approve:

- audit log runtime,
- evidence runtime,
- permission runtime,
- role runtime,
- entitlement runtime,
- usage runtime,
- seat billing runtime,
- report/export/download runtime,
- customer channel identity runtime,
- reverse binding runtime,
- verification runtime,
- consent runtime,
- notification runtime,
- provider sending runtime,
- delivery tracking runtime,
- retry runtime,
- LINE sending,
- SMS sending,
- Email sending,
- App sending,
- customer self-service lookup runtime,
- appointment runtime,
- Case runtime,
- completion runtime,
- Field Service Report runtime,
- customer fee consent runtime,
- quote runtime,
- billing runtime,
- settlement runtime,
- AI decision runtime,
- AI / RAG runtime,
- API change,
- Admin UI change,
- DB schema change,
- migration,
- index,
- DDL,
- `psql`,
- `db:migrate`,
- Migration 020 dry-run,
- Migration 020 apply,
- smoke / fixture change,
- package change,
- inventory docs expansion.

## Future Questions

These questions should be answered before audit / evidence runtime is implemented:

- Which event categories require mandatory audit?
- Which events are optional operational logs rather than audit?
- Which events need evidence attachments?
- Which evidence attachments require object/file storage?
- Which audit fields are safe for support staff?
- Which audit views require supervisor/admin permissions?
- What is the retention period per event category?
- How should audit access itself be audited?
- How should audit records reference usage records without duplicating sensitive payload?
- How should AI suggestions cite retrieved sources without exposing raw sensitive context?
- How should future Enterprise SSO actor identity map into audit records?

## Conclusion

Task303 is only a docs-only branch kickoff scope map.

It does not approve audit log, evidence, permission, report/export, notification, customer channel identity, AI/RAG, API, Admin, DB, or migration runtime implementation.

Future Audit Log / Evidence Traceability work may use this document as the branch boundary, but each runtime, schema, API, Admin, test, or provider integration step requires explicit future approval.
