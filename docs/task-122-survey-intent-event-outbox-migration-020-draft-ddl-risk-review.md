# Task 122 - Survey Intent / Event Outbox Migration 020 Draft DDL Risk Review / Rollout-Rollback Plan

## Executive Summary

Task 122 reviews draft DDL risk and rollout / rollback readiness only. It does not create, apply, or approve Migration 020.

Task 122 is documentation-only:

- no migration file,
- no DDL execution,
- no schema or index change,
- no runtime behavior change,
- no API change,
- no Admin UI change,
- no smoke change,
- no survey sending,
- no LINE / APP / SMS / email delivery,
- no AI automatic decision,
- no inventory docs expansion.

## Source Review Summary

Reviewed source decisions:

- Task 120 freezes survey design docs and requires readiness gates before implementation.
- Task 121 defines candidate Migration 020 scope as `survey_intents` and `event_outbox` only.
- Task 110 through Task 119 keep survey trigger Case-level, channel-agnostic, and advisory-only for AI.
- Migrations 001-019 conventions should be checked before any actual migration authoring.

## Draft DDL Warning Hardening

Task 121 pseudo-DDL was strengthened with:

- `PSEUDO-DDL ONLY`
- `DO NOT COPY INTO MIGRATIONS`
- `DO NOT EXECUTE`
- statement that SQL-like blocks are not validated as executable DDL.

Task 122 recommendation:

- keep all future SQL examples in docs clearly marked as draft,
- do not create `020_*.sql` until a later explicit migration-authoring task.

## `survey_intents` Draft DDL Risk Review

Column risks and recommendations:

| Column area | Review | Recommendation |
| --- | --- | --- |
| `organization_id` | Required for tenant scope. | NOT NULL FK if organizations table convention supports it. |
| `case_id` | Primary Case-level context. | NOT NULL FK. |
| `service_report_id` | One formal report context. | NOT NULL FK. |
| `final_appointment_id` | Nullable for legacy no-appointment contract. | Nullable FK; null does not enable legacy survey by default. |
| trigger fields | Should pin first-transition event. | `trigger_event_type` text + CHECK candidate; `trigger_event_version` integer. |
| `idempotency_key` | Core dedupe identity. | NOT NULL; organization-scoped unique. |
| status fields | Multiple lifecycle enums. | Prefer text + CHECK initially; DB enum may be too rigid. |
| policy versions | Audit future policy decisions. | nullable integer or text version; final type unresolved. |
| `safe_context_summary` | Allow-list safe JSON only. | JSONB nullable or default `{}`; never free-form payload dump. |
| actor refs | Optional. | Avoid if not needed; if used, internal safe refs only. |
| timestamps | Existing convention likely `created_at` / `updated_at`. | Follow migration convention; add updated trigger only if project convention requires it. |
| deletion | Lifetime idempotency risk. | Avoid normal soft delete; use statuses. If archived, uniqueness must remain lifetime-scoped. |

FK / deletion behavior:

- Avoid `ON DELETE CASCADE`.
- Historical survey intent should not disappear because related Case / Report is archived.
- `final_appointment_id` should not be `ON DELETE SET NULL` without explicit policy, because it would degrade service context.
- Same-organization consistency may need runtime validation unless composite FKs are introduced later.

## `survey_intents` Constraints / Indexes Review

Candidate constraints:

- organization-scoped unique `idempotency_key`,
- organization-scoped unique `(case_id, service_report_id)`,
- CHECK on `trigger_event_type`,
- CHECK on status fields,
- CHECK JSONB object for safe context,
- CHECK positive event version.

Candidate indexes:

- `(organization_id, intent_status, created_at)`,
- `(organization_id, case_id, created_at)`,
- `(organization_id, service_report_id)`,
- `(organization_id, final_appointment_id)` only if lookup is needed,
- `(organization_id, suppression_reason_code, created_at)` only if dashboards need it.

Over-indexing risk:

- Defer dashboard-oriented indexes until query patterns are real.
- Migration 020 should prefer correctness indexes first: uniqueness and primary worker/admin lookup.

## `event_outbox` Draft DDL Risk Review

Column risks and recommendations:

| Column area | Review | Recommendation |
| --- | --- | --- |
| `organization_id` | Required for tenant-scoped worker safety. | NOT NULL FK if convention supports it. |
| `event_type` | Domain event key. | NOT NULL text + CHECK or allow-list in runtime. |
| `event_version` | Payload schema version. | integer positive. |
| aggregate | Case-level event. | `aggregate_type = case`, `aggregate_id = case_id`. |
| `idempotency_key` | Event dedupe. | NOT NULL; unique with organization + event_type. |
| `payload` | Safe async handoff. | JSONB object, allow-list only. |
| `status` | Worker lifecycle. | Prefer text + CHECK initially. |
| `available_at` | Retry scheduling. | NOT NULL default now. |
| `occurred_at` | Domain event time. | NOT NULL, completion transition time. |
| lock fields | Worker crash recovery. | `locked_at`, `lock_expires_at`, `locked_by`. |
| attempts | Retry accounting. | `attempts` default 0, optional `max_attempts`. |
| `last_error` | Sensitive risk. | bounded and redacted by runtime; DDL type decision pending. |
| `processed_at` | Completion marker. | nullable. |

Open design question:

- Is `event_outbox` a generic application outbox or survey-first outbox? Recommendation: generic table name is acceptable only if event type and payload allow-list remain strict.

## `event_outbox` Constraints / Indexes Review

Candidate constraints:

