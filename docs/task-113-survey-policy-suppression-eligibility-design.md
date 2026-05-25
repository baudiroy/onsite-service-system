# Task 113 - Survey Policy / Suppression / Eligibility Design

## Background And Constraints

Task 113 defines future survey policy, suppression, and eligibility boundaries.

Task 113 is documentation-only:

- no migration,
- no schema or index change,
- no runtime behavior change,
- no survey sending,
- no notification sending,
- no LINE / APP / SMS / email delivery,
- no Admin survey UI,
- no AI automatic decision,
- no inventory docs expansion.

Current foundations:

- Survey trigger source of truth is the first successful backend Case-level Field Service Report completion transition.
- One Case has one formal Field Service Report.
- One Case may have multiple appointments / dispatch visits.
- `finalAppointmentId` is backend / system resolved and stable after completion.
- Repeat completion conflict must not create survey intent or delivery.
- Delivery channel selection is not part of completion.

## Policy Layers

Survey policy must be split into two layers.

### 1. Intent Creation Eligibility

Intent creation answers:

> Should the first successful Case completion create a survey intent record?

Inputs may include:

- organization policy,
- Case type,
- service category,
- customer / contact eligibility summary,
- internal / smoke / test marker,
- legacy no-appointment policy,
- complaint / exception policy,
- suppression policy version.

Intent creation does not decide:

- delivery channel,
- LINE availability,
- APP availability,
- actual message content,
- delivery retry behavior,
- AI risk classification.

### 2. Delivery Eligibility

Delivery eligibility answers:

> Given an existing survey intent, can it be delivered now, later, or never?

Inputs may include:

- current channel binding,
- customer opt-out,
- organization delivery preference,
- survey expiration,
- suppression reason,
- reverse LINE binding state,
- APP binding state,
- channel-specific policy.

Delivery eligibility does not:

- create a new first-transition intent,
- mutate Case / Report completion,
- re-infer `finalAppointmentId`,
- bypass repeat completion conflict,
- send messages inside the completion transaction.

Intent creation is not a delivery command. Delivery eligibility must not create a first-transition survey intent. Intent creation must not select or require a delivery channel.

## Recommended Default Policy

Initial future policy should be conservative:

- Survey feature disabled until explicitly enabled by organization / product policy.
- Legacy no-appointment completions are not surveyable by default.
- Smoke / internal / test Cases must not produce real outbound delivery.
- No-channel Cases may remain pending channel resolution or suppressed according to policy.
- High-risk complaint or exception Cases may require admin follow-up instead of automatic delivery.
- AI may flag risk or missing data, but may not decide survey creation or delivery.

Default disabled means no real outbound delivery. Whether a disabled policy creates no intent or creates a suppressed / internal-only intent is a separate environment and test policy decision.

## Suppression Reasons

Recommended structured suppression reasons should be separated by layer.

### Intent-level Reasons

- `policy_disabled`
- `organization_survey_disabled`
- `internal_case`
- `smoke_fixture`
- `test_runtime`
- `legacy_no_appointment_policy_disabled`
- `case_type_not_surveyable`
- `service_category_not_surveyable`
- `missing_required_case_context`
- `privacy_policy_restricted`

### Delivery-level Reasons

- `customer_opted_out`
- `contact_not_eligible`
- `contact_missing`
- `contact_eligibility_unknown`
- `no_deliverable_channel`
- `channel_binding_pending`
- `channel_policy_disabled`
- `survey_expired`
- `delivery_window_closed`
- `complaint_manual_follow_up_required`
- `manual_follow_up_policy_required`

### No-event Paths, Not Suppression Reasons

The following should not be stored as suppression reasons because they should not create survey intent at all:

- `repeat_completion_conflict`
- `no_eligible_completed_visit`
- `cross_case_final_appointment`
- `non_completed_final_appointment`
- `failed_transaction`
- `idempotency_duplicate`

Suppression reason rules:

- Use structured codes, not free-text secrets.
- Suppression must not mutate Case / Report completion.
- Suppression must not delete survey intent.
- Suppression does not imply completion failure.
- Suppression does not mean the Case is not completed.
- Optional safe detail must be allow-list and bounded-length. It must not contain customer mobile, raw LINE user id, raw provider payload, credentials, or operator personal identity.

## Smoke / Internal / Test Policy Options

Two future implementation options are acceptable.

### Option A - No Intent

Smoke / internal / test completion creates no survey intent.

Pros:

- lowest outbound risk,
- simplest operational boundary,
- no accidental worker processing.

