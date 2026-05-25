# Task 136 - Migration 020 No-Apply Path Continuation / Survey Runtime Design Backlog

## Background

Task136 continues the no-apply path by organizing future survey runtime design backlog. It does not execute DDL, connect to DB, apply migration, or implement runtime behavior.

Task135 confirmed that no Option 2 authorization has been provided. Migration 020 local-only dry-run remains blocked, and shared apply remains blocked. Therefore Task136 does not proceed to local-only dry-run execution.

## No-apply / No-DDL / No-DB Statement

Task136 does not:

- edit Migration 020,
- add a migration file,
- apply Migration 020,
- execute DDL,
- connect to any DB,
- run psql,
- run `npm run db:migrate`,
- inspect live schema,
- alter actual schema or indexes,
- change runtime behavior,
- change backend service / controller / repository code,
- change API,
- change Admin UI,
- change smoke or browser smoke,
- start survey sending, notification sending, LINE / APP / SMS / email push, outbox worker, delivery resolver, response intake, webhook, template seed, survey content seed, survey link generation, dashboard, manual override, or AI runtime.

## Source Review Summary

Reviewed:

- `docs/task-135-migration-020-local-only-dry-run-authorization-follow-up-no-apply.md`
- `docs/task-134-migration-020-local-only-dry-run-authorization-response-review-no-apply.md`
- `docs/task-133-migration-020-local-only-dry-run-authorization-handoff-no-apply.md`
- `docs/task-132-migration-020-local-only-dry-run-preflight-checklist-finalization-no-apply.md`
- `docs/task-131-migration-020-local-only-dry-run-guard-closure-no-apply.md`
- `docs/task-130-migration-020-local-only-dry-run-planning-no-shared-apply.md`
- `docs/task-129-migration-020-static-sql-re-review-no-apply.md`
- `docs/task-120-survey-roadmap-freeze-implementation-readiness-gate.md`
- `docs/task-110-post-completion-survey-trigger-first-transition-design.md`
- `docs/task-105-backend-owned-final-appointment-inference-api-contract.md`
- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `src/services/FieldServiceReportService.js` read-only review
- `package.json`

Current code read-only observation:

- `FieldServiceReportService.completeServiceReport` rejects already-completed reports before finalAppointmentId resolution, Case update, timeline creation, or audit creation.
- No survey runtime write path exists in the reviewed completion flow.
- No current survey sending, outbox worker, delivery resolver, or survey response intake is tied to service report completion.

## Current No-apply Path Status

1. Migration 020 file exists.
2. Migration 020 static SQL review passed after Task128 patch and Task129 re-review.
3. Migration 020 has not been applied.
4. Migration 020 local-only dry-run is blocked due to missing authorization.
5. Migration 020 shared apply remains blocked.
6. Runtime writes remain blocked.
7. Survey sending remains blocked.
8. Outbox worker remains blocked.
9. Delivery resolver remains blocked.
10. Admin survey UI remains blocked.
11. AI runtime remains blocked.
12. No-apply design work may continue only as documentation / backlog planning.

## Survey Runtime Backlog Categories

### 1. Completion First-transition Write Path

Future runtime may write `survey_intents` and `event_outbox` during the first successful Case service completion. This must wait until Migration 020 is applied in the target environment and runtime write approval is explicit.

Requirements:

- strict atomic transaction or explicitly chosen recovery model,
- no survey on repeat completion conflict,
- no survey on rejected completion,
- no survey on no eligible completed visit,
- no survey on report edit or correction flow,
- no survey per appointment.

### 2. SurveyIntent Repository / Service Layer

Future repository / service should insert and query survey intents without storing raw contact, channel, provider, credential, or full payload data.

Requirements:

- organization-scoped idempotency,
- same-org / same-Case validation,
- completed report persisted `finalAppointmentId` only,
- no mutation of Case, report, or appointment completion facts.

### 3. EventOutbox Repository / Service Layer

Future outbox write path should record channel-agnostic domain events only.

Requirements:

- no worker in the first repository task,
- no provider delivery result fields,
- no raw provider payload,
- no sending.

### 4. Runtime Feature Flag / Kill Switch

Future runtime must default disabled and use independent controls for:

- survey intent writes,
- outbox writes,
- delivery resolver,
- sending,
- historical backfill,
- AI advisory.

Feature flag design can proceed as docs-only before migration apply. Implementation must wait for explicit runtime approval.

### 5. Transaction Boundary

Strict atomic completion + survey intent + outbox write is preferred. If completion-first recovery is ever chosen, it needs a separate recovery / detector / dedupe design and must still avoid real outbound delivery before all policy gates close.

### 6. Payload Allow-list / Redaction

