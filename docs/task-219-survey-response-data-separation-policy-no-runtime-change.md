# Task 219 - Survey Response Data Separation Policy / No Runtime Change

## Purpose and Scope

Task219 defines a documentation-only policy for future survey response data separation.

The policy defines how future customer satisfaction survey response data should remain separate from Field Service Reports, internal notes, complaint/follow-up workflows, AI suggestions, audit logs, provider diagnostics, and billing/settlement internal data.

Task219 is not:

- survey response runtime implementation,
- DB schema or migration proposal,
- API contract implementation,
- Admin UI implementation,
- customer portal implementation,
- complaint workflow implementation,
- AI analysis implementation,
- provider delivery implementation,
- automated test implementation.

## Response Data Ownership and Boundaries

Future survey responses should be treated as customer feedback / satisfaction records.

Principles:

- survey response should not become part of the Field Service Report,
- Field Service Report remains the Case-level final completion summary,
- Field Service Report should not carry low ratings,
- Field Service Report should not carry complaint handling notes,
- Field Service Report should not carry follow-up records,
- Field Service Report should not carry AI analysis results,
- multi-visit Cases may link survey response to the final completed appointment context,
- customer feedback may still describe the whole service experience,
- survey response must not change Case status,
- survey response must not change Appointment status,
- survey response must not change Field Service Report status,
- survey response must not approve billing or settlement,
- survey response must not replace audit log.

## Customer-Visible vs Internal Data Separation

Future survey data should be separated into clear visibility categories.

### Customer-Visible Data

Customer-visible data may include:

- survey questions,
- customer-submitted rating,
- customer-submitted comment,
- general submission success message,
- already-submitted message,
- expired/unavailable message,
- safe basic service context if later approved.

Customer-visible data must not expose internal review, routing, audit, billing, provider, or AI internals.

### Internal Operational Data

Internal operational data may include:

- response received time,
- response review status,
- low-rating marker,
- follow-up required marker,
- complaint risk marker,
- supervisor review status,
- service recovery note,
- internal routing note.

Internal operational data is not automatically customer-visible.

### AI Advisory Data

Future AI advisory data may include:

- AI summary,
- sentiment label,
- complaint risk suggestion,
- suggested follow-up category,
- confidence,
- explanation,
- human accepted/rejected status.

AI advisory data is not official customer text and must not be treated as fact without human/system confirmation.

### Audit Data

Future audit data may include:

- response submitted,
- response viewed,
- response classified,
- follow-up created,
- AI suggestion generated,
- AI suggestion accepted,
- AI suggestion rejected,
- supervisor review completed,
- export requested.

Audit data is internal-only and must not be customer-visible.

### Provider / Delivery Diagnostics

Future delivery diagnostics may include:

- delivery channel,
- delivery attempt status,
- provider failure category,
- retry metadata,
- suppression reason.

Provider and delivery diagnostics are internal-only and must be redacted.

## Forbidden Data Mixing

Future implementation must not:

- write survey response into service report internal note,
- write low rating directly into engineer internal comment,
- treat AI summary as customer original text,
- treat AI inference as official fact,
- mix complaint review note into Field Service Report,
- mix billing / settlement internal decision into survey response,
- show provider diagnostics to customers,
- show audit log to customers,
- write raw AI payload into general note,
- write raw provider payload into general note,
- write token values into general note,
- write secret values into general note,
- write full phone/mobile values into general note,
- write raw LINE user id into general note,
- paste sensitive values into handoff or QA artifacts.

## Role-Based Visibility Readiness

Task219 does not implement permissions. It records future visibility questions.

### Customer

May see:

- their own submitted response,
- general submission status.

Must not see:

- internal review,
- AI suggestion,
- audit log,
- provider diagnostics,
- engineer internal notes,
- billing / settlement internal data.

### Customer Service / Dispatcher

May see in future if permission allows:

- rating,
- customer comment,
- follow-up required marker,
- limited delivery status.

Should not see by default:

