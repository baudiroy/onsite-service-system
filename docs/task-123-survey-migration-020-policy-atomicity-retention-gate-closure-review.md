# Task 123 - Survey Migration 020 Policy / Atomicity / Retention Gate Closure Review

## Executive Summary

Task 123 closes or classifies Migration 020 policy, atomicity, and retention gates. It does not create, apply, or approve Migration 020 for runtime use.

This task is documentation-only and gate-closure review only:

- no migration file created,
- no DDL executed,
- no schema or index change,
- no runtime behavior change,
- no API change,
- no Admin UI change,
- no smoke change,
- no survey sending,
- no notification delivery,
- no LINE / APP / SMS / email push,
- no AI automatic decision,
- no inventory docs expansion.

Migration 020 remains not approved for apply. Task 123 only decides which gates are closed enough for a later migration file authoring plan, which gates are deferred to runtime / delivery tasks, and which gates still block migration apply or real outbound delivery.

## Source Review Summary

Reviewed design inputs:

- Task 110 defines the post-completion survey first-transition trigger as a backend-only Case-level completion event.
- Task 111 proposes future `survey_intents` and `event_outbox` boundaries and transaction safety.
- Task 112 reviews migration readiness and keeps implementation gated.
- Task 113 defines policy / suppression / eligibility design.
- Task 114 defines channel resolver principles without LINE hard-coding.
- Task 115 defines survey content and template versioning as future delivery scope.
- Task 116 defines survey response intake and feedback ownership as future scope.
- Task 117 defines Admin visibility as read-only future UX.
- Task 118 preserves existing Case reverse LINE binding compatibility.
- Task 119 keeps AI risk radar advisory only.
- Task 120 freezes the survey roadmap until explicit implementation gates are met.
- Task 121 reviews the Migration 020 proposal with pseudo-DDL only and a no-apply gate.
- Task 122 reviews draft DDL risks and rollout / rollback readiness.

Current invariant baseline remains:

- one Case has one formal Field Service Report,
- one Case can have multiple appointments / visits,
- `finalAppointmentId` is backend/system determined and stable after completion,
- repeat completion is rejected before side effects,
- survey must be Case-level and first-transition based,
- delivery channel choice must be resolved later and cannot be embedded in the completion core.

## Gate Inventory

| Gate | Category | Description | Task123 status |
| --- | --- | --- | --- |
| Survey default policy | Product | Whether future intents are created / deliverable by default. | Closed for migration file authoring; disabled / policy-pending by default. |
| Legacy no-appointment behavior | Product | Whether legacy no-appointment completions can produce survey intent. | Deferred; do not enable by default. |
| Smoke / internal / test suppression | Product / privacy | Prevent non-customer cases from outbound survey. | Closed for migration file authoring as required suppression policy, runtime implementation deferred. |
| Historical backfill | Product / ops | Whether existing completed Cases get intents. | Closed: no automatic backfill by default. |
| Opt-out / consent | Product / privacy | How suppression works before contact preference schema exists. | Deferred; migration can store policy result, but runtime must not send without resolver policy. |
| Contact target | Product | Which person receives survey. | Deferred; not required for inert tables. |
| Pending channel / reverse binding | Product / architecture | How missing channel binding is represented. | Closed for intent lifecycle; delivery remains deferred. |
| Atomicity | Architecture | Whether completion + intent + outbox commit together. | Closed for future runtime recommendation; migration apply still inert. |
| Retention / archival / export | Privacy / ops | Lifetimes and deletion posture. | Partially closed; enough for table shape, exact retention durations deferred. |
| Payload redaction / size | Privacy / runtime | Safe JSON allow-list and bounded errors. | Closed for migration file authoring; runtime enforcement deferred. |
| Outbox scope | Architecture | Generic application outbox vs survey-first outbox. | Closed with limited generic recommendation. |
| Same-organization consistency | DDL / runtime | Tenant consistency across refs. | Partially closed; FK baseline plus runtime validation required. |
| Status lifecycle | DDL / product | Minimal statuses and excluded delivery / response states. | Closed for Migration 020 table shape. |
| Rollout / rollback | Ops | Inert migration, no runtime writes, forward-fix preference. | Closed. |
| Observability | Ops / privacy | Safe metrics only. | Deferred to runtime, but privacy rules are closed. |

