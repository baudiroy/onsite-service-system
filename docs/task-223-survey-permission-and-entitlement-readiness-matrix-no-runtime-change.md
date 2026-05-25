# Task 223 - Survey Permission and Entitlement Readiness Matrix / No Runtime Change

## Purpose and Scope

Task223 defines a documentation-only readiness matrix for future survey permission and entitlement boundaries across survey runtime, delivery, response review, low-rating review, manual resend, audit, export, and AI advisory surfaces.

Task223 is not:

- permission runtime implementation,
- entitlement runtime implementation,
- RBAC migration,
- feature flag runtime,
- usage metering runtime,
- SaaS billing / subscription implementation,
- API contract,
- Admin UI,
- survey runtime,
- provider sending,
- automated test.

This document does not add permissions, add feature keys, modify RBAC, add API enforcement, modify Admin UI, add migration, or authorize provider sending.

## Core Principles

Permission and entitlement are different concepts:

- permission controls whether a specific user can perform an action,
- entitlement controls whether an organization has access to a feature.

Principles:

- even if an organization has entitlement, the user still needs permission,
- even if a user has permission, the organization still needs entitlement,
- all future API / Admin / export / AI advisory surfaces must check identity, role, permission, and organization scope,
- organization isolation must not be bypassed by admin permissions,
- customer-visible data and internal-only data must stay separated,
- AI must not bypass permission, entitlement, or organization scope,
- LINE identity must not be treated as a global identity,
- survey delivery must not be hard-coded to LINE,
- safe-deny and non-leakage must apply to permission failure, entitlement failure, scope mismatch, hidden resources, and ambiguous identity.

## Future Survey Permission Catalog Draft

The following placeholder permissions are readiness examples only. They are not production permissions, not RBAC seed values, not API enforcement, and not Admin UI requirements.

### A. Survey Eligibility / Trigger Readiness

Placeholder permissions:

- `survey.eligibility.view`
- `survey.eligibility.review`
- `survey.eligibility.override_review`

Use cases:

- view why a survey is or is not eligible,
- review ambiguous eligibility,
- request explicit exception review.

### B. Survey Delivery / Channel Readiness

Placeholder permissions:

- `survey.delivery.status.view`
- `survey.delivery.channel.view`
- `survey.delivery.diagnostics.view`
- `survey.delivery.retry.request`

Use cases:

- view delivery status,
- view selected channel category,
- view internal provider diagnostic summary,
- request delivery retry review.

### C. Survey Response

Placeholder permissions:

- `survey.response.view`
- `survey.response.comment.view`
- `survey.response.internal_review.view`
- `survey.response.classify`
- `survey.response.redact_request`

Use cases:

- view rating,
- view customer free-text feedback,
- view internal review context,
- classify response category,
- request redaction review.

### D. Low-Rating / Complaint Follow-Up

Placeholder permissions:

- `survey.low_rating.queue.view`
- `survey.follow_up.create`
- `survey.follow_up.assign`
- `survey.follow_up.update`
- `survey.follow_up.close`
- `survey.follow_up.reopen`
- `survey.complaint_review.escalate`
- `survey.complaint_review.dismiss`
- `survey.formal_complaint.create_from_review`

Use cases:

- handle low-rating queue,
- create and manage follow-up,
- escalate complaint risk,
- dismiss not-complaint with human decision,
- create formal complaint from review with permission and audit.

### E. Manual Resend / Retry

Placeholder permissions:

- `survey.resend.request`
- `survey.resend.approve`
- `survey.resend.execute`
- `survey.retry.request`
- `survey.duplicate_suppression.view`

Use cases:

- request resend,
- approve resend,
- execute resend if future policy allows,
- request retry review,
- inspect duplicate suppression reason.

### F. Audit / Export / Retention

Placeholder permissions:

- `survey.audit.view`
- `survey.audit.export`
- `survey.response.export`
- `survey.retention.review`
- `survey.privacy.redaction.view`

Use cases:

- view survey audit trail,
- export audit or response data,
- review retention policy,
- inspect redaction event history.

### G. AI Advisory

Placeholder permissions:

- `survey.ai.summary.view`
- `survey.ai.suggestion.view`
- `survey.ai.suggestion.accept_for_review`
- `survey.ai.suggestion.reject`

Use cases:

- view AI summary,
- view AI advisory suggestion,
- accept suggestion into human review,
- reject suggestion.

Future implementation requires separate permission design, migration, seed, API enforcement, Admin UI, and test tasks.

## Future Entitlement Feature Key Draft

The following placeholder feature keys are readiness examples only. They are not production feature keys and do not add entitlement runtime.

### A. Core Survey

- `survey_runtime`
- `survey_completion_trigger`
- `survey_response_view`

### B. Delivery Channels

- `survey_delivery`
- `survey_channel_line`
- `survey_channel_sms`
- `survey_channel_email`
- `survey_channel_app`
- `survey_web_link`
- `survey_channel_fallback`

### C. Review Workflow

