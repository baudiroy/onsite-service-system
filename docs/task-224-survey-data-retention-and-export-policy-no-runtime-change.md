# Task 224 - Survey Data Retention and Export Policy / No Runtime Change

## Purpose and Scope

Task224 defines a documentation-only policy for future customer satisfaction survey data retention, export, deletion, redaction, privacy, and data separation.

It covers future boundaries for survey response data, internal review data, complaint follow-up, AI advisory data, audit data, provider delivery diagnostics, and export artifacts.

Task224 is not:

- retention runtime implementation,
- export API implementation,
- CSV / report generator,
- DB schema or migration proposal,
- Admin UI,
- customer portal,
- permission / entitlement runtime,
- SaaS billing / usage metering,
- automated test,
- AI decision engine.

This document does not define production retention days, create export artifacts, add tables, modify schema, add Admin screens, or authorize deletion / cleanup.

## Data Category Retention Boundaries

Future survey data must be separated by purpose. Retention policy should not flatten customer feedback, internal review, AI advisory, audit, provider diagnostics, and exports into one undifferentiated record.

### A. Survey Response Data

Possible future contents:

- rating,
- customer free-text feedback,
- submitted time,
- survey context reference,
- final completed appointment reference.

Principles:

- must not be written into Field Service Report internal note,
- must not change Case / Appointment / Field Service Report official status,
- must not be treated as engineer completion input,
- retention and deletion require future policy,
- customer free text may contain sensitive personal information and needs masking / review policy for exports.

### B. Internal Review / Follow-Up Data

Possible future contents:

- low-rating review,
- complaint risk review,
- follow-up task,
- supervisor review,
- service recovery note.

Principles:

- internal-only,
- not customer-visible by default,
- should not be mixed into survey response original content,
- formal complaint creation requires human confirmation, permission, and audit,
- follow-up records should not modify core completion status unless a future approved workflow permits it.

### C. AI Advisory Data

Possible future contents:

- AI summary,
- risk suggestion,
- sentiment label,
- confidence category,
- accepted / rejected status.

Principles:

- AI suggestion is not official record,
- raw AI payload must not be saved in survey records or exports,
- AI inference must not be treated as customer original text,
- AI inference must not be treated as official fact,
- accepted / rejected human decision should be auditable if future runtime exists.

### D. Audit Data

Possible future contents:

- viewed events,
- exported events,
- redacted events,
- deleted events,
- reviewed events,
- entitlement / permission denial events.

Principles:

- internal-only,
- not customer-visible,
- should not contain raw sensitive values,
- should not become a customer support transcript,
- retention may differ from survey response retention.

### E. Delivery Diagnostics

Possible future contents:

- delivery status,
- provider failure category,
- retry count,
- suppression reason.

Principles:

- internal-only,
- must not store raw provider payload,
- must not be exported to customers,
- must not be shown as raw provider error,
- must not be treated as Case / Appointment / Field Service Report status.

### F. Export Artifacts

Possible future artifacts:

- CSV,
- management report,
- analytics extract,
- quality review packet.

Principles:

- must be organization scoped,
- must be redacted / masked where needed,
- must produce audit when generated or downloaded,
- must not become uncontrolled long-term sensitive-data copies,
- must not include sensitive identifiers in filenames or artifact metadata.

## Retention Policy Readiness

Task224 does not set production retention periods.

Future questions:

- How long should survey response records be retained?
- Should customer free-text feedback have a different retention period from numeric rating?
- How long should low-rating review records be retained?
- Should formal complaint data use a different retention rule?
- How long should AI advisory data be retained?
- How long should AI accepted / rejected decisions be retained?
- How long should delivery diagnostics be retained?
- How long should audit log be retained?
- How long should export artifacts be retained?
- What happens when an organization terminates service?
- How should legal hold / dispute / complaint preservation override deletion?
- Can different SaaS plans support different retention policies?
- Which regional privacy laws require legal review?

Task224 does not:

- define production retention days,
- add runtime config,
- add plan policy,
- execute deletion,
- execute cleanup,
- define legal hold runtime.

## Export Policy Readiness

Future export must be controlled.

Export must:

