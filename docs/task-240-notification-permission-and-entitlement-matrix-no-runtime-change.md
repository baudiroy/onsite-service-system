# Task 240 - Notification Permission And Entitlement Matrix / No Runtime Change

## Purpose And Scope

This document defines a future permission and entitlement matrix for notification delivery, provider configuration, no-send / sandbox, outbox / retry, manual resend, audit / diagnostics, usage / cost control, and AI advisory flows.

Task240 is documentation-only.

This task is not:

- permission runtime implementation,
- entitlement runtime implementation,
- feature flag runtime implementation,
- usage metering runtime implementation,
- SaaS billing / subscription / pricing implementation,
- notification runtime,
- provider sending,
- API implementation,
- Admin implementation,
- migration / schema / index implementation,
- automated test implementation,
- localization implementation,
- message template implementation,
- AI decision engine.

The permission names and feature keys in this document are placeholders only. They are not production RBAC permissions, seed data, feature flags, entitlement records, API contracts, Admin UI strings, or generated client definitions.

## Core Principles

Notification permissions and entitlements must remain separate.

Principles:

- permission controls whether a user can perform an action,
- entitlement controls whether an organization has access to a feature,
- usage controls how much an organization has consumed during a period,
- subscription / plan controls the organization's commercial entitlement state,
- seat / account billing is separate from customer channel identity,
- customer channel identity is not a paid internal user seat,
- even if an organization has an entitlement, the user still needs permission,
- even if a user has permission, the organization still needs entitlement,
- all future notification API / Admin / export / diagnostics / provider config actions must check identity, role, permission, and organization scope,
- AI must not bypass permission, entitlement, usage limit, subscription state, or organization scope.

Notification actions must also respect:

- no-send / sandbox / production gate,
- customer consent / opt-in,
- opt-out / unsubscribe,
- suppression,
- idempotency / duplicate suppression,
- provider configuration safety,
- audit / redaction policy,
- customer-visible / internal data separation.

## Future Permission Catalog Draft

The permissions below are placeholder names only.

They do not modify RBAC, seed data, API enforcement, Admin UI, generated clients, or tests.

### A. Notification Policy

- `notification.policy.view`
- `notification.policy.manage`

### B. Delivery Operation

- `notification.delivery.status.view`
- `notification.delivery.send.request`
- `notification.delivery.send.approve`
- `notification.delivery.cancel`
- `notification.delivery.resend.request`
- `notification.delivery.resend.approve`

### C. Outbox / Retry

- `notification.outbox.view`
- `notification.retry.view`
- `notification.retry.manage`
- `notification.dead_letter.view`
- `notification.exception_review.manage`

### D. Provider Config / Diagnostics

- `notification.provider_config.view`
- `notification.provider_config.manage`
- `notification.provider_config.validate`
- `notification.provider_secret.rotate`
- `notification.provider_diagnostics.view`

### E. No-send / Sandbox / Production Gate

- `notification.no_send.view`
- `notification.no_send.manage`
- `notification.sandbox.manage`
- `notification.production_send.enable`
- `notification.production_send.disable`

### F. Audit / Export / Usage

- `notification.audit.view`
- `notification.audit.export`
- `notification.usage.view`
- `notification.cost_control.view`

### G. AI Advisory

- `notification.ai_suggestion.view`
- `notification.ai_suggestion.accept_for_review`
- `notification.ai_suggestion.reject`

## Future Entitlement Feature Key Draft

The feature keys below are placeholder names only.

They do not add entitlement runtime, feature flag runtime, usage metering, billing / subscription / pricing, API enforcement, Admin UI, schema, localization, generated clients, or tests.

### A. Core Notification

- `notification_delivery`
- `notification_policy`
- `notification_delivery_status`

### B. Channels

- `notification_channel_line`
- `notification_channel_sms`
- `notification_channel_email`
- `notification_channel_app`
- `notification_web_link`

### C. Provider Operations

- `notification_provider_config`
- `notification_provider_diagnostics`
- `notification_no_send_mode`
- `notification_sandbox_mode`
- `notification_production_sending`

### D. Outbox / Retry / Resend

- `notification_outbox`
- `notification_retry`
- `notification_manual_resend`
- `notification_duplicate_suppression`

### E. Audit / Export / Analytics

- `notification_delivery_audit`
- `notification_audit_export`
- `notification_delivery_report`
- `notification_quality_dashboard`

### F. Usage / Cost / AI Add-on

- `notification_usage_metering`
- `notification_cost_control`
- `notification_ai_copy_assist`
- `notification_ai_delivery_risk`

