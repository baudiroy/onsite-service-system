# Task 259 - Billing / Settlement Itemization Design Kickoff / No Runtime Change

## Purpose And Scope

This document starts the future Billing / Settlement Itemization design branch for onsite field service.

It records design boundaries for fee items, floor / carrying / remote / second-visit / pending-parts / quote / add-on service / customer consent / vendor and brand settlement rules.

Task259 is documentation-only.

This task is not:

- billing runtime implementation,
- settlement runtime implementation,
- quote runtime implementation,
- payment / invoice implementation,
- SaaS billing implementation,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation,
- AI auto-decision engine.

Task259 does not add billing tables, settlement tables, quote tables, customer consent tables, APIs, Admin UI, migrations, schema, audit runtime, permission runtime, entitlement runtime, usage runtime, payment runtime, invoice runtime, SaaS billing runtime, or automated tests.

## Core Billing / Settlement Principles

Billing and settlement must remain configurable, traceable, and reviewable.

Future principles:

- Billing / Settlement must not be hard-coded.
- Future design must support vendor-specific rules.
- Future design must support brand-specific rules.
- Future design must support multi-visit service patterns.
- Future design must support pending parts.
- Future design must support quote-required work.
- Future design must support floor fee.
- Future design must support carrying / handling fee.
- Future design must support remote area fee.
- Future design must support customer-approved add-on service.
- Future design must support second-visit fee where policy allows.
- Case / Appointment / Field Service Report invariants must not be broken.
- One Case can have only one formal Field Service Report.
- Multi-visit outcomes belong to appointment / dispatch visit level.
- Billing / settlement must not be automatically approved by AI.
- Customer fee consent must not exist only in a free-text note.

Billing should be a structured, auditable workflow. It should not become a pile of hard-coded special cases.

## Future Itemization Categories

The categories below are proposal-only.

They are not:

- production enum,
- DB field,
- API contract,
- generated client field,
- Admin UI option,
- runtime behavior.

Future itemization categories may include:

- base service fee,
- inspection / diagnosis fee,
- repair labor fee,
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
- approved compensation,
- vendor settlement adjustment,
- brand-specific adjustment.

Each future category should define:

- whether it is customer-visible,
- whether customer consent is required,
- whether supervisor approval is required,
- whether vendor / brand rule applies,
- whether it affects customer billing, vendor settlement, or both,
- whether evidence or attachment is required,
- whether AI may suggest it for human review.

## Customer Fee Consent Boundary

Customer fee consent should be structured and traceable.

Future principles:

- Customer fee consent should record source.
- Customer fee consent should record time.
- Customer fee consent should record amount or amount category.
- Customer fee consent should record channel.
- Customer fee consent should record evidence when applicable.
- Fee consent must not exist only in free-text note.
- AI must not consent on behalf of customer.
- Engineer should not be forced into an overly complex form.
- System and AI may help structure information.
- Official consent must come from traceable customer or authorized human action.

Possible future consent sources:

- phone confirmation,
- LINE confirmation,
- SMS / web link confirmation,
- onsite signature,
- admin-entered manual confirmation with evidence,
- quote approval workflow.

Task259 does not implement any consent table, consent API, consent UI, or consent workflow.

## Floor / Carrying / Added-fee Design Boundary

The platform should not frame onsite service as "do you need engineer to help carrying" as a core customer question.

For onsite service, necessary handling is usually part of the service expectation. The operational question is whether the site condition creates scheduling, staffing, cost, or consent risk.

Future design may record:

- floor level,
- whether elevator exists,
- carrying / handling difficulty,
- whether additional fee may apply,
- fee confirmation status,
- customer consent record,
- evidence or note category,
- dispatch planning impact.

Design principles:

- Floor / carrying fee should be configurable.
- Floor / carrying fee should be auditable.
- Customer-facing wording should be clear and not blame the customer.
- Engineer workflow should stay simple.
- AI may remind that fee consent appears missing.
- AI must not decide or approve the fee.

Task259 does not add forms, engineer app fields, database columns, or runtime behavior.

## Multi-visit And Appointment-level Fee Boundary

Multi-visit context belongs to appointment / dispatch visit level.

Future principles:

- Multiple visits may exist under one Case.
- Second visit fee should reference appointment / visit context where applicable.
- Pending parts should reference appointment / visit context.
- Customer unavailable / no-show should reference appointment / visit context.
- Cancellation should reference appointment / visit context.
- Unable-to-repair outcomes should reference appointment / visit context.
- Settlement may reference multiple appointments.
- Settlement must not create multiple formal Field Service Reports.
- Field Service Report remains Case-level final completion summary.
- `finalAppointmentId` remains backend / system determined.

Billing can look across visit history. It must not redefine the service report model.

## Quote / Approval / Settlement Separation

Future design should separate these concepts:

- quote proposal,
- customer fee consent,
- supervisor approval,
- vendor / brand settlement rule,
- billing itemization,
- settlement calculation,
- payment / invoice if future scope,
- audit trail.