- authenticate actor,
- resolve organization scope,
- check entitlement,
- check permission,
- check resource visibility,
- apply redaction / masking,
- exclude forbidden internal diagnostics,
- generate audit event,
- avoid cross-organization data mixing,
- respect retention / deletion / legal hold policy,
- avoid raw identifiers in filename, metadata, screenshots, and QA artifacts.

Export must not include:

- complete mobile / phone / tel values unless a future lawful and permissioned export explicitly allows it,
- raw LINE user id,
- token / secret,
- provider credential,
- raw provider payload,
- raw AI payload,
- internal diagnostic payload,
- SQL error,
- stack trace,
- DB constraint name,
- billing / settlement internal data unless a future approved export scope explicitly allows it,
- AI inference labeled as customer original text,
- internal review note labeled as customer-visible content.

Export should include only the minimum data needed for the approved purpose.

## Export Surface Separation

### Customer Export / Customer-Visible Copy

If future customer export exists, it may include:

- the customer's own submitted feedback,
- safe general status,
- customer-facing response.

It must not include:

- internal review,
- AI advisory,
- audit log,
- provider diagnostics,
- complaint handling internal note,
- engineer internal comment,
- billing / settlement internal data.

### Internal Operational Export

Future internal operational export may include:

- organization-scoped rating data,
- review status,
- follow-up status,
- redacted comment,
- low-rating queue summary.

Requirements:

- permission,
- entitlement if applicable,
- organization scope,
- audit,
- redaction / masking.

### Supervisor / Quality Export

Future supervisor / quality export may include:

- quality trend,
- low-rating category,
- follow-up outcome,
- AI advisory accepted / rejected summary.

Requirements:

- no raw sensitive values by default,
- no customer mobile by default,
- no raw LINE identity,
- no provider raw payload,
- no raw AI payload.

### Tenant Admin Export

Future tenant admin export may include:

- organization-scoped summary,
- plan-entitled export type,
- usage-sensitive export operation.

Requirements:

- no cross-organization data,
- no hidden resources,
- no unauthorized provider diagnostics,
- audit for generation and download.

## Redaction and Masking Requirements

Future redaction / masking policy should include:

- customer mobile must be masked or excluded unless a future lawful / permissioned export explicitly allows it,
- raw LINE user id must never be exported,
- token / secret / provider credential must never be exported,
- provider raw payload must never be exported,
- AI raw payload must never be exported,
- internal diagnostic payload must never be exported,
- free-text feedback may contain sensitive personal information and requires future masking policy,
- filenames must not include sensitive identifiers,
- screenshots / QA artifacts / handoffs must not include unmasked sensitive data,
- exports should use correlation-safe references only where appropriate.

Redaction should be policy-driven, auditable, and reversible only when a future authorized workflow explicitly permits it. Task224 does not implement redaction.

## Deletion / Redaction / Correction Readiness

Task224 does not implement deletion, redaction, or correction runtime.

Future considerations:

- customer correction request,
- customer deletion request,
- internal redaction request,
- organization retention deletion,
- legal hold override,
- complaint dispute preservation,
- audit event retention after redaction,
- redaction of free-text personal information,
- AI summary regeneration after source correction,
- export artifact invalidation after deletion / redaction,
- supervisor approval for destructive actions.

Rules:

- AI must not automatically delete, rewrite, or mask official record,
- deletion / redaction requires permission, audit, and organization scope,
- destructive actions must not be used to avoid audit or complaint review,
- deletion / redaction must not silently alter Field Service Report official completion record,
- retention cleanup must not run against shared runtime without explicit approved policy.

## Organization Isolation and SaaS Readiness

Retention and export must be organization scoped.

Principles:

- admin permission must not bypass organization isolation,
- cross-organization analytics, if ever needed, requires separate anonymization and authorization design,
- plan-based retention / export / analytics is a future entitlement direction,
- usage-based export limits are a future usage metering direction,
- Task224 does not add entitlement runtime,
- Task224 does not add usage metering runtime,
- Task224 does not add billing / subscription / pricing.

Placeholder future feature keys:

- `survey_response_export`
- `survey_quality_export`
- `survey_audit_export`
- `survey_data_retention_policy`
- `survey_privacy_redaction`
- `survey_analytics_export`
- `survey_cross_org_anonymized_analytics`

