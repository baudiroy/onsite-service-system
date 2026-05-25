# Task 293 - Engineer Mobile Customer Fee Confirmation Display Boundary / No Runtime Change

## Scope And Non-goals

This document continues the Engineer Mobile / Field UX docs-only branch after Task289 through Task292.

Task293 defines future-only boundaries for displaying customer-visible fee information in Engineer Mobile or field-service workflows.

The goal is to separate simple on-site fee confirmation display from formal customer fee consent, quote approval, settlement approval, billing/finance review, payment, invoice, and SaaS billing.

Task293 is documentation-only.

This task is not:

- Engineer Mobile App runtime,
- mobile web runtime,
- customer fee consent runtime,
- quote runtime,
- billing runtime,
- settlement runtime,
- payment runtime,
- invoice runtime,
- AI approval runtime,
- AI consent runtime,
- permission runtime,
- entitlement runtime,
- usage metering runtime,
- API contract,
- Admin UI,
- backend service change,
- DB schema / migration proposal,
- smoke / test implementation.

Task293 does not add tables, migrations, schema, indexes, backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, smoke scripts, fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, report/export/download runtime, payment/invoice runtime, customer fee consent runtime, quote runtime, settlement runtime, AI runtime, or inventory documentation changes.

## Why Customer Fee Confirmation Display Boundaries Are Needed After Task292

Task292 clarified that photos, signatures, attachments, and evidence files need strict storage, visibility, download/export, and AI-analysis boundaries.

The next risk is treating a customer-facing fee display as if it were the same thing as customer fee consent, quote approval, finance approval, settlement approval, or payment/invoice handoff.

Engineer Mobile may eventually help engineers show customer-visible fee information on-site, but engineers must not become finance approvers, vendor settlement calculators, SaaS cost explainers, or AI-controlled consent agents.

Task293 defines the boundary so future field UX can keep the customer experience clear without turning a simple display into official consent or settlement runtime.

## Definitions

### Customer Fee Confirmation Display

Customer fee confirmation display is a future customer-visible screen or summary that shows fee-related information that the customer may need to review.

It is informational until a separate future consent/approval workflow records formal consent.

### Customer Fee Consent

Customer fee consent is the formal record that a customer agreed to a charge, fee, quote, add-on, second visit fee, or other cost item.

Customer fee consent must not be stored only as a note. It requires future structured record, evidence, timestamp, channel/source, actor, and audit policy.

### Quote Required

Quote required means a visit or case needs a quote workflow before work continues or before a fee can be treated as approved.

Quote required is not quote approval.

### Quote Approval

Quote approval is the formal customer or authorized reviewer approval of a quote.

Quote approval is not settlement approval.

### On-site Additional Fee

On-site additional fee is a charge identified during field work, such as additional work, installation extra, accessory, material, or other field-discovered fee.

It may require customer fee consent and may require quote workflow depending on policy.

### Floor / Carrying / Remote Fee

Floor, carrying, and remote fee are operational fee categories related to site condition, access, service route, or logistics.

They should be future configurable billing items or settlement rule inputs, not hard-coded engineer calculations.

### Parts / Material Charge

Parts/material charge is a cost or estimate related to replacement parts, material, consumable, accessory, or on-site add-on.

It may be customer-visible, but final billing/settlement handling remains separate.

### Service Charge Estimate

Service charge estimate is a preliminary customer-visible amount or range.

It is not final invoice, not final settlement, and not customer consent unless a future consent workflow records it.

### Settlement Approval

Settlement approval is internal finance/vendor/brand approval of payable/receivable treatment under deterministic rules or authorized manual review.

Engineers do not approve settlement.

### Payment / Invoice Handoff

Payment/invoice handoff is a future transition from service/billing information into payment collection, invoice creation, or receivable workflow.

It is not part of Task293 and must remain separate from field display.

## Boundary Principles

- Engineers may help display customer-visible fee information, but they must not represent customer consent unless a future consent workflow explicitly records it.
- Customer fee confirmation display is not formal customer fee consent.
- Quote required is not quote approval.
- Quote approval is not settlement approval.
- Customer consent must not be stored only in a note.
- Customer-visible fee display must not expose internal billing rules, settlement rules, vendor payout, SaaS cost, AI Add-on cost, provider usage cost, internal margin, or finance-only status.
- Engineers must not be responsible for finance approval.
- Engineers must not be responsible for settlement approval.
- Engineers must not calculate vendor / brand payout.
- Engineers must not enter SaaS usage, provider cost, AI cost, or billing subscription data.
- AI may suggest wording or flag missing consent, but AI must not approve, consent, calculate official payable amount, or change official status.
- Data Access Control remains authoritative for what fee information each role can see.
- Customer-visible fee display, customer fee consent, quote approval, settlement approval, and payment/invoice handoff must remain separate workflows.

