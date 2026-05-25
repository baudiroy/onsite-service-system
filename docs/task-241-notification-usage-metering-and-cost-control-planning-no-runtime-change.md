# Task 241 - Notification Usage Metering And Cost Control Planning / No Runtime Change

## Purpose And Scope

This document defines future usage metering and cost control planning for notification delivery and related capabilities.

Future notification-related usage may include LINE push, SMS, email, APP push, provider callbacks, AI copy assistance, delivery diagnostics, exports, retries, manual resend, no-send simulation, and sandbox attempts.

Task241 is documentation-only.

This task is not:

- usage metering runtime implementation,
- SaaS billing / subscription / pricing implementation,
- notification runtime,
- provider sending,
- LINE integration,
- SMS integration,
- email integration,
- APP integration,
- provider adapter implementation,
- API implementation,
- Admin implementation,
- migration / schema / index implementation,
- export / report runtime,
- automated test implementation,
- localization implementation,
- message template implementation,
- AI decision engine.

Task241 does not set prices, quotas, billing rules, usage keys, provider contracts, or production metering behavior.

## Core Usage / Billing Separation Principles

Notification cost control must stay separate from permissions and business workflow state.

Principles:

- permission controls whether a user can perform an action,
- entitlement controls whether an organization has a feature,
- usage controls how much an organization consumed during a period,
- subscription / plan controls an organization's commercial entitlement state,
- billing / invoice / payment runtime is not in scope for this phase,
- seat / account billing must not be confused with customer channel access,
- AI add-on / provider sending / export / diagnostics may be future usage-tracked capabilities,
- even with entitlement, actions still need permission and usage / rate / cost gates,
- even with usage quota, actions still need organization scope and workflow safety checks,
- usage tracking must not expose customer personal data or sensitive payloads,
- usage and audit are related but not identical.

Usage metering must not be used as a shortcut to bypass:

- opt-out / unsubscribe,
- suppression,
- organization isolation,
- provider configuration safety,
- no-send / sandbox policy,
- customer-visible/internal data separation,
- AI advisory-only boundary.

## Future Usage Categories

The categories below are proposal-only. They are not production usage keys, schema fields, pricing items, billing events, or runtime behavior.

Future usage categories may include:

- LINE push send attempt,
- SMS send attempt,
- email send attempt,
- APP push send attempt,
- web link generation,
- provider callback processed,
- delivery retry attempt,
- manual resend attempt,
- notification audit export,
- delivery report export,
- provider diagnostics view,
- AI copy suggestion,
- AI delivery risk summary,
- AI failure summary,
- no-send simulation,
- sandbox delivery attempt.

Task241 does not:

- add usage records,
- add billing events,
- add pricing,
- add runtime,
- add feature flags,
- add provider sending,
- add exports,
- add tests.

## Cost Control Readiness

Future cost controls should be designed before notification sending or AI-assisted notification operations are enabled.

Future controls may include:

- organization-level quota,
- channel-level quota,
- provider-level quota,
- daily period limit,
- monthly period limit,
- rate limit,
- cooldown,
- retry cap,
- manual resend cap,
- AI usage cap,
- export cap,
- provider cost budget threshold,
- emergency halt,
- over-limit safe-deny,
- notification sending disabled when cost control blocks action.

Cost controls should be fail-closed. If the system cannot safely determine whether an organization is within limit, production sending should not proceed.

Task241 does not set actual quota values, rate limits, prices, cost thresholds, or billing periods.

## Usage Evaluation Order

Future runtime should evaluate usage and cost gates in a clear order.

Suggested future order:

1. Authenticate actor.
2. Resolve organization scope.
3. Check subscription / plan state if future runtime exists.
4. Check feature entitlement.
5. Check user permission.
6. Check recipient / channel identity / consent / suppression.
7. Check usage quota / rate / cost control.
8. Check no-send / sandbox / production gate.
9. Apply safe-deny / non-leakage.
10. Audit allowed / blocked event where safe.
11. Keep AI advisory separate from official decision.

This is a future design order only. Task241 does not implement middleware, guards, API checks, usage records, billing events, or tests.

## Customer-visible vs Internal Usage Data

Customer-visible surfaces must not show internal usage or cost details.

Customer-visible surfaces must not show:

- organization usage quota details,
- provider cost,
- billing internal data,
- entitlement internal reason,
- usage limit internal reason,
- provider diagnostics,
- audit log,
- AI usage details,
- raw identifiers,
- usage metering internals.

Internal-only views may eventually include:

- safe usage category,
- usage period category,
- quota status category,
- cost threshold category,
- provider category,
- redacted correlation reference,
- audit reference.

Internal usage views must still be permission-scoped, organization-scoped, and redacted.

## Safe-deny And Non-leakage

Usage and cost-control failures must not leak sensitive business or tenant information.

Customer-facing cases should use generic unavailable wording for:

- missing entitlement,
- usage limit reached,
- cost control blocked,
- provider quota exceeded,
- AI add-on unavailable,
- subscription inactive,
- provider unavailable,
- notification suppressed.

Customer-facing surfaces must not reveal:

- organization plan,
- pricing,
- exact quota,
- current usage,
- cost threshold,
- internal billing status,
- provider configuration status,
- channel availability internals.

Authorized Admin-facing views may show more specific usage / entitlement categories only when:

- actor is authenticated,
- actor is authorized,
- organization scope is valid,
- resource visibility is already established,
- redaction rules are satisfied.

