# Task 264 - Settlement Calculation vs Approval Matrix / No Runtime Change

## Purpose And Scope

This document defines future boundaries between settlement calculation and settlement approval.

Task264 is documentation-only.

This task is not:

- settlement runtime implementation,
- settlement calculation engine,
- approval workflow implementation,
- billing runtime implementation,
- quote runtime implementation,
- payment / invoice implementation,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation,
- AI auto-decision engine.

Task264 does not add settlement tables, settlement calculation tables, approval tables, billing item tables, quote tables, customer consent tables, APIs, Admin UI, migrations, schema, settlement runtime, calculation engine, approval workflow runtime, billing runtime, quote runtime, payment runtime, invoice runtime, audit runtime, permission runtime, entitlement runtime, usage runtime, or automated tests.

## Core Separation Principles

Settlement calculation is not settlement approval.

Future principles:

- Settlement calculation does not equal settlement approval.
- Settlement rule evaluation does not equal settlement approval.
- Vendor / brand rule match is not final payable approval.
- AI settlement suggestion does not equal settlement approval.
- Customer consent does not equal settlement approval.
- Quote approval does not equal settlement approval.
- Supervisor review does not equal finance approval unless future policy explicitly defines it.
- Payment / invoice is separate from settlement approval.
- Settlement approval requires permission.
- Settlement approval requires organization scope.
- Settlement approval requires audit.
- Settlement approval requires human approval or an explicitly approved deterministic workflow.

The platform may eventually calculate a draft amount. That draft must not become payable merely because it was calculated.

## Conceptual Settlement Components

The components below are conceptual only.

They are not:

- production workflow state,
- DB enum,
- API contract,
- generated client field,
- Admin UI option,
- runtime behavior.

Future conceptual components may include:

- settlement input collection,
- billing item inclusion,
- appointment / visit context review,
- warranty / goodwill classification,
- brand rule evaluation,
- vendor rule evaluation,
- calculation draft,
- adjustment proposal,
- exception review,
- supervisor review,
- finance approval,
- vendor settlement approval,
- settlement correction,
- settlement void / reopen review.

## Calculation vs Approval Matrix

This matrix is proposal-only.

All AI may approve values are No.

All Runtime allowed now values are No.

| Action / concept | Actor | Purpose | Customer-visible or internal-only | May affect official settlement amount | Requires human approval | AI may suggest | AI may approve | Runtime allowed now |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Settlement input collection | System-assisted future workflow / billing reviewer | Gather eligible Case, appointment, report, itemization, quote, consent, and rule context | Internal-only by default | Indirectly, as evidence | Yes for final use | Yes | No | No |
| Billing item inclusion | Billing reviewer / future deterministic workflow | Decide which itemization entries belong in settlement draft | Internal-only by default | Yes | Yes unless future deterministic rule approved | Yes | No | No |
| Appointment / visit context review | Billing reviewer / supervisor | Review multi-visit outcomes, pending parts, no-show, cancellation, or final service context | Internal-only by default | May affect | Yes | Yes | No | No |
| Warranty / goodwill classification | Billing reviewer / supervisor | Classify warranty-covered, goodwill, compensation, or chargeable context | Maybe customer-visible after approval | Yes | Yes | Yes | No | No |
| Brand rule evaluation | Future calculation engine / billing reviewer | Match draft settlement against brand rule | Internal-only by default | Draft only | Yes for approval | Yes | No | No |
| Vendor rule evaluation | Future calculation engine / billing reviewer | Match draft settlement against vendor rule | Internal-only by default | Draft only | Yes for approval | Yes | No | No |
| Calculation draft | Future calculation engine / billing reviewer | Produce draft payable / receivable candidate | Internal-only by default | Draft only | Yes | Yes | No | No |
| Adjustment proposal | Billing reviewer / supervisor | Propose manual adjustment or exception | Internal-only by default | Yes if approved | Yes | Yes | No | No |
| Exception review | Supervisor / finance reviewer | Review unusual, disputed, high-value, or policy-mismatch cases | Internal-only by default | May affect | Yes | Yes | No | No |
| Supervisor review | Supervisor / quality manager | Review operational exception, service recovery, or policy exception | Internal-only by default | May affect | Yes | Yes | No | No |
| Finance approval | Finance / settlement approver | Approve final settlement outcome | Internal-only by default | Yes | Yes | No by default | No | No |
| Vendor settlement approval | Finance / vendor settlement reviewer | Approve payable/receivable with vendor-facing context | Internal-only unless vendor portal policy exists | Yes | Yes | Yes | No | No |
| Settlement correction | Finance / authorized reviewer | Correct approved settlement under future policy | Internal-only by default | Yes | Yes | Yes | No | No |
| Settlement void / reopen review | Finance / authorized reviewer | Review whether settlement can be voided or reopened | Internal-only by default | Yes if approved | Yes | Yes | No | No |
| Customer consent | Customer / authorized recorder | Record customer agreement to charge | Customer-visible | Does not approve settlement | Yes as consent evidence | Reminder only | No | No |
| Quote approval / acceptance | Customer / customer service / supervisor depending policy | Approve customer-facing quote or quote workflow | Customer-visible when sent/accepted | May affect customer charge, not settlement approval by itself | Yes | Yes | No | No |
| Payment / invoice handoff | Future finance workflow | Future collection / invoice process after approval | Customer-visible when future product supports | Separate from settlement approval | Yes | No | No | No |

