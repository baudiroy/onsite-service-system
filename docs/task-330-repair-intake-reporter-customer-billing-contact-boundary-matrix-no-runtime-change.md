# Task 330 - Repair Intake Reporter / Customer / Billing Contact Boundary Matrix / No Runtime Change

## Scope And Non-goals

This document follows Task328 and Task329.

Task330 defines docs-only boundaries for role assignment during Repair Intake:

- `reporter`,
- `customer`,
- `billing_contact`,
- `on_site_contact_override`,
- `case_source`,
- service subject,
- requester,
- assisted reporter,
- customer channel identity,
- contact history,
- dispatch contact.

It clarifies how future intake should distinguish who created the request, who receives service, who handles billing, and who should be contacted onsite.

Task330 is not:

- backend runtime,
- Admin runtime,
- API contract change,
- migration,
- schema change,
- index change,
- view change,
- DB / DDL execution,
- intake role assignment runtime,
- Case runtime,
- Customer runtime,
- Customer Channel Identity runtime,
- billing contact runtime,
- notification / provider sending runtime,
- audit runtime,
- permission / entitlement / usage runtime,
- AI / RAG runtime,
- test / smoke / fixture change,
- package change,
- inventory documentation change.

No runtime implementation is approved by this document.

## Why This Follows Task329

Task328 established source boundaries for Repair Intake.

Task329 established controlled import, staging, validation, duplicate detection, dry-run, and human confirmation boundaries.

Task330 focuses on a common modeling risk inside intake: imported, assisted, phone, or self-service repair requests often include multiple people. The request creator may not be the service customer. The payer may not be the service customer. The onsite contact may differ from the customer.

This document prevents future implementation from accidentally:

- treating `reporter` as `customer`,
- treating `billing_contact` as `customer`,
- letting `on_site_contact_override` overwrite `customer`,
- binding customer channel identity to the wrong person,
- sending customer-visible messages to an unauthorized reporter,
- leaking reporter / billing / onsite contact data in customer-facing responses,
- allowing AI to decide role assignments from ambiguous content.

## Definitions

### `reporter`

The person, organization, channel, or system that creates or assists with creating the repair request.

Examples: customer, family member, company administrator, dealer, vendor, brand customer service, AI assistant, internal customer service agent.

### `customer`

The actual service recipient / service subject and default engineer onsite contact.

The customer is the primary owner of service history, customer-visible service report, satisfaction survey, and customer-facing communication unless a future policy defines otherwise.

### `billing_contact`

The person or organization responsible for fee, invoice, payment, receipt, or billing communication when different from the service customer.

### `on_site_contact_override`

An exception contact used only when the onsite contact differs from the `customer`.

It should not replace the customer as service subject.

### `case_source`

The source category for how the repair request entered the platform, such as Brand API, Excel / CSV import, dealer assisted report, customer LINE, Web form, App, phone, AI phone draft, or referral conversion.

### Service Subject

The person, household, company site, product owner, or service location that actually receives the field service.

In most cases, this is the `customer`.

### Requester

A human-friendly synonym for `reporter`. Use carefully because requester may or may not be the actual customer.

### Assisted Reporter

A reporter who creates a repair request on behalf of someone else.

Examples: family member, company administrator, dealer, vendor, brand customer service, internal customer service agent.

### Customer Channel Identity

The verified channel identity for customer communication, such as LINE / App / Web / SMS / Email identity.

It must be scoped and verified according to organization and channel rules.

### Contact History

Future record of who was contacted, through which channel, for what purpose, and with what result.

### Dispatch Contact

The contact used by dispatch or engineer for scheduling and onsite coordination.

By default this is `customer`; use `on_site_contact_override` only when needed.

## Boundary Principles

- `reporter` is the person or system that creates or helps create the repair request.
- `customer` is the actual service recipient and default engineer onsite contact.
- `billing_contact` is the billing / invoice / payment contact and may differ from `customer`.
- `on_site_contact_override` is only used when onsite contact differs from `customer`.
- `reporter` must not automatically become `customer`.
- `billing_contact` must not automatically become `customer`.
- `on_site_contact_override` must not overwrite `customer`.
- `customer` should remain the service subject unless future policy explicitly says otherwise.
- Customer channel identity should be verified and scoped separately from reporter, billing contact, and onsite contact.
- Reporter, customer, billing contact, and onsite contact visibility must follow Data Access Control and customer visible data policy.
- AI may infer or suggest role classification, but must not decide role assignment.
- Ambiguous role relationships should become draft / needs review, not automatic formal Case.
- High-risk assisted reporting, dispute, complaint, fee conflict, or unclear identity should require human review.