Cross-organization usage lookup must safe-deny.

Hidden resource usage must not reveal resource existence.

## Provider Sending And Retry Cost Boundary

Future notification cost policy must decide how to meter provider and retry behavior.

Open future policy questions:

- Does retry count toward usage?
- Does failed provider attempt count toward usage?
- Does provider timeout count toward usage?
- Does no-send simulation count toward usage?
- Does sandbox attempt count toward usage?
- Does manual resend count toward usage?
- Does provider callback processing count toward usage?
- Does duplicate-suppressed attempt count toward usage?
- Does provider diagnostic view count toward usage?
- Does export/report generation count toward usage?

Task241 does not answer these as production pricing rules. It only records that they must be decided before runtime billing / usage enforcement.

Provider cost controls must not mutate Case / Appointment / Field Service Report official status.

## AI Usage Boundary

AI-assisted notification work may need usage tracking and cost control.

Future AI metering candidates:

- AI copy assist,
- AI delivery risk summary,
- AI failure summary,
- AI diagnostic summarization,
- AI safe-copy review,
- AI readiness checklist review.

AI usage principles:

- AI usage must be organization-scoped,
- AI usage must not bypass permission,
- AI usage must not bypass entitlement,
- AI usage must not bypass usage limit,
- AI usage must not expose token counts to customer-facing surfaces,
- AI raw payload must not enter usage metadata,
- AI cost control must not justify bypassing security or privacy review,
- AI suggestions must remain separate from official records,
- AI must not be treated as a billing decision authority.

## Audit Readiness

Future usage and cost-control audit event families may include:

- notification usage evaluated,
- notification usage recorded,
- notification usage blocked,
- notification quota reached,
- notification rate limit applied,
- notification cost threshold reached,
- notification AI usage evaluated,
- notification AI usage blocked,
- notification export usage evaluated,
- notification sandbox usage evaluated,
- notification no-send usage evaluated,
- notification usage report viewed,
- notification usage report exported.

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
- do not record customer-facing plan/pricing secret,
- do not expose audit on customer-visible surfaces.

Task241 does not implement audit runtime.

## Permission / Entitlement Readiness

Task241 does not implement permission, entitlement, or usage runtime.

Future questions:

- Who can view usage summary?
- Who can view provider cost category?
- Who can set quota?
- Who can override usage block?
- Who can view AI usage?
- Who can export usage report?
- Which channels need usage metering?
- Which AI features need AI add-on?
- Which usage data requires tenant admin?
- Which usage data requires billing admin?
- Which usage data requires security role?
- Which usage events should be retained for audit?

Placeholder permission families may include:

- `notification.usage.view`,
- `notification.usage.export`,
- `notification.cost_control.view`,
- `notification.cost_control.manage`,
- `notification.quota.manage`,
- `notification.usage_override.request`,
- `notification.usage_override.approve`,
- `notification.ai_usage.view`.

Placeholder feature keys may include:

- `notification_usage_metering`,
- `notification_cost_control`,
- `notification_usage_report`,
- `notification_usage_export`,
- `notification_ai_usage_metering`,
- `notification_provider_cost_tracking`,
- `notification_quota_management`.

These are future design placeholders only. Task241 does not add permission runtime, entitlement runtime, feature flags, usage metering, API, Admin UI, schema, localization, or tests.

## AI Advisory-only Boundary

AI may:

- summarize redacted usage trends,
- warn about cost anomalies,
- flag retry storm / duplicate-send risk,
- check usage policy gaps,
- suggest safer internal usage summaries,
- organize cost-control review context.

AI must not:

- raise quota,
- remove usage block,
- open entitlement,
- modify plan,
- modify subscription,
- send notifications,
- resend notifications,
- bypass cost control,
- bypass permission,
- bypass entitlement,
- bypass organization scope,
- read secrets,
- output secrets,
- modify official Case / Appointment / Field Service Report records,
- write uncertain inference into official usage / billing record.

AI suggestion remains advisory and not billing authority.

## Runtime Readiness Decision For Task241

Runtime allowed now: No.

Task241 defines usage metering and cost control planning only. It does not approve usage runtime, SaaS billing, subscription runtime, pricing, invoice/payment runtime, notification runtime, provider sending, API, Admin UI, schema, tests, or localization.

Future runtime remains blocked until separate approval covers:

- production usage keys,
- quota / rate / cost policy,
- subscription / plan behavior,
- entitlement integration,
- permission integration,
- usage storage,
- billing event behavior,
- audit runtime,
- safe-deny behavior,
- API / Admin behavior,
- tests / QA,
- PM / business / security / engineering approval.

## Explicit Non-goals

Task241 does not:

- create usage tables,
- create billing events tables,
- create pricing tables,
- create subscription runtime,
- create invoice runtime,
- create payment runtime,
- add provider adapters,
- create notification tables,
- create outbox tables,
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
- implement usage metering runtime,
- implement entitlement runtime,
- implement permission runtime,
- implement audit runtime,
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

Task241 should be verified with:

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

Future candidates only; not executed by Task241:

- Notification Customer Copy Template Governance / No Runtime Change,
- Notification Manual Resend Policy / No Runtime Change,
- Notification Provider Callback Safety Design / No Runtime Change,
- Notification Audit Redaction Allow-list / No Runtime Change,
- Notification Permission Safe-deny Error Matrix / No Runtime Change,
- Notification Usage Metering Schema Proposal / No Migration,
- Notification Runtime Readiness Gate / No Runtime Change.
