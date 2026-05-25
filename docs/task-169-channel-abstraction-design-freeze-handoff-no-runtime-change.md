# Task 169 - Channel Abstraction Design Freeze / Handoff / No Runtime Change

## Background

Task169 freezes the channel abstraction design package and prepares implementation handoff.
It does not implement runtime behavior, connect to DB, apply migrations, modify Admin UI, send provider messages, or enable survey runtime.

This task freezes Tasks167-168 as the current channel abstraction design package.

## No-runtime-change Statement

Task169 does not:

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
- implement delivery resolver runtime,
- implement outbox worker,
- implement AI automatic decisions,
- modify inventory docs,
- perform destructive cleanup,
- mutate shared runtime data,
- output sensitive values.

## Source Review Summary

Reviewed and frozen:

- `docs/task-167-channel-abstraction-core-model-review-no-runtime-change.md`
- `docs/task-168-channel-abstraction-source-of-truth-index-no-runtime-change.md`

Referenced source packages:

- Tasks158-166 reverse LINE binding design package.
- Tasks147/150 survey / Migration 020 pause and handoff.
- Tasks110 and 105-109 completion / `finalAppointmentId` invariants.
- Existing LINE schema and services.
- Existing notification schema and service.
- Existing CustomerInquiry / LINE inquiry adapter.
- Existing Admin `CustomerLineIdentitiesPanel`.

## Source-of-truth Index Summary

Current channel abstraction entry points:

1. Task169 - design freeze / handoff.
2. Task168 - source-of-truth index and matrix.
3. Task167 - core model review.
4. Task166 - reverse LINE binding final pause.
5. Task150 - Migration 020 / survey runtime final pause.
6. Task120 - survey roadmap freeze.
7. Task114 - survey delivery resolver design.
8. Task110 - first-transition survey trigger.
9. Task105-109 - backend-owned `finalAppointmentId` and repeat completion hardening.
10. Existing LINE / notification / inquiry code and migrations.

## Freeze Scope

Frozen channel abstraction decisions:

1. Core Case / Customer / Appointment / Field Service Report / `finalAppointmentId` remain channel-agnostic.
2. LINE is current primary channel, but not the core model.
3. Channel identity belongs in provider-specific or future generic channel identity layer.
4. Survey trigger remains Case-level first completion.
5. Survey delivery resolver is channel-aware but not runtime-enabled.
6. Notification tables are foundation only, not sending approval.
7. Reverse LINE binding is provider-specific and paused.
8. APP / SMS / email are future channels, not current runtime.
9. Provider payloads require allow-list and redaction.
10. Manual follow-up is operations workflow, not provider identity.
11. AI advisory cannot select, send, or decide channel automatically.

## Freeze Non-approval Statement

This freeze does not approve:

- migration file,
- migration apply,
- DB connection,
- DB dry-run,
- backend runtime implementation,
- Admin UI implementation,
- notification sending,
- LINE / APP / SMS / email provider sending,
- delivery resolver runtime,
- outbox worker,
- survey runtime,
- reverse LINE binding runtime,
- trusted LINE / LIFF runtime,
- API changes,
- smoke / test changes,
- AI automatic decisions,
- inventory docs expansion,
- destructive cleanup.

## Core Domain vs Channel Layer Boundary Summary

Core domain:

- Case,
- Customer,
- Appointment / visit,
- Field Service Report,
- `finalAppointmentId`,
- completion transition,
- billing / settlement,
- core workflow audit.

Channel layer:

- provider configuration,
- customer channel identity,
- delivery eligibility,
- notification preferences,
- templates,
- logs / outbox,
- provider response,
- opt-out / suppression,
- reverse binding / verification,
- trusted provider context.

The core domain must work without LINE, APP, SMS, email, survey, or notification delivery.

## Provider Placement Handoff

Recommended placement:

- LINE: existing provider-specific tables and services.
- APP: future identity and delivery model, likely separate planning branch.
- SMS / email: verified contact policy and future provider adapters.
- In-app: existing `in_app` notification enum foundation; future APP may or may not use it.
- Manual follow-up: operations task / dashboard workflow.

Do not collapse all provider identity into Customer core fields without a separate model review.

## Do-not-hard-code-LINE Rules

Do not hard-code LINE into:

- Case lifecycle,
- Appointment lifecycle,
- Field Service Report completion,
- `finalAppointmentId`,
- survey trigger,
- survey idempotency,
- billing / settlement,
- notification core,
- Admin handoff,
- audit payloads,
- AI suggestions.

LINE-specific behavior belongs in provider-specific boundaries.

## Reverse LINE Binding Handoff