Future runtime needs allow-lists for `safe_context_summary` and outbox payload.

Forbidden payload content:

- customer mobile / phone / tel,
- raw LINE user id,
- token / secret / password,
- provider credential,
- full customer / report / appointment object,
- full request / response / raw payload.

### 7. Runtime Guard Tests / Smoke Plan

Future tests should verify:

- exactly one survey intent on first successful completion,
- no survey on repeat completion conflict,
- no survey on rejected completion,
- no survey on no eligible completed visit,
- no survey if feature flag disabled,
- no sensitive payload in intent or outbox.

Task136 does not add tests or smoke changes.

### 8. Delivery Resolver Backlog

Future resolver consumes existing survey intent / outbox state. It must not create first-transition intent and must not send until delivery gates close.

Channel binding and reverse LINE binding policy remain future design / implementation tasks.

### 9. Outbox Worker Backlog

Future worker processes `event_outbox` with lock / retry / dead status rules. It must be disabled by default and must not be implemented in Task136.

### 10. Admin Visibility Backlog

Future Admin UI should be read-only first:

- no manual send,
- no resend,
- no override,
- no manual finalAppointmentId picker,
- no hidden delivery control.

### 11. Survey Response Backlog

Future response intake belongs to a separate task and should keep feedback Case-level. Task136 does not add response schema, endpoint, webhook, or UI.

### 12. AI Advisory Backlog

Future AI may summarize feedback or flag risk, but must remain advisory:

- no model calls in Task136,
- no AI auto-send,
- no AI auto-close complaint,
- no AI auto-score that changes formal workflow.

## Runtime Dependency Ordering

| Step | Work item | Can be docs-only now? | Requires Migration 020 applied? | Requires runtime approval? | Requires sending approval? | Requires Admin approval? | Requires AI approval? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Migration 020 local-only dry-run execution | No, blocked by authorization | No for local dry-run target, but requires approved disposable target | No runtime approval | No | No | No |
| 2 | Migration 020 shared apply readiness review | Yes | No | No | No | No | No |
| 3 | Migration 020 shared apply | No | N/A | No runtime approval, but explicit apply approval required | No | No | No |
| 4 | Runtime feature flag / kill switch design | Yes | No | Implementation requires approval | No | No | No |
| 5 | Survey runtime write-path contract design | Yes | No | Implementation requires approval | No | No | No |
| 6 | SurveyIntent repository contract design | Yes | No | Implementation requires approval | No | No | No |
| 7 | EventOutbox repository contract design | Yes | No | Implementation requires approval | No | No | No |
| 8 | Completion first-transition write implementation behind disabled flag | No | Yes | Yes | No | No | No |
| 9 | Targeted backend tests | Design now; implementation later | Usually yes for runtime integration | Yes if code changes | No | No | No |
| 10 | No-send runtime smoke | Design now; implementation later | Yes | Yes | No | No | No |
| 11 | Delivery resolver design / disabled implementation | Design now | Yes before implementation | Yes | No for disabled resolver | No | No |
| 12 | Outbox worker design / disabled implementation | Design now | Yes before implementation | Yes | No for disabled worker | No | No |
| 13 | Channel adapter design | Yes | No | Implementation requires approval | Sending later requires approval | Possibly | No |
| 14 | Admin read-only visibility | Design now | Yes before live data view | Yes | No | Yes | No |
| 15 | Survey response intake | Design now | Additional schema likely | Yes | May require delivery policy | Yes | No |
| 16 | AI advisory layer | Design now | Depends on feedback/intent data | Yes | No | Yes if visible in Admin | Yes |

## Runtime Gates Before Writes

Before any runtime writes to survey tables:

1. Migration 020 applied in target environment.
2. Feature flag defaults disabled.
3. Explicit runtime write approval.
4. Strict atomic transaction decision or approved recovery model.
5. Same-organization / same-Case runtime guard design.
6. Persisted-value-only rule for `finalAppointmentId`.
7. Repeat completion conflict remains before survey side effects.
8. Rejected completion creates no survey.
9. Payload allow-list implemented.
10. `last_error` redaction policy defined.
11. No outbound sending.
12. No historical backfill.
13. No shared runtime destructive cleanup.
14. Test plan approved.
15. Rollback / disable plan approved.

## Gates Before Survey Sending

Before any real survey sending:

1. Survey intent write path stable.
2. Event outbox stable.
3. Delivery resolver policy approved.
4. Channel target policy approved.
5. Opt-out policy approved.
6. Contact eligibility policy approved.
7. No-channel / pending-channel / reverse binding policy approved.
8. Survey content and versioning approved.
9. Survey response intake approved.
10. Privacy / redaction approved.
11. Admin visibility approved.
12. Shared runtime outbound safety approved.
13. Smoke / internal / test suppression approved.
14. Explicit feature flag enablement.
15. No AI automatic decision.
16. No raw LINE id / mobile / full payload in messages or logs.
17. Provider credentials safety review.
18. Rollout / rollback plan approved.