## Policy Gate Closure

Recommended policy defaults for Migration 020 readiness:

| Policy area | Recommendation | Gate result |
| --- | --- | --- |
| Survey default | Create no outbound behavior by migration alone. Future runtime may create `pending_policy` intents behind a disabled-by-default feature flag. | Closed for file authoring. |
| Legacy no-appointment Case | Preserve completion compatibility, but do not make legacy no-appointment survey delivery default. If runtime creates an intent, `final_appointment_id` may be null and policy should keep it `pending_policy` or suppressed until product approves. | Deferred product decision before real outbound. |
| Smoke / internal / test Cases | Must be suppressible and must not send real surveys. Suppression reason should use safe code such as `internal_test_case` rather than copied labels or payload. | Closed as required policy. |
| Historical backfill | No automatic historical backfill. Any backfill must be separate, no-send by default, and must not reinterpret `finalAppointmentId`. | Closed. |
| Opt-out / consent | Migration 020 may store intent policy status and suppression code, but contact preference / opt-out source of truth needs a separate task. | Deferred before delivery. |
| Contact target | Do not store mobile / raw channel ids in intent. Future resolver decides customer / contact / requester target from internal references. | Deferred before delivery. |
| Pending channel / reverse binding | `pending_channel` is valid. Existing Case reverse binding may occur after completion; delivery resolver can later decide whether pending intent becomes deliverable. | Closed for table shape; delivery rules deferred. |
| Manual follow-up | Manual follow-up may be a future resolution path, but no Admin send / resend / override exists in Migration 020. | Deferred. |
| High-risk complaint | High-risk cases may be suppressed or reviewed before survey, but AI may only flag risk and cannot approve / send. | Deferred policy; AI boundary closed. |

Policy conclusion:

- Migration file authoring can proceed later with fields that record policy status, suppression code, and safe summary.
- Migration apply must not imply survey is enabled.
- Runtime writes and real outbound remain blocked until policy resolver behavior is designed and implemented.

## Atomicity Gate Closure

Task 123 recommends strict atomic creation for future runtime:

1. The first successful Field Service Report completion transition is the source of truth.
2. If future runtime writes `survey_intents` / `event_outbox`, completion update, survey intent insert, and outbox insert should be in one transaction.
3. If the survey path fails before commit, the completion transaction should fail rather than produce a partially completed Case with no intent / outbox record.
4. Repeat completion 409 must stay before all side effects.
5. Failed completion, no eligible completed visit, and rejected completion must create no survey intent and no outbox event.

Why strict atomic is preferred:

- It best preserves first-transition correctness.
- It prevents later recovery jobs from guessing whether a completed Case should have produced an intent.
- It keeps future survey trigger behavior tied to backend completion, not Admin UI payload or channel state.

Known tradeoff:

- Strict atomic may block completion if future survey insert / outbox insert code fails.
- Product / ops may later prefer completion-first recovery if service completion must never roll back because of survey infrastructure.

Gate result:

- Closed as architectural recommendation for future runtime.
- Migration file authoring can proceed later because inert tables do not enforce runtime atomicity.
- Runtime writes remain blocked until transaction implementation and failure behavior are explicitly implemented and tested.

## Retention / Archival / Export Gate Closure

Retention principles:

- `survey_intents` are Case-level audit records and should not be casually deleted.
- `event_outbox` is operational delivery infrastructure and may need shorter retention after processed / dead state, but exact durations are not decided in Migration 020.
- No `ON DELETE CASCADE` should remove survey intent or outbox history because related Case, report, or appointment records are archived.
- Shared runtime rollback should prefer feature flags and forward-fix migrations, not destructive row cleanup or table drops.

Recommended retention posture for Migration 020:

| Area | Recommendation | Gate result |
| --- | --- | --- |
| `survey_intents` | Preserve as historical Case-level survey intent / policy evidence. | Closed for table shape. |
| `event_outbox` processed rows | Retain long enough for audit / debug, exact duration deferred. | Deferred ops policy. |
| `event_outbox` failed / dead rows | Preserve until resolved or archived by explicit ops policy. | Deferred ops policy. |
| `last_error` | Redacted and bounded, never raw provider payload or stack with secrets. | Closed for migration field requirement; runtime enforcement deferred. |
| Payload retention | Allow-list payload only; no full report / customer / appointment payload. | Closed. |
| Export / audit | Future export must redact contact/channel/sensitive fields. | Deferred. |
| Archival | Use statuses / archival jobs later; do not rely on soft delete for idempotency-bearing rows. | Closed for table shape. |

## Payload / Redaction / Size Gate

Safe payload policy:

- Payload must be allow-list JSON only.
- Payload must contain stable internal IDs and summary fields only.
- Payload must not contain raw customer contact values, raw channel ids, credentials, raw provider payloads, or full domain objects.
- `safe_context_summary` must be an allow-list object, not a copied request / response dump.
- `last_error` must be redacted and bounded by runtime before persistence.

Allowed future event payload fields:

- `eventType`
- `eventVersion`
- `caseId`
- `serviceReportId`
- `finalAppointmentId` nullable
- `completedAt`
- `source`
- `triggeredByType` or safe actor category
- safe channel eligibility summary such as `channelResolutionRequired`
- safe policy version references

Denied fields:

- customer mobile / phone / tel,
- raw LINE user id,
- LINE channel secret / access token,
- APP device token,
- password / token / secret,
- full customer payload,
- full Case payload,
- full Field Service Report payload,
- full appointment payload,
- raw provider request / response payload,
- production data details.

Payload size recommendation:

- Future runtime should enforce a small bounded JSON size before insert.
- Migration 020 may define JSONB object checks, but size limits may need runtime checks or DB constraints based on project convention.

Gate result:

- Closed for migration file authoring.
- Runtime enforcement tests are required before runtime writes.

## Outbox Generic vs Survey-first Gate

Task 123 recommends a limited generic `event_outbox` table with strict initial event allow-list.

Rationale:

- A generic outbox is more reusable for future Case-level events.
- Historical Task123 wording allowed `case.service_completed.first_transition`, but Task128/129 later standardized the current canonical event name to `case.service_completion.first_transitioned`.
- A survey-specific outbox would reduce ambiguity now but likely require generalization later.

Required guardrails if generic outbox is used:

- `event_type` must be allow-listed by future runtime.
- Payload schema must be versioned.
- Initial migration / runtime should only insert survey first-transition events.
- Generic outbox does not mean generic payload dumping.
- Generic outbox does not enable delivery, notification, webhook, or AI runtime.

Gate result:

- Closed for migration file authoring as limited generic recommendation.
- Runtime writes remain blocked until event type allow-list and payload validation are implemented.

## Same-organization / FK Consistency Gate

Tenant consistency requirements:

1. `survey_intents.organization_id` is required.
2. `survey_intents.case_id` must belong to the same organization.
3. `survey_intents.service_report_id` must belong to the same organization and Case.
4. `survey_intents.final_appointment_id`, if present, must belong to the same organization and Case.
5. `event_outbox.organization_id` is required.
6. For first-transition survey events, `event_outbox.aggregate_type` should be `case` and `aggregate_id` should point to the Case.
7. No `ON DELETE CASCADE` should remove historical survey records.

DDL vs runtime recommendation:

- Use normal FKs where they match current migration conventions.
- Do not introduce complex composite FKs unless the existing schema already supports the needed unique parent keys.
- Enforce same-organization and same-Case consistency in future runtime transaction before insert.
- If later migration conventions add composite unique keys, composite FKs can be reconsidered.

Gate result:

- Partially closed.
- Migration file authoring can proceed with normal FKs plus documented runtime consistency guard.
- Migration apply is acceptable only if docs make clear that DDL alone does not fully enforce cross-table tenant consistency.
- Runtime writes remain blocked until service-layer validation exists.

## Status Lifecycle Gate

