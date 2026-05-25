# Task 294 - Engineer Mobile AI-assisted Completion Summary Boundary / No Runtime Change

## Scope And Non-goals

This document continues the Engineer Mobile / Field UX docs-only branch after Task289 through Task293.

Task294 defines future-only boundaries for AI-assisted completion summaries in Engineer Mobile and field-service workflows.

The goal is to separate engineer-provided field facts, AI drafts, human review/edit, customer-visible summary drafts, internal structured summary drafts, official Field Service Report content, AI suggestion records, and AI raw sensitive payloads.

Task294 is documentation-only.

This task is not:

- AI summary runtime,
- AI provider integration,
- AI suggestion runtime,
- AI official-record write runtime,
- Engineer Mobile App runtime,
- mobile web runtime,
- completion runtime change,
- Field Service Report runtime change,
- finalAppointmentId runtime change,
- file/image analysis runtime,
- customer fee consent runtime,
- quote runtime,
- billing runtime,
- settlement runtime,
- permission runtime,
- entitlement runtime,
- usage metering runtime,
- API contract,
- Admin UI,
- backend service change,
- DB schema / migration proposal,
- smoke / test implementation.

Task294 does not add tables, migrations, schema, indexes, backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, smoke scripts, fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, AI provider calls, AI prompts, RAG retrieval, official-record writes, completion logic, finalAppointmentId logic, or inventory documentation changes.

## Why AI-assisted Completion Summary Boundaries Are Needed After Task293

Task293 clarified that customer fee confirmation display is not customer fee consent, quote approval, settlement approval, payment, or invoice handoff.

The next risk is treating AI-assisted completion wording as official field facts or formal Field Service Report content.

Engineer Mobile should let engineers submit simple field facts. AI may help organize, summarize, classify, and remind missing items. However, AI must not invent field facts, submit completion, change Case/Appointment/Report status, determine finalAppointmentId, approve customer consent, or write official records by itself.

Task294 defines the boundary before any AI-assisted completion summary runtime is approved.

## Definitions

### AI-assisted Completion Summary

AI-assisted completion summary is a future draft generated from authorized engineer input, allowed appointment / visit context, allowed file metadata, and other scoped platform context.

It may help structure text, improve clarity, classify candidate outcomes, or prepare a customer-visible draft after review.

### Engineer-provided Field Facts

Engineer-provided field facts are facts explicitly entered, selected, uploaded, or confirmed by the assigned engineer or another authorized field actor.

Examples include service result selection, short completion note, parts/serial information, visit outcome, photo evidence reference, customer signature reference, and fee/quote field facts.

### AI Draft

AI draft is generated text, classification, summary, warning, or proposed structure.

AI draft is not official fact and is not official Field Service Report content until accepted through a future approved human/deterministic workflow.

### Customer-visible Summary Draft

Customer-visible summary draft is a proposed customer-facing explanation of the service result.

It must be filtered by customer-visible data policy and must not include internal notes, settlement internals, AI raw payloads, unauthorized evidence, or sensitive operational details.

### Internal Structured Summary Draft

Internal structured summary draft is a proposed internal summary or structured field candidate for authorized internal use.

It may include more operational context than a customer-visible draft, but it must still follow organization scope, permission, masking, and human review rules.

### Human Review / Edit

Human review/edit means an authorized engineer, supervisor, admin, billing reviewer, or other role reviews, edits, accepts, rejects, or escalates an AI draft according to future permission and workflow policy.

Human review does not automatically mean official record write unless a future deterministic workflow explicitly defines it.

### Official Field Service Report Content

Official Field Service Report content is the final accepted Case-level completion summary and formal report content.

It must remain one formal report per Case and must not be written directly by AI.

### AI Suggestion Record

AI suggestion record is a future auditable record of AI output, source context summary, user action, review state, and adoption/rejection/editing status.

It is not an official record by itself.

### AI Raw Sensitive Payload

AI raw sensitive payload is any raw prompt, raw context, raw provider response, retrieved raw content, full file/image content, or intermediate payload that may contain sensitive data.

It must not be customer-visible and must not be copied into official records.

## Boundary Principles

