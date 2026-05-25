# Task423 — Customer-Facing Projection Service Skeleton Design Packet / No Runtime Change

Task423 defines the future design boundary for a customer-facing projection
service skeleton if explicit local-only runtime authorization is granted later.

This task is documentation-only. It does not modify projection utilities,
projection DTO utilities, forbidden field constants, response envelope
utilities, customerAccessContext utilities, API, DB, fixtures, tests, provider
sending, or AI runtime.

## Current Baseline

Task423 follows the Task370-422 customer-facing no-runtime baseline.

It especially follows:

- Task391: projection DTO safety hardening.
- Task398: forbidden field constants consolidation.
- Task416: projection allow-list checklist.
- Task419: route/controller skeleton design packet.
- Task420: resolver skeleton design packet.
- Task421: customerAccessContext skeleton design packet.
- Task422: response envelope / safe-deny skeleton design packet.

Current state remains:

- no customer-facing runtime,
- no projection service implementation,
- no projection utility modification,
- no projection DTO utility modification,
- no forbidden field constants modification,
- no response envelope utility modification,
- no safe-deny utility modification,
- no customerAccessContext utility modification,
- no resolver implementation,
- no route/controller/API implementation,
- no repository / DB access,
- no migration / schema / index,
- no fixture files added,
- no test files added,
- no scan script or CI added,
- no token/link persistence,
- no customer channel identity persistence,
- no audit/security event persistence,
- no localization/message catalog runtime,
- no provider sending,
- no AI / RAG / vector DB runtime,
- no smoke/browser/API/integration tests,
- no shared/prod/Zeabur runtime access.

Task423 is a projection service skeleton design packet, not implementation.

## Projection Service Purpose

Projection service is the customer-facing DTO builder boundary.

It may conceptually:

- receive customerAccessContext,
- receive allow-listed resource summary,
- receive route family / projection scope,
- produce customer-visible DTO,
- apply allow-list projection rules,
- reject or fail closed on forbidden field candidates.

Projection service must not:

- make formal authorization decision,
- replace resolver,
- replace customerAccessContext,
- query DB,
- call repository,
- wrap response envelope,
- trigger provider sending,
- modify Case status,
- modify Appointment status,
- modify Field Service Report status,
- decide finalAppointmentId,
- decide link reissue,
- decide customer fee consent,
- approve quote,
- approve settlement,
- close complaint,
- call AI provider,
- call RAG/vector DB.

Projection service shapes data; it does not authorize, mutate, send, or decide.

## Mandatory Future Flow

Future customer-facing projection work must remain inside this flow:

```text
request
-> route/controller
-> resolver
-> customerAccessContext
-> projection DTO / projection service
-> response envelope or generic safe-deny
```

Projection must not bypass customerAccessContext to read:

- raw resolver result,
- repository row,
- raw service report object,
- raw appointment object,
- raw case object,
- raw customer object,
- raw provider payload,
- raw token,
- raw channel identity.

## Projection Input Skeleton Proposal

The following input categories are future proposal only. Task423 does not
implement them.

Future projection service may receive:

- customerAccessContext,
- allow-listed resource summary,
- symbolic route family,
- projection scope,
- sanitized request reference,
- correlation reference.

Projection service must not receive or record:

- raw token,
- secret,
- `DATABASE_URL`,
- raw provider payload,
- raw channel id,
- actual `line_user_id` value,
- complete phone number,
- complete address,
- raw DB row,
- raw internal service report,
- raw appointment object,
- raw case object,
- raw customer object,
- internal note full text,
- audit/security event full text,
- AI raw payload,
- billing internal data,
- settlement internal data,
- raw customer document,
- signature/photo/file content.

Inputs must already be scoped by resolver/customerAccessContext. Projection
must not perform ad hoc resource discovery.

## Projection Output Skeleton Proposal

The following output categories are future proposal only. Task423 does not
implement them.

Projection output must be:

- customer-visible DTO,
- allow-list first,
- purpose-scoped,
- tenant-scoped,
- minimum necessary,
- safe for response envelope wrapping.

Rules:

- Unknown fields default deny.
- Forbidden fields default deny.
- Missing customerAccessContext must fail closed.
- Malformed customerAccessContext must fail closed.
- Denied customerAccessContext must fail closed.
- Unexpected forbidden field candidate must fail closed or be explicitly
  removed by a future approved policy.
- Output must not reveal internal denial category.
- Output must not reveal resource existence reason.
- Output must not reveal permission internal reason.
- Output must not reveal entitlement internal reason.
- Output must not reveal rate-limit/abuse reason.

## Route Family Projection Boundary

The table below is a future proposal only.

