# Task 328 - Repair Intake / Case Creation Source Boundary Matrix / No Runtime Change

## Scope And Non-goals

This document follows the `docs/PROJECT_GUARDRAILS.md` update that added Repair Intake / Case Creation Future Design and Open Customer Repair Intake / Service Provider Directory / Assisted Referral Flow Future Design.

Task328 turns that guardrail into a docs-only source boundary matrix. It clarifies boundaries between:

- Brand API intake,
- Excel / CSV import,
- dealer / vendor / third-party assisted repair report,
- first-time customer self-service repair request,
- repeat repair request,
- phone / 0800 repair request,
- future AI phone repair intake,
- open service provider directory lookup,
- assisted referral / handoff request,
- `repair_intake_draft`,
- `dispatch_intake_draft`,
- `service_request`,
- formal Case.

Task328 is not:

- backend runtime,
- Admin runtime,
- API contract change,
- migration,
- schema change,
- index change,
- view change,
- DB / DDL execution,
- intake runtime,
- import runtime,
- dedupe runtime,
- staging runtime,
- `repair_intake_draft` runtime,
- `service_request` runtime,
- referral / handoff runtime,
- AI phone runtime,
- phone intake runtime,
- customer portal / self-service runtime,
- Case / Customer / Customer Channel Identity runtime,
- notification / provider sending runtime,
- audit runtime,
- permission / entitlement / usage runtime,
- AI / RAG runtime,
- test / smoke / fixture change,
- package change,
- inventory documentation change.

No runtime implementation is approved by this document.

## Why This Task Follows The Guardrail Update

The guardrail update established that Repair Intake is not a single path.

Cases may be created from controlled partner sources, imported files, assisted reporting, first-time customer self-service, repeat customer self-service, phone intake, or future AI phone intake. Separately, open customer lookup and assisted referral flows may create `service_request` / referral records before any party formally accepts service responsibility.

Task328 adds a source boundary matrix so future implementation cannot accidentally:

- treat `reporter` as `customer`,
- treat `service_request` as formal Case,
- treat directory lookup as platform service acceptance,
- let AI phone intake create high-risk formal Cases,
- let Excel / CSV import write directly into formal records,
- skip validation / dedupe / dry-run / human confirmation,
- bypass Data Access Control or organization scope,
- expose raw import rows or sensitive customer data in diagnostics,
- create divergent Case / Customer / Channel Identity flows by source type.

## Definitions

### Repair Intake

The upstream process of receiving, collecting, importing, or organizing repair request information before or during formal Case creation.

Repair Intake may come from brand API, file import, assisted report, customer self-service, phone, or future AI phone.

### Case Creation

The controlled act of creating a formal Case that has a service owner / accepted service responsibility and can enter Dispatch Intake, Appointment, Field Service Report, and Completion Flow.

### `case_source`

The source category for how the request entered the platform, such as Brand API, Excel / CSV import, dealer assisted report, customer LINE, Web form, App, phone, AI phone draft, or referral conversion.

### `reporter`

The person or system that created or helped create the repair request. Examples include brand customer service, dealer, vendor, family member, company administrator, AI assistant, internal customer service agent, or the customer themselves.

`reporter` is not necessarily the service customer.

### `customer`

The actual service recipient and default onsite contact for the engineer.

The customer is the primary entity for service history, customer-visible communication, channel identity, completion report, survey, and follow-up unless a policy says otherwise.

### `billing_contact`

The person or organization responsible for fee, invoice, payment, or receipt communication when different from the service customer.

### `on_site_contact_override`

A special onsite contact used only when the onsite contact is different from `customer`.

This should remain an exception, not the default model.

### `repair_intake_draft`

A future draft record containing unconfirmed repair request information from phone, AI phone, file import, partner submission, or customer self-service before it becomes a formal Case.

### `dispatch_intake_draft`

A future draft of dispatch-specific information collected after Case creation or first contact. It should be confirmed before becoming official dispatch input.

### Confirmed Case

