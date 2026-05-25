# Task 114 - Survey Delivery Resolver / Channel Selection Design

## Background And Constraints

Task 114 defines future survey delivery resolver and channel selection boundaries.

Task 114 is documentation-only:

- no runtime resolver,
- no migration,
- no schema or index change,
- no LINE / APP / SMS / email sending,
- no notification sending,
- no Admin UI,
- no API change,
- no AI automatic decision,
- no inventory docs expansion.

Current foundations:

- Survey intent is created from Case-level first successful Field Service Report completion only when future policy permits.
- Delivery resolver operates after survey intent exists.
- Delivery resolver must not create first-transition intent.
- Delivery resolver must not mutate Case / Report completion or `finalAppointmentId`.
- Delivery resolver must not require LINE at completion time.

## Resolver Purpose

The delivery resolver answers:

> Given an existing survey intent, what should happen next for delivery?

It does not answer:

- whether completion succeeded,
- whether `finalAppointmentId` should be inferred,
- whether a survey intent should be created,
- whether a Case should be completed,
- whether AI thinks the Case is high risk.

## Resolver Input Contract

Future resolver input should be internal and minimal:

- `surveyIntentId`
- `organizationId`
- `caseId`
- `serviceReportId`
- nullable `finalAppointmentId`
- `intentCreatedAt`
- `completedAt`
- `surveyExpiresAt` or expiration policy summary
- `intentStatus`
- `channelBindingState`
- `contactEligibilityState`
- survey / eligibility / channel policy version summary
- internal customer / contact reference if needed
- runtime context summary such as production / test / smoke / internal-only
- suppression reason summary if already known

Resolver input must not include:

- customer mobile / phone / tel,
- raw LINE user id,
- raw APP device token,
- customer email address,
- channel secret / access token,
- full customer object,
- full Case object,
- full report object,
- full appointment object,
- raw provider payload.

Resolver may query current channel binding using internal IDs. Raw provider identity must stay in channel identity layer and must not be copied into survey intent / outbox payload.

## Resolver Output Contract

Recommended output states:

- `resolution_pending`
- `pending_channel`
- `not_deliverable`
- `suppressed`
- `manual_follow_up_required`
- `ready_for_channel_delivery`
- `expired`

Recommended output fields:

- `decisionStatus`
- `decisionReasonCode`
- `selectedChannelType` nullable
- `channelRouteRef` nullable opaque internal reference
- `nextAttemptAt` nullable
- `expiresAt` nullable
- `policyVersionUsed`
- `safeDecisionSummary`

Output must not include raw contact values, raw LINE user id, provider secrets, or full provider payload.

`channelRouteRef` must be an opaque internal reference, not a raw LINE user id, phone number, email address, APP device token, or provider identifier.

Provider delivery statuses such as sent, failed, delivered, read, clicked, or answered are not resolver output states. They belong to delivery attempt / notification log layers.

## Channel Options

Future channels may include:

- LINE
- own APP
- SMS
- email
- admin manual follow-up
- no channel available

Channel priority is a product policy decision, not a completion-flow decision.

Recommended default priority remains undecided until product confirms:

1. own APP if authenticated and enabled,
2. LINE if bound and allowed,
3. SMS / email if future product enables them,
4. admin manual follow-up,
5. not deliverable / pending channel.

This order is only a placeholder. Task 114 does not finalize channel priority.

## No-channel Handling

No-channel means no currently deliverable approved channel exists.

Valid future outcomes:

- `pending_channel`: keep intent open until channel binding arrives or survey expires.
- `not_deliverable`: close delivery eligibility without sending.
- `suppressed`: suppress by policy.
- `manual_follow_up_required`: assign admin / customer service follow-up.

No-channel must not:

- fail Case completion,
- delete survey intent,
- create a new survey intent,
- create a fake channel identity,
- expose customer contact values in logs,
- assume LINE is required.

Task 118 will decide how reverse LINE / APP binding after completion can change `pending_channel` to deliverable.

No-channel should not automatically mean suppressed. It may remain `pending_channel` until survey expiration or until product policy decides otherwise.

## Delivery Resolver And Notification Logs

Resolver may later create or trigger delivery attempts, but only after:

1. a survey intent exists,
2. policy permits delivery,
3. a channel is selected,
4. a channel adapter is invoked by a future delivery layer.

`notification_logs` should record provider delivery attempts / results only after channel resolution.

Lack of notification log does not mean lack of survey intent.

A notification log may exist only after a channel-specific delivery attempt is made. Lack of notification log does not imply lack of survey intent, resolver decision, pending channel, suppression, or not-deliverable state.

## Channel Identity Boundary

LINE identity rules:

- Do not store raw LINE user id in survey intent.
- Do not store raw LINE user id in outbox payload.
- Resolver may look up current active customer LINE identity by internal Case / Customer reference and organization scope.
- Resolver must respect `organization_id + line_channel_id + line_user_id` scope.
- Resolver must not use global `line_user_id` lookup.

APP / future channel rules:

- APP device or account identity should be resolved by internal binding layer.
- Raw device tokens must not enter survey intent / outbox payload.
- Channel delivery adapters own provider-specific details.

## Resolver Non-goals

Resolver must not:

- send messages directly,
- write notification logs as if delivery occurred,
- choose `finalAppointmentId`,
- mutate completed Field Service Report,
- mutate completed Case,
- create survey intent,
- create event outbox first-transition event,
- decide policy using AI,
- override opt-out,
- expose raw channel identity,
- require LINE for all survey delivery.

AI may not select delivery channel, mark an intent deliverable, suppress delivery, require manual follow-up, or trigger provider sending automatically. Any AI risk hint remains advisory only and is deferred to Task 119.

## Future Test Plan

Future resolver tests should cover:

- survey intent with LINE bound resolves to LINE only if policy permits,
- survey intent with APP bound resolves to APP only if policy permits,
- no-channel intent remains pending / suppressed according to policy,
- opt-out suppresses delivery,
- expired survey is not delivered,
- resolver never creates first-transition intent,
- resolver never mutates Case / Report / finalAppointmentId,
- resolver output excludes customer mobile and raw LINE user id,
- delivery retry does not create new intent,
- reverse binding can later make pending intent deliverable if Task 118 policy allows.

## Open Questions

1. What is the channel priority order?
2. Should own APP outrank LINE when both are available?
3. Is SMS / email in scope for first implementation?
4. How long can `pending_channel` remain pending?
5. Should no-channel become manual follow-up or not deliverable by default?
6. Which opt-out layer wins: customer, channel, organization, or survey category?
7. Should high-risk complaint Cases always become manual follow-up?
8. Should resolver use policy version from intent creation time or delivery time?
9. Can resolver re-run after reverse LINE binding if the survey has not expired?

## Task 114 Decision

Delivery resolver is a post-intent, channel-agnostic policy layer. It must not send messages, must not create first-transition triggers, and must not mutate completion state.

Recommended next Task:

- Task 115 should define survey content / versioning / template contract without adding template rows or delivery implementation.

## ChatGPT Design Review Integration

The project ChatGPT branch reviewed Task 114 as part of the Codex / ChatGPT workflow.

Review outcome:

- The resolver boundary is correct and remains channel-agnostic.
- The output state `delivery_pending` was replaced with `resolution_pending` to avoid implying provider queue / send behavior.
- Resolver input and output are now explicitly allow-list summaries and opaque internal references only.
- The notification log boundary was strengthened: notification logs represent provider attempts/results only.
- No-channel remains a Task 118 dependency and is not treated as automatically suppressed.
- AI channel selection / delivery decisions remain out of scope and deferred to advisory-only Task 119 boundaries.
