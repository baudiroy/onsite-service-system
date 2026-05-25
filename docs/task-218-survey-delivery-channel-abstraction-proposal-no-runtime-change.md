# Task 218 - Survey Delivery Channel Abstraction Proposal / No Runtime Change

## Purpose and Scope

Task218 defines a documentation-only proposal for future survey delivery channel abstraction.

The goal is to keep post-completion survey delivery channel-agnostic, avoid hard-coding LINE as the only delivery path, and preserve safe future expansion for LINE, SMS, Web Link, Web Portal, APP, and Email.

Task218 is not:

- survey runtime implementation,
- provider sending implementation,
- LINE integration implementation,
- SMS / Email / APP provider implementation,
- contact resolver implementation,
- DB migration,
- API contract implementation,
- Admin UI implementation,
- automated test implementation,
- AI decision engine implementation.

## Channel-Agnostic Principles

Future survey delivery should depend on an abstract customer contact / channel identity concept, not directly on a specific provider identifier.

Principles:

- LINE is the current main customer entry channel,
- LINE must not become the only supported survey delivery channel,
- future channels may include LINE, SMS, Web Link, Web Portal, APP, and Email,
- survey eligibility and survey delivery are different stages,
- eligibility decides whether a Case is allowed to produce a survey,
- delivery decides which safe channel can deliver the survey,
- provider callbacks must not decide Case, Appointment, or Field Service Report status,
- delivery failure must not change official Case, Appointment, or Field Service Report state,
- channel selection must remain organization scoped,
- channel selection must respect opt-out, unsubscribe, suppression, entitlement, permission, and provider readiness.

Task218 does not implement channel selection.

## LINE Identity Scope Boundary

LINE identity must remain scoped.

Rules:

- `line_user_id` must not be treated as global identity,
- LINE identity must be scoped by `organization_id + line_channel_id + line_user_id`,
- raw `line_user_id` must not be used by itself to look up customer, Case, or survey target,
- raw `line_user_id` must not appear in logs,
- raw `line_user_id` must not appear in error messages,
- raw `line_user_id` must not appear in frontend responses,
- raw `line_user_id` must not appear in QA artifacts,
- raw `line_user_id` must not appear in handoff reports,
- LINE access token and channel secret values must not enter docs, logs, API responses, or customer-visible surfaces,
- multi-organization, multi-LINE-channel, multi-brand, and multi-service-provider scenarios must remain possible.

## Future Customer Channel Identity Model Boundary

Task218 may use conceptual terms only. It does not propose final schema.

Conceptual terms:

- customer identity,
- customer contact point,
- customer channel identity,
- channel provider,
- channel address reference,
- verification status,
- consent / opt-in status,
- unsubscribe / opt-out status,
- preferred channel,
- fallback channel,
- delivery eligibility,
- organization scope,
- channel scope.

These terms are not:

- table names,
- migration proposal,
- production column names,
- API schema,
- Admin UI model,
- provider integration contract.

Future modeling requires a separate task and explicit migration/API approval.

## Delivery Channel Selection Readiness

Future delivery channel selection should require:

- survey eligibility has already passed,
- organization scope is known,
- customer contact/channel identity is verified or otherwise eligible,
- opt-out / unsubscribe / suppression are respected,
- provider readiness is known,
- organization entitlement is satisfied,
- user/action permission is satisfied where human action is involved,
- no duplicate delivery is created for the same survey,
- fallback logic cannot create multiple unwanted sends,
- fallback logic cannot cross tenant or organization scope,
- ambiguity fails closed.

Fail-closed conditions:

- channel ambiguity,
- provider ambiguity,
- identity mismatch,
- organization scope mismatch,
- tenant scope mismatch,
- LINE channel scope mismatch,
- consent/opt-in unclear,
- unsubscribe/opt-out unclear,
- provider readiness unclear,
- entitlement / feature availability unclear,
- AI-only channel suggestion without formal evidence.

Task218 does not define final priority order or fallback rules.

## Customer-Visible vs Internal Delivery Data

Customer-visible delivery data may include:

- survey invitation text,
- survey entry link or safe entry point,
- general success message,
- general failure message,
- general expiration message,
- already-submitted message,
- opt-out or contact support guidance.

Internal-only delivery data may include:

- selected delivery channel,
- provider attempt status,
- retry count,
- suppression reason,
- channel identity verification status,
- provider readiness,
- delivery diagnostics,
- audit logs,
- AI suggestions,
- internal exception review reason.

Forbidden customer-visible exposure:

- raw LINE user id,
- full phone/mobile values,
- token values,
- secret values,
- provider raw payloads,
- provider credential values,
- LINE access token values,
- channel secret values,
- internal routing notes,
- audit logs,
- AI raw payloads,
- SQL errors,
- DB constraint names,
- stack traces.

## Failure and Ambiguity Behavior

Future survey delivery should fail closed.

Do not send when:

- verified channel identity is missing,
- multiple channel identities are ambiguous,
- organization scope is ambiguous,
- tenant scope is ambiguous,
- LINE channel scope does not match,
- contact consent / opt-in is ambiguous,
- unsubscribe / opt-out state is ambiguous,
- provider readiness is ambiguous,
- entitlement / feature availability is ambiguous,
- channel resolver result is ambiguous,
- AI suggests a channel without formal evidence.

Errors and customer-visible messages must not reveal:

- whether a customer exists,
- whether a Case exists,
- whether a phone/mobile value is correct,
- whether a LINE binding exists,
- whether a provider account is configured,
- whether another organization owns the record.