- AI may organize, summarize, classify, and remind missing items.
- AI must not produce unsupported field facts that were not entered by an engineer or supported by authorized evidence.
- AI draft is not a formal Field Service Report.
- AI draft is not engineer-submitted fact.
- AI must not automatically submit completion.
- AI must not automatically modify Case status.
- AI must not automatically modify Appointment status.
- AI must not automatically modify Field Service Report status or content.
- AI must not automatically determine `finalAppointmentId`.
- AI must not represent customer fee consent.
- AI must not represent customer signature.
- AI must not approve quote.
- AI must not approve settlement.
- AI must not approve payment or invoice handoff.
- AI raw payload must not enter customer-visible data.
- AI raw payload must not enter official record.
- AI suggestion and official record must remain separated.
- Customer-visible summary and internal note must remain separated.
- Uncertain content must remain a suggestion and must not be written as fact.
- Data Access Control remains authoritative for AI context and output visibility.

## Future-only AI Summary Matrix

This matrix is future-only guidance. It does not approve runtime, schema, API, mobile UI, AI provider integration, official-record write, completion logic, or report logic.

| AI summary item | Source input | Output type | Customer-visible eligible? | Internal-only? | Requires engineer review? | Requires supervisor/admin review? | May write official record directly? | May update Case status? | May update Appointment status? | May determine finalAppointmentId? | May AI decide? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Diagnosis summary draft | Engineer note, outcome, allowed evidence metadata. | Draft text | Maybe, after review and filtering. | Maybe | Yes | Maybe | No | No | No | No | No | No |
| Work performed summary draft | Engineer field facts, parts/serial inputs, allowed context. | Draft text | Maybe, after review and filtering. | Maybe | Yes | Maybe | No | No | No | No | No | No |
| Customer-visible service result draft | Reviewed field facts and safe customer-visible context. | Customer-facing draft | Yes, after review. | No by design. | Yes | Maybe | No | No | No | No | No | No |
| Internal technician note cleanup | Engineer note. | Internal draft cleanup | No by default. | Yes | Yes | Maybe | No | No | No | No | No | No |
| Abnormal outcome classification suggestion | Engineer selected outcome, short note, appointment context. | Classification suggestion | No by default. | Yes | Yes | Maybe | No | No | No | No | No | No |
| Missing required field reminder | Current draft data and checklist policy. | Reminder | No by default. | Maybe | Yes | No by default. | No | No | No | No | No | No |
| Photo / attachment evidence reference suggestion | File metadata only, not raw unauthorized file. | Evidence reference suggestion | No by default. | Yes | Yes | Maybe | No | No | No | No | No | No |
| Customer fee display wording suggestion | Approved fee categories and safe display context. | Wording draft | Maybe, after review. | Maybe | Yes | Maybe | No | No | No | No | No | No |
| Follow-up / second visit suggestion | Visit outcome, parts/quote/follow-up context. | Next-action suggestion | No by default. | Yes | Yes | Maybe | No | No | No | No | No | No |
| Quote-needed wording suggestion | Quote-required field facts and policy context. | Wording draft | Maybe, after review. | Maybe | Yes | Maybe | No | No | No | No | No | No |
| Safety issue wording suggestion | Engineer safety note and allowed policy context. | Internal/customer-safe draft | Maybe, only after review. | Maybe | Yes | Yes | No | No | No | No | No | No |
| Field Service Report summary draft | Reviewed engineer facts, allowed case/visit context, accepted structured data. | Formal report draft candidate | Maybe, after approval and filtering. | Maybe | Yes | Maybe | No | No | No | No | No | No |

## Human Review Rules

- AI draft must be reviewed, edited, accepted, rejected, or escalated by an authorized human before it can affect any official workflow.
- Engineer field facts, customer-visible summary, internal note, and supervisor review must remain distinct.
- A customer-visible summary draft must be reviewed against customer-visible data policy.
- Internal structured summary draft must be reviewed against internal data policy and role permission.
- Uncertain content must remain a suggestion.
- AI suggestion adoption, rejection, and editing need future audit readiness.
- Human edits must be distinguishable from original AI draft.
- Acceptance of an AI draft must not automatically write official records unless a future deterministic workflow explicitly allows it.
- AI draft cannot replace engineer confirmation, customer consent, customer signature, quote approval, settlement approval, or finalAppointmentId inference.

## Data Minimization / AI Safety Rules

External AI provider context must be:

- minimum necessary,
- organization-scoped,
- permission-aware,
- feature-entitlement-aware,
- customer-visible/internal-policy-aware,
- masked/redacted where needed,
- auditable,
- usage-trackable where applicable.

Do not send external AI provider:

- tokens,
- secrets,
- complete phone numbers,
- complete addresses,
- LINE access tokens,
- LINE channel secrets,
- raw LINE identifiers,
- raw provider payloads,
- signature raw data,
- unmasked photos,
- full audit log text,
- full internal note text,
- full billing internal data,
- full settlement internal data,
- cross-organization data,
- unauthorized attachments,
- customer private data not needed for the task.