Cons:

- less observable in automated tests,
- harder to verify idempotent survey intent creation.

### Option B - Suppressed Internal-only Intent

Smoke / internal / test completion creates a suppressed intent.

Pros:

- better test coverage for intent / outbox idempotency,
- clearer audit of why no delivery happened.

Cons:

- requires hard suppression gate in delivery resolver,
- requires careful cleanup / retention policy,
- increases shared runtime noise.

Recommendation:

- For earliest runtime implementation, choose Option A unless testing first-transition idempotency requires Option B in a controlled test environment.
- Shared runtime must never send real outbound survey.

## Legacy No-appointment Policy

Task 106 preserves legacy no-appointment completion compatibility.

Survey policy should treat legacy no-appointment completion as:

- supported by event contract through nullable `finalAppointmentId`,
- not surveyable by default,
- only surveyable if product explicitly enables it and customer/contact eligibility exists,
- never a reason to create a fake appointment.

Recommended default:

- `legacy_no_appointment_policy_disabled`.

## Surveyable Case Policy

Future product policy should decide:

- which Case types are surveyable,
- which service categories are excluded,
- whether warranty / non-warranty affects survey,
- whether cancelled or failed service Cases are surveyable,
- whether pending quote / pending parts Cases are excluded until final completion,
- whether complaint / exception Cases require manual follow-up.

Rules:

- `pending_parts` and `pending_quote` should not be treated as successful service completion.
- No eligible completed visit rejection must not create survey intent.
- Appointment history can inform policy, but survey remains Case-level.

No-channel handling is not finalized in Task 113. Task 114 should define delivery resolver states, and Task 118 should define whether pending channel intent can become deliverable after reverse LINE / APP binding.

## Customer / Contact Eligibility

Survey eligibility should use safe summary states:

- `pending_policy`
- `unknown`
- `eligible`
- `not_eligible`

It must not expose:

- customer mobile / phone / tel,
- raw LINE user id,
- raw APP device token,
- full customer payload,
- full channel payload.

Eligibility may consider:

- customer has a reachable approved channel,
- customer has not opted out,
- customer contact role is valid,
- organization policy permits survey,
- Case is not internal / smoke / test.

## Policy Versioning

Future survey intent should store policy versions when policy is applied:

- `survey_policy_version`
- `eligibility_policy_version`

Reasons:

- operators can explain why a Case was deliverable, suppressed, or pending,
- historical behavior remains auditable after policy changes,
- tests can assert behavior against known policy versions.

Policy version fields are design recommendations only. Task 113 does not add schema.

Open policy version question:

- Should intent creation and delivery use the policy version active at completion time, delivery time, or both?

## No-go Conditions

Survey intent / delivery must not occur for:

- repeat completion conflict,
- rejected completion,
- no eligible completed visit rejection,
- failed transaction,
- post-completion edit,
- report reopen attempt,
- AI suggestion,
- delivery retry creating a new first-transition trigger,
- manual correction flow unless future product policy explicitly defines it.

AI may later provide advisory risk hints or summaries only. AI must not automatically mark a Case surveyable, suppressed, deliverable, not deliverable, or manual-follow-up-required.

## Non-goals

Task 113 does not:

- implement survey policy engine,
- implement suppression table,
- implement opt-out table,
- implement survey intent table,
- implement event outbox,
- send survey,
- choose delivery channel,
- modify Case / Report completion,
- modify Admin UI,
- add migration,
- add schema or index,
- add AI decisions.

## Task 113 Decision

Recommended default policy:

- Survey disabled until explicitly enabled.
- Legacy no-appointment suppressed by default.
- Smoke / internal / test never sends real outbound survey.
- Intent creation eligibility and delivery eligibility must remain separate.
- Policy decisions belong outside completion core; completion only creates a future intent/outbox when policy permits and implementation is explicitly added later.

Recommended next Task:

- Task 114 should define delivery resolver / channel selection boundary without sending messages.

## ChatGPT Design Review Integration

The project ChatGPT branch reviewed Task 113 as part of the Codex / ChatGPT workflow.

Review outcome:

- The two-layer split between intent creation eligibility and delivery eligibility is correct.
- The conservative default is appropriate while the feature remains design-only.
- The document now separates intent-level suppression reasons, delivery-level suppression reasons, and no-event paths.
- No-channel handling is explicitly deferred to Task 114 and Task 118.
- AI is documented as advisory only and cannot set surveyability, suppression, delivery eligibility, or manual follow-up status.
