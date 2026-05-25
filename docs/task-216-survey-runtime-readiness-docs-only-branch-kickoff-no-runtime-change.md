# Task 216 - Survey Runtime Readiness Docs-Only Branch Kickoff / No Runtime Change

## Branch Purpose

Task216 starts a new documentation-only branch for future post-completion customer satisfaction survey runtime readiness.

This branch exists to define the readiness boundaries, prerequisite decisions, and safety expectations that must be satisfied before any survey runtime, survey delivery, provider integration, DB migration, API implementation, Admin UI, or AI-assisted survey workflow is implemented.

Task216 is not:

- survey runtime implementation,
- notification provider implementation,
- LINE push implementation,
- SMS / email / APP sending implementation,
- DB migration,
- API implementation,
- Admin UI implementation,
- survey token implementation,
- survey web form implementation,
- AI automatic decision implementation,
- customer feedback runtime implementation,
- complaint workflow runtime implementation.

## Guardrail Alignment

Task216 preserves:

- one Case = one formal Field Service Report,
- one Case may have many appointments / dispatch visits,
- multi-visit outcomes belong at appointment / dispatch visit level,
- Field Service Report remains the Case-level final completion summary,
- `field_service_reports.case_id` uniqueness must not be broken,
- same Case must not have multiple open appointments at once,
- `finalAppointmentId` should be system-determined from the final completed appointment,
- post-completion survey should default to the final completed appointment context,
- customer satisfaction, complaint, and follow-up records must not be mixed into service report internal notes,
- LINE is the current main entry but must not be hard-coded as the only customer channel,
- AI remains advisory and must not make official workflow decisions.

Survey readiness must not weaken Case / Appointment / Field Service Report invariants.

## Survey Trigger Readiness Boundary

Future survey trigger design should follow these readiness principles:

- survey eligibility waits for Case-level completion,
- survey eligibility uses the backend/system-resolved `finalAppointmentId`,
- survey must not be sent while the Case is not completed,
- survey must not be sent while the Field Service Report is draft, incomplete, or ambiguous,
- survey must not be sent while the final appointment is not clearly completed,
- multi-dispatch Cases should not send a survey for every appointment,
- survey eligibility should be tied to the final completed appointment and Case-level completion context,
- repeat completion, retries, manual resend, or backfill need future idempotency and audit design,
- survey trigger must not rely on Admin frontend payload,
- survey trigger must not rely on AI decision,
- survey trigger must not depend on raw LINE user identity.

Task216 does not create survey triggers.

## Channel Abstraction Readiness

Future survey delivery must not be hard-coded to LINE.

Readiness principles:

- LINE is currently the main customer entry channel,
- future channels may include SMS, Web Link, Web portal, and APP,
- survey delivery target must not equal raw `line_user_id`,
- LINE identity must remain scoped by `organization_id + line_channel_id + line_user_id`,
- future survey delivery should use a channel/contact resolver or generic customer channel identity model,
- delivery channel selection should be separate from survey eligibility,
- existing Case reverse LINE binding should remain compatible,
- if no channel is available, future policy should define pending, not deliverable, manual follow-up, or suppressed states,
- customer-facing survey delivery must not expose internal routing or provider diagnostics.

Task216 does not design the full resolver and does not implement provider sending.

## Customer-Visible vs Internal Data Separation

Future survey design must separate customer-visible data from internal-only operational data.

Customer-visible data may include:

- survey questions,
- rating choices,
- customer-submitted feedback,
- general submission success/failure messages,
- safe Case/service summary if later approved.

Internal-only data may include:

- risk flags,
- AI suggestions,
- supervisor follow-up notes,
- complaint review status,
- audit logs,
- delivery diagnostics,
- provider responses,
- internal routing notes,
- settlement/billing internal information,
- engineer internal comments.

Forbidden exposure:

- customers must not see internal notes,
- customers must not see audit logs,
- customers must not see AI raw payloads,
- customers must not see provider diagnostics,
- customers must not see settlement / billing internal data,
- customers must not see engineer internal evaluation notes,
- customers must not see raw channel identifiers,
- customers must not see delivery provider internals.

## AI Advisory-Only Boundary

AI may support future survey workflows by:

- summarizing customer feedback,
- classifying sentiment or risk,
- suggesting whether supervisor follow-up may be needed,
- flagging possible complaint risk,
- drafting internal follow-up suggestions,
- helping group recurring quality issues,
- helping identify missing context for human review.

AI must not:

- automatically modify Case status,
- automatically close a Case,
- automatically close a complaint,
- automatically approve refunds, compensation, or discounts,
- automatically approve quotes or settlement,
- automatically decide engineer responsibility,
- write uncertain content into official records,
- bypass permission checks,
- bypass organization scope,
- bypass entitlement checks,
- send surveys,
- suppress bad feedback,
- hide low ratings,
- contact customers without human/system-approved workflow.

