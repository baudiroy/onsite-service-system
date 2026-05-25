# Task 236 - Notification Provider Configuration And Secret Handling Policy / No Runtime Change

## Purpose And Scope

This document defines future policy for notification provider configuration and secret handling.

The platform may eventually support LINE, SMS, email, APP push, web link, and other notification channels. Before any provider sending is implemented, provider configuration, credentials, secrets, callbacks, diagnostics, organization scope, environment separation, and audit boundaries must be designed to fail closed.

Task236 is documentation-only.

This task is not:

- provider configuration implementation,
- secret management implementation,
- notification runtime,
- provider sending,
- LINE integration,
- SMS integration,
- email integration,
- APP push integration,
- API implementation,
- Admin implementation,
- migration / schema / index implementation,
- event outbox / worker implementation,
- provider callback route implementation,
- automated test implementation,
- localization implementation,
- message template implementation,
- AI decision engine.

Task236 does not read secrets, validate secrets, call provider APIs, connect to DB, run DDL, apply migrations, or send customer messages.

## Provider Configuration Principles

Future provider configuration must be explicit, scoped, and separated from official business state.

Principles:

- provider config must be organization-scoped,
- LINE config must preserve line_channel_id scope,
- provider config must not be reused across organizations by accident,
- sandbox / no-send / production config must be separable,
- provider config must not be bundled into frontend code,
- provider config must not be readable by customer-facing surfaces,
- provider config must not be stored in general notes,
- provider config must not be copied into AI prompts,
- provider callback status must not directly modify Case / Appointment / Field Service Report official status,
- provider readiness does not equal notification delivery approval,
- provider config enabled does not bypass entitlement, permission, consent, opt-out, suppression, or idempotency.

Future provider config may need to represent:

- provider category,
- channel category,
- organization scope,
- environment / mode,
- status,
- safe display label,
- redacted config reference,
- callback verification readiness,
- no-send / sandbox readiness,
- disabled / kill switch state,
- created / updated audit context.

These are design directions only. Task236 does not create a provider config table.

## Secret Handling Policy

Provider secrets are high-risk credentials. They must be protected as operational secrets, not ordinary application data.

Secrets must not appear in:

- documentation,
- logs,
- API responses,
- frontend code,
- screenshots,
- QA artifacts,
- smoke output,
- handoffs,
- exports,
- audit metadata shown outside approved internal views,
- diagnostic payloads,
- AI prompts,
- AI raw payloads,
- customer-visible messages,
- customer-visible errors,
- Admin customer support copy.

Forbidden secret exposure includes:

- LINE access token,
- LINE channel secret,
- SMS provider key,
- email provider key,
- APP push credential,
- webhook secret,
- API key,
- token,
- password,
- private key,
- raw provider credential.

Future secret management principles:

- secrets should be managed by secure secret management,
- secrets should be rotatable,
- secret access should be least privilege,
- secret access should be auditable,
- secret values should not appear in exports,
- secret values should not appear in customer-visible responses,
- secret values should not appear in general Admin diagnostics,
- secret validation errors should be safe and redacted,
- secret rotation should not expose old or new secret values,
- future provider config should reference secrets indirectly.

Task236 does not implement secret storage, secret access, secret validation, secret rotation, or provider config management.

## Environment Separation

Notification provider configuration must distinguish no-send, sandbox, and production.

No-send mode:

- must not call provider APIs,
- must not use production provider credentials,
- must not contact production recipients,
- must produce only redacted internal diagnostics,
- must not be treated as customer delivery.

Sandbox mode:

- must be separated from production provider config,
- must not use production recipients,
- must not use production secrets,
- must not be treated as production delivery success,
- must keep diagnostics redacted,
- must require future permission / audit / organization scope to enable or disable.

Production sending:

- requires explicit future approval gate,
- requires secure provider config,
- requires organization scope,
- requires entitlement and permission checks,
- requires suppression / opt-out checks,
- requires idempotency / duplicate suppression,
- requires audit readiness,
- requires rate limit / cooldown / kill switch readiness,
- must not be enabled by AI suggestion.

Dry-run diagnostics must stay redacted across all modes.

## Organization And Channel Isolation

Provider configuration and channel identity resolution must maintain tenant isolation.

Principles:

- Admin permission must not bypass organization isolation,
- multi-organization / multi-brand / multi-vendor / multi-LINE-channel deployments must remain possible,
- provider config lookup must be scoped by organization,
- channel identity lookup must be scoped by organization and provider channel,
- cross-organization provider config lookup must safe-deny,
- provider callback must resolve organization and channel scope before any processing,
- provider callback from one organization must not affect another organization,
- raw provider identifier must not become a global customer identity.

LINE-specific scope:

- `line_user_id` must never be used as global identity,
- LINE identity must be scoped by organization_id + line_channel_id + line_user_id,
- provider config must preserve line_channel_id where LINE channels are involved,
- future multi-LINE-channel support must not collapse channel identities.

## Provider Callback Readiness

Provider callbacks are future inbound events from LINE, SMS, email, APP push, or another provider.

Future callback handling must:

- resolve organization,
- resolve provider config,
- resolve channel scope,
- verify callback authenticity,
- fail closed for unknown callback source,
- fail closed for signature verification failure,
- avoid leaking verification details,
- redact provider payload before diagnostics,
- preserve customer-visible / internal separation.

Provider callbacks must not automatically:

- modify Case official status,
- modify Appointment official status,
- modify Field Service Report official status,
- approve quotes,
- approve billing / settlement,
- create customer identity binding,
- remove opt-out,
- remove suppression,
- bypass entitlement,
- bypass permission,
- trigger AI auto-decision.

Provider callback raw payload must not be directly logged, pasted into handoffs, or exposed to customer-facing surfaces.

## Safe Diagnostics And Redaction

Safe diagnostics should support internal troubleshooting without exposing sensitive provider or customer data.

Diagnostics may include:

- provider category,
- channel category,
- environment category,
- safe readiness category,
- redacted config reference,
- redacted correlation reference,
- safe callback source category,
- safe validation status category,
- no-send / sandbox / production mode summary.

Diagnostics must not include:

- provider credential,
- raw provider payload,
- LINE access token,
- LINE channel secret,
- raw LINE user id,
- full mobile,
- token,
- secret,
- password,
- private key,
- SQL error,
- stack trace,
- DB constraint name,
- AI raw payload,
- full customer payload,
- full appointment payload,
- full report payload,
- production translation string.

Errors should use safe categories, not raw provider errors.

Examples of safe categories:

- `provider_config_missing`,
- `provider_config_disabled`,
- `provider_config_environment_mismatch`,
- `provider_signature_invalid`,
- `provider_callback_unknown_source`,
- `provider_secret_unavailable`,
- `channel_scope_mismatch`,
- `organization_scope_mismatch`,
- `recipient_not_deliverable`,
- `suppression_active`,
- `entitlement_missing`,
- `permission_denied`.

These category examples are design placeholders only. Task236 does not add error codes, localization strings, API responses, or tests.

## Permission / Entitlement Readiness

Provider configuration will need future permission and entitlement design.

Future questions:

- Who can create provider config?
- Who can modify provider config?
- Who can disable provider config?
- Who can view provider readiness?
- Who can execute credential validation?
- Who can rotate secrets?
- Who can switch no-send / sandbox / production mode?
- Who can view provider diagnostics?
- Which channels require organization entitlement?
- Which provider sending categories require usage metering?
- Which provider diagnostics should be visible to support vs supervisor vs super admin?

Placeholder permissions may include:

- `notification.provider_config.read`,
- `notification.provider_config.create`,
- `notification.provider_config.update`,
- `notification.provider_config.disable`,
- `notification.provider_config.validate`,
- `notification.provider_config.rotate_secret`,
- `notification.provider_config.switch_environment`,
- `notification.provider_diagnostics.read`.

