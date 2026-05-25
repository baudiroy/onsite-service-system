# Task 110 - Post-completion Survey Trigger First-transition Design

## Background And Constraints

This design defines the future first-transition trigger contract for post-completion customer satisfaction surveys.

Task 110 is design / documentation only:

- no survey sending,
- no survey table,
- no event outbox,
- no migration,
- no schema or index change,
- no runtime behavior change,
- no notification sending,
- no LINE push,
- no APP push,
- no AI automatic decision,
- no inventory docs expansion.

Current completion foundations:

- One Case has one formal Field Service Report.
- One Case may have multiple appointments / dispatch visits.
- `finalAppointmentId` is resolved by backend / system and stored on the completed report.
- Task 109 rejects repeat completion before mutation, final appointment inference, case update, timeline message creation, or audit creation.
- Completed report `finalAppointmentId`, report completion timestamp, and Case completion timestamp must remain stable after first completion.

## Completion Flow Review

The current backend first successful completion transition is centered in `FieldServiceReportService.completeServiceReport`.

The current flow is:

1. Load the existing Field Service Report.
2. Check actor access to the Case.
3. Reject if `existing.service_status` is already `completed`.
4. Resolve / validate `finalAppointmentId`.
5. Update the Field Service Report to `completed` and set `onsite_completed_at`.
6. Update the Case service summary to `completed` and set `completed_at`.
7. Write a workflow timeline message.
8. Write an audit record.
9. Return the completed report DTO.

Task 109 places the already-completed guard before step 4. This means repeat completion cannot re-infer `finalAppointmentId`, overwrite completion timestamps, update the Case, create timeline / audit side effects, or become a post-completion manual override path.

There is no current survey placeholder, survey event, survey outbox, webhook, or notification trigger tied to service report completion. Notification foundations exist, and LINE services exist separately, but core Case / Report completion is not LINE-specific.

## First-transition Definition

Survey first-transition means the first durable backend transition where the Case-level Field Service Report moves from a non-completed state to `completed`.

Survey trigger eligibility exists only when all of the following are true:

1. The Field Service Report was not `completed` before the request.
2. The completion request passes final appointment resolution / validation.
3. `finalAppointmentId` is stored on the completed report, or a legacy no-appointment completion policy explicitly allows `null`.
4. Report `onsiteCompletedAt` / completion timestamp is set for the first time.
5. Case completion update succeeds.
6. Case `completedAt` is set for the first time or remains consistent with the first successful completion.
7. The write transaction / durable completion flow succeeds.
8. The request is not an already-completed repeat request.
9. The request is not a rejected completion.
10. The request is not a post-completion edit, reopen attempt, manual correction flow, or AI decision.

The following must not trigger survey:

- repeat completion rejected with conflict,
- completion retry that receives conflict,
- no eligible completed visit rejection,
- cross-case or non-completed supplied final appointment rejection,
- failed transaction / rollback,
- report content update after completion,
- completed report reopen attempt,
- manual correction flow if one is designed later,
- AI suggestion / risk flag.

`finalAppointmentId` must not be re-inferred just for survey.

## Source Of Truth

Recommended source of truth:

- Trigger source: first successful backend Field Service Report completion transition.
- Survey context: Case-level completion context.
- Final visit context: the completed report's stored `finalAppointmentId`.
- Appointment history: can be referenced later for display and analysis, but survey intent is not created per appointment.
- Frontend: does not decide survey trigger and does not send survey fields.
- Channel identity: not required at completion time.
- AI: may later suggest risk or missing fields, but does not decide survey trigger.

Trigger boundary recommendation:

- Prefer the Field Service Report status transition as the primary boundary.
- Combine it with stored report completion timestamp, stored `finalAppointmentId`, and successful Case completion update.
- Treat Case `completedAt` as part of the consistency guard, not as the only trigger source.
- If report completion succeeds but Case update fails, there is no successful first-transition for survey purposes.
- Future implementation should record the survey intent / outbox event in the same transaction as the completion update, or only after the completion transaction commits successfully.