## Future-only Display / Consent Matrix

This matrix is future-only guidance. It does not approve runtime, schema, API, mobile UI, fee consent, quote, billing, settlement, payment, invoice, AI, permission, entitlement, or usage implementation.

| Display / consent item | Customer-visible? | Engineer-visible? | Internal-only? | Requires customer consent? | May require quote workflow? | May affect settlement? | May affect payment / invoice handoff? | May AI suggest wording? | May AI approve / consent? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Base service fee display | Yes, if policy allows. | Yes, assigned scope only. | No by default. | Maybe | Maybe | Future-only maybe | Future-only maybe | Yes | No | No |
| Floor fee display | Yes, if applicable and policy allows. | Yes, assigned scope only. | No by default. | Yes, if charged. | Maybe | Future-only maybe | Future-only maybe | Yes | No | No |
| Carrying fee display | Yes, if applicable and policy allows. | Yes, assigned scope only. | No by default. | Yes, if charged. | Maybe | Future-only maybe | Future-only maybe | Yes | No | No |
| Remote fee display | Yes, if applicable and policy allows. | Yes, assigned scope only. | No by default. | Yes, if charged. | Maybe | Future-only maybe | Future-only maybe | Yes | No | No |
| Parts / material estimate display | Yes, as estimate if policy allows. | Yes, assigned scope only. | No by default. | Maybe | Yes, often. | Future-only maybe | Future-only maybe | Yes | No | No |
| Second visit fee display | Yes, if policy allows. | Yes, assigned scope only. | No by default. | Yes, if charged. | Maybe | Future-only maybe | Future-only maybe | Yes | No | No |
| Quote required notice | Yes | Yes | No by default. | No by itself. | Yes | Future-only maybe | Future-only maybe | Yes | No | No |
| Customer fee consent capture candidate | Yes, as future flow candidate. | Yes, assigned scope only. | Maybe, evidence details may be internal. | Yes | Maybe | Future-only maybe | Future-only maybe | Yes, prompt wording only. | No | No |
| Customer declined fee | Maybe, customer-facing acknowledgement if policy allows. | Yes | Maybe | No, records refusal instead. | Maybe | Future-only maybe | Future-only maybe | Yes | No | No |
| Fee dispute noted | Maybe, safe customer acknowledgement only. | Yes | Maybe | No | Maybe | Future-only maybe | Future-only maybe | Yes | No | No |
| Payment / invoice handoff notice | Yes, if future payment/invoice flow supports it. | Maybe | Maybe | No by itself. | No by itself. | Future-only maybe | Future-only yes | Yes | No | No |

## Engineer UX Anti-burden Rules

Engineer field workflow must remain simple.

Future Engineer Mobile should not ask engineers to:

- calculate settlement amount,
- decide vendor payout,
- decide brand payout,
- interpret vendor / brand settlement rules,
- approve finance result,
- enter SaaS usage,
- enter provider cost,
- enter AI cost,
- select account/seat billing category,
- decide invoice status,
- decide payment status,
- expose internal settlement logic to customers.

Engineer field workflow may ask engineers to record simple field facts, such as:

- customer saw fee information,
- fee category was discussed,
- customer asked for quote,
- customer declined fee,
- customer disputed fee,
- second visit may be needed,
- fee-related evidence exists,
- follow-up is needed.

These field facts do not become official consent, quote approval, settlement approval, invoice, or payment record unless a future controlled workflow records them.

## Data Separation Rules

Customer-visible fee display, customer fee consent, quote approval, settlement approval, and payment/invoice handoff must be separate.

Customer-visible fee display:

- may show safe fee categories, estimates, or policy-approved customer charges,
- must not show internal vendor payout, internal margin, provider cost, SaaS cost, AI Add-on cost, or settlement-only details.

Customer fee consent:

- must be a future structured record,
- should include source/channel, timestamp, actor, evidence reference, and audit policy,
- must not be only a note.

Quote approval:

- belongs to quote workflow,
- may be customer-facing,
- must not imply settlement approval.

Settlement approval:

- belongs to internal billing/settlement/finance workflow,
- must not be performed by engineers,
- must not be exposed on customer-facing mobile display unless reduced to customer-safe billing wording.

Payment/invoice handoff:

- belongs to future billing/payment/invoice workflow,
- must not be created by fee display alone.

Fee dispute:

- may become a future billing/settlement review signal,
- may become a supervisor/customer callback signal,
- must not automatically alter settlement approval, payable amount, invoice, or payment status.

