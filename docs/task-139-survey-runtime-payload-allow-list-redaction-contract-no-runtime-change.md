# Task 139 - Survey Runtime Payload Allow-list / Redaction Contract Design / No Runtime Change

## Background

Task139 designs the future payload allow-list and redaction contract for survey runtime writes. It does not implement runtime behavior, connect to DB, apply migration, or enable survey sending.

Task138 defined the future write-path contract. Task139 narrows that design to what may be written into `survey_intents.safe_context_summary`, `event_outbox.payload`, future logs, and bounded error summaries.

## No-runtime-change Statement

Task139 does not:

- edit Migration 020,
- add a migration file,
- apply migrations,
- execute DDL,
- connect to DB,
- run psql,
- run `npm run db:migrate`,
- change schema or indexes,
- modify backend runtime,
- add repository / service files,
- implement feature flags,
- change config or env parsing,
- change API,
- change Admin UI,
- change smoke or browser smoke,
- implement survey sending, notification sending, LINE / APP / SMS / email push, outbox worker, delivery resolver, response intake, webhook, template seed, survey content seed, survey link generation, dashboard, manual override, or AI runtime.

## Source Review Summary

Reviewed:

- `docs/task-138-survey-runtime-write-path-contract-no-runtime-change.md`
- `docs/task-137-survey-runtime-feature-flag-kill-switch-contract-no-runtime-change.md`
- `docs/task-120-survey-roadmap-freeze-implementation-readiness-gate.md`
- `docs/task-110-post-completion-survey-trigger-first-transition-design.md`
- `docs/task-129-migration-020-static-sql-re-review-no-apply.md`
- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `package.json`

Migration 020 static shape relevant to this task:

- `survey_intents.safe_context_summary` is nullable JSONB with object check.
- `survey_intents.suppression_detail_safe` is nullable JSONB with object check.
- `event_outbox.payload` is JSONB with object check.
- `event_outbox.last_error` is bounded text.
- Migration 020 contains no raw contact/channel/provider credential fields.

## Payload Boundary

Future survey runtime payloads must be:

- minimal,
- deterministic,
- Case-level,
- organization-scoped,
- channel-agnostic at trigger/write time,
- safe for logs and admin summaries,
- free of customer contact values,
- free of raw channel identifiers,
- free of provider payloads,
- free of AI raw output.

Survey runtime payloads are not:

- full Case payload dumps,
- full Field Service Report payload dumps,
- appointment history dumps,
- customer profile dumps,
- LINE payload dumps,
- delivery command payloads,
- AI prompt or model output stores.

## `safe_context_summary` Allow-list

Allowed fields for future `survey_intents.safe_context_summary`:

| Field | Type | Meaning | Notes |
| --- | --- | --- | --- |
| `caseStatus` | string enum | Safe Case status summary at completion. | No full Case object. |
| `completionStatus` | string enum | Safe completion state summary. | Usually `completed`. |
| `serviceReportStatus` | string enum | Safe report service status. | Usually `completed`. |
| `hasFinalAppointment` | boolean | Whether final appointment id is present. | Do not include appointment payload. |
| `finalAppointmentPresent` | boolean | Alias-compatible summary if needed. | Prefer one final field in implementation. |
| `appointmentCountBand` | string enum | `none`, `one`, `multiple`, `unknown`. | Avoid exact count if policy prefers lower detail; exact count may be allowed by later decision. |
| `channelBindingState` | string enum | `none`, `line_bound`, `app_bound`, `multiple`, `unknown`. | No raw channel id. |
| `contactEligibilityState` | string enum | `unknown`, `eligible`, `not_eligible`, `pending_policy`. | No contact value. |
| `surveyPolicyState` | string enum | `pending`, `eligible`, `suppressed`, `not_deliverable`. | Deterministic policy only. |
| `suppressionReasonCode` | string enum or null | Safe reason code. | No free-text customer detail. |
| `source` | string enum | `backend`. | No frontend authority. |
| `triggeredByType` | string enum | `admin`, `system`, `unknown`. | No user name/email/contact. |
| `legacyNoAppointment` | boolean | Whether no-appointment legacy path applied. | Does not imply delivery. |
| `schemaVersion` | integer | Payload schema version. | For future migrations. |

