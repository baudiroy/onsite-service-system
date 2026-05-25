# Task 117 - Admin Survey Visibility / Role Dashboard Design

## Background And Constraints

Task 117 defines future Admin survey visibility and role dashboard boundaries.

Task 117 is documentation-only:

- no Admin UI implementation,
- no frontend code change,
- no backend code change,
- no API change,
- no migration,
- no schema or index change,
- no survey sending,
- no manual send button,
- no manual final appointment picker,
- no AI automatic decision,
- no inventory docs expansion.

## Admin Visibility Principle

Future Admin survey UI should start with read-only visibility.

Read-only visibility means Admin UI may display safe survey state and feedback summaries, but must not mutate:

- survey intent,
- delivery state,
- survey response,
- Case,
- Field Service Report,
- appointment,
- `finalAppointmentId`,
- suppression / opt-out policy,
- channel binding.

Admin may view safe summaries of:

- survey intent status,
- resolver decision summary,
- delivery status summary,
- response status,
- rating,
- complaint flag,
- callback request,
- safe feedback summary,
- suppression / not-deliverable reason,
- final appointment marker from completed report.

Admin must not use survey UI to:

- create first-transition survey intent,
- force survey sending,
- override `finalAppointmentId`,
- reopen completed report,
- mutate Case completion,
- bypass suppression / opt-out,
- view raw LINE user id,
- view customer mobile unless separately authorized by existing customer permissions,
- view provider raw payload.

## Role-specific Visibility

Future roles may see different summaries.

Visibility should be scoped by organization, case assignment, team responsibility, and explicit permission. A role should not automatically grant cross-organization or all-Case survey access.

No role should see raw LINE user id, customer mobile, APP device token, provider raw payload, full customer payload, full report payload, full appointment payload, or credentials through the survey dashboard.

### Customer Service

May need:

- pending callback request,
- low rating summary,
- safe feedback summary,
- contact follow-up required indicator,
- survey not deliverable reason.

Must not see:

- raw channel identity,
- provider payload,
- hidden internal risk scoring beyond role permission.

Full `feedbackText` requires explicit permission and may require audit logging.

### Dispatcher

May need:

- repeated visit / service dissatisfaction summary,
- callback required indicator,
- no direct survey sending.

### Supervisor

May need:

- complaint risk,
- low rating Cases,
- repeated repair indicators,
- engineer / vendor quality trend summary,
- exception review queue.

### Finance

May need only limited visibility:

- complaint / dispute indicator if it affects billing review,
- not full feedback text by default.

Survey feedback must not automatically trigger refund, settlement adjustment, penalty, or billing mutation.

### Engineer

May need:

- limited service feedback summary if policy permits,
- no raw customer contact,
- no private complaint notes unless supervisor policy allows.

Engineer visibility should not treat low rating / complaint text as automatic penalty evidence.

## Sensitive Feedback Handling

Free-text feedback is sensitive.

Admin UI should support:

- redacted default preview,
- role-based access to full feedback text,
- audit trail for viewing sensitive text if required,
- no copy of raw provider payload,
- no raw LINE user id,
- no customer mobile in survey panel unless existing customer permission allows it.

Smoke / handoff reports must not paste full feedback text.

Safe feedback summary should be redacted, bounded-length, and non-identifying by default. AI-generated summaries are deferred to Task 119 and must not be assumed in Task 117.

## Dashboard Concepts

Future dashboards may include:

- low rating Cases,
- callback requested,
- complaint risk,
- pending channel survey intents,
- suppressed survey intents,
- not deliverable surveys,
- survey response rate,
- survey expired without response,
- delivery failures summary,
- role-specific review queue.

Dashboards must:

- respect organization scope,
- respect role permissions,
- show summaries by default,
- avoid raw provider/channel/contact payload.

Aggregate dashboards should avoid small-sample re-identification. Future exports require separate policy design and should not be assumed by Task 117.

## Manual Action Boundary

Admin UI must not initially provide:

- manual survey send,
- manual resend,
- manual survey trigger,
- final appointment picker,
- survey intent override,
- delivery channel override,
- AI auto action approval without human review flow.

If future product needs manual follow-up:

- it should be represented as a review / follow-up workflow,
- it should not create a new first-transition trigger,
- it should not bypass opt-out / suppression policy,
- it should be audited.

Manual follow-up visibility is allowed as a future design concept, but manual follow-up tasks, send / resend buttons, customer notifications, and state mutation are out of scope for Task 117.

## AI Dependency

Any AI-assisted feedback summary, risk radar, theme grouping, or complaint prioritization is deferred to Task 119.

AI output must remain advisory only and must not automatically mutate:

- survey state,
- Case,
- Field Service Report,
- appointment,
- refund / penalty / settlement,
- notification,
- follow-up status.

## Error / State Display

Admin UI should distinguish:

- `pending_policy`
- `pending_channel`
- `ready_for_channel_delivery`
- `suppressed`
- `not_deliverable`
- `sent`
- `answered`
- `expired`
- `manual_follow_up_required`

But Task 117 does not add UI or API.

## Future Test Plan

Future Admin tests should cover:

- no manual send button appears by default,
- no final appointment picker appears,
- role without permission cannot view full feedback text,
- raw LINE user id is not shown,
- customer mobile is not shown in survey panel without permission,
- free-text feedback is redacted by default where policy requires,
- dashboard respects organization scope,
- survey state display does not mutate Case / Report.

## Open Questions

1. Which roles can view full free-text feedback?
2. Should viewing full feedback text create audit log?
3. Can engineers see customer feedback about their own visit?
4. Should finance see only dispute indicators?
5. Should manual follow-up be a Case review, task, or notification?
6. Should Admin ever have a manual resend flow, and what approvals would be required?
7. How should survey status appear on Case detail versus dashboards?
8. Should low rating automatically create review queue item, or only display summary?

## Task 117 Decision

Future Admin survey surface should start as read-only, role-scoped, redacted visibility. Manual send, override, and final appointment selection remain out of scope.

Recommended next Task:

- Task 118 should define reverse LINE binding compatibility for pending survey delivery.

## ChatGPT Design Review Integration

The project ChatGPT branch reviewed Task 117 as part of the Codex / ChatGPT workflow.

Review outcome:

- Read-only visibility is correct, but now explicitly means no mutation of survey, delivery, response, Case, Report, appointment, final appointment, suppression, opt-out, or channel binding state.
- Role visibility now requires organization / assignment / team / explicit permission scope.
- Full free-text feedback requires explicit permission and may require audit logging.
- Safe feedback summary must be redacted and bounded, and Task 117 does not assume AI summaries.
- Manual follow-up remains a future workflow dependency, not an Admin action capability in this task.
