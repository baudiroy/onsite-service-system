# Task 167 - Channel Abstraction Core Model Review / No Runtime Change

## Background

Task167 returns to the product mainline after reverse LINE binding was paused at Task166.

The goal is to review channel abstraction boundaries across Case, Customer, Field Service Report, customer inquiry, notification foundations, reverse LINE binding, and future survey delivery.

This task is docs-only and does not implement channel runtime behavior.

## No-runtime-change Statement

Task167 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify smoke or browser smoke scripts,
- add tests,
- add a migration file,
- change schema or indexes,
- apply or dry-run Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- send LINE / APP / SMS / email,
- implement APP support,
- implement notification delivery,
- implement survey runtime,
- implement reverse LINE binding runtime,
- implement AI automatic decisions,
- modify inventory docs,
- perform destructive cleanup,
- mutate shared runtime data,
- output sensitive values.

## Source Review Summary

Reviewed channel-related foundations:

- `migrations/005_update_message_foundation.sql`
- `migrations/010_create_notification_tables.sql`
- `migrations/012_create_line_integration_tables.sql`
- `migrations/013_add_organization_scope.sql`
- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `src/services/NotificationService.js`
- `src/services/CustomerInquiryService.js`
- `src/services/CustomerLineIdentityService.js`
- `src/services/LineService.js`
- `src/validators/notificationValidators.js`
- `src/validators/customerInquiryValidators.js`
- `src/mappers/lineMapper.js`
- `admin/src/components/CustomerLineIdentitiesPanel.tsx`
- `docs/task-114-survey-delivery-resolver-channel-selection-design.md`
- `docs/task-118-reverse-line-binding-survey-delivery-compatibility-design.md`
- `docs/task-120-survey-roadmap-freeze-implementation-readiness-gate.md`
- `docs/task-150-migration-020-survey-runtime-final-pause-summary-no-runtime-change.md`
- `docs/task-158-existing-case-reverse-line-binding-product-design-no-runtime-change.md`
- `docs/task-166-reverse-line-binding-final-pause-summary-no-runtime-change.md`

## Current Channel-related Model Review

Current foundations:

- `line_channels` stores organization-scoped LINE channel configuration.
- `customer_line_identities` links customer / organization / LINE channel / LINE user identity.
- `line_events` records channel-scoped LINE events.
- `notification_preferences`, `notification_templates`, and `notification_logs` already support channel values:
  - `line`
  - `sms`
  - `email`
  - `in_app`
- `NotificationService` has preference/template/log foundations but does not send provider messages.
- `CustomerInquiryService` has website and LINE inquiry paths with generic public failures.
- Admin API clients and mappers mask sensitive LINE / channel values.
- Case records may carry source / intake channel summaries, but core Case lifecycle is not LINE-only.

Current gaps:

- no generic `customer_channel_identities` table,
- no APP identity model,
- no SMS/email identity verification model,
- no delivery resolver runtime,
- no outbound provider runtime,
- no channel preference runtime beyond admin-managed foundations,
- no survey delivery runtime,
- no reverse LINE binding runtime.

## Channel Abstraction Boundary

Core domain should remain channel-agnostic:

- Case,
- Customer,
- Appointment / visit,
- Field Service Report,
- Billing / settlement,
- completion transition,
- `finalAppointmentId`,
- formal report uniqueness.

Channel layer should own:

- provider channel configuration,
- customer channel identity,
- delivery eligibility,
- delivery preference,
- template rendering,
- outbound provider queue/log,
- provider response,
- opt-out / suppression policy,
- reverse binding / verification.

This keeps a Case valid whether it originated from:

- Admin entry,
- phone,
- vendor feed,
- LINE,
- website,
- API,
- future APP,
- SMS / email,
- manual follow-up.

## Internal Customer / Contact Identity vs Channel Identity

Recommended conceptual split:

### Internal identity

Internal platform objects:

- `customers.id`
- `cases.id`
- `organization_id`
- contact fields on Customer or Case snapshot,
- service history,
- report history.

These should not depend on LINE or any specific delivery channel.

### Channel identity

Provider-specific identity:

- LINE: `organization_id + line_channel_id + line_user_id`
- future APP: `organization_id + app_id / app_channel_id + app_user_id`
- SMS: normalized / verified phone identity, subject to policy
- email: verified email identity, subject to policy
- manual follow-up: no provider identity; operator-owned contact action

Channel identity should be linked to internal Customer / Case context through a resolver or binding table, not embedded into core Case / Report invariants.

## Future Channel Placement

Recommended future placement:

| Channel | Configuration | Identity | Delivery | Notes |
| --- | --- | --- | --- | --- |
| LINE | `line_channels` | `customer_line_identities` | future resolver / provider | Current primary channel |
| APP | future app channel config | future app customer identity | future app push / in-app | Must not require LINE |
| SMS | notification config + policy | verified phone/contact policy | future SMS provider | Must avoid raw phone in handoff |
| Email | notification config + policy | verified email/contact policy | future email provider | Must avoid full payload in logs |
| Manual follow-up | none or admin workflow config | operator action context | task / dashboard workflow | No automated provider send |

The existing notification channel enum includes `line`, `sms`, `email`, and `in_app`.
Future APP may map to `in_app` at first or require a distinct `app_push` channel after product review.