- sensitive diagnostics,
- raw provider payload,
- hidden AI raw payload,
- settlement internal data.

### Supervisor / Quality Manager

May see in future if permission allows:

- low-rating queue,
- complaint risk,
- follow-up history,
- AI advisory summary,
- review decisions,
- service recovery workflow status.

### Engineer

Engineer visibility requires extra care.

Default principle:

- engineer should not automatically see full low-rating or complaint content,
- if future policy allows visibility, it should be minimal, scoped, and justified,
- content may need de-identification or limitation to avoid retaliation risk,
- internal complaint handling notes should remain restricted unless clear permission and business need exist.

### Admin / Tenant Admin

May see in future if permission and entitlement allow:

- scoped summary,
- role-permitted survey analytics,
- feature entitlement / usage state.

Must not:

- cross organization scope,
- bypass customer-visible/internal separation,
- bypass permission or entitlement checks.

## Low-Rating and Complaint Separation

Low rating is not automatically a formal complaint.

Principles:

- survey response may trigger future complaint risk review,
- formal complaint creation should require explicit policy and/or human confirmation,
- AI may suggest possible follow-up but must not create or close formal complaint automatically,
- service recovery, refund, compensation, supervisor review, and complaint workflows should be separate from survey response,
- survey response should be traceable for quality review,
- survey response must not pollute the Field Service Report official record.

## Data Lifecycle Readiness

Task219 does not implement lifecycle rules. Future decisions should cover:

- whether submitted response can be edited,
- whether customer can add supplemental response,
- whether customer can withdraw response,
- how internal review notes are retained,
- how AI suggestions are retained,
- how audit logs are retained,
- how exports are de-identified,
- how organization deletion or retention policy affects survey data,
- how legal hold / dispute / complaint case retention works,
- whether retention differs by tenant plan or policy,
- how survey response deletion interacts with audit integrity.

## Sensitive Data and Redaction Policy

Future survey response implementation must not record or expose:

- full phone/mobile values,
- raw LINE user id,
- token values,
- secret values,
- LINE access token values,
- channel secret values,
- provider credential values,
- raw provider payloads,
- raw AI payloads,
- `DATABASE_URL`,
- internal diagnostics in customer-visible response,
- sensitive values in logs,
- sensitive values in screenshots,
- sensitive values in QA artifacts,
- sensitive values in handoff reports.

If a channel or contact must be identified, use scoped reference, masked display, or internal reference.

## Organization Isolation

Future survey response data must be organization scoped.

Requirements:

- every future API must enforce organization scope,
- every future Admin view must enforce organization scope,
- every future export must enforce organization scope,
- every future AI analysis must enforce organization scope,
- every future audit view must enforce organization scope,
- Admin permission must not override organization isolation,
- cross-organization aggregation requires separate de-identification, authorization, and entitlement design,
- customer-facing errors must not reveal whether a Case exists,
- customer-facing errors must not reveal whether a phone/mobile value is correct,
- customer-facing errors must not reveal whether LINE is bound.

## AI Advisory-Only Boundary

AI may assist future survey response workflows by:

- summarizing customer feedback,
- classifying sentiment,
- suggesting follow-up category,
- flagging complaint risk,
- helping supervisors prepare follow-up points,
- drafting internal customer-service response suggestions.

AI must not:

- automatically modify official survey response content,
- automatically modify Case status,
- automatically modify Appointment status,
- automatically modify Field Service Report status,
- automatically create formal complaint,
- automatically close formal complaint,
- automatically decide engineer responsibility,
- automatically approve refund,
- automatically approve compensation,
- automatically approve discount,
- automatically approve quote,
- automatically approve settlement,
- automatically notify customer of compensation,
- bypass permission,
- bypass organization scope,
- bypass entitlement,
- write uncertain inference into official record.

## SaaS-Ready / Entitlement Readiness

Task219 does not implement entitlement.

Possible placeholder future feature keys:

