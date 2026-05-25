# Task 124 - Survey Intent / Event Outbox Migration 020 File Authoring Plan / No Apply

## Executive Summary

Task 124 prepares a future Migration 020 file authoring plan only. It does not create a migration file, apply a migration, execute DDL, or change runtime behavior.

This document turns the Task 121 through Task 123 decisions into a concrete authoring checklist for a later migration task:

- candidate migration filename,
- migration convention summary from migrations 001-019,
- draft DDL ordering,
- candidate table definitions,
- candidate constraints and index names,
- DDL-protected invariants vs future runtime-guarded invariants,
- rollout / rollback / forward-fix plan,
- verification plan for a later no-apply migration file review.

Migration 020 is still not approved for apply. Runtime writes, survey sending, delivery resolution, Admin UI, API behavior, smoke tests, and inventory docs remain unchanged.

Note: this pre-Task128 draft used the historical event name `case.service_completed.first_transition` in candidate SQL snippets. The current canonical event name for future runtime, migration, and tests is `case.service_completion.first_transitioned`.

## Source Review Summary

Reviewed migration conventions from existing migrations:

- filenames use three-digit prefixes and descriptive snake_case names,
- `uuid PRIMARY KEY DEFAULT gen_random_uuid()` is the common id pattern,
- timestamps use `created_at timestamptz NOT NULL DEFAULT now()` and `updated_at timestamptz NOT NULL DEFAULT now()`,
- soft archival fields commonly use nullable `deleted_at`, but Task 123 recommends no normal soft-delete bypass for idempotency-bearing survey/outbox rows,
- mutable tables often define `set_<table>_updated_at()` trigger functions,
- status-like fields are usually `text` with CHECK constraints,
- JSON fields use JSONB type checks,
- indexes are named `idx_<table>_<purpose>`,
- active uniqueness often uses partial unique indexes where `deleted_at IS NULL`,
- migrations 018 and 019 use `ADD COLUMN IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` for additive changes,
- existing FKs sometimes use `ON DELETE CASCADE`, but Task 123 explicitly recommends no cascade for survey intent / outbox history.

Reviewed design documents:

- Task 121: Migration 020 proposal / no-apply gate.
- Task 122: draft DDL risk review / rollout-rollback plan.
- Task 123: policy / atomicity / retention gate closure review.
- Task 110 through Task 120: survey first-transition and roadmap freeze decisions.

## No-apply Statement

All SQL-like examples below are planning artifacts only.

They are:

- DRAFT ONLY,
- DO NOT EXECUTE,
- DO NOT COPY INTO MIGRATIONS,
- NOT VALIDATED AS EXECUTABLE DDL,
- NOT A MIGRATION FILE,
- NOT APPROVED FOR APPLY.

A future task must separately author the real migration file, run syntax checks where available, review exact names against current schema, and keep apply gated until explicitly approved.

## Candidate Migration File

Candidate filename for a future migration authoring task:

```text
020_create_survey_intents_and_event_outbox.sql
```

Filename rationale:

- follows the three-digit migration prefix convention,
- names both tables in scope,
- does not imply survey delivery, response intake, Admin UI, or runtime writes,
- makes clear this is table foundation only.

Alternative filename if the team wants the outbox to remain survey-scoped:

```text
020_create_survey_intents_and_survey_event_outbox.sql
```

Task 124 recommendation:

- use `020_create_survey_intents_and_event_outbox.sql`,
- keep `event_outbox` generic but initially limited by strict event type and payload allow-list in future runtime,
- do not create the file in Task 124.

## Draft DDL Ordering

Future Migration 020 authoring should use this order:

1. Create `survey_intents`.
2. Create `set_survey_intents_updated_at()` trigger function.
3. Create `trg_survey_intents_set_updated_at`.
4. Create `survey_intents` unique indexes and lookup indexes.
5. Create `event_outbox`.
6. Create `set_event_outbox_updated_at()` trigger function.
7. Create `trg_event_outbox_set_updated_at`.
8. Create `event_outbox` unique indexes and worker lookup indexes.

Ordering rationale:

- `event_outbox` can reference `survey_intents(id)` if the final DDL chooses a nullable `survey_intent_id`.
- Table creation should precede triggers and indexes.
- Index names should be final-reviewed before file creation.

