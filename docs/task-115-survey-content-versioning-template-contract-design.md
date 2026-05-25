# Task 115 - Survey Content / Versioning / Template Contract Design

## Background And Constraints

Task 115 defines the future survey content, versioning, and template contract.

Task 115 is documentation-only:

- no migration,
- no schema or index change,
- no runtime behavior change,
- no notification template seed,
- no survey content seed,
- no LINE / APP / SMS / email sending,
- no Admin UI,
- no API change,
- no AI automatic decision,
- no inventory docs expansion.

## Core Principle

Survey content version is not the same as channel message template.

The platform should separate:

- survey definition / question set,
- survey version,
- channel rendering template,
- delivery adapter payload.

Reason:

- The same survey version may be rendered differently in LINE, APP, SMS, email, or manual follow-up.
- A customer response must remain traceable to the exact question set shown at the time.
- Updating message templates must not rewrite historical survey meaning.

## Survey Definition Contract

Future survey definition may include:

- `surveyKey`
- `surveyVersion`
- `surveyName`
- `questionSetVersion`
- `questions`
- `locale`
- `status`
- `effectiveFrom`
- `effectiveTo`

Question concepts may include:

- rating question,
- text feedback question,
- complaint flag question,
- callback request question,
- optional structured reason choices.

Task 115 does not create survey definition tables or data.

## Version Lifecycle

Recommended future lifecycle:

- `draft`: editable; cannot be delivered or used for response intake.
- `published`: immutable for semantic fields; can be delivered if policy permits.
- `retired`: cannot be used for new delivery; historical responses remain interpretable.

Task 115 does not add schema or lifecycle runtime.

## Immutable Versioning Rule

Once a survey version is published or used for any delivery / intake flow:

- question keys must not be repurposed,
- option codes must not be repurposed,
- option meanings must not be changed,
- rating scale semantics must not change,
- rating scale direction must not be reversed,
- response interpretation must remain stable,
- locale translations must not change meaning,
- historical response rendering must use the original version.

If content changes, create a new survey version.

Non-semantic typo fixes may be tracked as metadata revisions only if they do not change response meaning.

## Channel Template Boundary

Channel templates may define:

- invitation text,
- button labels,
- deep link wrapper,
- channel-specific copy length,
- fallback copy,
- locale-specific phrasing.

Channel templates must not:

- define official survey identity alone,
- change the meaning of question keys,
- define, mutate, or reinterpret survey questions,
- change scoring semantics,
- store raw provider payload,
- hard-code raw LINE user id,
- decide eligibility,
- trigger delivery.

Existing `notification_templates` may later render invitations, but they should not be the only source of truth for survey question version.

Existing `notification_templates` may be evaluated in a future implementation as one possible invitation rendering mechanism. They are not survey definition storage.

Deep links should use opaque survey/session tokens or internal route references. They must not expose raw Case id, raw LINE user id, customer mobile, provider payload, credentials, or full payload.

## Recommended Future Content Flow

Future high-level flow:

1. Survey intent becomes deliverable.
2. Resolver selects channel.
3. Delivery layer selects survey definition version according to policy.
4. Delivery layer selects channel template.
5. Channel adapter renders a safe provider-specific message.
6. Response intake records the survey version / question set reference.

Task 115 does not implement this flow.

## Safe Payload Rules

Survey content / template data must not contain:

- customer mobile / phone / tel,
- raw LINE user id,
- APP device token,
- channel secret / access token,
- DATABASE_URL,
- token / secret / password,
- full Case payload,
- full report payload,
- full appointment payload,
- raw provider payload,
- AI raw payload.

Templates may include placeholders only for safe values approved by policy, such as:

- short Case reference,
- service completion date summary,
- organization display name,
- survey link placeholder,
- locale-safe text.

Do not include customer contact values or raw channel ids in template variables.

## Localization And Brand / Vendor Variation

Future policy may support:

- Traditional Chinese,
- additional locales,
- brand-specific wording,
- vendor-specific wording,
- organization-specific wording.

Design principle:

- wording variation belongs to template/rendering layer,
- scoring and question identity belong to survey definition layer,
- vendor / brand-specific rules must not fragment Case-level survey identity unless product explicitly defines separate survey versions.

## AI Boundary

AI may later help draft:

- invitation copy,
- survey question wording suggestions,
- feedback summary categories.

AI must not:

- change official survey version automatically,
- publish survey versions,
- retire survey versions,
- publish question set changes,
- decide survey eligibility,
- decide delivery channel,
- send survey,
- alter historical response interpretation.

Human review is required before any official survey content/version is adopted.

## Task 116 Response Ownership Dependency

Task 116 will define response intake, duplicate handling, ownership, privacy, partial / expired responses, and feedback lifecycle.

Task 115 only defines the content/version identity needed for response interpretation.

Future responses should be interpreted against the survey version used for delivery / intake and should reference:

- Case-level primary feedback context,
- `serviceReportId`,
- nullable `finalAppointmentId`,
- survey version identity,
- stable question keys,
- stable option codes or rating values,
- answered timestamp,
- channel summary only.

Responses should not:

- attach primarily to appointment as a formal outcome,
- depend on channel template for interpretation,
- store raw provider payload,
- store raw LINE user id,
- store customer mobile,
- store APP device token.

## Future Test Plan

Future tests should cover:

- response records the survey version used at delivery,
- template changes do not alter historical responses,
- LINE / APP renderings can use same survey version,
- missing template does not mutate survey intent,
- template rendering excludes raw LINE user id and contact values,
- AI draft text is not published without human confirmation.

## Open Questions

1. What is the initial survey question set?
2. Is rating scale 1-5, 1-10, NPS, or another scale?
3. Is text feedback required or optional?
4. Should complaint flag be explicit or derived later by human/AI review?
5. Should survey version be global, organization-specific, brand-specific, or vendor-specific?
6. What locales are required first?
7. Should survey content be managed through Admin UI later?
8. Who can approve a new survey version?
9. Should templates live in existing notification templates or a dedicated survey template system?
10. Should invitation template version be recorded separately from survey version?
11. Should deep link token expiration align exactly with survey expiration?
12. If a channel template changes but the question set does not, does that require a new survey version or only a template revision?
13. Should response intake store surveyVersionId only, or a safe immutable question snapshot?

## Task 115 Decision

Survey definition/version is the source of truth for customer feedback meaning. Channel templates are rendering details.

Recommended next Task:

- Task 116 should define survey response intake and feedback ownership without adding schema or API.

## ChatGPT Design Review Integration

The project ChatGPT branch reviewed Task 115 as part of the Codex / ChatGPT workflow.

Review outcome:

- The survey definition / channel template split is correct.
- Immutable boundary was strengthened from delivered-only to published or used for delivery / intake.
- A draft / published / retired lifecycle was added.
- Channel templates are explicitly non-authoritative for question semantics.
- Deep links must use opaque references and must not expose raw Case, channel, contact, provider, or credential data.
- Task 116 dependency was added so response interpretation stays tied to survey version and stable question / option keys.
