# Task 317 - Customer Fee Consent Implementation Readiness Detail / No Runtime Change

## Scope And Non-goals

This document follows Task311 through Task316 and creates a docs-only implementation readiness detail packet for the next MVP candidate: customer fee consent future runtime readiness.

Task317 does not approve implementation. It documents the fee consent boundary, consent source, amount / scope / channel / evidence questions, quote / settlement separation, API/schema/test/security gates, and future approval requirements that must be reviewed before any customer fee consent runtime work is considered.

This task is not:

- backend runtime,
- Admin runtime,
- API contract change,
- migration,
- schema change,
- index change,
- DB / DDL execution,
- customer fee consent runtime,
- quote runtime,
- billing runtime,
- settlement runtime,
- payment runtime,
- invoice runtime,
- customer channel identity runtime,
- reverse binding runtime,
- verification runtime,
- notification runtime,
- Case runtime change,
- Appointment runtime change,
- Field Service Report runtime change,
- AI / RAG runtime,
- provider sending,
- report / export / download runtime,
- test / smoke implementation,
- fixture change,
- package change.

Task317 does not modify backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, migrations, schema, indexes, smoke scripts, fixtures, package configuration, provider integrations, AI runtime, inventory documentation, or shared runtime data.

## Why This Follows Task316

Task316 documented customer-visible service result summary readiness. Customer fee consent follows because fee information may eventually be shown to customers, but showing a fee is not the same as capturing customer consent.

The future system must prevent confusion between:

- fee display,
- customer fee consent,
- quote approval,
- settlement approval,
- payment / invoice handoff,
- internal vendor payout,
- SaaS or provider usage cost.

Customer fee consent is an evidence and customer-communication boundary. It must be traceable, customer-scoped, channel-scoped, permission-aware, and separated from internal finance approval.

Task317 keeps this as a future-only readiness packet and does not change current runtime.

## Core Invariants To Protect

Future implementation must preserve these invariants:

1. Customer fee consent must not be stored only in a note.
2. Customer fee consent is not the same as quote approval.
3. Customer fee consent is not the same as settlement approval.
4. Quote approval is not the same as finance settlement approval.
5. Fee display is not consent.
6. Engineer users must not consent on behalf of the customer.
7. AI must not consent to fees on behalf of the customer.
8. AI must not approve quotes, billing, settlement, payment, or invoice actions.
9. Customer-visible fee amount must not expose internal billing rules, settlement rules, vendor payout, SaaS cost, or provider usage cost.
10. Fee consent must be future-traceable by source, time, amount, scope, channel, actor, evidence, and audit trail.
11. Customer channel identity and verification must use safe-deny / non-enumeration before any customer-facing consent action.
12. Organization isolation and Data Access Control must apply to every consent read and write.

## Current Readiness Questions / Docs-only

Before any future customer fee consent runtime task is approved, PM and engineering should answer the following questions.

### Fee Types That May Need Consent

Questions:

- Which base service fees require consent?
- Which floor fee / carrying fee cases require consent?
- Which remote area fees require consent?
- Which parts or material estimates require consent?
- Which second visit fees require consent?
- Which onsite addon or installation extra fees require consent?
- Which warranty-outside-scope fees require consent?
- Which high amount repair estimates require quote workflow instead of simple consent?

### Future Consent Source Channels

Potential consent sources may include:

- LINE customer confirmation,
- App / Web portal confirmation,
- SMS link confirmation,
- email link confirmation,
- phone confirmation recorded by authorized staff,
- onsite signature,
- admin manual record with evidence,
- customer support recorded follow-up.

Each source requires its own verification, evidence, audit, and non-enumeration design before runtime is approved.

### Amount / Scope / Version / Evidence

Future implementation should decide how to record:

- consent amount,
- currency,
- fee item scope,
- case_id,
- appointment_id if applicable,
- Field Service Report id if applicable,
- quote id if applicable,
- fee rule version if applicable,
- customer-visible wording version,
- consent channel,
- evidence attachment or reference,
- customer actor / verified customer identity reference,
- staff recorder if manual,
- approved_at / declined_at / corrected_at,
- audit log.

### Display / Consent / Quote / Settlement Separation

Future implementation must define:

- fee display means the customer saw a fee,
- consent means the customer accepted the fee scope,
- quote approval means the customer accepted a quoted work package,
- settlement approval means finance/admin approved internal calculation,
- invoice/payment handoff means the payment flow may proceed.

These concepts must not be collapsed into one field or one status.

### Declined Fee / Dispute / Partial Consent

