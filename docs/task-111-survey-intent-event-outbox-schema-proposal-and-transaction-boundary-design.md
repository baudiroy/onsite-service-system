# Task 111 - Survey Intent / Event Outbox Schema Proposal And Transaction Boundary Design

## Background And Constraints

Task 111 follows Task 110's post-completion survey first-transition design. It proposes future schema and transaction boundaries for survey intent and event outbox handling, but it does not implement them.

Task 111 is design / documentation only:

- no migration,
- no schema or index change,
- no runtime behavior change,
- no completion endpoint change,
- no survey sending,
- no notification sending,
- no LINE push,
- no APP push,
- no SMS or email delivery,
- no Admin survey button,
- no AI automatic decision,
- no inventory docs expansion.

Current foundations:

- One Case has one formal Field Service Report.
- One Case may have multiple appointments / dispatch visits.
- `finalAppointmentId` is backend / system resolved and stable after completion.
- Task 109 rejects repeat completion before mutation or side effects.
- Task 110 defines survey trigger source of truth as the first successful backend Case-level service completion transition.

## Existing Pattern Review

### Completion Flow

`FieldServiceReportService.completeServiceReport` currently performs completion inside a transaction:

1. Load existing service report.
2. Check Case access.
3. Reject already completed reports before inference or side effects.
4. Resolve / validate `finalAppointmentId`.
5. Update Field Service Report to `completed`.
6. Update Case service summary to `completed`.
7. Create workflow timeline message.
8. Record audit entry.
9. Return completed report DTO.

This is the correct future insertion point for a survey intent / outbox write, because the report, Case, and final appointment context have all been resolved and the already-completed repeat guard has already removed duplicate completion side effects.

### Notification Tables

Migration 010 currently provides:

- `notification_preferences`,
- `notification_templates`,
- `notification_logs`.

These are useful for delivery preferences, templates, and delivery logs. They are not a sufficient source of truth for first-transition survey intent because:

- `notification_logs` is delivery-oriented, not a domain intent table.
- `notification_logs` has no stable first-completion idempotency key.
- `notification_logs` may contain provider response and recipient fields, which should stay out of the core completion event.
- Survey intent may exist before any delivery channel is available.
- Survey intent may be suppressed, pending policy, pending channel resolution, expired, or answered without mapping cleanly to a single notification log.

Recommendation:

- Keep `notification_logs` as a future delivery attempt / provider log layer.
- Add a separate future survey intent table for domain intent.
- Add a separate future event outbox for durable asynchronous handoff.
- Do not overload notification logs as the first-transition survey source of truth.

Layer responsibilities:

| Layer | Source of truth for |
| --- | --- |
| `survey_intents` | Whether a Case first-completion survey intent exists. |
| `event_outbox` | Whether a durable async handoff must be processed. |
| `notification_preferences` | Customer / role / system delivery preference by event and channel. |
| `notification_templates` | Message content and template version. |
| `notification_logs` | Provider delivery attempt / result / delivery audit. |
| `customer_line_identities` | Channel identity binding lookup, not trigger payload. |

Important warning:

- `notification_logs` must not be the first-transition idempotency source.
- `notification_logs` must not decide whether a Case has a survey intent.
- `notification_logs` must not carry the Case completion domain event.
- Lack of a notification log does not mean lack of survey intent; a Case may be pending policy, pending channel binding, suppressed, or not deliverable.
- Provider delivery failure must not mutate or roll back Case / Field Service Report completion.

### LINE Identity Tables

Migration 012 currently provides LINE channel and customer LINE identity foundations. `customer_line_identities` is scoped by `organization_id + line_channel_id + line_user_id`, and admin DTOs should expose masked identity summaries rather than raw LINE user ids.

Survey intent / outbox design must preserve this boundary:

- Survey intent must not store raw LINE user id.
- Survey outbox payload must not store raw LINE user id.
- Delivery resolver may query channel bindings later.
- Core Case / Report completion must not hard-code LINE.
- Existing Case reverse LINE binding may happen before or after completion.