| Route family | Allowed purpose | Allowed customer-visible category | Forbidden category | Required context scope | Safe-deny / fail-closed behavior | No-existence-leakage note |
| --- | --- | --- | --- | --- | --- | --- |
| Service report view | Show customer-facing service result summary. | Service date, service result summary, customer-safe parts summary, customer-safe photo metadata, signature/exception summary, confirmed customer charge/invoice summary if applicable. | Internal report, internal note, audit log, AI raw payload, billing/settlement internal data, engineer comments, supervisor review, vendor rules. | service_report_view. | Fail closed if context/scope/summary invalid. | Denial must not reveal report existence. |
| Appointment summary view | Show customer-facing appointment information. | Confirmed/proposed time, service window, safe status summary, preparation notes. | Dispatch ranking, route clustering, engineer internal notes, internal SLA risk, internal parts risk, complaint internal classification. | appointment_summary_view. | Fail closed if context/scope/summary invalid. | Denial must not reveal appointment existence. |
| Completion status view | Show customer-facing completion status or next step. | Customer-safe completion summary, report availability status, support/follow-up option. | Internal completion transition, finalAppointmentId resolution details, audit, billing/settlement reasons. | completion_status_view. | Fail closed if context/scope/summary invalid. | Denial must not reveal internal case/report state. |
| Issue/follow-up acknowledgement | Acknowledge submitted issue or support request. | Generic acknowledgement, safe next-step wording. | Case/report existence confirmation, complaint internal category, support routing internals, audit details. | issue_follow_up_acknowledgement. | Generic acknowledgement or fail closed. | Acknowledgement is not full case access. |
| Survey/feedback acknowledgement | Acknowledge feedback/survey interaction. | Generic thanks/acknowledgement, safe next-step wording. | Report raw content, AI risk flag, complaint triage details, internal scoring workflow. | survey_feedback_acknowledgement. | Generic acknowledgement or fail closed. | Survey/feedback is not service report access. |

Boundary rules:

- Survey/feedback acknowledgement does not equal service report access.
- Issue/follow-up acknowledgement does not equal full case access.
- Appointment summary does not equal full service report access.
- Route family scope must not be expanded by projection.

## Always-Forbidden Projection Output

Customer-facing projection must not output:

- internal note,
- audit log,
- audit/security event data,
- AI raw payload,
- raw provider payload,
- billing internal data,
- settlement internal data,
- vendor reconciliation rules,
- engineer internal comments,
- supervisor review,
- internal dispatch ranking,
- AI dispatch suggestion raw reason,
- raw token,
- raw channel id,
- `line_user_id`,
- complete phone number,
- complete address,
- secret,
- `DATABASE_URL`,
- cross-organization data,
- permission internal reason,
- entitlement internal reason,
- rate-limit internal reason,
- abuse internal reason,
- resolver denial reason,
- customerAccessContext internals beyond allowed symbolic references.

## Field Service Report Boundary

Projection service must preserve Field Service Report invariants.

Rules:

- One Case can have only one formal Field Service Report.
- One Case can have multiple appointments / dispatch visits.
- Customer-facing service report is a projection, not raw internal report.
- Multiple appointments / dispatch visits must not be projected as multiple
  formal reports.
- Projection must not decide finalAppointmentId.
- Projection must not create, modify, reopen, or recomplete a report.
- Customer signature, exception, remote completion, or dispute context can be
  shown only as customer-visible summary.
- Internal review, audit, and dispute handling full text must not be shown.

## Appointment / Completion Boundary

Appointment summary may show only customer-relevant and authorized information.

Do not output:

- internal dispatch ranking,
- engineer internal comments,
- route clustering,
- internal parts risk,
- internal SLA risk,
- customer complaint internal classification,
- AI dispatch raw reasoning,
- route optimization detail,
- resource existence reason.

Completion status projection must not modify completion status.

Customer unresolved issue, low score, negative feedback, or callback request
may only form future follow-up / escalation proposal. Projection must not close,
hide, downgrade, or modify official records.

## Billing / Charge Visibility Boundary

If fees are included, projection may show only customer-relevant confirmed
charge / approval / invoice information.

Allowed categories:

- customer-visible charge item,
- customer agreed amount,
- customer approval summary,
- approval time/channel summary,
- invoice or receipt state,
- payment state if applicable and authorized.

Forbidden categories:

- settlement internal rule,
- vendor contract logic,
- finance approval internal note,
- reconciliation difference,
- internal cost,
- vendor payable amount,
- internal adjustment proposal,
- AI settlement raw reasoning.

AI must not agree to customer fees or approve official amounts.

## Channel / Identity Boundary

Projection must not use `line_user_id` as global identity.

Rules:

- LINE, SMS, Email, App, Web Link, and future phone-assisted flow are channel
  instances.
- Projection uses only customerAccessContext symbolic / verified /
  consent-scoped context.
- Projection output must not show raw channel identity.
- Projection output must not show binding state.
- Projection output must not show verification internal reason.
- Projection output must not show consent internal reason.
- Projection output must not imply LINE is the only customer channel.

## Fail-Closed Matrix

Future projection should fail closed for these cases.

