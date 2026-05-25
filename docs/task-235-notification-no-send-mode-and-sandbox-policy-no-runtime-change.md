# Task 235 - Notification No-Send Mode And Sandbox Policy / No Runtime Change

## Purpose And Scope

This document defines the future no-send and sandbox policy that must exist before any notification provider sending is implemented.

The goal is to prevent accidental customer messaging while future notification readiness work is still being designed. Any future provider integration must first prove that it can simulate, diagnose, audit, and fail closed without sending real messages.

Task235 is documentation-only.

This task is not:

- notification runtime,
- provider sending,
- LINE integration,
- SMS integration,
- email integration,
- APP push integration,
- event outbox / worker implementation,
- provider configuration implementation,
- API implementation,
- Admin implementation,
- migration / schema / index implementation,
- automated test implementation,
- localization implementation,
- message template implementation,
- AI auto-decision.

Task235 does not approve any runtime, provider call, DB connection, DDL, migration apply, shared runtime operation, or outbound customer message.

## Core No-send Principles

No-send mode is a mandatory future safety boundary.

All future notification provider integrations must support no-send mode before production sending is allowed.

No-send mode must:

- not call real provider APIs,
- not send real LINE messages,
- not send real SMS messages,
- not send real emails,
- not send real APP push notifications,
- not contact production recipients,
- not mark a notification as delivered to the customer,
- not modify Case official status,
- not modify Appointment official status,
- not modify Field Service Report official status,
- not approve quotes,
- not approve billing / settlement,
- not bind or verify customer channel identity,
- not trigger survey sending,
- not perform AI auto-decision.

No-send mode may produce only:

- redacted internal diagnostic output,
- audit-ready internal events in future runtime,
- safe eligibility result,
- safe suppression / opt-out result,
- safe provider-readiness result,
- safe template-readiness result,
- safe idempotency / duplicate-suppression result.

No-send mode does not mean the customer received anything. It is an internal simulation / readiness check only.

## Sandbox Policy

Provider sandbox / test mode must be separate from production provider configuration.

Sandbox mode must:

- be explicitly marked as sandbox,
- avoid production provider secrets,
- avoid production recipients,
- avoid customer-visible delivery,
- avoid production LINE / SMS / email / APP channels,
- keep diagnostics redacted,
- avoid treating sandbox result as official delivery success,
- remain organization-scoped,
- be auditable in future runtime.

Sandbox / production switching must require future explicit controls:

- permission,
- organization scope,
- audit log,
- feature entitlement / gate where applicable,
- provider configuration safety check,
- kill switch / disable switch check,
- security review for production enablement.

Task235 does not implement sandbox configuration, secret management, provider adapters, or switching logic.

## Dry-run / Preview Boundary

Dry-run and preview are internal-only readiness tools.

Dry-run may check:

- notification eligibility,
- Case / Appointment / Field Service Report lifecycle compatibility,
- recipient resolution readiness,
- channel identity availability summary,
- consent / opt-in status summary,
- opt-out / unsubscribe / suppression summary,
- entitlement / feature gate readiness,
- permission readiness for manual actions,
- template readiness,
- provider configuration readiness,
- idempotency / duplicate suppression readiness,
- rate limit / cooldown readiness,
- no-send / sandbox guard status.

Dry-run must not:

- send,
- call production provider APIs,
- expose raw identifiers,
- expose full customer data,
- expose full provider payloads,
- write customer-visible state,
- mark delivery as success,
- modify official Case / Appointment / Field Service Report state,
- override opt-out / suppression,
- bypass entitlement or permission,
- create real customer-facing message artifacts.

Dry-run result should be internal-only and redacted.

Customer-facing surfaces must not show dry-run diagnostics.

## Provider Credential Safety

Provider credentials are sensitive operational secrets.

Future implementation must not expose provider credentials in:

- documentation,
- logs,
- frontend code,
- API responses,
- QA artifacts,
- smoke output,
- screenshots,
- handoffs,
- exports,
- audit payload shown outside authorized internal views,
- AI prompts or AI summaries.

