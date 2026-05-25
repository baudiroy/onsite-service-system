# Task 244 - Notification Provider Callback Safety Design / No Runtime Change

## Purpose And Scope

This document defines future safety boundaries for notification provider callbacks, webhooks, delivery receipts, bounce events, unsubscribe / opt-out events, failure events, and diagnostics from LINE, SMS, email, APP push, or other providers.

Task244 is documentation-only.

This task is not:

- provider callback route implementation,
- webhook runtime,
- provider adapter implementation,
- notification runtime,
- provider sending,
- LINE integration,
- SMS integration,
- email integration,
- APP integration,
- API contract,
- Admin UI,
- migration / schema proposal,
- automated test implementation,
- localization implementation,
- message template implementation,
- AI decision engine.

Task244 does not add callback endpoints, signature validation, provider API calls, payload parsers, runtime writes, provider sending, or DB changes.

## Provider Callback Safety Principles

Provider callback is a delivery diagnostic signal. It is not an official business decision.

Principles:

- provider callback must not directly modify Case official status,
- provider callback must not directly modify Appointment official status,
- provider callback must not directly modify Field Service Report official status,
- provider callback must not automatically complete an appointment,
- provider callback must not automatically create customer channel identity binding,
- provider callback must not automatically remove customer channel identity binding,
- provider callback must not automatically remove opt-out / unsubscribe / suppression,
- provider callback must not automatically resend notification,
- provider callback must not automatically create a formal complaint,
- provider callback must be organization-scoped,
- provider callback must be channel/provider-scoped,
- unknown callback must fail closed,
- ambiguous callback must fail closed,
- provider callback diagnostics must stay internal and redacted.

Callback handling must never become a hidden workflow engine for Case / Appointment / Field Service Report state.

## Callback Source Validation Readiness

Future provider callback handling must perform source validation before any diagnostic state is trusted.

Future checks may include:

- provider source validation,
- signature verification,
- timestamp / replay protection,
- organization provider config resolution,
- channel scope resolution,
- environment / mode resolution: no-send, sandbox, production,
- callback event type allow-list,
- callback correlation reference validation,
- payload size / format safety,
- idempotency / duplicate callback detection.

Task244 does not:

- add signature validation,
- add callback endpoint,
- read provider secrets,
- validate provider secrets,
- call provider APIs,
- parse provider payloads,
- write callback diagnostics.

## Callback Event Category Boundaries

The categories below are proposal-only. They are not production event names, enums, schema fields, API contracts, or runtime behavior.

Future callback categories may include:

- delivery succeeded,
- delivery failed,
- delivery delayed,
- delivery bounced,
- delivery opened / clicked if provider supports it,
- unsubscribe / opt-out received,
- provider rate limited,
- provider rejected message,
- provider credential invalid,
- provider channel disabled,
- unknown event,
- duplicate callback,
- replay suspected,
- malformed payload.

Callback categories are diagnostics only. They must not directly transition official Case / Appointment / Field Service Report state.

## Raw Payload And Diagnostic Redaction

Raw provider payload is sensitive and must not be copied into normal logs, audit metadata, customer-visible response, AI prompts, or handoff.

Forbidden exposure:

- raw provider payload must not be directly logged,
- raw provider payload must not be placed in audit metadata,
- raw provider payload must not be placed in customer-visible responses,
- raw provider payload must not be placed in AI prompts,
- raw provider payload must not be placed in AI raw payload,
- provider credential must not be exposed,
- LINE access token must not be exposed,
- channel secret must not be exposed,
- raw LINE user id must not be exposed,
- complete mobile must not be exposed,
- token / secret must not be exposed,
- stack trace must not be exposed,
- SQL error must not be exposed,
- DB constraint name must not be exposed.

Diagnostics may contain only safe categories, such as:

- provider category,
- channel category,
- callback event category,
- safe failure category,
- redacted correlation reference,
- organization-scoped provider config reference,
- environment category,
- received-at category.

Diagnostics must be internal-only, organization-scoped, role-gated, and redacted.

## Organization And Channel Isolation

Provider callback processing must preserve tenant and channel isolation.

Principles:

- callback must resolve organization scope,
- LINE callback must preserve LINE channel scope,
- multiple organizations must not share callback diagnostics by accident,
- multiple brands / service providers must not share provider config by accident,
- multiple LINE channels must not collapse identity scope,
- raw `line_user_id` must not be used as global customer identity,
- LINE identity must be scoped by organization_id + line_channel_id + line_user_id,
- cross-organization callback ambiguity must fail closed,
- Admin permission must not bypass organization isolation,
- callback diagnostics must not be visible to another organization.

Provider config, provider callback, and channel identity lookup must all maintain compatible scope.

## Provider Callback And Customer Identity Boundary

Provider callback is not the same as verified customer identity.

Principles:

- delivery receipt is not customer consent,
- open / click signal is not customer identity verification,
- provider identifier in callback is not global customer identity,
- unknown provider identity must not automatically create customer,
- ambiguous provider identity must not automatically bind customer,
- callback must not automatically reverse-bind LINE,
- AI suggestion must not fill missing identity evidence,
- unsubscribe / opt-out callback may become a future suppression signal only after organization / channel scope is resolved.

Customer identity verification and channel binding need explicit future workflow, permission, audit, and safe-deny behavior.

## Business State Isolation

Provider callback must not automatically modify official business state.

Forbidden automatic mutations:

- Case status,
- Appointment status,
- Field Service Report status,
- finalAppointmentId,
- quote approval,
- billing / settlement approval,
- complaint status,
- survey response official content,
- customer identity official verification status.

