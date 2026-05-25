# Task 263 - Quote / Approval / Settlement Workflow Separation Design / No Runtime Change

## Purpose And Scope

This document defines future workflow separation between quote, customer fee consent, supervisor approval, vendor / brand rule evaluation, settlement calculation, settlement approval, discount, compensation, service recovery, payment, and invoice handoff.

Task263 is documentation-only.

This task is not:

- quote runtime implementation,
- billing runtime implementation,
- settlement runtime implementation,
- approval workflow implementation,
- payment / invoice implementation,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation,
- AI auto-decision engine.

Task263 does not add quote tables, approval tables, settlement tables, billing item tables, customer consent tables, APIs, Admin UI, migrations, schema, quote runtime, billing runtime, settlement runtime, approval workflow runtime, payment runtime, invoice runtime, audit runtime, permission runtime, entitlement runtime, usage runtime, or automated tests.

## Core Workflow Separation Principles

Future billing and settlement workflows must not collapse distinct decisions into one action.

Principles:

- Quote proposal does not equal customer consent.
- Customer consent does not equal settlement approval.
- Supervisor approval does not equal customer consent.
- Billing itemization does not equal payment / invoice.
- Settlement calculation does not equal settlement approval.
- Vendor / brand settlement rule does not equal customer-facing charge.
- Discount approval must be independently reviewable.
- Compensation approval must be independently reviewable.
- Service recovery decision must be independently reviewable.
- AI suggestion does not equal any approval.
- Payment / invoice runtime is outside Task263 scope.

This separation keeps customer-facing promises, internal settlement, finance approval, and operational evidence from blending into an unsafe workflow.

## Conceptual Workflow Components

The components below are conceptual only.

They are not:

- production workflow state,
- DB enum,
- API contract,
- generated client field,
- Admin UI option,
- runtime behavior.

Future conceptual components may include:

- billing item proposal,
- quote draft,
- quote review,
- quote sent,
- customer quote acceptance,
- customer fee consent,
- supervisor approval,
- discount approval,
- compensation / service recovery approval,
- settlement rule evaluation,
- settlement calculation,
- settlement adjustment,
- settlement approval,
- payment / invoice future handoff,
- dispute / correction review.

## Workflow Separation Matrix

This matrix is proposal-only.

All AI may approve values are No.

All Runtime allowed now values are No.

| Workflow step | Primary purpose | Actor category | Customer-visible? | Requires customer action? | Requires supervisor approval? | Affects customer charge? | Affects vendor settlement? | Requires audit? | AI may suggest? | AI may approve? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Billing item proposal | Identify possible charge / adjustment | Customer service, engineer, billing reviewer | Maybe | No | Maybe | Maybe | Maybe | Yes | Yes | No | No |
| Quote draft | Prepare proposed customer-facing quote | Customer service, billing reviewer | Not until sent | No | Maybe | Yes | Maybe | Yes | Yes | No | No |
| Quote review | Validate quote before sending | Supervisor, billing reviewer | No | No | Maybe | Yes | Maybe | Yes | Yes | No | No |
| Quote sent | Send quote to customer | Customer service / approved workflow | Yes | No immediate approval | Maybe before send | Yes | Maybe | Yes | Draft only | No | No |
| Customer quote acceptance | Customer accepts quote | Customer / customer-assisted channel | Yes | Yes | No by itself | Yes | Maybe | Yes | No | No | No |
| Customer fee consent | Record customer acceptance for charge | Customer / authorized recorder | Yes | Yes | No by itself | Yes | Maybe | Yes | Reminder only | No | No |
| Supervisor approval | Internal approval for exception | Supervisor / quality manager | No by default | No | Yes | Maybe | Maybe | Yes | Yes | No | No |
| Discount approval | Approve reduction in customer charge | Supervisor / finance | Maybe after approved | No customer action by itself | Yes | Yes | Maybe | Yes | Yes | No | No |
| Compensation / service recovery approval | Approve service recovery outcome | Supervisor / quality / finance | Maybe after approved | Maybe | Yes | Yes | Maybe | Yes | Yes | No | No |
| Settlement rule evaluation | Apply vendor / brand rule candidate | System / billing reviewer | No by default | No | Maybe | Maybe | Yes | Yes | Yes | No | No |
| Settlement calculation | Calculate internal settlement candidate | System / billing reviewer | No by default | No | Maybe | Maybe | Yes | Yes | Yes | No | No |
| Settlement adjustment | Modify settlement candidate | Billing / supervisor | No by default | No | Maybe | Maybe | Yes | Yes | Yes | No | No |
| Settlement approval | Approve internal settlement | Billing approver / finance | No by default | No | Maybe | No by itself | Yes | Yes | Yes | No | No |
| Payment / invoice future handoff | Future collection / invoice process | Finance / future payment workflow | Yes when future product supports | Maybe | Maybe | Yes | Maybe | Yes | No | No | No |
| Dispute / correction review | Review customer or internal dispute | Customer service, supervisor, finance | Maybe after approved | Maybe | Often | Maybe | Maybe | Yes | Yes | No | No |

## Customer Consent vs Quote Acceptance

Quote acceptance may be one source of customer consent, but it is not the only source.

Future principles:

- Onsite fee confirmation may create customer consent if traceable.
- Quote acceptance may create customer consent if traceable.
- Customer consent should preserve source.
- Customer consent should preserve time.
- Customer consent should preserve amount.
- Customer consent should preserve channel.
- Customer consent should preserve evidence reference where applicable.
- Quote changes may require renewed consent.
- Quote changes may require explicit policy.
- Customer rejection does not equal approval.
- Customer no response does not equal approval.
- AI must not accept quote for customer.

