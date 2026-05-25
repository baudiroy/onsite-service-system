# Task 137 - Survey Runtime Feature Flag / Kill Switch Contract Design / No Runtime Change

## Background

Task137 designs future survey runtime feature flags and kill switches. It does not implement flags, change runtime behavior, connect to DB, apply migration, or enable survey sending.

Task136 kept the project on the no-apply path because Migration 020 local-only dry-run and shared apply are still not authorized. The next safe step is to design a disabled-by-default flag contract so future runtime work cannot accidentally enable writes, resolver processing, sending, backfill, Admin controls, or AI advisory behavior.

## No-runtime-change Statement

Task137 does not:

- implement feature flag code,
- change config or env parsing,
- edit Migration 020,
- add a migration file,
- apply migrations,
- execute DDL,
- connect to DB,
- run psql,
- run `npm run db:migrate`,
- change schema or indexes,
- change backend service / controller / repository runtime,
- change API,
- change Admin UI,
- change smoke or browser smoke,
- start survey sending, notification sending, LINE / APP / SMS / email push, outbox worker, delivery resolver, response intake, webhook, template seed, survey content seed, survey link generation, dashboard, manual override, or AI runtime.

## Source Review Summary

Reviewed:

- `docs/task-136-migration-020-no-apply-path-continuation-survey-runtime-design-backlog.md`
- `docs/task-135-migration-020-local-only-dry-run-authorization-follow-up-no-apply.md`
- `docs/task-134-migration-020-local-only-dry-run-authorization-response-review-no-apply.md`
- `docs/task-130-migration-020-local-only-dry-run-planning-no-shared-apply.md`
- `docs/task-129-migration-020-static-sql-re-review-no-apply.md`
- `docs/task-120-survey-roadmap-freeze-implementation-readiness-gate.md`
- `docs/task-110-post-completion-survey-trigger-first-transition-design.md`
- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `src/services/FieldServiceReportService.js` read-only context from Task136
- `package.json`

## Feature Flag Taxonomy

The following names are proposals only. Task137 does not add them to code or environment parsing.

| Flag | Default | Purpose | Requires | Explicitly does not enable |
| --- | --- | --- | --- | --- |
| `SURVEY_RUNTIME_ENABLED` | `false` | Master survey runtime gate. | Explicit runtime approval. | Migration apply, writes, resolver, worker, sending, Admin UI, AI. |
| `SURVEY_COMPLETION_HOOK_ENABLED` | `false` | Allows completion flow to consider future survey first-transition path. | `SURVEY_RUNTIME_ENABLED=true`. | Intent/outbox write by itself. |
| `SURVEY_INTENT_WRITE_ENABLED` | `false` | Allows future write to `survey_intents`. | Migration 020 applied, runtime write approval, runtime flag, completion hook flag. | Sending, resolver, worker, backfill. |
| `SURVEY_OUTBOX_WRITE_ENABLED` | `false` | Allows future write to `event_outbox`. | Migration 020 applied, intent write flag, approved atomic/recovery design. | Worker processing or provider delivery. |
| `SURVEY_OUTBOX_WORKER_ENABLED` | `false` | Allows worker to process outbox records. | Runtime flag, outbox write/read policy, explicit worker approval. | Sending unless sending flags are also enabled. |
| `SURVEY_DELIVERY_RESOLVER_ENABLED` | `false` | Allows delivery resolver to evaluate existing intents. | Runtime flag, resolver policy approval. | First-transition intent creation, Case/report mutation, sending. |
| `SURVEY_DELIVERY_SENDING_ENABLED` | `false` | Global outbound sending gate. | Runtime flag, delivery policy approval, explicit sending approval. | Channel-specific sending unless each channel is enabled. |
| `SURVEY_CHANNEL_LINE_ENABLED` | `false` | Allows LINE as a delivery channel candidate. | Sending master flag, LINE policy approval. | Core completion LINE hard-code or raw LINE id logging. |
| `SURVEY_CHANNEL_APP_ENABLED` | `false` | Allows own APP as a delivery channel candidate. | Sending master flag, APP policy approval. | LINE fallback or automatic app push without resolver approval. |
| `SURVEY_CHANNEL_SMS_ENABLED` | `false` | Allows SMS as a delivery channel candidate. | Sending master flag, SMS policy approval. | Email/LINE/APP sending. |
| `SURVEY_CHANNEL_EMAIL_ENABLED` | `false` | Allows email as a delivery channel candidate. | Sending master flag, email policy approval. | SMS/LINE/APP sending. |
| `SURVEY_CHANNEL_MANUAL_FOLLOW_UP_ENABLED` | `false` | Allows manual follow-up queue visibility, not automatic outbound. | Manual follow-up policy. | Manual survey send/resend/override by default. |
| `SURVEY_BACKFILL_ENABLED` | `false` | Allows future historical backfill path. | Separate backfill task and product policy. | Sending, reinterpretation of finalAppointmentId, migration apply. |
| `SURVEY_ADMIN_VISIBILITY_ENABLED` | `false` | Allows future read-only Admin visibility. | Admin visibility approval and permission design. | Send/resend/trigger/override. |
| `SURVEY_RESPONSE_INTAKE_ENABLED` | `false` | Allows future survey response intake endpoint/webhook. | Response ownership and privacy design. | Case/report automatic mutation. |
| `SURVEY_AI_ADVISORY_ENABLED` | `false` | Allows future AI summary/risk advisory. | AI advisory policy and redaction design. | Auto decision, sending, status mutation. |