- `survey_response_view`,
- `survey_response_export`,
- `survey_low_rating_queue`,
- `survey_ai_summary`,
- `survey_follow_up_workflow`,
- `survey_analytics`,
- `survey_data_retention_policy`,
- `survey_cross_channel_response_linking`.

These are placeholders only and not production feature keys.

Task219 does not:

- add entitlement runtime,
- add usage metering runtime,
- add billing runtime,
- add subscription runtime,
- add plan pricing runtime.

Permission and entitlement remain separate.

## Audit Readiness

Future audit events may include:

- survey response submitted,
- survey response viewed,
- survey response classified,
- low rating flagged,
- low rating dismissed,
- complaint review created,
- follow-up action created,
- follow-up action completed,
- AI summary generated,
- AI suggestion accepted,
- AI suggestion rejected,
- response exported,
- response redacted,
- response deletion requested,
- customer-visible response rendered,
- internal note added to follow-up record.

Audit redaction requirements:

- do not record full phone/mobile values,
- do not record raw LINE user id,
- do not record token values,
- do not record secret values,
- do not record provider credential values,
- do not record raw provider payloads,
- do not record AI raw payloads,
- do not expose audit data to customer-visible surfaces.

Task219 does not implement audit runtime.

## Explicit Non-Goals

Task219 does not:

- create survey response table,
- create complaint table,
- add migration,
- modify schema,
- add API,
- modify backend service / repository / controller code,
- modify Admin UI,
- add customer portal,
- add survey analytics,
- add AI analysis runtime,
- add provider integration,
- send LINE / SMS / email / APP,
- add outbox / worker,
- add survey token,
- add survey web form,
- add automated tests,
- add fixtures,
- add smoke tests,
- add localization file,
- modify `package.json`,
- modify inventory docs,
- touch Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- execute DDL,
- run cleanup commands,
- touch shared Zeabur runtime.

## Future Implementation Approval Boundary

Future implementation requires separate PM/user approval for:

1. survey response data model,
2. complaint/follow-up data model,
3. customer-visible response contract,
4. internal operational data contract,
5. AI advisory data contract,
6. audit data contract,
7. provider diagnostic retention and redaction,
8. permission and entitlement model,
9. lifecycle / retention policy,
10. export and de-identification policy,
11. test and fixture strategy.

General continuation wording does not approve any of the above.

## Future Task Candidates

Possible next docs-only tasks:

- Task220 - Survey Low-Rating and Complaint Follow-Up Workflow Design / No Runtime Change.
- Task220 - Survey Audit Event Catalog / No Runtime Change.
- Task220 - Survey Idempotency and Manual Resend Policy / No Runtime Change.
- Task220 - Survey Permission and Entitlement Readiness Matrix / No Runtime Change.
- Task220 - Survey Data Retention and Export Policy / No Runtime Change.

These are candidates only. Task219 does not execute them.

## Verification Checklist

Task219 should be considered valid only if:

- it remains documentation-only,
- it changes only docs,
- it does not modify backend `src/`,
- it does not modify `admin/src/`,
- it does not modify migrations, schema, or indexes,
- it does not modify routes, controllers, services, or repositories,
- it does not modify OpenAPI / Swagger or generated clients,
- it does not create tests, fixtures, smoke tests, or QA scripts,
- it does not create localization files,
- it does not modify `package.json`,
- it does not modify inventory docs,
- it does not connect to DB,
- it does not run DDL,
- it does not run psql,
- it does not run `npm run db:migrate`,
- it does not dry-run/apply Migration 020,
- it does not run cleanup commands,
- it does not touch shared Zeabur runtime,
- it does not send LINE / APP / SMS / email,
- it does not add provider sending,
- it does not add notification runtime,
- it does not add survey runtime,
- it does not add outbox / worker,
- it does not add survey token or web form,
- it does not add AI analysis runtime,
- it does not add AI automatic decisions,
- it contains no sensitive values,
- it does not violate `docs/PROJECT_GUARDRAILS.md`.