## Inputs To Settlement Calculation

Future settlement calculation may consider:

- Case context,
- appointment / dispatch visit outcomes,
- final completed appointment context,
- Field Service Report final summary,
- billing itemization,
- customer fee consent,
- quote acceptance,
- warranty status,
- brand / vendor rules,
- discount / compensation approval,
- parts / labor / visit data,
- exception / dispute notes.

Principles:

- Settlement may reference multiple appointments.
- Settlement may reference multi-visit history.
- Settlement may reference appointment-level onsite outcomes.
- Settlement must not create multiple formal Field Service Reports.
- Settlement must not treat appointment count as report count.
- `finalAppointmentId` remains backend / system determined.
- AI must not decide the final appointment.
- AI must not decide settlement input truth.
- Draft input mismatch should trigger human review, not automatic approval.

## Approval Boundary

Settlement approval is a controlled internal decision.

Future principles:

- Calculation draft may be generated by future system runtime, but is not approval.
- AI suggestion may flag discrepancy, but is not approval.
- Human approval requires permission.
- Human approval requires role / responsibility.
- Human approval requires organization scope.
- Approval requires audit.
- Adjustment requires reason.
- Reopen settlement requires future policy.
- Void settlement requires future policy.
- Settlement approval must not modify customer consent.
- Settlement approval must not modify quote status.
- Settlement approval must not modify Case official status by default.
- Settlement approval must not modify Appointment official status by default.
- Settlement approval must not modify Field Service Report official status by default.

If future workflow links settlement approval to other state changes, that must be a separate explicit design and runtime approval.

## Customer-visible vs Internal-only Separation

Customer-visible surfaces may include:

- approved and customer-disclosable fee,
- customer-approved fee,
- customer consent summary,
- approved discount explanation,
- approved compensation explanation,
- safe quote explanation,
- safe payment / invoice future handoff wording.

Customer-visible surfaces must not include:

- vendor settlement calculation,
- internal settlement adjustment,
- internal margin / cost,
- brand / vendor internal rule,
- finance approval note,
- AI settlement suggestion,
- audit log,
- permission detail,
- entitlement detail,
- raw diagnostics,
- provider diagnostic detail.

Vendor-facing surfaces, if future product adds them, must also follow organization scope, vendor scope, permission, contract visibility, and redaction policy.

## Permission / Entitlement Readiness

Future implementation must answer:

- Who can view settlement calculation draft?
- Who can rerun settlement calculation?
- Who can include or exclude billing item?
- Who can propose settlement adjustment?
- Who can edit adjustment reason?
- Who can approve settlement?
- Who can reject settlement?
- Who can void settlement?
- Who can reopen settlement?
- Who can view vendor / brand internal rule?
- Who can view internal margin / cost?
- Which advanced settlement rules require entitlement?
- Which settlement export / report features require usage tracking?

Task264 does not add permissions, entitlements, usage tracking, exports, feature gates, or runtime enforcement.

## Audit Readiness

Future audit event examples:

- `settlement.calculation_requested`,
- `settlement.calculation_generated`,
- `settlement.rule_evaluated`,
- `settlement.discrepancy_detected`,
- `settlement.adjustment_proposed`,
- `settlement.adjustment_edited`,
- `settlement.approval_requested`,
- `settlement.approved`,
- `settlement.rejected`,
- `settlement.reopened`,
- `settlement.voided`,
- `ai.settlement_suggestion.generated`,
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

Audit should prove calculation and approval were distinct events where future workflow requires separation.

## AI Advisory-only Boundary

AI can:

- organize settlement inputs,
- compare billing item, quote, consent, and appointment context,
- flag calculation discrepancy,
- compare brand / vendor rules for human review,
- draft settlement review note,
- remind missing approval,
- remind missing customer consent,
- identify missing evidence categories.

AI cannot:

- calculate and approve settlement automatically,
- approve settlement adjustment,
- approve discount,
- approve compensation,
- modify customer consent,
- modify quote status,
- modify Case official status,
- modify Appointment official status,
- modify Field Service Report official status,
- choose `finalAppointmentId`,
- promise customer refund,
- promise customer discount,
- write uncertain content into official settlement record.

AI can help reviewers see risk. It cannot become finance approval.

## Explicit Non-goals

Task264 does not:

- create settlement table,
- create settlement calculation table,
- create approval table,
- create billing item table,
- create quote table,
- create customer consent table,
- add settlement calculation engine,
- add approval workflow runtime,
- add billing runtime,
- add settlement runtime,
- add quote runtime,
- add payment runtime,
- add invoice runtime,
- add migration,
- change schema,
- add index,
- add API,
- modify backend source,
- modify Admin source,
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

- Settlement input source matrix.
- Settlement approval permission matrix.
- Settlement calculation discrepancy policy.
- Vendor / brand rule evaluation policy.
- Settlement adjustment reason taxonomy.
- Settlement correction / void / reopen policy.
- Settlement customer-visible copy policy.
- Settlement audit event catalog hardening.
- Settlement export and report permission policy.
- Settlement runtime readiness gate.

These are future candidates only. Task264 does not execute them.
