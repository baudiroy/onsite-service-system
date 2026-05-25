# Task 308 - Audit Retention / Access / Redaction Boundary Matrix / No Runtime Change

## Scope And Non-goals

This document continues the Audit Log / Evidence Traceability branch after Task303 through Task307.

Task308 defines future-only boundaries for audit retention, audit access, audit export, audit redaction, audit masking, evidence retention, legal/compliance hold candidates, audit-safe metadata, sensitive audit payloads, and audit access audit.

The goal is to ensure future audit logs and evidence records support traceability without becoming customer-visible history, report/export datasets, raw sensitive payload stores, or AI/RAG retrieval sources.

Task308 is documentation-only.

This task is not:

- audit log runtime,
- evidence runtime,
- retention runtime,
- redaction runtime,
- audit access runtime,
- audit export runtime,
- Data Access runtime,
- permission runtime,
- role runtime,
- entitlement runtime,
- usage runtime,
- seat billing runtime,
- report/export/download runtime,
- scheduled report runtime,
- customer channel identity runtime,
- reverse binding runtime,
- verification runtime,
- notification runtime,
- provider sending runtime,
- customer fee consent runtime,
- quote runtime,
- billing runtime,
- settlement runtime,
- AI / RAG runtime,
- API contract,
- Admin UI,
- backend service change,
- DB schema / migration proposal,
- smoke / test implementation.

Task308 does not add tables, migrations, schema, indexes, backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, smoke scripts, fixtures, package changes, audit runtime, retention runtime, redaction runtime, audit access runtime, audit export runtime, AI/RAG runtime, or inventory documentation changes.

## Why Audit Retention / Access / Redaction Boundaries Are Needed After Task307

Task307 defined audit traceability for AI suggestions and human decisions.

The next risk is assuming audit logs can be kept forever, queried by anyone with support access, exported like reports, or used directly as AI/RAG context.

Audit logs can contain sensitive operational patterns, actor traces, masked customer references, business decisions, provider categories, permission failures, and security-relevant signals. They need strong retention, access, redaction, masking, export, and AI/RAG boundaries before runtime design is approved.

Task308 defines those boundaries without approving audit runtime, retention runtime, redaction runtime, API, Admin UI, DB, or migration work.

## Definitions

### Audit Retention

Audit retention is the future policy for how long different audit categories should be preserved.

Retention does not mean every raw detail is stored forever.

### Audit Access

Audit access is the future ability to view, query, inspect, or use audit records.

Audit access itself must require permission and be auditable.

### Audit Export

Audit export is a future controlled export of audit records or audit summaries.

Audit export must not bypass Data Access Control, masking, purpose, or download controls.

### Audit Redaction

Audit redaction is the future removal or suppression of sensitive audit data according to policy.

Redaction must preserve required traceability where compliance requires it.

### Audit Masking

Audit masking is the future presentation or storage of partial references rather than complete sensitive values.

Masking does not mean the underlying data does not exist.

### Evidence Retention

Evidence retention is the future policy for preserving evidence records and references, such as file metadata links, fee consent evidence, quote approval evidence, or human review evidence.

### Retention Policy

Retention policy is the future category, period, and disposal/anonymization rule for a record type.

### Legal / Compliance Hold Future Candidate

Legal / compliance hold is a future policy state that may pause deletion or redaction for specific records due to dispute, audit, regulatory, or legal requirements.

### Audit-safe Metadata

Audit-safe metadata is minimized, masked metadata that can support traceability without storing raw sensitive payload.

### Sensitive Audit Payload

Sensitive audit payload is data that should not be stored in audit logs, such as full secrets, complete contact values, raw provider payloads, raw AI payloads, raw file contents, or unmasked attachments.

### Audit Access Audit

Audit access audit is a future audit event recording that someone accessed audit data.

Audit access itself must be traceable.

## Boundary Principles

- Audit log is not customer-visible history.
- Audit log is not report/export dataset.
- Audit access itself must be audited.
- Audit retention does not mean permanent storage of all content.
- Audit redaction must not destroy necessary audit integrity.
- Audit masking does not mean data does not exist.
- AI/RAG must not directly full-text retrieve audit logs.
- Audit export cannot bypass Data Access Control.
- Audit export cannot bypass permission.
- Audit export cannot bypass masking.
- Audit export cannot bypass purpose.
- Audit export cannot bypass download controls.
- Support/admin/debug access is not universal cross-organization audit access.
- Audit log must not become a sensitive payload warehouse.
- Customer-facing channels must not expose internal audit log.

## Future-only Retention / Access Matrix

This matrix is future-only guidance. It does not approve audit runtime, retention runtime, audit access runtime, audit export runtime, redaction runtime, schema, API, Admin UI, AI/RAG runtime, or DB changes.

| Audit category | Retention sensitivity | Customer-visible? | Internal access only? | Requires elevated permission? | Requires masking/redaction? | Export eligible? | AI/RAG retrieval eligible? | May link evidence record? | May link usage tracking separately? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Case action audit | Medium / high by content | No | Yes | Yes | Yes | Future-only limited | No | Maybe | Maybe | No |
| Appointment status audit | Medium / high by content | No | Yes | Yes | Yes | Future-only limited | No | Maybe | Maybe | No |
| Field Service Report completion audit | High | No | Yes | Yes | Yes | Future-only limited | No | Maybe | Maybe | No |
| Customer fee consent evidence audit | High | No, customer-visible summary only future candidate | Yes | Yes | Yes | Future-only limited | No | Yes | Maybe | No |
| Quote / settlement approval audit future candidate | High | No | Yes | Yes | Yes | Future-only limited | No | Yes | Maybe | No |
| Customer channel binding audit | High | No, generic customer acknowledgement only future candidate | Yes | Yes | Yes | Future-only limited | No | Maybe | Maybe | No |
| Notification delivery audit | Medium / high by provider category | No | Yes | Yes | Yes | Future-only limited | No | Maybe | Yes | No |
| Report / export / download audit | High | No | Yes | Yes | Yes | Future-only limited | No | Maybe | Yes | No |
| AI suggestion / human decision audit | High | No | Yes | Yes | Yes | Future-only limited | No | Maybe | Yes | No |
| Permission / role / entitlement change audit future candidate | High | No | Yes | Yes | Yes | Future-only limited | No | Maybe | Maybe | No |
| Audit access audit | High | No | Yes | Yes | Yes | Future-only limited | No | Maybe | Maybe | No |
| Audit export audit | High | No | Yes | Yes | Yes | Future-only limited | No | Maybe | Yes | No |

