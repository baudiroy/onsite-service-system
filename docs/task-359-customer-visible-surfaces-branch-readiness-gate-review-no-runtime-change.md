# Task 359 - Customer-visible Surfaces Branch Readiness Gate Review / No Runtime Change

## Scope Summary

Task359 is a documentation-only readiness gate review for the Task352-358 customer-visible surfaces branch.

This task does not modify `src/`, `admin/src/`, `scripts/smoke/`, localization files, migrations, schema, indexes, package configuration, API contracts, customer portal runtime, timeline runtime, customer-facing report runtime, safe-deny runtime, notification runtime, provider integrations, AI / RAG runtime, billing, settlement, quote, payment, invoice, survey, complaint, callback, inventory, parts, WMS, Field Service Report completion logic, `finalAppointmentId` inference, or Case status workflow.

No database connection, DDL, `psql`, `npm run db:migrate`, Migration020 dry-run, Migration020 apply, shared runtime verification, API fixture creation, provider call, or destructive cleanup is part of this task.

Task359 closes the customer-visible surfaces documentation design branch only. It does not mean customer-visible runtime implementation is ready to start without the additional gates listed below.

## Branch Coverage Summary

| Task | Covered boundary | Intentionally not implemented | Future dependency |
| --- | --- | --- | --- |
| Task352 | Customer-visible appointment timeline policy, customer-safe timeline intent, appointment visibility boundary, and multi-visit timeline projection principles. | Timeline API, projection service, customer identity verification, notification delivery, localization, or runtime display. | Customer-visible timeline API contract, projection service permission filters, and access-control tests. |
| Task353 | Customer-facing service report alignment, internal Field Service Report versus customer-facing report boundary, customer-visible content allow-list, signature and fee visibility boundaries. | Customer-facing report API, report generation, issue workflow, survey workflow, invoice runtime, or notification sending. | Customer-facing service report API contract, filtered report projection, fee/signature display policy, and issue/survey workflow design. |
| Task354 | Timeline and customer-facing report access-control test plan, safe-deny expectations, non-enumeration scenarios, and protected surface assumptions. | Actual tests, fixtures, runtime access-control helper, or browser/API smoke. | Disposable local/test runtime confirmation, API contracts, verification runtime, and smoke/integration implementation. |
| Task355 | Customer-visible safe-deny message key design, non-enumerating wording rules, and proposal-only message key families. | Safe-deny helper, localization files, API error mapping, or runtime response changes. | Safe-deny response helper design, localization implementation plan, and API response mapping. |
| Task356 | Multi-channel customer wording review for LINE, Web, App, SMS, and Email without hard-coding a single channel. | Notification templates, provider runtime, localization resources, or delivery policy. | Product copy review, multi-channel notification delivery policy, and localization file implementation. |
| Task357 | Customer-visible localization key catalog proposal and safe key naming boundaries. | Actual localization files, translation runtime, message loader, or backend/frontend integration. | Localization implementation task, product copy approval, and API wording contract. |
| Task358 | Closure matrix across customer-visible surfaces, consolidating allowed content, must-not-display content, access boundaries, channel boundaries, AI boundaries, and future dependencies. | Customer-visible runtime, API contracts, projection service, localization files, notification runtime, or AI publishing. | Runtime branch readiness gates, including API contracts, projection service design, identity verification, and tests. |

## Readiness Gate Checklist

| Area | Current readiness | Notes |
| --- | --- | --- |
| Customer-visible data boundary | Ready as docs | Customer-visible surfaces are filtered projections and must not dump internal source records. |
| Appointment / Field Service Report boundary | Ready as docs | Appointment / dispatch visit is process history; Field Service Report is Case-level formal completion summary. |
| Safe-deny wording principles | Ready as docs | Non-enumerating wording principles and message key families are documented. |
| Channel-agnostic wording boundary | Ready as docs | LINE is important but not hard-coded; Web, App, SMS-directed links, and Email remain future-compatible. |
| Localization key proposal | Ready as docs only | Key families are proposed, but no localization files or runtime loaders exist from this branch. |
| Access-control test plan | Ready as docs only | Test scenarios are defined, but runtime tests are blocked until API/runtime exists and disposable local/test runtime is confirmed. |
| Runtime API contract | Not ready / future task | Timeline and customer-facing report API contracts still need their own design tasks. |
| Projection service design | Not ready / future task | A shared customer-visible projection and field allow-list layer still needs design. |
| Customer channel identity verification runtime | Not ready / future task | Scoped verification for LINE, Web link, Web portal, App, SMS-directed link, and Email-directed link is not implemented. |
| Localization file implementation | Not ready / future task | Product copy, key file structure, fallback behavior, and runtime wiring are future work. |
| Notification delivery policy / runtime | Not ready / future task | Delivery channel policy and provider runtime are outside this branch. |
| Smoke / integration tests | Blocked until disposable local/test runtime confirmation | No API/DB/browser smoke should be added until runtime contracts and safe local/test execution are available. |