## Future-only Role Matrix

| Scenario | Reporter role | Customer role | Billing contact role | `on_site_contact_override` needed? | Requires identity / contact verification? | Requires customer-visible policy? | Requires contact history? | Requires audit readiness? | AI may infer / suggest? | AI may decide role assignment? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Customer self-report | Customer themself | Same person | Usually same person | No | Yes | Yes | Yes | Yes | Yes | No | No |
| Family member reports for customer | Family member / assisted reporter | Service recipient | Depends on fee responsibility | Maybe | Yes | Yes | Yes | Yes | Yes | No | No |
| Company admin reports for employee / site | Company administrator | Employee, site, or service subject | Company or admin contact | Maybe | Yes | Yes | Yes | Yes | Yes | No | No |
| Dealer reports for end customer | Dealer / assisted reporter | End customer | Dealer or end customer, policy-dependent | Maybe | Yes | Yes | Yes | Yes | Yes | No | No |
| Vendor reports for end customer | Vendor / assisted reporter | End customer | Vendor or end customer, policy-dependent | Maybe | Yes | Yes | Yes | Yes | Yes | No | No |
| Brand API reports end customer | Brand / API source | End customer | Brand, dealer, or customer, policy-dependent | Maybe | Yes | Yes | Yes | Yes | Yes | No | No |
| Excel / CSV row with reporter and customer same | File source row | Same person | Usually same person | No | Yes | Yes | Yes | Yes | Yes | No | No |
| Excel / CSV row with reporter and customer different | File source row / assisted reporter | Service recipient | Depends on row and policy | Maybe | Yes | Yes | Yes | Yes | Yes | No | No |
| `billing_contact` same as customer | Any source | Service recipient | Same person | No unless onsite differs | Yes | Yes | Yes | Yes | Yes | No | No |
| `billing_contact` different from customer | Any source | Service recipient | Separate billing contact | Maybe | Yes | Yes | Yes | Yes | Yes | No | No |
| Onsite contact same as customer | Any source | Service recipient | Any allowed billing contact | No | Yes | Yes | Yes | Yes | Yes | No | No |
| Onsite contact different from customer | Any source | Service recipient | Any allowed billing contact | Yes | Yes | Yes | Yes | Yes | Yes | No | No |
| AI phone assisted reporter | AI assistant / phone channel | Candidate service recipient | Candidate billing contact | Maybe | Yes | Yes | Yes | Yes | Yes | No | No |
| Human CS assisted reporter | Customer service agent | Service recipient | Candidate billing contact | Maybe | Yes | Yes | Yes | Yes | Yes | No | No |

All rows are future-only. AI may suggest role classification, but all role assignments remain subject to validation and human-controlled policy. `Runtime allowed now?` must remain `No` until a later task explicitly authorizes runtime scope.

## Role Conflict / Ambiguity Handling

If relationships among `reporter`, `customer`, `billing_contact`, and `on_site_contact_override` are unclear, future intake should form:

- draft,
- needs review,
- missing information warning,
- role conflict warning,
- human review task.

It must not automatically create a formal Case when ambiguity is high.

Examples requiring review:

- reporter claims to act for another person but relationship is unclear,
- billing contact differs from customer and fee responsibility is unclear,
- onsite contact differs from customer and authorization is unclear,
- imported row contains multiple names but no role labels,
- phone / AI phone transcript is ambiguous,
- customer disputes authorization,
- high-risk complaint or fee dispute is included,
- channel identity belongs to a different person than the service subject.

AI may highlight ambiguity, propose likely roles, or ask follow-up questions.

AI must not decide official role assignment, customer identity, billing responsibility, or onsite authorization.

## Data Protection Rules

Logs, errors, frontend responses, AI context, import diagnostics, role conflict summaries, and customer-facing messages must not expose:

- complete phone values,
- complete email values,
- complete addresses beyond what is necessary and authorized,
- provider tokens,
- secrets,
- LINE access tokens,
- channel secrets,
- raw LINE identifiers,
- raw provider payloads,
- verification codes,
- Excel / CSV raw sensitive rows,
- unrestricted customer private data.

Reporter, billing contact, and `on_site_contact_override` data must not be exposed in customer-facing responses unless authorized, necessary, and masked according to policy.

Customer-facing messages should not reveal hidden role conflicts, duplicate candidates, internal review status, or cross-organization matching details.

## Interaction With Existing Branches

### Repair Intake Source Boundary

Task330 deepens Task328 by clarifying role boundaries inside each intake source.

### Import / Staging / Duplicate Detection

Imported rows may contain reporter, customer, billing contact, and onsite contact data. Ambiguous rows should remain staging / needs review until roles are confirmed.

### Customer Channel Identity / Notification

Channel identity must bind to the correct person and scope. A reporter's channel identity must not be silently treated as the customer's channel identity.

### Case-created First Contact / Dispatch Intake

After formal Case creation, first contact and dispatch intake should use the correct customer and dispatch contact. `on_site_contact_override` should be explicit when used.

### Customer-facing Completion Flow

Customer-facing report, survey, issue reporting, and follow-up must use customer-visible policy and not expose reporter / billing / onsite contact data improperly.

### Billing / Settlement

`billing_contact` may drive fee / invoice / receipt communication, but it must not become service customer automatically.

### Data Access Control

Role assignment, role display, contact history, import preview, and customer-facing messages must follow organization scope, permission, field-level masking, customer visible data policy, internal data policy, audit, and usage rules.

### Audit / Evidence Traceability

Future role assignment changes, human confirmations, role conflicts, billing contact decisions, and onsite contact overrides should be audit-ready.

## Explicit Runtime Forbidden Confirmation

Task330 does not allow:

- backend runtime,
- Admin runtime,
- API change,
- migration,
- schema change,
- index change,
- view change,
- DB connection,
- DDL,
- psql,
- `npm run db:migrate`,
- Migration020 dry-run or apply,
- intake runtime,
- import runtime,
- dedupe runtime,
- staging runtime,
- role assignment runtime,
- Case runtime,
- Customer runtime,
- Customer Channel Identity runtime,
- billing contact runtime,
- onsite contact runtime,
- notification / provider sending runtime,
- audit runtime,
- permission runtime,
- entitlement runtime,
- usage runtime,
- AI / RAG runtime,
- tests / smoke / fixtures change,
- package change,
- inventory docs change.

## Non-goals

Task330 must not:

- modify backend `src/`,
- modify Admin `admin/src/`,
- add or modify API behavior,
- add or modify migrations / schema / indexes / views,
- connect to DB,
- execute DDL,
- run psql,
- run `npm run db:migrate`,
- execute Migration020 dry-run or apply,
- add intake / import / dedupe / staging runtime,
- add role assignment runtime,
- add Case / Customer / Customer Channel Identity runtime,
- add billing contact runtime,
- add notification / provider sending runtime,
- add audit / permission / entitlement / usage runtime,
- add AI / RAG runtime,
- modify tests / smoke / fixtures / package.json,
- modify inventory docs.

## Future Implementation Gates

Before any runtime work can begin, a future task must explicitly approve:

- exact backend files / layers,
- exact Admin files / layers, if any,
- API contract changes, if any,
- migration / schema / index / view changes, if any,
- DB / DDL permission, if any,
- reporter model,
- customer role model,
- billing contact model,
- onsite contact override model,
- channel identity binding policy,
- role conflict / needs-review workflow,
- import role mapping rules,
- AI role suggestion masking policy,
- safe error / non-enumeration policy,
- Data Access Control checks,
- audit log requirements,
- SaaS usage tracking requirements,
- test / smoke / fixture scope,
- rollback and safety plan.

## Conclusion

Task330 is docs-only Repair Intake reporter / customer / billing contact / onsite contact boundary guidance.

It does not approve role assignment runtime, repair intake runtime, Case runtime, Customer runtime, channel identity runtime, billing contact runtime, API changes, Admin changes, DB / DDL, migrations, tests, smoke scripts, fixtures, package changes, or inventory documentation updates.