## Kill Switch Hierarchy

Principles:

1. Master off disables all survey runtime behavior.
2. Sending off disables all channel outbound even if resolver is on.
3. Worker off prevents outbox processing even if outbox rows exist.
4. Resolver off prevents channel evaluation even if intents exist.
5. Backfill off prevents historical survey creation regardless of other flags.
6. AI off prevents model calls and AI summaries regardless of Admin visibility.
7. Channel-specific off prevents only that channel.
8. No flag may override the repeat completion conflict guard.
9. No flag may allow a manual finalAppointmentId picker.
10. No flag may hard-code LINE into completion core.

## Dependency Matrix

| Flag | Default | Requires | Enables | Explicitly does not enable | Fail-closed behavior | Requires migration applied? | Requires runtime approval? | Requires delivery approval? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `SURVEY_RUNTIME_ENABLED` | false | Explicit runtime approval | Survey runtime evaluation | Writes / resolver / worker / sending | Treat missing/invalid as false | No | Yes | No |
| `SURVEY_COMPLETION_HOOK_ENABLED` | false | Runtime flag | Hook evaluation | DB writes | Skip survey path | No | Yes | No |
| `SURVEY_INTENT_WRITE_ENABLED` | false | Runtime + hook + migration | Intent insert path | Outbox/sending/backfill | No intent write | Yes | Yes | No |
| `SURVEY_OUTBOX_WRITE_ENABLED` | false | Intent write + migration | Outbox insert path | Worker/sending | No outbox write | Yes | Yes | No |
| `SURVEY_OUTBOX_WORKER_ENABLED` | false | Runtime + worker approval | Outbox processing | Provider delivery | Worker does not start/process | Yes for real records | Yes | No |
| `SURVEY_DELIVERY_RESOLVER_ENABLED` | false | Runtime + resolver policy | Channel eligibility evaluation | Intent creation / sending | Resolver does not run | Yes for live intents | Yes | No |
| `SURVEY_DELIVERY_SENDING_ENABLED` | false | Runtime + delivery policy | Outbound sending gate | Any specific channel alone | No outbound | Yes for live sends | Yes | Yes |
| Channel-specific flags | false | Sending master + channel policy | One channel candidate | Other channels | Channel skipped | Depends on channel/runtime | Yes | Yes |
| `SURVEY_BACKFILL_ENABLED` | false | Separate backfill approval | Historical backfill path | Sending by itself | No backfill | Yes | Yes | Possibly |
| `SURVEY_ADMIN_VISIBILITY_ENABLED` | false | Admin permission design | Read-only UI | Send/resend/override | UI remains hidden | Yes for live data | Yes | No |
| `SURVEY_RESPONSE_INTAKE_ENABLED` | false | Response design | Response endpoint/intake | Case/report mutation | Intake unavailable | Future schema likely | Yes | Depends |
| `SURVEY_AI_ADVISORY_ENABLED` | false | AI policy + redaction | AI advisory | Auto decision / mutation / sending | AI unavailable | Depends on data | Yes | No |

