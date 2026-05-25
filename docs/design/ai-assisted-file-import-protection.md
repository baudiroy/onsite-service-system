# AI-assisted File Import Raw File Protection

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Core Rule

AI-assisted file import does not mean sending the full raw file to AI.

The system must parse, minimize, mask, and filter file content first. External AI providers may only receive the minimum necessary content required for field mapping, validation assistance, summary, or classification after permission check, organization scope filtering, and sensitive data masking / redaction.

## Future Import Targets

AI-assisted import may later support:

- repair intake data
- customer data
- case data
- parts / part-code tables
- vehicle stock / warehouse stock
- brand rules / vendor settlement rules
- repair manuals / SOP / RAG knowledge documents

These files may contain customer name, phone, address, case description, product serials, internal notes, prices, settlement rules, parts data, photos, or other sensitive data.

## AI May Help

AI may help with:

- field name recognition
- mapping suggestion
- format error summary
- missing field reminder
- duplicate data risk
- fault description summary
- product type guess
- preliminary part-code suggestion
- import error summary
- RAG document classification and summary

AI suggestions must not equal official data.

## AI Must Not Receive Full Raw Files

Do not send complete raw repair files, complete customer lists, complete case imports, full phone, full address, full customer name, raw signature, unmasked photos, full internal notes, full audit logs, full billing/settlement internal data, token, secret, LINE access token, LINE channel secret, webhook secret, binding token, verification code, or cross-tenant data.

External AI assistance may only receive minimum necessary, masked, filtered, organization-scoped snippets.

## Correct Import Flow

Recommended future flow:

1. User uploads file.
2. System checks user identity, role, permission, and organization scope.
3. System checks file type, file size, and security risk.
4. System performs deterministic parsing.
5. System extracts headers and necessary sample rows.
6. System masks / redacts sensitive sample values.
7. External AI receives only minimum necessary masked content.
8. AI returns mapping, error summary, classification, or suggestion.
9. System performs dry-run validation.
10. User reviews and confirms import.
11. System writes formal Case / Customer / Parts / Inventory / Billing / RAG knowledge only after deterministic validation and human confirmation.
12. Audit log is written.
13. Import volume and AI usage may be tracked for SaaS usage.

## Example Principle

Do not send full personal rows. A masked sample may keep only enough structure for mapping, such as masked name, masked phone, approximate area, product type, and symptom category.

Any examples in documentation must be synthetic, not production customer data.

## Official Write Restrictions

AI must not automatically create official customer or case, overwrite customer/case/parts/inventory/billing data, merge customers, create high-risk settlement rules, add unvalidated documents to production RAG, compare across organizations, or write uncertain content into official records.

Official writes require deterministic validation, business logic, or human confirmation.

## Shared Principles

AI-assisted import must follow Data Access Control, organization isolation, permission, feature entitlement, customer visible data policy, internal data policy, masking/redaction, minimum necessary context, audit log, SaaS usage tracking, Cloud AI data protection, and permission-aware RAG.

AI import must not become a shortcut around permission, masking, audit, or formal validation.

## Future Tasks

- deterministic parser
- import staging / dry-run validation
- masking / redaction policy
- AI mapping helper
- human confirmation flow
- row-level import status
- audit log
- usage tracking
- RAG ingestion quarantine / approval
