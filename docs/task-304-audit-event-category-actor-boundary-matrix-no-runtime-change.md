# Task 304 - Audit Event Category / Actor Boundary Matrix / No Runtime Change

## Scope And Non-goals

This document continues the Audit Log / Evidence Traceability branch after Task303.

Task304 defines future-only boundaries for audit event categories and actor types.

The goal is to clarify who or what can appear as an actor in future audit records, which actor types may initiate business actions, which actor types may be official approvers, what event categories should exist, and how sensitive data, usage tracking, AI suggestions, provider events, and official records must remain separated.

Task304 is documentation-only.

This task is not:

- audit log runtime,
- evidence runtime,
- actor runtime,
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
- official record runtime change,
- AI / RAG runtime,
- API contract,
- Admin UI,
- backend service change,
- DB schema / migration proposal,
- smoke / test implementation.

Task304 does not add tables, migrations, schema, indexes, backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, smoke scripts, fixtures, package changes, audit runtime, evidence runtime, permission runtime, usage runtime, provider runtime, AI runtime, or inventory documentation changes.

## Why Actor / Event Boundaries Are Needed After Task303

Task303 opened the Audit Log / Evidence Traceability branch and defined broad audit/evidence concepts.

The next risk is treating every actor as equally authorized or treating every audit event as if it could directly modify official records.

Future audit logs must know whether the event came from an internal user, field engineer, customer channel identity, system process, AI suggestion source, or notification provider. These actor types have different authority, visibility, and safety requirements.

Task304 defines actor and event category boundaries before any audit runtime, schema, API, permission, report/export, provider, or AI implementation is approved.

## Definitions

### Audit Event Category

Audit event category is a future normalized category describing what kind of action, attempt, denial, review, delivery, access, or system event occurred.

### Actor

Actor is the future source or initiator attributed to an audit event.

Actor identity alone does not grant permission.

### Internal User Actor

Internal user actor is a platform user acting through an authenticated internal session and organization membership.

Internal user actor still requires role, permission, organization scope, and policy checks.

### Field Engineer Actor

Field engineer actor is a user acting in an engineer / field workflow, usually limited to assigned or authorized appointments and cases.

Field engineer actor is not a full admin actor by default.

### Customer Channel Actor

Customer channel actor is a customer-facing channel identity or customer self-service context.

Customer channel actor is not an internal user and not a SaaS seat.

### Service / System Actor

Service / system actor is a backend process, scheduled process, worker, or deterministic business service.

Service / system actor must remain organization-scoped and policy-bound.

### AI Suggestion Actor Boundary

AI suggestion source may be recorded as an assistance source, but AI is not an official actor for final business approval.

AI suggestion must be separated from human accept / reject / edit decision.

### Provider Actor Boundary

Provider actor boundary covers future external delivery providers that return status, callback, or diagnostic events.

Provider result is not official business approval and provider cannot directly modify official records.

### Organization Scope

Organization scope is the tenant boundary that every audit actor and event must respect.

### Event Target

Event target is the resource or object related to an audit event, such as Case, Appointment, Field Service Report, customer channel identity, quote, fee consent, report export, or AI suggestion.

### Event Metadata

Event metadata is a future minimized, masked summary used to describe an event without storing raw payload or sensitive values.

### Sensitive Payload

Sensitive payload is any raw or complete sensitive value that should not be stored in audit metadata, normal logs, frontend responses, or customer-visible outputs.

## Actor Boundary Principles

- Actor identity is not permission.
- Customer channel actor is not internal user.
- Customer channel actor is not a SaaS seat.
- Service / system actor cannot become a cross-organization universal actor.
- AI is not an official actor for final approval.
- AI suggestion must remain separate from human decision.
- Provider delivery result does not make provider a business actor.
- Actor type still requires organization scope.
- Actor type still requires permission, policy, entitlement, consent, or Data Access Control checks where applicable.
- Actor type does not allow raw payload storage.
- Actor type does not override masking and redaction.
- Actor type does not decide customer-visible data by itself.

## Future-only Actor Matrix

This matrix is future-only guidance. It does not approve actor runtime, permission runtime, audit runtime, schema, API, Admin UI, provider runtime, AI runtime, or DB changes.

