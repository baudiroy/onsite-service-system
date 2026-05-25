# Task 324 - Customer-facing Completion Flow Boundary Matrix / No Runtime Change

## Scope And Non-goals

This document follows the `docs/PROJECT_GUARDRAILS.md` update that added Customer-facing Completion Flow Future Design.

Task324 turns that guardrail into a docs-only boundary matrix. It clarifies boundaries between:

- internal Field Service Report,
- customer-facing service report,
- customer-visible service result summary,
- customer signature,
- no-signature exception,
- representative / agent signature,
- remote completion,
- customer-visible charge summary,
- follow-up / escalation entry,
- service report version,
- access log / contact history,
- audit readiness.

Task324 is not:

- backend runtime,
- Admin runtime,
- API contract change,
- migration,
- schema change,
- index change,
- view change,
- DB / DDL execution,
- customer-facing report runtime,
- Field Service Report runtime change,
- completion runtime change,
- signature runtime,
- file / photo runtime,
- invoice / charge runtime,
- survey runtime,
- notification / provider sending runtime,
- follow-up / escalation runtime,
- access log runtime,
- audit runtime,
- AI / RAG runtime,
- test / smoke / fixture change,
- package change.

No runtime implementation is approved by this document.

## Why This Task Follows The Guardrail Update

The guardrail update established that customer completion is not the same as internal completion.

The internal Field Service Report is the formal operations, settlement, reconciliation, engineer record, and internal traceability artifact. The customer-facing service report is a safe summary for the customer and must follow customer visible data policy.

Task324 adds explicit matrices so future implementation cannot accidentally:

- expose the internal FSR directly to customers,
- make signature mandatory for all completion,
- treat no-signature cases as impossible to complete,
- expose internal billing / settlement data,
- hide issue reporting inside survey scores only,
- overwrite customer-facing reports without versioning,
- treat notification / download tracking as unlogged side effects,
- let AI publish or decide official customer-facing completion content.

## Definitions

### Internal Field Service Report

The formal internal Case-level completion report used for operations, settlement, reconciliation, engineer records, internal follow-up, and audit-ready traceability.

It is not customer-facing by default.

### Customer-facing Service Report

A customer-visible summary of service results. It must be clear, minimal, and governed by customer visible data policy.

It must not be a raw copy of the internal Field Service Report.

### Customer-visible Service Result Summary

The safe summary that explains what was serviced, when, what was done, and what the customer should know next. It may appear in LINE, App, Web, Email, or a downloadable report.

### Customer Signature

Evidence that the customer or authorized representative acknowledged service completion at the site. It is important evidence but not an absolute prerequisite for all completion.

### No-signature Exception

A structured exception when customer signature cannot be obtained or is not appropriate. Examples include customer not onsite, refusal, remote completion, urgent departure, unattended equipment, or business-approved exception.

### Representative / Agent Signature

A signature from a family member, building manager, receiver, representative, or other approved person. It should include relationship / role metadata where appropriate.

### Remote Completion

A completion scenario where service is completed without a standard onsite customer signature, requiring clear reason, supporting evidence, and review readiness.

### Customer-visible Charge Summary

The customer-facing view of confirmed customer charges, approvals, receipt, invoice, or payment status. It is not internal billing / settlement data.

### Follow-up / Escalation Entry

A future trackable entry created when the customer reports an unresolved issue, asks for contact, gives low satisfaction, leaves negative feedback, or raises a complaint.

### Service Report Version

A version of the customer-facing report after generation or delivery. Versions should support traceability when photos, serial numbers, fee summaries, notices, or other important content changes.

### Access Log / Contact History

Future record of report sent, opened, downloaded, survey sent, survey completed, issue reported, or customer contacted. It is separate from internal FSR content and audit log.

## Boundary Principles