## Enforcement Point Design

Future runtime should check flags at these points. Task137 does not implement these checks.

1. `FieldServiceReportService` completion flow:
   - before survey intent / outbox write path,
   - after completion validation and finalAppointmentId resolution,
   - with repeat completion guard still before survey side effects,
   - no survey writes if flags are disabled.
2. SurveyIntent service / repository:
   - before insert,
   - enforce organization-scoped idempotency,
   - enforce safe payload allow-list.
3. EventOutbox service / repository:
   - before insert,
   - enforce canonical event name,
   - enforce safe payload allow-list.
4. Outbox worker startup:
   - require worker flag and runtime flag,
   - no sending unless sending flag and channel flag are enabled.
5. Delivery resolver:
   - require resolver flag,
   - must not create intent,
   - must not mutate Case, report, appointment, or finalAppointmentId.
6. Channel adapter sending:
   - require sending master flag,
   - require channel-specific flag,
   - require opt-out, contact eligibility, suppression, and channel-binding policy,
   - no raw channel id in logs.
7. Admin survey visibility:
   - require Admin visibility flag,
   - read-only only,
   - no manual send / resend / override.
8. Response intake:
   - require response intake flag,
   - no automatic Case/report mutation.
9. AI advisory:
   - require AI advisory flag,
   - advisory only,
   - no auto decision.

## Default State And Environment Policy

1. All survey runtime flags default false.
2. Migration apply does not enable flags.
3. Local dry-run success does not enable flags.
4. Shared apply, if later approved, does not enable sending.
5. Production/shared runtime flags must remain disabled until explicit task approval.
6. Test/local flags may be enabled only in a controlled future runtime test task.
7. No flag value should be logged with secrets.
8. No environment variable value should be printed.
9. Missing flag is false.
10. Unrecognized flag value fails closed as false.

Recommended conservative initial source / precedence:

1. Environment/config only.
2. No Admin UI flag control initially.
3. Database feature flags deferred.
4. Admin cannot enable sending.
5. Startup may log safe boolean summaries only, never env values.

## Runtime Write Gates

Future survey intent/outbox write path may run only if all are true:

1. Migration 020 has been applied in the target environment.
2. `SURVEY_RUNTIME_ENABLED=true`.
3. `SURVEY_COMPLETION_HOOK_ENABLED=true`.
4. `SURVEY_INTENT_WRITE_ENABLED=true`.
5. `SURVEY_OUTBOX_WRITE_ENABLED=true` if outbox write is required.
6. Completion is the first successful transition.
7. Repeat completion guard has passed.
8. finalAppointmentId is resolved and persisted, or legacy null policy allows.
9. Completion is not rejected.
10. The path is not historical backfill.
11. Payload allow-list passes.
12. Strict atomic or approved recovery model is active.
13. No sending is triggered by the write path.

## Sending Gates

Future outbound sending may happen only if all are true:

1. Survey intent exists.
2. Event outbox / resolver flow is approved.
3. `SURVEY_RUNTIME_ENABLED=true`.
4. `SURVEY_OUTBOX_WORKER_ENABLED=true` if worker is involved.
5. `SURVEY_DELIVERY_RESOLVER_ENABLED=true`.
6. `SURVEY_DELIVERY_SENDING_ENABLED=true`.
7. Specific channel flag is enabled.
8. Opt-out check passed.
9. Contact target policy passed.
10. Suppression policy passed.
11. Channel binding is valid.
12. Expiration window is valid.
13. Smoke / internal / test suppression does not block.
14. No raw sensitive data appears in logs.
15. Provider credentials safety is approved.
16. Sending is explicitly approved by a later task.

## Backfill Gate

Backfill is a separate high-risk path:

1. `SURVEY_BACKFILL_ENABLED` defaults false.
2. No historical backfill in Migration 020.
3. No historical backfill in normal runtime write path.
4. Backfill requires a separate task.
5. Backfill requires product policy.
6. Backfill must be no-send or suppressed/internal-only unless explicitly approved.
7. Backfill must not reinterpret finalAppointmentId.
8. Backfill must not create duplicate formal Field Service Reports.
9. Backfill must not include smoke/internal/test cases in real outbound.