A formal Case accepted into the platform's service workflow. Only a confirmed Case can proceed to Dispatch Intake, Appointment, Field Service Report, and Completion Flow.

### `service_request`

A customer-submitted request or lookup need that has not yet confirmed service responsibility, service owner, dispatch conditions, or pricing.

It is not a formal Case.

### Referral / Handoff

A future record that the platform, with explicit customer consent, forwarded minimum necessary repair information to a service provider, brand, dealer, or official repair channel.

Referral / handoff does not mean the platform guarantees service or that a formal Case exists.

## Boundary Principles

- `reporter` is not the same as `customer`.
- `customer` is the actual service recipient and default engineer onsite contact.
- Use `on_site_contact_override` only when onsite contact differs from `customer`.
- `service_request` is not Case.
- Assisted referral is not platform acceptance of repair responsibility.
- Brand service channel lookup is information / guidance only and does not create Case.
- AI phone intake can only form `repair_intake_draft`; it must not directly create high-risk formal Cases.
- Brand API and Excel / CSV import are controlled intake paths and must not bypass validation.
- All sources that become formal Cases must converge to the same Case, Customer, Customer Channel Identity, Contact History, Dispatch Intake, and Notification Workflow.
- Formal Case is required before Dispatch Intake, Appointment, Field Service Report, and Completion Flow.
- AI may assist with summarization, mapping, completeness checks, and classification, but must not create formal Case, overwrite official records, or bypass human confirmation where required.
- Customer consent is required before forwarding information to third-party providers / brands / service channels in assisted referral flows.

## Future-only Source Matrix

| Intake source | Source type | May create `repair_intake_draft`? | May create `service_request`? | May create formal Case directly? | Requires human confirmation? | Requires identity / channel validation? | Requires duplicate detection? | Requires Data Access Control? | Requires contact history? | Requires audit readiness? | Requires usage tracking? | AI may assist? | AI may create formal Case? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Brand API intake | Controlled partner API | Yes | No | Future-only yes, if trusted and validated | Yes for exceptions / high risk | Yes | Yes | Yes | Yes | Yes | Yes if metered | Yes | No | No |
| Excel / CSV import | Controlled file import | Yes | No | Future-only yes after dry-run and confirmation | Yes | Yes | Yes | Yes | Optional per row / batch | Yes | Yes if metered | Yes | No | No |
| Dealer assisted repair report | Assisted report | Yes | Possible | Future-only yes after validation | Yes | Yes | Yes | Yes | Yes | Yes | Optional | Yes | No | No |
| Vendor assisted repair report | Assisted report | Yes | Possible | Future-only yes after validation | Yes | Yes | Yes | Yes | Yes | Yes | Optional | Yes | No | No |
| Third-party assisted repair report | Assisted report | Yes | Possible | Future-only yes after validation | Yes | Yes | Yes | Yes | Yes | Yes | Optional | Yes | No | No |
| First-time LINE repair request | Customer self-service | Yes | Possible before acceptance | Future-only yes after validation | Yes if incomplete / risky | Yes | Yes | Yes | Yes | Yes | Yes if metered | Yes | No | No |
| First-time Web form repair request | Customer self-service | Yes | Possible before acceptance | Future-only yes after validation | Yes if incomplete / risky | Yes | Yes | Yes | Yes | Yes | Yes if metered | Yes | No | No |
| First-time SMS link repair request | Customer self-service via link | Yes | Possible before acceptance | Future-only yes after validation | Yes if incomplete / risky | Yes | Yes | Yes | Yes | Yes | Yes if metered | Yes | No | No |
| QR code repair request | Customer self-service | Yes | Possible before acceptance | Future-only yes after validation | Yes if incomplete / risky | Yes | Yes | Yes | Yes | Yes | Yes if metered | Yes | No | No |
| Repeat LINE repair request | Known customer channel | Yes | Possible before acceptance | Future-only yes after validation | Yes if changed / risky | Yes | Yes | Yes | Yes | Yes | Yes if metered | Yes | No | No |
| Repeat App repair request | Known customer channel | Yes | Possible before acceptance | Future-only yes after validation | Yes if changed / risky | Yes | Yes | Yes | Yes | Yes | Yes if metered | Yes | No | No |
| Repeat Web repair request | Known customer channel | Yes | Possible before acceptance | Future-only yes after validation | Yes if changed / risky | Yes | Yes | Yes | Yes | Yes | Yes if metered | Yes | No | No |
| Phone / 0800 repair request | Human / phone channel | Yes | Possible before acceptance | Future-only yes after CS confirmation | Yes | Yes | Yes | Yes | Yes | Yes | Optional | Yes | No | No |
| Future AI phone repair intake | AI-assisted phone | Yes | Possible before acceptance | No for high-risk; future-only after human / safe policy | Yes | Yes | Yes | Yes | Yes | Yes | Yes if metered | Yes | No | No |
| Open service provider directory lookup | Information lookup | No | Possible if customer asks for help | No | No for lookup; yes before referral | Yes if personalized | No by default; yes if personalized | Yes | Yes if personalized | Yes if personalized | Yes if metered | Yes | No | No |
| Assisted referral / handoff request | Customer-authorized referral | Yes | Yes | No until provider / platform accepts | Yes | Yes | Yes | Yes | Yes | Yes | Yes if metered | Yes | No | No |