- Internal Field Service Report is not customer-facing service report.
- Field Service Report is the internal formal completion report.
- Customer-facing service report is a customer-visible summary and must obey customer visible data policy.
- Customer-facing report must not expose the internal FSR as-is.
- Customer signature is important evidence but not an absolute completion requirement.
- No-signature, proxy-signature, refusal, remote completion, customer not onsite, and unattended-site cases require future structured exception reason / evidence / review / audit readiness.
- If customer charges are involved, the customer-facing view should show only confirmed customer-relevant charge / approval / invoice / receipt information.
- Customer-facing views must not expose internal settlement price, vendor claim amount, engineer cost, brand reconciliation rule, internal discount reason, or settlement / billing internal data.
- Issue reports, low ratings, negative feedback, complaints, and callback requests should create future follow-up / escalation entries.
- Follow-up / escalation should not be stored only as FSR internal note or survey free text.
- Customer-facing report needs future versioning and should not be silently overwritten.
- AI may draft wording or summarize but must not decide, publish, hide negative feedback, close complaints, modify ratings, or change official completion results.

## Future-only Customer-facing Report Content Matrix

| Content item | Source layer | Customer-visible? | Internal-only? | Requires masking / redaction? | Requires evidence? | Requires versioning? | Requires audit readiness? | AI may draft wording? | AI may decide / publish? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Case number | Case | Yes | No | Optional | No | Yes if report sent | Yes | No | No | No |
| Service date | Appointment / final appointment | Yes | No | No | No | Yes if corrected | Yes | No | No | No |
| Service item | Field Service Report / service summary | Yes | No | Optional | No | Yes if corrected | Yes | Yes | No | No |
| Product type / model | Case / product data | Yes if safe | No | Optional | No | Yes if corrected | Yes | Yes | No | No |
| Fault summary | Internal FSR transformed to customer summary | Yes if safe | No | Yes | No | Yes | Yes | Yes | No | No |
| Handling result | Internal FSR transformed to customer summary | Yes if safe | No | Yes | Yes if disputed | Yes | Yes | Yes | No | No |
| Replaced parts summary | Parts / completion record | Yes if appropriate | No | Optional | Yes if charge / warranty relevant | Yes | Yes | Yes | No | No |
| Serial number if appropriate | Product / parts / completion record | Conditional | No | Yes | Yes if shown | Yes | Yes | No | No | No |
| Completion photos if appropriate | File / attachment storage | Conditional | No | Yes | Yes | Yes | Yes | No | No | No |
| Signature / no-signature / proxy-signature exception summary | Signature / exception evidence | Yes, summarized | No | Yes | Yes | Yes | Yes | Yes | No | No |
| Confirmed customer charge summary | Charge / approval / invoice records | Yes if confirmed | No | Optional | Yes | Yes | Yes | Yes | No | No |
| Warranty / notice | Policy / service report summary | Yes | No | Optional | No | Yes | Yes | Yes | No | No |
| Follow-up contact method | Customer service policy / channel identity | Yes | No | Yes | No | Yes | Yes | Yes | No | No |
| Internal note | Internal FSR / CS / engineer note | No | Yes | Not enough; exclude | No | Internal only | Yes | No | No | No |
| Audit log | Audit system | No | Yes | Not enough; exclude | Yes | Internal only | Yes | No | No | No |
| AI raw payload / AI risk flag | AI system | No | Yes | Not enough; exclude | No | Internal only | Yes | No | No | No |
| Billing / settlement internal data | Billing / settlement | No | Yes | Not enough; exclude | Yes | Internal only | Yes | No | No | No |
| Engineer internal comment | Internal note / quality review | No | Yes | Not enough; exclude | Optional | Internal only | Yes | No | No | No |
| Supervisor review record | Review / escalation system | No | Yes | Not enough; exclude | Yes | Internal only | Yes | No | No | No |

## Future-only Completion Flow Matrix

