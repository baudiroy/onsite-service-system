# Task 238 - Notification Outbox And Retry Design / No Runtime Change

## Purpose And Scope

This document defines future design boundaries for notification outbox, delivery attempts, retry, idempotency, duplicate suppression, manual resend, provider callbacks, no-send / sandbox integration, audit, and safe diagnostics.

Task238 is documentation-only. It does not propose or implement a DB schema, migration, API contract, worker, retry scheduler, provider adapter, or notification runtime.

This task is not:

- outbox implementation,
- worker implementation,
- retry scheduler implementation,
- provider sending,
- notification runtime,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation,
- localization implementation,
- message template implementation,
- AI decision engine.

Task238 does not authorize DB connection, DDL, psql, `npm run db:migrate`, Migration020 dry-run/apply, shared runtime operation, provider sending, LINE / APP / SMS / email sending, or destructive cleanup.

## Outbox Design Principles

Outbox is a future delivery coordination mechanism. It is not immediate provider sending.

Principles:

- creating an outbox item does not mean a customer was notified,
- creating an outbox item does not mean provider delivery succeeded,
- outbox item creation must not modify Case official status,
- outbox item creation must not modify Appointment official status,
- outbox item creation must not modify Field Service Report official status,
- provider result must not automatically modify official business state,
- outbox must be organization-scoped,
- outbox must be channel-aware,
- outbox must support no-send / sandbox / production mode separation,
- outbox must not store raw provider credentials,
- outbox must not store raw provider payloads,
- outbox must not store raw AI payloads,
- outbox should not store large files or binary attachments,
- outbox should reference approved message/template content rather than embedding sensitive context,
- outbox should use stable idempotency keys that do not depend on raw channel identifiers.

Future outbox design must remain compatible with:

- LINE as one provider,
- self-owned APP push,
- SMS,
- email,
- web link / portal,
- organization-specific provider config,
- SaaS entitlement and usage metering,
- customer-visible/internal data separation.

## Conceptual Lifecycle

The following lifecycle is conceptual only. It is not a production status enum, DB schema, API contract, or worker implementation.

Future notification delivery may move through states such as:

- eligibility evaluated,
- recipient resolved,
- message composed,
- outbox candidate created,
- duplicate suppression checked,
- outbox item queued,
- delivery attempt started,
- provider request prepared,
- provider result received,
- delivery succeeded,
- delivery failed,
- retry scheduled,
- retry exhausted,
- suppressed,
- cancelled,
- expired,
- manually resent,
- dead-lettered / exception review.

Important boundaries:

- these names are placeholders only,
- no DB is added by this task,
- no worker is added by this task,
- no API is added by this task,
- no provider call is added by this task,
- no customer-visible status is added by this task.

## Retry Policy Boundary

Retry is delivery attempt retry. It is not business eligibility re-decision.

Retry must not:

- bypass opt-out / unsubscribe,
- bypass suppression,
- bypass organization scope,
- bypass channel scope,
- bypass entitlement,
- bypass permission,
- create cross-channel duplicate harassment,
- treat timeout as success,
- modify Case official status,
- modify Appointment official status,
- modify Field Service Report official status,
- approve quote / billing / settlement,
- bind customer identity,
- remove no-send / sandbox protections,
- send when provider sending is disabled.

Future retry policy must define:

- retryable vs non-retryable failure categories,
- max retry count,
- retry interval,
- backoff strategy,
- cooldown,
- expiry,
- provider outage behavior,
- manual resend relationship,
- emergency halt behavior,
- usage/cost implications.

Task238 does not define production values for retry count, interval, backoff, or cooldown.

## Idempotency And Duplicate Suppression

Future notification delivery must prevent accidental duplicate sends.

Principles:

- the same notification purpose / recipient / Case context should not create multiple active delivery lifecycles by accident,
- provider timeout should not create duplicate sends,
- worker retry should not create a new notification lifecycle,
- provider callback replay should not create duplicate success / failure records,
- idempotency must be organization-scoped,
- idempotency must not rely only on provider message id,
- idempotency must not rely only on raw channel identity,
- idempotency must not use unredacted mobile / raw LINE user id as the key,
- duplicate suppression must run before provider sending.

Manual resend must distinguish:

- retry same delivery,
- resend same notification,
- create new notification,
- supervisor-approved exception.

These categories require future policy and permission design. Task238 does not implement manual resend.

## No-send / Sandbox Integration

Future outbox and retry must integrate with no-send / sandbox policy.

Requirements:

- no-send mode must not call real provider APIs,
- no-send mode must not send real LINE / SMS / email / APP push,
- sandbox mode must not use production recipients,
- sandbox mode must not use production secrets,
- no-send result must not be treated as production delivery success,
- sandbox result must not be treated as production delivery success,
- dry-run / preview diagnostics must remain internal-only,
- production sending must require explicit approval gate,
- outbox should preserve mode separation,
- retry must not bypass no-send / sandbox mode,
- manual resend must not bypass no-send / sandbox mode.

Task238 does not implement no-send, sandbox, outbox mode fields, or provider sending.

## Provider Callback Interaction

Provider callbacks may eventually provide delivery diagnostic signals.

Future callback boundaries:

- callback may update delivery-layer diagnostic state only after safe validation,
- callback must not directly decide official business state,
- callback must not automatically modify Case / Appointment / Field Service Report,
- callback must not automatically create customer identity binding,
- callback must not remove opt-out,
- callback must not remove suppression,
- callback must not bypass entitlement,
- callback must not bypass permission,
- callback must not trigger AI auto-decision,
- unknown callback source must fail closed,
- signature verification failure must use generic / internal-only handling,
- raw provider payload must not be directly logged,
- callback correlation must not depend on raw sensitive values.

Provider callbacks must preserve organization and channel scope.

## Manual Resend Boundary

Manual resend is a future controlled operation, not a fallback for missing automation controls.

Future manual resend requires:

- human request,
- actor identity,
- permission,
- organization scope,
- reason,
- audit,
- suppression / opt-out check,
- duplicate policy check,
- entitlement check where applicable,
- rate limit / cooldown check,
- safe copy / template check,
- no-send / sandbox / production mode check.

Manual resend must not:

- be triggered automatically by AI,
- be triggered automatically by provider callback,
- bypass suppression / opt-out,
- bypass organization scope,
- bypass entitlement / permission,
- change Case / Appointment / Field Service Report official status,
- approve quote / billing / settlement,
- hide complaint risk,
- create provider sending when no-send is active.

## Audit Readiness

Future outbox and retry audit event families may include:

- notification outbox candidate created,
- notification outbox item queued,
- notification duplicate suppressed,
- notification delivery attempt started,
- notification delivery attempt skipped,
- notification delivery succeeded,
- notification delivery failed,
- notification retry scheduled,
- notification retry exhausted,
- notification suppressed,
- notification cancelled,
- notification expired,
- notification manual resend requested,
- notification manual resend approved,
- notification manual resend rejected,
- notification provider callback received,
- notification provider callback ignored,
- notification dead-lettered,
- notification exception review created.

Audit redaction requirements:

- do not record complete mobile,
- do not record raw LINE user id,
- do not record token,
- do not record secret,
- do not record provider credential,
- do not record LINE access token,
- do not record channel secret,
- do not record raw provider payload,
- do not record raw AI payload,
- do not expose audit in customer-visible surfaces.

Audit is internal evidence, not customer-visible delivery explanation.

## Safe Diagnostics And Customer-visible Separation

Customer-visible surfaces must not show:

- retry count,
- provider failure reason,
- worker error,
- queue status,
- audit log,
- permission detail,
- entitlement detail,
- raw identifiers,
- internal diagnostic,
- stack trace,
- SQL error,
- DB constraint name.

Internal-only diagnostics may include:

- safe delivery status category,
- safe provider category,
- safe retry category,
- redacted correlation reference,
- suppression category,
- duplicate suppression category,
- no-send / sandbox / production mode category,
- safe provider callback category.

Diagnostics must remain role-gated, organization-scoped, and redacted.

## Permission / Entitlement / Usage Readiness

Future outbox and delivery status will need permission and entitlement design.

Future questions:

- Who can view outbox status?
- Who can view delivery status?
- Who can request manual resend?
- Who can approve manual resend?
- Who can cancel queued notification?
- Who can view retry diagnostics?
- Who can view dead-letter diagnostics?
- Which notification categories require entitlement?
- Which provider sending channels require entitlement?
- Which provider sends require usage metering?
- Does retry count toward usage?
- Does sandbox count toward usage?
- Which exports/reporting views are allowed?

Placeholder permission families may include:

- `notification.outbox.read`,
- `notification.delivery_status.read`,
- `notification.retry_diagnostics.read`,
- `notification.dead_letter.read`,
- `notification.manual_resend.request`,
- `notification.manual_resend.approve`,
- `notification.queued.cancel`.

Placeholder feature keys may include:

- `notification_outbox`,
- `notification_retry`,
- `notification_manual_resend`,
- `notification_delivery_diagnostics`,
- `notification_dead_letter`,
- `notification_line`,
- `notification_sms`,
- `notification_email`,
- `notification_app_push`,
- `notification_usage_metering`.

These are future placeholders only. Task238 does not add permission runtime, entitlement runtime, feature flags, usage metering, API, Admin UI, schema, localization, or tests.

## Failure And Incident Readiness

Future implementation must plan for failure and incidents.

Readiness areas:

- stuck outbox detection,
- retry storm prevention,
- duplicate-send prevention,
- provider outage handling,
- emergency disable switch,
- organization-level halt,
- channel-level halt,
- provider-level halt,
- resend halt,
- retry halt,
- mistaken-send incident response,
- sensitive data exposure response,
- dead-letter / exception review,
- incident audit,
- internal escalation,
- customer-safe incident wording.

Incident response must not rely on AI as final authority.

## AI Advisory-only Boundary

AI may assist by:

- summarizing delivery failure categories,
- warning about retry storm risk,
- warning about duplicate-send risk,
- checking manual resend reason completeness,
- summarizing internal exception review context,
- suggesting safer internal diagnostic wording.

AI must not:

- queue notification,
- retry delivery,
- resend notification,
- cancel notification,
- remove suppression,
- remove opt-out,
- switch production,
- send messages,
- modify Case official status,
- modify Appointment official status,
- modify Field Service Report official status,
- approve quote,
- approve billing / settlement,
- approve refund / compensation,
- bypass permission,
- bypass entitlement,
- bypass organization scope,
- write uncertain inference into official record.

AI suggestion remains advisory.

## Runtime Readiness Decision For Task238

Runtime allowed now: No.

Task238 defines outbox and retry design boundaries only. It does not approve outbox, worker, retry scheduler, provider adapter, callback route, provider sending, or runtime writes.

Future runtime remains blocked until separate approval covers:

- schema / migration,
- worker / scheduler design,
- provider adapter design,
- callback safety,
- no-send / sandbox implementation,
- provider configuration,
- secret handling,
- audit runtime,
- permission / entitlement runtime,
- usage metering,
- tests / QA,
- PM / business / security / engineering approval.

## Explicit Non-goals

Task238 does not:

- create notification tables,
- create outbox tables,
- create delivery attempt tables,
- create retry scheduler,
- create worker,
- create provider adapter,
- create callback route,
- add migration,
- modify schema,
- add index,
- add API,
- modify backend `src/`,
- modify Admin `admin/src/`,
- send LINE messages,
- send SMS,
- send email,
- send APP push,
- implement notification runtime,
- implement audit runtime,
- implement permission runtime,
- implement entitlement runtime,
- implement usage runtime,
- implement feature flags,
- implement localization,
- implement message templates,
- add automated tests,
- modify `package.json`,
- modify inventory docs,
- touch Migration020,
- operate shared Zeabur,
- connect to DB,
- run DDL,
- run psql,
- run `npm run db:migrate`,
- implement survey runtime,
- implement resolver,
- implement reverse binding runtime,
- implement LINE binding runtime,
- implement AI auto-decision,
- perform destructive cleanup.

## Verification Checklist

Task238 should be verified with:

- `npm run check`,
- `npm run admin:check`,
- `git diff --check`,
- sensitive / internal diagnostic scan.

Sensitive / internal diagnostic scan should confirm there are no actual:

- DATABASE_URL values,
- passwords,
- tokens,
- secrets,
- LINE access tokens,
- channel secrets,
- raw LINE user ids,
- customer mobile values,
- raw provider payloads,
- provider credentials,
- real tenant IDs,
- real organization IDs,
- real usage values,
- real pricing values,
- AI token counts,
- stack traces,
- SQL errors,
- DB constraint names,
- production translation strings.

Policy words, placeholders, prohibition lists, and guardrail references are allowed when they do not include actual values.

## Future Task Candidates

Future candidates only; not executed by Task238:

- Notification Permission and Entitlement Matrix / No Runtime Change,
- Notification Delivery Audit Event Catalog / No Runtime Change,
- Notification Customer Copy Template Governance / No Runtime Change,
- Notification Usage Metering and Cost Control Planning / No Runtime Change,
- Notification Manual Resend Policy / No Runtime Change,
- Notification Provider Callback Safety Design / No Runtime Change,
- Notification Outbox Schema Proposal / No Migration,
- Notification Runtime Readiness Gate / No Runtime Change.
