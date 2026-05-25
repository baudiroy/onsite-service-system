# Task 237 - Notification Provider Sending Readiness Checklist / No Runtime Change

## Purpose And Scope

This document defines a future readiness checklist that must be satisfied before any notification provider sending is implemented.

The checklist is meant for future LINE / SMS / email / APP push notification delivery work. It consolidates no-send, sandbox, provider config, secret handling, recipient resolution, consent / suppression, idempotency, audit, permission, entitlement, usage metering, safe diagnostics, rollback, and security approval requirements.

Task237 is documentation-only.

This task is not:

- provider sending implementation,
- notification runtime,
- LINE integration,
- SMS integration,
- email integration,
- APP push integration,
- provider adapter implementation,
- provider config implementation,
- secret management implementation,
- event outbox / worker implementation,
- retry scheduler implementation,
- API implementation,
- Admin implementation,
- migration / schema / index implementation,
- automated test implementation,
- localization implementation,
- message template implementation,
- AI decision engine.

This checklist does not grant approval. It only identifies readiness gates that future implementation must satisfy.

## Readiness Gate Categories

All categories below are future gates. Passing documentation review does not mean runtime approval.

| Gate | Future readiness question | Runtime approved now? |
| --- | --- | --- |
| PM / business approval | Has the business approved this notification category, recipient, timing, and customer impact? | No |
| Security / privacy approval | Has security reviewed secrets, PII, provider data, opt-out, retention, and redaction? | No |
| Engineering design approval | Has engineering approved runtime architecture, failure handling, and operational safety? | No |
| Provider / channel approval | Has the provider channel integration been approved and configured safely? | No |
| Data protection / redaction | Are payloads, logs, diagnostics, exports, and handoffs allow-listed and redacted? | No |
| Permission / entitlement | Are user permission and organization entitlement rules designed and implemented? | No |
| Usage / cost control | Are rate limits, usage metering, and cost controls ready? | No |
| No-send / sandbox | Can the system simulate safely without real provider sending? | No |
| Rollback / disable switch | Can sending be halted globally, per organization, per channel, and per provider? | No |
| Monitoring / audit | Are delivery attempts, callbacks, suppression, resend, and failures auditable? | No |

## No-send / Sandbox Prerequisites

Future provider sending must not begin until no-send and sandbox safety is implemented.

Checklist:

- no-send mode exists,
- sandbox / test mode exists,
- production sending is disabled by default,
- no-send does not call real provider API,
- no-send does not send LINE / SMS / email / APP push,
- no-send does not contact production recipients,
- sandbox does not use production recipients,
- sandbox does not use production secrets,
- sandbox result is not treated as production delivery success,
- diagnostics are redacted,
- no-send / sandbox behavior is audit-ready,
- explicit approval is required before production sending,
- disable switch can halt sending before provider calls.

No-send / sandbox readiness must be verified before provider credentials or provider adapters are used in production.

## Provider Config And Secret Prerequisites

Future provider sending requires safe provider configuration and secret handling.

Checklist:

- provider config is organization-scoped,
- LINE provider config retains line_channel_id scope,
- provider config cannot be used across organizations by accident,
- sandbox and production provider config are separated,
- provider config is not stored in frontend bundle,
- provider config is not customer-visible,
- secrets are not present in docs,
- secrets are not present in logs,
- secrets are not present in API responses,
- secrets are not present in QA artifacts,
- LINE access token is not exposed,
- LINE channel secret is not exposed,
- SMS / email / APP provider secrets are not exposed,
- future secret rotation policy exists,
- future secret access audit exists,
- provider callback signature validation is designed,
- provider credential validation does not leak secret details.

Task237 does not create provider config, secret storage, secret rotation, or provider callback routes.

## Recipient And Channel Identity Prerequisites

Future provider sending requires safe recipient and channel identity resolution.

Checklist:

- recipient resolution does not rely on raw provider identifier as customer identity,
- customer identity and channel identity are separate,
- LINE identity is scoped by organization_id + line_channel_id + line_user_id,
- verified channel identity exists where required,
- consent / opt-in readiness exists where required,
- opt-out / unsubscribe is enforced,
- suppression is enforced,
- channel ambiguity fails closed,
- cross-organization lookup safe-denies,
- customer-visible failure is generic,
- provider lookup result does not leak identity existence,
- delivery resolver does not mutate Case / Appointment / Field Service Report official status.

No provider sending should occur if recipient/channel resolution is ambiguous or unsafe.

## Message Content And Copy Prerequisites

Future provider sending requires approved customer-visible copy.

Checklist:

- customer-facing copy is reviewed,
- template governance is defined,
- localization governance is defined if multiple languages are used,
- no internal diagnostics appear in the message,
- no provider diagnostics appear in the message,
- no AI raw payload appears in the message,
- no token / secret / raw identifier appears in the message,
- no unapproved refund promise appears in the message,
- no unapproved compensation promise appears in the message,
- no unapproved discount promise appears in the message,
- no engineer blame statement appears in the message,
- no legal liability statement appears without approval,
- message copy is appropriate to the channel length and format,
- copy does not imply successful delivery before provider result exists,
- copy does not imply business-state change unless that state already exists.

Task237 does not add localization files or message template files.

## Delivery Lifecycle Prerequisites

Future provider sending requires a delivery lifecycle design.

Checklist:

