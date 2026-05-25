# Task 125 - Survey Intent / Event Outbox Migration 020 Draft DDL Convention Review / Apply Readiness Gate

## Executive Summary

Task125 reviews whether the draft DDL is convention-ready for future migration file authoring. It does not create, apply, or approve Migration 020.

This is documentation-only / convention review only:

- no migration file,
- no migration apply,
- no DDL execution,
- no schema or index change,
- no runtime behavior change,
- no API change,
- no Admin UI change,
- no smoke change,
- no survey sending,
- no LINE / APP / SMS / email push,
- no AI automatic decision,
- no inventory docs expansion.

Note: this pre-Task128 convention review referenced the historical event name `case.service_completed.first_transition`. Task128/129 later standardized the current canonical event name to `case.service_completion.first_transitioned`.

## Source Review Summary

Reviewed:

- migrations 001-019,
- Task 121 Migration 020 proposal review,
- Task 122 draft DDL risk review,
- Task 123 gate closure review,
- Task 124 file authoring plan / no apply,
- Task 110 first-transition survey trigger design,
- Task 105 backend-owned `finalAppointmentId` contract note.

Task 124 is accepted as a no-apply authoring plan. Task 125 only checks whether its candidate DDL shape is ready for a later migration file creation task.

## No-apply Statement

All SQL-like references remain draft documentation only:

- DRAFT ONLY,
- DO NOT EXECUTE,
- DO NOT COPY INTO MIGRATIONS,
- NOT A MIGRATION FILE,
- NOT APPROVED FOR APPLY,
- NOT APPROVED FOR RUNTIME WRITES,
- NOT APPROVED FOR SURVEY SENDING.

Task 125 does not create `020_create_survey_intents_and_event_outbox.sql`.

## Migration Convention Review

| Convention area | Existing convention | Task124 candidate review | Result |
| --- | --- | --- | --- |
| Filename | Three-digit prefix and snake_case description. | `020_create_survey_intents_and_event_outbox.sql`. | Ready for file authoring. |
| UUID ids | `uuid PRIMARY KEY DEFAULT gen_random_uuid()`. | Used by both candidate tables. | Ready. |
| Extension dependency | `pgcrypto` created in migration 001. | Migration 020 can rely on existing baseline; do not duplicate unless migration convention requires idempotent extension check. | Ready with note. |
| Timestamps | `created_at`, `updated_at`, optional `deleted_at`. | `created_at` / `updated_at` included; no normal `deleted_at` for idempotency-bearing rows. | Ready. |
| Updated trigger | `set_<table>_updated_at()` and `trg_<table>_set_updated_at`. | Candidate names match convention. | Ready. |
| Status fields | `text` + CHECK. | Candidate uses `text` + CHECK. | Ready. |
| JSONB checks | JSONB object type CHECK. | Candidate checks payload / summary objects. | Ready. |
| Index naming | `idx_<table>_<purpose>`. | Candidate follows this pattern. | Ready with final name review. |
| Partial indexes | Used for active/deleted or nullable lookups. | Candidate uses selective indexes only where useful. | Ready. |
| FK naming | Existing migrations usually rely on implicit FK names. | Candidate can follow implicit FK convention. | Ready. |
| ON DELETE behavior | Existing tables sometimes cascade. | Survey/outbox should avoid cascade due audit/idempotency history. | Ready; must be explicit in migration review. |

Conclusion:

- Task124 candidate filename and ordering are convention-ready for a future migration file authoring task.
- Migration apply remains blocked.

## `survey_intents` Convention Review

| Area | Review | Recommendation |
| --- | --- | --- |
| `id` | Uses project UUID pattern. | Ready. |
| `organization_id` | Required for tenant scope. | Ready; FK if table exists. |
| `case_id` | Required Case-level context. | Ready. |
| `service_report_id` | Required formal report context. | Ready. |
| `final_appointment_id` | Nullable for legacy no-appointment compatibility. | Ready; null does not enable survey by default. |
| `trigger_event_type` | Historical draft value was limited to `case.service_completed.first_transition`; current canonical value is `case.service_completion.first_transitioned`. | Historical only; use current canonical value for future work. |
| `trigger_event_version` | Positive integer. | Ready. |
| `idempotency_key` | NOT NULL and not blank. | Ready. |
| `intent_status` | Minimal intent states only. | Ready; exclude delivery/response states. |
| `policy_status` | Useful but potentially redundant. | Acceptable for authoring; verify final naming. |
| channel/contact states | Not separate columns in Task124 candidate. | Acceptable; intent_status can represent pending channel until runtime needs dedicated fields. |
| suppression fields | Safe code + JSONB object detail. | Ready if detail is allow-list only. |
| `completed_at` | Required first-transition completion time. | Ready. |
| version fields | Text candidate fields. | Ready; can refine later. |
| source / actor fields | Optional safe actor category / user ref. | Ready if no raw operator personal data is stored. |
| `safe_context_summary` | JSONB allow-list. | Ready; not a payload dump. |
| soft delete | No normal `deleted_at`. | Ready; preserves lifetime idempotency. |

