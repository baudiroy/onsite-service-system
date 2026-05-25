# Task 260 - Billing Itemization Category Matrix / No Runtime Change

## Purpose And Scope

This document extends Task259 with a proposal-only Billing Itemization Category Matrix for future onsite field service billing and settlement planning.

Task260 is documentation-only.

This task is not:

- billing runtime implementation,
- settlement runtime implementation,
- quote runtime implementation,
- payment / invoice implementation,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation,
- AI auto-decision engine.

Task260 does not add billing item tables, category enums, quote tables, customer consent tables, APIs, Admin UI, migrations, schema, billing runtime, settlement runtime, quote runtime, payment runtime, invoice runtime, audit runtime, permission runtime, entitlement runtime, usage runtime, or automated tests.

## Core Category Principles

Future billing itemization must remain configurable and auditable.

Principles:

- Fee items must be configurable.
- Fee items must not be hard-coded.
- Different brands may have different rules.
- Different vendors may have different rules.
- Different service categories may have different rules.
- Fee items should distinguish customer-visible and internal-only items.
- Fee items should distinguish customer charge, vendor settlement, and internal adjustment.
- Customer fee consent must be traceable.
- Quote approval, customer consent, and settlement approval are separate workflows.
- AI may suggest category classification for human review.
- AI must not automatically create official fee items.
- AI must not automatically approve amounts.
- AI must not automatically approve quote, settlement, discount, or compensation.

Itemization should support real operations without breaking Case / Appointment / Field Service Report invariants.

## Proposal-only Category Groups

The categories below are conceptual only.

They are not:

- production enum,
- DB field,
- API contract,
- generated client field,
- Admin UI option,
- runtime behavior.

Future category groups may include:

- Service base fee,
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
- customer unavailable / no-show fee,
- cannot repair fee handling,
- warranty-covered item,
- goodwill discount,
- compensation / service recovery adjustment,
- vendor settlement adjustment,
- brand-specific adjustment,
- internal write-off / adjustment.

## Category Matrix

This matrix is proposal-only.

All AI may auto-approve values are No.

All Runtime allowed now values are No.

| Category | Typical source | Case-level or appointment-level context | Customer-visible? | Requires customer consent? | Requires quote? | Requires supervisor approval? | Affects vendor settlement? | May affect customer charge? | AI may suggest? | AI may auto-approve? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Service base fee | Service policy / vendor rule | Case-level, may reference final appointment | Yes, if charged to customer | Depends on service terms | Usually no | Usually no | Yes | Yes | Yes | No | No |
| Diagnosis / inspection fee | Service policy / onsite result | Appointment-level context, Case-level summary | Yes, if charged | Often yes | Maybe | Maybe | Yes | Yes | Yes | No | No |
| Labor fee | Engineer completion / service rule | Appointment-level work, Case-level billing | Yes, if customer charged | Maybe | Maybe | Maybe | Yes | Yes | Yes | No | No |
| Parts fee | Parts usage / service report | Appointment-level usage, Case-level billing | Yes, if customer charged | Often yes | Maybe | Maybe | Yes | Yes | Yes | No | No |
| Floor fee | Address / onsite condition | Appointment-level condition, Case-level billing | Yes | Yes if extra charge | Maybe | Maybe | Maybe | Yes | Yes | No | No |
| Carrying / handling fee | Onsite condition / dispatch note | Appointment-level condition | Yes | Yes if extra charge | Maybe | Maybe | Maybe | Yes | Yes | No | No |
| Remote area fee | Address / service region rule | Case-level, may affect dispatch | Yes | Usually yes if extra charge | Maybe | Maybe | Maybe | Yes | Yes | No | No |
| Parking / access fee | Onsite access condition | Appointment-level condition | Maybe | Maybe | Usually no | Maybe | Maybe | Yes | Yes | No | No |
| Second visit fee | Multi-visit history | Appointment-level, references prior visit | Yes, if charged | Often yes | Maybe | Maybe | Yes | Yes | Yes | No | No |
| Pending parts related fee | Pending-parts visit outcome | Appointment-level, Case-level follow-up | Maybe | Depends on policy | Maybe | Maybe | Yes | Maybe | Yes | No | No |
| Quote-required item | Engineer/customer service proposal | Case-level quote with appointment evidence | Yes after quote | Quote acceptance required | Yes | Often yes | Maybe | Yes | Yes | No | No |
| Customer-approved add-on | Customer request / onsite upsell | Appointment-level, Case-level billing | Yes | Yes | Maybe | Maybe | Maybe | Yes | Yes | No | No |
| Cancellation fee | Cancellation policy | Appointment-level event | Yes, if charged | Depends on terms | Usually no | Maybe | Maybe | Yes | Yes | No | No |
| Customer unavailable / no-show fee | No-show visit result | Appointment-level event | Yes, if charged | Depends on terms | Usually no | Maybe | Maybe | Yes | Yes | No | No |
| Cannot repair fee handling | Unable-to-repair outcome | Appointment-level event, Case-level outcome | Maybe | Depends on policy | Maybe | Often yes | Maybe | Maybe | Yes | No | No |
| Warranty-covered item | Warranty rule / brand policy | Case-level, may cite appointment evidence | Yes as covered explanation | No separate charge consent | Usually no | Maybe | Yes | No or reduced | Yes | No | No |
| Goodwill discount | Supervisor / customer recovery | Case-level adjustment | Yes, if shown | No, but customer-facing wording may be needed | No | Yes | Maybe | Reduces charge | Yes | No | No |
| Compensation / service recovery adjustment | Supervisor / complaint handling | Case-level adjustment | Yes, if customer-facing | Maybe | No | Yes | Maybe | Reduces or offsets charge | Yes | No | No |
| Vendor settlement adjustment | Vendor / brand settlement rule | Case-level settlement, may cite appointments | No by default | No | No | Maybe | Yes | No | Yes | No | No |
| Brand-specific adjustment | Brand rule / contract | Case-level settlement or billing | Maybe | Depends on customer charge | Maybe | Maybe | Yes | Maybe | Yes | No | No |
| Internal write-off / adjustment | Finance / supervisor decision | Case-level internal adjustment | No by default | No | No | Yes | Maybe | Maybe, if passed to customer | Yes | No | No |