Potentially allowed only with explicit policy approval:

- exact appointment count,
- safe case type code,
- safe product type code,
- safe organization-internal brand/vendor category code,
- smoke/internal/test suppression summary.

## `event_outbox.payload` Allow-list

Allowed fields for future `event_outbox.payload`:

| Field | Type | Meaning |
| --- | --- | --- |
| `eventType` | string | `case.service_completion.first_transitioned`. |
| `eventVersion` | integer | Current event schema version. |
| `surveyIntentId` | uuid string | Internal survey intent id. |
| `caseId` | uuid string | Internal Case id. |
| `serviceReportId` | uuid string | Internal report id. |
| `finalAppointmentId` | uuid string or null | Completed report persisted value; nullable for allowed legacy path. |
| `completedAt` | timestamp string | Persisted completion timestamp. |
| `idempotencyKey` | string | Stable case/report key. |
| `channelBindingState` | string enum | Summary only. |
| `contactEligibilityState` | string enum | Summary only. |
| `source` | string enum | `backend`. |
| `createdAt` | timestamp string | Event creation time. |

The payload may include ids required for internal processing, but must not include raw contact/channel/provider identifiers. The payload is not a delivery payload.

## Forbidden Fields

Never write these to `safe_context_summary`, `suppression_detail_safe`, `event_outbox.payload`, logs, metrics labels, or error messages:

- `DATABASE_URL`,
- password / password hash,
- token / secret,
- provider credential,
- customer mobile / phone / tel,
- customer address,
- raw LINE user id,
- LINE channel secret / access token,
- APP device token,
- SMS destination value,
- email address,
- full customer payload,
- full Case payload,
- full report payload,
- full appointment payload,
- raw request body,
- raw response body,
- raw provider payload,
- raw LINE webhook payload,
- AI prompt,
- AI raw output,
- free-text customer complaint,
- full feedback text,
- operator email / phone / personal identifier.

## Redaction Rules

Future redaction should use allow-list construction first, not after-the-fact string scrubbing.

Rules:

1. Build payloads from explicit safe fields only.
2. Do not copy request bodies.
3. Do not copy ORM / DB row objects wholesale.
4. Do not log env values.
5. Do not log provider payloads.
6. Free text is forbidden unless a later task defines a separate redaction / retention policy.
7. Error messages should use safe reason codes.
8. Unknown payload keys should be rejected before DB insert.
9. Nested objects should be shallow and schema-checked.
10. Arrays should be avoided unless a later schema requires them.

## `last_error` Redaction Contract

Future `event_outbox.last_error` should contain only bounded, safe operational summaries.

Allowed:

- error code,
- safe component name,
- safe retry category,
- safe status code category,
- short redacted message without identifiers,
- timestamp handled by table columns, not embedded verbose payload.

Forbidden:

- provider response body,
- webhook payload,
- request body,
- destination contact value,
- raw LINE user id,
- token / secret,
- stack trace with env values,
- full SQL or connection strings,
- customer data.

Recommended shape:

```json
{
  "code": "resolver_policy_blocked",
  "component": "survey_delivery_resolver",
  "safeMessage": "Delivery resolver blocked by policy.",
  "retryable": false
}
```

If stored as text, serialize only this safe summary and keep within the existing bounded column.

## Suppression Detail Safe Contract

Future `suppression_detail_safe` may contain:

- `reasonCode`,
- `policyVersion`,
- `suppressedBy`,
- `suppressedAt`,
- `safeNoteCode`,
- `source`.

It must not contain:

- free-text customer details,
- contact values,
- raw channel ids,
- provider payload,
- full feedback text,
- internal complaint notes,
- AI raw output.

## Channel Summary Contract

Allowed summary values:

- `none`,
- `line_bound`,
- `app_bound`,
- `multiple`,
- `unknown`,
- `pending_binding`,
- `not_deliverable`.

Rules:

- Summary may indicate that a binding exists.
- Summary must not include raw identifiers.
- Summary must not prove a delivery channel is selected.
- Delivery resolver later decides channel under separate gates.

## AI Boundary

AI is not part of survey write-path payload.

