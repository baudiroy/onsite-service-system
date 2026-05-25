# Task 220 - Survey Low-Rating and Complaint Follow-Up Workflow Design / No Runtime Change

## Purpose and Scope

Task220 defines a documentation-only design for future low-rating, negative feedback, complaint-risk, service recovery, and supervisor follow-up workflows related to customer satisfaction surveys.

This document does not implement workflow runtime, complaint records, follow-up records, AI analysis runtime, provider sending, Admin UI, API behavior, DB schema, or tests.

Task220 is not:

- complaint workflow implementation,
- survey runtime implementation,
- AI analysis runtime,
- DB schema or migration proposal,
- API contract implementation,
- Admin UI implementation,
- customer portal implementation,
- notification / provider sending implementation,
- automated test implementation.

## Low Rating vs Formal Complaint Distinction

Low rating is a customer satisfaction signal. It is not automatically a formal complaint.

Definitions:

- low rating = customer satisfaction signal,
- negative comment = customer feedback text,
- complaint risk = internal risk marker,
- formal complaint = independent workflow that requires explicit creation conditions, permission, audit, and human confirmation,
- service recovery = future controlled process for follow-up, remediation, or supervisor review.

Principles:

- low rating must not automatically become formal complaint,
- AI complaint risk suggestion must not automatically become formal complaint,
- customer dissatisfaction text does not authorize automatic complaint conclusions,
- low rating may enter future review queue,
- low rating must not directly change Case completion status,
- low rating must not directly change Appointment status,
- low rating must not directly change Field Service Report status.

## Workflow Concepts

Task220 may use conceptual workflow terms, but they are not executable schema.

Conceptual terms:

- low-rating review,
- complaint risk review,
- follow-up task,
- service recovery review,
- supervisor review,
- customer callback record,
- complaint escalation,
- complaint dismissed / not a complaint,
- follow-up completed,
- unresolved risk,
- review reopened.

These are not:

- table names,
- migration proposals,
- production status enums,
- API contracts,
- Admin UI routes,
- runtime workflow states.

Future implementation requires separate migration, API, Admin, permission, and test tasks.

## Suggested Future Workflow States

Placeholder future states:

- `review_needed`,
- `under_review`,
- `follow_up_required`,
- `contact_attempted`,
- `customer_reached`,
- `service_recovery_proposed`,
- `escalated_to_supervisor`,
- `formal_complaint_created`,
- `dismissed_not_complaint`,
- `resolved`,
- `reopened`.

These are placeholders only.

Task220 does not:

- add enum values,
- add DB columns,
- add runtime state machine,
- add API behavior,
- define production behavior.

## Trigger and Intake Readiness

Possible future intake sources:

- survey low rating,
- survey negative free text,
- customer service manual flag,
- supervisor manual flag,
- repeated failed follow-up,
- AI advisory risk flag,
- external customer complaint channel.

Limitations:

- AI flag can enter review only; it must not create a complaint automatically,
- provider delivery failure should not become complaint,
- billing / settlement dispute should not be mixed into survey response and requires separate workflow,
- engineer internal note should not automatically generate customer complaint,
- any intake must be organization scoped,
- any formal complaint creation requires permission, audit, and human confirmation.

## Human Action Boundaries

Possible future human actions:

- mark review needed,
- assign reviewer,
- add follow-up note,
- record customer callback,
- mark unable to reach customer,
- escalate to supervisor,
- dismiss as not complaint,
- create formal complaint,
- mark follow-up completed,
- reopen review.

Future action requirements:

- every action needs permission,
- every action needs organization scope,
- important actions need audit,
- actions must not automatically modify Case / Appointment / Field Service Report unless a future workflow explicitly permits it,
- engineer completion flow must not become an overly complex form because of complaint follow-up needs.

Task220 does not implement these actions.

## Data Separation Requirements

Future low-rating and complaint follow-up data must not be mixed into:

