# Task 262 - Floor / Carrying / Remote Fee Policy Matrix / No Runtime Change

## Purpose And Scope

This document defines a proposal-only policy matrix for future floor fee, carrying / handling fee, remote area fee, parking / access fee, and special onsite condition surcharges.

Task262 is documentation-only.

This task is not:

- fee calculation runtime implementation,
- billing runtime implementation,
- quote runtime implementation,
- customer consent runtime implementation,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- engineer mobile form implementation,
- automated test implementation,
- AI auto-decision engine.

Task262 does not add fee factor tables, billing item tables, customer consent tables, quote tables, APIs, Admin UI, migrations, schema, fee calculation runtime, billing runtime, settlement runtime, quote runtime, file / object storage runtime, engineer mobile forms, audit runtime, permission runtime, entitlement runtime, usage runtime, or automated tests.

## Core Added-fee Principles

Floor / carrying / added-fee design should serve the onsite service workflow.

Principles:

- The core design should not ask only "does the customer need engineer carrying help."
- The system should record floor, elevator, carrying difficulty, onsite condition, fee confirmation, and customer consent where applicable.
- Fee rules must be configurable.
- Fee rules must not be hard-coded.
- Different brands may have different rules.
- Different vendors may have different rules.
- Different service categories may have different rules.
- Engineer workflow must not become an overly complex form.
- AI may help organize onsite conditions.
- AI must not automatically charge customer.
- AI must not automatically quote.
- AI must not automatically approve.
- AI must not consent for customer.

Added-fee design should reduce surprise and dispute while keeping field operations practical.

## Proposal-only Fee Factor Categories

The categories below are conceptual only.

They are not:

- production enum,
- DB field,
- API contract,
- generated client field,
- Admin UI option,
- runtime behavior.

Future fee factor categories may include:

- floor count,
- elevator availability,
- elevator size / accessibility,
- stair-only access,
- long-distance carrying,
- heavy item handling,
- bulky item handling,
- narrow hallway / stairs,
- parking difficulty,
- building access restriction,
- remote area,
- special area surcharge,
- urgent / after-hours handling,
- second visit due to access issue,
- customer-requested additional handling,
- unsafe / impossible carrying condition.

## Policy Matrix

This matrix is proposal-only.

All AI may auto-approve values are No.

All Runtime allowed now values are No.

| Fee factor | Typical evidence | Appointment-level context? | Customer-visible? | Requires customer consent? | Requires quote? | Requires supervisor approval? | May affect vendor settlement? | May affect customer charge? | AI may suggest? | AI may auto-approve? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Floor count | Address, customer confirmation, onsite note | Yes | Yes, if fee applies | Yes if extra charge | Maybe | Maybe | Maybe | Yes | Yes | No | No |
| Elevator availability | Customer confirmation, onsite note, photo reference | Yes | Yes, if fee applies | Yes if extra charge | Maybe | Maybe | Maybe | Yes | Yes | No | No |
| Elevator size / accessibility | Onsite note, photo reference | Yes | Yes, if fee applies | Yes if extra charge | Maybe | Maybe | Maybe | Yes | Yes | No | No |
| Stair-only access | Customer confirmation, onsite note | Yes | Yes | Yes if extra charge | Maybe | Maybe | Maybe | Yes | Yes | No | No |
| Long-distance carrying | Onsite note, access description | Yes | Yes, if charged | Yes if extra charge | Maybe | Maybe | Maybe | Yes | Yes | No | No |
| Heavy item handling | Product/service type, onsite note | Yes | Yes, if charged | Yes if extra charge | Maybe | Maybe | Maybe | Yes | Yes | No | No |
| Bulky item handling | Product/service type, onsite note | Yes | Yes, if charged | Yes if extra charge | Maybe | Maybe | Maybe | Yes | Yes | No | No |
| Narrow hallway / stairs | Onsite note, photo reference | Yes | Yes, if charged | Yes if extra charge | Maybe | Maybe | Maybe | Yes | Yes | No | No |
| Parking difficulty | Onsite note, parking receipt reference | Yes | Maybe | Maybe | Usually no | Maybe | Maybe | Maybe | Yes | No | No |
| Building access restriction | Customer/building note, onsite note | Yes | Maybe | Maybe | Maybe | Maybe | Maybe | Maybe | Yes | No | No |
| Remote area | Address / route policy | Case-level and dispatch context | Yes, if charged | Yes if extra charge | Maybe | Maybe | Maybe | Yes | Yes | No | No |
| Special area surcharge | Region / access policy | Case-level and appointment context | Yes, if charged | Yes if extra charge | Maybe | Maybe | Maybe | Yes | Yes | No | No |
| Urgent / after-hours handling | Customer request, scheduling record | Case-level and appointment context | Yes | Yes if extra charge | Maybe | Maybe | Maybe | Yes | Yes | No | No |
| Second visit due to access issue | Prior appointment result | Yes | Yes, if charged | Often yes | Maybe | Maybe | Yes | Yes | Yes | No | No |
| Customer-requested additional handling | Customer request, onsite note | Yes | Yes | Yes | Maybe | Maybe | Maybe | Yes | Yes | No | No |
| Unsafe / impossible carrying condition | Onsite note, supervisor review, photo reference | Yes | Safe summary only | Usually review before charge | Maybe | Often yes | Maybe | Maybe | Yes | No | No |

## Appointment / Dispatch Visit Context

