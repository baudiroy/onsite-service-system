# Task 353 - Customer-facing Service Report Alignment Review / No Runtime Change

## Scope Summary

This document reviews the future boundary between the internal Field Service Report and a customer-facing service report.

Task353 is documentation-only. It does not modify `src/`, `admin/src/`, `scripts/smoke/`, migrations, schema, indexes, API contracts, package configuration, provider integrations, notification sending, AI / RAG runtime, billing, invoice, payment, customer-facing report runtime, survey, complaint, callback, inventory, parts, WMS, supervisor override, correction runtime, or any Field Service Report runtime.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task353 extends Task352's customer-visible appointment timeline policy and preserves the invariant:

- one Case = one formal Field Service Report,
- one Case can have multiple appointments / dispatch visits,
- multiple visits do not create multiple formal Field Service Reports.

## Internal Field Service Report Vs Customer-facing Service Report

The internal Field Service Report is the Case-level formal completion summary.

It can support:

- operational completion,
- engineer record,
- final appointment traceability,
- internal repair detail,
- billing and settlement review,
- evidence review,
- audit and downstream reporting.

The customer-facing service report is the customer-safe version of the completion result.

It must be filtered through customer visible data policy and data minimization rules.

The customer-facing service report is not a raw dump of the internal Field Service Report.

Multiple appointments / dispatch visits should appear, if needed, as a customer-safe service history summary. They should not imply multiple formal Field Service Reports for the same Case.

## Suggested Customer-visible Content

These are future policy suggestions only. Task353 does not implement schema, API, UI, report generation, or delivery logic.

Potential customer-visible content:

- customer-safe Case reference,
- service date,
- completed appointment display window,
- customer-safe issue summary,
- customer-safe repair action summary,
- high-level service result,
- customer-visible parts or service item summary,
- engineer arrival / completion high-level status, if approved,
- customer signature status, if customer-safe,
- signature exception summary, if customer-safe,
- confirmed customer charge summary, if applicable,
- customer approval summary, if applicable,
- invoice / receipt status, if applicable,
- contact support entrypoint,
- report unresolved issue entrypoint,
- optional satisfaction survey entrypoint after completion.

Customer-visible parts or service item content must avoid exposing internal cost, warehouse stock, inventory movement, supplier pricing, settlement rules, or reconciliation logic.

## Must-not-display Content

The customer-facing service report must not display:

- internal notes,
- audit log entries,
- raw AI payload,
- AI prompts,
- raw model output,
- engineer internal comments,
- supervisor review notes,
- override notes,
- billing internal rules,
- settlement internal rules,
- vendor reconciliation data,
- brand reconciliation data,
- internal cost,
- margin,
- payout,
- inventory internal data,
- warehouse data,
- stock movement internal data,
- raw LINE user IDs,
- internal customer channel identifiers,
- full customer phone numbers unless explicitly necessary for that customer-facing flow,
- full customer addresses unless explicitly necessary for that customer-facing flow,
- sensitive provider payloads,
- internal complaint classification not meant for customer display,
- database IDs that are not customer-safe,
- organization-internal IDs that are not customer-safe,
- internal permission or entitlement details,
- raw webhook payloads.

Internal visibility does not imply customer visibility.

## Signature And Exception Boundary

Customer signature is important service completion evidence, but it is not an absolute condition for every completion.

Standard flow may link signature evidence to:

- Case,
- `finalAppointmentId`,
- internal Field Service Report,
- customer-facing service report display status, if appropriate.

Future signature exception scenarios may include:

- customer not present,
- representative signature,
- refusal to sign,
- remote completion,
- site unattended,
- business-approved exception.

Internal records should capture exception reason, supporting evidence, engineer note, contact log, representative details if applicable, review status if applicable, and audit log.

Customer-facing service reports should only display customer-safe wording. They should not expose supervisor review details, internal dispute handling, internal audit events, or staff-performance notes.

## Fee / Charge Boundary

If completion involves customer fees, the customer-facing service report should only show customer-relevant and confirmed fee information.

Potential customer-visible fee content:

- confirmed charge item,
- amount charged to the customer,
- customer approval status,
- approval channel summary,
- approval time,
- payment status,
- invoice / receipt status,
- invoice / receipt access link if applicable.

The customer-facing service report must not display:

- internal settlement amount,
- supplier payout,
- engineer cost,
- internal cost,
- margin,
- vendor reconciliation rules,
- brand reconciliation rules,
- rule version internals,
- AI parsing draft,
- internal finance review notes.

AI may help draft a customer-safe fee summary or flag missing approval records, but AI must not:

- approve customer fees,
- approve settlement,
- issue an invoice,
- decide payment status,
- modify formal charge records,
- modify formal billing / settlement outcomes.