| Condition | Projection behavior | External behavior | No-existence-leakage assertion | Audit/security event candidate |
| --- | --- | --- | --- | --- |
| Missing customerAccessContext | Fail closed. | Generic safe-deny. | Must not reveal context/resource existence. | Future only. |
| Malformed customerAccessContext | Fail closed. | Generic safe-deny. | Must not reveal context internals. | Future only. |
| Denied context | Fail closed. | Generic safe-deny. | Must not expose denial reason. | Future only. |
| Missing projection scope | Fail closed. | Generic safe-deny. | Must not reveal projection availability. | Future only. |
| Unknown projection scope | Fail closed. | Generic safe-deny. | Must not reveal supported scopes. | Future only. |
| Mismatched route family | Fail closed. | Generic safe-deny. | Must not reveal route/resource mismatch. | Future only. |
| Missing allow-listed resource summary | Fail closed. | Generic safe-deny. | Must not reveal resource existence. | Future only. |
| Malformed resource summary | Fail closed. | Generic safe-deny. | Must not reveal schema/internal state. | Future only. |
| Unexpected forbidden field candidate | Fail closed or future explicit reject. | Generic safe-deny. | Must not reveal forbidden field presence. | Future only. |
| Cross-organization resource candidate | Fail closed. | Generic safe-deny. | Must not reveal cross-tenant mismatch. | Future only. |
| Raw token present | Fail closed. | Generic safe-deny. | Must not reveal token state. | Future only. |
| Raw channel id present | Fail closed. | Generic safe-deny. | Must not reveal channel identity state. | Future only. |
| Raw provider payload present | Fail closed. | Generic safe-deny. | Must not reveal provider data. | Future only. |
| Internal note candidate present | Fail closed. | Generic safe-deny. | Must not reveal internal note existence. | Future only. |
| Billing/settlement internal candidate present | Fail closed. | Generic safe-deny. | Must not reveal internal finance data. | Future only. |

Internal categories remain future-only and must not be customer-visible.

## Synthetic Local-Only Projection Option

This is a future option only. Task423 does not authorize or implement it.

If explicit local-only runtime authorization is granted, the safest initial
projection skeleton should prefer:

- no DB,
- no provider sending,
- no AI provider,
- no RAG,
- no vector DB,
- synthetic in-memory fixtures only,
- sanitized symbolic references only,
- allow-listed DTO only,
- fail-closed default,
- existing pure utilities only,
- no persistent audit/security event writes.

The future option must satisfy:

- Task415 local-only runtime authorization checklist,
- Task417 synthetic fixture policy,
- Task418 sensitive scan checklist,
- Task419 route/controller skeleton design packet,
- Task420 resolver skeleton design packet,
- Task421 customerAccessContext skeleton design packet,
- Task422 response envelope / safe-deny skeleton design packet.

## Explicit Non-goals

Task423 does not:

- modify `src/`,
- modify `admin/src/`,
- modify projection utilities,
- modify projection DTO utilities,
- modify forbidden field constants,
- modify response envelope utilities,
- modify safe-deny utilities,
- modify customerAccessContext utilities,
- add resolver files,
- add route files,
- add controller files,
- add API runtime,
- add repository runtime,
- add fixture files,
- add test files,
- add or modify smoke tests,
- add scan scripts,
- add CI configuration,
- run smoke/browser/API/DB tests,
- modify `package.json`,
- modify localization files or message catalogs,
- implement permission runtime,
- implement audit/security event tables,
- implement audit/security event query runtime,
- implement support workflow runtime,
- implement case runtime,
- implement complaint runtime,
- implement follow-up runtime,
- implement link reissue runtime,
- implement rate-limit middleware,
- implement abuse detection runtime,
- add DB access,
- add or modify migration/schema/index,
- execute DB/DDL/psql/`npm run db:migrate`/Migration020 dry-run/apply,
- touch shared/prod/Zeabur runtime,
- add audit write / log runtime / worker,
- trigger LINE/SMS/Email/App/survey/provider sending,
- call AI provider, RAG, vector DB, prompt, worker, or model runtime,
- add file/photo/signature/document storage runtime,
- add billing/settlement/inventory runtime,
- process real token, secret, customer personal data, raw channel data, or raw
  provider payload.

## Decision

Task423 records a future customer-facing projection service skeleton design
packet only.

Decision summary:

- Projection service is a customer-facing DTO builder boundary.
- Projection service is not authorization, response envelope, repository, DB,
  provider sending, AI, or mutation layer.
- Projection output must be allow-list first and customer-visible only.
- Projection must fail closed on missing/malformed context, unknown scope,
  forbidden field candidates, cross-organization resource candidates, raw token,
  raw channel id, raw provider payload, and internal finance or note candidates.
- Field Service Report invariants remain unchanged.
- No projection/runtime/API/DB/test/provider/AI work is implemented by Task423.

## Verification Plan

For Task423 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw channel data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only design packet.

## Redaction Note

This document contains policy terms such as token, secret, raw channel id,
phone, address, provider payload, `DATABASE_URL`, `line_user_id`, and Zeabur
only as examples of data or runtime boundaries that must not be exposed or
touched without authorization. It does not include credentials, database URLs,
access tokens, secrets, complete customer phone numbers, complete customer
addresses, raw channel identifiers, raw provider payloads, verification codes,
or production data details.