## Observability / Safe Logging Design

Safe future metrics:

- runtime enabled / disabled summary count,
- intent write attempts blocked by flag,
- outbox write attempts blocked by flag,
- resolver attempts blocked by flag,
- sending attempts blocked by flag,
- backfill attempts blocked by flag.

Safe future logs:

- flag-disabled reason code,
- component name,
- non-sensitive state summary,
- no raw contacts or channel labels.

Forbidden logs:

- `DATABASE_URL`,
- password / token / secret,
- customer mobile / phone / tel,
- raw LINE user id,
- full payload / raw payload,
- provider payload,
- full feedback text,
- full customer / appointment / report object.

Task137 does not implement metrics or logs.

## Failure Modes

| Failure mode | Expected behavior |
| --- | --- |
| Migration not applied but write flag on | Fail safe; no survey write; no completion corruption; no sending. |
| Runtime flag off | No survey writes; completion still works. |
| Intent write enabled but outbox write disabled | Prefer fail closed / no write until both are explicitly designed. |
| Outbox worker enabled but resolver disabled | Worker must not send. |
| Resolver enabled but sending disabled | Resolver may only evaluate safe state if future design allows; no outbound. |
| Channel flag enabled but master sending disabled | No outbound. |
| AI flag enabled | Advisory only; no auto decision. |
| Backfill flag accidentally true in shared runtime | Require additional hard guard and explicit task approval; fail closed otherwise. |
| Invalid flag value | False / fail closed. |
| Missing flag | False. |

## Remaining Blockers

Before feature flags can be implemented:

1. Migration 020 apply path must be resolved for target runtime.
2. Runtime flag source must be chosen.
3. Config/env parser change must be explicitly approved.
4. Survey write path contract must be finalized.
5. Transaction boundary must be finalized.
6. Payload allow-list must be finalized.
7. Runtime tests must be planned.
8. No-send smoke plan must be approved.

Before sending:

1. Resolver policy.
2. Channel target policy.
3. Opt-out / contact eligibility / suppression policy.
4. Provider credential safety.
5. Explicit delivery approval.

## Final Recommendation

Use a conservative disabled-by-default hierarchy:

- master runtime flag first,
- completion hook and write flags second,
- resolver / worker separate,
- sending master separate,
- channel-specific flags separate,
- backfill separate and off,
- Admin visibility read-only and off,
- AI advisory separate and off.

Task138 should continue with docs-only survey runtime write-path contract design.

## Non-goals

Task137 does not:

- implement feature flags,
- change config or env parsing,
- modify migration files,
- add migration files,
- apply migrations,
- execute DDL,
- connect to DB,
- run psql,
- run `npm run db:migrate`,
- modify schema or indexes,
- modify backend runtime,
- modify API,
- modify Admin UI,
- modify smoke scripts,
- implement survey sending,
- implement notification sending,
- implement LINE / APP / SMS / email sending,
- implement delivery resolver runtime,
- implement outbox worker,
- implement response intake,
- implement webhook intake,
- seed notification templates or survey content,
- generate survey links or tokens,
- add Admin dashboard / manual send / resend / override,
- add manual finalAppointmentId picker,
- add AI runtime / model call / prompt pipeline,
- change repeat completion conflict guard,
- change finalAppointmentId inference ordering,
- turn survey into appointment-level formal result,
- allow appointment to create multiple formal Field Service Reports,
- hard-code LINE into completion core / survey trigger / intent / outbox,
- modify Task087 inventory guide,
- expand inventory docs,
- perform destructive cleanup,
- mutate shared runtime,
- print sensitive values.

## Verification Summary

Task137 verification should confirm:

- `npm run check` passes.
- `npm run admin:check` passes if executed.
- `git diff --check` passes.
- `npm run check` does not run migrations.
- `npm run db:migrate` remains separate and was not executed.
- No psql command was executed.
- This document contains no executable DB command packet.
- This document contains no runtime implementation instruction.
- This document contains no actual `DATABASE_URL` value, password, token, secret, customer mobile, raw LINE user id, LINE channel secret, LINE access token, full payload, raw payload, or production data.
- This task made no code, config, API, Admin, or smoke changes.
- Feature flags are documented as proposal only.
