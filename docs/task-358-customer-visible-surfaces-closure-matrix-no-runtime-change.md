# Task 358 - Customer-visible Surfaces Closure Matrix / No Runtime Change

## Scope Summary

This document closes the Task352-357 customer-visible surfaces design sequence.

Task358 is documentation-only. It does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, migrations, schema, indexes, API contracts, package configuration, provider integrations, notification sending, AI / RAG runtime, billing, invoice, payment, customer-facing report runtime, timeline runtime, survey, complaint, callback, inventory, parts, WMS, supervisor override, correction runtime, or access-control runtime.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task358 consolidates:

- Task352 customer-visible appointment timeline policy,
- Task353 customer-facing service report alignment review,
- Task354 timeline and customer-facing report access-control test plan,
- Task355 customer-visible safe-deny message key design,
- Task356 multi-channel customer wording review,
- Task357 customer-visible localization key catalog proposal.

Task358 does not implement timeline, report, safe-deny, localization, access-control, notification, provider, or customer-channel runtime.

## Customer-visible Surface Matrix

| Surface | Purpose | Customer-visible allowed content | Must-not-display content | Required access / verification boundary | Channel considerations | AI boundary | Related prior task | Future implementation dependency |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Customer-visible appointment timeline | Help customers understand service progress and next steps. | Customer-safe status, confirmed appointment window, waiting confirmation, reschedule needed, pending parts, report link, support action. | Internal notes, audit log, dispatch scoring, engineer ranking, route optimization, internal IDs, AI raw payload, billing internals. | Verification, consent, safe access token, or approved customer identity mechanism; safe-deny for wrong customer/org/link. | Must support LINE, Web, App, SMS-directed links without hard-coding LINE. | AI may draft customer-safe wording only; cannot auto-publish or expose internal state. | Task352 | Timeline API contract, projection service, access-control tests. |
| Customer-facing service report | Provide a customer-safe summary of completed service. | Service date, issue summary, repair summary, customer-visible parts/service items, signature status, confirmed customer charge/invoice info, issue/survey entrypoints. | Raw internal Field Service Report, engineer internal notes, supervisor notes, audit log, settlement rules, internal cost, inventory internals, raw AI payload. | Must verify customer access and project only customer-visible fields. | Can be accessed through LINE/Web/App/SMS-directed link/Email if approved. | AI may convert internal drafts into customer-safe wording drafts, but human/product gate is required. | Task353 | Report API contract, projection service, fee/signature display policy. |
| Completion report link | Let customer open the customer-facing service report. | Generic title, safe report access prompt, verification prompt if needed. | Raw token details, report existence details before verification, internal report ID, finalAppointmentId. | Links must expire or require verification where appropriate; revoked/expired/wrong access uses safe-deny. | SMS and Email should direct to verified landing page; LINE/App can deep-link if identity is scoped. | AI should not generate link state messages from raw denial reasons. | Task354, Task355 | Link lifecycle policy, safe-deny helper, access-control tests. |
| Report issue / unresolved issue entrypoint | Let customers report unresolved problems or request support. | Customer-safe issue entrypoint, issue received acknowledgement, support follow-up notice. | Internal complaint classification, liability analysis, supervisor notes, escalation level, staff notes. | Only authorized customers can create issue reports for their own Case/report. | Should work across Web/App/LINE; SMS can direct to a verified page. | AI may summarize issue internally; cannot hide complaint or auto-close. | Task353, Task354, Task357 | Issue workflow API, follow-up ownership, complaint escalation policy. |
| Satisfaction survey entrypoint | Collect post-completion feedback. | Survey CTA, thank-you message, unavailable message. | Survey suppression reason, score routing, internal complaint risk label, raw survey eligibility details. | Survey link/access must not reveal report/Case/customer existence to unauthorized users. | Channel-agnostic; LINE/App/Web can host survey, SMS/Email can direct to a verified page. | AI may summarize results internally; cannot hide low scores or alter ratings. | Task354, Task355, Task357 | Survey API, response intake, safe-deny tests, follow-up workflow. |
| Safe-deny response | Prevent resource enumeration and sensitive state disclosure. | Generic unavailable, verification required, link unavailable, action unavailable, try again/contact support. | Case existence, customer match, organization existence, LINE binding state, token state, internal reason. | Default to non-enumerating response for wrong customer/org/link/unverified/missing consent. | Same protection across LINE, Web, App, SMS, Email. | AI cannot generate deny wording from raw denial context or publish policy. | Task355, Task356 | Safe-deny response helper, message keys, API mapping, tests. |
| Multi-channel customer wording | Keep wording safe and consistent across channels. | Channel-fit wording for timeline, report, issue, survey, verification, and safe-deny. | Raw LINE ID, provider ID, internal DB/org ID, full phone/address unless necessary, internal status, AI drafts. | Wording must not reveal access-control decision details. | LINE concise; Web clearer; App structured; SMS minimal; Email formal and safe. | AI may draft variants but human/product review required. | Task356 | Product copy review, localization files, channel delivery policy. |
| Localization key catalog | Provide future naming boundaries for customer-visible text. | Proposal-only key families such as `customerTimeline.*`, `customerReport.*`, `customerAccess.*`, `customerIssue.*`, `customerSurvey.*`. | Key names like `caseNotFound`, `lineNotBound`, `finalAppointmentMissing`, `billingSettlementPending`. | Keys should avoid encoding internal denial reasons or resource existence. | Keys should support multiple channels without LINE-specific assumptions. | AI cannot create official keys automatically. | Task357 | Localization file implementation, copy review, API wording contract. |

