# Task 121 - Survey Intent / Event Outbox Migration 020 Proposal Review / No-Apply Gate

## Executive Summary

Task 121 reviews a future Migration 020 proposal. It does not create, apply, or approve Migration 020 for runtime use.

All SQL-like blocks in this file are pseudo-DDL only. They are not migration files, are not validated as executable DDL, and must not be copied into `migrations/` or executed.

Task 121 is proposal-review only:

- no migration file created,
- no DDL executed,
- no schema or index change,
- no runtime behavior change,
- no API change,
- no Admin UI change,
- no smoke change,
- no survey sending,
- no LINE / APP / SMS / email delivery,
- no AI automatic decision,
- no inventory docs expansion.

Conclusion: Migration 020 is not apply-ready. This task only records candidate scope, draft table contracts, no-apply gates, and unresolved blockers.

## Candidate Migration 020 Scope

Candidate future Migration 020 may include:

1. `survey_intents`
2. `event_outbox`

Explicitly excluded:

- survey response table,
- delivery attempt table,
- delivery resolver runtime,
- LINE push,
- APP push,
- SMS / email sending,
- notification template seed,
- survey content seed,
- response intake endpoint,
- webhook intake,
- Admin dashboard,
- AI prompt / model pipeline,
- reverse LINE binding implementation,
- opt-out schema,
- customer contact schema,
- billing / refund / penalty workflow,
- inventory docs.

## Candidate `survey_intents` Table

This is draft / non-applied pseudo-DDL. Do not execute. Do not copy into migrations. It has not been checked against exact migrations 001-019 conventions and remains subject to Task 122 draft DDL risk review.

```sql
-- PSEUDO-DDL ONLY
-- DO NOT COPY INTO MIGRATIONS
-- DO NOT EXECUTE
CREATE TABLE survey_intents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    case_id uuid NOT NULL REFERENCES cases(id),
    service_report_id uuid NOT NULL REFERENCES field_service_reports(id),
    final_appointment_id uuid REFERENCES appointments(id),
    trigger_event_type text NOT NULL,
    trigger_event_version integer NOT NULL DEFAULT 1,
    idempotency_key text NOT NULL,
    intent_status text NOT NULL DEFAULT 'pending_policy',
    channel_binding_state text NOT NULL DEFAULT 'unknown',
    contact_eligibility_state text NOT NULL DEFAULT 'pending_policy',
    suppression_reason_code text,
    suppression_detail_safe text,
    completed_at timestamptz NOT NULL,
    survey_policy_version integer,
    eligibility_policy_version integer,
    source text NOT NULL DEFAULT 'backend',
    safe_context_summary jsonb,
    actor_type text,
    actor_ref uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
```

Candidate uniqueness:

```sql
-- PSEUDO-DDL ONLY
-- DO NOT COPY INTO MIGRATIONS
-- DO NOT EXECUTE
CREATE UNIQUE INDEX idx_survey_intents_org_idempotency_unique
    ON survey_intents(organization_id, idempotency_key);

CREATE UNIQUE INDEX idx_survey_intents_org_case_report_unique
    ON survey_intents(organization_id, case_id, service_report_id);
```

Review decisions:

- `final_appointment_id` nullable does not mean legacy no-appointment Cases are surveyable by default.
- Legacy no-appointment survey remains disabled by default unless explicit product policy enables it.
- One Case / Service Report first completion should produce at most one lifetime survey intent.
- Idempotency key: `survey:first-completion:case:<caseId>:report:<serviceReportId>`.
- Idempotency key must not include `finalAppointmentId`, `completedAt`, channel, raw customer identity, actor identity, or delivery attempt id.
- Unique constraints should be organization-scoped.
- Soft delete must not bypass first-completion idempotency.
- `survey_intents` stores intent lifecycle, not provider delivery attempt lifecycle.
- `case_id`, `service_report_id`, and `final_appointment_id` must belong to the same organization; `final_appointment_id` must also belong to the same Case context if future runtime enforces final appointment binding.
- Status field implementation remains open: text + CHECK constraint, DB enum, or lookup table must be decided in Task 122 or later.
- `safe_context_summary` is allow-list JSON only, not a free-form summary field.
- Actor references are optional and must not contain operator email, name, phone, LINE id, or personal identity.

`survey_intents` must not store:

- customer mobile / phone / tel,
- raw LINE user id,
- APP device token,
- provider raw payload,
- full customer payload,
- full Case payload,
- full report payload,
- full appointment payload,
- credentials,
- operator personal identity.

## Candidate `event_outbox` Table

This is draft / non-applied pseudo-DDL. Do not execute. Do not copy into migrations. It has not been checked against exact migrations 001-019 conventions and remains subject to Task 122 draft DDL risk review.

