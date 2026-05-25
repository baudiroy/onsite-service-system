# Task 305 - Audit Evidence Traceability For Customer Consent And Approval Boundary / No Runtime Change

## Scope And Non-goals

This document continues the Audit Log / Evidence Traceability branch after Task303 and Task304.

Task305 defines future-only boundaries for customer consent evidence and approval evidence across customer fee consent, quote approval, notification consent, survey response, complaint/callback human decisions, settlement approval, SaaS billing approval, and audit / evidence records.

The goal is to prevent future implementations from treating evidence records, audit events, notification delivery, AI suggestions, or notes as actual consent or business approval.

Task305 is documentation-only.

This task is not:

- audit log runtime,
- evidence runtime,
- consent runtime,
- approval runtime,
- customer fee consent runtime,
- quote runtime,
- billing runtime,
- settlement runtime,
- notification consent runtime,
- provider sending runtime,
- complaint runtime,
- callback runtime,
- quality review runtime,
- SaaS billing runtime,
- subscription runtime,
- payment runtime,
- invoice runtime,
- permission runtime,
- role runtime,
- entitlement runtime,
- usage runtime,
- seat billing runtime,
- report/export/download runtime,
- customer channel identity runtime,
- reverse binding runtime,
- verification runtime,
- AI / RAG runtime,
- API contract,
- Admin UI,
- backend service change,
- DB schema / migration proposal,
- smoke / test implementation.

Task305 does not add tables, migrations, schema, indexes, backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, smoke scripts, fixtures, package changes, audit runtime, evidence runtime, consent runtime, approval runtime, billing runtime, settlement runtime, SaaS billing runtime, provider sending, AI runtime, or inventory documentation changes.

## Why Consent / Approval Evidence Traceability Is Needed After Task304

Task304 defined actor and event category boundaries.

The next risk is treating any evidence or audit record as if it were the actual business approval.

Customer consent and approval are high-risk concepts. Customer fee consent, quote approval, notification consent, survey response, complaint/callback decision, settlement approval, and SaaS billing approval have different policies, actors, scopes, permissions, and evidence needs.

Task305 defines those boundaries before any evidence, consent, approval, billing, settlement, notification, complaint/callback, SaaS billing, API, Admin, DB, or AI runtime is approved.

## Definitions

### Customer Consent Evidence

Customer consent evidence is future supporting proof that a customer consent-related action occurred.

It is evidence for review, not the consent state by itself unless a future approved workflow explicitly records it as such.

### Customer Fee Consent

Customer fee consent is future customer agreement to a fee, surcharge, onsite add-on, additional work, second visit fee, or other customer-payable item.

It is not settlement approval.

### Notification Consent

Notification consent is future customer agreement to receive one or more notification categories through a scoped channel or purpose.

It is not customer fee consent and not marketing consent unless explicitly scoped.

### Quote Approval

Quote approval is future customer decision to accept or reject a quote.

It is not settlement approval and not fee settlement calculation.

### Survey Response Evidence

Survey response evidence is future proof of customer feedback, rating, comments, or satisfaction response.

It is not complaint closure by itself.

### Complaint / Callback Decision Evidence

Complaint / callback decision evidence is future proof of human decision, callback result, escalation handling, or closure decision.

It must remain separate from survey response and settlement approval.

### Settlement Approval Evidence

Settlement approval evidence is future proof that an authorized finance/supervisor role approved, rejected, or adjusted settlement.

It is not customer fee consent and not quote approval.

### SaaS Billing Approval Evidence

SaaS billing approval evidence is future proof related to SaaS subscription, account-seat billing, usage billing, invoice, payment, or tenant-level commercial approval.

It is not service billing, field service settlement, quote approval, or customer fee consent.

### Evidence Source

Evidence source is the future origin of evidence, such as customer channel, Admin user, field engineer workflow, provider result category, uploaded file metadata, system process, or AI-assisted draft.

### Evidence Channel

Evidence channel is the future channel category through which evidence was captured, such as LINE, SMS, Email, Web portal, App, phone summary, onsite signature, Admin manual entry, or system event.

### Evidence Actor

Evidence actor is the future actor associated with the evidence capture or decision.

Evidence actor does not automatically have approval permission.

### Evidence Timestamp

Evidence timestamp is the future time reference for when evidence was captured, submitted, reviewed, or decided.

### Evidence Payload Summary

Evidence payload summary is a minimized, masked summary of evidence content.

It must not store raw sensitive payload.

## Boundary Principles