- unique `(organization_id, event_type, idempotency_key)`,
- CHECK JSONB object for payload,
- CHECK status values,
- CHECK non-negative attempts,
- CHECK lock expiry only when locked.

Candidate indexes:

- ready worker index: `(organization_id, status, available_at, created_at)` for pending / failed,
- aggregate lookup: `(organization_id, aggregate_type, aggregate_id, created_at)`,
- lock expiry lookup: `(organization_id, lock_expires_at)`,
- failed / dead status lookup if needed later,
- processed retention lookup only if retention job is implemented.

Over-indexing risk:

- Avoid retention and dashboard indexes until runtime / ops patterns are real.

## Status Lifecycle Consistency

Survey intent lifecycle and delivery attempt lifecycle must remain separate.

Recommended minimal `survey_intents` statuses for first migration:

- `pending_policy`
- `channel_resolution_pending`
- `pending_channel`
- `suppressed`
- `not_deliverable`
- `ready_for_delivery`
- `expired`
- `cancelled`

Potentially defer `sent` and `answered` until delivery / response tables exist.

Recommended minimal `event_outbox` statuses:

- `pending`
- `processing`
- `processed`
- `failed`
- `dead`
- `skipped`

Provider delivery attempt status does not belong in `event_outbox`.

## Transaction / Atomicity Review

Option A - strict atomic:

- completion + intent + outbox commit together,
- strongest first-transition correctness,
- may block completion if survey path fails.

Option B - completion-first recovery:

- completion never depends on survey path,
- requires missing-intent detector and safe no-send backfill,
- more operationally complex.

Task 122 recommendation:

- strict atomic appears safer for correctness,
- completion-first recovery may be preferred only if product rejects completion rollback risk,
- Task 123 should close atomicity before migration file authoring.

## Rollout Plan

Future rollout should require:

1. Feature flag default disabled.
2. Migration applies inert tables only.
3. No runtime writes until explicit runtime task.
4. No survey sending until explicit delivery task.
5. No historical backfill by default.
6. No Admin/API/smoke impact.
7. Post-migration verification is schema-only and safe summary only.
8. Shared runtime has no real outbound survey.

## Rollback / Forward-fix Plan

Given shared runtime no destructive cleanup:

- prefer feature flag disable,
- prefer inert tables remaining unused,
- prefer forward-fix migration over destructive rollback,
- do not drop tables casually on shared runtime,
- do not delete survey intents / outbox rows as cleanup,
- local/test rollback may differ but must not set shared runtime precedent.

## Historical Backfill Review

Default remains:

- no automatic historical completed Case backfill,
- no real outbound survey for historical completions,
- backfill requires separate task,
- backfill must be suppressed / internal-only / no-send unless explicitly approved,
- backfill must not reinterpret historical `finalAppointmentId`,
- backfill must not create duplicate reports,
- backfill must not send to smoke/internal/test Cases.

## Privacy / Redaction / Retention

Required future policy:

- safe payload allow-list,
- no raw provider payload,
- no customer mobile,
- no raw LINE user id,
- no APP device token,
- no full customer / Case / report / appointment payload,
- no operator personal identity,
- no credentials,
- bounded redacted `last_error`,
- retention / archival / export rules.

Feedback text and AI summaries remain sensitive but are out of Migration 020 scope.

## Observability Proposal

Future safe metrics only:

- survey intent insert count,
- duplicate idempotency conflict count,
- outbox insert count,
- outbox pending count,
- outbox failed count,
- outbox lock timeout count,
- pending-channel count if resolver exists later.

Metrics must not include customer identifiers, raw LINE ids, payloads, or contact values.

## Draft DDL Risk Matrix

| Area | Draft DDL decision | Risk | Recommendation | Required before migration file | Required before migration apply | Owner / next task | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Status type | text + CHECK preferred | enum rigidity | confirm convention | yes | yes | Task123 | open |
| Soft delete | avoid normal deleted_at | duplicate intent | use status/archival | yes | yes | Task123 | open |
| Atomicity | Option A preferred | completion rollback tradeoff | product/architecture decision | yes | yes | Task123 | blocker |
| Outbox type | generic vs survey-first open | broad table semantics | decide scope | yes | yes | Task123 | open |
| Last error | text candidate | sensitive leakage | bound/redact policy | yes | yes | Task123 | blocker |
| Backfill | default no | historical outbound risk | separate task | no | yes | Task123 | blocker |
| Contact target | unresolved | wrong recipient | product decision | no | runtime | Task123 | blocker |
| Retention | unresolved | privacy/ops risk | define policy | no | yes | Task123 | blocker |

## Open Questions

1. Strict atomic or completion-first recovery?
2. Text + CHECK, DB enum, or lookup table for statuses?
3. Generic outbox or survey-first outbox?
4. Should `sent` / `answered` be excluded until delivery / response tables exist?
5. How should same-organization consistency be enforced?
6. Should actor refs be included at all?
7. What max length for `suppression_detail_safe` and `last_error`?
8. What payload max size is acceptable?
9. What retention policy applies to processed outbox rows?
10. Can pending-channel ever wait beyond survey expiration?

## Final Gate Recommendation

Task 122 concludes:

- Draft DDL risk is reviewed.
- Migration 020 is not ready to author as a migration file.
- Migration 020 is not ready to apply.
- Task 123 should close policy / atomicity / retention gates before migration file authoring.

## Non-goals

Task 122 does not:

- create migration file,
- apply migration,
- execute DDL,
- change schema,
- change runtime,
- change API,
- change Admin UI,
- change smoke,
- send survey,
- implement resolver,
- implement outbox worker,
- implement response intake,
- implement AI pipeline,
- modify inventory docs.
