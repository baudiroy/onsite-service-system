# AGENTS.md

## Project

This repository is for an AI-enhanced field service platform.

The product is NOT just a LINE bot and NOT just an AI chatbot. It is a full repair request, dispatch, on-site engineer service, and billing reconciliation platform.

Core modules:

1. AI customer service
2. Repair request system
3. Dispatch system
4. Engineer on-site service system
5. Billing reconciliation system

## First Phase Scope

Build only the first-phase foundation:

- LINE repair request entry
- Website repair request entry
- Node.js backend API
- PostgreSQL database
- Cloudflare R2 attachment storage
- OpenAI-compatible AI provider adapter
- Admin backend foundation
- ISO 27001-oriented security baseline

Do not overbuild second-phase modules yet. Preserve extensibility through schema and API boundaries.

## Tech Stack

Use:

- Backend: Node.js
- Database: PostgreSQL
- Deployment target: Zeabur
- Object storage: Cloudflare R2
- AI: OpenAI first, but through an adapter interface
- Documentation: Markdown under `/docs`

## Engineering Rules

- Keep `cases` as the central domain table.
- Do not store customer profile fields directly inside `cases`; use `customer_id`.
- Do not store photos or files directly inside `cases`; use `case_attachments`.
- Do not store conversation history directly inside `cases`; use `case_messages`.
- Do not place dispatch, on-site service, and billing details directly into `cases`; only keep references or first-phase summary fields where needed.
- Use UUID primary keys unless there is a strong reason not to.
- Use timestamps: `created_at`, `updated_at`.
- Use soft-delete or archival strategy where appropriate.
- Add indexes for search, status filtering, customer lookup, and case number lookup.
- Design for auditability.
- Avoid hardcoded secrets.
- Use environment variables for secrets.
- Keep AI provider swappable.

## Security / ISO 27001 Direction

The implementation should support:

- Least privilege
- Audit logs
- Access control
- Personal data minimization
- Attachment access control
- Environment variable secret management
- Traceable case changes
- Vendor and AI usage logging

## Done When

For database tasks:

- SQL migration is valid PostgreSQL.
- Tables have primary keys, foreign keys, timestamps, and useful indexes.
- Field names are consistent with `/docs`.
- Design explanation is included.
- Future extension notes are included.

For backend tasks:

- Code is modular.
- APIs validate input.
- Errors are handled.
- Sensitive data is not logged.
- Tests or verification steps are provided.

## Do Not

- Do not implement a full CRM.
- Do not implement full dispatch automation yet.
- Do not implement phone AI in phase 1.
- Do not use Notion as the operational database.
- Do not use Ragic as the core database in phase 1.
- Do not create a monolithic `cases` table containing every future field.