## Permission-to-Entitlement Matrix

The matrix below is proposal-only. Runtime allowed now is No for every row.

| Future capability | Placeholder entitlement | Placeholder permission | Actor category | Customer-visible or internal-only | Requires organization scope | Requires audit | Provider sending involved? | Usage / cost involved? | AI allowed? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| View notification delivery status | `notification_delivery_status` | `notification.delivery.status.view` | Support / dispatcher / supervisor | Internal-only unless future customer-safe status is approved | Yes | Yes | No | Maybe | AI may summarize redacted status | No |
| View outbox item | `notification_outbox` | `notification.outbox.view` | Support / supervisor / security | Internal-only | Yes | Yes | No | Maybe | AI may summarize redacted diagnostics | No |
| Request manual resend | `notification_manual_resend` | `notification.delivery.resend.request` | Support / supervisor | Internal-only action; customer sees only approved message if later sent | Yes | Yes | Future only | Yes | AI may suggest missing reason only | No |
| Approve manual resend | `notification_manual_resend` | `notification.delivery.resend.approve` | Supervisor / tenant admin | Internal-only | Yes | Yes | Future only | Yes | AI cannot approve | No |
| Cancel queued notification | `notification_outbox` | `notification.delivery.cancel` | Support / supervisor / system process | Internal-only | Yes | Yes | No | Maybe | AI cannot cancel | No |
| View retry diagnostics | `notification_retry` | `notification.retry.view` | Support / supervisor / security | Internal-only | Yes | Yes | No | Maybe | AI may summarize redacted failure category | No |
| View provider diagnostics | `notification_provider_diagnostics` | `notification.provider_diagnostics.view` | Support / security / tenant admin | Internal-only | Yes | Yes | No | Maybe | AI may summarize redacted diagnostics | No |
| Manage provider config | `notification_provider_config` | `notification.provider_config.manage` | Tenant admin / security role | Internal-only | Yes | Yes | No | No | AI cannot manage config | No |
| Validate provider config | `notification_provider_config` | `notification.provider_config.validate` | Tenant admin / security role | Internal-only | Yes | Yes | No-send / sandbox only until approved | No | AI cannot validate as final authority | No |
| Rotate provider secret | `notification_provider_config` | `notification.provider_secret.rotate` | Security role / tenant admin | Internal-only | Yes | Yes | No | No | AI cannot read or rotate secrets | No |
| Enable sandbox mode | `notification_sandbox_mode` | `notification.sandbox.manage` | Tenant admin / security role | Internal-only | Yes | Yes | No production sending | No | AI cannot switch mode | No |
| Enable production sending | `notification_production_sending` | `notification.production_send.enable` | Security / tenant admin with approval gate | Internal-only control | Yes | Yes | Yes after future approval | Yes | AI cannot enable production | No |
| View notification audit trail | `notification_delivery_audit` | `notification.audit.view` | Supervisor / security / tenant admin | Internal-only | Yes | Yes | No | Maybe | AI may summarize only for authorized roles | No |
| Export notification audit | `notification_audit_export` | `notification.audit.export` | Security / tenant admin | Internal-only export | Yes | Yes | No | Maybe | AI cannot bypass export policy | No |
| View usage / cost summary | `notification_usage_metering` | `notification.usage.view` | Finance / tenant admin | Internal-only | Yes | Yes | No | Yes | AI may summarize aggregate only | No |
| View AI notification suggestion | `notification_ai_copy_assist` | `notification.ai_suggestion.view` | Support / supervisor | Internal-only until copy approved | Yes | Yes | No | Yes | AI generated content is advisory | No |
| Accept / reject AI suggestion for review | `notification_ai_copy_assist` | `notification.ai_suggestion.accept_for_review` / `notification.ai_suggestion.reject` | Support / supervisor | Internal-only review action | Yes | Yes | No | Yes | AI cannot accept itself | No |

## Suggested Future Evaluation Order

Future runtime should evaluate notification actions in a fail-closed order.

Suggested order:

1. Authenticate actor.
2. Resolve organization / tenant scope.
3. Resolve resource visibility within organization.
4. Check organization subscription / plan state if future runtime exists.
5. Check organization entitlement / feature availability.
6. Check usage / rate / cost limit if applicable.
7. Check user permission.
8. Check workflow state / no-send / sandbox / production gate.
9. Check recipient / channel identity / consent / suppression.
10. Apply safe-deny / non-leakage.
11. Write audit event where safe and appropriate.
12. Keep AI advisory separate from official decision.