All rows are future-only. `Runtime allowed now?` must remain `No` until a later task explicitly authorizes runtime scope, schemas, APIs, security model, tests, and rollout controls.

## Import-controlled Path

Brand API and Excel / CSV import should use a controlled intake path.

Future flow:

upload / receive
-> import batch
-> field mapping
-> validation
-> duplicate detection
-> completeness check
-> dry-run preview
-> human confirmation
-> create / update Case & Customer, future-only
-> after Case created enters SMS / LINE / Dispatch Intake Contact Workflow

Design rules:

- Import should not directly pollute formal data.
- Import should create draft / staging records before official writes.
- Import should track batch-level and row-level status.
- Import should record error reason safely.
- Import should support dry-run preview before official writes.
- Import should require organization scope, brand / vendor scope, permission, and duplicate-risk checks.
- AI may help with field mapping, error summaries, missing-field reminders, and cleanup suggestions.
- AI-assisted import does not mean sending the full raw file to AI.
- AI must not directly write official data, overwrite official Customer / Case records, or bypass Data Access Control.

## First-time / Repeat Intake Rules

First-time self-service intake should:

- minimize fields,
- guide LINE binding when appropriate,
- collect only necessary Case and dispatch-preparation information,
- allow later supplemental data,
- avoid exposing internal workflow details to the customer.

Repeat intake may suggest:

- historical address,
- historical product,
- historical contact information,
- service history,
- previous equipment.

Repeat intake must not:

- bypass identity validation,
- bypass organization scope,
- bypass customer visible data policy,
- bypass data minimization,
- silently overwrite formal Customer / Case data,
- expose service history across tenants or unauthorized organizations.

## Phone / AI Phone Intake Rules

Phone and AI phone intake should first form `repair_intake_draft`.

AI phone intake must be limited to low-risk allow-list use cases.

Human handoff is required when:

- complaint is involved,
- fee dispute is involved,
- high-risk situation is detected,
- sensitive identity verification is needed,
- answers are ambiguous,
- customer requests human support,
- AI cannot safely classify the request.

AI phone intake must not:

- directly create high-risk formal Case,
- promise appointment,
- promise quote,
- promise compensation,
- promise warranty,
- promise settlement result,
- handle complaint closure,
- handle fee dispute resolution,
- perform sensitive identity verification,
- replace human confirmation when required.

## Open Service Request / Referral Rules

`service_request` is not Case.

Directory lookup only provides information / guidance.

Referral requires:

- explicit customer consent,
- minimum necessary data sharing,
- clear preview of what will be shared,
- referral / handoff record,
- contact history,
- audit readiness,
- provider / brand / service channel destination record,
- safe status reporting.

