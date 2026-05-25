# AI Assistance Layer / AI 協助層

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Positioning

AI should be an embedded AI Assistance Layer, not a single universal chat box. Different workflows may use different AI surfaces:

- AI chat for authorized back-office analysis
- suggestion cards
- field suggestions
- completion summary confirmation cards
- draft generators
- summarizers
- AI voice intake
- risk radar
- RAG knowledge assistant

## Global AI Rules

AI must be:

- closed-domain
- permission-aware
- tenant-isolated
- auditable
- human-controlled
- RAG-grounded where retrieval is used

AI must not bypass organization scope, role permission, feature entitlement, Data Access Control, audit log, human review, or official approval workflows.

## Provider Abstraction / AI Gateway

Phase 1 may use OpenAI API as the primary/default cloud AI provider, but OpenAI is an adapter-level dependency only. Business logic, domain services, controllers, routes, workers, and customer-facing flows must call a provider-neutral AI Gateway / Provider Abstraction contract instead of importing an OpenAI SDK or provider-specific client directly.

The AI Gateway is responsible for:

- enforcing organization scope, role permission, feature entitlement, Data Access Control, customer-visible/internal policy, redaction, audit, usage tracking, timeout, retry, and fallback controls before any provider call
- selecting model tier by task policy, not by hard-coded module choice
- constructing the minimum necessary prompt/context after filtering, masking, and retrieval policy checks
- normalizing provider responses into a provider-neutral response envelope
- separating AI suggestion metadata from official records and human decisions
- keeping provider credentials server-side only and out of repo, frontend, logs, prompts, RAG context, public responses, and audit raw payloads

Provider Adapters are responsible for the provider-specific mechanics:

- translating the gateway request into provider-specific API parameters
- mapping provider responses back into the neutral response envelope
- hiding provider-specific model names, response shapes, retry details, and credential handling from business logic
- supporting future provider replacement or expansion without rewriting domain services

## Model Tier Policy

Model selection must be policy-controlled by task tier. A future task policy may distinguish, for example:

- simple classification
- customer reply draft
- repair intake extraction
- RAG-grounded answer
- internal operations summary
- high-risk recommendation

Each tier should define allowed model capability, token budget, retrieval allowance, redaction requirements, human-review requirement, and audit/usage metadata. Individual modules must not hard-code a provider model name as a business rule.

## Future Provider / Agent Expansion

The architecture should remain provider-neutral. Future providers or agent runtimes may be added through new adapters or gateway routing policy, not through direct edits to domain services. Possible future options include Azure OpenAI, other cloud AI providers, private AI, dedicated environments, local models, extraction-specific models, or controlled agent runtimes.

Any agent-style flow remains bounded by the same guardrails: permission-aware retrieval, organization isolation, customer-visible filtering, auditability, human control, official-record separation, and no autonomous dispatch, completion, settlement, refund, complaint closure, fee approval, or finalAppointmentId mutation.

## Non-goals For This Design

This document does not implement AI runtime behavior. It does not add SDK wiring, provider configuration, provider credentials, AI calls, RAG runtime, gateway code, adapters, API routes, DB/migration changes, smoke tests, or shared runtime changes.

## Workflow Surfaces

Back-office / supervisor AI may help with case lookup, summary, risk analysis, and reporting, but must respect permissions.

Customer service AI may summarize intake, draft replies, and identify missing information.

Dispatch AI should appear primarily as dispatch suggestion cards for engineer matching, route grouping, parts reminder, repair-time estimate, SLA risk, complaint risk, and parts risk.

Engineer AI should start as completion organization cards that convert short field input into standardized completion draft. It must not increase engineer form burden.

Customer AI must stay within customer-visible and verified/bound case scope. See `customer-ai-scope.md`.

AI phone intake may collect low-risk dispatch information, but must escalate unclear, high-risk, complaint, dispute, or customer-requested-human situations.

## Official Record Separation

AI output must be separated from official records:

- AI suggestion
- AI risk flag
- AI explanation
- AI confidence
- retrieved sources
- human accepted
- human rejected
- human edited
- official record candidate
- final official record

Formal case status, quote, settlement, fee approval, complaint closure, final appointment, and customer consent require deterministic business logic or authorized human confirmation.

## Data Protection

External AI provider data must use minimum necessary context, permission filtering, organization scope, masking/redaction, audit log, and usage tracking. AI must not receive secrets, tokens, raw LINE ids, complete phone/address values, raw signatures, unmasked photos, full raw imports, or cross-tenant data.

## Future Tasks

- AI task router
- retrieval policy builder
- AI audit event catalog
- AI usage tracking
- source citation model
- accept/reject/edit workflow
- safe prompt/context construction