## Boundary Model

Task 111 separates the future survey feature into five layers.

### 1. Completion Core

Owns:

- report completion,
- Case completion,
- finalAppointmentId resolution,
- first-transition guard,
- repeat completion rejection,
- future same-transaction survey intent / outbox insert.

Does not own:

- channel selection,
- message rendering,
- LINE / APP / SMS / email sending,
- retry scheduling,
- survey answer handling,
- AI decision-making.

### 2. Survey Intent

Owns:

- one durable first-completion survey intent per Case / Field Service Report,
- idempotency key,
- Case-level survey lifecycle,
- policy / channel eligibility summaries,
- safe context needed for future delivery.

Does not own:

- provider sending,
- raw channel identity,
- notification provider payload,
- completion mutation.

### 3. Event Outbox

Owns:

- durable asynchronous handoff after a successful first-transition,
- retry / lock / attempt metadata,
- idempotent event publishing,
- safe event payload storage.

Does not own:

- provider delivery,
- user-facing message templates,
- report / Case mutation,
- channel identity lookup at completion time.

### 4. Delivery Resolver

Owns:

- reading survey intent / event payload,
- applying survey policy,
- resolving current channel binding,
- checking opt-out / suppression / internal test policy,
- choosing LINE / APP / SMS / email / manual follow-up / not deliverable.

Does not own:

- first-transition detection,
- finalAppointmentId inference,
- completion state mutation.

### 5. Channel Delivery Adapters

Own:

- provider protocol,
- provider status response,
- delivery attempt logging,
- provider retry semantics.

Do not own:

- Case completion semantics,
- survey intent identity,
- AI decisions,
- raw domain mutation.

## Proposed Future Schema: `survey_intents`

This is a migration-ready proposal only. Task 111 does not add this table.

Suggested columns:

```sql
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
    suppression_reason text,
    survey_policy_version integer,
    eligibility_policy_version integer,
    completed_at timestamptz NOT NULL,
    source text NOT NULL DEFAULT 'backend',
    payload_summary jsonb,
    triggered_by_type text NOT NULL DEFAULT 'unknown',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
```

Suggested constraints:

```sql
CHECK (trigger_event_type = 'case.service_completion.first_transitioned')
CHECK (trigger_event_version > 0)
CHECK (length(trim(idempotency_key)) > 0)
CHECK (intent_status IN (
    'pending_policy',
    'channel_resolution_pending',
    'deliverable',
    'not_deliverable',
    'suppressed',
    'sent',
    'answered',
    'expired',
    'cancelled'
))
CHECK (channel_binding_state IN (
    'unknown',
    'none',
    'line_bound',
    'app_bound',
    'multiple'
))
CHECK (contact_eligibility_state IN (
    'pending_policy',
    'unknown',
    'eligible',
    'not_eligible'
))
CHECK (source IN ('backend'))
CHECK (triggered_by_type IN ('admin', 'system', 'unknown'))
CHECK (payload_summary IS NULL OR jsonb_typeof(payload_summary) = 'object')
```

Suggested indexes:

```sql
CREATE UNIQUE INDEX idx_survey_intents_idempotency_unique
    ON survey_intents(organization_id, idempotency_key);

CREATE UNIQUE INDEX idx_survey_intents_case_report_unique
    ON survey_intents(organization_id, case_id, service_report_id);

CREATE INDEX idx_survey_intents_status_created_at
    ON survey_intents(organization_id, intent_status, created_at);

CREATE INDEX idx_survey_intents_case_created_at
    ON survey_intents(organization_id, case_id, created_at DESC);

CREATE INDEX idx_survey_intents_organization_status_created_at
    ON survey_intents(organization_id, intent_status, created_at);
```

Schema notes:

- `final_appointment_id` is nullable for legacy no-appointment cases, but default product policy should not automatically trigger survey for those cases until explicitly enabled.
- `final_appointment_id` nullable does not imply legacy no-appointment Cases are surveyable by default.
- `payload_summary` is an allow-list safe JSON summary only. It must not contain customer mobile, raw LINE user id, full customer object, full report payload, full appointment payload, provider payload, token, secret, credentials, customer address, or operator personal identity.
- `survey_policy_version` and `eligibility_policy_version` are nullable future audit helpers. They let operators later understand why a Case was deliverable, suppressed, or pending under the policy version active at the time.
- `triggered_by_type` is a safe summary only. Detailed actor attribution should remain in audit logs unless a future product decision explicitly requires more.
- `intent_status` starts as `pending_policy` to preserve future policy decisions such as smoke/internal suppression, opt-out, or organization-level survey enablement.
- Survey intents should not be soft-deleted in normal operation. Use `suppressed`, `cancelled`, or future void / archival states instead. First-completion idempotency must be lifetime-scoped and must not be bypassed by `deleted_at`.

## Proposed Future Schema: `event_outbox`

This is a migration-ready proposal only. Task 111 does not add this table.

Suggested columns:

```sql
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
    occurred_at timestamptz NOT NULL,
    available_at timestamptz NOT NULL DEFAULT now(),
    locked_at timestamptz,
    lock_expires_at timestamptz,
    locked_by text,
    attempts integer NOT NULL DEFAULT 0,
    last_error text,
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
```

Suggested constraints:

```sql
CHECK (event_version > 0)
CHECK (length(trim(event_type)) > 0)
CHECK (aggregate_type IN ('case', 'service_report', 'survey_intent'))
CHECK (length(trim(idempotency_key)) > 0)
CHECK (jsonb_typeof(payload) = 'object')
CHECK (status IN ('pending', 'processing', 'processed', 'failed', 'dead', 'skipped'))
CHECK (attempts >= 0)
CHECK (lock_expires_at IS NULL OR locked_at IS NOT NULL)
CHECK (processed_at IS NULL OR processed_at >= created_at)
```

Suggested indexes:

```sql
CREATE UNIQUE INDEX idx_event_outbox_event_idempotency_unique
    ON event_outbox(organization_id, event_type, idempotency_key);

CREATE INDEX idx_event_outbox_ready
    ON event_outbox(organization_id, status, available_at, created_at)
    WHERE status IN ('pending', 'failed');

CREATE INDEX idx_event_outbox_aggregate
    ON event_outbox(organization_id, aggregate_type, aggregate_id, created_at DESC);

CREATE INDEX idx_event_outbox_created_at
    ON event_outbox(organization_id, created_at DESC);
```

Outbox notes:

- `event_outbox` should store domain events and async work handoff, not provider delivery details.
- Provider response belongs in future delivery attempt logs or existing notification logs, not in `event_outbox.payload`.
- Recommended aggregate for this event: `aggregate_type = 'case'` and `aggregate_id = case_id`, because the event is Case-level. The payload should still include `surveyIntentId`, `caseId`, `serviceReportId`, and `finalAppointmentId` for worker convenience.
- `occurred_at` is the first successful service completion transition time, normally the persisted report completion time. `created_at` is the outbox row creation time.
- `lock_expires_at` lets future workers recover abandoned locks after worker crash.
- `locked_by` should be a worker identifier only, not a secret or host credential.
- `last_error` must be redacted, truncated / bounded-length, and must not contain request bodies, provider raw payloads, token values, mobile numbers, raw LINE user ids, or credentials.

## Optional Future Schema: `survey_delivery_attempts`

This is not required for Task 111 and should be a later design if survey delivery is implemented.

Possible columns:

- `id`
- `survey_intent_id`
- `channel`
- `delivery_status`
- `provider_message_id`
- `provider_status_summary`
- `attempted_at`
- `sent_at`
- `failed_at`
- `error_code`
- `error_message`
- `created_at`

