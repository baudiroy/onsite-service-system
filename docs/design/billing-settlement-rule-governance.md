# Billing / Settlement / Reconciliation Rule Governance

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Positioning

Billing, Settlement, and Reconciliation rules must support source-file governance, AI-assisted rule drafts, human review, dry-run validation, versioned activation, and settlement result traceability.

Vendor contracts, brand rules, Excel files, PDFs, and policy documents should remain traceable source evidence. They must not disappear after AI parsing.

## Source File Governance

Future source files should track:

- source_file_id
- organization_id
- vendor_id
- brand_id
- contract_id when applicable
- file_name
- file_type
- file_version
- effective_from
- effective_to
- uploaded_by
- uploaded_at
- file_hash / checksum
- storage_path / object storage reference
- status
- audit log

Source files must use file / object storage rather than large main-table fields. Access must follow organization scope, permission, field-level masking, audit log, and sensitive data policy.

## AI-assisted Rule Draft

AI may parse contracts, summarize terms, propose rule drafts, detect missing conditions, find conflicts, suggest effective periods, explain applicability, and summarize dry-run anomalies.

AI must not create official rules, activate rules, approve settlements, change payable amounts, overwrite existing rules, ignore missing evidence, or write uncertain content into official rules.

AI output is draft / suggestion, not official rule.

## Human Review / Dry-run / Approval

Official rule activation should follow:

1. AI or human creates rule draft.
2. Authorized staff review and edit.
3. Historical or test data dry-run.
4. Results, differences, anomalies, and missing evidence are shown.
5. Finance / admin / supervisor approves according to permission.
6. Official rule version is created.
7. Audit log is written.

High-risk rules such as amount, non-billable conditions, exception conditions, and extra fees require extra review. AI confidence must not skip human approval.

## Rule Versioning

Rules must be versioned rather than overwritten.

Future rule sets should track:

- rule_set_id
- rule_version
- organization_id
- vendor_id
- brand_id
- contract_id
- source_file_id
- effective_from
- effective_to
- status
- approved_by
- approved_at
- created_at
- updated_at

Old cases should remain traceable to the rules that were effective at the relevant case / completion / contract period. New contracts must not silently rewrite old settlement results.

## Settlement Result Traceability

Settlement results must cite the rule version and source file used. They must not store only the final amount.

Future results should track:

- settlement_result_id
- case_id
- appointment_id / finalAppointmentId when applicable
- field_service_report_id
- vendor_id
- brand_id
- rule_set_id
- rule_version
- source_file_id
- calculated_amount
- calculation_breakdown
- applied_conditions
- missing_evidence
- exception_flags
- review_status
- approved_by
- approved_at
- created_at

Amounts must be explainable. Missing evidence, exceptions, human adjustments, AI anomaly prompts, and approval status should remain traceable.

## AI and Data Protection

AI parsing must follow AI-assisted file import protection, Data Access Control, organization scope, permission, sensitive data masking / redaction, minimum necessary context, audit log, and Cloud AI / External AI Provider Data Protection.

External AI providers must not receive complete unmasked files when source files contain customer personal data, full address, internal notes, prices, internal settlement data, or sensitive contract terms.

## Future Tasks

- source file storage model
- rule draft model
- rule versioning model
- approval workflow
- dry-run engine
- settlement result traceability
- audit log integration
- data protection review for AI-assisted parsing