- `survey_low_rating_queue`
- `survey_follow_up_workflow`
- `survey_complaint_risk_review`
- `survey_supervisor_review`

### D. Manual Resend / Retry

- `survey_manual_resend`
- `survey_delivery_retry`
- `survey_resend_approval`
- `survey_duplicate_suppression`

### E. AI Add-On

- `survey_ai_summary`
- `survey_ai_risk_suggestion`
- `survey_ai_follow_up_suggestion`

### F. Audit / Export / Analytics / Retention

- `survey_audit_view`
- `survey_delivery_audit_view`
- `survey_response_export`
- `survey_quality_dashboard`
- `survey_data_retention_policy`
- `survey_privacy_redaction_audit`

This document does not add:

- entitlement runtime,
- feature flag runtime,
- usage metering runtime,
- billing runtime,
- subscription runtime,
- plan pricing.

AI add-on, export, SMS, provider usage, and storage usage may require future usage limits, but Task223 does not implement them.

## Permission-to-Entitlement Readiness Matrix

This matrix is a readiness draft only. It does not mean the feature exists, the permission exists, the entitlement exists, API is authorized, or Admin UI is authorized.

| Future capability | Placeholder entitlement | Placeholder permission | Actor category | Surface | Org scope | Audit | AI allowed? | Provider sending involved? | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| View survey eligibility status | `survey_completion_trigger` | `survey.eligibility.view` | Customer service / supervisor | Internal-only | Required | Recommended | No decision | No | Future design only |
| Review ambiguous eligibility | `survey_completion_trigger` | `survey.eligibility.review` | Supervisor / quality manager | Internal-only | Required | Required | Advisory only | No | Future design only |
| View survey response rating | `survey_response_view` | `survey.response.view` | Customer service / supervisor | Internal-only | Required | Recommended | Summary only | No | Future design only |
| View customer free-text feedback | `survey_response_view` | `survey.response.comment.view` | Customer service / supervisor | Internal-only | Required | Recommended | Summary only | No | Future design only |
| View low-rating queue | `survey_low_rating_queue` | `survey.low_rating.queue.view` | Supervisor / quality manager | Internal-only | Required | Recommended | Risk summary only | No | Future design only |
| Create follow-up | `survey_follow_up_workflow` | `survey.follow_up.create` | Customer service / supervisor | Internal-only | Required | Required | Suggest draft only | No | Future design only |
| Assign follow-up | `survey_follow_up_workflow` | `survey.follow_up.assign` | Supervisor / quality manager | Internal-only | Required | Required | No decision | No | Future design only |
| Create formal complaint from review | `survey_complaint_risk_review` | `survey.formal_complaint.create_from_review` | Supervisor / quality manager | Internal-only | Required | Required | Suggest only | No | Future design only |
| Request manual resend | `survey_manual_resend` | `survey.resend.request` | Customer service / supervisor | Internal-only | Required | Required | Suggest only | Potential future | Future design only |
| Approve manual resend | `survey_resend_approval` | `survey.resend.approve` | Supervisor / tenant admin | Internal-only | Required | Required | No decision | Potential future | Future design only |
| View delivery diagnostics | `survey_provider_diagnostics` | `survey.delivery.diagnostics.view` | Supervisor / tenant admin | Internal-only | Required | Required | Summary only | No direct send | Future design only |
| View AI summary | `survey_ai_summary` | `survey.ai.summary.view` | Authorized internal roles | Internal-only | Required | Recommended | Read only | No | Future design only |
| Accept / reject AI suggestion | `survey_ai_risk_suggestion` | `survey.ai.suggestion.accept_for_review` / `survey.ai.suggestion.reject` | Customer service / supervisor | Internal-only | Required | Required | Human-confirmed only | No | Future design only |
| Export survey responses | `survey_response_export` | `survey.response.export` | Tenant admin / authorized manager | Internal-only export | Required | Required | No decision | No | Future design only |
| View survey audit trail | `survey_audit_view` | `survey.audit.view` | Supervisor / tenant admin | Internal-only | Required | Required | Summary for authorized roles only | No | Future design only |
| Configure retention policy | `survey_data_retention_policy` | `survey.retention.review` | Tenant admin / compliance role | Internal-only | Required | Required | No decision | No | Future design only |

## Suggested Future Evaluation Order

Future API / Admin / export / AI advisory surfaces should evaluate access in a consistent order.

Suggested order:

1. Authenticate actor.
2. Resolve organization / tenant scope.
3. Resolve resource visibility within organization.
4. Check organization entitlement / feature availability.
5. Check user permission.
6. Check workflow state / idempotency / suppression.
7. Check channel / provider readiness if sending is involved.
8. Apply safe-deny / non-leakage.
9. Write audit event for allowed or important denied actions where safe.
10. Keep AI advisory separate from official decision.

Rules:

- organization scope mismatch should safe-deny early,
- entitlement failure should not reveal hidden resource existence,
- permission failure should not reveal cross-organization resource existence,
- channel identity ambiguity should not reveal LINE binding or mobile correctness,
- provider readiness failure should not leak provider diagnostics to customers.

