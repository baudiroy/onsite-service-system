# Task 277 - Data Access Scope Resolver and Visibility Policy Boundary / No Runtime Change

## Scope And Non-goals

This document continues the Data Access Control / Data Permission Model branch from Task274 through Task276.

The purpose is to define future-only boundaries between:

- data scope resolver,
- allowed Case scope,
- allowed Customer scope,
- allowed Document scope,
- customer-visible data policy,
- internal-only data policy,
- supervisor-only data policy,
- finance-only data policy,
- engineer-visible data policy,
- customer channel identity-visible policy,
- field-level masking,
- safe deny / non-enumeration.

Task277 is documentation-only.

This task is not:

- permission runtime,
- entitlement runtime,
- subscription runtime,
- usage tracking runtime,
- data scope resolver implementation,
- visibility policy implementation,
- field masking implementation,
- report runtime,
- export runtime,
- download runtime,
- scheduled report runtime,
- customer self-service lookup runtime,
- AI retrieval runtime,
- RAG runtime,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation.

Task277 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why Scope Resolver / Visibility Policy Boundaries Are Needed After Task276

Task276 defined a future Data Access Policy Builder conceptual flow.

That flow includes two related but different questions:

1. Is this record in the actor's allowed scope?
2. Which fields or data categories are visible once the record is in scope?

These questions must stay separate.

An actor may be allowed to know that a Case exists but not see internal notes. A customer channel identity may see a customer-visible appointment time but not audit logs. A finance user may see settlement evidence but not every customer communication. An AI/RAG retrieval flow may reference a RAG source only after organization, visibility, permission, and masking policies have all been applied.

Task277 defines the conceptual boundaries only. It does not approve runtime implementation.

## Definitions

### Data Scope Resolver

The future data scope resolver determines whether a record is inside the actor's allowed data boundary.

It answers:

- Is this Case, Customer, Appointment, Field Service Report, document, file, or source record in scope for this actor?

It does not answer:

- Which fields are visible?
- Whether export is allowed?
- Whether AI can retrieve the content?
- Whether a feature is entitled?
- Whether an action should be audited?

### Allowed Case Scope

Allowed Case scope determines which Case records the actor may access.

Examples:

- Admin may have organization-wide Case scope if permitted.
- Engineer may have assigned appointment / Case scope.
- Customer channel identity may have verified customer-visible Case scope.
- Vendor / brand role may have future brand/vendor-limited Case scope.

Allowed Case scope does not imply full visibility of all Case fields.

### Allowed Customer Scope

Allowed Customer scope determines which Customer records the actor may access.

It must remain separate from Case scope because a user may be authorized for a Case summary without being authorized for all customer profile fields or history.

### Allowed Document Scope

Allowed Document scope determines which files, attachments, photos, signatures, uploaded documents, generated reports, export files, or RAG source documents the actor may access.

Allowed Document scope must consider:

- organization scope,
- source record scope,
- document visibility,
- file sensitivity,
- expiry / download policy,
- customer-visible vs internal-only policy,
- audit requirement.

### Customer-visible Data Policy

Customer-visible data policy defines which data may be shown to customers through LINE, SMS, Email, Web portal, App, survey, quote confirmation, or customer-facing AI.

It must exclude internal-only operational, financial, audit, AI, supervisor, and provider diagnostics data.

### Internal-only Data Policy

Internal-only data policy defines data that may be visible only to authorized internal roles.

Examples:

- internal notes,
- supervisor review notes,
- audit logs,
- internal risk flags,
- billing / settlement internal data,
- AI raw payload,
- provider diagnostics.

Internal-only data cannot become customer-visible through report, export, scheduled report, AI summary, RAG answer, or customer self-service lookup.

### Supervisor-only Data Policy

Supervisor-only data policy defines data requiring supervisor or admin review authority.

Examples:

- complaint escalation review,
- quality review,
- corrective action candidate,
- engineer coaching note,
- high-risk exception review,
- AI risk explanation for supervisor review.

Supervisor-only data is internal-only but narrower than all internal users.

### Finance-only Data Policy

Finance-only data policy defines data requiring finance or settlement authority.

Examples:

- payable amount,
- settlement calculation internals,
- vendor/brand rule application,
- missing evidence for billing,
- invoice/payment future data,
- cost or margin sensitive data.

Finance-only access does not imply permission to see all customer communications, supervisor notes, or AI raw payload.

### Engineer-visible Data Policy

Engineer-visible data policy defines data needed for assigned onsite work.

Examples:

- assigned appointment,
- safe customer contact details,
- service address with minimum necessary visibility,
- Case summary,
- product/service context,
- needed photos/signature/checklist,
- previous visit summary where relevant.

Engineer-visible access must not expose unrelated Cases, finance internals, audit logs, supervisor notes, or AI raw payload.

### Customer Channel Identity-visible Policy

Customer channel identity-visible policy defines what a verified customer identity may see.