AI suggestion:

- must remain separate from official consent, quote, settlement, payment, and invoice records,
- may suggest wording or missing-consent reminders,
- must not approve, consent, invoice, settle, or collect payment.

## Interaction With Existing Platform Objects

### Case

Case is the service request context.

Fee display state may be associated with the Case in future design, but it must not close the Case, create payment, or approve settlement by itself.

### Appointment / Dispatch Visit

Appointment / dispatch visit is the field interaction layer.

Fee display, fee discussion, decline, dispute, or quote-needed facts may be recorded as visit-level context in future design.

### Field Service Report

Field Service Report remains the Case-level formal completion summary.

It may reference customer-visible fee confirmation or fee consent evidence in the future, but it must not replace structured customer fee consent, quote approval, or settlement approval.

### Customer Fee Consent

Customer fee consent is a future structured workflow and evidence record.

Engineer Mobile fee display may lead to consent capture, but display itself is not consent.

### Quote

Quote workflow handles formal quote draft, review, customer approval, rejection, expiration, and follow-up.

Quote required notice is not quote approval.

### Billing / Settlement

Billing/settlement workflow determines internal payable/receivable treatment.

Customer-visible fee display must not expose internal billing or settlement data.

### Photos / Attachments

Photos, signatures, and fee confirmation documents may support fee consent or dispute review in future workflows.

They remain governed by Task292 file visibility, storage, download/export, audit, and AI-analysis boundaries.

### Customer Signature

Customer signature may support future consent or confirmation workflows, but signature capture must be explicit, purpose-scoped, sensitive, auditable, and not treated as a general attachment.

### AI Suggestion Records

AI may draft customer-facing fee explanation, detect missing consent, or flag quote-needed cases.

AI suggestion records must not become official consent, quote approval, settlement approval, payment instruction, or invoice record without human/deterministic confirmation.

### Audit Log Future Layer

Future fee display, consent capture, quote approval, dispute, and payment/invoice handoff events should be auditable.

Audit log must not store complete phone numbers, complete addresses, tokens, secrets, raw LINE identifiers, raw provider payloads, signature raw data, or unnecessary customer private data.

## SaaS-ready / Security Considerations

Future fee display design must preserve:

- organization isolation,
- engineer-visible data boundary,
- Data Access Control authority,
- customer-visible vs internal-only policy,
- report/export/download permission separation,
- field-level masking readiness,
- audit readiness,
- usage tracking readiness,
- sensitive data safety,
- LINE / SMS / Email / APP channel abstraction,
- SaaS plan / entitlement boundary,
- Field Engineer Seat boundary,
- AI Add-on usage boundary,
- Enterprise SSO and organization membership boundary.

Plan entitlement may determine whether an organization can use advanced customer fee display, fee consent capture, quote approval, settlement review, payment/invoice handoff, or AI fee explanation features in the future.

Entitlement does not replace user permission, organization scope, customer-visible policy, audit, field-level masking, or usage tracking.

## Explicit Runtime Forbidden Confirmation

Task293 explicitly does not approve:

- Engineer Mobile runtime,
- mobile web runtime,
- customer fee consent runtime,
- quote runtime,
- settlement runtime,
- billing runtime,
- payment runtime,
- invoice runtime,
- AI approval runtime,
- AI consent runtime,
- AI summary runtime,
- API changes,
- Admin UI changes,
- DB schema changes,
- migration changes,
- permission runtime,
- entitlement runtime,
- usage runtime,
- seat billing runtime,
- report/export/download runtime,
- provider sending,
- LINE / SMS / Email / APP sending,
- photo/signature/file upload runtime,
- object/file storage runtime,
- file download runtime,
- smoke / fixture changes.

## Future Task Candidates

These are future candidates only and are not approved by Task293:

- customer fee consent data model design,
- customer fee display UX copy design,
- quote approval workflow design,
- fee dispute workflow design,
- floor/carrying/remote fee display policy,
- payment/invoice handoff design,
- AI fee explanation prompt safety design,
- fee consent evidence audit event catalog,
- customer-visible fee summary redaction policy,
- Engineer Mobile fee confirmation UI design.

## Conclusion

Task293 establishes docs-only customer fee confirmation display boundary guidance.

Customer fee display remains separate from formal customer fee consent, quote approval, settlement approval, billing, payment, invoice, and AI decision runtime.

No Engineer Mobile, fee consent, quote, settlement, billing, payment, invoice, AI approval/consent, API, Admin UI, DB, migration, permission, entitlement, usage, provider sending, report/export/download, file upload/storage/download, smoke, or inventory documentation change is approved by this task.