## Draft `survey_intents` DDL Candidate

The following block is a planning artifact only.

```sql
-- DRAFT ONLY - DO NOT EXECUTE - DO NOT COPY INTO MIGRATIONS
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
    policy_status text NOT NULL DEFAULT 'pending',
    suppression_reason_code text,
    suppression_detail jsonb,
    completed_at timestamptz NOT NULL,
    policy_version text,
    resolver_version text,
    safe_context_summary jsonb,
    triggered_by_type text,
    triggered_by_user_id uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT survey_intents_trigger_event_type_check CHECK (
        trigger_event_type IN ('case.service_completed.first_transition')
    ),
    CONSTRAINT survey_intents_trigger_event_version_positive_check CHECK (
        trigger_event_version > 0
    ),
    CONSTRAINT survey_intents_idempotency_key_not_blank_check CHECK (
        length(trim(idempotency_key)) > 0
    ),
    CONSTRAINT survey_intents_intent_status_check CHECK (
        intent_status IN (
            'pending_policy',
            'channel_resolution_pending',
            'pending_channel',
            'suppressed',
            'not_deliverable',
            'ready_for_delivery',
            'expired',
            'cancelled'
        )
    ),
    CONSTRAINT survey_intents_policy_status_check CHECK (
        policy_status IN ('pending', 'eligible', 'suppressed', 'not_deliverable')
    ),
    CONSTRAINT survey_intents_suppression_detail_type_check CHECK (
        suppression_detail IS NULL OR jsonb_typeof(suppression_detail) = 'object'
    ),
    CONSTRAINT survey_intents_safe_context_summary_type_check CHECK (
        safe_context_summary IS NULL OR jsonb_typeof(safe_context_summary) = 'object'
    ),
    CONSTRAINT survey_intents_triggered_by_type_check CHECK (
        triggered_by_type IS NULL OR triggered_by_type IN ('admin', 'system', 'api')
    )
);

CREATE FUNCTION set_survey_intents_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_survey_intents_set_updated_at
BEFORE UPDATE ON survey_intents
FOR EACH ROW
EXECUTE FUNCTION set_survey_intents_updated_at();

CREATE UNIQUE INDEX idx_survey_intents_idempotency_unique
    ON survey_intents(organization_id, idempotency_key);

CREATE UNIQUE INDEX idx_survey_intents_case_report_unique
    ON survey_intents(organization_id, case_id, service_report_id);

CREATE INDEX idx_survey_intents_status_created_at
    ON survey_intents(organization_id, intent_status, created_at DESC);

CREATE INDEX idx_survey_intents_case_created_at
    ON survey_intents(organization_id, case_id, created_at DESC);

CREATE INDEX idx_survey_intents_service_report
    ON survey_intents(organization_id, service_report_id);

CREATE INDEX idx_survey_intents_final_appointment
    ON survey_intents(organization_id, final_appointment_id)
    WHERE final_appointment_id IS NOT NULL;
```

### `survey_intents` Authoring Notes

Candidate decisions:

- No `deleted_at` by default. Intent rows are idempotency-bearing records and should not be soft-deleted to permit recreation.
- `final_appointment_id` stays nullable for legacy no-appointment completion compatibility.
- Nullable `final_appointment_id` does not mean legacy no-appointment Cases are surveyable by default.
- `sent` and `answered` statuses are intentionally excluded until delivery attempts and response tables are designed.
- `safe_context_summary` is allow-list only and cannot store full Case / customer / report / appointment payloads.
- `suppression_detail` is allow-list only and cannot store contact values or raw channel identifiers.
- `policy_version` and `resolver_version` remain text candidate fields because versioning conventions are not final.
- Same-organization and same-Case consistency must be future runtime-validated even if base FKs exist.

Open authoring checks before real migration file creation:

- Confirm `organizations(id)` exists in current schema.
- Confirm FK names if the project standardizes explicit names later.
- Confirm whether `triggered_by_user_id` is needed or should be deferred.
- Confirm whether `policy_status` is useful or redundant with `intent_status`.
- Confirm whether `idx_survey_intents_final_appointment` is needed in the first migration or can be deferred.

## Draft `event_outbox` DDL Candidate

The following block is a planning artifact only.