- Evidence record is not approval.
- Audit event is not consent.
- Consent must not live only in an unstructured note.
- Customer fee consent is not settlement approval.
- Quote approval is not settlement approval.
- Notification consent is not customer fee consent.
- Survey response is not complaint closure.
- Complaint closure is not settlement approval.
- SaaS billing approval is not service billing / settlement approval.
- AI suggestion cannot be consent.
- AI suggestion cannot be approval.
- Notification delivery is not consent.
- Provider delivery is not approval.
- Customer channel binding is not notification consent.
- Customer channel verification is not quote approval.
- Customer signature evidence is not automatically settlement approval.
- Uploaded document evidence is not automatically approval.
- Human decision and actor permission must be explicit in future workflows.

## Future-only Evidence Matrix

This matrix is future-only guidance. It does not approve evidence runtime, audit runtime, consent runtime, approval runtime, schema, API, Admin UI, provider sending, billing, settlement, SaaS billing, AI runtime, or DB changes.

| Evidence row | Business meaning | Evidence actor | Evidence channel | Customer-visible? | Internal-only? | Requires timestamp? | Requires amount/scope/version? | Can include raw payload? | Requires masking/redaction? | May link audit event? | May link usage tracking separately? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Customer fee consent captured | Customer agreed to a fee or payable item | Customer / internal user / system | Customer channel / onsite / Admin future | Maybe | Maybe | Yes | Yes | No | Yes | Yes | Maybe | No |
| Customer fee consent revoked / disputed future candidate | Customer revoked or disputed previous fee consent | Customer / internal user | Customer channel / Admin future | Maybe | Maybe | Yes | Yes | No | Yes | Yes | Maybe | No |
| Quote approved by customer | Customer accepted a quote | Customer / internal user / system | Customer channel / Admin future | Yes | Maybe | Yes | Yes | No | Yes | Yes | Maybe | No |
| Quote rejected by customer | Customer rejected a quote | Customer / internal user / system | Customer channel / Admin future | Yes | Maybe | Yes | Yes | No | Yes | Yes | Maybe | No |
| Notification consent granted | Customer consented to a notification purpose/channel scope | Customer / system | Customer channel / portal future | Yes | Maybe | Yes | Yes | No | Yes | Yes | Maybe | No |
| Notification consent revoked | Customer revoked notification consent scope | Customer / system | Customer channel / portal future | Yes | Maybe | Yes | Yes | No | Yes | Yes | Maybe | No |
| Survey submitted | Customer submitted feedback | Customer / system | Customer channel / survey future | Yes | Maybe | Yes | Yes | No | Yes | Yes | Maybe | No |
| Complaint confirmed by human | Internal human confirmed complaint handling category | Supervisor / support user | Admin future | No | Yes | Yes | Yes | No | Yes | Yes | Maybe | No |
| Complaint closed by human | Authorized human closed complaint/callback workflow | Supervisor / support user | Admin future | Maybe summary only | Yes | Yes | Yes | No | Yes | Yes | Maybe | No |
| Callback completed by human | Human completed callback step | Support user / supervisor | Admin future | Maybe summary only | Maybe | Yes | Yes | No | Yes | Yes | Maybe | No |
| Settlement approved by finance | Finance approved settlement | Finance user / supervisor | Admin future | No | Yes | Yes | Yes | No | Yes | Yes | Maybe | No |
| Settlement rejected / adjusted by finance | Finance rejected or adjusted settlement | Finance user / supervisor | Admin future | No | Yes | Yes | Yes | No | Yes | Yes | Maybe | No |
| SaaS subscription approval future candidate | Tenant/commercial approval for SaaS subscription | SaaS admin / internal admin | Admin / billing future | No | Yes | Yes | Yes | No | Yes | Yes | Maybe | No |
| Report/export approval future candidate | Approval to generate/export/download sensitive report | Authorized internal user | Admin future | No | Yes | Yes | Yes | No | Yes | Yes | Yes | No |

## Evidence Payload Minimization Rules

Evidence payload summary may record:

- evidence category,
- masked reference,
- amount category or approved amount where policy allows,
- scope,
- version,
- channel category,
- timestamp,
- actor type,
- policy version,
- status category,
- file metadata reference,
- customer-visible summary if policy allows.

Evidence payload summary must not store:

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
- full internal note,
- full customer private content,
- full audit log details.

Customer signature, photo, and document evidence should link to future file metadata reference. Raw content should not be stored directly in evidence rows.

## Approval Separation Rules