Referral / handoff must not:

- imply platform service guarantee,
- imply provider acceptance,
- imply official Case creation,
- share complete customer data by default,
- share internal notes,
- share AI raw payload,
- share unmasked sensitive data,
- bypass Data Access Control.

Formal Case conversion requires:

- accepted service owner,
- organization scope,
- customer identity,
- required service contact information,
- allowed data use purpose,
- confirmed service responsibility,
- appropriate intake validation.

## Data Protection Rules

Logs, errors, frontend responses, AI context, import diagnostics, referral previews, directory responses, and customer-facing messages must not expose:

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

AI-assisted import must not send the full raw source file to an external AI provider.

External AI may only receive authorized, masked, organization-scoped, minimum necessary content for mapping, validation assistance, summary, or classification.

Import diagnostics and dedupe results must not reveal cross-organization data, whether a customer exists in another tenant, or sensitive matching details.

## Interaction With Existing Branches

### Case-created First Contact / Dispatch Intake

Once a formal Case exists, it should enter the Case-created First Contact / Dispatch Intake workflow. Repair Intake must not bypass that path.

### Customer Channel Identity / Notification

Repair Intake should converge to Customer Channel Identity when customer communication, LINE binding, App identity, Web identity, SMS link, or notification workflows are involved.

Raw channel identifiers must not be exposed.

### Data Access Control

All intake, import, lookup, referral, draft review, dedupe, and formal Case creation flows must follow organization scope, role / permission, customer visible data policy, internal data policy, sensitive data masking, audit, and usage rules.

### Audit Log / Evidence Traceability

Import batch, row status, human confirmation, referral consent, handoff, AI phone draft, phone intake summary, and formal Case conversion should be audit-ready.

### AI / RAG Advisory-only

AI may assist with field mapping, summary, classification, missing-field detection, duplicate-risk explanation, and referral matching suggestions.

AI must not create formal Case, overwrite official records, share full customer data, invent service providers, promise service, or bypass human review where required.

### SaaS Usage Tracking

Imports, customer self-service intake, AI phone intake, directory lookup, referral, AI classification, and partner API usage may be usage-metered in the future.

No usage runtime is approved here.

### Case / Appointment Workflow

Only a formal Case may proceed to Dispatch Intake, Appointment, Field Service Report, and Completion Flow.

`service_request`, referral, directory lookup, and `repair_intake_draft` must not be treated as appointments or completed service work.

## Explicit Runtime Forbidden Confirmation

Task328 does not allow:

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
- `repair_intake_draft` runtime,
- `service_request` runtime,
- referral / handoff runtime,
- AI phone runtime,
- phone intake runtime,
- customer portal runtime,
- customer self-service runtime,
- Case creation runtime change,
- Customer runtime change,
- Customer Channel Identity runtime,
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

Task328 must not:

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
- add `repair_intake_draft` / `service_request` / referral runtime,
- add AI phone / phone intake / customer portal runtime,
- add Case / Customer / Customer Channel Identity runtime,
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
- `case_source` model,
- `reporter` / `customer` / `billing_contact` / `on_site_contact_override` model,
- `repair_intake_draft` schema,
- import batch / row status schema,
- dedupe strategy,
- `service_request` schema,
- referral / handoff schema,
- consent capture policy,
- directory source governance,
- AI phone low-risk allow-list,
- human handoff policy,
- safe error / non-enumeration policy,
- Data Access Control checks,
- audit log requirements,
- SaaS usage tracking requirements,
- test / smoke / fixture scope,
- rollback and safety plan.

## Conclusion

Task328 is docs-only Repair Intake / Case Creation source boundary guidance.

It does not approve repair intake runtime, case creation runtime changes, import runtime, dedupe runtime, staging runtime, service request runtime, referral runtime, directory runtime, AI phone runtime, customer portal runtime, API changes, Admin changes, DB / DDL, migrations, tests, smoke scripts, fixtures, package changes, or inventory documentation updates.