This is a design sequence only. Task240 does not implement middleware, guards, API behavior, or tests.

## Actor Category Readiness

Future notification permission design should distinguish actor categories.

Conceptual actor categories:

- Customer,
- customer service,
- dispatcher,
- supervisor / quality manager,
- engineer,
- tenant admin,
- security / support role,
- system process,
- worker / outbox process,
- provider callback source,
- AI advisory process.

Important boundaries:

- customer must not see provider diagnostics, audit, permission internals, entitlement internals, usage internals, or raw identifiers,
- engineer should not automatically manage provider config or resend customer notifications,
- provider callback source is not an official business decision actor,
- AI advisory process is not a permission principal and must not independently execute official actions,
- system process and worker process still need organization scope and guardrails,
- tenant admin role must not bypass organization isolation.

## Safe-deny And Non-leakage

Notification permission / entitlement failures must avoid resource enumeration.

Safe-deny applies to:

- missing permission,
- missing entitlement,
- inactive subscription,
- usage limit blocked,
- cross-organization access,
- hidden resource,
- ambiguous channel identity,
- provider readiness unknown,
- deleted / unavailable resource,
- no-send / sandbox / production gate mismatch.

Customer-facing surfaces must not reveal internal reasons such as:

- plan not enabled,
- permission denied,
- provider config missing,
- LINE not bound,
- channel identity ambiguous,
- internal suppression rule,
- usage/cost limit,
- provider unavailable,
- audit or diagnostics state.

Admin/API surfaces may show more actionable 403 / configuration state only when the actor is authorized to know the resource exists and the organization scope is valid.

Cross-organization and hidden-resource cases should prefer generic not available behavior.

## Audit Readiness

Future permission and entitlement audit event families may include:

- notification permission denied,
- notification entitlement denied,
- notification usage limit blocked,
- notification provider config viewed,
- notification provider config changed,
- notification production sending enabled,
- notification production sending disabled,
- notification resend requested,
- notification resend approved,
- notification resend rejected,
- notification diagnostics viewed,
- notification audit exported,
- notification AI suggestion viewed,
- notification AI suggestion accepted,
- notification AI suggestion rejected.

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

Task240 does not implement audit runtime.

## AI Advisory-only Boundary

AI may:

- suggest permission / entitlement gap categories,
- summarize redacted diagnostics for authorized internal users,
- warn about unsafe action risk,
- organize delivery readiness context,
- identify missing safe-deny coverage,
- suggest safer internal wording for review.

AI must not:

- authorize a user,
- grant a role,
- create permission,
- create entitlement,
- open organization feature access,
- raise usage limit,
- switch production mode,
- turn off no-send,
- send notifications,
- resend notifications,
- modify provider config,
- read secrets,
- output secrets,
- rotate secrets,
- modify Case official status,
- modify Appointment official status,
- modify Field Service Report official status,
- bypass permission,
- bypass organization scope,
- bypass entitlement,
- write uncertain inference into official record.

AI suggestion remains advisory and separate from official decisions.

## Runtime Readiness Decision For Task240

Runtime allowed now: No.

Task240 defines a future permission and entitlement matrix only. It does not approve notification runtime, permission runtime, entitlement runtime, feature flag runtime, usage metering, SaaS billing, provider sending, API, Admin UI, schema, tests, or localization.

Future runtime remains blocked until separate approval covers:

- production permission names,
- production entitlement feature keys,
- subscription / plan integration,
- usage metering,
- safe-deny behavior,
- audit runtime,
- API enforcement,
- Admin UI behavior,
- tests / QA,
- PM / business / security / engineering approval.

## Explicit Non-goals

Task240 does not:

- add permissions,
- add roles,
- add entitlements,
- add feature flags,
- add usage metering,
- add SaaS billing / subscription / pricing,
- create notification tables,
- create outbox tables,
- create provider config tables,
- add provider adapters,
- add callback routes,
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
- implement feature flag runtime,
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

Task240 should be verified with:

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

Future candidates only; not executed by Task240:

- Notification Customer Copy Template Governance / No Runtime Change,
- Notification Usage Metering and Cost Control Planning / No Runtime Change,
- Notification Manual Resend Policy / No Runtime Change,
- Notification Provider Callback Safety Design / No Runtime Change,
- Notification Audit Redaction Allow-list / No Runtime Change,
- Notification Permission Safe-deny Error Matrix / No Runtime Change,
- Notification Runtime Readiness Gate / No Runtime Change.