| Actor row | Actor type | Can initiate business action? | Can be official approver? | Requires organization scope? | Requires permission / policy? | Customer-visible? | Internal-only? | Can write official record directly? | AI allowed? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Admin user | Internal user | Future-only yes | Future-only yes by permission | Yes | Yes | No | Yes | Future-only yes by permission | No official AI action | No |
| Dispatcher | Internal user | Future-only yes | Future-only limited | Yes | Yes | No | Yes | Future-only yes by permission | No official AI action | No |
| Field engineer | Field engineer user | Future-only limited | Future-only limited | Yes | Yes | Maybe for customer-facing confirmation | Maybe | Future-only limited by workflow | No official AI action | No |
| Supervisor | Internal user | Future-only yes | Future-only yes by permission | Yes | Yes | No | Yes | Future-only yes by permission | No official AI action | No |
| Finance user | Internal user | Future-only limited | Future-only yes for finance scope | Yes | Yes | No | Yes | Future-only yes by permission | No official AI action | No |
| Viewer / read-only user | Internal user | No | No | Yes | Yes | No | Yes | No | No official AI action | No |
| Customer channel identity | Customer channel actor | Future-only limited customer actions | No | Yes | Yes | Yes | No | Future-only limited by customer-visible flow | No official AI action | No |
| Service / system actor | Service / system | Future-only deterministic actions | No human approval by itself | Yes | Yes | No | Yes | Future-only by deterministic service | No official AI action | No |
| AI suggestion source | AI assistance source | No official action | No | Yes | Yes | No | Yes | No | Suggestion only; no official action | No |
| Notification provider | External provider | No business action | No | Yes | Yes | Maybe status only | Maybe | No | No official AI action | No |

## Future-only Audit Event Category Matrix

This matrix is future-only guidance. It does not approve audit runtime, evidence runtime, schema, API, Admin UI, provider sending, AI runtime, report/export runtime, or DB changes.

| Event category | Allowed actor types | Official record related? | Customer-visible? | Internal-only? | Contains sensitive data risk? | Raw payload allowed? | Requires masking/redaction? | May link usage tracking separately? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Case created | Internal user, service/system | Yes | Maybe summary only | Maybe | Yes | No | Yes | No | No |
| Case updated | Internal user, service/system | Yes | Maybe summary only | Maybe | Yes | No | Yes | No | No |
| Appointment created | Internal user, service/system | Yes | Maybe summary only | Maybe | Yes | No | Yes | No | No |
| Appointment status changed | Internal user, field engineer, service/system | Yes | Maybe summary only | Maybe | Yes | No | Yes | No | No |
| Field Service Report completion submitted | Internal user, field engineer, service/system | Yes | Maybe summary only | Maybe | Yes | No | Yes | No | No |
| Repeat completion rejected | Internal user, service/system | Yes | No | Yes | Yes | No | Yes | No | No |
| finalAppointmentId inferred | Service/system | Yes | No | Yes | Yes | No | Yes | No | No |
| finalAppointmentId admin override future candidate | Admin user, supervisor | Yes | No | Yes | Yes | No | Yes | No | No |
| Customer fee consent recorded | Customer channel actor, internal user, service/system | Yes | Maybe | Maybe | Yes | No | Yes | Maybe | No |
| Quote approved / rejected future candidate | Customer channel actor, internal user, service/system | Yes | Maybe | Maybe | Yes | No | Yes | Maybe | No |
| Settlement approval future candidate | Finance user, supervisor | Yes | No | Yes | Yes | No | Yes | Maybe | No |
| Customer channel binding changed | Customer channel actor, internal user, service/system | Yes | Maybe generic only | Maybe | Yes | No | Yes | Maybe | No |
| Reverse binding verification attempted | Customer channel actor, service/system | No official business state by itself | Generic only | Maybe | Yes | No | Yes | Maybe | No |
| Notification delivery event future candidate | Service/system, notification provider | No business approval by itself | Maybe generic only | Maybe | Yes | No | Yes | Yes | No |
| Report generated | Internal user, service/system | No by itself | No | Yes | Yes | No | Yes | Yes | No |
| Export requested | Internal user, service/system | No by itself | No | Yes | Yes | No | Yes | Yes | No |
| File downloaded | Internal user, service/system | No by itself | No | Yes | Yes | No | Yes | Yes | No |
| Permission / role / entitlement changed future candidate | Admin user, service/system | Yes for access config | No | Yes | Yes | No | Yes | Maybe | No |
| AI suggestion generated | AI suggestion source, service/system | No by itself | No | Yes | Yes | No | Yes | Yes | No |
| AI suggestion accepted / rejected / edited | Internal user, field engineer, supervisor, finance user | Maybe | No | Yes | Yes | No | Yes | Maybe | No |
| Customer self-service lookup attempted | Customer channel actor, service/system | No by itself | Generic only | Maybe | Yes | No | Yes | Yes | No |