```sql
-- DRAFT ONLY - DO NOT EXECUTE - DO NOT COPY INTO MIGRATIONS
CREATE TABLE event_outbox (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    event_type text NOT NULL,
    event_version integer NOT NULL DEFAULT 1,
    aggregate_type text NOT NULL,
    aggregate_id uuid NOT NULL,
    survey_intent_id uuid REFERENCES survey_intents(id),
    idempotency_key text NOT NULL,
    payload jsonb NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    available_at timestamptz NOT NULL DEFAULT now(),
    occurred_at timestamptz NOT NULL,
    locked_at timestamptz,
    lock_expires_at timestamptz,
    locked_by text,
    attempts integer NOT NULL DEFAULT 0,
    max_attempts integer NOT NULL DEFAULT 10,
    last_error text,
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT event_outbox_event_type_check CHECK (
        event_type IN ('case.service_completed.first_transition')
    ),
    CONSTRAINT event_outbox_event_version_positive_check CHECK (
        event_version > 0
    ),
    CONSTRAINT event_outbox_aggregate_type_check CHECK (
        aggregate_type IN ('case')
    ),
    CONSTRAINT event_outbox_idempotency_key_not_blank_check CHECK (
        length(trim(idempotency_key)) > 0
    ),
    CONSTRAINT event_outbox_payload_type_check CHECK (
        jsonb_typeof(payload) = 'object'
    ),
    CONSTRAINT event_outbox_status_check CHECK (
        status IN ('pending', 'processing', 'processed', 'failed', 'dead', 'skipped')
    ),
    CONSTRAINT event_outbox_attempts_check CHECK (
        attempts >= 0 AND max_attempts > 0 AND attempts <= max_attempts
    ),
    CONSTRAINT event_outbox_lock_check CHECK (
        (locked_at IS NULL AND lock_expires_at IS NULL AND locked_by IS NULL)
        OR (locked_at IS NOT NULL AND lock_expires_at IS NOT NULL AND locked_by IS NOT NULL)
    ),
    CONSTRAINT event_outbox_processed_status_check CHECK (
        (status = 'processed' AND processed_at IS NOT NULL)
        OR (status <> 'processed')
    ),
    CONSTRAINT event_outbox_last_error_length_check CHECK (
        last_error IS NULL OR length(last_error) <= 2000
    )
);

CREATE FUNCTION set_event_outbox_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_event_outbox_set_updated_at
BEFORE UPDATE ON event_outbox
FOR EACH ROW
EXECUTE FUNCTION set_event_outbox_updated_at();

CREATE UNIQUE INDEX idx_event_outbox_idempotency_unique
    ON event_outbox(organization_id, event_type, idempotency_key);

CREATE INDEX idx_event_outbox_ready
    ON event_outbox(organization_id, status, available_at, created_at)
    WHERE status IN ('pending', 'failed');

CREATE INDEX idx_event_outbox_aggregate
    ON event_outbox(organization_id, aggregate_type, aggregate_id, created_at DESC);

CREATE INDEX idx_event_outbox_lock_expires
    ON event_outbox(organization_id, lock_expires_at)
    WHERE lock_expires_at IS NOT NULL;

CREATE INDEX idx_event_outbox_survey_intent
    ON event_outbox(organization_id, survey_intent_id)
    WHERE survey_intent_id IS NOT NULL;
```

### `event_outbox` Authoring Notes

Candidate decisions:

- `event_outbox` is generic by table name but limited by initial `event_type` CHECK.
- `aggregate_type` is limited to `case` for the first version.
- `aggregate_id` is intentionally generic; future runtime must validate it points to a Case in the same organization.
- `survey_intent_id` is optional but recommended for first survey event traceability.
- Payload is JSONB object only and must be allow-list validated by future runtime.
- `last_error` is bounded, but runtime must redact it before persistence.
- `processed_at` is only required when status is `processed`.
- Retention and dead-letter operations remain future ops policy.

Open authoring checks before real migration file creation:

- Decide if `status = 'skipped'` should require `processed_at`.
- Decide whether `last_error` length should be 1000, 2000, or another project standard.
- Decide whether `locked_by` should have a length CHECK.
- Decide whether `event_outbox` should include `dead_at` or whether `updated_at` is enough.
- Decide whether `failed` rows should be worker-ready by `available_at`, or whether only `pending` is worker-ready and retry logic changes status back to `pending`.

