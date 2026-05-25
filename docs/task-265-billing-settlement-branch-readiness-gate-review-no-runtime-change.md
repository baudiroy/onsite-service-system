# Task 265 - Billing / Settlement Branch Readiness Gate Review / No Runtime Change

## Purpose And Scope

This document closes the current Billing / Settlement docs-only design branch for Task259 through Task264.

It reviews whether the branch is ready to pause before any runtime implementation, schema proposal, API contract, Admin UI, billing engine, settlement engine, quote workflow, approval workflow, payment / invoice workflow, audit runtime, permission runtime, entitlement runtime, usage runtime, or AI automation work begins.

Task265 is documentation-only.

This task is not:

- billing runtime implementation,
- settlement runtime implementation,
- quote runtime implementation,
- approval workflow implementation,
- payment / invoice implementation,
- SaaS billing implementation,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation,
- AI / RAG runtime,
- AI auto-decision engine.

Task265 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, or inventory documentation changes.

## Branch Source Documents

The current Billing / Settlement branch consists of:

| Task | Document | Purpose | Current status |
| --- | --- | --- | --- |
| Task259 | `docs/task-259-billing-settlement-itemization-design-kickoff-no-runtime-change.md` | Starts future billing / settlement itemization design and records core boundaries. | Docs-only, accepted as design context. |
| Task260 | `docs/task-260-billing-itemization-category-matrix-no-runtime-change.md` | Defines proposal-only billing item category matrix and consent / quote / approval boundaries. | Docs-only, accepted as category planning. |
| Task261 | `docs/task-261-customer-fee-consent-record-design-no-runtime-change.md` | Defines traceable customer fee consent design principles. | Docs-only, accepted as future consent design. |
| Task262 | `docs/task-262-floor-carrying-remote-fee-policy-matrix-no-runtime-change.md` | Defines floor / carrying / remote fee policy matrix and onsite condition boundaries. | Docs-only, accepted as policy planning. |
| Task263 | `docs/task-263-quote-approval-settlement-workflow-separation-design-no-runtime-change.md` | Separates quote, customer consent, supervisor review, settlement, payment, invoice, discount, compensation, and service recovery workflows. | Docs-only, accepted as workflow boundary. |
| Task264 | `docs/task-264-settlement-calculation-vs-approval-matrix-no-runtime-change.md` | Separates settlement calculation from settlement approval and confirms AI may suggest but never approve. | Docs-only, accepted as approval boundary. |

These files are design notes only. They do not approve implementation.

## Task259 Through Task264 Summary

### Task259 - Itemization Kickoff

Task259 established the branch principles:

- billing and settlement must remain configurable,
- vendor / brand rules must not be hard-coded,
- customer fee consent must not live only in notes,
- multi-visit billing context may reference appointments,
- one Case still has one formal Field Service Report,
- AI may suggest but must not approve billing, quote, settlement, fee, discount, or compensation outcomes.

### Task260 - Category Matrix

Task260 proposed future itemization categories such as:

- service base fee,
- diagnosis / inspection fee,
- labor fee,
- parts fee,
- floor fee,
- carrying / handling fee,
- remote area fee,
- parking / access fee,
- second visit fee,
- pending parts related fee,
- quote-required item,
- customer-approved add-on,
- cancellation fee,
- no-show / customer unavailable fee,
- warranty-covered item,
- goodwill discount,
- compensation,
- vendor / brand adjustment,
- internal write-off.

The matrix confirmed that category suggestions are not runtime enums, not API fields, not Admin UI options, and not DB schema.

### Task261 - Customer Fee Consent

Task261 defined customer fee consent as a structured, traceable future record.

Key conclusions:

- Customer consent must record source, time, amount, channel, and evidence where applicable.
- Customer consent can link to Case, appointment, quote, fee item, or service context.
- Quote acceptance can be a consent source, but it is not settlement approval.
- AI must not consent for the customer.
- Evidence should use future file / object storage references, not raw payload in logs or notes.

### Task262 - Floor / Carrying / Remote Fee Policy

Task262 clarified that floor / carrying / remote fee policy should represent onsite risk, scheduling, staffing, cost, and consent boundaries.

Key conclusions:

