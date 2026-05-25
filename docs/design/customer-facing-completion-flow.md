# Customer-facing Completion Flow

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Positioning

Customer-facing completion flow must distinguish internal Field Service Report from customer-facing service report.

Field Service Report is the internal formal completion report for operations, settlement, reconciliation, engineer record, and internal traceability.

Customer-facing service report is the customer-visible service result summary. It must follow customer visible data policy and must not expose internal report details wholesale.

## Customer Signature

Customer signature is important service-completion evidence, but it must not be an absolute requirement for every completion.

Standard signature evidence may link to:

- case_id
- finalAppointmentId
- field_service_report_id
- customer-facing service report, when applicable

If signature is already collected on site, LINE / App / Web completion flow should not always require the customer to reconfirm completion. Post-completion customer flow should focus on viewing report, reporting problems, contacting support, and answering satisfaction survey.

## Signature Exceptions

The system should support:

- customer not on site
- family / building manager / representative signature
- customer refuses to sign
- remote completion
- customer is in a hurry or cannot sign
- unattended equipment site
- other business-approved exception

Missing or non-standard signature should record exception reason, supporting evidence, engineer note, photos when applicable, contact log, representative info when applicable, review status when applicable, and audit log.

No signature should not automatically block every completion, but it must leave structured exception evidence.

## Customer-facing Service Report

May include:

- case number
- service date
- service item
- product type / model
- fault summary
- engineer result summary
- parts replaced summary
- serial information when appropriate
- completion photos when appropriate
- signature / representative / no-signature summary
- confirmed customer fee items
- warranty or notes
- support contact

Must not include:

- internal note
- audit log
- AI raw payload
- AI risk flag
- billing internal data
- settlement internal data
- engineer internal comments
- supervisor review
- vendor reconciliation rules
- internal cost
- unauthorized data

## Customer Fee / Invoice / Receipt

Customer-facing fee information should show only customer-relevant and confirmed charge / approval / invoice data. It must not show internal settlement price, vendor reimbursement, engineer cost, brand reconciliation rule, internal discount reason, or settlement internal data.

Customer fees should not live only in notes. Fee, approval, quote, charge, invoice, and receipt information should become formal records in future implementation.

AI may summarize fees or detect missing approval, but must not approve fees, issue invoices, or modify formal charging or settlement results.

## Problem Reporting

After completion, customers should have a problem-reporting path such as:

- I have a problem
- issue not resolved
- need customer service contact

Problem reports should create follow-up task, escalation when needed, customer service review, supervisor visibility when needed, and possible re-dispatch evaluation.

AI may summarize and classify; AI must not hide problems, close complaints, or decide no handling is needed.

## Satisfaction Survey

Survey should be sent only after Field Service Report completion, finalAppointmentId resolution, and customer-facing report availability/sending when applicable.

Multi-visit cases should normally survey the final completed appointment context, not every visit.

Low score, negative feedback, complaint keyword, or callback request should create follow-up / escalation.

## Versioning / Access / Download

Customer-facing service report changes should be versioned. Track version, updated time, updater, change reason, previous version, and audit log.

Report access and download should track notification sent, opened/clicked state when available, report viewed, report downloaded, survey sent/completed, and problem report created.

Avoid permanent public links. Use expiry, verification, revocation, download/access log, and customer visible data policy.

## Channel Strategy

Customer completion flow may use App push, LINE, SMS-to-Web link, Email, and human resend. LINE / App can be interactive notification channels; SMS is mainly reminder and routing; Web link is an entry point, not a push channel.

## Future Tasks

- customer-facing report DTO
- signature exception model
- access/download log
- report versioning
- issue report follow-up
- survey integration
- customer-visible fee/invoice projection