## DDL-protected vs Runtime-guarded Invariants

| Invariant | DDL candidate | Future runtime guard required | Notes |
| --- | --- | --- | --- |
| One Case has one formal Field Service Report | Existing `field_service_reports` active unique index | Existing service behavior | Migration 020 must not weaken this. |
| Survey is first-transition Case-level | Unique `(organization_id, case_id, service_report_id)` and idempotency key | Completion first-transition transaction | No appointment-level formal report. |
| Repeat completion creates no duplicate | Unique idempotency keys | Existing 409 guard plus future transaction | DDL is backup, runtime remains source. |
| `finalAppointmentId` stable | Stored nullable `final_appointment_id` | Use completed report resolved value only | Do not re-infer for survey. |
| Same organization | Basic FKs only | Validate Case/report/appointment tenant consistency | Composite FK deferred. |
| Same Case final appointment | Basic FK to appointments | Validate final appointment belongs to same Case | Must use service logic. |
| No outbound by migration | None | Feature flags and no runtime writes | Inert table posture. |
| No sensitive payload | JSONB object CHECK only | Allow-list validation and redaction | DDL cannot detect all sensitive values. |
| No delivery lifecycle mixing | Status CHECK excludes sent/answered | Runtime keeps delivery attempts separate | Future delivery table needed. |
| No response lifecycle mixing | No response fields | Runtime keeps responses separate | Future response table needed. |
| No destructive cleanup | No cascade delete recommendation | Ops policy and forward-fix | Shared runtime remains protected. |

## Rollout Plan for Future Migration Authoring

Future Migration 020 file authoring should remain no-apply first:

1. Author migration file in a dedicated task.
2. Run SQL syntax / migration lint checks if project tooling exists.
3. Run `npm run check`.
4. Run sensitive scan over docs and migration.
5. Review generated migration diff manually.
6. Do not apply to shared runtime in the authoring task.
7. Add a separate migration apply task only after explicit approval.

If Migration 020 is later applied:

- tables are inert,
- feature flag remains disabled,
- no runtime writes,
- no delivery,
- no Admin behavior change,
- no historical backfill,
- schema verification is safe summary only.

## Rollback / Forward-fix Plan

Shared runtime rollback policy:

- do not casually drop `survey_intents` or `event_outbox`,
- do not delete survey/outbox rows as cleanup,
- do not treat local/test rollback as shared runtime precedent,
- prefer feature flag disable and forward-fix migrations,
- any destructive rollback must be a separate explicitly approved task.

Local/test rollback can be separately designed, but must not weaken the shared runtime policy.

## Verification Plan for Task 124

Task 124 verification is documentation-focused:

- `npm run check`
- `npm run admin:check` if project convention expects it
- `git diff --check`
- sensitive information scan over the new document

No smoke, inventory verification, shared DB verification, psql, migration apply, Admin UI tests, or runtime tests are required.

## Task 125 Recommendation

Task 125 can proceed to one of two paths:

1. **Recommended if the team wants one more no-apply DDL review:** Task 125 - Survey Migration 020 Draft DDL Convention Review / Apply Readiness Gate.
2. **Recommended if the team is ready to create a migration file but still not apply it:** Task 125 - Survey Intent / Event Outbox Migration 020 File Creation / No Apply.

Conservative recommendation:

- Task 125 should do a final convention / apply-readiness review before creating the migration file, because Task 124 still contains draft SQL that must not be copied blindly.

## Non-goals

Task 124 does not:

- create Migration 020,
- apply migration,
- execute DDL,
- modify DB schema,
- add indexes,
- modify backend runtime,
- modify API,
- modify Admin UI,
- modify smoke tests,
- add survey sending,
- add notification sending,
- add LINE / APP / SMS / email delivery,
- add delivery resolver runtime,
- add outbox worker,
- add survey response intake,
- add survey content seed,
- add survey link / token generation,
- add Admin survey dashboard,
- add manual send / resend / override,
- add AI runtime or AI automatic decision,
- alter repeat completion 409 guard,
- alter finalAppointmentId inference,
- alter one Case / one formal Field Service Report invariant,
- hard-code LINE into completion or survey core,
- modify Task 087 inventory guide,
- expand inventory docs,
- perform destructive cleanup.
