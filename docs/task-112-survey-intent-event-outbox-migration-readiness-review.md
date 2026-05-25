# Task 112 - Survey Intent / Event Outbox Migration Readiness Review

## Background And Constraints

Task 112 converts the Task 111 survey intent / event outbox proposal into a migration readiness checklist.

Task 112 is documentation-only:

- no migration,
- no schema or index change,
- no runtime behavior change,
- no completion endpoint change,
- no survey sending,
- no notification sending,
- no LINE / APP / SMS / email delivery,
- no Admin survey UI,
- no AI automatic decision,
- no inventory docs expansion.

The current survey design remains:

- Survey trigger source of truth is the first successful backend Case-level Field Service Report completion transition.
- One Case has one formal Field Service Report.
- One Case may have multiple appointments / dispatch visits.
- `finalAppointmentId` is backend / system resolved and stable after completion.
- Repeat completion is rejected before mutation or side effects.
- Survey intent is Case-level, not appointment-level.
- Delivery channel resolution is separate from completion and survey intent creation.

## Migration Readiness Goal

Future migration work should not begin until these questions are settled:

1. Is survey policy enabled at all, or are intents initially suppressed / pending policy?
2. Should smoke / internal / test completions create no intent, or suppressed internal-only intent?
3. Should legacy no-appointment completions be surveyable, suppressed, or pending policy?
4. Should completion fail if survey intent / outbox insert fails?
5. Should `event_outbox` be shared for all future domain events or initially survey-focused?
6. Should `survey_intents` store only intent lifecycle, with delivery attempts elsewhere?
7. What retention / archival policy preserves first-completion idempotency?
8. What role / permission model may read survey intent and delivery state?

Until those are answered, Task 111 remains a proposal and must not be turned into migration 020.

## Readiness Checklist

### Product Policy

Required decisions:

- Survey feature default state: disabled, enabled, or organization-configured.
- Surveyable Case types.
- Legacy no-appointment policy.
- Smoke / internal / test suppression policy.
- Opt-out / suppression model.
- Expiration period.
- Resend / reminder policy.
- Whether high-risk complaint cases should suppress automatic delivery and require admin follow-up.

Not ready if:

- "survey intent exists" is confused with "survey is sent".
- No-channel Cases are treated as failures instead of pending / not deliverable / suppressed.
- Legacy no-appointment `finalAppointmentId = null` is treated as automatically surveyable.

### Transaction Boundary

Required decisions:

- Strict atomic model: completion + survey intent + outbox row commit together.
- Or completion-first model: completion can commit and a recovery job backfills missing survey intent.

Recommended first implementation:

- strict atomic model.

Reason:

- It gives the clearest first-transition guarantee.
- It avoids invisible gaps where a Case is completed but no intent/outbox exists.
- It keeps repeat completion and idempotency behavior easier to reason about.

Open risk:

- If survey intent / outbox insert fails, strict atomic completion would reject completion. Product must decide whether that is acceptable for field operations.

### Concurrency Boundary

Future implementation must include at least three layers:

1. Early already-completed guard.
2. Row-level lock, conditional update, or equivalent atomic first-transition detection.
3. Lifetime-scoped unique key on survey intent and tenant-scoped unique key on outbox event.

Migration is not ready if:

- it relies only on application-level "already completed" checks,
- uniqueness can be bypassed by soft delete,
- `finalAppointmentId` or `completedAt` is part of the idempotency key,
- outbox uniqueness is not organization scoped.

### Tenant / Organization Scope

Future tables must include `organization_id`.

Required scope:

- `survey_intents.organization_id`
- `event_outbox.organization_id`
- all read indexes that list status / createdAt should include organization.
- unique idempotency constraints should include organization.

Reason:

- Admin, future workers, and delivery resolver must respect organization boundaries.
- Outbox workers may process cross-tenant data, so tenant scope must be explicit.

### Survey Intent Lifecycle

`survey_intents.intent_status` should represent survey intent lifecycle only.

Recommended statuses:

- `pending_policy`
- `channel_resolution_pending`
- `deliverable`
- `not_deliverable`
- `suppressed`
- `delivery_pending`
- `sent`
- `answered`
- `expired`
- `cancelled`

Do not use `survey_intents` as a provider delivery attempt log. Provider attempts belong to future `survey_delivery_attempts` or existing / extended notification logs.

### Event Outbox Lifecycle

`event_outbox.status` should represent async processing lifecycle only.

Recommended statuses:

- `pending`
- `processing`
- `processed`
- `failed`
- `dead`
- `skipped`

Required future columns:

- `organization_id`
- `event_type`
- `event_version`
- `aggregate_type`
- `aggregate_id`
- `idempotency_key`
- `payload`
- `occurred_at`
- `available_at`
- `locked_at`
- `lock_expires_at`
- `locked_by`
- `attempts`
- `last_error`
- `processed_at`
- timestamps

Required safety:

- `last_error` is redacted and bounded-length.
- `payload` is allow-list only.
- Provider response is not stored in `event_outbox.payload`.

### Notification Table Boundary

Existing notification tables are useful, but they are not migration blockers for survey intent.

Recommended split:

| Table / layer | Role |
| --- | --- |
| `survey_intents` | First-completion survey domain intent. |
| `event_outbox` | Durable async handoff. |
| `notification_preferences` | Delivery preference by target / event / channel. |
| `notification_templates` | Renderable message content. |
| `notification_logs` | Provider delivery attempt / result log. |