## Actor Category Readiness

Future actor categories:

- customer,
- customer service,
- dispatcher,
- supervisor / quality manager,
- engineer,
- tenant admin,
- system process,
- AI advisory process,
- provider callback / provider diagnostic source.

Boundaries:

- engineer should not see full low-rating or complaint content by default,
- customer must not see internal note, audit log, provider diagnostics, AI raw payload, or billing / settlement internal data,
- AI advisory process is not an authority subject and must not execute formal actions by itself,
- provider callback is not a business decision actor,
- system process must still operate inside organization scope and feature boundaries.

## Safe-Deny and Non-Leakage Policy

Safe-deny applies to:

- missing permission,
- missing entitlement,
- cross organization,
- hidden survey response,
- hidden Case,
- deleted / archived / unavailable resource,
- ambiguous customer identity,
- ambiguous channel identity,
- LINE binding ambiguity,
- provider readiness unknown,
- suppression / opt-out ambiguity,
- AI-only uncertainty.

Do not reveal:

- whether a Case exists,
- whether a survey exists,
- whether customer mobile is correct,
- whether LINE is bound,
- whether provider attempted sending,
- internal workflow state,
- whether low rating / complaint exists,
- entitlement / pricing / plan internal details to unauthorized users.

Customer-facing failures should use safe general messages. Internal diagnostics require permission, entitlement, organization scope, and audit.

## Customer-Visible vs Internal Permission Boundary

### Customer-Visible

Customers may see:

- their own survey link / submit result,
- safe general error message,
- their submitted feedback,
- customer-facing service reply.

Customers must not see:

- internal survey review,
- low-rating queue,
- formal complaint internal decision,
- engineer internal note,
- supervisor note,
- AI suggestion,
- audit log,
- provider diagnostics,
- delivery retry status,
- billing / settlement internal data.

### Internal-Only

Internal surfaces may include, subject to permission and organization scope:

- delivery status,
- response review,
- complaint risk,
- follow-up workflow,
- AI advisory summary,
- audit trail,
- export / analytics,
- provider diagnostics.

Internal-only does not mean all employees can see it. Internal surfaces still require role, permission, entitlement, and organization scope.

## AI Advisory-Only Boundary

AI may:

- summarize survey response for authorized internal roles,
- flag possible follow-up need,
- suggest permission / entitlement gap,
- organize low-rating queue review context,
- draft internal callback outline.

AI must not:

- authorize users,
- enable organization entitlement,
- bypass feature gate,
- send survey,
- resend survey,
- create or close formal complaint,
- modify Case / Appointment / Field Service Report,
- approve refund / compensation / quote / settlement,
- view or leak unauthorized data,
- write uncertain content into official record.

AI suggestions must stay advisory and require human confirmation for official actions.

## Audit Readiness

Future audit events may include:

- survey permission denied,
- survey entitlement denied,
- survey resource hidden by scope,
- survey response viewed,
- low-rating queue viewed,
- follow-up created,
- manual resend requested,
- manual resend approved / rejected,
- delivery diagnostics viewed,
- AI suggestion viewed,
- AI suggestion accepted / rejected,
- survey export requested,
- survey audit viewed,
- retention policy viewed / changed,
- entitlement gated feature attempted.

Audit redaction:

- do not record complete mobile / phone / tel values,
- do not record raw LINE user id,
- do not record token / secret / provider credential,
- do not record raw provider payload,
- do not record AI raw payload,
- do not expose audit to customer-visible surfaces.

## Explicit Non-Goals

Task223 does not:

- add permission,
- add role,
- add entitlement,
- add feature flag,
- add usage metering,
- add billing / subscription / plan pricing,
- add survey table,
- add migration,
- modify schema,
- add indexes,
- add API,
- modify backend service / repository / controller,
- modify Admin UI,
- add survey runtime,
- add provider integration,
- send LINE / APP / SMS / email,
- add outbox / worker,
- add audit runtime,
- add AI analysis runtime,
- add automated test / fixture / smoke,
- add localization file,
- modify package.json,
- modify inventory docs,
- touch Migration020,
- execute DB / psql / db:migrate / DDL / cleanup,
- touch shared Zeabur runtime.

## Future Implementation Approval Boundary

Task223 is readiness documentation only.

Future implementation requires separate PM / user approval for:

- production permission names,
- production entitlement feature keys,
- RBAC / permission seed changes,
- feature flag or entitlement runtime,
- usage metering,
- API enforcement,
- Admin UI,
- customer-visible surface,
- survey runtime,
- provider sending,
- audit runtime,
- export / retention policy,
- tests and smoke coverage.

## Verification Checklist

Task223 completion should verify:

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
- no SaaS billing / subscription / plan pricing,
- no outbox / worker,
- no survey token / web form,
- no AI analysis runtime,
- no AI auto-decision,
- no smoke / automated tests / fixtures / QA scripts touched,
- no localization files touched,
- no package.json change,
- no inventory docs change,
- sensitive / internal diagnostic scan contains no actual sensitive values.
