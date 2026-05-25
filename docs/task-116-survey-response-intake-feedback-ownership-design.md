# Task 116 - Survey Response Intake / Feedback Ownership Design

## Background And Constraints

Task 116 defines future survey response intake and feedback ownership.

Task 116 is documentation-only:

- no migration,
- no schema or index change,
- no runtime behavior change,
- no response API,
- no webhook intake,
- no LINE / APP / SMS / email handling,
- no Admin UI,
- no AI automatic decision,
- no inventory docs expansion.

## Ownership Principle

Survey response is Case-level customer feedback.

It should reference:

- `caseId` as primary context,
- `serviceReportId`,
- nullable `finalAppointmentId`,
- `surveyIntentId`,
- survey version identity,
- channel summary,
- answered timestamp.

It should not become:

- an appointment-level formal report,
- a second Field Service Report,
- a replacement for the official Field Service Report,
- a direct mutation of completed Case / Report status,
- a LINE-specific object.

Survey response may reference `finalAppointmentId` for service context, but it must not make an appointment or visit the primary feedback aggregate.

Responses must be interpreted using the delivered survey version and stable question keys / option codes, not current survey content or channel template text.

## Response Intake Boundary

Future response intake may happen through:

- LINE,
- own APP,
- SMS / email link,
- admin manual follow-up entry,
- future customer portal.

Response intake must not:

- create survey intent,
- create first-transition event,
- mutate Case completion,
- mutate Field Service Report completion,
- re-infer `finalAppointmentId`,
- reopen completed report,
- send follow-up automatically,
- rely on raw LINE user id in core payload.

## Recommended Response Context

Future response record may need:

- `organizationId`
- `caseId`
- `serviceReportId`
- `finalAppointmentId` nullable
- `surveyIntentId`
- `surveyVersion`
- `responseStatus`
- `ratingValue`
- `feedbackText`
- `complaintFlag`
- `callbackRequested`
- `answeredAt`
- `channelType`
- `channelSummary`
- `dedupeKey`
- safe metadata summary

Task 116 does not add this schema.

## Privacy And Redaction

Response intake must not store:

- customer mobile / phone / tel,
- raw LINE user id,
- raw APP device token,
- provider access token,
- channel secret,
- full provider payload,
- full customer payload,
- full Case payload,
- full report payload,
- full appointment payload,
- DATABASE_URL,
- password / token / secret,
- AI raw payload.

If provider payload must be retained for debugging in a future delivery layer, it must be redacted and stored outside the core feedback record according to a retention policy.

Free-text feedback may contain user-provided personal data even when the platform does not store raw channel identifiers. Future intake, Admin visibility, AI processing, logs, smoke output, and handoff reports must treat `feedbackText` as sensitive content.

Do not log full `feedbackText` in application logs, smoke output, handoff reports, or AI prompts without a redaction / minimization policy.

## Response Status Concepts

Future statuses may include:

- `response_pending`
- `answered`
- `submitted`
- `partial`
- `duplicate`
- `duplicate_rejected`
- `expired`
- `invalid`
- `suppressed`
- `spam_or_abuse`
- `manual_entry`
- `voided`
- `under_review`

Status rules:

- duplicate response must not create duplicate Case feedback outcome,
- expired response must not reopen completion,
- invalid response must not mutate Case / Report,
- manual entry must be auditable,
- complaint flag does not automatically create or close complaint.

## Duplicate Handling

Future duplicate handling should use deterministic dedupe:

- one active response per survey intent by default,
- repeated identical submit returns or records duplicate safely,
- latest response replacement requires explicit product policy,
- duplicate provider callback must not create multiple feedback outcomes.

Potential dedupe key:

```text
survey-response:intent:<surveyIntentId>
```

Do not include raw channel identity or contact values in dedupe key.

Default recommendation:

- one active submitted response per survey intent,
- later duplicate submissions must not overwrite accepted response unless future explicit correction policy allows it,
- dedupe key should not include channel, raw identity, `finalAppointmentId`, rating value, answer content, or submitted timestamp.

## Complaint / Callback Boundary

Low rating, complaint flag, or callback requested may create a future review signal.

It must not automatically:

- reopen Case,
- change completed report,
- mark engineer performance penalty,
- issue refund / compensation,
- send sensitive notification,
- close complaint,
- change billing / settlement.

Human review is required for operational action.

Complaint flag and callback request are customer feedback signals only. They may create a future human-review queue item if explicitly implemented later, but they must not automatically mutate Case, Field Service Report, appointment, payment, refund, penalty, notification, or delivery state.

`callbackRequested` does not imply the response stores phone / mobile. Future callback workflow must resolve allowed contact channels through customer / contact policy layers.

## Analytics Boundary

Customer-level and engineer-level analytics may be derived later.

Primary response ownership remains Case-level.

Derived analytics may reference:

- organization,
- Case type,
- vendor / brand,
- engineer assignment,
- final appointment,
- survey version.

Analytics must respect role permissions and redaction policy.

## Admin And AI Dependencies

Task 117 should define role-based Admin visibility for:

- rating,
- free-text feedback,
- complaint flag,
- callback request,
- sensitive-content redaction,
- read-only review boundaries.

Admin visibility must not become manual survey sending, response mutation authority, final appointment picker, or raw channel identity display.

Task 119 should define AI-safe input boundaries for survey feedback.

AI may later summarize feedback or suggest risk hints, but must not automatically:

- open complaint,
- close complaint,
- reopen Case,
- edit report,
- send notification,
- reply to customer,
- decide refund / compensation,
- mark issue resolved.

## Future Test Plan

Future tests should cover:

- response attaches to Case and references service report,
- response can reference nullable finalAppointmentId for legacy no-appointment policy if enabled,
- duplicate response does not create multiple feedback outcomes,
- expired response does not mutate completion,
- complaint flag requires human review,
- provider payload is not stored in core feedback record,
- raw LINE user id and customer mobile are excluded,
- response interpretation uses survey version and stable question keys.

## Open Questions

1. Should one survey intent allow one response only, or multiple updates before expiration?
2. Can a customer edit response after submission?
3. Should callback request create a review task, case review, or notification?
4. What is the feedback retention period?
5. Should feedback text be visible to all admins or restricted by role?
6. Should complaint flag be customer-provided, staff-provided, AI-suggested, or all with separate fields?
7. Should manual follow-up entry be allowed when customer answered by phone?
8. Should response store full safe question snapshot or only survey version + question keys?
9. Can a customer edit or resubmit a response before expiration?
10. Should partial response be upgradable to submitted response?
11. How long should free-text feedback and invalid / duplicate attempts be retained?
12. Should response links use one-time opaque tokens, expiring opaque tokens, or another mechanism?

## Task 116 Decision

Survey response is Case-level customer feedback with references to service report, final appointment, survey intent, and survey version. It is not an appointment-level formal report and does not mutate completion.

Recommended next Task:

- Task 117 should define future Admin survey visibility and role dashboard boundaries without adding UI.

## ChatGPT Design Review Integration

The project ChatGPT branch reviewed Task 116 as part of the Codex / ChatGPT workflow.

Review outcome:

- Case-level ownership is correct and should remain primary.
- Response interpretation must use delivered survey version and stable question / option keys.
- Free-text feedback is sensitive and now has explicit redaction / minimization warnings.
- Duplicate handling now defaults to one active submitted response per survey intent.
- Complaint / callback signals are human-review signals only and cannot trigger automatic workflow mutation.
- Task 117 and Task 119 dependencies were added for Admin visibility and AI-safe feedback handling.
