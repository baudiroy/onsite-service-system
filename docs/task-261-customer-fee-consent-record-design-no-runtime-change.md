# Task 261 - Customer Fee Consent Record Design / No Runtime Change

## Purpose And Scope

This document defines future customer fee consent record design boundaries for onsite field service billing, quote, appointment, and Case workflows.

Task261 is documentation-only.

This task is not:

- customer consent runtime implementation,
- billing runtime implementation,
- quote runtime implementation,
- payment / invoice implementation,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation,
- AI auto-decision engine.

Task261 does not add customer consent tables, consent evidence tables, billing item tables, quote tables, APIs, Admin UI, migrations, schema, file storage runtime, audit runtime, permission runtime, entitlement runtime, usage runtime, billing runtime, settlement runtime, quote runtime, payment runtime, invoice runtime, or automated tests.

## Core Consent Principles

Customer fee consent must be traceable and structured.

Future principles:

- Customer fee consent must not exist only in a note.
- Customer fee consent must be traceable.
- Consent should record source.
- Consent should record time.
- Consent should record amount.
- Consent should record channel.
- Consent should record evidence where applicable.
- Consent record should link to fee item, quote, appointment, dispatch visit, or Case context.
- Customer consent does not equal internal settlement approval.
- Quote acceptance does not equal payment completion.
- AI must not consent for customer.
- Engineer workflow must not become an overly complex form.

The goal is to reduce later disputes without pushing finance and legal complexity onto the engineer in the field.

## Conceptual Consent Record Fields

The metadata below is conceptual only.

It is not:

- DB columns,
- migration proposal,
- API schema,
- production enum,
- generated client field,
- Admin UI contract.

Future consent metadata may include:

- consent reference,
- organization reference,
- Case reference,
- appointment / dispatch visit reference,
- billing item reference,
- quote reference,
- customer reference,
- consent amount,
- currency category,
- consent source,
- consent channel,
- consent time,
- consent evidence reference,
- consent wording version,
- actor / recorder reference,
- customer-visible status,
- internal review status,
- revocation / dispute marker,
- audit reference.

Metadata should preserve accountability while avoiding raw sensitive payload in primary business records or logs.

## Consent Source And Channel Categories

The categories below are proposal-only.

They are not:

- production enum,
- DB field,
- API contract,
- Admin UI option,
- runtime behavior.

Future consent sources / channels may include:

- on-site customer confirmation,
- LINE confirmation,
- SMS confirmation,
- email confirmation,
- web link confirmation,
- web portal confirmation,
- APP confirmation,
- phone call confirmation,
- customer signature,
- support-assisted confirmation,
- quote acceptance,
- pre-approved service request consent.

Design notes:

- LINE is currently the main entry, but consent design must not hard-code LINE as the only channel.
- Full customer mobile values must not be logged.
- Raw LINE user id must not be exposed in reports, handoffs, customer-visible output, or unsafe logs.
- Tokens, access tokens, and channel secrets must not be stored in notes or logs.
- Signature binary, recording, screenshot, and large evidence files should use future file / object storage, not primary business tables.
- Evidence records should store safe references and metadata, not raw sensitive payload in logs.

## Consent Amount And Item Linkage

Consent should apply to a clear item, amount, and scope.

Future principles:

- Consent should map to a specific amount or amount range.
- Consent should map to a specific fee item, quote item, or service scope.
- New fee item may require new consent or explicit policy.
- Changed amount may require renewed consent or explicit policy.
- Discount approval does not equal customer consent.
- Compensation approval does not equal customer consent.
- Vendor settlement adjustment is not necessarily customer-visible.
- Vendor settlement adjustment does not necessarily require customer consent.
- Internal-only fee adjustment should not be shown to customer by default.

If the platform cannot identify which fee the customer accepted, the consent is weak and should not be treated as strong approval without review.

## Appointment / Case Context

Customer fee consent may reference appointment context, but the final service report remains Case-level.

Principles:

- Multi-visit outcomes belong to appointment / dispatch visit level.
- Consent may link to a specific appointment / dispatch visit when the fee arises onsite.
- Consent may link to Case-level quote or billing item when the fee applies to the overall job.
- Field Service Report remains Case-level final summary.
- Multiple consent records must not create multiple formal Field Service Reports.
- Multiple appointments must not create multiple formal Field Service Reports.
- `finalAppointmentId` remains backend / system determined.