- Field Service Report internal note,
- appointment completion note,
- billing / settlement internal approval,
- engineer private comment,
- customer-visible survey response,
- provider delivery diagnostics,
- audit log customer-visible response.

Future data categories should remain separated:

- survey response,
- low-rating review,
- complaint risk review,
- follow-up action,
- supervisor review,
- AI advisory suggestion,
- audit events,
- customer-visible messages,
- internal-only notes.

## Customer-Visible vs Internal Surfaces

### Customer-Visible Future Surfaces

Customer-visible surfaces may include:

- general response received message,
- safe message that customer service may contact them,
- service recovery confirmation text if future policy allows,
- customer-submitted content.

Customer-visible surfaces must not include:

- AI risk label,
- internal complaint classification,
- supervisor note,
- engineer internal note,
- audit log,
- provider diagnostics,
- billing / settlement internal decision,
- internal responsibility determination.

### Internal Future Surfaces

Internal future surfaces may include:

- low-rating queue,
- complaint risk queue,
- follow-up list,
- supervisor review panel,
- AI advisory summary,
- audit trail,
- delivery context reference.

Internal future surfaces still require permission and organization scope.

## AI Advisory-Only Boundary

AI may assist future low-rating and complaint workflows by:

- summarizing dissatisfaction content,
- classifying possible issue category,
- flagging possible supervisor callback need,
- suggesting follow-up priority,
- drafting internal callback outline,
- helping supervisors organize review context.

Issue categories may include:

- service attitude,
- wait time,
- fee dispute,
- repair result,
- communication problem,
- repeated visit concern,
- parts delay concern.

AI must not:

- automatically create formal complaint,
- automatically close complaint,
- automatically close follow-up,
- automatically decide engineer responsibility,
- automatically approve refund,
- automatically approve compensation,
- automatically approve discount,
- automatically approve quote,
- automatically approve settlement,
- automatically notify customer of compensation commitment,
- automatically modify Case,
- automatically modify Appointment,
- automatically modify Field Service Report,
- automatically modify official survey response content,
- bypass permission,
- bypass organization scope,
- bypass entitlement,
- write uncertain inference into official record.

## Permission / Organization Scope Readiness

Task220 does not implement permissions.

Future permission questions:

- who can view low-rating queue,
- who can view customer free-text feedback,
- who can view AI advisory summary,
- who can assign reviewer,
- who can create follow-up,
- who can dismiss risk,
- who can escalate to supervisor,
- who can create formal complaint,
- who can close follow-up,
- who can reopen review,
- who can export low-rating / complaint analysis.

Principles:

- all future APIs must check identity,
- all future APIs must check role,
- all future APIs must check permission,
- all future APIs must check organization scope,
- all future Admin actions must check organization scope,
- Admin permission must not override organization isolation,
- customer-visible and internal-only data must remain separated,
- safe-deny / non-leakage applies to cross-organization, missing permission, hidden, deleted, and nonexistent resources.

## SaaS-Ready / Entitlement Readiness

Task220 does not implement entitlement.

Possible placeholder future feature keys:

- `survey_low_rating_queue`,
- `survey_complaint_risk_review`,
- `survey_follow_up_workflow`,
- `survey_supervisor_review`,
- `survey_ai_risk_summary`,
- `survey_service_recovery_tracking`,
- `survey_complaint_export`,
- `survey_quality_dashboard`.

These are placeholders only and not production feature keys.

Principles:

- no entitlement runtime is added,
- no usage metering runtime is added,
- no billing / subscription / plan pricing runtime is added,
- permission controls what a user can do,
- entitlement controls what an organization has enabled,
- permission and entitlement must not be confused,
- entitlement does not bypass RBAC,
- RBAC does not bypass organization scope.

## Audit Readiness

Future audit events may include:

- low rating review created,
- complaint risk flagged,
- follow-up task created,
- reviewer assigned,
- customer callback recorded,
- unable to reach customer recorded,
- supervisor escalation created,
- formal complaint created from review,
- review dismissed as not complaint,
- follow-up completed,
- review reopened,
- AI suggestion generated,
- AI suggestion accepted,
- AI suggestion rejected,
- export requested,
- customer-visible follow-up message sent.

