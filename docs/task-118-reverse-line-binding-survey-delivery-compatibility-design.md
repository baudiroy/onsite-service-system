# Task 118 - Reverse LINE Binding Compatibility For Survey Delivery Design

## Background And Constraints

Task 118 defines how future post-completion survey delivery remains compatible with existing Case reverse LINE / APP binding.

Task 118 is documentation-only:

- no reverse binding implementation,
- no survey delivery implementation,
- no migration,
- no schema or index change,
- no runtime behavior change,
- no LINE / APP push,
- no API change,
- no Admin UI,
- no AI automatic decision,
- no inventory docs expansion.

## Core Principle

Survey trigger and survey delivery are separate.

A Case can complete and create a future survey intent before the customer has a deliverable channel binding. Later LINE / APP binding may make the existing intent deliverable if product policy allows it.

Reverse binding must not:

- create a new first-transition survey intent,
- change the original trigger time,
- change the idempotency key,
- re-infer `finalAppointmentId`,
- mutate completed Case / Report,
- expose raw LINE user id in survey intent / outbox payload.

Reverse binding may change a survey intent's delivery eligibility decision, but it must not change the original first-transition trigger, idempotency key, completedAt, serviceReportId, `finalAppointmentId`, Case, or Field Service Report.

## Completion-time No-channel State

If no deliverable channel exists at completion time, future policy may choose:

- no intent,
- suppressed intent,
- `pending_channel` intent,
- manual follow-up required.

Task 118 recommends preserving `pending_channel` as a valid design option until expiration when product wants post-completion binding to make delivery possible.

`pending_channel` is allowed only when:

- survey policy is enabled,
- a valid survey intent already exists,
- the intent is not suppressed,
- the customer / contact has not opted out,
- the survey is not expired,
- no deliverable channel currently exists,
- product policy allows waiting for future channel binding.

`pending_channel` must have an expiration or delivery-window policy. It must not remain pending forever by default.

## Reverse Binding Event Impact

When customer later binds LINE / APP:

Allowed future behavior:

- delivery resolver may re-evaluate existing pending survey intent,
- resolver may change delivery eligibility if policy allows,
- resolver may select newly available channel,
- resolver may keep intent pending / suppressed / expired according to policy.

Reverse binding can make an intent deliverable only before survey expiration / delivery window close and only if survey version / policy still permits delivery.

Forbidden behavior:

- recreate first-transition event,
- create duplicate survey intent,
- create new idempotency key,
- overwrite `finalAppointmentId`,
- update completed timestamps,
- send survey without resolver / opt-out / policy checks,
- store raw LINE user id in survey intent / outbox.

A new channel binding does not bypass suppression, opt-out, manual follow-up policy, smoke/internal/test policy, legacy no-appointment disabled policy, or contact eligibility rules.

## LINE Scope Boundary

LINE binding must respect:

- `organization_id`
- `line_channel_id`
- `line_user_id`

Survey layers should use internal identity references and state summaries only.

Reverse binding must be resolved through trusted internal customer / contact / channel identity relationships within the same organization. A new LINE / APP binding must not make unrelated or cross-organization survey intents deliverable.

Do not:

- globally bind by raw `line_user_id`,
- put raw `line_user_id` into survey payload,
- put raw `line_user_id` into handoff reports,
- expose LINE channel secret / access token,
- make Case completion depend on LINE binding.

Survey intent, resolver decision, outbox payload, Admin handoff, and logs must not contain raw LINE user id, customer mobile, APP device token, provider payload, or credentials.

## Pending Intent Expiration

Open policy choices:

- pending until survey expiration,
- pending for shorter channel-binding window,
- pending indefinitely until manual review,
- suppress immediately if no channel exists,
- not deliverable immediately if no channel exists.

Recommendation:

- default to pending until survey expiration if survey policy wants reverse binding compatibility,
- otherwise suppress / not deliverable by explicit policy.

## Delivery Resolver Re-run

Future resolver may be triggered by:

- scheduled retry,
- new channel binding event,
- admin review,
- policy re-evaluation,
- manual follow-up workflow.

Resolver re-run must not:

- create new first-transition intent,
- mutate completion,
- bypass opt-out,
- bypass expiration,
- send without delivery adapter,
- expose raw channel identity.

Scheduled retry, binding event, admin review, and policy re-evaluation may re-run resolver. They must not create duplicate first-transition intents, duplicate outbox events, duplicate delivery requests, or mutate completion state.

## Existing Case Compatibility

Existing Case does not need to originate from LINE.

Future survey delivery should support:

- Case created by phone / admin / external channel,
- Case completed before LINE binding,
- customer later binds LINE,
- resolver sees binding and may deliver if intent is pending and not expired.

This preserves the future existing-case reverse LINE binding flow.

## Future Test Plan

Future tests should cover:

- completed Case with no channel creates pending intent only if policy allows,
- reverse LINE binding after completion does not create duplicate intent,
- reverse binding does not change idempotency key,
- reverse binding does not change `finalAppointmentId`,
- pending intent can become deliverable only if not expired and policy allows,
- expired intent remains expired even after binding,
- raw LINE user id is excluded from intent/outbox/admin summary,
- organization / channel scope is enforced.

## Open Questions

1. Should pending-channel survey remain pending until survey expiration or a shorter channel-binding window?
2. Should reverse binding after expiration allow manual follow-up only?
3. Should binding event automatically enqueue resolver re-run, or should resolver run on schedule?
4. Should no-channel default be pending, suppressed, or not deliverable?
5. Should APP binding follow the same pending policy as LINE binding?
6. Should customer opt-out be checked before or after reverse binding?
7. Should pending-channel intent be visible in Admin dashboard?
8. Should smoke/internal/test reverse binding ever create suppressed internal-only delivery evaluation?
9. Which contact target receives the survey when a Case has multiple contacts?
10. How should resolver choose when a customer has multiple LINE / APP bindings?
11. Should channel priority remain the same after reverse binding as it is for completion-time binding?

## Task 118 Decision

Reverse LINE / APP binding after completion may make an existing pending survey intent deliverable only through future resolver and policy checks. It must not recreate trigger, mutate completion, or expose raw channel identity.

Recommended next Task:

- Task 119 should define AI risk radar integration boundaries for survey feedback.

## ChatGPT Design Review Integration

The project ChatGPT branch reviewed Task 118 as part of the Codex / ChatGPT workflow.

Review outcome:

- Reverse binding compatibility is correct and preserves trigger / delivery separation.
- `pending_channel` is now policy-gated and expiration-bounded, not an indefinite default.
- Reverse binding must validate same organization and correct customer / contact relationship.
- New channel binding cannot bypass opt-out, suppression, smoke/internal/test policy, manual follow-up policy, or legacy no-appointment disabled policy.
- Resolver re-run must be idempotent and must not create duplicate first-transition intent, outbox event, delivery request, or completion mutation.
