# Task 168 - Channel Abstraction Source-of-truth Index / No Runtime Change

## Background

Task168 creates the channel abstraction source-of-truth index.
It does not implement runtime behavior, connect to DB, apply migrations, modify Admin UI, send provider messages, or enable survey runtime.

This task builds on Task167 and organizes the current channel abstraction references for future implementers.

## No-runtime-change Statement

Task168 does not:

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
- implement LINE binding API,
- implement token generation,
- implement LIFF flow,
- implement webhook runtime,
- implement Admin UI,
- send LINE / APP / SMS / email,
- implement survey runtime,
- write survey intents or event outbox rows,
- implement AI automatic decisions,
- modify inventory docs,
- perform destructive cleanup,
- mutate shared runtime data,
- output sensitive values.

## Source Review Summary

Reviewed source groups:

- Task167 channel abstraction core model review.
- Tasks158-166 reverse LINE binding design package.
- Tasks147 and 150 survey / Migration 020 pause and handoff.
- Tasks110 and 105-109 upstream completion / `finalAppointmentId` invariants.
- Existing LINE channel / customer identity model.
- Existing notification preference / template / log foundation.
- Existing CustomerInquiry / LINE inquiry adapter.
- Existing Admin `CustomerLineIdentitiesPanel`.

## Channel Abstraction Source-of-truth Index

Current entry points:

| Area | Source |
| --- | --- |
| Channel abstraction overview | `docs/task-167-channel-abstraction-core-model-review-no-runtime-change.md` |
| Reverse LINE binding pause | `docs/task-166-reverse-line-binding-final-pause-summary-no-runtime-change.md` |
| Reverse LINE binding freeze / handoff | `docs/task-164-reverse-line-binding-design-freeze-implementation-handoff-no-runtime-change.md` |
| Reverse LINE binding readiness | `docs/task-163-reverse-line-binding-implementation-readiness-gate-no-runtime-change.md` |
| Reverse LINE binding security | `docs/task-162-reverse-line-binding-security-abuse-case-review-no-runtime-change.md` |
| Reverse LINE binding product flow | `docs/task-158-existing-case-reverse-line-binding-product-design-no-runtime-change.md` |
| Reverse LINE binding data model | `docs/task-159-reverse-line-binding-data-model-proposal-no-migration.md` |
| Reverse LINE binding API | `docs/task-160-reverse-line-binding-api-contract-no-runtime-change.md` |
| Reverse LINE binding Admin UX | `docs/task-161-reverse-line-binding-admin-ux-operator-runbook-no-runtime-change.md` |
| Survey / Migration 020 pause | `docs/task-150-migration-020-survey-runtime-final-pause-summary-no-runtime-change.md` |
| Survey handoff index | `docs/task-147-migration-020-survey-runtime-handoff-index-pause-point-no-runtime-change.md` |
| Survey delivery resolver design | `docs/task-114-survey-delivery-resolver-channel-selection-design.md` |
| Survey roadmap freeze | `docs/task-120-survey-roadmap-freeze-implementation-readiness-gate.md` |
| Completion first-transition survey trigger | `docs/task-110-post-completion-survey-trigger-first-transition-design.md` |
| Backend-owned `finalAppointmentId` contract | `docs/task-105-backend-owned-final-appointment-inference-api-contract.md` |
| LINE schema | `migrations/012_create_line_integration_tables.sql` and `migrations/013_add_organization_scope.sql` |
| Notification schema | `migrations/010_create_notification_tables.sql` |
| Message foundation | `migrations/005_update_message_foundation.sql` |
| LINE services | `src/services/LineService.js`, `src/services/CustomerLineIdentityService.js` |
| Notification service | `src/services/NotificationService.js` |
| Customer inquiry | `src/services/CustomerInquiryService.js` |
| Admin LINE identity panel | `admin/src/components/CustomerLineIdentitiesPanel.tsx` |

## Existing Channel Foundation Map

| Foundation | Current state | Notes |
| --- | --- | --- |
| LINE channel config | Existing `line_channels` table | Provider-specific, organization scoped |
| LINE customer identity | Existing `customer_line_identities` table | Provider-specific identity binding |
| LINE events | Existing `line_events` table | Provider inbound event record |
| Notification preferences | Existing table | Channel-scoped policy foundation |
| Notification templates | Existing table | Channel-scoped content foundation |
| Notification logs | Existing table | Logs only; not sending approval |
| Customer inquiry | Existing public inquiry services | Website and LINE inquiry paths |
| Admin LINE identity panel | Existing Admin component | Manual operational tool, not reverse-binding UX |
| Survey intent/outbox | Migration 020 file exists only | Not applied / not dry-run / no runtime |

