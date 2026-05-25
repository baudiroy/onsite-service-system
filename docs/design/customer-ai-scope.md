# Customer AI Scope / 客戶 AI 邊界

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Positioning

Customer AI Service Assistant may be added later, but it must not be an open-ended general chatbot. It must be closed-domain, customer-visible, permission-aware, tenant-isolated, auditable, and grounded in approved knowledge sources.

## Allowed Scope

Customer AI may answer questions about:

- the customer's verified / bound cases
- customer-visible case status
- confirmed appointments
- customer-facing service report
- missing information requests
- photo upload guidance
- rescheduling workflow
- issue reporting
- satisfaction survey
- official service process
- approved FAQ
- Open Repair Intake public service provider information
- repair preparation checklist
- low-risk troubleshooting

## Low-risk Troubleshooting

Allowed troubleshooting must be official, non-invasive, and low-risk:

- check power
- restart / basic reset
- read official error code explanation
- prepare model / serial / warranty data
- take safe photos for repair intake
- explain when to stop using the product and request service

Customer AI must not provide instructions involving disassembly, high voltage, gas, compressor, motor, internal part replacement, bypassing safety devices, unofficial hacks, warranty-risk actions, or legally risky advice.

## Forbidden Data

Customer AI must not read or output:

- internal note
- audit log
- AI raw payload
- internal dispatch reason
- AI confidence score
- internal billing / settlement rules
- engineer internal comment
- supervisor review
- unconfirmed appointment suggestion
- unconfirmed quote / settlement data
- other customers' data
- cross-organization data

## Escalation

Customer AI must escalate or redirect when it sees:

- complaint or dispute
- fee / quote / compensation issue
- urgent or high-risk situation
- negative feedback
- unclear identity
- uncertain AI answer
- non-service topics such as legal, medical, investment, political, or private questions

## Knowledge Source

FAQ and troubleshooting must come from controlled Customer Service Knowledge Base / approved RAG source. AI must not invent official phone numbers, warranties, pricing, service commitments, or authorized provider relationships.

## Future Tasks

- customer-visible knowledge base
- retrieval policy and source metadata
- customer identity verification
- escalation workflow
- customer AI audit log
- safe refusal copy