## Case vs Appointment Context

Multi-visit and onsite outcome context belongs to appointment / dispatch visit.

Principles:

- Multiple visits may exist under one Case.
- Pending parts belongs to appointment / dispatch visit outcome.
- Quote-required onsite discovery belongs to appointment / dispatch visit context.
- Customer unavailable / no-show belongs to appointment / dispatch visit context.
- Cancellation belongs to appointment / dispatch visit context.
- Unable-to-repair outcome belongs to appointment / dispatch visit context.
- Billing itemization may reference appointment context.
- Field Service Report remains Case-level final completion summary.
- Multiple billing items must not create multiple formal Field Service Reports.
- Multiple appointments must not create multiple formal Field Service Reports.
- `finalAppointmentId` remains backend / system determined.

Billing itemization can reference many visits while still preserving one formal report per Case.

## Customer Consent Requirement Classification

The following consent classifications are conceptual only.

They are not:

- production status,
- DB enum,
- API field,
- Admin UI option,
- consent runtime,
- quote runtime.

Future consent classifications may include:

- No separate customer consent needed.
- Consent required before charge.
- Quote acceptance required.
- Customer already approved at service request.
- Supervisor approval required before customer-facing charge.
- Internal-only settlement adjustment, not charged to customer.
- Not chargeable / warranty-covered.

Consent classification should be separate from settlement approval and internal finance approval.

## Customer-visible vs Internal-only Category Boundary

Customer-visible categories may include:

- approved customer charge,
- customer-approved fee,
- quote item,
- warranty-covered explanation,
- approved discount explanation,
- approved compensation explanation,
- safe fee confirmation wording.

Internal-only categories may include:

- vendor settlement adjustment,
- internal margin / cost,
- internal write-off,
- supervisor review note,
- brand-specific internal rule,
- AI suggestion,
- audit log,
- provider diagnostic detail,
- SaaS plan / entitlement detail.

Customer-visible output must not reveal internal settlement logic, margin, audit detail, or raw AI suggestion.

## Permission / Entitlement Readiness

Future implementation must answer:

- Who can add fee item?
- Who can edit fee item?
- Who can remove fee item?
- Who can mark item as customer-visible?
- Who can send quote?
- Who can record customer consent?
- Who can approve discount?
- Who can approve compensation?
- Who can view vendor settlement adjustment?
- Who can view internal margin / cost?
- Which advanced itemization features require plan entitlement?
- Which export / settlement reports require usage tracking?
- Which roles can accept AI itemization suggestion?
- Which roles can override AI itemization suggestion?

Task260 does not add permissions, entitlements, usage tracking, or feature gates.

## Audit Readiness

Future audit event examples:

- `billing.item_category.suggested`,
- `billing.item_category.selected`,
- `billing.item.customer_visible_marked`,
- `billing.item.consent_required_marked`,
- `billing.item.quote_required_marked`,
- `billing.item.supervisor_approval_requested`,
- `billing.item.supervisor_approved`,
- `billing.item.supervisor_rejected`,
- `billing.item.converted_to_quote`,
- `billing.item.included_in_settlement`,
- `ai.itemization_suggestion.generated`,
- `ai.itemization_suggestion.accepted`,
- `ai.itemization_suggestion.rejected`,
- `ai.itemization_suggestion.edited`.

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

## AI Advisory-only Boundary

AI can:

- suggest fee category,
- remind that customer consent may be needed,
- remind that quote may be needed,
- compare brand / vendor rule for human review,
- flag settlement risk,
- draft customer-facing fee explanation,
- summarize appointment context for itemization,
- identify missing evidence categories.

AI cannot:

- automatically create official fee item,
- automatically mark customer consent,
- automatically send quote,
- automatically approve quote,
- automatically approve settlement,
- automatically approve discount,
- automatically approve compensation,
- automatically modify Case official status,
- automatically modify Appointment official status,
- automatically modify Field Service Report official status,
- choose `finalAppointmentId`,
- bypass permission,
- bypass organization scope,
- bypass entitlement,
- write uncertain category into official billing / settlement record.

AI may suggest. Humans and deterministic workflows remain accountable.

## Explicit Non-goals

Task260 does not:

- create billing item table,
- create category enum,
- create quote table,
- create customer consent table,
- add migration,
- change schema,
- add index,
- add API,
- modify backend source,
- modify Admin source,
- add billing runtime,
- add settlement runtime,
- add quote runtime,
- add payment runtime,
- add invoice runtime,
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

## Future Task Candidates

Future tasks may include:

- Customer fee consent record design.
- Floor / carrying / remote fee policy matrix.
- Quote / approval / settlement workflow separation design.
- Vendor / brand settlement rule model proposal / no migration.
- Billing / settlement permission matrix.
- Billing customer-visible vs internal copy policy.
- Settlement audit event catalog.
- Billing itemization first-release subset decision packet.
- Billing / settlement safe-deny and redaction policy.
- Billing / settlement runtime readiness gate.

These are future candidates only. Task260 does not execute them.