Allowed future AI-related summaries only after explicit AI advisory approval:

- `aiRiskFlagPresent: true/false`,
- `aiSummaryAvailable: true/false`,
- safe AI category code.

Forbidden:

- AI prompt,
- AI raw output,
- generated customer message,
- AI score that changes workflow,
- AI decision to send, suppress, close, or escalate.

## Payload Validation Contract

Future implementation should validate:

1. Top-level JSON value is an object.
2. Only allow-listed keys are present.
3. Enum fields match known safe values.
4. UUID fields are internal ids only.
5. Timestamps are ISO strings or DB timestamps.
6. No nested free text unless separately approved.
7. No arrays unless separately approved.
8. Size limits are enforced before insert.
9. Unknown fields fail closed.
10. Redaction failure blocks write under strict atomic model.

## Safe Logging And Metrics

Safe logs may include:

- component name,
- safe reason code,
- feature flag disabled code,
- non-sensitive event type,
- internal entity id only if policy allows internal logs,
- retryable true/false.

Safe metrics may include:

- count of blocked writes by reason code,
- count of payload validation failures,
- count of redaction failures,
- count of no-survey paths,
- count of sending blocked by flag.

Metrics labels must not include customer or channel identifiers.

## Future Tests

Future tests should cover:

1. Allowed `safe_context_summary` passes validation.
2. Unknown key fails validation.
3. Customer contact field fails validation.
4. Raw LINE id field fails validation.
5. Provider payload field fails validation.
6. Free text fails validation unless explicitly allowed.
7. `event_outbox.payload` contains only allow-listed keys.
8. `last_error` stores only safe code/message.
9. Payload redaction failure causes no survey write under strict atomic model.
10. Logs and test output do not include sensitive values.

Task139 does not add tests.

## Remaining Blockers

Before implementation:

1. Final allow-list reviewed by product/security.
2. Payload schema location chosen.
3. Runtime validator approved.
4. Error code taxonomy approved.
5. Redaction failure behavior approved.
6. Retention policy approved.
7. Admin visibility policy aligned with payload shape.

## Final Recommendation

Future runtime should build survey payloads from explicit allow-lists and reject unknown keys. Do not scrub large raw payloads after construction. Keep survey write-path payloads Case-level, safe, minimal, and channel-agnostic.

Task140 should continue with docs-only transaction boundary / recovery model decision, because payload validation failure behavior depends on whether the write-path is strict atomic or completion-first recovery.

## Non-goals

Task139 does not:

- implement payload validation,
- modify migration files,
- add migration files,
- apply migrations,
- execute DDL,
- connect to DB,
- run psql,
- run `npm run db:migrate`,
- modify schema or indexes,
- modify backend runtime,
- add repository or service files,
- implement feature flags,
- modify config or env parsing,
- modify API,
- modify Admin UI,
- modify smoke scripts,
- implement survey sending,
- implement notification sending,
- implement LINE / APP / SMS / email sending,
- implement delivery resolver runtime,
- implement outbox worker,
- implement response intake,
- implement webhook intake,
- seed notification templates or survey content,
- generate survey links or tokens,
- add Admin dashboard / manual send / resend / override,
- add manual finalAppointmentId picker,
- add AI runtime / model call / prompt pipeline,
- change repeat completion conflict guard,
- change finalAppointmentId inference ordering,
- hard-code LINE into completion core / survey trigger / intent / outbox,
- modify Task087 inventory guide,
- expand inventory docs,
- perform destructive cleanup,
- mutate shared runtime,
- print sensitive values.

## Verification Summary

Task139 verification should confirm:

- `npm run check` passes.
- `npm run admin:check` passes if executed.
- `git diff --check` passes.
- `npm run check` does not run migrations.
- `npm run db:migrate` remains separate and was not executed.
- No psql command was executed.
- This document contains no executable DB command packet.
- This document contains no runtime implementation instruction.
- Allow-list examples contain placeholders / safe enum values only.
- This document contains no actual `DATABASE_URL` value, password, token, secret, customer mobile, raw LINE user id, LINE channel secret, LINE access token, full payload, raw payload, or production data.
- This task made no code, config, API, Admin, or smoke changes.