Important separations:

- Quote approval does not equal settlement approval.
- Customer consent does not equal internal settlement approval.
- AI suggestion does not equal quote approval.
- AI suggestion does not equal settlement approval.
- Settlement calculation does not equal payment collection.
- Payment / invoice runtime is outside Task259 scope.

Each step should have its own permission, audit, and customer-visible/internal-only boundary in future implementation.

## Customer-visible vs Internal-only Separation

Customer-visible surfaces may include:

- approved and customer-disclosable fee items,
- customer-approved amount and explanation,
- safe quote wording,
- safe fee confirmation wording,
- customer-visible discount / compensation where policy permits,
- approved payment or invoice summary where future product supports it.

Customer-visible surfaces must not include:

- vendor internal settlement rule,
- internal margin / cost,
- engineer internal note,
- supervisor internal decision note,
- AI raw suggestion,
- audit log,
- provider diagnostics,
- SaaS plan / entitlement detail,
- internal risk score,
- settlement reviewer note unless explicitly approved.

Internal data can support review. It must not leak into customer-facing output.

## Permission / Entitlement Readiness

Future implementation must answer:

- Who can create fee item?
- Who can edit fee item?
- Who can remove fee item?
- Who can send quote?
- Who can record customer consent?
- Who can approve discount?
- Who can approve compensation?
- Who can approve settlement?
- Who can view vendor settlement internal data?
- Which advanced settlement rules require plan entitlement?
- Which export / report features require usage tracking?
- Which roles can see internal cost?
- Which roles can see customer-visible fee explanation?
- Which roles can override suggested itemization?

Placeholder feature keys or permissions may be discussed in future tasks, but Task259 does not add runtime permissions, entitlements, feature gates, or seeds.

## Audit Readiness

Future audit event examples:

- `billing.item.proposed`,
- `billing.item.edited`,
- `billing.item.removed`,
- `quote.created`,
- `quote.sent`,
- `customer_fee_consent.recorded`,
- `customer_fee_consent.rejected`,
- `supervisor_approval.requested`,
- `supervisor_approval.approved`,
- `supervisor_approval.rejected`,
- `settlement.calculated`,
- `settlement.adjusted`,
- `settlement.approved`,
- `discount_compensation.approved`,
- `ai.billing_suggestion.generated`,
- `ai.billing_suggestion.accepted`,
- `ai.billing_suggestion.rejected`,
- `ai.billing_suggestion.edited`.

These are placeholders only.

They are not:

- production event names,
- DB enum values,
- localization keys,
- API response fields,
- generated client contracts,
- audit runtime.

Audit redaction must prohibit:

- full customer mobile values,
- full addresses,
- tokens,
- secrets,
- raw provider payloads,
- raw AI sensitive payloads,
- internal audit details on customer-visible surfaces.

Audit should record structured categories and actor accountability without exposing unnecessary sensitive data.

## AI Advisory-only Boundary

AI can:

- help organize onsite information,
- suggest possible fee item candidates,
- remind missing customer consent,
- compare brand / vendor rules for human review,
- flag settlement risk,
- draft quote explanation,
- summarize appointment history relevant to settlement,
- detect missing evidence categories.

AI cannot:

- automatically create official fee item,
- automatically approve quote,
- automatically approve settlement,
- automatically consent for customer,
- automatically approve discount,
- automatically approve compensation,
- automatically modify Case official status,
- automatically modify Appointment official status,
- automatically modify Field Service Report official status,
- choose `finalAppointmentId`,
- bypass permission,
- bypass organization scope,
- bypass entitlement,
- write uncertain content into official billing / settlement record.

AI may assist. It must not become billing approver, settlement reviewer, customer, supervisor, or official writer.

## Explicit Non-goals

Task259 does not:

- create billing table,
- create settlement table,
- create quote table,
- create customer consent table,
- add migration,
- change schema,
- add index,
- add API,
- modify backend source,
- modify Admin source,
- add payment runtime,
- add invoice runtime,
- add SaaS billing runtime,
- add audit runtime,
- add permission runtime,
- add entitlement runtime,
- add usage metering runtime,
- add automated tests,
- add smoke tests,
- modify `package.json`,
- modify inventory docs,
- touch Migration020,
- connect to DB,
- run psql,
- run db:migrate,
- run DDL,
- run cleanup,
- touch shared Zeabur runtime,
- implement AI auto-decision,
- implement official record write by AI.

## Future Branch Questions

Future tasks may need to answer:

- Should billing itemization be Case-level, appointment-level, or both?
- Which items are customer billing vs vendor settlement vs internal adjustment?
- Which items require customer fee consent?
- Which items require supervisor approval?
- How should quote approval relate to billing itemization?
- How should pending parts and second visit fee be represented?
- How should warranty-covered items be shown to customer and settlement reviewer?
- What is the first-release minimal billing item subset?
- Which vendor / brand rules should be configurable first?
- Which exports or reports are required for finance?

These are future questions only. Task259 does not execute them.