```sql
-- PSEUDO-DDL ONLY
-- DO NOT COPY INTO MIGRATIONS
-- DO NOT EXECUTE
CREATE TABLE event_outbox (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    event_type text NOT NULL,
    event_version integer NOT NULL DEFAULT 1,
    aggregate_type text NOT NULL,
    aggregate_id uuid NOT NULL,
    idempotency_key text NOT NULL,
    payload jsonb NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    available_at timestamptz NOT NULL DEFAULT now(),
    occurred_at timestamptz NOT NULL,
    locked_at timestamptz,
    lock_expires_at timestamptz,
    locked_by text,
    attempts integer NOT NULL DEFAULT 0,
    max_attempts integer,
    last_error text,
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
```

Candidate uniqueness:

```sql
-- PSEUDO-DDL ONLY
-- DO NOT COPY INTO MIGRATIONS
-- DO NOT EXECUTE
CREATE UNIQUE INDEX idx_event_outbox_org_event_idempotency_unique
    ON event_outbox(organization_id, event_type, idempotency_key);
```

Candidate ready index:

```sql
-- PSEUDO-DDL ONLY
-- DO NOT COPY INTO MIGRATIONS
-- DO NOT EXECUTE
CREATE INDEX idx_event_outbox_org_ready
    ON event_outbox(organization_id, status, available_at, created_at)
    WHERE status IN ('pending', 'failed');
```

Review decisions:

- Expected event type: `case.service_completion.first_transitioned`.
- Recommended aggregate: `aggregate_type = 'case'`, `aggregate_id = case_id`.
- Payload may include `surveyIntentId`, `caseId`, `serviceReportId`, nullable `finalAppointmentId`, `completedAt`, and safe enum summaries.
- Unique key should include organization, event type, and idempotency key.
- Worker design should include `locked_at`, `lock_expires_at`, `locked_by`, `attempts`, redacted `last_error`, terminal failed / dead state, and processed event retention.
- `event_outbox` is async handoff only. It does not send messages and does not store provider delivery results.
- Future DDL should define bounded `last_error` length and payload size policy.
- Event outbox status lifecycle naming remains draft.
- Whether `event_outbox` should be a generic application outbox or survey-first outbox remains an open question.

Payload must not include customer mobile, raw LINE user id, device token, provider raw payload, full customer / Case / report / appointment payload, credentials, or operator personal identity.

## Idempotency And Uniqueness Review

Required key:

```text
survey:first-completion:case:<caseId>:report:<serviceReportId>
```

Rules:

- organization-scoped uniqueness is required,
- idempotency is lifetime-scoped,
- soft delete must not allow recreation,
- conflict should fail safe,
- `finalAppointmentId` and `completedAt` remain context, not identity.

## Transaction And Concurrency Review

Future implementation must choose one option.

### Option A - Strict Atomic Completion + Intent + Outbox

- Report / Case completion and survey intent / outbox insert occur in same transaction.
- Intent / outbox insert failure may roll back completion.
- This gives the simplest first-transition correctness.
- It may affect field operations if the survey path fails.

### Option B - Completion-first Recovery

- Completion succeeds first.
- Missing survey intent / outbox is recovered by reconciliation.
- This avoids blocking completion on survey path.
- It requires missing-intent detector, safe backfill, no duplicate idempotency, and no real outbound until policy gates pass.

Task 121 recommendation:

- Prefer Option A for correctness if product accepts the operational tradeoff.
- If product cannot accept completion rollback due to survey path failure, Option B requires a separate recovery design before runtime.

Concurrency requirements:

- first-transition detection is atomic,
- repeat completion conflict remains before side effects,
- runtime uses row lock / conditional update / transaction isolation or equivalent,
- unique idempotency is final safety net,
- concurrent completion cannot create duplicate survey intents or outbox events,
- delivery retry cannot create new first-transition event,
- binding event replay cannot create duplicate delivery jobs.

## Policy Readiness Blockers

Migration proposal remains blocked by:

- survey feature default disabled,
- surveyable Case types,
- legacy no-appointment policy,
- smoke / internal / test suppression,
- opt-out policy,
- contact target policy,
- expiration / delivery window,
- resend / reminder policy,
- no-channel / pending-channel policy,
- reverse LINE / APP binding policy,
- manual follow-up policy,
- high-risk complaint policy,
- survey policy versioning.

## Channel Abstraction Review

- Migration proposal must not hard-code LINE into survey intent or outbox.
- Raw LINE user id remains only in channel identity layer.
- LINE / APP / SMS / email / manual follow-up are future resolver / adapter concerns.
- Existing Case reverse LINE binding remains future-compatible.
- No channel binding at completion does not automatically mean suppressed unless policy says so.
- `pending_channel` must be expiration-bounded if used.

## Notification Logs Boundary