## Places That Must Not Hard-code LINE

Do not hard-code LINE into:

- Case creation,
- Case status lifecycle,
- Appointment lifecycle,
- Field Service Report completion,
- `finalAppointmentId` inference,
- report finalization,
- billing / settlement,
- survey trigger source of truth,
- survey idempotency key,
- notification preference core,
- customer inquiry core,
- Admin handoff summaries,
- audit payloads,
- AI suggestions / risk radar.

LINE-specific code should stay in:

- LINE channel configuration,
- LINE webhook handling,
- LINE identity binding,
- LINE delivery provider,
- LINE-specific inquiry adapter,
- trusted LINE / LIFF context.

## Reverse LINE Binding Compatibility

Tasks158-166 remain compatible with channel abstraction because:

- binding is customer-level with optional Case context,
- raw LINE user id is not global identity,
- scope includes organization and LINE channel,
- binding does not complete Case / Report,
- binding does not alter `finalAppointmentId`,
- binding does not send survey,
- binding does not require the Case to originate from LINE.

Future APP binding should follow the same pattern:

- invitation or verified session,
- organization-scoped provider identity,
- internal Customer link,
- no mutation of core Case / Report completion.

## Survey Delivery Resolver Compatibility

Survey trigger remains Case-level first completion.

Channel resolver may later choose:

- LINE if bound and eligible,
- APP if app identity exists and policy allows,
- SMS / email if verified and policy allows,
- manual follow-up,
- pending channel / not deliverable.

Resolver must not:

- use raw LINE user id in survey intent / outbox payload,
- require Case to originate from LINE,
- re-infer `finalAppointmentId`,
- mutate Case / Report completion,
- send messages unless outbound policy is approved.

## Notification Foundation Review

Current notification tables support generic channel values and are a good foundation.

Current strengths:

- `notification_preferences` can be target-scoped and channel-scoped.
- `notification_templates` can be event/channel/version scoped.
- `notification_logs` can record event/channel/status.
- `NotificationService` can evaluate preferences and create skipped/sent/failed logs.

Current risks before runtime:

- `notification_logs.recipient`, `payload`, and `provider_response` can become sensitive if not allow-listed.
- Provider sending is not implemented and must not be inferred from table presence.
- Channel resolver and redaction policy must be defined before outbound runtime.

## Admin Visibility Boundary

Admin should see:

- safe channel labels,
- masked identity summary,
- delivery eligibility summary,
- preference status,
- notification log safe status,
- safe reason codes.

Admin should not see:

- raw LINE user id,
- raw APP provider id,
- customer mobile in delivery handoff if not needed,
- provider credentials,
- raw provider payload,
- full survey outbox payload,
- full notification payload unless explicitly sanitized.

## Future Migration / API / Runtime Blockers

Before channel abstraction implementation:

- decide whether APP uses `in_app` or separate `app_push`,
- decide whether generic `customer_channel_identities` is needed,
- decide whether LINE remains special-case table or becomes provider-specific subtype,
- define contact verification policy for SMS / email,
- define opt-out / suppression policy,
- define resolver priority,
- define no-channel / pending-channel expiration,
- define notification payload allow-list,
- define provider response redaction,
- define Admin visibility permissions,
- define no-send smoke coverage,
- preserve Migration 020 pause unless separately approved.

## Recommendations

Recommended near-term posture:

- keep core Case / Report / Appointment models channel-agnostic,
- use existing LINE tables only for LINE-specific identity and webhook concerns,
- use notification channel enum as a delivery preference/template/log foundation, not as proof of delivery runtime,
- design future APP identity with the same internal-vs-channel split,
- keep survey trigger independent from delivery channel,
- keep reverse LINE binding paused until user selects a branch.

## Future Test / Smoke Ideas

Future tests should confirm:

- Case can be created without LINE identity.
- Case can be completed without LINE identity.
- `finalAppointmentId` inference does not depend on channel.
- survey trigger event does not include raw channel identifiers.
- notification payloads are allow-listed.
- Admin channel panels mask provider identities.
- LINE binding does not create survey send.
- APP binding future flow can share resolver concepts.
- SMS/email fallback does not expose raw contact details in handoff.

These are future tests only. Task167 does not add tests.

## Next Task Recommendation

Recommended Task168:

```text
Task168 - Channel Abstraction Source-of-truth Index / No Runtime Change
```

Scope:

- docs-only,
- create a channel abstraction source-of-truth / reading order,
- map existing LINE, notification, survey, reverse binding docs,
- identify which docs are current vs historical,
- no migration,
- no runtime,
- no Admin change.

Alternative:

```text
Task168 - SLA / Operations Risk Escalation Design / No Runtime Change
```

if the user wants to move into operations risk rather than channel architecture.

## Non-goals

Task167 does not design or implement:

- backend runtime,
- Admin frontend runtime,
- API clients,
- migration files,
- schema / indexes,
- smoke tests,
- provider sending,
- LINE push,
- APP push,
- SMS / email,
- survey sending,
- reverse binding runtime,
- AI automatic decisions,
- inventory docs changes,
- destructive cleanup.

## Verification

Recommended verification for Task167:

- `npm run check`
- `npm run admin:check`
- `git diff --check`
- sensitive information scan for actual credential / customer / raw provider values.
