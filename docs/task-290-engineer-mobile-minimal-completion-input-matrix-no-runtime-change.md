# Task 290 - Engineer Mobile Minimal Completion Input Matrix / No Runtime Change

## Scope And Non-goals

This document continues the Engineer Mobile / Field UX branch opened in Task289.

The purpose is to define a docs-only minimal completion input matrix for future engineer mobile web / mobile app workflows. It separates what engineers should provide in the field, what the system may infer, what AI may help draft, and what back office / supervisor / finance should not force engineers to fill during on-site work.

Task290 is documentation-only.

This task is not:

- Engineer Mobile App runtime,
- mobile web runtime,
- completion runtime change,
- Field Service Report runtime change,
- appointment runtime change,
- API change,
- Admin UI change,
- photo upload runtime,
- signature capture runtime,
- file storage runtime,
- AI summary runtime,
- AI suggestion runtime,
- permission runtime,
- entitlement runtime,
- usage metering runtime,
- seat management runtime,
- notification/provider sending runtime,
- DB schema / migration proposal,
- smoke / test implementation.

Task290 does not add tables, migrations, schema, indexes, APIs, Admin UI, mobile UI, runtime logic, audit runtime, permission runtime, entitlement runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why Minimal Completion Input Is Needed After Task289

Task289 opened the Engineer Mobile / Field UX branch and established that field workflows must be simple, assigned-work scoped, secure, and aligned with the Case / Appointment / Field Service Report model.

Task290 focuses on the completion moment.

The risk is that future product teams may overload engineers with back-office, finance, supervisor, AI, report, audit, or settlement fields. That would slow field work and reduce data quality.

Minimal completion input should capture necessary field facts while letting the system, AI drafts, and authorized back-office roles handle structure, review, finance, settlement, quality, and reporting later.

## Definitions

### Minimal Completion Input

Minimal completion input is the smallest set of field facts needed from the engineer to record visit result, work performed, evidence, and customer-facing confirmation.

It should be fast, mobile-friendly, and operationally necessary.

### Engineer-provided Field Facts

Engineer-provided field facts are observations or actions the engineer personally performed or verified on-site.

Examples:

- arrival,
- diagnosis,
- work performed,
- parts/material used note,
- abnormal outcome reason,
- customer signature,
- photo/evidence capture.

### System-inferred Completion Context

System-inferred completion context is information the backend/system can derive from existing Case, appointment, dispatch visit, timestamp, status, and completion rules.

The engineer should not manually re-enter this context when the system already knows it.

### AI-assisted Completion Summary

AI-assisted completion summary is a draft generated from engineer input and authorized context.

It may help structure text, classify fault type, or produce customer-visible summary drafts, but it cannot decide facts or write official records without review/confirmation.

### Abnormal Visit Outcome

Abnormal visit outcome is a visit-level result such as customer not home, pending parts, cancelled, unable to repair, quote needed, or second visit needed.

It belongs to the appointment / visit layer.

### Customer-visible Completion Summary

Customer-visible completion summary is a short explanation intended for the customer after appropriate review and visibility filtering.

It must not include internal-only data.

### Internal Technician Note

Internal technician note is an engineer note intended for internal review or follow-up.

It may contain operational context but should still avoid unnecessary sensitive data.

### Evidence Attachment

Evidence attachment is a future photo, document, video, or file that supports the field work.

It should use object/file storage with metadata rather than being stored as raw blob data in core tables.

### Customer Signature

Customer signature is customer confirmation or acknowledgement captured where required.

It is sensitive data and must be protected.

## Boundary Principles

- Engineer completion flow must be simple.
- Engineers provide necessary field facts, not back-office restructuring.
- Engineers do not perform settlement calculation, finance approval, supervisor quality review, audit classification, AI structure cleanup, report/export categorization, or permission scoping.
- AI may organize, summarize, classify, and point out missing data.
- AI must not submit field facts for the engineer.
- AI must not fabricate evidence, arrival, customer confirmation, or signature.
- System may infer final appointment context from appointment / dispatch visit status and completion rules.
- Engineers must not manually choose `finalAppointmentId`.
- Completion input must not break one Case = one formal Field Service Report.
- Multiple visits and abnormal outcomes remain appointment / visit-layer data.
- Field Service Report remains the Case-level formal completion summary.
- Customer-visible content must be filtered and separated from internal-only notes.

