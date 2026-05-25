# Task 239 - Notification Delivery Audit Event Catalog / No Runtime Change

## Purpose And Scope

This document catalogs future audit event families for notification delivery, outbox, retry, manual resend, provider callbacks, no-send / sandbox, suppression, permission / entitlement, usage, and AI advisory flows.

Task239 is documentation-only.

This task is not:

- audit runtime implementation,
- notification runtime,
- outbox / worker implementation,
- provider sending,
- provider callback route,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation,
- localization implementation,
- message template implementation,
- AI decision engine.

The event examples in this document are placeholders. They are not production event names, schema enums, API response fields, migration fields, or generated client contracts.

## Audit Principles

Notification audit exists to support internal accountability and safe operations.

Principles:

- audit log is internal-only,
- audit must not become a customer-visible response,
- audit events must be organization-scoped,
- channel-specific audit events must preserve channel scope,
- LINE-related audit must preserve organization_id + line_channel_id + line_user_id scoped identity principles without recording raw LINE user id,
- audit should distinguish human action from system evaluation,
- audit should distinguish worker / outbox process from provider diagnostic source,
- audit should distinguish AI advisory source from official system action,
- audit should record safe-deny / security events without leaking protected resource existence,
- audit should not replace notification records,
- audit should not replace outbox records,
- audit should not replace official Case / Appointment / Field Service Report records,
- audit should not store raw provider payloads,
- audit should not store raw AI payloads,
- audit should not store secrets or tokens,
- audit should not store large attachments or binary files.

Audit should help answer:

- what was evaluated,
- who or what initiated the action,
- why a delivery was blocked or allowed,
- which safe category describes the outcome,
- whether opt-out / suppression / entitlement / permission was respected,
- whether no-send / sandbox protected the system,
- whether an AI suggestion was generated and how it was handled.

## Audit Event Family Catalog

The examples below are conceptual placeholders only.

### A. Notification Eligibility Events

Future examples:

- `notification.eligibility.evaluated`,
- `notification.eligibility.created`,
- `notification.eligibility.skipped`,
- `notification.eligibility.blocked`,
- `notification.eligibility.ambiguity_detected`.

Purpose:

- record whether a notification purpose was considered,
- record safe reason categories for block/skip,
- record whether ambiguity caused fail-closed behavior.

### B. Recipient / Channel Resolution Events

Future examples:

- `notification.recipient.resolved`,
- `notification.recipient.blocked`,
- `notification.recipient.ambiguous`,
- `notification.channel_identity.missing`,
- `notification.channel_identity.unverified`,
- `notification.channel_identity.suppressed`,
- `notification.channel_identity.scope_mismatch_detected`.

Purpose:

- record recipient/channel resolution decisions,
- record safe-deny for missing / unverified / ambiguous / suppressed identities,
- record channel scope mismatch without exposing raw identifiers.

### C. Message Composition Events

Future examples:

- `notification.message.composed`,
- `notification.message.previewed`,
- `notification.message.blocked_by_policy`,
- `notification.message.unsafe_copy_rejected`,
- `notification.message.template_missing`,
- `notification.message.customer_visible_copy_approved`.

Purpose:

- record customer-visible copy readiness,
- record template or copy policy failures,
- record human review outcomes where future policy requires them.

### D. Outbox / Scheduling Events

Future examples:

- `notification.outbox.candidate_created`,
- `notification.outbox.queued`,
- `notification.outbox.cancelled`,
- `notification.outbox.expired`,
- `notification.outbox.dead_lettered`,
- `notification.outbox.exception_review_created`.

Purpose:

- record future delivery coordination lifecycle,
- separate queue state from provider delivery state,
- support internal operations without customer-visible queue details.

### E. Delivery Attempt Events

Future examples:

- `notification.delivery.attempt_started`,
- `notification.delivery.attempt_skipped`,
- `notification.delivery.succeeded`,
- `notification.delivery.failed`,
- `notification.delivery.timeout_recorded`,
- `notification.delivery.provider_unavailable`.

Purpose:

- record provider-facing delivery attempts,
- record safe failure category,
- avoid exposing provider raw payload,
- avoid treating provider status as official business status.

### F. Retry / Duplicate Suppression Events

Future examples:

- `notification.retry.scheduled`,
- `notification.retry.attempted`,
- `notification.retry.skipped`,
- `notification.retry.exhausted`,
- `notification.duplicate_suppressed`,
- `notification.retry_storm_prevented`.

Purpose:

- record retry decisions,
- record duplicate suppression,
- record retry storm prevention,
- support operations without exposing provider internals.