Billing evidence can span multiple visits. It must not redefine the Case/report model.

## Customer-visible vs Internal-only Separation

Customer-visible surfaces may include:

- customer-approved amount,
- fee item explanation,
- consent time,
- safe channel description,
- approved quote explanation,
- approved charge explanation,
- customer-facing receipt or confirmation where future product supports it.

Customer-visible surfaces must not include:

- internal settlement rule,
- vendor internal adjustment,
- internal margin / cost,
- supervisor internal note,
- AI suggestion,
- audit log,
- raw provider payload,
- token,
- secret,
- raw LINE user id,
- full internal diagnostic,
- provider credential,
- SaaS plan / entitlement detail.

Internal data can support review and dispute handling. It must not leak into customer-facing output.

## Consent Dispute / Revocation Readiness

Future design must decide how disputes and revocation work.

Future questions:

- Can customer revoke consent?
- Does revocation depend on quote status?
- Does revocation depend on whether work has started?
- Does revocation depend on whether work is completed?
- How should dispute be recorded?
- When is supervisor review required?
- How should post-completion dispute differ from service recovery?
- How should post-completion dispute differ from settlement adjustment?
- Should a disputed consent suppress customer charge until reviewed?
- Should a disputed consent create quality / complaint follow-up?

Principles:

- Dispute must not automatically change Case official status.
- Dispute must not automatically change Appointment official status.
- Dispute must not automatically change Field Service Report official status.
- AI may summarize dispute.
- AI must not decide fault.
- AI must not approve compensation.

## Permission / Entitlement Readiness

Future implementation must answer:

- Who can record customer consent?
- Who can view consent evidence?
- Who can modify consent?
- Who can void consent?
- Who can handle dispute?
- Who can approve fee changes?
- Who can view internal settlement impact?
- Which advanced consent workflows require entitlement?
- Does consent evidence storage require usage tracking?
- Which roles can expose consent evidence to customer?
- Which roles can attach file evidence?
- Which roles can export consent records?

Task261 does not add permissions, entitlements, usage tracking, file storage, exports, or feature gates.

## Audit Readiness

Future audit event examples:

- `customer_fee_consent.requested`,
- `customer_fee_consent.recorded`,
- `customer_fee_consent.evidence_attached`,
- `customer_fee_consent.viewed`,
- `customer_fee_consent.disputed`,
- `customer_fee_consent.voided`,
- `customer_fee_consent.amount_changed`,
- `quote.accepted_by_customer`,
- `customer_fee_consent.evidence_redacted`,
- `ai.consent_summary.generated`,
- `ai.consent_risk.flagged`,
- `ai.consent_suggestion.accepted`,
- `ai.consent_suggestion.rejected`.

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

Audit should record safe categories and actor accountability, not raw consent evidence payload.

## AI Advisory-only Boundary

AI can:

- summarize consent record,
- remind missing consent evidence,
- compare quote amount and consent amount,
- flag dispute risk,
- draft customer-facing fee explanation,
- identify possible consent mismatch,
- suggest evidence categories for human review.

AI cannot:

- consent for customer,
- create official consent automatically,
- change consent amount automatically,
- void consent automatically,
- approve quote,
- approve settlement,
- approve discount,
- approve compensation,
- decide dispute result,
- modify Case official status,
- modify Appointment official status,
- modify Field Service Report official status,
- choose `finalAppointmentId`,
- write uncertain content into official consent record.

Customer consent requires traceable customer or authorized human action. AI can assist the review only.

## Explicit Non-goals

Task261 does not:

- create customer consent table,
- create consent evidence table,
- create billing item table,
- create quote table,
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
- add file / object storage runtime,
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

- Customer fee consent evidence storage policy.
- Customer fee consent source/channel matrix.
- Customer fee consent permission matrix.
- Customer fee consent safe-deny and redaction policy.
- Quote acceptance and consent linkage design.
- Consent dispute workflow design.
- Consent audit event catalog hardening.
- Customer-visible consent copy policy.
- Customer consent first-release subset decision packet.
- Customer fee consent runtime readiness gate.

These are future candidates only. Task261 does not execute them.
