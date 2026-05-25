# Cloud AI / External AI Provider Data Protection

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Positioning

AI / RAG / Cloud AI data safety is one of the platform's highest-priority guardrails.

The platform may use cloud AI providers in the future, but every outbound AI context must first pass scope, permission, entitlement, minimization, masking, customer-visible/internal policy, audit log, and usage controls.

## Required Pre-send Controls

All data sent to an external AI provider must pass:

- organization scope filter
- role / permission check
- feature entitlement check
- minimum necessary context selection
- sensitive data masking / redaction
- customer visible data policy
- internal data policy
- audit log
- SaaS usage tracking when applicable

AI must not directly access unfiltered database, vector database, file storage, or cross-organization data.

## Never Send Directly

The following must not be sent directly to an external AI provider:

- token
- secret
- LINE access token
- LINE channel secret
- webhook secret
- binding token
- verification code
- full phone
- full address
- raw customer signature
- unmasked photos
- full audit log
- full internal note
- full billing internal data
- full settlement internal data
- AI raw sensitive payload
- cross-organization / cross-tenant data

## Allowed Pattern

AI may use authorized, filtered, masked, minimized data to help with summary, classification, suggestion, risk flagging, and RAG query.

Convenience, accuracy, or automation pressure must not override data safety.

## Higher-security Architecture Options

High-sensitivity tasks should preserve future options:

- private AI
- dedicated environment
- local model
- hybrid AI architecture

Cloud AI, private AI, and local AI choices should depend on data sensitivity, customer plan, contract, security requirements, supplier risk, and ISO 27001-aligned risk assessment.

## Supplier Risk

AI providers are third-party suppliers / external services and should be covered by:

- supplier risk management
- data processing terms
- retention policy
- encryption requirement
- audit / logging policy
- incident response
- exit strategy

## Non-negotiable Principles

- Data safety is more important than AI convenience.
- AI must not bypass permission, organization isolation, customer visible data policy, internal data policy, or audit log.
- AI prompt, context, retrieval result, response, and log must not contain unnecessary sensitive data.
- AI output must remain separate from official record and support human accept / reject / edit.
- External provider use requires data scope, masking, retention, supplier risk, and audit review.
- High-security customers/plans may require private / dedicated / local / hybrid AI options.
- Higher-tier plans must not loosen security, privacy, permission, or ISO 27001-aligned principles.

## Future Tasks

- AI provider risk assessment template
- AI context allow-list
- AI masking / redaction policy
- AI outbound audit log
- usage tracking for AI provider calls
- private / dedicated / local / hybrid AI feasibility review
- incident response and provider exit strategy
