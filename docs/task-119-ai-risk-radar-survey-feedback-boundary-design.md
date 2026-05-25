# Task 119 - AI Risk Radar Integration Boundary For Survey Feedback Design

## Background And Constraints

Task 119 defines future AI risk radar boundaries for survey feedback.

Task 119 is documentation-only:

- no AI runtime implementation,
- no model call,
- no prompt implementation,
- no schema or index change,
- no migration,
- no notification sending,
- no survey sending,
- no Admin UI,
- no automatic workflow action,
- no inventory docs expansion.

## Allowed AI Scope

Future AI may assist with:

- feedback summarization,
- dissatisfaction risk hints,
- theme grouping,
- missing follow-up reminders,
- complaint-risk explanation,
- suggested human review priority,
- draft internal notes for human review,
- aggregate trend summaries,
- feedback learning signals.

AI output is advisory only.

AI output may inform human review, but must not become the source of truth for survey status, complaint status, delivery eligibility, follow-up completion, Case status, Report status, or `finalAppointmentId`.

## Forbidden AI Scope

AI must not automatically:

- create survey intent,
- decide survey eligibility,
- choose delivery channel,
- send survey,
- send LINE / APP / SMS / email,
- mark survey deliverable / not deliverable,
- suppress survey,
- create complaint,
- close complaint,
- reopen Case,
- change Field Service Report,
- change appointment,
- change `finalAppointmentId`,
- trigger refund / compensation,
- change billing / settlement,
- penalize engineer,
- notify customer,
- mark follow-up resolved,
- set surveyable / suppressed / deliverable / not_deliverable / manual_follow_up_required / complaint_required / callback_required / resolved states.

## Sensitive Input Boundary

Survey feedback text is sensitive.

`feedbackText` is untrusted user-generated content. AI processing must treat it as data, not instructions. Prompt injection content inside feedback must not override system, policy, privacy, redaction, or workflow boundaries.

AI input must minimize and redact:

- customer mobile / phone / tel,
- raw LINE user id,
- APP device token,
- provider payload,
- customer address,
- full customer object,
- full Case payload,
- full report payload,
- full appointment payload,
- credentials,
- token / secret / password.

Redaction / minimization should also remove or mask names, addresses, order identifiers, contact values, provider identifiers, and any user-entered personal data when not necessary for the AI task.

AI input should be purpose-specific and minimized. Summary, theme grouping, risk hint, and aggregate trend analysis should each receive only the minimum fields needed.

If free-text feedback is used, future implementation must define:

- redaction policy,
- minimization policy,
- retention policy,
- auditability,
- permission boundary,
- whether AI processing is enabled per organization.

## AI Output Boundary

AI output should be structured as:

- `summary`
- `riskHint`
- `suggestedTags`
- `missingInfoHint`
- `suggestedHumanReviewReason`
- `confidenceSummary`

AI output must not be written as official truth without human confirmation.

AI output shown to Admin users must be labeled as AI-assisted / advisory and must not be displayed as verified fact.

`confidenceSummary` is a model uncertainty hint, not a decision threshold. It must not automatically trigger escalation, suppression, delivery, complaint creation, or follow-up resolution.

AI output must not replace:

- customer rating,
- customer feedback text,
- official Field Service Report,
- survey response record,
- audit record,
- billing / settlement decision,
- supervisor review decision.

## Human-in-the-loop Requirement

Any operational action based on AI output requires human confirmation.

Examples:

- creating a complaint review,
- calling customer back,
- escalating to supervisor,
- adding internal note,
- adjusting service workflow,
- contacting engineer,
- initiating refund / compensation review.

AI can suggest, but human decides.

Human acceptance, rejection, or correction must be explicit. Absence of human review must not be treated as approval.

AI-drafted internal notes require human review before becoming official Case notes, audit notes, customer-facing messages, or follow-up records.

## Feedback Learning Loop

Future AI feedback learning may store:

- AI suggestion summary,
- human accepted / rejected decision,
- corrected tag,
- resolved outcome summary,
- reason code,
- timestamp,
- actor summary.

It must not store:

- raw LINE user id,
- customer mobile,
- raw feedback text,
- raw prompt,
- raw model output containing sensitive data,
- full payload,
- credentials,
- unredacted sensitive feedback unless policy explicitly allows and access is controlled.

AI learning signals should store normalized labels and safe outcome summaries only.

## Admin Visibility Dependency

Task 117 Admin visibility must not assume AI summary exists.

If future AI summary is displayed:

- label it as AI-assisted,
- show confidence / uncertainty summary,
- require permission,
- avoid raw sensitive content,
- provide human override / dismiss state,
- do not mutate workflow automatically.

Permission to view AI summary does not automatically grant permission to view full `feedbackText`.

Aggregate AI trends must avoid small-sample re-identification and should not expose individual feedback text or identifiable Case / Customer details.

## Policy And Resolver Dependencies

Survey policy, suppression, opt-out, eligibility, and manual-follow-up policy remain deterministic product policy decisions from Task 113.

Delivery channel selection and resolver state remain Task 114 boundaries.

AI must not set:

- survey policy,
- suppression reason,
- opt-out status,
- delivery eligibility,
- channel selection,
- resolver state,
- provider delivery action.

AI analysis must not change survey response ownership. Feedback remains Case-level and references serviceReportId, surveyIntentId, surveyVersion, and nullable `finalAppointmentId`.

## Future Test Plan

Future AI tests should cover:

- AI summary excludes raw LINE user id and customer mobile,
- AI risk hint does not mutate Case / Report / survey state,
- AI cannot send notification,
- AI cannot create complaint automatically,
- human accepted / rejected feedback is recorded safely,
- AI prompt input is redacted / minimized,
- low confidence output does not become official truth.

## Open Questions

1. Which organizations can enable AI feedback summary?
2. What redaction policy is required before feedback text enters AI processing?
3. Who can view AI summaries?
4. Should AI risk tags be stored, or generated on demand?
5. Should human acceptance / rejection become AI feedback training data?
6. What retention applies to AI outputs?
7. Should complaint-risk AI be disabled for sensitive brands / vendors?
8. How should AI uncertainty be shown to supervisors?
9. Should AI ever suggest survey content changes, and who approves them?

## Task 119 Decision

AI risk radar may assist humans with summary and risk hints, but it cannot decide survey, delivery, complaint, completion, billing, refund, or notification outcomes.

Recommended next Task:

- Task 120 should freeze the survey design docs and define implementation readiness gates.

## ChatGPT Design Review Integration

The project ChatGPT branch reviewed Task 119 as part of the Codex / ChatGPT workflow.

Review outcome:

- AI allowed / forbidden boundary is correct and remains advisory-only.
- `feedbackText` is now explicitly treated as untrusted user-generated content and prompt-injection risk.
- AI output must be labeled AI-assisted / advisory and cannot become official truth or workflow state.
- Human approval must be explicit before AI suggestions become official action.
- AI learning data is minimized to normalized labels and safe outcome summaries.
- Admin visibility follows Task 117 permissions / redaction, and AI cannot become Task 113 policy engine or Task 114 delivery resolver.
