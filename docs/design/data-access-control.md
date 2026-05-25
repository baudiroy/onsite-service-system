# Data Access Control / Data Permission Model

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Positioning

All data reading, query, analytics, report, export, download, AI retrieval, RAG, customer self-service inquiry, and scheduled reports must share one Data Access Control / Data Permission Model.

Data access is the foundation. Reports, analytics, export, download, AI filtering, AI import/export, RAG retrieval, scheduled reports, and customer self-service are data applications built on top of this permission layer. They must not create separate or inconsistent permission models.

## Core Permission Checks

Any data operation must at least check:

- organization scope
- user identity
- role
- permission
- report / export permission, when applicable
- feature entitlement, when applicable
- subscription status, when applicable
- allowed case scope
- allowed customer scope
- allowed document scope
- customer visible data policy
- internal data policy
- field-level masking / sensitive data redaction
- audit log requirement
- SaaS usage tracking, when applicable

Rules:

- All data operations must follow organization isolation.
- Reports, export, AI, RAG, customer self-service, and scheduled jobs must not skip permission checks.
- Permission checks should confirm organization scope before role, permission, entitlement, and data visibility.
- A user being allowed to view something does not automatically mean they may export, download, or expose raw fields to AI.

## Report / Analytics / Export / Download

Reports and analytics may only aggregate data the user is allowed to see. Export and download require export permission and field-level visibility rules.

Sensitive fields such as phone, address, name, signature, photos, internal notes, billing internal data, settlement internal data, and AI raw payload should be masked or excluded by default.

Report generation, viewing, download, delivery, and export should be auditable. Exported files should support access control, expiry, revocation, and sensitive data redaction.

## Scheduled Reports

Scheduled reports are automation, not a permission bypass.

Scheduled reports must use the same permission, masking, customer-visible, internal-data, export, recipient, audit, and usage rules as manual report/export.

Scheduled reports must not:

- cross organization scope
- send to unauthorized recipients
- bypass field-level masking
- bypass customer visible data policy
- bypass internal data policy
- bypass export permission

## Report / Analytics Data Minimization

Reports, analytics, dashboards, AI insight, scheduled reports, and general exports should not include complete customer personal data by default.

Complete customer name, full phone, full address, LINE user id, signature, and photos should be used mainly for operationally necessary contexts:

- customer service contact
- dispatch address confirmation
- engineer on-site service
- notification sending
- quote / fee confirmation
- customer fee approval
- complaint follow-up
- customer-specific case lookup

General analytics should prefer de-identified, masked, regionalized, aggregated, or statistical data such as city/district, product type, brand, fault type, case status, processing days, completion rate, pending-parts rate, complaint rate, SLA status, engineer performance, and satisfaction trends.

If report/export requires complete personal data, it must have a clear operational purpose, permission, field-level masking policy, audit log, download expiry, and SaaS usage tracking.

## AI / RAG

AI is not an exception. AI retrieval, RAG, AI-assisted filtering, AI-assisted import/export, AI summary, and AI risk radar must follow the same data permission model.

Rules:

- AI may only receive data currently authorized for the user / organization.
- AI must not directly query unfiltered databases.
- AI must not directly query unfiltered vector databases.
- AI retrieval must use retrieval policy builder and permission-aware filters.
- RAG queries must include organization_id filtering.
- AI must not cross organization, tenant, LINE channel, or authorized scope.
- AI must not use internal_only data in customer-visible answers.
- AI must not place unauthorized data into prompt, context, summary, or export.
- AI retrieval, source use, response generation, and accept/reject/edit actions should be auditable.
- AI usage should support SaaS usage tracking and AI Add-on cost control.

## Customer-visible vs Internal Data

Customer-visible data may include:

- basic case status
- appointment time
- missing information request
- quote confirmation content, if authorized
- completed service summary, if confirmed
- satisfaction survey

Customer must not see:

- internal note
- audit log
- billing internal data
- settlement internal data
- engineer internal comments
- AI raw payload
- supervisor review
- internal risk flags
- unauthorized reports or settlement data

Customer self-service inquiry, LINE inquiry, Web portal, App inquiry, and customer-facing AI must all follow the same customer visible data policy.

## Internal Data Policy

Internal data should be layered by role and permission.

Potential data categories:

- case data
- customer data
- appointment data
- field service report
- service parts
- photos metadata
- billing data
- settlement data
- quote data
- customer approval records
- customer feedback
- audit log
- AI suggestions
- AI raw payload
- RAG source documents
- report exports

Customer service, dispatcher, engineer, supervisor, finance, admin, vendor, and brand actors should have different visibility. Engineer access should be limited to assigned or authorized cases. Finance can see settlement-required data, but not necessarily all customer communication. Brand/vendor actors may only see authorized brand/vendor scope.

## Field-level Masking / Redaction

Sensitive fields include:

- phone
- address
- customer name
- LINE user id
- email
- token
- access token
- channel secret
- webhook secret
- customer signature
- field photos
- quote
- settlement amount
- internal note
- AI raw payload

Display, report, export, AI context, RAG retrieval, logs, and error messages must consider redaction. Tests, smoke output, and samples must not output complete sensitive values.

## SaaS Entitlement / Usage

Analytics, report, export, download, scheduled reports, AI filtering, AI import/export, RAG query, customer self-service inquiry, and API access should support entitlement and usage tracking.

Entitlement decides whether the organization has a feature. Permission decides whether the user can operate it. Both are required. Usage tracking should avoid unnecessary sensitive payload.

## Audit Log Requirement

Important data operations should be traceable.

Suggested future audit events:

- data_viewed, if future policy requires it
- report_generated
- report_viewed
- report_exported
- file_downloaded
- scheduled_report_generated
- scheduled_report_delivered
- ai_retrieval_executed
- ai_data_filtering_executed
- ai_export_assistant_used
- ai_import_assistant_used
- customer_self_service_viewed
- permission_denied
- cross_scope_access_denied

Audit logs should record organization, user, role/permission context, action type, target resource, timestamp, result, and masked summary. Audit logs must not contain complete token, secret, LINE access token, channel secret, full phone, full address, raw signature, or unnecessary AI raw sensitive payload.

## Current-stage Strategy

No new permission runtime, report runtime, export runtime, AI retrieval runtime, scheduled report runtime, or usage tracking runtime is implemented by this document.

Future implementation should first design:

- unified permission check
- field-level masking
- customer visible data policy
- internal data policy
- audit event catalog
- recipient policy for scheduled reports
- usage tracking and entitlement mapping
