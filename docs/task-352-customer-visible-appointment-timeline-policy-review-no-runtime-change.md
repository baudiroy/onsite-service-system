# Task 352 - Customer-visible Appointment Timeline Policy Review / No Runtime Change

## Scope Summary

This document reviews the future customer-visible appointment timeline policy boundary.

Task352 is documentation-only. It does not modify `src/`, `admin/src/`, `scripts/smoke/`, migrations, schema, indexes, API contracts, package configuration, provider integrations, notification sending, AI / RAG runtime, billing, customer-facing report runtime, survey, complaint, callback, inventory, parts, WMS, supervisor override, correction runtime, or any appointment timeline runtime.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

This document extends the boundary that Appointment / Dispatch Visit records are field process records, while Field Service Report remains the Case-level formal completion summary.

## Customer-visible Timeline Purpose

The customer-visible appointment timeline should help customers understand the service progress without exposing internal operations.

Future customer-facing timeline surfaces may support:

- LINE,
- Web link,
- Web portal,
- future mobile App,
- SMS-directed landing pages.

The timeline should be channel-agnostic. LINE may be the current primary customer channel, but the policy must not hard-code LINE as the only customer entry point.

The customer-visible timeline should help customers answer:

- What is the current service status?
- Has an appointment been confirmed?
- What is the confirmed service time window?
- Is the appointment waiting for customer confirmation?
- Was a reschedule requested?
- Is the service waiting for parts or another follow-up?
- Has the service been completed?
- Where can the customer view the customer-facing service report?
- How can the customer contact support or report an issue?
- Where can the customer complete a satisfaction survey after service completion?

The customer-visible timeline is a projection for customer understanding. It does not replace the internal appointment record, dispatch visit record, Field Service Report, audit log, contact history, billing records, or settlement records.

## Suggested Customer-visible Fields

These are future policy suggestions only. Task352 does not implement schema, API, UI, or delivery logic.

Potential customer-visible timeline fields:

- customer-safe Case display reference or masked case identifier,
- customer-safe appointment display status,
- confirmed scheduled service window,
- pending customer confirmation status,
- reschedule requested status,
- waiting-for-parts status,
- waiting-for-quote status, if customer-facing wording is approved,
- customer-not-home or missed visit status, using neutral wording,
- high-level engineer arrival status, if approved,
- high-level service finished status,
- customer-facing service report link after completion,
- contact support entrypoint,
- report issue entrypoint,
- optional satisfaction survey entrypoint after completion.

Display content must pass customer visible data policy.

Personal data should be minimized, masked, or omitted unless the specific customer-facing screen requires it for the customer's own service context.

The timeline should not display internal data sources, AI confidence scores, raw AI output, audit details, internal scoring, or internal workflow reasoning.

## Must-not-display Fields

The customer-visible appointment timeline must not display:

- internal notes,
- audit log entries,
- raw AI payload,
- AI prompts,
- raw model output,
- dispatch scoring,
- engineer ranking,
- internal route optimization details,
- engineer internal comments,
- supervisor review notes,
- override notes,
- billing internal rules,
- settlement internal rules,
- vendor reconciliation details,
- brand reconciliation details,
- raw LINE user IDs,
- channel identity internal identifiers,
- full customer phone numbers unless explicitly necessary for that customer-facing flow,
- full customer addresses unless explicitly necessary for that customer-facing flow,
- sensitive provider payloads,
- internal complaint classification not meant for customer display,
- database IDs that are not customer-safe,
- organization-internal IDs that are not customer-safe,
- internal permission or entitlement details,
- raw webhook payloads.

Being visible to an internal operator does not mean the same field is safe for customer display.

## Appointment / Field Service Report Boundary

The appointment timeline is a customer-facing projection, not the source of truth.

Appointment / dispatch visit records remain internal field process records for:

- scheduling,
- rescheduling,
- cancellation,
- customer-not-home,
- pending parts,
- pending quote,
- unable to repair,
- final completed visit.

The Field Service Report remains the Case-level formal completion summary.

The customer-facing service report is a filtered customer-safe report derived from approved service completion data. It is not a raw copy of the internal Field Service Report.

Current invariant remains:

- one Case = one formal Field Service Report,
- one Case can have multiple appointments / dispatch visits,
- multiple visits do not create multiple formal Field Service Reports,
- pending parts, cancellation, no-show, unable-to-repair, and follow-up visits are recorded at the appointment / visit layer,
- customer-facing timeline display must not imply there are multiple formal reports for the same Case.