## Minimal Input Matrix

This matrix is intentionally conservative. It describes future input guidance only.

| Input / context | Required from engineer? | Should be minimal? | System may infer? | AI may assist draft? | AI may decide? | Belongs to Case layer? | Belongs to Appointment / Visit layer? | Belongs to Field Service Report summary? | Customer-visible? | Internal-only? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Arrival / on-site confirmation | Yes, if workflow requires arrival tracking. | Yes | Partly, timestamp/device context may assist. | No | No | No | Yes | No | No by default | Yes, audit/ops context | No |
| Diagnosis text or selected symptom | Yes, concise. | Yes | No | Yes | No | No | Yes | Yes, summarized if completed | Maybe, after review | Maybe | No |
| Work performed summary | Yes, concise. | Yes | No | Yes | No | No | Yes | Yes | Maybe, after review | Maybe | No |
| Completion result | Yes, simple selection. | Yes | No, but system validates. | No | No | No | Yes | Yes, if completed | Maybe | Maybe | No |
| Abnormal outcome reason | Yes, when not completed. | Yes | No | Yes | No | No | Yes | Maybe, as history/context | Maybe, if customer-facing | Maybe | No |
| Parts/material used note | Yes, when used or replaced. | Yes | Partly, from parts workflow if future exists. | Yes | No | No | Yes | Yes | Maybe, if customer-facing | Maybe | No |
| Customer-visible service summary | No, not always directly; engineer may provide source facts. | Yes | Partly, from facts and report context. | Yes | No | Maybe | Maybe | Yes | Yes, after visibility review | No | No |
| Internal technician note | Optional. | Yes | No | Yes | No | No | Yes | Maybe | No | Yes | No |
| Customer fee confirmation observed | Yes, only when applicable. | Yes | Partly, from quote/approval workflow. | Yes, reminder only | No | Maybe | Yes | Maybe | Yes, if customer-facing approval | Maybe | No |
| Customer signature captured | Yes, only when required. | Yes | No | No | No | No | Yes | Maybe | Maybe | Sensitive internal/evidence | No |
| Photo / attachment captured | Yes, when required by case type or evidence need. | Yes | No | Yes, missing-evidence reminder only | No | No | Yes | Maybe | Maybe, if selected for customer summary | Sensitive evidence | No |
| Safety issue observed | Yes, if observed. | Yes | No | Yes | No | Maybe | Yes | Maybe | Usually No | Yes | No |
| Unable to complete reason | Yes, when unable to complete. | Yes | No | Yes | No | No | Yes | Maybe | Maybe, if customer-facing | Maybe | No |
| Follow-up needed flag | Yes, simple flag when needed. | Yes | Partly, from abnormal outcome. | Yes, suggestion only | No | Maybe | Yes | Maybe | Maybe | Maybe | No |
| Quote needed flag | Yes, simple flag when needed. | Yes | Partly, from visit outcome / fee workflow. | Yes, suggestion only | No | Maybe | Yes | Maybe | Maybe | Maybe | No |
| Second visit needed flag | Yes, simple flag when needed. | Yes | Partly, from pending parts / quote / unable outcome. | Yes, suggestion only | No | Maybe | Yes | Maybe | Maybe | Maybe | No |

## Anti-burden Rules

Engineers should not be required to enter:

- settlement amount,
- finance approval,
- vendor settlement rule,
- SaaS usage,
- SaaS billing data,
- AI confidence,
- AI retrieval source list,
- audit classification,
- report/export category,
- permission scope,
- entitlement state,
- subscription state,
- provider cost,
- report/dashboard analytics categorization.

The following responsibilities should not be pushed into the engineer completion flow:

- supervisor quality review,
- complaint judgment,
- customer callback conclusion,
- engineer coaching,
- corrective action,
- final finance settlement,
- vendor / brand reconciliation,
- official payable amount decision,
- customer-visible communication strategy beyond simple confirmation facts.