Recommended Task126 adjustment before file creation:

- Consider renaming `policy_status` values or documenting why `policy_status` and `intent_status` are both needed.
- Consider whether `triggered_by_user_id` should be retained or deferred. If retained, it must remain an internal safe reference only.

## `survey_intents` Constraints / Indexes Review

| Constraint / index | Review | Result |
| --- | --- | --- |
| Unique `(organization_id, idempotency_key)` | Protects lifetime first-transition dedupe. | Ready. |
| Unique `(organization_id, case_id, service_report_id)` | Protects one survey intent per formal report. | Ready. |
| `trigger_event_type` CHECK | Limits initial event scope. | Ready. |
| status CHECK | Keeps lifecycle minimal. | Ready. |
| JSONB object CHECK | Prevents non-object blobs, not enough for privacy alone. | Ready with runtime allow-list. |
| `idx_survey_intents_status_created_at` | Supports future admin/ops lookup without overbuilding. | Ready. |
| `idx_survey_intents_case_created_at` | Supports Case-level lookup. | Ready. |
| `idx_survey_intents_service_report` | Supports report lookup. | Ready. |
| `idx_survey_intents_final_appointment` | Useful but not strictly required first. | Optional; defer if index minimization preferred. |

Convention conclusion:

- Constraint and index naming is consistent enough for Task126 file authoring.
- Same-organization and same-Case guarantees still require future runtime guard unless composite FK is deliberately introduced.
- Do not use active-only partial uniqueness because it would weaken lifetime idempotency.

## `event_outbox` Convention Review

| Area | Review | Recommendation |
| --- | --- | --- |
| `id` | Uses UUID pattern. | Ready. |
| `organization_id` | Required tenant scope. | Ready. |
| `event_type` | Required, CHECK limited initially. | Ready. |
| `event_version` | Positive integer. | Ready. |
| aggregate fields | Generic shape, initial `aggregate_type = case`. | Ready with runtime aggregate validation. |
| `survey_intent_id` | Optional traceability to intent. | Ready; keep if survey first-transition is the initial event. |
| `idempotency_key` | Required and not blank. | Ready. |
| `payload` | JSONB object. | Ready only with future allow-list validation. |
| `status` | Minimal outbox worker statuses. | Ready. |
| `available_at` / `occurred_at` | Supports scheduling and domain event time. | Ready. |
| lock fields | `locked_at`, `lock_expires_at`, `locked_by`. | Ready. |
| retry fields | `attempts`, `max_attempts`. | Ready. |
| `last_error` | Bounded length and redacted by runtime. | Ready with runtime redaction. |
| `processed_at` | Nullable, required only when processed. | Ready. |
| provider delivery fields | Not included. | Correct. |

Recommended Task126 adjustment before file creation:

- Add a length CHECK for `locked_by` if project style accepts it.
- Decide whether `skipped` should require `processed_at` like `processed`.
- Keep `event_outbox` generic but event allow-list strict.

## `event_outbox` Constraints / Indexes Review

| Constraint / index | Review | Result |
| --- | --- | --- |
| Unique `(organization_id, event_type, idempotency_key)` | Correct lifetime dedupe. | Ready. |
| `event_type` CHECK | Prevents broad generic event dumping in first version. | Ready. |
| `aggregate_type` CHECK | Keeps initial scope Case-level. | Ready. |
| payload object CHECK | Minimal structural protection only. | Ready with runtime allow-list. |
| status CHECK | Minimal outbox lifecycle. | Ready. |
| attempts CHECK | Prevents impossible retry counts. | Ready. |
| lock CHECK | Prevents partial lock state. | Ready. |
| processed status CHECK | Prevents processed without timestamp. | Ready; consider skipped behavior. |
| `idx_event_outbox_ready` | Supports future worker ready query. | Ready. |
| `idx_event_outbox_aggregate` | Supports Case-level event lookup. | Ready. |
| `idx_event_outbox_lock_expires` | Supports lock recovery. | Ready. |
| `idx_event_outbox_survey_intent` | Supports traceability. | Ready if `survey_intent_id` remains. |

Convention conclusion:

- The event_outbox candidate is convention-ready for a no-apply migration file creation task.
- Runtime writes remain blocked until payload allow-list, transaction handling, worker behavior, and safe error redaction are implemented.

## DDL Warning Review

Task124 warnings are acceptable:

- DRAFT ONLY,
- DO NOT EXECUTE,
- DO NOT COPY INTO MIGRATIONS,
- NOT VALIDATED AS EXECUTABLE DDL,
- NOT A MIGRATION FILE,
- NOT APPROVED FOR APPLY.

Task125 recommends Task126 preserve and strengthen warnings in any migration-adjacent documentation:

- NOT APPROVED FOR RUNTIME WRITES,
- NOT APPROVED FOR SURVEY SENDING,
- APPLY REQUIRES A SEPARATE EXPLICIT TASK.

No Task124 edit is required from this review.

## Apply-readiness Gate Matrix

| Area | Task124 decision | Task125 convention review | Remaining blocker | Ready for migration file authoring? | Ready for migration apply? | Ready for runtime writes? | Ready for outbound delivery? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Filename | `020_create_survey_intents_and_event_outbox.sql` | Matches convention. | None. | Yes | No | No | No | File can be authored later, not applied. |
| DDL ordering | survey_intents then event_outbox. | Reasonable. | None. | Yes | No | No | No | Keep no-apply. |
| UUID / timestamps | Matches existing style. | Ready. | None. | Yes | No | No | No | Relies on baseline pgcrypto. |
| updated_at triggers | Matches naming style. | Ready. | None. | Yes | No | No | No | Use distinct function names. |
| survey statuses | Minimal intent lifecycle. | Ready. | Delivery/response future scope. | Yes | No | No | No | No sent/answered. |
| outbox statuses | Minimal worker lifecycle. | Ready. | Worker runtime not built. | Yes | No | No | No | No provider result fields. |
| idempotency | Lifetime unique keys. | Ready. | Runtime conflict handling later. | Yes | No | No | No | Do not add soft-delete bypass. |
| same organization | Basic FK + runtime guard. | Acceptable. | Runtime guard required. | Yes | No | No | No | Composite FK deferred. |
| same Case final appointment | Runtime guard required. | Acceptable. | Runtime guard required. | Yes | No | No | No | Do not infer for survey. |
| no cascade delete | Required. | Ready. | Final FK clause review. | Yes | No | No | No | Preserve history. |
| payload safety | JSONB object checks. | Structurally ready. | Runtime allow-list required. | Yes | No | No | No | No full payload. |
| last_error | Bounded/redacted. | Ready with runtime guard. | Runtime redaction required. | Yes | No | No | No | No provider raw payload. |
| rollout | Inert table posture. | Ready. | Apply task still needed. | Yes | No | No | No | Feature flag disabled. |
| rollback | Forward-fix. | Ready. | Apply task must restate. | Yes | No | No | No | No shared destructive cleanup. |
| observability | Future safe metrics only. | Ready as note. | Metrics implementation deferred. | Yes | No | No | No | No sensitive labels. |

## Final Recommendation

Task125 recommendation:

- Task126 may proceed to **Survey Intent / Event Outbox Migration 020 File Authoring / No Apply**.
- Task126 may create the migration file only if it explicitly remains no-apply and inert.
- Migration apply remains blocked.
- Runtime writes remain blocked.
- Survey sending remains blocked.
- Admin UI / API / smoke changes remain blocked unless a later task explicitly scopes them.

Task126 should include:

- exact migration file creation,
- DDL copied carefully from the reviewed candidate and adjusted for final convention,
- no runtime changes,
- no apply,
- `npm run check`,
- SQL syntax-oriented review if available without applying,
- sensitive scan.

## Non-goals

Task125 does not:

- create Migration 020,
- apply Migration 020,
- execute DDL,
- modify schema or indexes,
- modify backend runtime,
- modify API,
- modify Admin UI,
- modify smoke scripts,
- implement survey intent writes,
- implement outbox worker,
- implement survey sending,
- implement notification delivery,
- implement LINE / APP / SMS / email push,
- implement survey response intake,
- implement survey dashboard,
- implement manual send / resend / override,
- implement AI runtime or AI automatic decision,
- change repeat completion guard,
- change finalAppointmentId inference,
- change Field Service Report invariants,
- modify Task 087 inventory guide,
- expand inventory docs,
- perform destructive cleanup.

## Verification Summary

Suggested verification:

- `npm run check`
- `npm run admin:check` if project convention expects it
- `git diff --check`
- sensitive scan over Task125 and related draft-DDL docs

No smoke, psql, migration apply, inventory verification, shared DB live verification, Admin UI tests, or runtime tests are required for Task125.
