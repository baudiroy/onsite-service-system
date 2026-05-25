# Closed-domain AI Agent / Permission-aware RAG

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Core Principle

AI must be closed-domain, permission-aware, tenant-isolated, auditable, human-controlled, and RAG-grounded.

AI should not freely access external data, database, vector database, or raw files. AI responses, summaries, suggestions, and risk flags must be grounded in authorized platform data, SOP, brand rules, case data, service history, settlement rules, notification policy, and data the current user is allowed to see.

## AI Positioning

AI may be:

- AI Assistant
- AI Copilot
- AI Risk Radar
- RAG Knowledge Assistant

AI must not be:

- automatic decision maker
- automatic finance reviewer
- automatic supervisor
- automatic customer service owner
- unrestricted data query tool

AI may assist with judgment, organization, reminders, suggestions, and risk flags, but must not replace formal rules, supervisor review, finance review, engineer confirmation, or customer consent in high-risk workflows.

## Permission-aware Retrieval Flow

Recommended future flow:

User Request -> Auth / Session -> Organization Scope Check -> Role / Permission Check -> Feature Entitlement Check -> AI Task Router -> Retrieval Policy Builder -> Permission-aware RAG Retrieval -> Sensitive Data Masking / Redaction -> AI Model Response -> Human Review / Accept / Reject / Edit -> Official Record Write when allowed -> Audit Log + AI Feedback Log

Every AI retrieval must include organization_id scope and permission-aware filters. RAG must not cross organization, tenant, LINE channel, case/customer/document scope, or authorized visibility.

## RAG Sources and Metadata

Future RAG sources may include:

- Case, Customer, Appointment, Dispatch Visit, Field Service Report
- service parts, photo metadata, billing / settlement summary
- repair manuals, brand rules, vendor settlement rules
- customer service SOP, dispatch rules, quote rules, SLA rules, notification policy
- similar historical cases, completion summaries, fault categories
- customer feedback, complaint handling, repeat dispatch reasons
- organization settings, plan / entitlement, role permission, customer-visible policy

RAG source metadata should support organization_id, source_type, source_id, visibility, permission_scope, customer_visible, internal_only, brand_id, vendor_id, case_id, appointment_id, customer_id, document_id, version, effective dates, created_at, updated_at, and status.

## Tenant Isolation

If vector database / embedding index is used, it must be tenant-isolated through either per-organization indexes or mandatory metadata filters. Queries must never omit organization_id and visibility / permission filters.

## Agent Types

Future specialized agents may include:

- Customer Service AI Agent
- Dispatch AI Agent
- Engineer Completion AI Agent
- Billing / Settlement AI Agent
- Quality / Risk AI Agent
- Knowledge / SOP AI Agent

Each agent needs its own retrieval policy, data boundary, permission requirement, audit event type, and human-in-the-loop rule.

## AI May Help

AI may summarize cases and customer descriptions, structure intake, draft customer replies, suggest dispatch, estimate repair time, organize completion notes, classify faults, detect missing photos/signatures/serials, draft quote explanations, suggest settlement items, summarize feedback, flag complaint/SLA/parts risks, draft notifications, and answer RAG knowledge queries.

## AI Must Not

AI must not bypass permission, cross organization, query unauthorized data, approve quote/settlement, change formal case status, close complaints, hide negative feedback, consent on behalf of customers, fake signatures, fake engineer arrival, replace required engineer confirmation, write uncertainty into official record, expose AI raw payload to customer, or loosen security because a tenant paid for a higher tier.

## AI Output vs Official Record

Separate:

- AI suggestion
- AI risk flag
- AI explanation
- AI confidence
- retrieved sources
- human accepted / rejected / edited
- official record candidate
- final official record

High-risk fields such as quote, settlement, case status, customer fee approval, complaint closure, and completion result require human confirmation or deterministic business logic before official write.

## Audit / Knowledge Version / Feedback / Usage

AI events should be auditable, including query, retrieval, response, acceptance, rejection, edit, risk flag, official write, and feedback.

RAG knowledge should track version, effective period, organization/brand/vendor scope, visibility, and status.

AI feedback learning may use suggestion, edits, official outcome, repeat dispatch, complaint, or settlement anomaly results, but must remain tenant-isolated, masked, and permission-aware.

AI usage should support SaaS tracking by organization, user, feature_key, agent_type, request count, retrieval count, token usage, billing period, and cost category.

## Future Tasks

- retrieval policy builder
- RAG metadata model
- source visibility policy
- AI audit event taxonomy
- AI feedback model
- knowledge versioning
- usage tracking
- human accept / reject / edit workflow
- prompt/context allow-list
- tenant-isolated vector index review