## Core Domain vs Channel Layer Boundary

Core domain:

- Case,
- Customer,
- Appointment / visit,
- Field Service Report,
- `finalAppointmentId`,
- completion transition,
- billing / settlement,
- audit of core workflow.

Channel layer:

- provider configuration,
- customer channel identity,
- channel delivery eligibility,
- notification preference,
- notification template,
- notification log / outbox,
- provider response,
- reverse binding / verification,
- trusted provider context.

Core domain must not require a LINE identity, APP identity, SMS identity, email identity, or survey delivery channel.

## Provider-specific Placement

| Provider / mode | Placement | Current status |
| --- | --- | --- |
| LINE | `line_channels`, `customer_line_identities`, LINE service / webhook | Partially implemented foundation |
| APP | Future app config / app customer identity | Not implemented |
| SMS | Notification channel + verified contact policy | Not implemented as provider |
| Email | Notification channel + verified contact policy | Not implemented as provider |
| Manual follow-up | Admin / operations workflow | Product design only |
| In-app | Existing notification enum `in_app` | Foundation only |

Future APP may initially map to `in_app`, but a dedicated `app_push` decision should be reviewed before runtime.

## Do-not-hard-code-LINE Rules

Do not hard-code LINE into:

- Case lifecycle,
- Case completion,
- Appointment lifecycle,
- Field Service Report completion,
- `finalAppointmentId` inference,
- survey trigger,
- survey idempotency,
- billing / settlement,
- notification preference core,
- Admin handoff,
- audit payloads,
- AI risk / suggestion output.

LINE-specific behavior belongs in:

- LINE provider config,
- LINE webhook handling,
- LINE identity binding,
- LINE delivery adapter,
- LINE inquiry adapter,
- trusted LINE / LIFF context.

## Reverse LINE Binding Relation

Reverse LINE binding is a provider-specific binding flow on top of the channel abstraction.

It must:

- bind internal Customer to LINE channel identity,
- keep optional Case context for invitation,
- not mutate Case completion,
- not mutate Field Service Report completion,
- not alter `finalAppointmentId`,
- not create survey intent,
- not send survey,
- not require Case to originate from LINE.

Reverse LINE binding remains paused after Task166.

## Survey Delivery Resolver Relation

Survey trigger source of truth:

- first successful Case / Field Service Report completion transition.

Survey delivery resolver may later evaluate:

- LINE binding,
- future APP binding,
- SMS / email contact eligibility,
- manual follow-up,
- no channel / pending channel.

Resolver must not:

- re-infer `finalAppointmentId`,
- mutate completion state,
- use raw LINE user id in payload,
- require LINE-origin Case,
- send without outbound approval.

Migration 020 remains paused.

## Notification Foundation Relation

Notification foundations are useful but not a delivery system yet.

Current foundation:

- preferences,
- templates,
- logs,
- `NotificationService.shouldNotify`,
- skipped / sent / failed log state helpers.

Before runtime:

- define payload allow-list,
- define provider response redaction,
- define delivery resolver,
- define opt-out / suppression,
- define no-send tests,
- define provider credential handling,
- define shared-runtime outbound policy.

## Admin Visibility / Handoff Boundary

Admin may see:

- channel labels,
- masked identity,
- safe status,
- safe reason code,
- delivery eligibility summary,
- timestamps,
- non-sensitive audit summary.

Admin must not see in handoff:

- raw LINE user id,
- raw APP provider id,
- customer mobile / phone / tel values unless explicitly required in a protected customer view,
- provider secret / access token,
- full provider payload,
- full notification payload,
- full survey outbox payload,
- production data dumps.

## Current Frozen Decisions

Frozen decisions:

- one Case = one formal Field Service Report,
- multiple appointments / visits per Case,
- `finalAppointmentId` is backend/system determined,
- reverse LINE binding does not change completion,
- survey trigger is Case-level first completion,
- survey delivery is channel-agnostic,
- raw LINE user id is not a global identity,
- notification table existence does not approve provider sending,
- Migration 020 remains paused,
- inventory docs remain frozen.