| Flow state | Actor / channel | Customer-visible? | May update internal FSR? | May update customer-facing report? | May create follow-up / escalation? | Requires contact / access log? | Requires audit readiness? | Requires Data Access Control? | Requires usage tracking? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal FSR completed | Backend / authorized user | No by default | Future-only yes | No, except source for customer summary | No | No | Yes | Yes | Optional | No |
| `finalAppointmentId` confirmed | Backend / system | No by default | Future-only yes | No, except report context | No | No | Yes | Yes | Optional | No |
| Customer-facing report generated candidate | Backend / report generator | No until sent | No | Future-only yes | No | Yes if generated / previewed | Yes | Yes | Optional | No |
| Customer-facing report reviewed / approved candidate | CS / supervisor / system rule | No until sent | No | Future-only yes | Possible | Yes | Yes | Yes | Optional | No |
| Report sent / opened / downloaded candidate | LINE / App / Web / Email / SMS link | Yes | No | No, access only | Possible if issue raised | Yes | Yes | Yes | Yes | No |
| Customer signature captured | Engineer / customer / representative | Customer participates | No direct FSR mutation without approved workflow | Future-only summary possible | No | Yes | Yes | Yes | Optional | No |
| No-signature exception recorded | Engineer / CS / supervisor | No by default | Future-only evidence update | Future-only summary possible | Possible review | Yes | Yes | Yes | Optional | No |
| Representative / agent info recorded | Engineer / representative | No by default | Future-only evidence update | Future-only summary possible | Possible review | Yes | Yes | Yes | Optional | No |
| Customer reports issue | Customer via LINE / App / Web / Email / phone | Yes | No | No direct report mutation | Future-only yes | Yes | Yes | Yes | Yes | No |
| Unresolved issue / complaint / callback request created candidate | CS / system / customer channel | Customer may see acknowledgement | No direct FSR mutation | No direct report mutation | Future-only yes | Yes | Yes | Yes | Yes | No |
| Survey sent candidate | Notification / survey system | Yes | No | No | Possible if response indicates issue | Yes | Yes | Yes | Yes | No |
| Survey completed candidate | Customer / survey system | Yes | No | No | Future-only yes if low score / complaint | Yes | Yes | Yes | Yes | No |
| Report version updated candidate | Authorized user / system | Maybe customer-visible after send | No direct FSR mutation unless approved correction flow | Future-only yes | Possible | Yes | Yes | Yes | Optional | No |

## Data Protection Rules

Customer-facing report must not include:

- internal note,
- audit log,
- AI raw payload,
- AI risk flag,
- billing internal data,
- settlement internal data,
- engineer internal comment,
- supervisor review record,
- vendor reconciliation rule,
- internal cost,
- unauthorized data.

Logs, errors, frontend responses, AI context, notification payloads, and generated reports must not expose:

- complete phone values,
- complete email values,
- complete addresses beyond what is necessary and authorized,
- provider tokens,
- secrets,
- LINE access tokens,
- channel secrets,
- raw LINE identifiers,
- raw provider payloads,
- verification codes,
- raw signature data,
- unmasked photos,
- unrestricted customer private data.

Customer-facing report content must be data-minimized, permission-scoped, organization-scoped, and channel-safe.

## Versioning / Access / Notification Readiness

Future customer-facing report versions should track:

- report version,
- `updated_at`,
- `updated_by`,
- `change_reason`,
- previous version,
- audit log reference.

Future report access and notification should track:

- completion notice sent,
- read / clicked status if available,
- report opened,
- report downloaded,
- survey sent,
- survey completed,
- issue reported,
- access link expiration,
- revoked link status if applicable.

Channel positioning:

- LINE / App can be primary interaction and notification channels.
- SMS is reminder and channel guidance.
- Web link is view / confirm / form entry, not the primary proactive notification channel.
- Email and human resend are optional future fallback paths.

## Interaction With Existing Branches

### Field Service Report Completion Readiness

Customer-facing completion depends on stable internal Field Service Report completion. It must not weaken one Case = one formal Field Service Report.