AI suggestion and official record must remain distinct.

## Audit and Evidence Readiness

Future survey implementation should define audit events before runtime begins.

Possible future audit events:

- survey eligibility created,
- survey delivery scheduled,
- survey delivery attempted,
- survey delivery succeeded,
- survey delivery failed,
- survey response submitted,
- low rating detected,
- complaint risk flagged,
- supervisor review created,
- follow-up action taken,
- AI suggestion generated,
- AI suggestion accepted,
- AI suggestion rejected,
- manual resend requested,
- suppression respected,
- unsubscribe / opt-out respected.

Audit readiness rules:

- audit logs must be organization scoped,
- audit logs must record actor/system context safely,
- audit logs must not expose full phone/mobile values,
- audit logs must not expose token values,
- audit logs must not expose LINE access token or channel secret values,
- audit logs must not expose provider credentials,
- provider raw payloads must not be copied into customer-visible data,
- provider raw payloads must not be copied into general logs,
- internal evidence must remain separated from customer-visible survey data.

Task216 does not create audit events or audit runtime.

## Permission / Organization Scope Readiness

Future survey runtime must define permissions before implementation.

Future permission questions:

- who may view survey summary,
- who may view full customer feedback,
- who may view low-rating risk,
- who may create follow-up,
- who may mark complaint escalation,
- who may view AI suggestions,
- who may view delivery status,
- who may request manual resend,
- who may export survey data,
- who may configure survey questions,
- who may configure channel delivery settings.

Readiness principles:

- every future API must check identity,
- every future API must check role and permission,
- every future API must check organization scope,
- organization isolation must not be bypassed by admin convenience,
- permission and entitlement are different concepts,
- having entitlement does not grant user permission,
- having permission does not grant tenant feature entitlement,
- customer-visible endpoints must not reveal internal resource existence.

Task216 does not create permissions or runtime RBAC.

## SaaS-Ready / Entitlement Readiness

Survey capabilities should remain SaaS-ready.

Possible placeholder future feature keys:

- `survey_runtime`,
- `survey_delivery`,
- `survey_low_rating_alert`,
- `survey_ai_summary`,
- `survey_export`,
- `survey_follow_up_workflow`,
- `survey_channel_line`,
- `survey_channel_sms`,
- `survey_channel_app`,
- `survey_custom_questions`.

These are placeholders only. They are not production feature keys.

Task216 does not:

- add entitlement runtime,
- add usage metering runtime,
- add SaaS billing,
- add subscription logic,
- add plan pricing,
- add feature flag implementation,
- add tenant plan limits.

Future principle:

- even if an organization has survey entitlement, users still need permission,
- survey sending and provider usage may require future usage tracking and cost controls,
- AI survey summaries may require future AI add-on entitlement and usage controls,
- Enterprise/custom entitlement remains future-only.

## Explicit Non-Goals

Task216 does not:

- create survey tables,
- add migration,
- modify schema,
- add indexes,
- add API endpoints,
- modify backend service / repository / controller code,
- modify Admin UI,
- add provider integration,
- send LINE / SMS / email / APP messages,
- add outbox worker,
- add survey token,
- add survey web form,
- add tests,
- add fixtures,
- add smoke tests,
- add localization files,
- modify `package.json`,
- modify inventory docs,
- touch Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- execute DDL,
- run cleanup commands,
- touch shared Zeabur runtime.

## Runtime Approval Boundary

No future survey runtime work should start until a separate task explicitly approves:

1. data model and migration scope,
2. survey trigger eligibility policy,
3. idempotency / duplicate prevention policy,
4. channel/contact resolver strategy,
5. provider sending policy,
6. no-send / dry-run safety mode,
7. permission and organization scope model,
8. entitlement and usage tracking model,
9. audit/event model,
10. customer-visible vs internal data contract,
11. AI advisory-only policy,
12. test and fixture strategy.

General requests such as "continue", "go ahead", or "do next" do not authorize runtime, DB, provider sending, or migration actions.

## Future Task Candidates

Possible next docs-only tasks:

- Task217 - Survey Completion Trigger Eligibility Policy / No Runtime Change.
- Task217 - Survey Delivery Channel Abstraction Proposal / No Runtime Change.
- Task217 - Survey Response Data Separation Policy / No Runtime Change.
- Task217 - Survey Low-Rating and Complaint Follow-Up Workflow Design / No Runtime Change.
- Task217 - Survey Audit Event Catalog / No Runtime Change.
- Task217 - Survey Permission and Entitlement Readiness Matrix / No Runtime Change.
- Task217 - Survey Idempotency and Manual Resend Policy / No Runtime Change.

These are candidates only. Task216 does not execute them.

## Verification Checklist

Task216 should be considered valid only if:

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
- it does not add survey runtime,
- it does not add AI automatic decisions,
- it contains no sensitive values,
- it does not violate `docs/PROJECT_GUARDRAILS.md`.