Forbidden sensitive values include:

- LINE access token,
- LINE channel secret,
- SMS provider secret,
- email provider secret,
- APP push provider secret,
- webhook secret,
- API key,
- token,
- password,
- private key,
- raw provider credential.

Future provider configuration must be organization-scoped. Provider config must not be reused across organizations unless an explicit future tenant/provider design allows it with clear isolation.

Task235 does not:

- create secret storage,
- read provider secrets,
- validate provider secrets,
- rotate provider secrets,
- call providers,
- write provider configuration.

## Organization Scope And Channel Scope

No-send, sandbox, and production sending must all be organization-scoped.

Channel scope is also required:

- LINE identity must be scoped by organization_id + line_channel_id + line_user_id,
- provider config must not cross organization boundaries,
- provider callback must not cross organization boundaries,
- Admin role must not bypass organization isolation,
- customer identity must not equal raw provider identifier,
- channel identity must not become global customer identity.

Future notification sending must resolve:

- organization,
- customer / contact internal reference,
- channel identity candidate,
- provider configuration,
- entitlement,
- permission,
- suppression / opt-out,
- no-send / sandbox / production mode.

If any scope check is ambiguous, missing, or mismatched, the system must fail closed.

## Safe Diagnostics And Redaction

Diagnostics are internal support tools, not customer-facing output.

Diagnostics may include:

- provider category,
- channel category,
- safe failure category,
- redacted attempt reference,
- mode summary such as no-send / sandbox / production,
- eligibility status,
- suppression status summary,
- entitlement status summary,
- provider config readiness category,
- retry eligibility category.

Diagnostics must not include:

- complete customer mobile,
- raw LINE user id,
- token,
- secret,
- password,
- provider credential,
- raw provider payload,
- raw AI payload,
- full customer payload,
- full appointment payload,
- full report payload,
- DATABASE_URL,
- SQL error,
- stack trace,
- DB constraint name,
- production translation string.

QA screenshots, test artifacts, handoffs, and exports must not contain unmasked sensitive data.

If raw provider diagnostics are necessary for engineering investigation, they must stay in approved secure internal systems and must not be copied into docs, chat handoffs, customer-visible UI, or public issue summaries.

## No-send Audit Readiness

Future no-send / sandbox audit event families may include:

- notification no-send evaluated,
- notification no-send simulated,
- notification no-send blocked,
- sandbox delivery attempted,
- sandbox delivery succeeded,
- sandbox delivery failed,
- production sending blocked by no-send policy,
- provider config missing,
- provider config unsafe,
- unsafe recipient blocked,
- recipient scope mismatch blocked,
- channel scope mismatch blocked,
- opt-out / suppression blocked,
- entitlement blocked,
- permission blocked,
- duplicate / idempotency blocked,
- AI sending suggestion generated,
- AI sending suggestion rejected.

Audit must be:

- internal-only,
- organization-scoped,
- role-gated,
- redacted,
- allow-listed,
- separated from customer-visible surfaces.

Audit must not become provider sending. Creating an audit-ready event or diagnostic does not mean a message was sent.

## Permission / Entitlement Readiness

No-send and sandbox still need future access control decisions.

Future questions:

- Who can run no-send simulation?
- Who can preview notification composition?
- Who can view provider diagnostics?
- Who can manage provider configuration?
- Who can switch sandbox / production mode?
- Who can request manual resend?
- Who can approve manual resend?
- Which channels require tenant entitlement?
- Which categories require paid feature access?
- Which sending actions require usage metering?
- Which staff roles can see delivery failures?

Placeholder permission families may include:

- `notification.no_send.simulate`,
- `notification.preview`,
- `notification.diagnostics.read`,
- `notification.provider_config.read`,
- `notification.provider_config.manage`,
- `notification.mode.switch`,
- `notification.manual_resend.request`,
- `notification.manual_resend.approve`.

Placeholder feature keys may include:

- `notification_no_send`,
- `notification_sandbox`,
- `notification_line`,
- `notification_sms`,
- `notification_email`,
- `notification_app_push`,
- `notification_manual_resend`,
- `notification_delivery_diagnostics`,
- `notification_usage_metering`.

These are future design placeholders only. Task235 does not implement permission runtime, entitlement runtime, feature flag runtime, usage metering, API, Admin UI, localization, tests, or schema.

## AI Advisory-only Boundary

AI may assist no-send and sandbox readiness by:

- checking whether a planned message appears safe,
- summarizing redacted diagnostics,
- detecting possible accidental-send risk,
- identifying missing no-send guardrails,
- reminding staff about suppression / opt-out,
- suggesting internal triage categories,
- suggesting safer copy wording for human review.

AI must not:

- turn off no-send,
- switch sandbox to production,
- send notifications,
- resend notifications,
- choose official channel as final authority,
- modify provider configuration,
- bypass suppression,
- bypass opt-out / unsubscribe,
- bypass permission,
- bypass entitlement,
- modify Case official status,
- modify Appointment official status,
- modify Field Service Report official status,
- approve quotes,
- approve billing / settlement,
- bind or verify customer identity,
- write uncertain diagnostics as official fact,
- expose raw provider or AI payloads.

AI suggestion and official operational record must remain separate.

## Failure Modes To Guard Against

Future implementation should explicitly guard against:

- no-send flag accidentally disabled,
- sandbox configured with production recipients,
- production provider config used in sandbox,
- provider call made during dry-run,
- customer-visible message generated from internal diagnostics,
- raw provider payload copied into logs,
- raw LINE user id used as global identity,
- cross-organization provider config reuse,
- callback from one organization affecting another organization,
- delivery retry after opt-out,
- manual resend without permission,
- AI suggestion treated as send approval,
- provider delivery success modifying official business status,
- sandbox delivery counted as production delivery,
- dry-run result shown to customer,
- error response leaking identity existence.

## Runtime Readiness Decision For Task235

Runtime allowed now: No.

Task235 concludes that no-send / sandbox policy is required before provider sending, but this task does not implement it.

Future notification runtime is still blocked until separate approval covers:

- provider config and secret handling,
- no-send implementation,
- sandbox provider strategy,
- provider adapter implementation,
- audit runtime,
- permission runtime,
- entitlement runtime,
- feature flags / kill switches,
- idempotency / suppression,
- usage metering,
- tests / QA plan,
- production sending approval.

## Explicit Non-goals

Task235 does not:

- create notification tables,
- create provider config tables,
- create outbox / worker,
- add provider adapter,
- send LINE messages,
- send SMS,
- send email,
- send APP push,
- add API,
- modify backend `src/`,
- modify Admin `admin/src/`,
- add migration,
- modify schema,
- add index,
- add permission runtime,
- add entitlement runtime,
- add usage runtime,
- add feature flag runtime,
- add localization,
- add message templates,
- modify `package.json`,
- modify inventory docs,
- touch Migration020,
- operate shared Zeabur,
- connect to DB,
- run DDL,
- run psql,
- run `npm run db:migrate`,
- implement survey runtime,
- implement notification runtime,
- implement audit runtime,
- implement resolver,
- implement reverse binding runtime,
- implement LINE binding runtime,
- implement AI auto-decision,
- perform destructive cleanup.

## Verification Checklist

Task235 should be verified with:

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

Future candidates only; not executed by Task235:

- Notification Provider Sending Readiness Checklist / No Runtime Change,
- Notification Outbox and Retry Design / No Runtime Change,
- Notification Permission and Entitlement Matrix / No Runtime Change,
- Notification Delivery Audit Event Catalog / No Runtime Change,
- Notification Provider Configuration and Secret Handling Policy / No Runtime Change,
- Notification Customer Copy Template Governance / No Runtime Change,
- Notification Usage Metering and Cost Control Planning / No Runtime Change,
- Notification Manual Resend Policy / No Runtime Change.
