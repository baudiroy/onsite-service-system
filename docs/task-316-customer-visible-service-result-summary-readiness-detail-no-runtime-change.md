# Task 316 - Customer-visible Service Result Summary Readiness Detail / No Runtime Change

## Scope And Non-goals

This document follows Task311 through Task315 and creates a docs-only implementation readiness detail packet for the next MVP candidate: customer-visible service result summary.

Task316 does not approve implementation. It documents the data boundary, Field Service Report relationship, internal-only masking, Data Access, channel identity, API/schema/test/security gates, and future approval requirements that must be reviewed before any customer-visible summary runtime work is considered.

This task is not:

- backend runtime,
- Admin runtime,
- API contract change,
- migration,
- schema change,
- index change,
- view change,
- DB / DDL execution,
- customer-visible summary runtime,
- customer self-service lookup runtime,
- customer channel identity runtime,
- verification runtime,
- notification runtime,
- Case runtime change,
- Appointment runtime change,
- Field Service Report runtime change,
- finalAppointmentId runtime change,
- AI / RAG runtime,
- provider sending,
- survey runtime,
- complaint runtime,
- billing / settlement runtime,
- test / smoke implementation,
- fixture change,
- package change.

Task316 does not modify backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, migrations, schema, indexes, views, smoke scripts, fixtures, package configuration, provider integrations, AI runtime, inventory documentation, or shared runtime data.

## Why This Follows Task315

Task315 documented the one-open-appointment invariant. A customer-visible service result summary depends on that foundation because customers need a simple and trustworthy explanation of the Case outcome without seeing internal appointment, billing, audit, or AI details.

This readiness packet follows Task315 because a safe customer-visible summary must:

- preserve one Case = one formal Field Service Report,
- not expose the full internal Field Service Report,
- represent appointment / visit outcomes without creating one report per visit,
- use the backend-resolved finalAppointmentId only as context,
- respect customer channel verification and safe-deny rules,
- follow Data Access Control and field-level masking,
- keep AI wording drafts separate from official records.

Task316 keeps this as a future-only readiness packet and does not change current runtime.

## Core Invariants To Protect

Future implementation must preserve these invariants:

1. One Case = one formal Field Service Report.
2. Customer-visible summary is not the full Field Service Report internal record.
3. Customer-visible summary must not expose internal note, supervisor note, billing / settlement internal data, audit log, AI raw payload, or engineer internal comment.
4. Appointment / visit abnormal outcomes remain appointment-layer data.
5. `finalAppointmentId` remains backend/system-owned and may provide final completed appointment context.
6. Customer channel identity can only access customer-visible data after verification and safe-deny rules.
7. Customer-visible summary must not reveal hidden Case existence to unverified requesters.
8. AI may draft wording but cannot decide official service result or expose unsupported facts.
9. Customer-visible wording must not contradict the formal Field Service Report.
10. Customer-visible summary must preserve organization isolation and channel scope.

## Current Readiness Questions / Docs-only

Before any future customer-visible service result summary runtime task is approved, PM and engineering should answer the following questions.

### Customer-visible Fields

Questions:

- Which Case status values can be shown to customers?
- Which appointment scheduled time window fields can be shown?
- Which visit result values can be safely summarized?
- Which Field Service Report completion summary fields can become customer-visible?
- Which attachment metadata is safe to show?
- Should customer fee consent visible status be shown?
- Should unavailable / pending / quote / waiting-parts / second-visit-needed states have standard wording?
- How should the summary avoid exposing internal reason codes or staff notes?

### Internal-only Fields

Fields that should remain internal-only unless a future explicit policy says otherwise:

- internal note,
- supervisor note,
- audit log,
- billing internal data,
- settlement internal data,
- engineer internal comment,
- internal risk flags,
- AI raw payload,
- AI hidden chain / raw context,
- provider payload,
- full internal Field Service Report details,
- unresolved evidence or review comments,
- internal settlement / reconciliation calculations.

### Scenario-specific Customer Summary Questions

Future implementation should define safe customer-facing wording for:

- completed,
- unable to repair,
- quote needed,
- waiting for parts,
- customer not available,
- cancelled,
- second visit needed,
- reschedule needed,
- pending customer information,
- case still being reviewed.

Scenario wording must be clear without exposing internal staff notes, billing details, audit data, AI raw payload, or unapproved assumptions.

### API Contracts Requiring Explicit Approval

Future API contract review should cover:

- customer-visible Case summary endpoint,
- customer-visible appointment summary endpoint,
- customer-visible completion summary endpoint,
- customer self-service lookup endpoint,
- LINE / App / Web portal summary retrieval,
- safe-deny and non-enumeration behavior,
- response field allow-list,
- error response shape,
- audit and usage behavior.

Task316 does not approve endpoint path, payload, response, status code, or error behavior changes.

### Data Access / Masking / Safe-deny Checks

Future implementation must confirm:

- request is scoped to organization,
- customer identity or channel identity is verified,
- access is scoped to the correct customer / Case,
- raw LINE user id is never treated as global identity,
- customer-visible field allow-list is applied,
- internal-only deny-list is enforced,
- sensitive fields are masked or excluded,
- hidden Case existence is not revealed to unverified users,
- customer-visible summaries do not bypass report/export/AI Data Access policy,
- all important access and denial outcomes can be audited.

### Schema Or Derived-view Questions

Future implementation should answer:

- Is a derived customer-visible summary view needed, or should it be generated from allow-listed fields at runtime?
- Should customer-visible summary text be stored, generated, or both?
- If stored, how is it versioned and tied to the Field Service Report?
- How are AI-drafted summaries separated from approved official customer-visible summaries?
- Is a translation / wording template system needed?
- How are attachments represented without exposing raw files or internal metadata?

Any schema, view, migration, DB, or DDL work requires separate explicit approval.

### Future Smoke / Regression Tests

Future runtime work should include targeted tests or smoke coverage for:

- verified customer can see allowed Case public status,
- unverified requester receives safe deny without Case enumeration,
- customer-visible summary excludes internal note,
- customer-visible summary excludes billing / settlement internal data,
- customer-visible summary excludes audit log,
- customer-visible summary excludes AI raw payload,
- cross-organization access is rejected,
- final appointment context uses backend-resolved finalAppointmentId,
- quote-needed and waiting-parts are not shown as completed,
- AI draft is not published without human or deterministic validation.

Task316 does not add or modify tests.

## Future-only Visibility Matrix

`Runtime approved now` is `No` for every row. `AI may decide` is `No` for every row.

| Data item | Customer-visible? | Internal-only? | Source layer | Requires Data Access Control? | Requires field masking? | Requires safe deny? | Requires audit readiness? | Requires API change? | Requires schema/view? | AI may draft wording? | AI may decide? | Runtime approved now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Case public status | Yes, with allow-list | No | Case | Yes | Maybe | Yes | Future-only yes | Future-only yes | Future-only maybe | Maybe | No | No |
| Appointment scheduled time window | Yes, if verified | No | Appointment | Yes | Maybe | Yes | Future-only yes | Future-only yes | Future-only maybe | Maybe | No | No |
| Appointment visit result summary | Yes, simplified | No | Appointment | Yes | Yes | Yes | Future-only yes | Future-only yes | Future-only maybe | Maybe | No | No |
| Field Service Report customer-visible completion summary | Yes, allow-listed | No | Field Service Report | Yes | Yes | Yes | Future-only yes | Future-only yes | Future-only maybe | Maybe | No | No |
| Work performed public summary | Yes, after validation | No | Field Service Report | Yes | Yes | Yes | Future-only yes | Future-only yes | Future-only maybe | Yes | No | No |
| Unable-to-repair public explanation | Yes, simplified | No | Appointment / Field Service Report | Yes | Yes | Yes | Future-only yes | Future-only yes | Future-only maybe | Yes | No | No |
| Quote-needed public explanation | Yes, simplified | No | Appointment / future quote | Yes | Yes | Yes | Future-only yes | Future-only yes | Future-only maybe | Yes | No | No |
| Waiting-for-parts public explanation | Yes, simplified | No | Appointment / future parts | Yes | Yes | Yes | Future-only yes | Future-only yes | Future-only maybe | Yes | No | No |
| Customer-not-available public explanation | Yes, simplified | No | Appointment | Yes | Yes | Yes | Future-only yes | Future-only yes | Future-only maybe | Yes | No | No |
| Second-visit-needed public explanation | Yes, simplified | No | Appointment | Yes | Yes | Yes | Future-only yes | Future-only yes | Future-only maybe | Yes | No | No |
| Customer fee consent visible status | Future-only maybe | No | Future consent | Yes | Yes | Yes | Future-only yes | Future-only yes | Future-only maybe | Maybe | No | No |
| Customer-visible attachment metadata | Future-only maybe | No | Attachment | Yes | Yes | Yes | Future-only yes | Future-only yes | Future-only maybe | No | No | No |
| Internal technician note | No | Yes | Appointment / Field Service Report | Yes | N/A | Yes | Future-only yes | Future-only no / maybe | Future-only no | No | No | No |
| Billing / settlement internal data | No | Yes | Billing / Settlement | Yes | N/A | Yes | Future-only yes | Future-only no / maybe | Future-only no | No | No | No |
| AI-generated draft wording | No until approved | Yes as draft | AI suggestion | Yes | Yes | Yes | Future-only yes | Future-only maybe | Future-only maybe | Yes | No | No |

