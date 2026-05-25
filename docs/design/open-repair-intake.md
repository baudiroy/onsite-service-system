# Open Repair Intake / Service Provider Directory / Assisted Referral

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Positioning

Open Repair Intake is a future growth module for customer App / Web. It should not be treated as the formal Case / Dispatch / Completion core workflow until a provider, brand, or platform formally accepts the service responsibility.

## Brand Service Channel Lookup

Customers may look up:

- official brand repair phone / 0800
- official repair website
- official LINE / App / Email
- authorized service providers
- service area
- service hours
- on-site availability
- pre-repair preparation checklist

This is information lookup only. It does not mean the platform accepts the repair, guarantees service, guarantees price, confirms warranty, or schedules dispatch.

## Directory Governance

Service provider and brand channel information must come from controlled directory / approved RAG knowledge base.

Directory data should track:

- source
- last updated time
- review status
- version
- organization / brand scope
- effective period

AI must not invent phone numbers, authorized relationships, service providers, pricing, warranty, or service commitments.

## Assisted Repair Request / Referral Flow

Potential flow:

customer submits request -> system/AI organizes repair information -> customer reviews shared content -> customer gives explicit consent -> system forwards minimum necessary data to provider / brand / service channel -> referral / handoff record is created -> customer can view referral status

## Consent and Minimization

No data may be shared with a third party without explicit customer consent. Shared data must be minimum necessary, clearly shown to the customer before sending, and recorded in referral / handoff, contact history, and audit log.

AI may classify, summarize, ask follow-up questions, check completeness, and suggest matching. AI must not promise price, warranty, appointment time, provider acceptance, or automatically share full customer data.

## Service Request vs Case

The system must distinguish:

- `service_request`: customer need or lookup, not yet accepted by responsible provider
- `referral` / `handoff`: customer-approved transfer to provider / brand / service channel
- `Case`: formally accepted service workflow eligible for Dispatch Intake, Appointment, Field Service Report, and Completion Flow

## Future Tasks

- directory data governance
- source/version review workflow
- service_request model
- referral consent flow
- provider matching policy
- customer-visible referral status
- audit and contact history events