Customer identities may include:

- LINE identity,
- SMS / phone verification context,
- email verification context,
- Web portal identity,
- App identity.

Customer channel identity-visible policy is not internal user permission and not an internal SaaS seat.

### Field-level Masking

Field-level masking hides, redacts, truncates, or excludes sensitive values based on actor, role, permission, output type, and data classification.

Masked data still exists. Masking is an output policy, not a data-deletion signal.

### Safe Deny

Safe deny means refusing access without leaking whether a resource exists or which gate failed, especially in external/customer-facing contexts.

Safe deny is required for cross-organization access, customer lookup failures, token verification failures, and unauthorized record probing.

## Boundary Principles

- Organization scope is the top-level boundary for every data scope decision.
- Allowed scope does not equal field visibility.
- Field visibility does not equal operation permission.
- Customer-visible policy does not equal internal user permission.
- Internal-only policy cannot be bypassed by report / export / download / scheduled report / AI / RAG.
- Customer channel identity is not the same as an internal user seat.
- Field-level masking does not mean the data does not exist.
- Safe deny must not reveal whether a resource exists.
- Report/export/download may require stricter masking than normal UI.
- Scheduled reports must re-check both scope and visibility before generation and delivery.
- AI/RAG must use permission-aware retrieval and minimum necessary context after scope and visibility decisions.

## Future-only Scope / Visibility Matrix

The matrix below is conceptual only. It is not a schema, API response contract, or implementation checklist.

| Data item | Primary data category | Default visibility | Customer-visible? | Engineer-visible? | Supervisor-visible? | Finance-visible? | Report/export eligible? | AI/RAG eligible? | Requires masking? | Requires audit? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Case basic fields | Official Case data | Internal role + customer-visible subset | Yes, safe subset | Yes, assigned subset | Yes | Conditional | Future-only Yes with masking | Future-only Conditional | Yes | Conditional | No |
| Case internal note | Internal-only Case data | Internal-only | No | No by default | Yes | Conditional | Future-only Conditional, internal-only | Future-only Conditional, internal-only | Yes | Yes | No |
| Appointment schedule | Appointment / dispatch visit data | Internal role + customer-visible subset | Yes, safe scheduled time/status | Yes, assigned appointment | Yes | Conditional | Future-only Yes with masking | Future-only Conditional | Yes | Conditional | No |
| Appointment abnormal outcome | Appointment / visit outcome data | Internal role + customer-visible safe wording | Conditional, safe wording only | Yes, assigned appointment | Yes | Conditional | Future-only Conditional | Future-only Conditional | Yes | Conditional | No |
| Field Service Report customer-visible summary | Formal report customer-facing summary | Customer-visible after completion policy | Yes | Yes, assigned/related | Yes | Conditional | Future-only Yes with masking | Future-only Conditional | Yes | Conditional | No |
| Field Service Report internal note | Internal-only report data | Internal-only | No | No by default | Yes | Conditional | Future-only Conditional, internal-only | Future-only Conditional, internal-only | Yes | Yes | No |
| Customer contact fields | Customer data | Internal role + masked output | Conditional | Conditional, minimum necessary | Yes where permitted | Conditional | Future-only Conditional with masking | Future-only Conditional with masking | Yes | Conditional | No |
| Full phone / full address | Sensitive customer data | Restricted internal | No by default | Conditional, minimum necessary | Conditional | Conditional | Future-only Restricted | Future-only Restricted/minimized | Yes | Yes | No |
| LINE / channel identity binding metadata | Channel identity data | Restricted internal | No raw identifiers | No by default | Conditional | No by default | Future-only Restricted | Future-only Restricted/minimized | Yes | Yes | No |
| Customer signature / uploaded files metadata | File/document metadata | Restricted by document scope | Conditional, own safe references | Conditional, assigned appointment | Yes where permitted | Conditional | Future-only Conditional | Future-only Metadata only by default | Yes | Yes | No |
| Survey result | Customer feedback data | Internal review + customer-owned content policy | Conditional | No by default | Yes | No by default | Future-only Conditional | Future-only Conditional | Yes | Conditional | No |
| Complaint / callback future records | Operations / quality data | Internal-only by default | No by default | No by default | Yes | No by default | Future-only Restricted | Future-only Conditional, internal-only | Yes | Yes | No |
| Billing / settlement internal data | Finance data | Finance/supervisor restricted | No | No | Conditional | Yes | Future-only Restricted | Future-only Conditional, internal-only | Yes | Yes | No |
| Quote / customer fee consent record | Customer approval / quote data | Internal + customer-visible approved subset | Conditional, approved subset | Conditional | Yes | Yes | Future-only Conditional | Future-only Conditional | Yes | Yes | No |
| Audit log | Audit data | Admin / authorized audit role | No | No | Conditional | Conditional | Future-only Restricted | No by default | Yes | Yes | No |
| AI suggestion record | AI advisory data | Internal authorized role | No by default | Conditional, assigned/relevant subset | Yes where permitted | Conditional | Future-only Restricted | Future-only as source only after policy | Yes | Yes | No |
| RAG source document metadata | Knowledge / policy source metadata | Role / permission / visibility based | Conditional, customer-facing docs only | Conditional | Yes where permitted | Conditional | Future-only Conditional | Future-only Yes after visibility filter | Yes | Conditional | No |