## Event Contract Recommendation

Recommended event name:

```text
case.service_completion.first_transitioned
```

Reasoning:

- It is Case-level, matching the customer experience and one-report-per-Case invariant.
- It describes a domain event that already happened.
- It does not imply a survey was sent.
- It does not bind delivery to LINE, APP, SMS, email, or any specific channel.
- It avoids appointment-level or report-per-visit semantics.

Historical alternative reviewed before Task128, not the current recommendation:

```text
case.service_completed.first_transition
```

Current runtime, migration, and test recommendations should use
`case.service_completion.first_transitioned`.

Avoid event names such as:

- `survey.sent`,
- `line.survey.push`,
- `appointment.completed.survey`,
- `field_service_report.completed.per_visit`.

Those names bind too early to delivery, LINE, or appointment-level semantics.

## Safe Payload Policy

Future event payload should be minimal, stable, and safe.

Recommended payload shape:

```json
{
  "eventType": "case.service_completion.first_transitioned",
  "eventVersion": 1,
  "eventId": "<event-or-outbox-id>",
  "idempotencyKey": "survey:first-completion:case:<caseId>:report:<serviceReportId>",
  "caseId": "<case-id>",
  "serviceReportId": "<service-report-id>",
  "finalAppointmentId": "<appointment-id-or-null>",
  "completedAt": "<persisted-completion-time>",
  "source": "backend",
  "channelBindingState": "none|line_bound|app_bound|multiple|unknown",
  "contactEligibilityState": "unknown|eligible|not_eligible|pending_policy",
  "actorType": "admin|system|unknown",
  "createdAt": "<event-created-time>"
}
```

Payload rules:

- `eventType` and `eventVersion` define the payload schema.
- `eventId` identifies a concrete event / outbox record.
- `idempotencyKey` is deterministic and used for dedupe.
- `completedAt` is the persisted service completion timestamp, not the event creation timestamp.
- `channelBindingState` and `contactEligibilityState` should be enum-style summaries, not free-text payload dumps.
- `actorType` may be included as a non-sensitive summary; do not include operator email, name, phone, or full user object.

Payload must not include:

- customer mobile / phone / tel,
- raw LINE user id,
- LINE channel secret / access token,
- token / secret / password,
- DATABASE_URL,
- full payload / raw payload,
- full customer object,
- full appointment object,
- full report object,
- full request body,
- full response body,
- customer address,
- operator personal identity,
- AI raw payload.

## Idempotency And Dedupe Design

Recommended idempotency key:

```text
survey:first-completion:case:<caseId>:report:<serviceReportId>
```

Rules:

- Repeat completion rejected by Task 109 does not produce an event.
- Future dispatcher / outbox should dedupe by `idempotencyKey`.
- Future survey table / event outbox should have a uniqueness policy around the idempotency key, but Task 110 does not add schema.
- Do not include `finalAppointmentId` in the idempotency key.
- Do not include `completedAt` in the idempotency key.
- Do not include delivery channel in the idempotency key.
- Do not conflate `eventId` with `idempotencyKey`.

Reasoning:

- Case + service report identity is stable for the formal completion context.
- `finalAppointmentId` is context, not the identity of the survey trigger.
- Completion timestamp may drift in retry / correction scenarios and should not create duplicate intent.
- Delivery channel may be resolved later and may change from LINE to APP, SMS, email, or admin follow-up.

Concurrency note:

- Future implementation should detect first-transition with an atomic state transition, row-level lock, conditional update, or equivalent transaction guard.
- Two near-simultaneous completion requests must produce at most one successful first-transition and at most one survey intent.

## Channel Abstraction Design

Survey trigger event is not a delivery command.

Principles:

1. Completion first-transition records a channel-agnostic event / intent only.
2. Delivery channel resolution belongs to a future survey delivery layer.
3. Delivery resolver may choose LINE, own APP, SMS, email, admin manual follow-up, or not deliverable.
4. Trigger payload must not contain raw LINE user id.
5. Trigger payload must not contain channel secrets or access tokens.
6. Survey eligibility should not require the Case to originate from LINE.
7. Core Case / Report completion must not hard-code LINE.
8. Admin handoff must not paste raw channel ids.

If no channel is available at completion time, future implementation may create a pending survey intent with `channelBindingState = none` or `unknown`. Delivery can remain pending or not deliverable according to later policy.

## Existing Case Reverse LINE Binding Compatibility

The survey design must remain compatible with existing Case / Customer reverse LINE binding.

Compatibility rules:

- Survey event uses internal Case / Customer references, not raw LINE user id.
- Existing Case / Customer may be bound to LINE before or after completion.
- Delivery resolver should query current channel bindings at send time.
- Completion API should not change when LINE binding is added.
- If binding happens after completion, future product policy must decide whether a pending survey can become deliverable later.
- Task 110 does not implement reverse binding, binding token, or LINE delivery.

Open product question:

- Should a survey intent created before LINE binding remain pending and become deliverable after binding, or expire / suppress if not deliverable at completion time?

## Legacy No-appointment Case Recommendation

The event contract supports `finalAppointmentId = null` for legacy no-appointment cases, but survey triggering should not be enabled by default for those cases until product policy explicitly allows it.

Recommendation:

- Default policy: do not automatically trigger survey for legacy no-appointment cases.
- Design allowance: future product policy may enable it when customer/contact eligibility exists.
- If enabled, the survey context remains Case-level and must not create a fake appointment.

Possible future policy gates:

- case is formally completed,
- case is not smoke / internal / test,
- case type is surveyable,
- customer/contact eligibility exists,
- no opt-out / suppression policy blocks delivery,
- product explicitly enables legacy no-appointment survey.

## Survey Lifecycle Sketch

Future lifecycle states may include:

1. `completion_first_transition_detected`
2. `survey_intent_created`
3. `channel_resolution_pending`
4. `deliverable`
5. `not_deliverable`
6. `sent`
7. `answered`
8. `expired`
9. `suppressed`
10. `opted_out`

These are future design states only. Task 110 does not add a survey state machine, table, migration, route, notification dispatcher, or delivery worker.

## Admin Frontend Impact

Task 110 requires no Admin Frontend behavior change.

Expected future behavior:

- Admin Frontend does not send survey trigger fields.
- Admin completion payload continues to omit `finalAppointmentId`.
- Backend completion first-transition is the source of truth.
- Admin UI does not add a survey send button.
- Admin UI does not add survey status until a future survey feature implements it.
- Admin UI does not add a final appointment manual picker.
- Admin UI does not allow operator override of survey trigger.
- Repeat completion conflict uses existing safe error handling.
- No eligible completed visit rejection does not trigger survey.

## Future Test Plan

These are future implementation tests, not Task 110 runtime tests.

First-transition correctness:

- First successful completion emits exactly one survey event / intent.
- Backend-inferred `finalAppointmentId` completion emits exactly one event / intent.
- Supplied same-Case completed `finalAppointmentId` before first completion emits exactly one event / intent.
- Event payload uses the stored completed report `finalAppointmentId`.
- Event payload uses the persisted completion timestamp.

No-event paths:

- Repeat completion conflict emits no survey event.
- Repeat completion with different supplied `finalAppointmentId` emits no survey event and cannot override.
- No eligible completed visit rejection emits no survey event.
- Cross-Case `finalAppointmentId` rejection emits no survey event.
- Non-completed visit result rejection emits no survey event.
- Completed report update / edit emits no survey event.
- Reopen attempt emits no survey event.
- Failed Case completion update emits no survey event.
- Transaction rollback emits no survey event.

Idempotency / concurrency:

- Two concurrent completion requests create at most one survey intent.
- Dispatcher retry with the same idempotency key creates no duplicate intent.
- Event outbox replay creates no duplicate survey intent.
- Idempotency key does not change when payload `finalAppointmentId` or `completedAt` changes.
- Delivery retry does not create a second survey intent.