Engineers should also not repeat data the system already has, such as:

- case number,
- customer name,
- customer address,
- assigned appointment id,
- assigned engineer id,
- scheduled time,
- organization id,
- service report id,
- backend-resolved final appointment context.

## AI-assisted Summary Boundary

AI may help by producing:

- customer-visible summary draft,
- internal structured summary draft,
- fault category suggestion,
- missing evidence reminder,
- missing signature reminder,
- missing serial/parts reminder,
- quote or fee-consent reminder,
- pending-parts reason summary.

AI output must:

- be reviewable,
- be editable,
- be rejectable,
- remain separate from official record until confirmed,
- use authorized and masked context only,
- avoid internal-only data in customer-visible drafts.

AI must not:

- decide completion result,
- submit completion,
- fabricate field facts,
- add facts not supported by engineer input or evidence,
- forge arrival,
- forge customer signature,
- approve quote,
- approve settlement,
- decide payable amount,
- change official Case status,
- write raw AI payload into official report or customer-visible data.

## System-inferred Context Boundary

The system may infer or resolve:

- assigned appointment context,
- appointment / visit timestamps where appropriate,
- Case relationship,
- service report relationship,
- finalAppointmentId from eligible completed appointment,
- legacy no-appointment context where allowed,
- next action suggestions from visit outcome,
- whether no eligible completed visit should reject completion.

The engineer should not be asked to manually choose or re-enter:

- `finalAppointmentId`,
- Case id,
- service report id,
- organization id,
- already known customer contact/address data,
- backend status transition details.

## Data Visibility / Security Considerations

Future engineer completion workflow must preserve:

- assigned appointment scope,
- organization isolation,
- Field Engineer Seat boundary,
- role/permission checks,
- Data Access Control,
- field-level masking where possible,
- customer-visible/internal-data separation,
- sensitive customer data minimization,
- audit readiness,
- usage tracking readiness for uploads / AI / notifications,
- token/secret/provider safety,
- no raw LINE id exposure,
- no provider raw payload exposure.

Sensitive field data such as customer phone, address, signature, photo, serial number, and internal note should be visible only when operationally necessary.

Photos, signatures, and files should use future object/file storage with metadata, permission, retention, and audit policy.

## Runtime Forbidden Confirmation

Task290 explicitly does not implement:

- Engineer Mobile App runtime,
- mobile web runtime,
- completion runtime changes,
- Field Service Report runtime changes,
- appointment runtime changes,
- API changes,
- Admin UI changes,
- photo upload runtime,
- signature capture runtime,
- file storage runtime,
- AI summary runtime,
- AI suggestion runtime,
- permission runtime,
- entitlement runtime,
- usage metering runtime,
- seat management runtime,
- notification/provider sending runtime,
- LINE / SMS / Email / APP sending,
- report / export / download runtime,
- DB schema,
- migration,
- index,
- tests,
- smoke fixtures.

## Future Implementation Questions

Before any minimal completion input runtime work begins, future tasks must answer:

- Which completion fields are mandatory by visit result?
- Which fields are mandatory only by case type?
- Which abnormal outcomes require next action?
- Which customer-visible summary fields require review?
- Which internal notes are field-only vs supervisor-visible?
- Which photos are mandatory for each case type?
- Which signature cases are mandatory?
- Which parts/material details are required?
- How should customer fee confirmation be displayed and recorded?
- How should AI drafts be accepted, rejected, or edited?
- How should unsupported AI claims be prevented?
- How should duplicate submissions be prevented?
- How should completion retry behave in mobile poor-network conditions?

## Conclusion

Task290 adds docs-only minimal completion input guidance.

It does not approve Engineer Mobile / completion runtime implementation.

Future implementation must preserve:

- simple engineer completion flow,
- minimum field input,
- engineer-provided field facts only,
- system-inferred completion context,
- AI as assistant only,
- no engineer manual `finalAppointmentId`,
- appointment / visit-level abnormal outcomes,
- Case-level formal Field Service Report summary,
- photos/signatures/files through object/file storage direction,
- organization isolation and Data Access Control,
- runtime allowed now is No.