Future implementation should define:

- customer declined fee,
- fee dispute noted,
- partial consent,
- consent corrected,
- consent revoked, if future policy supports it,
- supervisor review required,
- customer callback required,
- quote required instead of simple consent.

These states must be auditable and must not overwrite prior consent silently.

### API / Schema / Evidence Questions

Future runtime approval must answer:

- Which endpoint can display customer-visible fee details?
- Which endpoint can capture consent?
- Which endpoint can record manual consent evidence?
- Which roles can record phone or onsite consent?
- What evidence metadata is required?
- Does consent require a new table, event, file reference, or audit event?
- How does Data Access prevent cross-organization consent lookup?
- How does safe-deny avoid revealing hidden Case existence?
- How are internal billing / settlement details excluded from customer-visible fee display?

Task317 does not approve endpoint, schema, evidence model, or runtime changes.

### Future Smoke / Regression Tests

Future runtime work should include targeted tests or smoke coverage for:

- fee display does not count as consent,
- customer consent creates traceable evidence only after verified action,
- engineer cannot consent on behalf of customer,
- AI cannot consent or approve fee,
- quote approval does not approve settlement,
- settlement approval is not triggered by customer consent,
- internal billing / vendor payout is not exposed to customer,
- consent dispute preserves previous consent evidence,
- cross-organization consent access is rejected,
- safe-deny avoids Case existence enumeration on customer channel verification failure.

Task317 does not add or modify tests.

## Future-only Consent Scenario Matrix

`Runtime approved now` is `No` for every row. `AI may consent / approve` is `No` for every row.

| Scenario | Business meaning | Customer-visible? | Requires explicit consent? | Requires quote workflow? | May affect settlement? | May affect payment / invoice? | Evidence required? | Requires audit readiness? | Requires API change? | Requires schema/evidence model? | AI may suggest wording? | AI may consent / approve? | Runtime approved now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Base service fee consent | Customer accepts basic service fee scope. | Yes | Yes | Future-only maybe | Future-only maybe | Future-only maybe | Yes | Yes | Future-only yes | Future-only yes | Yes | No | No |
| Floor fee consent | Customer accepts floor / no-elevator related fee. | Yes | Yes | Future-only maybe | Future-only yes | Future-only maybe | Yes | Yes | Future-only yes | Future-only yes | Yes | No | No |
| Carrying fee consent | Customer accepts carrying / handling fee. | Yes | Yes | Future-only maybe | Future-only yes | Future-only maybe | Yes | Yes | Future-only yes | Future-only yes | Yes | No | No |
| Remote fee consent | Customer accepts remote area fee. | Yes | Yes | Future-only maybe | Future-only yes | Future-only maybe | Yes | Yes | Future-only yes | Future-only yes | Yes | No | No |
| Parts / material estimate consent | Customer accepts estimated parts/material fee scope. | Yes | Yes | Future-only maybe | Future-only yes | Future-only maybe | Yes | Yes | Future-only yes | Future-only yes | Yes | No | No |
| Second visit fee consent | Customer accepts a second visit fee. | Yes | Yes | Future-only maybe | Future-only yes | Future-only maybe | Yes | Yes | Future-only yes | Future-only yes | Yes | No | No |
| Quote-required acknowledgement | Customer acknowledges quote is needed before work continues. | Yes | Maybe | Future-only yes | Future-only maybe | Future-only no / maybe | Yes | Yes | Future-only yes | Future-only yes | Yes | No | No |
| Quote approved by customer | Customer approves quoted work package. | Yes | Yes | Future-only yes | Future-only yes | Future-only maybe | Yes | Yes | Future-only yes | Future-only yes | Yes | No | No |
| Customer declined fee | Customer refuses fee. | Yes | N/A | Future-only maybe | Future-only yes | Future-only maybe | Yes | Yes | Future-only yes | Future-only yes | Yes | No | No |
| Fee dispute noted | Customer disputes fee or scope. | Yes, simplified | N/A | Future-only maybe | Future-only yes | Future-only maybe | Yes | Yes | Future-only yes | Future-only yes | Yes | No | No |
| Consent revoked / corrected future candidate | Customer correction or revocation policy, if approved. | Yes, simplified | Future-only yes | Future-only maybe | Future-only yes | Future-only maybe | Yes | Yes | Future-only yes | Future-only yes | Yes | No | No |
| Payment / invoice handoff notice | Customer is informed payment/invoice process may follow. | Yes | No / maybe | Future-only no | Future-only yes | Future-only yes | Maybe | Yes | Future-only yes | Future-only maybe | Yes | No | No |