## Safe Deny / Non-enumeration Rules

Future safe deny must avoid leaking true failure reason in external or customer-facing contexts.

Safe deny applies to:

- cross-organization access,
- permission denied,
- scope denied,
- resource missing,
- customer lookup verification failed,
- channel identity mismatch,
- expired token,
- used token,
- feature not entitled,
- subscription status blocked,
- usage exceeded,
- document visibility denied,
- AI/RAG source denied.

External/customer-facing responses must not reveal:

- whether a Case exists,
- whether a Customer exists,
- whether a phone number is correct,
- whether an email is correct,
- whether a LINE/channel identity is bound,
- whether a binding token was valid before failure,
- whether an internal document exists,
- whether an internal risk flag exists.

Internal log / audit may record safe classification, but must not include:

- full token,
- secret,
- full phone,
- full address,
- raw LINE id,
- raw provider payload,
- raw signature data,
- AI raw sensitive payload.

## Interaction With Future Access Contexts

| Context | Scope resolver role | Visibility policy role | Masking role | Runtime allowed now? |
| --- | --- | --- | --- | --- |
| Normal read | Determine record is in allowed scope. | Determine field categories visible to actor. | Redact sensitive values. | No |
| List / search | Restrict result set before display. | Limit columns and snippets. | Mask list fields and previews. | No |
| Dashboard / analytics | Restrict source records. | Limit included categories and dimensions. | Aggregate or redact sensitive breakdowns. | No |
| Report / export / download | Restrict dataset and artifacts. | Exclude internal-only/customer-ineligible fields. | Apply export-grade masking. | No |
| Scheduled report | Re-resolve scope at generation time. | Re-resolve visibility for owner and recipient. | Apply report/export masking. | No |
| Customer self-service lookup | Resolve verified customer-visible Case/Customer scope. | Show only customer-visible fields/actions. | Mask or omit sensitive/internal values. | No |
| AI retrieval | Restrict source records and documents. | Exclude unauthorized and internal-only sources. | Minimize and redact prompt/context. | No |
| RAG retrieval | Restrict source document index/query scope. | Apply source visibility metadata. | Redact snippets and citations where needed. | No |

## SaaS-ready / Security Considerations

Future scope and visibility design must remain compatible with:

- organization isolation,
- role / permission separation,
- report / export / download permission separation,
- entitlement / subscription / usage separation,
- customer-visible vs internal-only policy,
- field-level masking readiness,
- audit readiness,
- usage tracking readiness,
- AI Add-on readiness,
- Enterprise SSO future design,
- generic channel identity,
- reverse LINE binding,
- customer self-service,
- engineer mobile app.

Higher SaaS plan, AI Add-on, Enterprise SSO, or internal admin convenience must not weaken tenant isolation, permission checks, field masking, audit, customer-visible separation, or ISO 27001-aligned guardrails.

## Future Test Ideas

These are future test ideas only. Task277 does not add tests.

Future coverage should include:

- allowed Case scope does not expose internal notes,
- allowed Customer scope does not expose full phone/address without permission,
- document scope denies unrelated files,
- customer-visible lookup cannot read audit log,
- engineer-visible scope is limited to assigned appointment / Case,
- finance-visible data does not expose all customer communication,
- supervisor-only review data is not customer-visible,
- report/export cannot bypass internal-only policy,
- scheduled report applies visibility policy at generation time,
- AI retrieval excludes internal-only data for customer-facing tasks,
- RAG retrieval requires source visibility metadata,
- safe deny does not enumerate Case / Customer / channel identity existence.

## Non-goals

Task277 does not:

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

For Task277, verification is limited to documentation safety:

- `npm run check`,
- `npm run admin:check`,
- `git diff --check`,
- sensitive text scan for accidental secrets or real customer/provider data.

No smoke, DB, migration, API, Admin runtime, AI runtime, RAG runtime, report runtime, export runtime, scheduled report runtime, provider sending, or inventory verification is required.

## Conclusion

Task277 defines the future-only boundary between scope resolution, visibility policy, field-level masking, and safe deny.

The key rule is:

```text
Allowed scope says which records are in bounds.
Visibility policy says which data categories are visible.
Field masking says how sensitive values are shown.
Safe deny prevents resource enumeration.
None of these alone grants runtime permission.
```

Task277 is docs-only scope / visibility boundary guidance and does not approve data access, report/export/download, customer self-service, AI retrieval, or RAG runtime.