## Channel And Identity Boundary

The timeline policy must be channel-agnostic.

Future timeline access may occur through:

- LINE,
- SMS-directed Web link,
- Web portal,
- future mobile App,
- email link, if approved,
- customer service assisted view.

Customer identity rules:

- `line_user_id` is not a global identity,
- customer channel identity must be scoped by organization and channel,
- a customer should only see Cases and appointments they are authorized to access,
- timeline lookup must use verification, consent, or an approved safe access mechanism,
- safe deny and enumeration protection must prevent leaking whether a Case, phone number, customer, or LINE binding exists,
- no channel may bypass organization scope or customer visible data policy.

The same customer-visible policy should apply across channels. A customer should not see more internal information merely because they use one channel instead of another.

## AI Boundary

AI may assist with customer-safe wording, but it must not become the publisher of the customer-visible timeline.

AI may help draft:

- neutral status wording,
- appointment history summaries,
- customer-safe explanation of pending parts or follow-up needs,
- support handoff summaries,
- issue-report triage summaries for internal review.

AI must not:

- automatically publish customer-visible timeline updates,
- hide negative feedback,
- hide complaints,
- hide disputes,
- suppress unresolved issues,
- treat uncertain content as formal fact,
- expose internal notes,
- expose raw AI payload,
- expose audit details,
- expose billing / settlement internal data,
- cross organization or tenant boundaries,
- bypass permissions or customer visible data policy.

Any AI context used for customer-safe wording must be:

- minimum necessary,
- masked / redacted,
- permission-aware,
- tenant-isolated,
- auditable,
- human-controlled before official customer-facing publication when risk is non-trivial.

## Data Minimization And Safe Wording

Customer-facing timeline wording should be simple and operationally useful.

Examples of safer wording:

- `Appointment confirmed`
- `Waiting for your confirmation`
- `Reschedule requested`
- `Waiting for parts`
- `Service completed`
- `Please contact support`

Avoid exposing internal reason codes directly when they carry operational, financial, dispute, or staff-performance meaning.

For example, customer-facing wording should not reveal internal route scoring, engineer performance notes, settlement issues, audit disputes, or AI risk labels.

## Notification / Access Boundary

Displaying a timeline and sending a notification are related but separate responsibilities.

Timeline access policy should not automatically imply:

- LINE push permission,
- SMS sending permission,
- App push permission,
- email sending permission,
- reminder scheduling,
- resend behavior.

Notification delivery requires separate channel consent, delivery policy, provider configuration, audit, retry, and usage metering design.

## Future Task Candidates

These are future tasks only and must not be implemented as part of Task352.

### Customer-visible Appointment Timeline API Contract

Design a customer-facing API response that exposes only customer-safe timeline fields and avoids raw internal appointment rows.

### Customer-visible Timeline Data Projection Service

Design a service that projects internal appointment / dispatch visit history into a customer-safe timeline model.

### Customer-visible Wording / Localization Policy

Define approved wording, localization keys, tone, empty states, and exception wording.

### Timeline Access Control / Safe-deny Test Plan

Define tests for customer timeline access, safe-deny behavior, enumeration protection, and cross-organization isolation.

### Timeline Channel Delivery Policy

Define how timeline links or notifications behave across LINE, Web, App, SMS, and Email.

### Customer-facing Service Report Alignment Review

Ensure customer-visible timeline, customer-facing service report, satisfaction survey, and issue reporting share a consistent customer-visible data policy.

## Non-goals

Task352 does not:

- implement a customer timeline API,
- implement a customer timeline UI,
- implement a projection service,
- modify Admin frontend,
- modify backend runtime,
- modify smoke tests,
- add a migration,
- add a schema or index change,
- add LINE / SMS / Email / App runtime,
- add AI / RAG runtime,
- add notification sending,
- add customer-facing report runtime,
- add survey runtime,
- add complaint / callback runtime,
- change Field Service Report completion,
- change `finalAppointmentId` inference,
- change Case status workflow,
- change appointment status values,
- change visit result values,
- add billing / settlement behavior,
- add inventory / parts / WMS behavior.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No customer timeline table or projection table is added by Task352.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke file change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, or production data details.

Future timeline implementation must continue to redact sensitive values and avoid exposing internal operational, customer, provider, AI, audit, billing, or settlement data.