- Customer approval, supervisor approval, finance approval, SaaS admin approval, and AI suggestion accept / reject / edit are different concepts.
- A single generic approval concept must not replace all business approval types.
- Settlement approval, quote approval, customer fee consent, notification consent, complaint closure, and SaaS billing approval require different future policy and permission.
- Customer fee consent may support settlement review, but does not approve settlement.
- Quote approval may support future work authorization, but does not approve settlement.
- Notification consent may authorize notification category delivery, but does not authorize fees, quotes, settlement, or complaint closure.
- Survey response may start complaint/callback workflow, but does not close complaint by itself.
- SaaS billing approval governs tenant commercial terms, not field service settlement.
- AI suggestion can inform human review, but cannot become approval by itself.

## Interaction With Previous Branches

### Billing / Settlement

Customer fee consent and settlement approval must remain separate.

Future billing/settlement evidence may reference customer fee consent evidence, quote evidence, service report context, and finance approval evidence, but must not collapse them into one record type.

### Customer Channel Notification Consent

Notification consent is scoped to notification purpose and channel.

It is not customer fee consent, quote approval, marketing consent unless scoped, or customer self-service authorization.

### Operations / Quality

Complaint and callback human decisions need evidence traceability.

Survey response or AI risk flag can inform quality workflow, but cannot close complaint or callback automatically.

### Engineer Mobile

Engineer Mobile may capture onsite signature, photo metadata, short completion notes, and fee display acknowledgement in future workflows.

Engineer-captured evidence must remain simple for field users and must not become hidden settlement approval.

### Data Access Control

Evidence lookup requires Data Access Control, role/permission, masking, and audit of access.

Customer-visible evidence summaries must not expose internal-only review, settlement internals, SaaS billing data, AI raw payload, or full audit log details.

### AI / RAG

AI suggestions may generate draft explanation, classification, or risk flags.

AI suggestion audit is not consent and not approval.

AI/RAG should not retrieve evidence raw payloads or complete audit logs without permission-aware, minimized, masked context.

### SaaS Billing Vs Service Billing

SaaS billing approval and field service billing/settlement approval are separate domains.

SaaS subscription approval must not be mixed with customer service fee consent or vendor settlement approval.

## Data Protection And Access Rules

- Evidence query requires future Data Access Control.
- Evidence query requires role and permission.
- Evidence query may require masking.
- Evidence query should be audited.
- Customer-visible evidence summary must not expose internal-only review.
- Customer-visible evidence summary must not expose settlement internals.
- Customer-visible evidence summary must not expose SaaS billing data.
- Customer-visible evidence summary must not expose AI raw payload.
- Customer-visible evidence summary must not expose full audit log details.
- Internal evidence must not be directly displayed externally.
- Evidence attachments should follow object/file storage and access-control policy.
- Evidence exports should follow report/export/download permission and data minimization.

## Explicit Runtime Forbidden Confirmation

Task305 does not approve:

- audit log runtime,
- evidence runtime,
- consent runtime,
- approval runtime,
- customer fee consent runtime,
- quote runtime,
- billing runtime,
- settlement runtime,
- notification consent runtime,
- provider sending runtime,
- complaint runtime,
- callback runtime,
- quality review runtime,
- SaaS billing runtime,
- subscription runtime,
- payment runtime,
- invoice runtime,
- permission runtime,
- role runtime,
- entitlement runtime,
- usage runtime,
- seat billing runtime,
- report/export/download runtime,
- customer channel identity runtime,
- reverse binding runtime,
- verification runtime,
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

These questions should be answered before consent / approval evidence runtime is implemented:

- Which evidence types require customer-visible confirmation?
- Which evidence types require amount and policy version?
- Which evidence types require file attachment metadata?
- Which approval types require two-person review?
- Which customer fee consent categories must be revocable or disputable?
- Which quote decisions can be captured through customer channels?
- Which settlement approvals require finance-only permission?
- Which complaint closures require supervisor permission?
- How should customer-visible evidence summaries be localized?
- How should evidence retention differ from audit retention?
- How should AI suggestions cite evidence without exposing raw sensitive content?

## Conclusion

Task305 is docs-only consent / approval evidence boundary guidance.

It does not approve audit, evidence, consent, approval, billing, settlement, notification, complaint/callback, SaaS billing, AI, API, Admin, DB, or migration runtime implementation.

Future consent and approval evidence work may use this document as planning input, but any runtime, schema, API, Admin UI, provider integration, report/export, billing, settlement, AI/RAG, permission, usage, or test work requires explicit future approval.