## Provider Sending Boundary

Task218 does not implement provider sending.

Task218 does not:

- implement provider adapter,
- send LINE push,
- send SMS,
- send Email,
- send APP push,
- create outbox,
- create worker,
- create retry scheduler,
- read provider credentials,
- use provider credentials,
- call provider APIs,
- modify notification runtime.

Future provider sending requires separate approval and must define:

- no-send mode,
- provider sandbox / test mode,
- organization-scoped provider config,
- secret management,
- audit log,
- delivery idempotency,
- suppression / opt-out,
- rate limiting,
- safe diagnostics redaction.

## Survey Token / Link Safety Boundary

Future survey link/token readiness principles:

- survey links must not contain guessable Case IDs,
- survey token values must not be stored in plaintext,
- survey tokens must expire,
- survey tokens should be one-time use or have explicit resend policy,
- token validation failure must not reveal whether a Case exists,
- expired token events should be audited in the future,
- reused token events should be audited in the future,
- invalid token events should be audited in the future,
- link preview must not expose sensitive information,
- message preview must not expose sensitive information,
- logs must not expose full token values,
- QA artifacts and screenshots must not expose full token values.

Task218 does not create survey tokens or survey links.

## AI Advisory-Only Boundary

AI may assist future delivery workflows by:

- suggesting possible delivery issue category,
- summarizing provider failure category,
- flagging channel ambiguity risk,
- drafting internal follow-up suggestions,
- grouping repeated delivery issues for review.

AI must not:

- automatically select official delivery channel,
- automatically send survey,
- bypass opt-out,
- bypass suppression,
- create customer channel identity,
- update customer channel identity,
- modify Case status,
- modify Appointment status,
- modify Field Service Report status,
- close complaints,
- approve compensation,
- approve refunds,
- approve quotes,
- approve settlement,
- bypass permission,
- bypass organization scope,
- bypass entitlement,
- write uncertain content into official records.

## Permission / Entitlement Readiness

Task218 does not implement permission or entitlement.

Future questions:

- who can view delivery status,
- who can view selected channel,
- who can request manual resend,
- who can override preferred channel,
- who can view provider failure category,
- who can view suppression reason,
- who can configure organization channel policy,
- which features need future entitlement,
- which channel actions require audit,
- which delivery diagnostics are restricted.

Possible placeholder future feature keys:

- `survey_delivery`,
- `survey_channel_line`,
- `survey_channel_sms`,
- `survey_channel_email`,
- `survey_channel_app`,
- `survey_web_link`,
- `survey_manual_resend`,
- `survey_delivery_status`,
- `survey_channel_fallback`,
- `survey_provider_diagnostics`.

These are placeholders only and not production feature keys.

Principles:

- no entitlement runtime is added,
- no usage metering runtime is added,
- no billing / subscription / plan pricing runtime is added,
- permission and entitlement remain separate,
- entitlement does not bypass RBAC,
- RBAC does not bypass organization scope.

## Audit Readiness

Future audit events may include:

- survey delivery channel evaluated,
- survey delivery channel selected,
- survey delivery channel blocked,
- channel identity missing,
- channel identity ambiguous,
- channel scope mismatch detected,
- opt-out respected,
- unsubscribe respected,
- provider readiness unavailable,
- delivery suppressed,
- delivery attempt scheduled,
- delivery attempt skipped,
- manual resend requested,
- manual resend approved,
- manual resend rejected,
- AI delivery suggestion generated,
- AI delivery suggestion accepted for review only,
- AI delivery suggestion rejected for review only.

Audit redaction requirements:

- do not record full phone/mobile values,
- do not record raw LINE user id,
- do not record token values,
- do not record secret values,
- do not record provider credential values,
- do not record raw provider payloads,
- do not record AI raw payloads,
- do not expose internal diagnostics to customer-visible surfaces.

Task218 does not implement audit runtime.

## Explicit Non-Goals

Task218 does not:

- create customer channel identity table,
- create survey table,
- add migration,
- modify schema,
- add indexes,
- add resolver,
- add provider adapter,
- add notification runtime,
- add outbox,
- add worker,
- add API,
- modify backend service / repository / controller code,
- modify Admin UI,
- send LINE / SMS / email / APP,
- add survey token,
- add survey web form,
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

1. generic customer channel identity model,
2. channel/contact resolver,
3. provider config storage,
4. provider adapter integration,
5. no-send and provider sandbox mode,
6. survey token / link model,
7. channel fallback policy,
8. delivery idempotency policy,
9. opt-out / unsubscribe / suppression model,
10. permission and entitlement model,
11. audit model,
12. test and fixture strategy,
13. redaction and QA artifact safety.

General continuation wording does not approve any of the above.

## Future Task Candidates

Possible next docs-only tasks:

- Task219 - Survey Response Data Separation Policy / No Runtime Change.
- Task219 - Survey Low-Rating and Complaint Follow-Up Workflow Design / No Runtime Change.
- Task219 - Survey Audit Event Catalog / No Runtime Change.
- Task219 - Survey Idempotency and Manual Resend Policy / No Runtime Change.
- Task219 - Survey Permission and Entitlement Readiness Matrix / No Runtime Change.

These are candidates only. Task218 does not execute them.

## Verification Checklist

Task218 should be considered valid only if:

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
- it does not add resolver,
- it does not add outbox / worker,
- it does not add survey token or web form,
- it does not add AI automatic decisions,
- it contains no sensitive values,
- it does not violate `docs/PROJECT_GUARDRAILS.md`.