Payload safety:

- Event payload excludes customer mobile / phone / tel.
- Event payload excludes raw LINE user id.
- Event payload excludes LINE secret / access token.
- Event payload excludes full customer / appointment / report payload.
- Event payload excludes admin email / operator personal identity.
- Event payload uses enum-style channel and contact eligibility summaries.

Channel abstraction:

- LINE-originated Case completion produces the same channel-agnostic event type.
- Non-LINE Case completion produces the same channel-agnostic event type.
- No channel binding at completion can still record pending / unknown channel state if policy allows.
- Reverse LINE binding after completion does not require changing completion API.
- APP channel binding can be resolved later without changing completion API.
- Multi-channel fallback priority is resolved by delivery policy, not trigger policy.

Legacy no-appointment policy:

- Policy disabled: legacy no-appointment completion emits no survey event.
- Policy enabled and contact eligible: legacy no-appointment completion emits one event with `finalAppointmentId = null`.
- Policy enabled but contact not eligible: future product policy decides between suppressed / not-deliverable intent and no intent.
- No fake appointment is created.

Survey lifecycle:

- Survey intent may remain `channel_resolution_pending`.
- `not_deliverable`, `suppressed`, or `opted_out` does not affect Case / Report completion.
- Answered survey attaches primarily to Case and references serviceReportId / finalAppointmentId.
- Expired survey does not require repeating completion.
- Survey resend / reminder does not retrigger completion event.

Smoke / internal suppression:

- Smoke / test Case completion must not send real outbound survey.
- Shared runtime smoke must not trigger real outbound notification.
- If a test event is recorded in a future controlled test environment, it must be marked internal / suppressed by policy.

## Open Questions

1. Should legacy no-appointment cases ever trigger survey by default, or only under explicit policy?
2. Should survey be sent to customer, contact person, case requester, or a role determined by organization policy?
3. Should survey be sent immediately, after N minutes, or on a schedule?
4. What is the survey expiration period?
5. Is resend / reminder allowed?
6. What is the opt-out / suppression policy?
7. What is the multi-channel fallback priority?
8. How should survey content and versioning be managed?
9. Should survey results attach primarily to Case, Customer, Report, or multiple references?
10. Should smoke / internal / test cases be suppressed by default?
11. If customer identity is bound after completion, can pending survey later become deliverable?
12. How should future reopen / correction flows affect survey state, if such flows are ever added?
13. Should high-risk complaint cases suppress automated delivery and require admin follow-up instead?

## Non-goals

Task 110 does not:

- implement survey sending,
- implement survey table,
- implement event outbox,
- implement notification dispatcher,
- send LINE / APP / SMS / email,
- add migration,
- change schema or indexes,
- change completion endpoint behavior,
- change backend inference ordering,
- weaken repeat completion conflict guard,
- weaken supplied final appointment validation,
- add AI automatic decision,
- let AI decide whether to send survey,
- add Admin survey send button,
- add final appointment manual picker,
- add manual correction UI,
- add manual override endpoint,
- create multiple formal Field Service Reports per Case,
- hard-code LINE into core completion,
- implement reverse LINE binding,
- expand inventory docs,
- mutate shared runtime data,
- output sensitive data.

## Migration / Schema Decision

No migration, schema change, or index change is required for Task 110.

Future implementation will likely need a dedicated survey intent table, event outbox, or both. That must be designed in a separate migration / schema task.

## Task 111 Cross-reference

Task 111 continues this design with a future survey intent / event outbox schema proposal and transaction boundary review.

Task 111 remains documentation-only and does not add migration, schema, index, runtime behavior, survey sending, notification sending, LINE push, APP push, or inventory documentation changes.

## Runtime Decision

No runtime behavior changes are made in Task 110.

Future implementation should add survey intent / outbox recording only after the first-transition contract is approved, and should keep external delivery outside the completion transaction.