### G. Manual Resend Events

Future examples:

- `notification.resend.requested`,
- `notification.resend.approved`,
- `notification.resend.rejected`,
- `notification.resend.executed`,
- `notification.resend.blocked_by_suppression`,
- `notification.resend.blocked_by_duplicate_policy`.

Purpose:

- record human action,
- record actor identity reference and role category,
- record permission / suppression / duplicate checks,
- distinguish retry from resend from new notification.

### H. No-send / Sandbox Events

Future examples:

- `notification.no_send.enforced`,
- `notification.no_send.simulated`,
- `notification.no_send.blocked_production_send`,
- `notification.sandbox.attempted`,
- `notification.sandbox.succeeded`,
- `notification.sandbox.failed`,
- `notification.production_send.enabled`,
- `notification.production_send.disabled`.

Purpose:

- record safety mode behavior,
- record blocked production send attempts,
- record sandbox diagnostics without treating sandbox as customer delivery.

### I. Provider Callback / Diagnostics Events

Future examples:

- `notification.provider_callback.received`,
- `notification.provider_callback.ignored`,
- `notification.provider_callback.signature_failed`,
- `notification.provider_callback.scope_missing`,
- `notification.provider_callback.redacted`,
- `notification.provider_diagnostic.viewed`.

Purpose:

- record provider callback handling,
- record fail-closed callback validation,
- record diagnostic access,
- preserve provider payload redaction.

### J. Permission / Entitlement / Usage Events

Future examples:

- `notification.permission.denied`,
- `notification.entitlement.denied`,
- `notification.usage_limit.blocked`,
- `notification.rate_limit.applied`,
- `notification.cost_control.blocked`.

Purpose:

- record permission and entitlement enforcement,
- record usage and rate-limit controls,
- avoid leaking feature availability to unauthorized users or customers.

### K. AI Advisory Events

Future examples:

- `notification.ai.copy_suggestion_generated`,
- `notification.ai.delivery_risk_suggestion_generated`,
- `notification.ai.failure_summary_generated`,
- `notification.ai.suggestion_viewed`,
- `notification.ai.suggestion_accepted_for_review`,
- `notification.ai.suggestion_rejected`,
- `notification.ai.low_confidence_ignored`.

Purpose:

- record AI advisory activity,
- distinguish AI suggestion from official action,
- record human review outcome without making AI authoritative.

## Suggested Future Event Fields

The following fields are conceptual only.

They are not:

- database columns,
- migration proposal,
- API response schema,
- production enum,
- generated client contract.

Conceptual future fields may include:

- event family,
- event action,
- organization reference,
- channel provider category,
- channel scope reference,
- actor reference,
- actor role category,
- source type: human / system / worker / provider / AI advisory,
- target reference type,
- target reference,
- notification purpose category,
- correlation reference,
- request reference,
- permission context category,
- entitlement context category,
- usage context category,
- result category,
- safe reason category,
- redacted metadata category,
- occurred at.

Future implementation requires separate schema / migration / API / permission / audit runtime tasks.

## Forbidden Audit Content

Audit events must not contain:

- complete customer mobile,
- raw LINE user id,
- LINE access token,
- channel secret,
- token,
- secret,
- password,
- provider credential,
- raw provider payload,
- raw AI payload,
- DATABASE_URL,
- SQL error,
- DB constraint name,
- stack trace,
- production translation string,
- full customer free-text in diagnostic metadata unless a future policy explicitly allows it,
- internal diagnostic payload dumps,
- attachment binary,
- photo binary,
- signature binary,
- document binary.

Policy references to these terms are allowed only as prohibition / placeholder text.

## Customer-visible vs Internal Separation

Audit log is always internal-only.

Customer-visible surfaces must not show:

- audit log,
- audit reason category,
- provider diagnostics,
- AI suggestion acceptance / rejection,
- permission internals,
- entitlement internals,
- usage decision internals,
- retry worker state,
- queue status,
- raw identifiers,
- internal diagnostic details.

Customers should only see:

- approved customer-facing notification copy,
- safe generic unavailable wording,
- safe customer-facing status when future product design approves it.

Audit is evidence for internal control, not a customer support script.

## Organization Isolation And Channel Scope

Notification audit must preserve tenant isolation.

Principles:

- audit events must be scoped to organization,
- LINE-related events must preserve LINE channel scope,
- provider config audit must not cross organization boundaries,
- provider callback audit must not cross organization boundaries,
- provider diagnostic audit must not cross organization boundaries,
- Admin permission must not bypass organization isolation,
- cross-organization audit view must not exist by default,
- cross-channel identity linkage requires separate future policy,
- safe-deny / non-leakage applies to cross-org access,
- safe-deny / non-leakage applies to missing permission,
- safe-deny / non-leakage applies to hidden resources,
- safe-deny / non-leakage applies to ambiguous identity,
- safe-deny / non-leakage applies to deleted / unavailable resources.

## Permission / Entitlement / Usage Readiness

Task239 does not implement permission, entitlement, or usage runtime.

Future questions:

- Who can view notification audit trail?
- Who can view delivery audit?
- Who can view provider callback audit?
- Who can view provider diagnostics?
- Who can view no-send / sandbox audit?
- Who can export notification audit?
- Which audit views require tenant admin?
- Which diagnostics are limited to security / support roles?
- Which audit exports require entitlement?
- How should usage / cost-related audit be retained?
- Which audit fields are visible to supervisor vs support vs finance?

Placeholder permission families may include:

- `notification.audit.read`,
- `notification.audit.export`,
- `notification.delivery_audit.read`,
- `notification.provider_callback_audit.read`,
- `notification.provider_diagnostics.read`,
- `notification.no_send_audit.read`,
- `notification.sandbox_audit.read`.

Placeholder feature keys may include:

- `notification_audit`,
- `notification_delivery_diagnostics`,
- `advanced_audit_log`,
- `notification_audit_export`,
- `notification_usage_audit`.

These are future design placeholders only. Task239 does not add permission runtime, entitlement runtime, usage metering, API, Admin UI, localization, tests, or schema.

## AI Advisory-only Boundary

AI may:

- summarize audit trail for authorized internal roles,
- flag audit coverage gaps,
- organize provider callback ignored categories,
- warn about duplicate / suppression / retry storm risk,
- check whether audit metadata might include sensitive data,
- draft internal summaries using redacted inputs.

AI must not:

- create audit events,
- modify audit events,
- delete audit events,
- hide audit events,
- queue notifications,
- retry notifications,
- resend notifications,
- cancel notifications,
- switch production mode,
- turn off no-send,
- send LINE / SMS / email / APP messages,
- modify Case official status,
- modify Appointment official status,
- modify Field Service Report official status,
- approve quote,
- approve billing / settlement,
- approve refund / compensation,
- create or close complaints,
- bypass permission,
- bypass organization scope,
- bypass entitlement,
- write uncertain content into official audit record.

AI suggestion must remain separate from official audit.

## Runtime Readiness Decision For Task239

Runtime allowed now: No.

Task239 catalogs future audit event families only. It does not approve audit runtime, notification runtime, outbox / worker, provider callback route, provider sending, schema, API, or tests.

Future runtime remains blocked until separate approval covers:

- audit schema / migration,
- audit service behavior,
- permission / entitlement / organization scope,
- redaction allow-list,
- customer-visible separation,
- provider diagnostics policy,
- tests / QA,
- PM / business / security / engineering approval.

## Explicit Non-goals

Task239 does not:

- create audit tables,
- modify audit tables,
- create notification tables,
- create outbox tables,
- create delivery attempt tables,
- add migration,
- modify schema,
- add index,
- implement audit runtime,
- implement notification runtime,
- implement outbox / worker,
- implement retry scheduler,
- add provider adapter,
- add callback route,
- add API,
- modify backend service / repository / controller,
- modify Admin UI,
- add provider integration,
- send LINE messages,
- send SMS,
- send email,
- send APP push,
- implement permission runtime,
- implement entitlement runtime,
- implement usage runtime,
- implement feature flags,
- add localization files,
- add message template files,
- add automated tests,
- add fixtures,
- add smoke tests,
- modify `package.json`,
- modify inventory docs,
- touch Migration020,
- connect to DB,
- run psql,
- run `npm run db:migrate`,
- run DDL,
- run cleanup,
- operate shared Zeabur runtime,
- implement resolver,
- implement reverse binding runtime,
- implement LINE binding runtime,
- implement AI auto-decision.

## Verification Checklist

Task239 should be verified with:

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

Future candidates only; not executed by Task239:

- Notification Permission and Entitlement Matrix / No Runtime Change,
- Notification Customer Copy Template Governance / No Runtime Change,
- Notification Usage Metering and Cost Control Planning / No Runtime Change,
- Notification Manual Resend Policy / No Runtime Change,
- Notification Provider Callback Safety Design / No Runtime Change,
- Notification Audit Redaction Allow-list / No Runtime Change,
- Notification Runtime Readiness Gate / No Runtime Change.