High-sensitivity tasks should preserve future options for:

- private AI,
- dedicated environment,
- local model,
- hybrid AI architecture.

AI quality, convenience, or automation value must not override data protection.

## Interaction With Existing Platform Objects

### Case

Case remains the service request context.

AI completion summary draft may use allowed Case context, but AI must not change Case status or write Case official data by itself.

### Appointment / Dispatch Visit

Appointment / dispatch visit holds visit-level field facts and outcomes.

AI may summarize visit-level facts but must not change appointment status, visit result, or final appointment candidate by itself.

### Field Service Report

Field Service Report remains the one formal Case-level completion report.

AI may draft candidate wording, but official report content requires future human/deterministic confirmation.

### Photos / Attachments

AI may reference authorized metadata or masked/minimized derivatives in future design.

AI must not receive raw unauthorized photos, signatures, or attachments by default.

### Customer Signature

AI must not forge, interpret as consent, or replace customer signature.

Signature remains sensitive evidence governed by Task292 boundaries.

### Customer Fee Consent

AI may suggest wording or missing-consent reminders, but it cannot represent customer consent.

Formal consent must remain separate and future controlled.

### Quote

AI may draft quote-needed explanation, but cannot approve quote or convert quote-required state into approval.

### Billing / Settlement

AI may flag missing evidence or suggest review, but cannot approve settlement, decide payable amount, or expose internal settlement data to customer-visible summary.

### AI Suggestion Records

Future AI suggestion records should capture the suggestion lifecycle and review outcome.

They must not become official records automatically and must not store unnecessary raw sensitive payloads.

### Audit Log Future Layer

Future audit should be ready to record AI suggestion generated, reviewed, accepted, rejected, edited, escalated, or written to official record through an approved workflow.

Audit log must not store complete phone numbers, complete addresses, tokens, secrets, raw LINE identifiers, raw provider payloads, signature raw data, unmasked photos, or unnecessary AI raw sensitive payload.

## SaaS-ready / Security Considerations

Future AI-assisted completion summary design must preserve:

- organization isolation,
- engineer-visible data boundary,
- Data Access Control authority,
- AI Add-on usage tracking readiness,
- field-level masking readiness,
- audit readiness,
- human-controlled official record boundary,
- role permission,
- feature entitlement,
- customer-visible vs internal-only policy,
- Field Engineer Seat boundary,
- Enterprise SSO and organization membership boundary,
- Cloud AI / external AI provider data protection,
- private/dedicated/local/hybrid AI option readiness for high-sensitivity customers.

AI Add-on entitlement does not replace user permission, organization scope, Data Access Control, masking, human review, official-record separation, or audit.

## Explicit Runtime Forbidden Confirmation

Task294 explicitly does not approve:

- AI summary runtime,
- AI provider integration,
- AI suggestion runtime,
- AI official-record write runtime,
- Engineer Mobile runtime,
- mobile web runtime,
- completion runtime change,
- Field Service Report runtime change,
- finalAppointmentId runtime change,
- file/image analysis runtime,
- customer fee consent runtime,
- quote runtime,
- billing runtime,
- settlement runtime,
- payment runtime,
- invoice runtime,
- API changes,
- Admin UI changes,
- DB schema changes,
- migration changes,
- permission runtime,
- entitlement runtime,
- usage runtime,
- seat billing runtime,
- notification/provider sending,
- LINE / SMS / Email / APP sending,
- report/export/download runtime,
- smoke / fixture changes.

## Future Task Candidates

These are future candidates only and are not approved by Task294:

- AI-assisted completion summary UX design,
- AI suggestion lifecycle data model design,
- AI draft human review API contract,
- customer-visible completion summary redaction policy,
- internal structured summary schema design,
- Engineer Mobile AI reminder UX design,
- AI provider prompt safety design,
- AI completion summary no-send/no-write test plan,
- AI suggestion audit event catalog,
- official Field Service Report adoption workflow design.

## Conclusion

Task294 establishes docs-only AI-assisted completion summary boundary guidance.

AI may assist with summaries, classification, wording, and reminders in future design, but AI draft is not engineer fact, not official Field Service Report content, not customer consent, not signature, not quote approval, not settlement approval, not payment/invoice handoff, and not finalAppointmentId inference.

No AI summary, AI provider integration, Engineer Mobile, completion, Field Service Report, finalAppointmentId, file/image analysis, customer fee consent, quote, settlement, billing, payment, invoice, API, Admin UI, DB, migration, permission, entitlement, usage, provider sending, report/export/download, smoke, or inventory documentation change is approved by this task.
