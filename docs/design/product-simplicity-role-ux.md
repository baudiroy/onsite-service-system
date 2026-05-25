# Product Simplicity / Role-based UX Design

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Positioning

The platform may become powerful, but users must not feel that complexity in daily work. Complexity should be absorbed by backend architecture, rules, AI, permissions, defaults, and automation, not pushed onto customers, customer service, dispatchers, engineers, supervisors, or finance.

Core phrase:

Powerful backend, simple role-based experience.

中文原則：

後台能力可以強大，但每個角色的使用體驗必須簡單。

## Core UX Principles

1. Role-based UI
   - Each role should see only needed functions, data, and next actions.
   - Customer service, dispatcher, engineer, supervisor, finance, admin, customer, vendor, and brand users should have different priorities.
   - The full platform capability should not be exposed to every user at once.

2. Progressive disclosure
   - Show only required fields and primary actions by default.
   - Advanced fields, exceptions, and management settings should stay in advanced areas or management flows.
   - Daily workflows should not be crowded by low-frequency fields.

3. Default smart flow
   - Most users should complete tasks through the default path.
   - Exceptions should enter advanced handling.
   - The system should provide defaults, next-step suggestions, and missing-field reminders.

4. AI assist, not AI burden
   - AI should reduce manual sorting, repeated input, and decision friction.
   - AI should not create extra fields that users must maintain.
   - AI may turn unstructured input into structured drafts, but formal records still require permission and workflow confirmation.

5. Configuration hidden from daily users
   - SaaS plans, settlement rules, AI RAG, permissions, SLA rules, notification rules, masking policies, and supplier/provider settings should not appear in daily frontline workflows.

## Customer UX

Customer-facing flows should be simple, clear, and low-button.

Customers mainly need to know:

- where their case is
- when service will happen
- whether they need to provide information
- whether quote or fee confirmation is needed
- whether service is completed
- whether a satisfaction survey is available

Customers must not see internal notes, audit logs, billing internal data, settlement internal data, engineer internal comments, AI raw payload, supervisor review, or internal risk flags.

## Customer Service UX

Customer service should focus on:

- new cases
- pending contact
- missing information
- customer availability
- LINE / channel binding status
- AI-structured repair summary
- next-step suggestions

Customer service should not be distracted by technical fields, settlement internals, AI raw payload, or complex settings.

## Dispatcher UX

Dispatch should focus on:

- cases awaiting scheduling
- customer availability
- region and route
- engineer load
- likely parts
- SLA risk
- AI ranking suggestion
- pending parts / quote / customer-not-home follow-up

Dispatchers make final decisions, but should not manually assemble every condition.

## Engineer UX

Engineer workflows must be minimal.

Engineer Mobile Workbench / mobile web should focus on:

- today's tasks
- next stop
- navigation
- arrival
- photo capture
- service result selection
- short input
- parts / serials
- customer signature
- completion

Engineers should provide necessary field facts only. System and AI should organize the rest. Engineer completion must not become a complex back-office form.

## Supervisor UX

Supervisor surfaces should be exception-first / risk-first:

- abnormal cases
- near-due / overdue cases
- complaint risk
- repeat dispatch
- engineer load or anomalies
- high-value quotes
- cases requiring review
- AI risk summary

Supervisors should not need to inspect every normal case daily.

## Finance / Settlement UX

Finance should focus on:

- pending settlement
- missing evidence
- amount anomalies
- vendor / brand rule confirmation
- billable cases
- non-billable cases
- missing customer fee approval
- AI settlement-check hints

Finance still performs human review, but system and AI should help identify exceptions and missing evidence.

## New Feature Checklist

Every new feature should ask:

- Does this add more field entry for frontline users?
- Does this increase customer service, dispatcher, engineer, or finance burden?
- Can complexity be absorbed by defaults, AI structuring, deterministic rules, or admin settings?
- Can advanced fields appear only in exceptions?
- Will it slow engineer completion?
- Will it complicate customer inquiry?
- Will supervisors miss important exceptions because the UI is noisy?
- Will finance find it harder to identify missing evidence or abnormal amounts?

If a feature increases frontline burden, redesign it first.

## Current-stage Strategy

This document does not implement UX/UI runtime, AI runtime, automation, permission logic, or frontend behavior.

Future implementation should keep core workflows simple, especially engineer completion, customer service case creation, dispatch scheduling, customer inquiry, and finance review.