## Sensitive Data Rules

Audit metadata must not contain:

- complete token,
- secret,
- complete phone,
- complete email,
- complete address,
- LINE access token,
- channel secret,
- raw LINE id,
- raw provider payload,
- verification code,
- signature raw data,
- unmasked photo,
- AI raw sensitive payload,
- binding token,
- provider credential,
- full customer private content,
- full internal note.

Audit may record:

- safe category,
- masked reference,
- organization-scoped resource id,
- actor type,
- result category,
- timestamp,
- policy version,
- permission category,
- feature category,
- safe error category.

Audit must not become a sensitive data dumping ground.

## Audit Vs Official Record Rules

- Audit event proves that an action, attempt, denial, or result category was recorded.
- Audit event is not the business state itself.
- Official record update requires the formal business flow.
- Official record cannot be inferred only from audit event existence.
- Evidence record supports a decision but does not approve it by itself.
- AI suggestion audit does not mean AI can update official records.
- Provider delivery audit does not mean consent, approval, survey response, fee consent, quote approval, settlement approval, or complaint closure.
- Customer self-service audit does not mean customer can see internal-only data.

## Interaction With Previous Branches

### Data Access Control

Data Access Control determines whether audit records, evidence records, report exports, AI/RAG context, and customer-visible history can be read.

Audit access itself must be permissioned and auditable.

### Customer Channel Identity

Customer channel actors are not internal users.

Binding, verification, consent, preference, and provider delivery events need audit boundaries but do not approve runtime.

### Engineer Mobile

Field engineer actor may submit visit outcomes, completion details, photos metadata, parts/serial entries, or customer-facing confirmation in future workflows.

Engineer audit must not overload the field workflow.

### Billing / Settlement

Finance users, supervisors, and future customer fee consent records may require evidence traceability.

Audit cannot auto-approve settlement.

### Operations / Quality

Supervisor review, complaint follow-up, callback workflow, corrective action, and risk flags may require audit.

Customer-visible status must remain separate from internal quality audit.

### AI / RAG

AI suggestion source may generate suggestions, summaries, or risk flags.

Human accept / reject / edit must remain separate from AI generation.

AI must not be official approver.

### SaaS Usage Tracking

Usage tracking may link to audit by safe correlation category, but audit and usage are different.

Usage tracking is not billing runtime by itself.

## Explicit Runtime Forbidden Confirmation

Task304 does not approve:

- audit log runtime,
- evidence runtime,
- actor runtime,
- permission runtime,
- role runtime,
- entitlement runtime,
- usage runtime,
- seat billing runtime,
- official record runtime change,
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

These questions should be answered before audit actor / event runtime is implemented:

- Which actor types require persistent internal user ids?
- How should customer channel actors be referenced without leaking provider identity?
- Which events require evidence attachment metadata?
- Which events may be customer-visible summaries?
- Which actor types can become official approvers by permission?
- How should service/system actor activity be scoped to organization?
- Which AI suggestion events should link to retrieved sources?
- Which event categories should be usage-metered separately?
- Which audit views require admin-only permission?
- How should future Enterprise SSO identities map to audit actors?

## Conclusion

Task304 is docs-only audit event / actor boundary guidance.

It does not approve audit, evidence, permission, usage, AI/provider, API, Admin, DB, or migration runtime implementation.

Future audit implementation may use this actor and event category matrix as planning input, but any runtime, schema, API, Admin UI, provider integration, report/export, AI/RAG, permission, usage, or test work requires explicit future approval.