## Issue Report / Complaint Boundary

The customer-facing service report should provide an entrypoint for unresolved issues.

Examples:

- `I still have a problem`,
- `The issue was not resolved`,
- `I need customer support`,
- `I want to report a service issue`.

If the customer reports an unresolved issue, low rating, negative feedback, complaint, or callback request, future runtime should create follow-up / escalation records according to an approved workflow.

AI may assist with summary, classification, and risk flagging.

AI must not:

- hide negative feedback,
- hide complaints,
- automatically close complaints,
- modify satisfaction ratings,
- decide that no human follow-up is needed for high-risk complaints,
- publish internal complaint classification to the customer.

The customer-facing service report must not reveal internal complaint categorization, liability opinions, supervisor review content, or responsibility assignment before approved customer-safe communication.

## Channel / Identity / Access Boundary

Customer-facing service reports may be accessed through:

- LINE,
- Web link,
- Web portal,
- future mobile App,
- SMS-directed link,
- Email link, if approved,
- customer service assisted resend.

The design must be channel-agnostic.

LINE may be the current primary customer channel, but the report policy must not hard-code LINE as the only route.

Identity and access principles:

- `line_user_id` is not a global identity,
- customer channel identity must be scoped by organization and channel,
- report access must verify the customer or use an approved safe access method,
- safe deny and enumeration protection must prevent leaking whether a Case, customer, phone number, or LINE binding exists,
- no report access path may bypass organization scope,
- no report access path may expose another customer's Case.

Report links should consider expiration, revocation, authentication, download limits, and access logs when future runtime is designed.

## AI Boundary

AI may assist with converting internal completion details into customer-safe wording drafts.

AI can help draft:

- issue summary,
- repair action summary,
- service result summary,
- parts/service item customer-safe wording,
- follow-up suggestion draft,
- customer-safe support handoff summary.

AI must not:

- automatically publish the customer-facing service report,
- treat uncertain content as formal fact,
- expose internal notes,
- expose audit logs,
- expose raw AI payload,
- expose billing / settlement internal data,
- expose raw customer channel identifiers,
- bypass permission or customer visible data policy,
- cross organization or tenant boundaries.

Any AI context must be:

- minimum necessary,
- masked / redacted,
- permission-aware,
- tenant-isolated,
- auditable,
- human-controlled before official customer-facing publication when risk is non-trivial.

## Alignment With Appointment Timeline

The customer-visible appointment timeline and the customer-facing service report should align.

Timeline purpose:

- show service progress,
- show appointment / follow-up status,
- guide the customer to the next safe action.

Customer-facing report purpose:

- summarize completed service,
- provide customer-safe repair result,
- show relevant confirmed charges / invoice state if applicable,
- provide issue reporting and survey entrypoints.

Neither surface should expose internal operational, financial, AI, audit, or staff-management data.

## Future Task Candidates

These are future tasks only and must not be implemented as part of Task353.

### Customer-facing Service Report API Contract

Design a customer-safe response shape that does not expose the raw internal Field Service Report.

### Customer-facing Report Projection Service

Design a backend projection service that converts internal report data into a customer-safe report model.

### Customer-facing Report Wording / Localization Policy

Define approved wording, localization keys, tone, empty states, and exception wording.

### Signature Exception Customer-safe Display Policy

Define how standard signatures, representative signatures, refusal, remote completion, and no-signature exceptions should appear to customers.

### Fee / Invoice Display Policy Review

Define which charge, approval, invoice, and receipt fields can be shown to customers.

### Complaint / Unresolved Issue Follow-up Workflow Review

Define follow-up / escalation records, ownership, SLA, and customer communication rules for unresolved issues and complaints.

### Timeline And Customer-facing Report Access-control Test Plan

Define safe-deny, enumeration protection, organization isolation, customer identity, and channel access tests.

## Non-goals

Task353 does not:

- implement a customer-facing report API,
- implement a customer-facing report UI,
- implement a projection service,
- modify Admin frontend,
- modify backend runtime,
- modify smoke tests,
- add a migration,
- add a schema or index change,
- add LINE / SMS / Email / App runtime,
- add AI / RAG runtime,
- add notification sending,
- add survey runtime,
- add complaint / callback runtime,
- change Field Service Report completion,
- change `finalAppointmentId` inference,
- change Case status workflow,
- add billing / settlement behavior,
- add invoice / payment behavior,
- add inventory / parts / WMS behavior.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No customer-facing report table or projection table is added by Task353.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke file change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, or production data details.

Future customer-facing report implementation must continue to redact sensitive values and avoid exposing internal operational, customer, provider, AI, audit, billing, settlement, inventory, or staff-management data.