Recommended minimal `survey_intents` statuses for Migration 020:

- `pending_policy`
- `channel_resolution_pending`
- `pending_channel`
- `suppressed`
- `not_deliverable`
- `ready_for_delivery`
- `expired`
- `cancelled`

Excluded from Migration 020 unless delivery / response scope expands:

- `sent`
- `answered`
- provider attempt statuses
- response statuses

Recommended minimal `event_outbox` statuses:

- `pending`
- `processing`
- `processed`
- `failed`
- `dead`
- `skipped`

Status principles:

- Intent lifecycle is not delivery attempt lifecycle.
- Response lifecycle belongs to a future response / feedback table.
- Provider delivery result belongs to a future delivery attempt table.
- No-event paths are not suppression reasons. For example repeat completion 409 and rejected completion simply create no intent / event.
- Use text with CHECK constraints initially unless project migration conventions strongly prefer DB enums.

Gate result:

- Closed for Migration 020 file authoring plan.

## Rollout / Rollback Gate

Required rollout posture:

1. Feature flag default disabled.
2. Migration apply creates inert tables only.
3. No runtime writes until explicit runtime task.
4. No survey sending until explicit delivery task.
5. No historical backfill.
6. No Admin/API/smoke behavior changes from migration apply alone.
7. No shared runtime destructive rollback.
8. Forward-fix preferred.
9. Inert tables may remain if migration applies but runtime stays disabled.
10. Rollback, if needed, must be a separate explicit task.
11. Post-migration verification should be schema-only safe summary.
12. Logs and reports must not include sensitive values.

Gate result:

- Closed.
- This supports a later no-apply migration file authoring plan, but not migration apply in Task 123.

## Observability Gate

Future safe metrics only:

- survey intent insert count,
- idempotency conflict count,
- outbox insert count,
- outbox pending count,
- outbox failed / dead count,
- outbox lock timeout count,
- pending-channel count if resolver exists,
- suppressed count by safe suppression code.

Metrics must not use labels containing:

- customer ids,
- customer mobile / phone / tel,
- raw LINE user id,
- APP device token,
- full payload snippets,
- report text,
- free-form customer feedback.

Gate result:

- Privacy rules closed.
- Actual metric implementation deferred to runtime / ops tasks.

## Gate Closure Matrix

| Gate | Task122 status | Task123 recommendation | Closed / Deferred / Blocking | Required before migration file authoring | Required before migration apply | Required before runtime writes | Required before real outbound | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Survey default | Open | Disabled / policy-pending default. | Closed | Yes | Yes | Yes | Yes | Migration alone must not enable surveys. |
| Legacy no-appointment | Open | Keep nullable support, do not deliver by default. | Deferred | No | No | Yes | Yes | Product must decide if legacy completions get surveys. |
| Smoke/internal/test | Open | Required suppression policy. | Closed | Yes | Yes | Yes | Yes | Runtime must enforce before outbound. |
| Historical backfill | Open | No automatic backfill. | Closed | Yes | Yes | Yes | Yes | Separate no-send task if ever needed. |
| Opt-out | Open | Store policy result, source of truth deferred. | Deferred | No | No | Yes | Yes | Delivery blocked until contact preference policy exists. |
| Contact target | Open | Resolver decides later; no contact values stored. | Deferred | No | No | Yes | Yes | Do not embed mobile or raw channel ids. |
| Pending channel / reverse binding | Open | `pending_channel` allowed. | Closed | Yes | Yes | Yes | Yes | Delivery timing after late binding remains open. |
| Atomicity | Open | Strict atomic runtime transaction recommended. | Closed | No | No | Yes | Yes | Inert tables do not need transaction code yet. |
| Retention durations | Open | Preserve records; exact durations deferred. | Deferred | No | No | No | Yes | Required before cleanup / archival jobs. |
| Archival posture | Open | No normal soft delete for idempotency rows. | Closed | Yes | Yes | Yes | Yes | Status/archival over delete. |
| Payload allow-list | Open | Required allow-list JSON and deny-list. | Closed | Yes | Yes | Yes | Yes | Runtime tests needed before writes. |
| Payload size | Open | Bound in runtime or DB by convention. | Deferred | No | No | Yes | Yes | Do not log payload. |
| Last error | Open | Bounded redacted text only. | Closed | Yes | Yes | Yes | Yes | Runtime must sanitize. |
| Outbox scope | Open | Limited generic outbox with strict initial allow-list. | Closed | Yes | Yes | Yes | Yes | Does not authorize generic payload dumping. |
| Same-organization consistency | Open | Normal FK plus runtime tenant / Case validation. | Deferred | No | Yes | Yes | Yes | Composite FK can be revisited. |
| No cascade delete | Open | Avoid ON DELETE CASCADE. | Closed | Yes | Yes | Yes | Yes | Historical preservation. |
| Status lifecycle | Open | Minimal statuses, delivery/response excluded. | Closed | Yes | Yes | Yes | Yes | Text + CHECK preferred initially. |
| Rollout flag | Open | Disabled by default. | Closed | No | Yes | Yes | Yes | Migration must stay inert. |
| Rollback | Open | Forward-fix, no destructive shared rollback. | Closed | No | Yes | Yes | Yes | Drop/delete requires separate explicit task. |
| Observability | Open | Safe metrics only, no payload logs. | Deferred | No | No | Yes | Yes | Implementation deferred. |