- The product should not reduce the question to "does the customer need engineer carrying help."
- Floor, elevator, access, carrying difficulty, parking, remote area, urgent / after-hours, and special access conditions may affect future fee or settlement policy.
- Added-fee factors belong to appointment / dispatch visit context where observed.
- Extra charges require clear consent or quote acceptance where customer-facing.
- AI may organize onsite conditions but must not charge, quote, approve, or consent.

### Task263 - Workflow Separation

Task263 separated quote, customer consent, supervisor approval, discount, compensation, service recovery, settlement calculation, settlement approval, payment, and invoice handoff.

Key conclusions:

- Quote proposal does not equal customer consent.
- Customer consent does not equal settlement approval.
- Supervisor approval does not equal customer consent.
- Billing itemization does not equal payment / invoice.
- Settlement calculation does not equal settlement approval.
- Payment / invoice runtime is out of scope.
- AI suggestion does not equal any approval.

### Task264 - Calculation vs Approval Matrix

Task264 separated settlement calculation from settlement approval.

Key conclusions:

- Settlement calculation is not settlement approval.
- Vendor / brand rule evaluation is not final payable approval.
- Customer consent is not settlement approval.
- Quote acceptance is not settlement approval.
- Supervisor review is not necessarily finance approval.
- Payment / invoice handoff is separate from settlement approval.
- Internal adjustment proposal is not final approval.
- AI may suggest but may never approve.
- Runtime allowed now is No for all matrix rows.

## Branch Readiness Checklist

| Area | Readiness conclusion | Status |
| --- | --- | --- |
| Core Case / Appointment / Field Service Report invariants | Billing / settlement docs preserve one Case = one formal Field Service Report and multiple appointments / visits per Case. | Ready to pause. |
| Billing itemization categories | Future category groups are documented as proposal-only and not runtime enums. | Ready to pause. |
| Vendor / brand rule flexibility | Docs consistently state vendor / brand rules must be configurable and not hard-coded. | Ready to pause. |
| Customer fee consent | Docs require structured, traceable consent and reject note-only consent. | Ready to pause. |
| Floor / carrying / remote fee | Docs record policy factors, customer consent boundary, and appointment context. | Ready to pause. |
| Quote vs consent vs approval | Docs separate quote proposal, quote acceptance, customer consent, supervisor review, and settlement approval. | Ready to pause. |
| Calculation vs approval | Docs separate calculation draft, rule evaluation, and approval. | Ready to pause. |
| Payment / invoice | Docs mark payment / invoice as future handoff only, not current runtime. | Ready to pause. |
| Customer-visible vs internal-only | Docs consistently separate customer-facing fee / quote / consent surfaces from internal settlement, margin, audit, AI, and diagnostics. | Ready to pause. |
| Permission / entitlement / usage | Docs identify future questions without implementing permission, entitlement, feature gates, subscription checks, or usage metering. | Ready to pause. |
| Audit readiness | Docs identify placeholder audit events and redaction needs without implementing audit runtime. | Ready to pause. |
| AI boundary | Docs consistently allow AI suggestions and reminders only, never approval or official decision. | Ready to pause. |
| Sensitive data safety | Docs prohibit raw tokens, secrets, full mobile values, raw LINE ids, raw provider payloads, and raw AI sensitive payloads. | Ready to pause. |
| Runtime implementation | No billing / settlement / quote / approval / payment / invoice runtime is approved. | Must remain paused. |
| Schema / migration | No billing / settlement / quote / consent / approval schema is approved. | Must remain paused. |

## Guardrail Alignment Review

### Case / Appointment / Field Service Report Invariants

The Billing / Settlement branch remains aligned with the project model:

- One Case has one formal Field Service Report.
- One Case can have multiple appointments / dispatch visits.
- Multi-visit outcomes remain appointment-level context.
- Billing and settlement may reference appointment history.
- Billing and settlement must not create multiple formal Field Service Reports.
- `finalAppointmentId` remains backend / system determined.

No Billing / Settlement branch document proposes changing `field_service_reports.case_id` uniqueness, creating one report per visit, or letting billing choose `finalAppointmentId`.

### Vendor / Brand / Fee Rules Must Remain Configurable

The branch consistently rejects hard-coded billing and settlement logic.

Future implementation must support:

- vendor-specific rules,
- brand-specific rules,
- service-type specific rules,
- warranty / goodwill policy,
- floor / carrying / remote fee policies,
- quote-required work,
- customer-approved add-ons,
- second-visit and pending-parts context.