Onsite conditions should be recorded at appointment / dispatch visit context.

Principles:

- Different visits may have different onsite conditions.
- Pending parts belongs to appointment / dispatch visit layer.
- Customer unavailable belongs to appointment / dispatch visit layer.
- Cancellation belongs to appointment / dispatch visit layer.
- Cannot carry belongs to appointment / dispatch visit layer.
- Cannot enter belongs to appointment / dispatch visit layer.
- Field Service Report remains Case-level final summary.
- Floor / carrying fee must not create multiple formal Field Service Reports.
- Multi-visit billing context must not create multiple formal Field Service Reports.
- `finalAppointmentId` remains backend / system determined.

The billing workflow may reference appointment evidence without changing the report model.

## Customer Consent And Quote Boundary

Customer-facing added fees require clear consent or quote acceptance when charged.

Future principles:

- Added fee charged to customer should have customer consent or quote acceptance.
- Onsite condition changes may require fee reconfirmation.
- Customer consent does not equal internal settlement approval.
- Quote approval does not equal payment completion.
- Internal vendor settlement adjustment is not necessarily customer-visible.
- Customer consent record should preserve source.
- Customer consent record should preserve time.
- Customer consent record should preserve amount.
- Customer consent record should preserve channel.
- Customer consent record should preserve evidence reference where applicable.
- AI must not consent for customer.

Task262 does not add consent runtime or quote runtime.

## Evidence And File Storage Boundary

Future evidence categories may include:

- customer confirmation,
- onsite note,
- masked channel confirmation,
- photo reference,
- signature reference,
- building / access note,
- supervisor approval reference.

Evidence principles:

- Photos should use future file / object storage.
- Signatures should use future file / object storage.
- Recordings should use future file / object storage.
- Documents should use future file / object storage.
- Large evidence should not be stored in primary business tables.
- Evidence metadata should be safe and redacted.

Task262 does not add file / object storage runtime.

## Customer-visible vs Internal-only Separation

Customer-visible surfaces may include:

- approved floor / carrying / remote fee explanation,
- customer-approved amount,
- safe quote wording,
- safe fee confirmation wording,
- customer-visible access-condition summary,
- approved discount or compensation wording where policy permits.

Customer-visible surfaces must not include:

- internal vendor settlement rule,
- internal margin / cost,
- supervisor internal note,
- engineer internal comment,
- AI suggestion,
- audit log,
- provider diagnostics,
- raw evidence payload,
- raw LINE user id,
- full customer mobile,
- token,
- secret,
- internal risk score.

Customer-facing explanations should be clear, respectful, and not expose internal cost logic.

## Permission / Entitlement Readiness

Future implementation must answer:

- Who can record floor / carrying factors?
- Who can create added-fee item?
- Who can edit added-fee amount?
- Who can request customer consent?
- Who can approve special added fee?
- Who can view internal settlement impact?
- Which advanced fee policies require plan entitlement?
- Does evidence storage require usage tracking?
- Who can view evidence attachments?
- Who can export added-fee records?
- Which roles can override AI added-fee suggestion?

Task262 does not add permissions, entitlements, usage tracking, evidence storage, exports, or feature gates.

## Audit Readiness

Future audit event examples:

- `added_fee.factor_recorded`,
- `added_fee.suggested`,
- `added_fee.proposed`,
- `added_fee.customer_visible_marked`,
- `added_fee.consent_requested`,
- `added_fee.consent_recorded`,
- `added_fee.quote_required_marked`,
- `added_fee.supervisor_approval_requested`,
- `added_fee.supervisor_approved`,
- `added_fee.supervisor_rejected`,
- `added_fee.included_in_settlement`,
- `ai.added_fee_suggestion.generated`,
- `ai.added_fee_suggestion.accepted`,
- `ai.added_fee_suggestion.rejected`,
- `ai.added_fee_suggestion.edited`.

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

- organize onsite conditions,
- remind possible added-fee factors,
- remind that customer consent may be needed,
- compare brand / vendor fee policy for human review,
- draft customer-facing fee explanation,
- flag missing evidence,
- summarize appointment context for review.

AI cannot:

- create official added fee automatically,
- change added-fee amount automatically,
- mark customer consent automatically,
- send quote automatically,
- approve quote,
- approve settlement,
- approve discount,
- approve compensation,
- modify Case official status,
- modify Appointment official status,
- modify Field Service Report official status,
- choose `finalAppointmentId`,
- write uncertain onsite condition into official billing / settlement record.

AI may support review. It must not charge, approve, or consent.

## Explicit Non-goals

Task262 does not:

- create fee factor table,
- create billing item table,
- create customer consent table,
- create quote table,
- add fee calculation runtime,
- add billing runtime,
- add settlement runtime,
- add quote runtime,
- add file / object storage runtime,
- add migration,
- change schema,
- add index,
- add API,
- modify backend source,
- modify Admin source,
- add engineer mobile form,
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

- Floor / carrying / remote fee first-release subset decision packet.
- Added-fee customer consent copy policy.
- Added-fee permission matrix.
- Added-fee evidence storage policy.
- Added-fee audit event catalog hardening.
- Added-fee safe-deny and redaction policy.
- Brand / vendor added-fee rule proposal / no migration.
- Engineer mobile added-fee UX requirements / no code change.
- Added-fee quote linkage design.
- Added-fee runtime readiness gate.

These are future candidates only. Task262 does not execute them.