### finalAppointmentId Backend-owned Inference

Customer-facing report and survey context should use the completed report's stable `finalAppointmentId`. It must not re-infer final appointment separately for customer reporting.

### Customer-visible Service Result Summary

Customer-facing report is an expanded version of customer-visible service result summary and must preserve the same customer visible data policy.

### Customer Fee Consent

Customer fee display must use confirmed charge / approval / invoice / receipt records. It must not expose internal billing or settlement data.

### Engineer Mobile Photos / Signature / Attachments

Photos, signatures, and attachments should come from approved file / evidence flows and should not be embedded directly into core tables.

### Customer Channel Identity / Notification

Delivery and access depend on LINE / App / SMS / Web / Email identity and notification policy. Raw channel identifiers must not be exposed.

### Operations / Quality Follow-up / Escalation

Issue reporting, low score, complaint, and callback request should create future follow-up / escalation candidates.

### Audit Log / Evidence Traceability

Signature exceptions, report versions, access logs, downloads, customer issues, and high-risk changes should be audit-ready.

### Data Access Control

Customer report generation, viewing, download, issue reporting, survey, and follow-up must use the shared Data Access Control model.

### AI Advisory-only

AI may draft wording, summarize, classify, or flag risk. AI must not decide, publish, hide negative feedback, close complaints, modify ratings, or change official completion results.

## Explicit Runtime Forbidden Confirmation

Task324 does not allow:

- backend runtime,
- Admin runtime,
- API change,
- migration,
- schema change,
- index change,
- view change,
- DB connection,
- DDL,
- psql,
- `npm run db:migrate`,
- Migration020 dry-run or apply,
- customer-facing report runtime,
- completion runtime change,
- Field Service Report runtime change,
- signature runtime,
- file / photo runtime,
- invoice runtime,
- charge runtime,
- payment runtime,
- billing runtime,
- settlement runtime,
- survey runtime,
- notification / provider sending runtime,
- follow-up runtime,
- escalation runtime,
- access log runtime,
- audit runtime,
- AI / RAG runtime,
- tests / smoke / fixtures change,
- package change,
- inventory docs change.

## Non-goals

Task324 must not:

- modify backend `src/`,
- modify Admin `admin/src/`,
- add or modify API behavior,
- add or modify migrations / schema / indexes / views,
- connect to DB,
- execute DDL,
- run psql,
- run `npm run db:migrate`,
- execute Migration020 dry-run or apply,
- add customer-facing report runtime,
- add completion / Field Service Report runtime,
- add signature / file / photo runtime,
- add invoice / payment / billing / settlement runtime,
- add survey / follow-up / escalation runtime,
- add notification / provider sending runtime,
- add customer channel identity runtime,
- add permission / entitlement / usage / audit runtime,
- add AI / RAG runtime,
- modify tests / smoke / fixtures / package.json,
- modify inventory docs.

## Future Implementation Gates

Before any runtime work can begin, a future task must explicitly approve:

- exact backend files / layers,
- exact Admin files / layers, if any,
- API contract changes, if any,
- migration / schema / index / view changes, if any,
- DB / DDL permission, if any,
- customer-facing report schema / versioning,
- signature and no-signature exception schema,
- file / photo access policy,
- customer-visible charge / invoice source rules,
- survey trigger and response rules,
- follow-up / escalation workflow,
- report notification and access-link policy,
- download / access log policy,
- Data Access Control and organization isolation checks,
- audit log requirements,
- SaaS usage tracking requirements,
- test / smoke / fixture scope,
- rollback and safety plan.

## Conclusion

Task324 is docs-only customer-facing completion flow boundary guidance.

It does not approve customer report runtime, completion runtime, signature runtime, survey runtime, notification runtime, follow-up runtime, invoice runtime, access log runtime, audit runtime, DB / DDL, API changes, tests, smoke scripts, fixtures, package changes, or inventory documentation updates.