Migration is not ready if:

- notification logs are used as the only survey source of truth,
- provider delivery failure can roll back or mutate Case completion,
- lack of notification log is treated as lack of survey intent.

## Proposed Migration 020 Scope Boundary

Candidate future migration 020 scope may be limited to the following, but only after policy, suppression, atomicity, tenant uniqueness, and safe payload gates are satisfied:

- `survey_intents` table,
- `event_outbox` table if a shared outbox does not already exist,
- indexes / checks / uniqueness required for idempotency and worker readiness.

Migration 020 should not include:

- survey response tables,
- customer feedback analytics,
- delivery attempt tables unless explicitly scoped,
- LINE push implementation,
- APP push implementation,
- Admin UI tables,
- AI risk radar tables,
- billing / settlement tables,
- inventory cleanup tables.

This is not approval to create migration 020. It is only a candidate scope boundary.

## Additional Readiness Blockers

### Historical Backfill Policy

Future migration planning must decide whether historical completed Case / Report rows should create survey intent.

Default recommendation:

- no automatic survey intent backfill,
- no real outbound survey for historical completions,
- no delivery based only on old completed records,
- if backfill is needed for testing or analytics, it should be suppressed / internal-only until explicitly approved.

### Outbox Worker Readiness

Before adding `event_outbox`, future design must decide:

- whether `lock_expires_at` is required,
- retry / backoff behavior,
- max attempts,
- terminal poison / dead status,
- worker crash lock recovery,
- processed event retention,
- failed event retention,
- redacted and bounded-length `last_error`,
- duplicate worker safety.

### Strict Atomic Versus Recovery Consequences

If strict atomic is chosen:

- completion + survey intent + outbox commit together,
- survey intent / outbox insert failure may roll back completion,
- product must accept this operational tradeoff.

If completion-first recovery is chosen:

- completion may succeed without immediate survey intent / outbox,
- a recovery / reconciliation job is required,
- recovery must use the same deterministic idempotency key,
- recovery must not send real outbound survey before policy gates pass.

### No-channel / Reverse Binding Dependency

No-channel and reverse LINE binding behavior is deferred to Task 118 and remains a migration readiness dependency.

Task 112 must not assume:

- completion-time LINE binding exists,
- no-channel always means suppressed,
- pending channel intent can wait indefinitely,
- reverse binding can recreate first-transition intent.

### Survey Response Ownership Dependency

Survey response schema is intentionally excluded from candidate migration 020.

Task 116 must keep response ownership Case-level with references to `serviceReportId` and nullable `finalAppointmentId`, rather than making responses appointment-level formal outcomes.

## Pre-migration Acceptance Criteria

Before writing migration 020, confirm:

1. Product policy decisions are documented.
2. Strict atomic vs completion-first recovery model is chosen.
3. Tenant-scoped uniqueness is approved.
4. Lifetime-scoped first-completion idempotency is approved.
5. Smoke/internal/test suppression model is approved.
6. Legacy no-appointment behavior is approved.
7. Safe payload allow-list is approved.
8. Retention / archival approach does not bypass idempotency.
9. Existing notification logs are not used as first-transition source of truth.
10. No delivery channel is hard-coded into completion.

## Future Test Readiness

Future migration / runtime tasks should prepare tests for:

- first completion creates one intent and one outbox row,
- repeat completion conflict creates no additional rows,
- concurrent completion creates at most one intent / outbox row,
- no eligible completed visit rejection creates no rows,
- failed transaction creates no rows,
- smoke/internal suppression creates no real delivery,
- no raw LINE user id / customer mobile / full payload in intent or outbox,
- delivery retry does not create a new first-transition event.

## Non-goals

Task 112 does not:

- add migration 020,
- create survey tables,
- create outbox tables,
- modify runtime behavior,
- modify completion flow,
- modify notification delivery,
- implement survey sending,
- implement LINE / APP / SMS / email delivery,
- add Admin UI,
- add AI decisions,
- modify inventory docs.

## Task 112 Decision

The survey intent / outbox design is not yet migration-ready until product policy and atomicity decisions are approved.

Task 112 should be treated as a migration readiness blockers checklist, not a final migration checklist. Task 113 through Task 118 may still change future schema requirements through policy, resolver, content, response ownership, admin visibility, and reverse binding decisions.

Recommended next Task:

- Task 113 should define Survey Policy / Suppression / Eligibility before any migration or runtime work.

## ChatGPT Design Review Integration

The project ChatGPT branch reviewed the Task 112 direction as part of the Codex / ChatGPT workflow.

Review outcome:

- Task 112 is correctly placed after Task 111 and before Task 113.
- Task 112 must remain a readiness gate / blocker matrix, not a migration implementation document.
- The most important readiness blockers are tenant scope, lifetime-scoped idempotency, strict atomicity versus completion-first recovery, suppression policy, legacy no-appointment policy, safe payload allow-list, and notification log boundary.
- The candidate migration 020 wording was tightened so it cannot be read as migration approval.
- Historical backfill policy, outbox worker readiness, strict atomic versus recovery consequences, no-channel / reverse binding dependency, and survey response ownership dependency were added as migration blockers.
- Task 113 should define survey policy / suppression / eligibility before any future migration proposal is finalized.
- Task 120 may later freeze survey docs, but only as a docs expansion freeze, not as permission to start runtime implementation.