AI/RAG retrieval eligible is `No` for audit logs in this matrix. Future systems may create masked derived summaries for specific governance tasks, but that is a separate future design and not raw audit log retrieval.

## Audit Access Rules

Future audit queries must require:

- Data Access Control,
- role / permission,
- organization scope,
- purpose category,
- masking / redaction policy,
- audit access audit,
- elevated permission for high-risk categories,
- tenant isolation,
- safe error behavior.

Support, admin, debug, and maintenance contexts must not become universal cross-organization audit access.

Enterprise SSO does not bypass audit access permission.

Customers must not directly see internal audit logs.

Customer-visible history, if implemented, must be a separate customer-visible summary surface derived from approved customer-visible data, not raw audit records.

## Redaction / Masking Rules

Audit metadata may retain:

- masked reference,
- event category,
- actor category,
- target category,
- organization scope,
- timestamp,
- correlation id,
- result category,
- policy version,
- permission decision category,
- masking applied flag,
- retention class,
- safe failure category.

Audit metadata must not retain:

- complete token,
- secret,
- complete phone,
- complete email,
- complete address,
- LINE access token,
- channel secret,
- raw LINE id,
- raw provider payload,
- verification code,
- signature raw data,
- unmasked photo,
- raw export content,
- raw file content,
- raw query result,
- AI raw sensitive payload,
- full internal note,
- full audit log nested payload,
- provider credential.

If evidence needs to link to signatures, photos, or documents, audit should reference future file metadata rather than store raw content.

## Retention Policy Considerations / Future-only

Future retention policy should consider:

- different retention classes for different audit categories,
- ISO 27001-aligned traceability,
- privacy minimization,
- legal/compliance hold,
- dispute handling,
- customer data deletion policy,
- evidence retention versus audit retention,
- provider diagnostic retention limits,
- AI suggestion retention limits,
- export/download audit retention,
- access-to-audit audit retention.

Retention expiration may require deletion, anonymization, aggregation, or masked archival depending on category and policy.

Retention expiration must not break required compliance chain for records under legal/compliance hold.

Retention policy is future design only and does not approve runtime.

## Interaction With Previous Branches

### Data Access Control

Audit access is itself a data access operation and must be permissioned, masked, and auditable.

### Customer Channel Identity / Notification

Channel binding, verification, consent, preference, provider delivery, and retry audit records must remain internal-only and masked.

### Engineer Mobile

Engineer field actions may produce audit and evidence metadata, but raw photo/signature content belongs in file/object storage, not audit logs.

### Billing / Settlement

Billing, settlement, quote approval, and fee consent audit records are high sensitivity and should require elevated access.

### Operations / Quality

Complaint, callback, risk, corrective action, and quality review audit should remain internal-only unless a future customer-visible summary policy explicitly allows limited content.

### AI / RAG

AI/RAG must not directly full-text retrieve audit logs.

AI audit and feedback learning should use safe metadata or future masked derived summaries, not raw audit payload.

### SaaS Usage Tracking

Usage tracking may link to audit categories, but audit is not usage tracking and usage records must not store raw audit content.

## Explicit Runtime Forbidden Confirmation

Task308 does not approve:

- audit log runtime,
- evidence runtime,
- retention runtime,
- redaction runtime,
- audit access runtime,
- audit export runtime,
- Data Access runtime,
- permission runtime,
- role runtime,
- entitlement runtime,
- usage runtime,
- seat billing runtime,
- report/export/download runtime,
- scheduled report runtime,
- customer channel identity runtime,
- reverse binding runtime,
- verification runtime,
- notification runtime,
- provider sending runtime,
- customer fee consent runtime,
- quote runtime,
- billing runtime,
- settlement runtime,
- AI decision runtime,
- AI / RAG runtime,
- API change,
- Admin UI change,
- DB schema change,
- migration,
- index,
- DDL,
- `psql`,
- `db:migrate`,
- Migration 020 dry-run,
- Migration 020 apply,
- smoke / fixture change,
- package change,
- inventory docs expansion.

## Future Questions

These questions should be answered before audit retention / access / redaction runtime is implemented:

- Which audit categories need mandatory retention?
- Which audit categories can be summarized or anonymized?
- Which audit categories require legal/compliance hold support?
- Which roles can query audit records?
- Which audit queries require elevated approval?
- Which audit exports are allowed, if any?
- How should audit export downloads expire?
- How should audit access audit be retained?
- Which masked derived summaries may be safe for governance AI?
- How should customer data deletion requests interact with required audit traceability?

## Conclusion

Task308 is docs-only audit retention / access / redaction boundary guidance.

It does not approve audit, retention, access, redaction, export, AI/RAG, API, Admin, DB, or migration runtime implementation.

Future audit retention implementation may use this document as planning input, but any runtime, schema, API, Admin UI, audit access, audit export, redaction, retention, Data Access, AI/RAG, permission, usage, or test work requires explicit future approval.