`notification_logs` are provider delivery attempt / result evidence.

They are not:

- first-transition source of truth,
- survey intent source of truth,
- idempotency source,
- completion event storage.

Lack of notification logs does not imply lack of survey intent.

## Historical Backfill Review

Default recommendation:

- no automatic historical survey intent backfill,
- no real outbound survey for historical completed Cases,
- backfill requires separate explicit task,
- backfill must be suppressed / no-send unless product policy approves,
- backfill must not reinterpret historical `finalAppointmentId`,
- backfill must not create duplicate formal reports,
- backfill must not send survey to smoke / internal / test Cases.

## Privacy / Redaction / Retention Review

Required future checklist:

- safe payload allow-list,
- no raw provider payload,
- no full request / response body,
- no customer mobile,
- no raw LINE user id,
- no device token,
- no full customer / Case / report / appointment payload,
- no operator personal identity,
- redacted and bounded `last_error`,
- retention / archival policy,
- export policy,
- audit access policy.

Feedback text and AI summary remain sensitive, even though they are out of candidate Migration 020 scope.

## Rollout / Rollback / Observability Review

Future rollout must include:

- feature flag default disabled,
- migration can apply without enabling sending,
- no runtime path uses these tables until explicit runtime task,
- no shared runtime destructive rollback,
- safe metrics only,
- duplicate intent / outbox failure future metric,
- no sensitive logs,
- dry-run or non-sending mode if runtime is later introduced.

## No-apply Gate Matrix

| Area | Current proposal status | Required decision before applying migration | Blocking severity | Required before | Risk if unresolved | Owner / next task | Apply gate status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Product policy | Drafted | Enablement, surveyable cases, legacy policy | blocker | migration apply | unwanted surveys | Product | blocked |
| Suppression | Drafted | smoke/internal/test, opt-out, complaint policy | blocker | migration apply/runtime | outbound risk | Product/Ops | blocked |
| Contact target | Open | who receives survey | blocker | runtime delivery | wrong recipient | Product | blocked |
| Transaction | Options defined | strict atomic vs recovery | blocker | migration file/runtime | partial side effects | Architecture | blocked |
| Idempotency | Drafted | lifetime uniqueness final approval | blocker | migration file | duplicate intent | Architecture | blocked |
| Outbox ops | Drafted | lock/retry/retention | blocker | migration file/runtime | stuck worker / duplicate attempts | Architecture/Ops | blocked |
| Channel resolver | Drafted | priority, no-channel, reverse binding | blocker | runtime delivery | delivery confusion | Product/Architecture | blocked |
| Privacy | Drafted | retention/export/redaction | blocker | migration apply/runtime | sensitive exposure | Security/Ops | blocked |
| Rollout | Drafted | feature flag / rollback | blocker | migration apply | unsafe release | Engineering/Ops | blocked |

## Open Questions

1. Strict atomic or completion-first recovery?
2. Should historical completed Cases ever be backfilled?
3. Should legacy no-appointment Cases ever be surveyable?
4. Smoke/internal/test: no intent or suppressed internal-only intent?
5. Who is the contact target?
6. How long can `pending_channel` wait?
7. Can reverse binding make pending intent deliverable?
8. What opt-out granularity is required?
9. What retention / archival / export policy applies?
10. Is actor attribution needed in survey intent?
11. How long are processed outbox rows retained?
12. What is max event payload size?
13. What is max `last_error` length and redaction policy?
14. Should `event_outbox` be a generic application outbox or survey-first outbox for Migration 020?
15. Should status fields use text + CHECK constraint, DB enum, or lookup table?

## Recommendation

Migration 020 is proposal-reviewed but not apply-ready.

Task 121 concludes:

- ready for draft DDL discussion,
- not ready to create migration file,
- not ready to apply migration,
- not ready for runtime use.

## ChatGPT Design Review Integration

The project ChatGPT branch reviewed Task 121 as part of the Codex / ChatGPT workflow.

Review outcome:

- Task 121 does not violate the no-apply gate or docs-only boundary.
- Pseudo-DDL warnings were strengthened so SQL-like blocks cannot be mistaken for executable migration.
- Same-organization consistency, status field type choice, allow-list JSON safety, actor safe refs, payload size, and bounded `last_error` were added as Task 122 review risks.
- The no-apply matrix now includes blocking severity and required-before columns.
- The outbox generic-vs-survey-first scope remains an open question for Task 122.

## Non-goals

Task 121 does not:

- create migration 020,
- apply migration,
- change schema,
- change runtime,
- change API,
- change Admin UI,
- change smoke,
- send survey,
- send LINE / APP / SMS / email,
- implement outbox worker,
- implement resolver,
- implement response intake,
- implement AI pipeline,
- modify inventory docs.