## Consolidated Guardrails

Customer-facing surfaces are filtered projections, not internal sources of truth.

They must not directly dump internal Field Service Reports, raw appointment rows, raw dispatch visit records, audit logs, or provider payloads.

Customer-facing surfaces must not display:

- internal notes,
- audit log,
- AI raw payload,
- AI prompt,
- raw model output,
- billing internal data,
- settlement internal data,
- vendor reconciliation data,
- brand reconciliation data,
- inventory internal data,
- warehouse data,
- stock movement data,
- engineer internal comments,
- supervisor notes,
- raw LINE user IDs,
- internal channel IDs,
- provider IDs,
- full phone numbers unless the screen has clear necessity and authorization,
- full addresses unless the screen has clear necessity and authorization,
- database IDs that are not customer-safe,
- organization-internal IDs that are not customer-safe.

Safe-deny wording must not reveal whether a Case, Customer, Organization, Appointment, Field Service Report, LINE binding, access token, report link, or survey link exists.

LINE is currently an important customer channel, but customer-visible surfaces must not hard-code LINE as the only channel.

Customer channel identity must be scoped by organization and channel. `line_user_id` is not a global identity.

AI may assist with customer-safe wording drafts, but AI must not automatically publish customer-visible content, decide official wording, hide complaints, suppress negative feedback, or expose internal data.

## Appointment / Field Service Report Boundary

Appointment / dispatch visit records are field process records.

They can describe:

- scheduled visits,
- rescheduled visits,
- customer confirmations,
- customer unavailable events,
- pending parts,
- pending quote,
- unable to repair,
- final completed visit.

The Field Service Report is the Case-level formal completion summary.

Core invariant:

- one Case = one formal Field Service Report,
- one Case can have multiple appointments / dispatch visits,
- multiple visits do not create multiple formal Field Service Reports,
- customer-facing service report is a filtered customer-visible version,
- timeline is a customer-facing projection, not the formal source of truth.

## Known Non-goals

Task358 does not:

- add runtime,
- add an API contract,
- add a projection service,
- add a localization file,
- add a safe-deny helper,
- add notification sending,
- add smoke tests,
- modify validators,
- add a migration,
- add a schema or index change,
- add LINE / SMS / Email / App provider runtime,
- add AI / RAG runtime,
- add billing / settlement runtime,
- add quote / payment / invoice runtime,
- add customer-facing report runtime,
- add survey runtime,
- add complaint / callback runtime,
- add inventory / WMS runtime,
- change Field Service Report completion,
- change `finalAppointmentId` inference,
- change Case status workflow.

## Future Task Candidates

These are future tasks only and must not be implemented as part of Task358.

### Customer-visible Timeline API Contract

Define the customer-safe appointment timeline response shape, message keys, access-control behavior, and safe-deny mapping.

### Customer-facing Service Report API Contract

Define the filtered report response shape and field allow-list.

### Projection Service Permission Filter Design

Design a shared projection layer that enforces customer visible data policy, organization scope, and field-level redaction.

### Safe-deny Response Helper Design

Design a helper so customer-facing surfaces share non-enumerating deny behavior.

### Customer-visible Localization File Implementation

Create actual localization resources only after product copy review and API contract approval.

### Product Copy Review

Review customer-visible wording for clarity, tone, channel fit, non-enumeration, and privacy.

### Customer Channel Identity Verification Runtime Task

Design scoped verification for LINE, Web link, Web portal, App, SMS-directed link, and Email-directed link.

### Access-control Smoke / Integration Tests

Add tests only after API contracts, projection services, verification runtime, and disposable local/test runtime are available.

### Multi-channel Notification Delivery Policy

Define what can be sent directly in each channel and what must remain behind verified access.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No localization file is added by Task358.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke file change.

## Security / Redaction Note

This document does not include credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, or production data details.

Future customer-visible surface implementation must continue to avoid exposing resource existence, ownership, organization scope, channel identity state, internal denial reason, provider data, AI payload, billing internals, settlement internals, inventory internals, or staff-management data.