This branch does not approve a rule engine, rule schema, or calculation runtime.

### Customer Fee Consent Must Be Structured

The branch consistently states:

- customer fee consent must not exist only in a free-text note,
- consent should record source, time, channel, amount, and evidence reference,
- consent should remain separate from settlement approval,
- AI cannot consent on behalf of the customer.

Future implementation should design consent records separately from quote records, billing items, settlement approvals, payment, and invoice.

### Customer-visible vs Internal-only Separation

Customer-visible data may include safe fee explanations, sent quotes, accepted quote status, customer-approved fees, safe consent summaries, approved discount wording, approved compensation wording, and future payment / invoice summaries where product policy allows.

Customer-visible surfaces must not include:

- vendor internal settlement rules,
- internal margin / cost,
- supervisor internal notes,
- finance approval notes,
- AI suggestions,
- audit logs,
- permission details,
- entitlement details,
- raw diagnostics,
- raw provider payloads,
- raw LINE user ids,
- full customer mobile values,
- secrets or tokens.

The Billing / Settlement branch is aligned with the Data Access Control / Data Permission Model in `docs/PROJECT_GUARDRAILS.md`.

### AI Advisory-only Boundary

AI may assist by:

- organizing billing item inputs,
- suggesting item categories,
- identifying missing customer consent,
- comparing quote, appointment, report, and settlement context,
- flagging discrepancies,
- drafting review notes,
- reminding humans of missing evidence.

AI must not:

- approve quote,
- accept quote for customer,
- record customer consent,
- approve settlement,
- approve discount,
- approve compensation,
- promise refund,
- promise free service,
- modify official Case / Appointment / Field Service Report status,
- decide official payable amount,
- choose `finalAppointmentId`.

AI output remains separate from official record until human review or deterministic business logic approves the official write in a future approved runtime task.

### Permission / Entitlement / Usage / Subscription Separation

Future implementation must preserve:

- permission: whether a specific user may perform an action,
- entitlement: whether the organization has access to a feature,
- subscription: whether the organization is in an eligible subscription state,
- usage: whether usage limits or metering apply,
- organization scope: which tenant owns the data.

Billing / settlement permission questions remain future-only.

Examples:

- An organization may have settlement entitlement, but a user still needs settlement permission.
- A user may have billing review permission, but advanced vendor / brand rule features may require entitlement.
- Export or report generation may need usage tracking.
- AI suggestion features may need AI add-on entitlement and usage metering.

Task265 does not implement any of these checks.

### Organization Isolation

Future billing, settlement, quote, consent, approval, payment, invoice, report, export, AI, and audit features must filter and enforce `organization_id` scope.

No future workflow should:

- cross organization boundaries,
- treat LINE identity as global,
- expose customer data across tenants,
- share vendor / brand rules across organizations without explicit policy,
- let AI retrieval bypass organization filters.

### Audit Readiness

The branch identifies future audit needs for:

- billing item suggestion and selection,
- customer consent request and recording,
- quote draft / sent / accepted / rejected,
- supervisor review,
- discount / compensation approval,
- settlement calculation,
- settlement adjustment,
- settlement approval / rejection,
- settlement correction / void / reopen,
- AI suggestion accept / reject / edit.

These are placeholders only. They are not production audit event names, localization keys, DB enums, or API contracts.

Audit must use redacted summaries and must not store raw secrets, raw provider payloads, full mobile values, raw LINE user ids, signatures, or unnecessary AI raw sensitive payload.

### Sensitive Data / Token / LINE Safety

Future implementation must not expose:

- full customer mobile values,
- full addresses,
- raw LINE user ids,
- LINE access tokens,
- channel secrets,
- webhook secrets,
- provider credentials,
- raw provider payloads,
- raw AI sensitive payloads,
- customer signature binary,
- internal notes on customer-visible surfaces,
- audit logs on customer-visible surfaces.

LINE may be one consent or communication channel, but the billing / settlement design must not hard-code LINE as the only customer channel.

## Runtime Forbidden Confirmation

The Billing / Settlement branch remains paused for runtime.

The following are explicitly not approved:

- billing item table,
- settlement table,
- settlement calculation table,
- quote table,
- customer consent table,
- approval table,
- payment table,
- invoice table,
- billing engine,
- settlement engine,
- rule engine,
- quote workflow runtime,
- customer consent runtime,
- approval workflow runtime,
- discount approval runtime,
- compensation approval runtime,
- service recovery runtime,
- payment runtime,
- invoice runtime,
- permission runtime,
- entitlement runtime,
- subscription runtime,
- usage metering runtime,
- audit runtime,
- AI / RAG runtime,
- AI settlement decision,
- Admin billing / settlement UI,
- customer-facing quote / payment / invoice UI,
- vendor portal,
- provider sending,
- DB migration,
- DB schema / index change,
- API contract,
- smoke / test implementation.

General instructions such as "continue", "next task", or "go ahead" must not be interpreted as approval for any of the above.

## Future-only Items List

Future tasks may eventually design or implement these items, but only after explicit approval and appropriate branch selection:

- billing itemization data model,
- customer fee consent data model,
- quote data model,
- quote lifecycle,
- floor / carrying / remote fee rule model,
- vendor / brand rule model,
- settlement calculation engine,
- settlement approval workflow,
- settlement correction / void / reopen policy,
- discount / compensation approval workflow,
- payment / invoice handoff model,
- customer-visible quote / consent / invoice surfaces,
- internal finance review queue,
- vendor / brand settlement report,
- permission matrix,
- entitlement feature keys,
- usage metering for exports / reports / AI / storage,
- audit event catalog finalization,
- safe error / non-leakage policy,
- Admin UX wireframe,
- engineer mobile evidence capture integration,
- file / object storage evidence references,
- AI suggestion review workflow,
- AI source trace policy for settlement recommendations,
- tests and smoke coverage.

These are not current implementation work.

## Readiness Gate Decision

The current Billing / Settlement branch is ready to pause after Task265.

Reason:

- Core itemization categories are documented.
- Customer fee consent boundaries are documented.
- Floor / carrying / remote fee policies are documented.
- Quote, consent, approval, settlement, payment, invoice, discount, compensation, and service recovery boundaries are documented.
- Settlement calculation and settlement approval are separated.
- AI advisory-only boundary is explicit.
- Runtime allowed now remains No.
- Migration / schema decision remains none.
- API / Admin decision remains none.
- Permission / entitlement / usage / audit runtime remains future-only.
- Sensitive data rules are documented.
- SaaS-ready and organization isolation boundaries are preserved.

No additional docs-only closure item is required before pausing this branch unless PM or product leadership identifies a specific missing boundary.

Recommended next direction after pause:

- choose a new product branch,
- or continue docs-only readiness planning for another already identified future capability,
- or explicitly request a future implementation planning branch with clear runtime and migration authorization boundaries.

Do not start billing / settlement runtime implementation from this document alone.

## Non-goals Maintained

Task265 confirms:

- no backend source change,
- no Admin source change,
- no API change,
- no migration,
- no schema / index change,
- no DB connection,
- no DDL,
- no `psql`,
- no `npm run db:migrate`,
- no Migration020 dry-run / apply,
- no shared runtime / shared Zeabur operation,
- no destructive cleanup,
- no tests / smoke / fixture change,
- no package change,
- no inventory docs change,
- no provider sending,
- no LINE / SMS / Email / APP sending,
- no notification runtime,
- no survey runtime,
- no billing runtime,
- no settlement runtime,
- no quote runtime,
- no approval workflow runtime,
- no payment / invoice runtime,
- no SaaS billing runtime,
- no audit runtime,
- no permission runtime,
- no entitlement runtime,
- no feature flag runtime,
- no usage metering runtime,
- no AI agent runtime,
- no RAG runtime,
- no vector database,
- no embedding,
- no official record write by AI,
- no AI auto-decision,
- no sensitive output.

## Completion Report Template For This Branch

Future reports for this branch should continue to state:

- files changed,
- implementation status,
- non-implemented boundaries,
- verification commands,
- sensitive scan result,
- guardrail alignment,
- whether schema / API / Admin / runtime / tests / smoke / package changed,
- whether sensitive data, token, secret, customer private data, or LINE-related logic was touched,
- whether organization isolation, SaaS-ready entitlement, usage tracking, AI Add-on, or Enterprise SSO future design was affected.

For Task265, the expected answer is:

- documentation-only,
- one new readiness gate document,
- no runtime change,
- Billing / Settlement branch ready to pause.