Audit redaction requirements:

- do not record full phone/mobile values,
- do not record raw LINE user id,
- do not record token values,
- do not record secret values,
- do not record provider credential values,
- do not record raw provider payloads,
- do not record AI raw payloads,
- do not expose audit data to customer-visible surfaces,
- do not expose sensitive data in QA artifacts,
- do not expose sensitive data in screenshots,
- do not expose sensitive data in handoffs.

Task220 does not implement audit runtime.

## Failure and Ambiguity Handling

Future workflow should fail closed:

- if organization scope is unclear, do not show or operate,
- if permission is missing, safe-deny,
- if survey response is unclear, do not create follow-up,
- if AI confidence is insufficient, do not use as formal classification,
- if low-rating vs formal complaint relationship is unclear, route to review rather than creating complaint,
- if customer identity/contact is unclear, do not send follow-up message,
- if provider readiness is unclear, do not send follow-up message,
- if Case/Report/Appointment state conflicts, do not modify official state automatically.

## Explicit Non-Goals

Task220 does not:

- create complaint table,
- create follow-up table,
- create survey review table,
- add migration,
- modify schema,
- add workflow runtime,
- add API,
- modify backend service / repository / controller code,
- modify Admin UI,
- add customer portal,
- add notification provider,
- send LINE / SMS / email / APP,
- add outbox / worker,
- add survey token,
- add survey web form,
- add AI analysis runtime,
- add automated tests,
- add fixtures,
- add smoke tests,
- add localization file,
- modify `package.json`,
- modify inventory docs,
- touch Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- execute DDL,
- run cleanup commands,
- touch shared Zeabur runtime.

## Future Implementation Approval Boundary

Future implementation requires separate PM/user approval for:

1. low-rating review data model,
2. complaint/follow-up data model,
3. complaint workflow state machine,
4. human action permission model,
5. audit event model,
6. Admin UI design,
7. customer-visible messaging policy,
8. AI advisory output contract,
9. service recovery and compensation policy,
10. export / analytics policy,
11. test and fixture strategy.

General continuation wording does not approve any of the above.

## Future Task Candidates

Possible next docs-only tasks:

- Task221 - Survey Audit Event Catalog / No Runtime Change.
- Task221 - Survey Idempotency and Manual Resend Policy / No Runtime Change.
- Task221 - Survey Permission and Entitlement Readiness Matrix / No Runtime Change.
- Task221 - Survey Data Retention and Export Policy / No Runtime Change.
- Task221 - Survey Customer Follow-Up Copy and Safe Messaging Policy / No Runtime Change.

These are candidates only. Task220 does not execute them.

## Verification Checklist

Task220 should be considered valid only if:

- it remains documentation-only,
- it changes only docs,
- it does not modify backend `src/`,
- it does not modify `admin/src/`,
- it does not modify migrations, schema, or indexes,
- it does not modify routes, controllers, services, or repositories,
- it does not modify OpenAPI / Swagger or generated clients,
- it does not create tests, fixtures, smoke tests, or QA scripts,
- it does not create localization files,
- it does not modify `package.json`,
- it does not modify inventory docs,
- it does not connect to DB,
- it does not run DDL,
- it does not run psql,
- it does not run `npm run db:migrate`,
- it does not dry-run/apply Migration 020,
- it does not run cleanup commands,
- it does not touch shared Zeabur runtime,
- it does not send LINE / APP / SMS / email,
- it does not add provider sending,
- it does not add notification runtime,
- it does not add survey runtime,
- it does not add complaint workflow runtime,
- it does not add follow-up workflow runtime,
- it does not add outbox / worker,
- it does not add survey token or web form,
- it does not add AI analysis runtime,
- it does not add AI automatic decisions,
- it contains no sensitive values,
- it does not violate `docs/PROJECT_GUARDRAILS.md`.