## No-apply Backlog Matrix

| Backlog item | Description | Can be docs-only before migration apply? | Requires migration applied? | Requires runtime change? | Requires sending approval? | Primary risk | Recommended next task | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Runtime feature flag design | Define disabled-by-default controls and kill switches. | Yes | No | Implementation later | No | Hidden runtime activation | Task137 | Open |
| Survey write-path contract design | Define first-transition write contract and failure semantics. | Yes | No | Implementation later | No | Weakening completion invariants | Future | Open |
| SurveyIntent repository contract design | Define insert/query contract and idempotency rules. | Yes | No | Implementation later | No | Raw data storage or duplicate intent | Future | Open |
| EventOutbox repository contract design | Define event insert contract without worker. | Yes | No | Implementation later | No | Delivery coupling too early | Future | Open |
| Payload allow-list design | Define safe fields for intent and event payload. | Yes | No | Implementation later | No | Sensitive payload leak | Future | Open |
| Transaction boundary design | Choose strict atomic or explicit recovery model. | Yes | No | Implementation later | No | Partial completion/survey state | Future | Open |
| Backend test plan design | Plan first-transition and no-event cases. | Yes | No | Test implementation later | No | Missing idempotency coverage | Future | Open |
| No-send smoke plan design | Plan smoke that verifies no real delivery. | Yes | No | Smoke implementation later | No | Accidental outbound delivery | Future | Open |
| Delivery resolver disabled-by-default design | Define resolver states and start gates. | Yes | No | Implementation later | Later | Channel hard-code | Future | Open |
| Outbox worker disabled-by-default design | Define worker lock/retry/dead behavior. | Yes | No | Implementation later | Later | Worker starts before policy | Future | Open |
| Admin read-only visibility design | Define read-only status UI and permissions. | Yes | Usually yes for runtime data | Admin implementation later | No | Manual send/override creep | Future | Open |
| Survey response intake design | Define feedback ownership and redaction. | Yes | Likely separate schema | Runtime/API later | Depends on delivery | Raw feedback privacy | Future | Open |
| AI advisory boundary design | Define AI-only suggestions and feedback learning boundary. | Yes | Depends on data availability | AI implementation later | No | AI auto-decision creep | Future | Open |

## Task137 Recommendation

Recommended next task:

```text
Task 137 - Survey Runtime Feature Flag / Kill Switch Contract Design / No Runtime Change
```

Scope:

- docs-only,
- define future feature flags / kill switches for survey intent writes, outbox writes, resolver, sending, backfill, and AI advisory,
- no runtime implementation,
- no DB connection,
- no migration apply,
- no API / Admin / smoke changes,
- no survey sending.

Reason:

- It can safely proceed without Migration 020 apply.
- It reduces future runtime risk.
- It keeps implementation authorization separate from design backlog.

## Remaining Blockers

Before runtime implementation:

1. Migration 020 local-only dry-run approval and execution, if desired.
2. Migration 020 shared apply readiness review.
3. Explicit shared apply approval and migration apply.
4. Runtime feature flag / kill switch contract.
5. Runtime write approval.
6. Transaction boundary decision.
7. Payload allow-list.
8. Test / smoke plan.
9. No-send guarantee.
10. Rollback / disable plan.

Before sending:

1. Delivery resolver policy.
2. Channel target policy.
3. Opt-out and suppression policy.
4. Contact eligibility policy.
5. Survey content/versioning.
6. Response intake.
7. Provider credential safety.
8. Explicit sending approval.

## Final Recommendation

Continue no-apply design backlog. Do not execute Migration 020 dry-run, do not apply the migration, and do not implement survey runtime until explicit approval gates are satisfied.

Task137 should define feature flags and kill switches as documentation-only groundwork.

## Non-goals

Task136 does not:

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
- implement survey response intake,
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

Task136 verification should confirm:

- `npm run check` passes.
- `npm run admin:check` passes if executed.
- `git diff --check` passes.
- `npm run check` does not run migrations.
- `npm run db:migrate` remains separate and was not executed.
- No psql command was executed.
- This document contains no executable DB command packet.
- This document contains no instruction to use shared Zeabur.
- This document contains no actual `DATABASE_URL` value, password, token, secret, customer mobile, raw LINE user id, LINE channel secret, LINE access token, full payload, raw payload, or production data.
- This document contains no DDL execution instruction, DB connection instruction, or apply instruction except future gated work.
- All future execution references remain gated by explicit approval.