Reverse LINE binding remains paused after Task166.

It is related to channel abstraction because it creates a provider-specific identity binding, but it must not:

- complete Case,
- complete report,
- alter `finalAppointmentId`,
- create survey intent,
- send survey,
- send LINE push by default.

Future reverse binding work must start from the Task166 pause summary.

## Survey Delivery Resolver Handoff

Survey delivery resolver remains design-only.

It may later evaluate:

- LINE,
- APP,
- SMS,
- email,
- manual follow-up,
- no channel / pending channel.

It must not:

- re-infer `finalAppointmentId`,
- mutate completion state,
- require LINE-origin Case,
- include raw LINE user id in payload,
- send messages without outbound approval.

Migration 020 remains paused.

## Notification Foundation Handoff

Existing notification tables are a useful channel foundation.

Before runtime:

- define resolver policy,
- define payload allow-list,
- define provider response redaction,
- define recipient redaction,
- define opt-out / suppression,
- define no-send smoke,
- define provider credential safety,
- define shared runtime outbound policy.

Notification table presence is not sending approval.

## Admin Visibility / Handoff Boundary

Admin should see:

- safe channel labels,
- masked provider identity,
- safe eligibility summary,
- safe status and reason code,
- timestamps,
- non-sensitive audit summary.

Admin should not see or paste:

- raw LINE user id,
- raw APP provider id,
- customer mobile / phone / tel in handoff,
- provider credentials,
- raw provider payload,
- full notification payload,
- full survey outbox payload,
- production data dumps.

## Implementation Handoff Checklist

Before implementation, confirm:

1. Explicit branch selection.
2. Data model decision for generic `customer_channel_identities` vs provider-specific tables.
3. APP identity model decision.
4. SMS / email verified contact policy.
5. Opt-out / suppression policy.
6. Delivery resolver priority policy.
7. No-channel / pending-channel expiration policy.
8. Provider response redaction policy.
9. Admin visibility permissions.
10. No-send test plan.
11. Shared runtime outbound policy.
12. Migration status and apply approval, if schema changes are needed.
13. Runtime implementation approval.
14. Sending approval.
15. Sensitive output policy.

If these are not explicitly answered, keep the next task docs-only.

## Remaining Blockers

Remaining blockers:

- no generic channel identity model decision,
- no APP identity model,
- no SMS / email verification policy,
- no opt-out / suppression policy,
- no delivery resolver priority,
- no pending-channel expiration policy,
- no notification payload allow-list,
- no provider response redaction policy,
- no Admin channel visibility permission split,
- no no-send test plan,
- no shared runtime outbound policy,
- no runtime implementation branch approval.

## Reopen Conditions

Reopen channel abstraction docs if:

- product makes APP primary,
- SMS/email removed or added as runtime priority,
- notification channel enum changes,
- generic channel identity table is approved,
- provider-specific identity table strategy changes,
- survey delivery resolver policy changes,
- reverse binding policy changes,
- raw provider id handling policy changes,
- Admin visibility requirements change,
- outbound sending policy changes,
- privacy / legal retention policy changes.

## Future Implementer Reading Order

Recommended order:

1. Task169 freeze / handoff.
2. Task168 source-of-truth index.
3. Task167 core model review.
4. Task166 reverse LINE binding pause.
5. Task150 survey / Migration 020 pause.
6. Task120 survey roadmap freeze.
7. Task114 survey resolver design.
8. Task105-109 `finalAppointmentId` and completion hardening.
9. Existing LINE schema / services.
10. Existing notification schema / service.

## Task170 Recommendation

Default:

```text
Task170 - Channel Abstraction Handoff QA / Next Branch Selection / No Runtime Change
```

Scope:

- docs-only,
- QA Tasks167-169 handoff consistency,
- confirm freeze wording does not imply migration / runtime / sending approval,
- prepare branch selection:
  - stay paused / docs-only,
  - APP channel model proposal,
  - generic `customer_channel_identities` proposal,
  - notification delivery readiness planning,
  - return to SLA / operations risk.

Alternative if the user wants operations branch:

```text
Task170 - SLA / Operations Risk Escalation Design / No Runtime Change
```

## Final Recommendation

Freeze Tasks167-169 as the channel abstraction design package.

The system is ready for docs-only QA / branch selection.
It is not ready for migration, runtime provider sending, delivery resolver, Admin implementation, APP runtime, or survey runtime.

## Non-goals

Task169 does not design or implement:

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

Recommended verification for Task169:

- `npm run check`
- `npm run admin:check`
- `git diff --check`
- sensitive information scan for actual credential / customer / raw provider values.