- delivery eligibility rule exists,
- scheduling policy exists,
- idempotency rule exists,
- duplicate suppression rule exists,
- retry policy exists,
- manual resend policy exists,
- provider timeout handling exists,
- delivery success / failure classification exists,
- delivery result does not mutate Case / Appointment / Field Service Report official status,
- delivery result does not approve quote / billing / settlement,
- delivery result does not bind customer identity,
- event outbox / worker design exists before runtime,
- retry scheduler design exists before runtime,
- provider callback handling design exists before runtime,
- customer-visible status wording is safe and generic.

Delivery lifecycle state is delivery-layer state. It is not official business workflow state.

## Audit And Diagnostics Prerequisites

Future provider sending requires internal audit and diagnostics.

Checklist:

- delivery attempted audit is designed,
- delivery succeeded audit is designed,
- delivery failed audit is designed,
- provider callback received audit is designed,
- provider callback ignored / rejected audit is designed,
- opt-out respected audit is designed,
- suppression respected audit is designed,
- manual resend requested / approved / rejected audit is designed,
- no-send audit is designed,
- sandbox audit is designed,
- provider diagnostics are redacted,
- raw provider payload is not logged,
- full mobile is not logged,
- raw LINE user id is not logged,
- token / secret is not logged,
- provider credential is not logged,
- customer-facing surfaces cannot see audit,
- audit payloads are allow-listed.

Audit is internal evidence. It must not become a customer-visible explanation or provider payload dump.

## Permission / Entitlement / Usage Prerequisites

Future provider sending must respect both permission and entitlement.

Checklist:

- permission model exists for sending,
- permission model exists for manual resend,
- permission model exists for viewing diagnostics,
- permission model exists for provider config,
- organization entitlement exists for notification delivery,
- channel-specific entitlement exists where needed,
- feature-gated failure behavior is safe-deny,
- missing permission behavior is safe-deny,
- usage metering readiness exists for LINE push,
- usage metering readiness exists for SMS,
- usage metering readiness exists for email,
- usage metering readiness exists for APP push,
- usage metering readiness exists for AI message assist,
- rate limits exist,
- cooldown policy exists,
- cost controls exist,
- export / reporting controls exist.

Entitlement controls organization feature availability. Permission controls whether a user can perform an action. Both may be required.

## Provider Callback Readiness

Future provider callbacks must be safe before production sending.

Checklist:

- callback source validation exists,
- callback signature validation exists,
- organization scope resolution exists,
- channel scope resolution exists,
- unknown callback source fails closed,
- invalid signature fails closed,
- raw callback payload is redacted,
- callback cannot mutate Case official state,
- callback cannot mutate Appointment official state,
- callback cannot mutate Field Service Report official state,
- callback cannot bind customer identity automatically,
- callback cannot remove opt-out,
- callback cannot remove suppression,
- callback cannot bypass entitlement,
- callback cannot bypass permission,
- callback cannot trigger AI auto-decision.

Provider callback readiness does not mean callbacks are approved for runtime.

## Rollback And Incident Readiness

Future provider sending must be stoppable and diagnosable.

Checklist:

- global disable switch exists,
- organization-level disable switch exists,
- channel-level disable switch exists,
- provider-level disable switch exists,
- resend halt exists,
- retry halt exists,
- emergency suppression exists,
- mistaken-send response path exists,
- sensitive-data exposure response path exists,
- provider outage handling exists,
- delivery backlog handling exists,
- incident audit exists,
- internal escalation path exists,
- customer-safe incident wording exists,
- post-incident review process exists.

Rollback controls must be usable without modifying Case / Appointment / Field Service Report official status.

## AI Advisory-only Boundary

AI may assist readiness work by:

- checking this readiness checklist,
- summarizing redacted diagnostics,
- warning about unsafe message copy,
- flagging duplicate / suppression / provider risk,
- suggesting missing audit or permission checks,
- suggesting safe wording for internal review.

AI must not:

- approve readiness,
- switch production mode,
- turn off no-send,
- send notifications,
- resend notifications,
- create provider config,
- read secrets,
- output secrets,
- rotate secrets,
- bypass permission,
- bypass entitlement,
- bypass organization scope,
- bypass opt-out / suppression,
- modify official Case / Appointment / Field Service Report records,
- bind or unbind customer identities,
- write uncertain provider diagnostics as official fact.

AI suggestion is not approval.

## Readiness Decision For Task237

Runtime allowed now: No.

Task237 produces a checklist only. None of the listed gates are satisfied by this task.

Future provider sending remains blocked until a later task explicitly implements and verifies the required controls with PM / business / security / engineering approval.

## Explicit Non-goals

Task237 does not:

- create notification tables,
- create outbox / worker,
- create provider config tables,
- create provider adapters,
- create callback routes,
- create secret storage,
- add API,
- modify backend `src/`,
- modify Admin `admin/src/`,
- add migration,
- modify schema,
- add index,
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

Task237 should be verified with:

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

Future candidates only; not executed by Task237:

- Notification Outbox and Retry Design / No Runtime Change,
- Notification Permission and Entitlement Matrix / No Runtime Change,
- Notification Delivery Audit Event Catalog / No Runtime Change,
- Notification Customer Copy Template Governance / No Runtime Change,
- Notification Usage Metering and Cost Control Planning / No Runtime Change,
- Notification Manual Resend Policy / No Runtime Change,
- Notification Provider Callback Safety Design / No Runtime Change,
- Notification Provider Sending Runtime Readiness Gate / No Runtime Change.
