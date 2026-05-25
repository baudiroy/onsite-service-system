# Repair Intake and Phone-based Customer Matching

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Multi-source Repair Intake

Repair Intake should support:

- brand API integration
- brand / vendor / dealer Excel / CSV import
- dealer / vendor / other person reporting on behalf of customer
- first-time customer self-service repair request
- repeat LINE / Web / App repair request
- phone / 0800 / future AI phone intake

All sources must converge into Case, Customer, Customer Channel Identity, Contact History, Dispatch Intake, and Notification Workflow.

## Role Boundary

The system should distinguish:

- `case_source`
- `reporter`
- `customer`
- `billing_contact`
- `on_site_contact_override`

Reporter is the person or system that creates or assists the repair request. Customer is the actual service recipient and default engineer contact. `on_site_contact_override` should be used only when field contact differs from customer.

## Controlled Import Path

API / Excel / CSV import should follow:

upload -> import batch -> field mapping -> validation -> duplicate detection -> completeness check -> dry-run preview -> human confirmation -> create/update Case and Customer -> first contact workflow

Import must not directly pollute formal data. It should use draft/staging records, row-level status, error reason, and audit log. AI may assist mapping and error summaries, but must not receive the full raw file or write official records directly.

## Phone as Primary Matching Key

Phone number is the main Repair Intake customer matching entry point because first contact can use SMS binding link to build phone / customer / LINE identity association.

## First-time Phone Appearance

Case or intake draft created -> phone captured -> SMS first contact -> SMS binding link -> customer verifies/clicks -> LINE binding -> phone/customer/channel identity linked -> Dispatch Intake may continue through LINE or Web fallback.

Do not push full case details to uncertain LINE identity before verification.

## Repeat Phone Appearance

When the same phone appears again, the system should check:

- phone maps to one customer only
- customer has active LINE / App identity
- identity is still valid
- organization / LINE channel scope matches
- no conflict or high-risk flag exists

If safe, the system may link the existing customer and use LINE / App for notification and Dispatch Intake without repeating SMS-to-LINE binding.

## Re-verification / Fallback

Use SMS / Web link re-verification or human confirmation when:

- one phone maps to multiple customers
- phone may have changed owner
- imported data conflicts with existing customer
- LINE / App identity is invalid, unbound, blocked, or send failed
- organization / LINE channel scope differs
- data source quality is low
- case is high-risk, complaint, dispute, or fee-sensitive
- the system cannot safely decide

Wrong-customer match is worse than sending another SMS.

## Open Repair Request Boundary

Open public repair request, service provider lookup, and assisted referral should create `service_request` / `intake_request` first. It becomes a formal Case only after a provider, brand, or platform formally accepts responsibility.

## Future Tasks

- import staging model
- duplicate detection
- phone matching resolver
- channel identity confidence rules
- SMS / LINE / App notification routing
- contact attempt log and audit events
