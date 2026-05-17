# Codex Task 001 — Design PostgreSQL `cases` Main Table

## Goal

Design the PostgreSQL `cases` main table for the AI-enhanced repair / dispatch / on-site service platform.

The `cases` table is the central table of the whole system, but it must NOT become a giant table containing every future module.

## Context

Read these files first:

- `AGENTS.md`
- `docs/system-overview.md`
- `docs/domain-model-v1.md`
- `docs/phase1-repair-request-spec.md`

## Required Design Principles

- `cases` is the case master table.
- Customer details must be stored in `customers`; `cases` should reference `customer_id`.
- Attachments/photos must be stored in `case_attachments`.
- Messages/conversation history must be stored in `case_messages`.
- Dispatch, field service, and billing are future modules; only keep minimal references or summary fields in `cases`.
- Support LINE and website sources.
- Support AI summary, AI classification, and AI confidence.
- Support first-phase repair request data.
- Support ISO 27001-oriented auditability.
- Use PostgreSQL.
- Prefer UUID primary keys.
- Add useful indexes.

## Required Fields to Consider

### Case Identity

- id
- case_no
- status
- source

### Product / Repair Request

- brand
- product_type
- model_no
- serial_no
- invoice_date
- problem_description
- preferred_visit_time

### AI Fields

- ai_summary
- ai_classification
- ai_confidence
- ai_suggested_dispatch_unit_id
- ai_ocr_status

### Dispatch Preview / Manual Override

- dispatch_unit_id
- dispatch_assignment_source

Example assignment source:

```text
rule
ai
manual
```

### ISO / Audit

- created_at
- updated_at
- created_by
- updated_by
- submitted_at
- reviewed_at
- accepted_at
- rejected_at
- cancelled_at

## Output Required

Please output:

1. Field list with field name, type, nullable, and reason.
2. PostgreSQL `CREATE TABLE cases` SQL.
3. Suggested PostgreSQL enum or check constraint strategy.
4. Suggested indexes.
5. Notes explaining what should NOT be placed in `cases`.
6. Future extension notes for dispatch, field service, and billing.
7. Any required related-table assumptions, especially `customers` and `dispatch_units`.

## Done When

- SQL is valid PostgreSQL.
- `cases` does not duplicate customer fields.
- `cases` does not store attachments directly.
- `cases` does not store messages directly.
- Future modules are not over-modeled.
- The table can support phase 1 repair request flow.