The table would record delivery attempts after channel resolution. It must not become the first-transition source of truth.

## Transaction Boundary Recommendation

Future implementation should write survey intent and outbox record only inside the first successful completion transition.

Recommended future write sequence:

1. Start completion transaction.
2. Load service report with a row lock, conditional update, or equivalent concurrency guard.
3. Reject if report is already completed.
4. Resolve / validate `finalAppointmentId`.
5. Update service report to `completed`.
6. Update Case summary to `completed`.
7. Create timeline / audit entries.
8. Insert `survey_intents` row using deterministic `idempotency_key`.
9. Insert `event_outbox` row with the same idempotency key and safe payload.
10. Commit transaction.
11. Only after commit, an async worker may process the outbox.

If steps 5 through 9 cannot all commit, no survey intent / outbox event should be considered durable.

The ordering inside the transaction is less important than the guarantee that all completion-side durable writes either commit together or roll back together. External delivery must never happen inside the completion transaction.

Recommended strict first implementation:

- Completion + survey intent + first-transition outbox write are atomic.
- Insert failure should roll back completion unless the failure is a recognized same-key duplicate caused by an already-recorded first transition.
- A same-key conflict must fail safe and must never create a second survey intent or second outbox event.

Alternative if same-transaction outbox is not immediately available:

- Completion may commit first, then a follow-up job may reconcile missing intent by scanning completed reports.
- This is weaker and must still use deterministic idempotency and safe payload.
- It should be treated as a fallback / repair mechanism, not the preferred first implementation.

## No-event Conditions

The future implementation must not create `survey_intents` or `event_outbox` rows for:

- repeat completion rejected by Task 109,
- completion retry that receives conflict,
- no eligible completed visit rejection,
- cross-Case final appointment rejection,
- non-completed final appointment rejection,
- failed transaction,
- report content edit after completion,
- completed report reopen attempt,
- manual correction flow,
- AI suggestion / risk flag,
- delivery retry creating a new first-transition trigger,
- channel resolver retry creating a new first-transition trigger.

Delivery retry may operate on an existing intent / outbox / delivery attempt according to delivery-layer idempotency. It must not create a new survey intent or first-transition outbox event.

## Idempotency And Concurrency

Recommended idempotency key:

```text
survey:first-completion:case:<caseId>:report:<serviceReportId>
```

Rules:

- Key must be deterministic.
- Key must be written to `survey_intents.idempotency_key`.
- Key must be written to `event_outbox.idempotency_key`.
- Key must not include `finalAppointmentId`.
- Key must not include `completedAt`.
- Key must not include delivery channel.
- Key must not include raw customer identity.
- Key must not include actor identity.

Concurrency recommendations:

- Completion should use row-level locking, conditional update, or an equivalent guard so only one request can transition a report from non-completed to completed.
- Database uniqueness on `(organization_id, idempotency_key)` in `survey_intents` is the second layer of protection.
- Database uniqueness on `(organization_id, event_type, idempotency_key)` in `event_outbox` is the third layer.
- If concurrent requests race, at most one completion succeeds and at most one survey intent / outbox row exists.

## Event Payload Proposal

Recommended outbox payload:

```json
{
  "eventType": "case.service_completion.first_transitioned",
  "eventVersion": 1,
  "idempotencyKey": "survey:first-completion:case:<caseId>:report:<serviceReportId>",
  "organizationId": "<organization-id>",
  "caseId": "<case-id>",
  "serviceReportId": "<service-report-id>",
  "finalAppointmentId": "<appointment-id-or-null>",
  "completedAt": "<persisted-completion-time>",
  "occurredAt": "<first-transition-time>",
  "surveyIntentId": "<survey-intent-id>",
  "source": "backend",
  "channelBindingState": "unknown",
  "contactEligibilityState": "pending_policy",
  "actorType": "admin|system|unknown",
  "createdAt": "<event-created-time>"
}
```

Payload must not include:

- customer mobile / phone / tel,
- raw LINE user id,
- LINE channel secret / access token,
- token / secret / password,
- DATABASE_URL,
- full payload / raw payload,
- full customer object,
- full appointment object,
- full service report object,
- full request / response body,
- provider raw payload,
- customer address,
- operator email / phone / personal contact,
- AI raw payload.

## Channel Abstraction

Survey intent / outbox creation is channel agnostic.

Future delivery resolver should:

- inspect current customer/channel binding at send time,
- support LINE without making LINE mandatory,
- support own APP or other channels later,
- respect organization scope and role / permission boundaries,
- handle no-channel cases as pending / not deliverable / suppressed according to product policy,
- keep raw channel ids and provider secrets out of survey intent and outbox payload.

Existing case reverse LINE binding remains compatible because:

- Survey intent uses internal Case / Report identity.
- Delivery resolver can query channel binding later.
- A Case does not need to originate from LINE to be surveyable.
- If LINE binding happens after completion, future policy can decide whether pending survey intent becomes deliverable.

## Smoke / Internal / Test Suppression

Future implementation must define a policy gate before real delivery.

Recommended design:

- Survey intent may be created for real first-completion events only after survey policy is enabled.
- Smoke / internal / test cases should either suppress intent creation or create a suppressed / internal-only intent in controlled test environments.
- Shared runtime smoke must never send real outbound survey.
- Suppression reason should be structured, such as `internal_case`, `smoke_fixture`, `test_runtime`, `policy_disabled`, or `opted_out`.
- Suppression must not mutate Case / Report completion state.

Task 111 does not implement suppression policy. It only reserves the design boundary.

## Legacy No-appointment Cases

The schema allows `final_appointment_id` to be null, but the default product policy should not automatically survey legacy no-appointment cases.

Recommendation:

- Keep `final_appointment_id` nullable in `survey_intents`.
- Keep `finalAppointmentId` nullable in event payload.
- Default behavior in future implementation: suppress or keep pending policy for legacy no-appointment cases.
- Enable only after product explicitly decides that legacy no-appointment completions are surveyable.
- Never create a fake appointment to satisfy survey context.

## Admin Frontend Impact

Task 111 requires no Admin Frontend change.

Future Admin rules:

- Admin completion payload continues to omit `finalAppointmentId`.
- Admin UI does not send survey trigger fields.
- Admin UI does not choose delivery channel.
- Admin UI does not add a survey send button in this design.
- Admin UI does not add a manual final appointment picker.
- Admin UI does not override survey intent.
- Future survey status display should read from survey intent / delivery state, not infer from frontend completion action.

## Future Test Plan

Future implementation should add tests for:

1. First successful completion creates exactly one survey intent and one outbox row.
2. Backend-inferred `finalAppointmentId` completion creates one intent / outbox row.
3. Supplied same-Case completed `finalAppointmentId` before first completion creates one intent / outbox row.
4. Repeat completion conflict creates no additional intent / outbox row.
5. Repeat completion with different supplied `finalAppointmentId` creates no intent and cannot override the completed report.
6. No eligible completed visit rejection creates no intent / outbox row.
7. Cross-Case final appointment rejection creates no intent / outbox row.
8. Non-completed final appointment rejection creates no intent / outbox row.
9. Failed transaction creates no durable intent / outbox row.
10. Two concurrent completion requests create at most one intent / outbox row.
11. Outbox worker retry does not create a second survey intent.
12. Delivery resolver retry does not create a second survey intent.
13. Event payload excludes customer mobile, raw LINE user id, full payload, credentials, and provider payload.
14. LINE-originated and non-LINE-originated Cases use the same event type.
15. Legacy no-appointment completions are suppressed / pending policy by default.
16. Smoke / internal cases do not send real outbound survey.
17. Admin completion still does not send `finalAppointmentId` or survey trigger fields.

## Open Questions