## Future-only Implementation Gate Checklist

Any future customer-visible service result summary runtime task must include explicit approval for:

1. PM approval.
2. Allowed file / layer list.
3. Customer-visible field allow-list approval.
4. Internal-only deny-list approval.
5. API contract approval.
6. Data Access / safe-deny approval.
7. Customer channel identity review.
8. Migration / schema / view approval, if needed.
9. DB / DDL approval, if needed.
10. Test / smoke approval.
11. Audit readiness review.
12. Customer-visible / internal-only wording review.
13. No provider sending confirmation unless explicitly approved.
14. No AI auto-decision confirmation.
15. No inventory docs expansion confirmation.

General statements such as "continue", "go ahead", "do next task", or "make progress" are not enough to approve runtime, DB, migration, provider sending, AI, customer self-service, or test changes.

## Risk Matrix / Future-only

`Runtime approved now` is `No` for every row.

| Risk | Affected invariant | Possible future mitigation | Requires API change? | Requires schema/view? | Requires Data Access / masking? | Requires test/smoke? | Requires audit? | Runtime approved now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal note exposed to customer. | Customer-visible summary is not full internal record. | Enforce internal-only deny-list and allow-listed response mapping. | Future-only yes | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Billing / settlement data exposed to customer. | Billing internal data must remain internal. | Exclude financial internal fields from customer-visible endpoints. | Future-only yes | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Audit log exposed to customer. | Audit log is internal-only. | Never include audit data in customer-visible summary. | Future-only no / maybe | Future-only no | Future-only yes | Future-only yes | Future-only yes | No |
| AI raw payload exposed to customer. | AI raw payload is internal-only and sensitive. | Keep AI draft/output separate and publish only approved summary text. | Future-only yes | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Customer-visible summary leaks hidden Case existence. | Safe-deny / non-enumeration. | Use identical safe denial for unauthorized or nonexistent lookup. | Future-only yes | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Cross-organization summary access. | Organization isolation. | Scope lookup by organization and verified customer/channel identity. | Future-only yes | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Wrong appointment used as final service context. | finalAppointmentId backend/system-owned. | Use completed report's resolved finalAppointmentId; do not infer in customer summary layer. | Future-only maybe | Future-only no / maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Quote-needed or waiting-parts incorrectly shown as completed. | Appointment outcomes remain appointment-layer data; completion must be accurate. | Define scenario wording and state mapping before runtime. | Future-only yes | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Customer-visible wording contradicts official Field Service Report. | Summary must align with formal report. | Generate summary from approved report fields or reviewed wording templates. | Future-only yes | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| AI draft is published without human or deterministic validation. | AI may draft but cannot decide official result. | Require human acceptance or deterministic validation before customer-visible use. | Future-only yes | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |

## Runtime Forbidden Confirmation

Task316 explicitly does not approve:

- backend runtime,
- Admin runtime,
- API changes,
- migration changes,
- schema changes,
- index changes,
- view changes,
- DB connection,
- DDL,
- `psql`,
- `db:migrate`,
- Migration 020 dry-run,
- Migration 020 apply,
- tests,
- smoke scripts,
- fixtures,
- package changes,
- customer-visible summary runtime,
- customer self-service lookup runtime,
- customer channel identity runtime,
- verification runtime,
- notification runtime,
- Case runtime changes,
- Appointment runtime changes,
- Field Service Report runtime changes,
- finalAppointmentId runtime changes,
- AI / RAG runtime,
- provider sending,
- survey runtime,
- complaint runtime,
- billing runtime,
- settlement runtime,
- inventory documentation changes.

## Conclusion

Task316 is a docs-only customer-visible service result summary readiness detail packet.

It does not approve customer-visible summary runtime implementation.

Future implementation may use this packet to prepare a tightly scoped task, but the future task must still obtain explicit approval for allowed files, customer-visible allow-list, internal-only deny-list, API contracts, schema or view changes, DB / DDL, Data Access, safe-deny, customer channel identity, audit, tests, rollback, safety, and sensitive data boundaries before any runtime work begins.