Provider callback may be used as internal diagnostic / audit signal in future runtime, but it is not an official business state transition.

## No-send / Sandbox / Production Boundary

Provider callback handling must be mode-aware.

Future principles:

- no-send mode should not receive real provider callback,
- if no-send mode receives provider callback, it should become future incident review,
- sandbox callback must not be recorded as production delivery result,
- production callback requires explicit provider readiness approval,
- environment mismatch must fail closed,
- sandbox callback diagnostics must be separated from production callback diagnostics,
- production callback diagnostics must still be redacted.

Task244 does not implement environment routing, no-send handling, sandbox handling, or production callback processing.

## Safe-deny And Non-leakage

Provider callback failure handling must avoid leaking resource existence or configuration details.

Future internal failure handling:

- unknown callback source: internal generic reject,
- signature failed: internal generic reject,
- organization mismatch: internal generic reject,
- channel mismatch: internal generic reject,
- unknown message reference: internal generic reject,
- duplicate / replay suspected: internal generic reject,
- malformed payload: internal generic reject.

Customer-facing surfaces must not show callback detail.

Authorized Admin-facing surfaces may show only safe diagnostic categories after organization scope and permission are confirmed.

Do not leak:

- whether notification exists,
- whether Case exists,
- whether customer exists,
- whether LINE is bound,
- whether provider found an identity,
- whether provider credential is valid,
- whether organization has a provider enabled,
- raw provider failure details.

## Audit Readiness

Future provider callback audit event families may include:

- notification provider callback received,
- notification provider callback rejected,
- notification provider callback signature failed,
- notification provider callback scope mismatch,
- notification provider callback duplicate suppressed,
- notification provider callback replay suspected,
- notification provider callback payload redacted,
- notification provider callback event classified,
- notification provider callback ignored,
- notification provider callback unsubscribe applied,
- notification provider callback suppression signaled,
- notification provider diagnostic viewed,
- provider callback incident review created,
- AI callback summary generated,
- AI callback suggestion rejected.

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
- do not expose audit on customer-visible surfaces.

Task244 does not implement audit runtime.

## Permission / Entitlement Readiness

Task244 does not implement permission, entitlement, or usage runtime.

Future questions:

- Who can view callback diagnostics?
- Who can view callback rejected reason?
- Who can view provider callback incident review?
- Who can apply unsubscribe / suppression from provider callback?
- Who can override callback classification?
- Who can view provider credential validation status?
- Which provider callback diagnostics require entitlement?
- Which callback processing events require usage metering?
- Which callback incident reviews require supervisor or security role?

Placeholder permissions may include:

- `notification.provider_callback.view`,
- `notification.provider_callback.diagnostics.view`,
- `notification.provider_callback.incident_review.view`,
- `notification.provider_callback.classification.override`,
- `notification.provider_callback.suppression.apply`.

Placeholder feature keys may include:

- `notification_provider_callback`,
- `notification_provider_diagnostics`,
- `notification_callback_incident_review`,
- `notification_callback_usage_metering`.

These are future design placeholders only. Task244 does not add production permissions, feature keys, schema, API, Admin UI, localization, tests, or runtime.

## AI Advisory-only Boundary

AI may:

- summarize redacted callback diagnostics,
- classify callback failure category for human review,
- warn about replay / duplicate / scope mismatch risk,
- check whether diagnostic text may leak sensitive data,
- organize incident review context.

AI must not:

- accept callback as official result,
- modify delivery official state,
- create customer identity binding,
- remove customer identity binding,
- remove opt-out,
- remove suppression,
- resend notification,
- modify Case official status,
- modify Appointment official status,
- modify Field Service Report official status,
- select finalAppointmentId,
- create complaint,
- close complaint,
- approve quote,
- approve billing / settlement,
- approve refund / compensation,
- read secrets,
- output secrets,
- rotate secrets,
- bypass permission,
- bypass entitlement,
- bypass organization scope,
- write uncertain inference into official records.

AI suggestion remains advisory.

## Runtime Readiness Decision For Task244

Runtime allowed now: No.

Task244 defines provider callback safety only. It does not approve callback route, webhook runtime, provider adapter, notification runtime, provider sending, API, Admin UI, schema, tests, or provider integration.

Future runtime remains blocked until separate approval covers:

- callback route / API contract,
- provider adapter,
- signature verification,
- payload parser,
- provider config / secret handling,
- organization and channel scope,
- safe diagnostics,
- audit runtime,
- permission / entitlement,
- no-send / sandbox / production routing,
- tests / QA,
- PM / business / security / engineering approval.

## Explicit Non-goals

Task244 does not:

- create provider callback routes,
- create webhook controllers,
- create provider adapters,
- create callback tables,
- create notification tables,
- create outbox tables,
- create delivery attempt tables,
- add signature validation,
- add payload parser,
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
- add localization files,
- add message template files,
- add automated tests,
- add fixtures,
- add smoke tests,
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

Task244 should be verified with:

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

Future candidates only; not executed by Task244:

- Notification Audit Redaction Allow-list / No Runtime Change,
- Notification Permission Safe-deny Error Matrix / No Runtime Change,
- Notification Template Versioning Proposal / No Migration,
- Notification Localization Key Draft / No Runtime Change,
- Notification Provider Callback API Contract Draft / No Runtime Change,
- Notification Runtime Readiness Gate / No Runtime Change,
- Notification Branch Pause Summary / No Runtime Change.