## Required Gates Before Runtime

Before any customer-visible runtime branch starts, the project should complete these gates:

- Customer-visible timeline API contract.
- Customer-facing service report API contract.
- Projection service permission filter design.
- Customer channel identity verification runtime design.
- Safe-deny response helper design.
- Customer-visible localization file implementation plan.
- Access-control and safe-deny smoke test plan with disposable local/test runtime confirmation.
- Audit and security event boundary design for customer-visible access.
- Channel delivery policy for LINE, Web, App, SMS, and Email.
- Product copy review for customer-visible wording.

These gates should preserve the existing no-leak, non-enumeration, organization-scope, and channel-abstraction principles before any API or UI surface is exposed to customers.

## Hard Non-goals

This branch closure does not mean:

- Customer portal runtime is ready to open.
- Customer-facing reports can be published.
- LINE, SMS, Email, App, or Web notification delivery can be sent.
- Localization keys or localization files already exist.
- Access-control runtime already exists.
- AI can publish customer-visible content.
- Internal Field Service Reports can be exposed to customers.
- Customer channel identity checks or organization isolation can be bypassed.
- DB migration, DDL, fixture creation, API smoke, browser smoke, or shared runtime verification is approved.
- Customer-facing survey, complaint, callback, payment, invoice, quote, billing, settlement, inventory, parts, WMS, or AI / RAG runtime can start from this document alone.

## Guardrail Confirmation

This branch continues to preserve the project guardrails:

- One Case equals one formal Field Service Report.
- One Case can have multiple appointments / dispatch visits.
- A customer-facing service report is a filtered projection, not the internal Field Service Report.
- A customer-visible appointment timeline is a filtered projection, not the source of truth.
- Customer-visible surfaces must not display internal notes, audit logs, AI raw payloads, billing internals, settlement internals, inventory internals, warehouse data, stock movement data, supervisor notes, engineer internal comments, provider payloads, or staff-management data.
- LINE is not hard-coded as the only customer channel.
- `line_user_id` is not a global identity.
- Customer channel identity must be scoped by organization and channel.
- AI remains advisory and draft-only for customer-safe wording.
- AI must not publish customer-visible content, hide complaints, suppress negative feedback, or expose internal state.
- No database, DDL, migration, shared runtime, provider call, or destructive cleanup is part of this closure.
- No credentials, database URLs, tokens, secrets, raw LINE user IDs, full customer mobile numbers, full customer addresses, raw provider payloads, or production data details are included.

## Recommended Next Branch Options

These are options only and must not be implemented as part of Task359.

### Option A - Customer-visible Runtime API Contract Docs Branch

Define customer-visible timeline and customer-facing service report API contracts, including response allow-lists, safe-deny behavior, link lifecycle assumptions, and no-leak response rules.

### Option B - Customer Channel Identity Verification Runtime Design Branch

Design scoped customer verification for LINE, Web link, Web portal, App, SMS-directed links, and Email-directed links without treating `line_user_id` as a global identity.

### Option C - Safe-deny Helper / Localization Implementation Planning Branch

Plan message key files, fallback behavior, helper boundaries, and API mapping without implementing runtime.

### Option D - Appointment Lifecycle Runtime Hardening Branch

Return to appointment lifecycle runtime hardening if PM prioritizes service-level consistency, concurrency protection, or additional low-risk guards.

### Option E - PM Continuation Handoff

If context becomes too long, prepare a PM continuation handoff that summarizes Task352-359 status, branch boundaries, open gates, and next branch options.

## Risk and Limitations

The customer-visible surfaces branch is ready only as a documentation design package. It is not a runtime readiness approval.

The main risks if future work skips the gates are:

- exposing internal Field Service Report content,
- leaking resource existence through unsafe deny messages,
- hard-coding LINE-specific assumptions,
- bypassing organization-scoped customer channel identity,
- implementing localization keys that encode internal denial reasons,
- letting AI publish customer-visible text without human/product review,
- adding smoke/API tests against a shared runtime without disposable local/test confirmation.

## Migration / Schema Decision

No migration.

No schema change.

No index change.

No localization file is added by Task359.

## Runtime Decision

No runtime behavior change.

No API behavior change.

No Admin frontend behavior change.

No smoke test change.