## Product / Ops Handoff Questions

These questions do not block migration file authoring plan, but they block runtime writes or real outbound delivery:

1. Should legacy no-appointment completed Cases ever receive surveys?
2. Which customer/contact/requester identity should be the survey target?
3. What is the contact preference / opt-out source of truth?
4. Should pending-channel intents expire, wait indefinitely, or require manual follow-up?
5. If LINE binding happens after completion, how long can an intent remain deliverable?
6. Should high-risk complaint / repeat repair Cases be suppressed or routed to manager review first?
7. What retention duration applies to processed outbox rows?
8. What retention duration applies to failed / dead outbox rows and redacted errors?
9. Should generic `event_outbox` be used beyond surveys in the next roadmap phase?
10. What safe observability dashboards are needed before delivery launch?

## Final Recommendation

Task 123 recommendation:

- Task124 can proceed to a migration file authoring plan / no-apply review.
- Task124 should not apply Migration 020.
- Task124 should not enable runtime writes.
- Task124 should not implement survey sending or delivery resolution.
- Migration apply remains blocked until exact DDL, migration naming convention, FK/index names, and no-apply verification steps are reviewed.
- Runtime writes remain blocked until transaction, policy resolver, payload validation, and idempotency conflict handling are implemented and tested.
- Real outbound remains blocked until channel resolver, contact preference / opt-out, delivery attempt tracking, template versioning, and redaction policy are implemented.

Recommended next task:

Task 124 - Survey Intent / Event Outbox Migration 020 File Authoring Plan / No Apply.

## Non-goals

Task 123 does not:

- create Migration 020,
- apply any migration,
- execute DDL,
- modify DB schema,
- add indexes,
- change runtime behavior,
- change completion endpoint behavior,
- change backend inference ordering,
- change repeat completion 409 guard,
- change supplied `finalAppointmentId` validation,
- change API contract,
- change Admin UI,
- change smoke scripts,
- add survey sending,
- add notification sending,
- add LINE / APP / SMS / email delivery,
- add delivery resolver runtime,
- add outbox worker,
- add survey response intake,
- add survey link / token generation,
- add Admin survey dashboard,
- add Admin send / resend / override,
- add manual `finalAppointmentId` picker,
- add AI runtime or AI automatic decision,
- make survey appointment-level,
- allow multiple formal Field Service Reports per Case,
- hard-code LINE into completion core or survey trigger,
- modify Task 087 inventory guide,
- expand inventory docs,
- perform destructive cleanup.

## Verification Summary

Suggested verification for this docs-only task:

- `npm run check`
- `npm run admin:check` if project convention expects it for documentation changes
- `git diff --check`
- sensitive information scan over the new design note

No smoke, inventory verification, shared DB verification, psql, migration apply, or runtime tests are required for Task 123.