1. Should `survey_intents` be the only survey source of truth, or should a separate `customer_feedback` table own answered survey data?
2. Should answered survey results attach primarily to Case, Customer, Field Service Report, or multiple references?
3. Should legacy no-appointment completions ever be surveyable by default?
4. Should survey intent be created while policy is disabled, or should no intent be created until policy is enabled?
5. Should smoke / test completions create suppressed intent rows for coverage, or create no rows?
6. Should survey delivery be immediate, delayed, or scheduled?
7. What expiration period should survey intent use?
8. What resend / reminder policy is acceptable?
9. Which roles can view survey intent and delivery status?
10. What customer opt-out / suppression model is required?
11. Can a pending survey become deliverable if LINE / APP binding happens after completion?
12. Should event outbox be shared across all future domain events or survey-specific at first?
13. How should future manual correction / reopen flows affect survey state, if they are ever added?
14. Should completion fail if survey intent / outbox insert fails, or should completion succeed with a compensating recovery job?
15. If `survey_intents` ever needs archival, how can archival preserve lifetime-scoped first-completion idempotency?
16. Should smoke / internal / test completions create no intent, or create suppressed / internal-only intent for observability?
17. Should `event_outbox.aggregate_type` remain `case`, or should a future worker-oriented implementation use `survey_intent`?
18. Should survey responses attach primarily to Case while referencing serviceReportId / finalAppointmentId, with customer-level analytics derived later?
19. What retention and redaction policy applies to survey intent summaries, outbox payloads, `last_error`, and delivery logs?

## Non-goals

Task 111 does not:

- add migration 020,
- add or modify DB schema,
- add indexes,
- modify runtime behavior,
- modify completion endpoint behavior,
- modify backend inference ordering,
- modify repeat completion conflict behavior,
- implement survey sending,
- implement survey outbox worker,
- implement delivery resolver,
- implement notification dispatcher,
- implement LINE push,
- implement APP push,
- implement SMS or email,
- implement customer opt-out,
- implement survey answer intake,
- implement Admin survey UI,
- add manual final appointment picker,
- add manual correction UI,
- add AI automatic decision,
- hard-code LINE into Case / Report completion,
- modify inventory docs,
- perform destructive cleanup.

## Migration / Schema Decision

No migration, schema, or index change in Task 111.

The `survey_intents`, `event_outbox`, and optional `survey_delivery_attempts` definitions are future migration proposals only.

## Runtime Decision

No runtime behavior change in Task 111.

Future runtime implementation should be opened as a separate task after product policy decisions are made for:

- survey enablement,
- legacy no-appointment handling,
- smoke / internal suppression,
- delivery channel priority,
- survey content/versioning,
- result ownership.

## ChatGPT Design Review Integration

This note was reviewed through the project ChatGPT branch as part of the ongoing Codex / ChatGPT workflow.

Review outcome:

- The overall direction does not violate the Case-level Field Service Report invariant, multi-visit model, backend-owned `finalAppointmentId`, no AI automatic decision boundary, or channel abstraction boundary.
- The schema proposal needed hardening before it can become a future migration basis.
- The most important hardening points were integrated:
  - `event_outbox` includes `organization_id`, `occurred_at`, and `lock_expires_at`.
  - Survey intent uniqueness is lifetime-scoped by organization and idempotency key, not partial active uniqueness.
  - Survey intent should use status transitions rather than normal soft delete.
  - Outbox uniqueness is tenant-scoped by organization, event type, and idempotency key.
  - Notification logs are documented as delivery-result logs, not first-transition intent source of truth.
  - Transaction boundary now explicitly requires atomic first-transition detection plus row lock / conditional update and unique-key dedupe.
  - Delivery retry wording now says it may retry an existing delivery attempt but must not create a new first-transition trigger.
  - Open questions now include strict atomic completion versus compensating recovery, archival / idempotency, smoke suppression strategy, aggregate selection, pending channel binding, and retention / redaction.