Consent should be a clear customer or authorized human action, not an inference.

## Settlement Approval Boundary

Settlement approval is an internal workflow.

Future principles:

- Settlement approval should not be customer-visible by default.
- Settlement approval should not change customer consent.
- Vendor settlement adjustment does not necessarily affect customer charge.
- Brand / vendor rule evaluation does not equal final approval.
- Settlement approval requires permission.
- Settlement approval requires organization scope.
- Settlement approval requires audit.
- AI may suggest settlement risk.
- AI must not approve settlement.

Internal settlement can depend on customer-facing events, but it must not rewrite those events.

## Discount / Compensation / Service Recovery Boundary

Discount, compensation, and service recovery should not be merged.

Future principles:

- Discount does not equal compensation.
- Compensation does not equal settlement adjustment.
- Service recovery may require supervisor approval.
- Customer-facing compensation message should appear only after approval.
- Complaint or low-rating workflow may create review need.
- Complaint or low-rating workflow must not automatically grant compensation.
- AI must not promise refund.
- AI must not promise discount.
- AI must not promise free service.
- AI must not approve service recovery.

Customer trust depends on not over-promising before approval.

## Appointment / Case / Report Context

Quote and fee workflow may reference appointment / dispatch visit context.

Principles:

- Multiple visits may exist under one Case.
- Pending parts belongs to appointment / dispatch visit layer.
- Customer unavailable belongs to appointment / dispatch visit layer.
- Cancellation belongs to appointment / dispatch visit layer.
- Unable-to-repair belongs to appointment / dispatch visit layer.
- Quote may reference appointment evidence.
- Settlement may reference appointment evidence.
- Field Service Report remains Case-level final summary.
- Quote must not create multiple formal Field Service Reports.
- Settlement must not create multiple formal Field Service Reports.
- `finalAppointmentId` remains backend / system determined.

Billing and settlement may reference the service history without changing the report invariant.

## Customer-visible vs Internal-only Separation

Customer-visible surfaces may include:

- sent quote,
- customer accepted quote status,
- customer rejected quote status,
- customer-approved fee,
- approved customer-facing discount explanation,
- approved customer-facing compensation explanation,
- safe payment / invoice future handoff wording.

Customer-visible surfaces must not include:

- internal settlement calculation,
- vendor / brand internal rule,
- internal margin / cost,
- supervisor internal note,
- AI settlement suggestion,
- audit log,
- permission detail,
- entitlement detail,
- raw diagnostics,
- provider diagnostic detail.

Customer-facing output should include only approved and safe business information.

## Permission / Entitlement Readiness

Future implementation must answer:

- Who can create quote?
- Who can send quote?
- Who can edit quote?
- Who can record customer acceptance?
- Who can approve discount?
- Who can approve compensation?
- Who can run settlement calculation?
- Who can approve settlement?
- Who can view vendor / brand internal settlement rule?
- Which advanced settlement workflows require entitlement?
- Does settlement export / report require usage tracking?
- Who can view customer-facing quote history?
- Who can view internal settlement adjustment?
- Who can void or correct a quote?

Task263 does not add permissions, entitlements, usage tracking, exports, feature gates, or runtime enforcement.

## Audit Readiness

Future audit event examples:

- `quote.drafted`,
- `quote.reviewed`,
- `quote.sent`,
- `quote.accepted_by_customer`,
- `quote.rejected_by_customer`,
- `quote.expired`,
- `customer_consent.linked_to_quote`,
- `supervisor_approval.requested`,
- `supervisor_approval.approved`,
- `supervisor_approval.rejected`,
- `discount.approved`,
- `discount.rejected`,
- `compensation.approved`,
- `compensation.rejected`,
- `settlement.calculated`,
- `settlement.adjusted`,
- `settlement.approved`,
- `settlement.rejected`,
- `ai.quote_suggestion.generated`,
- `ai.settlement_suggestion.accepted`,
- `ai.settlement_suggestion.rejected`,
- `ai.settlement_suggestion.edited`.

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
- raw LINE user ids,
- tokens,
- secrets,
- raw provider payloads,
- raw AI sensitive payloads,
- internal audit details on customer-visible surfaces.

## AI Advisory-only Boundary

AI can:

- help draft quote,
- remind quote is missing customer consent,
- compare quote amount and consent amount,
- flag settlement discrepancy,
- compare brand / vendor rule,
- draft customer-facing quote explanation,
- organize supervisor review context,
- summarize appointment evidence for human review.

AI cannot:

- send quote automatically,
- accept quote automatically,
- approve quote,
- consent for customer,
- approve settlement,
- approve discount,
- approve compensation,
- promise refund,
- promise discount,
- promise free service,
- modify Case official status,
- modify Appointment official status,
- modify Field Service Report official status,
- choose `finalAppointmentId`,
- write uncertain content into official billing / settlement record.

AI may help prepare review material. It must not approve or promise money.

## Explicit Non-goals

Task263 does not:

- create quote table,
- create approval table,
- create settlement table,
- create billing item table,
- create customer consent table,
- add migration,
- change schema,
- add index,
- add API,
- modify backend source,
- modify Admin source,
- add quote runtime,
- add billing runtime,
- add settlement runtime,
- add approval workflow runtime,
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

- Quote status lifecycle proposal / no migration.
- Customer consent and quote linkage matrix.
- Supervisor approval workflow policy.
- Discount / compensation approval policy.
- Settlement calculation vs settlement approval matrix.
- Vendor / brand rule evaluation policy.
- Quote customer-visible copy policy.
- Quote / settlement permission matrix.
- Quote / settlement audit event catalog hardening.
- Quote / settlement runtime readiness gate.

These are future candidates only. Task263 does not execute them.