## Open Blockers / Future Decisions

Open blockers:

- generic `customer_channel_identities` vs provider-specific identity tables,
- APP identity and APP push model,
- SMS / email verification policy,
- opt-out / suppression policy,
- delivery resolver priority,
- pending-channel expiration,
- notification payload allow-list,
- provider response redaction,
- Admin visibility permissions,
- no-send smoke coverage,
- shared-runtime outbound policy.

## Channel Abstraction Matrix

| Area | Current source of truth | Current status | Channel-agnostic or provider-specific? | Runtime implemented? | Migration required? | Future blocker | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Case | core migrations / services | Existing | Channel-agnostic | Yes | No | None for channel abstraction | Must not require LINE |
| Customer | core migrations / services | Existing | Channel-agnostic with contact fields | Yes | No | Contact verification policy | Contact fields are not provider identity |
| Appointment / visit | appointment migrations / services | Existing | Channel-agnostic | Yes | No | None for channel abstraction | Multi-visit remains core workflow |
| Field Service Report | FSR services / Task105-109 | Existing | Channel-agnostic | Yes | No | None for channel abstraction | One formal report per Case |
| `finalAppointmentId` | Task105-109 | Existing backend-owned | Channel-agnostic | Yes | No | None for channel abstraction | Must not depend on LINE |
| LINE channel config | migrations 012/013 | Existing | Provider-specific | Partial | No | Secret handling / provider runtime | Current primary channel |
| `customer_line_identities` | migrations 012/013 | Existing | Provider-specific | Partial | No | Reverse binding runtime | Scope by org + channel + user |
| Future APP identity | Task167/168 | Design only | Provider-specific | No | Yes likely | APP identity model | Do not force LINE |
| SMS / email verified contact | Task167/168 | Design only | Provider-specific/contact-policy | No | Possibly | Verification / opt-out | Avoid raw contact handoff |
| Manual follow-up | Task167/168 | Design only | Operational channel | No | Possibly no | Dashboard / owner workflow | No provider identity |
| Notification preferences | migration 010 | Existing foundation | Channel-aware | Admin foundation only | No | Policy / resolver | Not delivery approval |
| Notification templates | migration 010 | Existing foundation | Channel-aware | Admin foundation only | No | Content policy | No seed/delivery approval |
| Notification logs | migration 010 | Existing foundation | Channel-aware | Log helpers only | No | Redaction / allow-list | Payload can be sensitive |
| Survey trigger | Task110 / Task120 | Frozen design | Channel-agnostic | No survey runtime | Migration 020 paused | Runtime approval | Case-level first completion |
| Survey delivery resolver | Task114 / Task120 / Task150 | Frozen design | Channel-aware | No | Maybe | Resolver policy | No sending |
| Reverse LINE binding | Task158-166 | Frozen design | Provider-specific | No | Yes later | Explicit branch selection | Paused |
| Admin channel visibility | Task161 / Task167 | Design + existing panels | Channel-aware | Partial | Maybe | Permission/redaction | Masked summaries only |
| AI advisory | AI-ready docs | Design boundary | Channel-agnostic input/output boundary | Partial foundation | No | AI policy | No auto decisions |

## Safe Future Branch Options

Possible future branches:

1. Channel abstraction design freeze / handoff.
2. Channel resolver policy design / no runtime.
3. Notification payload allow-list / no runtime.
4. APP identity model proposal / no migration.
5. Reverse LINE binding migration proposal / no migration.
6. SLA / operations risk escalation design.
7. Billing / settlement itemization design.

Do not start migration, DB, API runtime, Admin runtime, LINE push, APP push, SMS / email, or survey runtime without explicit branch approval.

## Final Recommendation

Use Task168 as the channel abstraction entry index.

Next safest step:

```text
Task169 - Channel Abstraction Design Freeze / Handoff Note / No Runtime Change
```

This would freeze Tasks167-168 as the channel abstraction package and provide branch options for future resolver / notification / APP identity work.

## Non-goals

Task168 does not design or implement:

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

Recommended verification for Task168:

- `npm run check`
- `npm run admin:check`
- `git diff --check`
- sensitive information scan for actual credential / customer / raw provider values.