## Future-only Implementation Gate Checklist

Any future customer fee consent runtime task must include explicit approval for:

1. PM approval.
2. Allowed file / layer list.
3. Customer-visible fee display allow-list.
4. Consent data model approval.
5. Evidence metadata approval.
6. API contract approval.
7. Migration / schema / index approval, if needed.
8. DB / DDL approval, if needed.
9. Data Access / safe-deny approval.
10. Customer channel identity and verification approval.
11. Audit readiness approval.
12. Test / smoke approval.
13. Rollback / safety plan.
14. No AI consent / approval confirmation.
15. No settlement approval coupling confirmation.
16. No provider sending confirmation unless explicitly approved.
17. No inventory docs expansion confirmation.

General statements such as "continue", "go ahead", "do next task", or "make progress" are not enough to approve runtime, DB, migration, provider sending, AI, customer channel, billing, payment, or test changes.

## Risk Matrix / Future-only

`Runtime approved now` is `No` for every row.

| Risk | Affected invariant | Possible future mitigation | Requires API change? | Requires schema/evidence model? | Requires Data Access / masking? | Requires test/smoke? | Requires audit? | Runtime approved now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fee consent stored only in note. | Consent must be traceable evidence, not free text only. | Use structured consent record with evidence and audit in a future task. | Future-only yes | Future-only yes | Future-only yes | Future-only yes | Future-only yes | No |
| Fee display mistaken as consent. | Fee display is not consent. | Separate display event from explicit consent action. | Future-only yes | Future-only yes | Future-only yes | Future-only yes | Future-only yes | No |
| Engineer records consent without customer action. | Engineer must not consent for customer. | Require verified customer action or authorized manual evidence workflow. | Future-only yes | Future-only yes | Future-only yes | Future-only yes | Future-only yes | No |
| AI wording becomes official consent. | AI may draft wording but cannot consent. | Keep AI output as draft; require customer action and audit. | Future-only yes | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Quote approval mistaken as settlement approval. | Quote approval and settlement approval are separate. | Use separate statuses and workflows for quote/customer and finance/internal approval. | Future-only yes | Future-only yes | Future-only yes | Future-only yes | Future-only yes | No |
| Settlement approval triggered by consent. | Consent must not auto-approve settlement. | Keep settlement workflow deterministic or finance-approved only. | Future-only yes | Future-only yes | Future-only yes | Future-only yes | Future-only yes | No |
| Internal billing / vendor payout exposed to customer. | Customer-visible fee amount must exclude internal finance data. | Use customer-visible allow-list and internal-only deny-list. | Future-only yes | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Fee dispute overwrites approved consent without audit. | Consent corrections must be traceable. | Preserve previous value and record correction / dispute audit event. | Future-only yes | Future-only yes | Future-only yes | Future-only yes | Future-only yes | No |
| Cross-organization consent access. | Organization isolation and Data Access Control. | Scope consent reads/writes by organization, Case, and verified identity. | Future-only yes | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Customer channel verification failure leaks Case existence. | Safe-deny / non-enumeration. | Use safe denial for nonexistent, unauthorized, or failed verification states. | Future-only yes | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |

## Runtime Forbidden Confirmation

Task317 explicitly does not approve:

- backend runtime,
- Admin runtime,
- API changes,
- migration changes,
- schema changes,
- index changes,
- DB connection,
- DDL,
- `psql`,
- `db:migrate`,
- Migration 020 dry-run,
- Migration 020 apply,
- tests,
- smoke scripts,
- fixtures,
- package changes,
- customer fee consent runtime,
- quote runtime,
- billing runtime,
- settlement runtime,
- payment runtime,
- invoice runtime,
- customer channel identity runtime,
- reverse binding runtime,
- verification runtime,
- notification runtime,
- Case runtime changes,
- Appointment runtime changes,
- Field Service Report runtime changes,
- AI / RAG runtime,
- provider sending,
- report / export / download runtime,
- inventory documentation changes.

## Conclusion

Task317 is a docs-only customer fee consent readiness detail packet.

It does not approve customer fee consent runtime implementation.

Future implementation may use this packet to prepare a tightly scoped task, but the future task must still obtain explicit approval for allowed files, customer-visible fee allow-list, consent data model, evidence metadata, API contracts, schema or index changes, DB / DDL, Data Access, safe-deny, customer channel identity, audit, tests, rollback, safety, and sensitive data boundaries before any runtime work begins.