Placeholder feature keys may include:

- `notification_line`,
- `notification_sms`,
- `notification_email`,
- `notification_app_push`,
- `notification_provider_config`,
- `notification_provider_diagnostics`,
- `notification_provider_sandbox`,
- `notification_usage_metering`,
- `multi_line_channel`.

These are future design placeholders only. Task236 does not implement permission runtime, entitlement runtime, feature flag runtime, usage metering, API, Admin UI, schema, localization, or tests.

## Audit Readiness

Future provider configuration audit event families may include:

- provider config created,
- provider config updated,
- provider config disabled,
- provider config environment changed,
- provider config validation requested,
- provider config validation succeeded,
- provider config validation failed,
- provider credential rotated,
- provider credential access denied,
- provider callback received,
- provider callback rejected,
- provider diagnostic viewed,
- production sending enabled,
- production sending disabled,
- no-send mode enforced,
- sandbox mode enabled,
- sandbox mode disabled,
- cross-organization provider config access denied,
- provider config entitlement blocked,
- provider config permission denied.

Audit must be:

- internal-only,
- organization-scoped,
- role-gated,
- redacted,
- allow-listed,
- separated from customer-visible surfaces.

Audit payloads must not contain:

- provider credentials,
- raw provider payloads,
- raw LINE user id,
- full mobile,
- LINE access token,
- LINE channel secret,
- token / password / secret,
- private key,
- raw AI payload,
- DATABASE_URL,
- SQL error,
- stack trace,
- DB constraint name.

## AI Advisory-only Boundary

AI may assist provider configuration readiness by:

- checking a readiness checklist,
- summarizing redacted diagnostics,
- identifying possible secret exposure risk,
- suggesting safer error wording,
- suggesting missing organization/channel scope checks,
- warning about provider mode mismatch,
- warning about unsafe production enablement.

AI must not:

- create provider config,
- modify provider config,
- disable provider config,
- read secrets,
- output secrets,
- rotate secrets,
- validate secrets as final authority,
- switch production mode,
- turn off no-send,
- send notifications,
- resend notifications,
- bypass permission,
- bypass entitlement,
- bypass organization scope,
- bypass suppression,
- modify official Case / Appointment / Field Service Report records,
- bind or unbind customer identities,
- write raw diagnostics as official fact.

AI suggestions must remain advisory and separated from official operational records.

## Runtime Readiness Decision For Task236

Runtime allowed now: No.

Task236 concludes that provider configuration and secret handling need dedicated future security and implementation approval before provider sending can begin.

Future runtime remains blocked until separate approval covers:

- provider config schema,
- secure secret storage,
- credential rotation,
- callback verification,
- no-send mode,
- sandbox mode,
- production approval gate,
- provider adapter implementation,
- audit runtime,
- permission runtime,
- entitlement runtime,
- usage metering,
- tests / QA,
- security review.

## Explicit Non-goals

Task236 does not:

- create provider config tables,
- create secret storage,
- add provider adapters,
- add provider callback routes,
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
- implement outbox / worker,
- implement audit runtime,
- implement permission runtime,
- implement entitlement runtime,
- implement usage runtime,
- implement feature flags,
- implement localization,
- implement message templates,
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

Task236 should be verified with:

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

Future candidates only; not executed by Task236:

- Notification Provider Sending Readiness Checklist / No Runtime Change,
- Notification Outbox and Retry Design / No Runtime Change,
- Notification Permission and Entitlement Matrix / No Runtime Change,
- Notification Delivery Audit Event Catalog / No Runtime Change,
- Notification Customer Copy Template Governance / No Runtime Change,
- Notification Usage Metering and Cost Control Planning / No Runtime Change,
- Notification Manual Resend Policy / No Runtime Change,
- Notification Provider Callback Safety Design / No Runtime Change.