These are not production feature keys.

## AI Advisory-Only Boundary

AI may:

- suggest free-text that may need masking,
- summarize export contents for authorized internal roles,
- flag data quality issues,
- generate retention / export policy checklist drafts,
- classify low-rating trends.

AI must not:

- automatically export survey data,
- automatically delete survey response,
- automatically mask official record,
- automatically rewrite customer original text,
- automatically modify audit event,
- bypass retention / legal hold,
- approve export,
- bypass permission / organization scope / entitlement,
- write uncertain inference into official record.

AI suggestions remain advisory and require human confirmation for official actions.

## Audit Readiness

Future audit events may include:

- survey export requested,
- survey export approved,
- survey export rejected,
- survey export generated,
- survey export downloaded,
- survey export expired,
- survey export deleted,
- survey redaction requested,
- survey redaction approved,
- survey redaction rejected,
- survey redaction applied,
- survey deletion requested,
- survey deletion approved,
- survey deletion rejected,
- retention policy viewed,
- retention policy changed,
- legal hold applied,
- legal hold released,
- AI redaction suggestion generated,
- AI redaction suggestion accepted / rejected.

Audit redaction:

- do not record complete mobile / phone / tel values,
- do not record raw LINE user id,
- do not record token / secret / provider credential,
- do not record raw provider payload,
- do not record AI raw payload,
- do not expose audit to customer-visible surfaces.

## Failure and Ambiguity Handling

Fail closed:

- if organization scope is unclear, do not export,
- if permission is insufficient, do not export,
- if entitlement is insufficient, do not export,
- if resource visibility is unclear, do not export,
- if redaction status is unclear, do not export,
- if legal hold / deletion conflict is unclear, do not delete,
- if export content classification is unclear, do not export,
- if AI-only redaction confidence is insufficient, do not mask official record automatically,
- if customer identity or channel identity is ambiguous, do not reveal whether Case / survey exists.

Safe-deny messages should avoid resource enumeration and internal state leakage.

## Explicit Non-Goals

Task224 does not:

- create export API,
- create retention runtime,
- create deletion runtime,
- create redaction runtime,
- create export artifact storage,
- create survey table,
- add migration,
- modify schema,
- add indexes,
- add permission,
- add entitlement,
- add usage metering,
- add billing / subscription / pricing,
- modify backend service / repository / controller,
- modify Admin UI,
- add customer portal,
- add AI analysis runtime,
- add provider integration,
- send LINE / APP / SMS / email,
- add outbox / worker,
- add automated test / fixture / smoke,
- add localization file,
- modify package.json,
- modify inventory docs,
- touch Migration020,
- execute DB / psql / db:migrate / DDL / cleanup,
- touch shared Zeabur runtime.

## Future Implementation Approval Boundary

Task224 is retention and export policy design only.

Future implementation requires separate PM / user approval for:

- retention runtime,
- deletion runtime,
- redaction runtime,
- export API,
- export artifact storage,
- permission and entitlement enforcement,
- organization-scoped export tests,
- redaction tests,
- Admin UI,
- localization,
- audit runtime,
- usage metering,
- legal review if required.

## Verification Checklist

Task224 completion should verify:

- docs-only change,
- no backend source touched,
- no Admin source touched,
- no API touched,
- no migration / schema / index touched,
- no DB / DDL / psql / db:migrate executed,
- no Migration020 dry-run / apply,
- no shared Zeabur runtime touched,
- no provider sending,
- no LINE / APP / SMS / email sending,
- no survey runtime,
- no notification runtime,
- no audit runtime,
- no permission runtime,
- no entitlement runtime,
- no feature flag runtime,
- no usage metering runtime,
- no export runtime,
- no retention runtime,
- no deletion runtime,
- no redaction runtime,
- no outbox / worker,
- no survey token / web form,
- no AI analysis runtime,
- no AI auto-decision,
- no smoke / automated tests / fixtures / QA scripts touched,
- no localization files touched,
- no package.json change,
- no inventory docs change,
- sensitive / internal diagnostic scan contains no actual sensitive values.
