# Task416 — Customer-Facing Projection Allow-List Checklist / No Runtime Change

Task416 defines a future customer-facing projection allow-list checklist for
service report view, appointment summary view, completion status view,
issue/follow-up acknowledgement, and survey/feedback acknowledgement.

This task is documentation-only. It does not modify projection utilities,
forbidden-field constants, tests, runtime, API, DB, provider sending, or AI
runtime.

## Current Baseline

Task416 follows the Task370-415 customer-facing no-runtime baseline.

Already accepted:

- Customer-facing pure utilities.
- Forbidden field constants.
- Projection DTO / projection service skeleton.
- Pure utility unit tests.
- Runtime entry gate decision packet.
- Route/controller contract proposal.
- Resolver contract proposal.
- Customer channel identity proposal.
- Token/link lifecycle proposal.
- Audit/security event proposal.
- Audit/security event permission matrix.
- Generic safe-deny localization/message key proposal.
- Safe-deny test matrix proposal.
- Runtime readiness cutline.
- Rate-limit / abuse protection proposal.
- Support fallback workflow proposal.
- Local-only runtime authorization checklist.

Current state remains:

- no customer-facing runtime,
- no projection runtime,
- no projection utility modification,
- no forbidden field constants modification,
- no route/controller/API implementation,
- no resolver runtime,
- no repository / DB access,
- no migration / schema / index,
- no token/link persistence,
- no customer channel identity persistence,
- no audit/security event persistence,
- no localization/message catalog runtime,
- no provider sending,
- no AI / RAG / vector DB runtime,
- no smoke/browser/API/integration tests,
- no shared/prod/Zeabur runtime access.

Task416 is a docs-only projection checklist, not a runtime or code change.

## Projection Principles

Future customer-facing projection must be allow-list first.

Principles:

- Unknown field defaults to deny.
- Forbidden fields default to deny.
- Customer-facing DTO must not be emitted directly from raw DB rows.
- Customer-facing DTO must not be emitted directly from raw service report
  objects.
- Customer-facing DTO must not be emitted directly from raw appointment
  objects.
- Projection must not receive an unverified customer-facing request.
- Projection must not bypass resolver or customerAccessContext.
- Projection must not make the formal authorization decision.
- Authorization belongs to resolver / access context.
- Projection must not modify Case status.
- Projection must not modify Appointment status.
- Projection must not modify Field Service Report status.
- Projection must not decide finalAppointmentId.
- Projection must not write audit/security events.
- Projection must not trigger provider sending.

Projection is a shaping layer, not an authorization or mutation layer.

## Customer-Visible Route Family Allow-List Checklist

The table below is a future proposal only. Task416 does not implement any route
or projection runtime.

| Route family | Allowed purpose | Possible customer-visible field category | Forbidden field category | Safe-deny fallback requirement | No-existence-leakage note |
| --- | --- | --- | --- | --- | --- |
| Service report view | Show customer-safe service result summary after authorized access. | Case reference, service date, customer-safe service summary, customer-visible parts summary, customer-visible photos summary, customer-visible signature/exception summary, confirmed customer charge/invoice summary if applicable. | Internal report fields, internal notes, audit log, AI raw payload, billing/settlement internal data, engineer internal comments, supervisor review, vendor reconciliation rules, raw token, raw channel id. | Generic safe-deny if unauthorized, hidden, deleted, unavailable, or invalid access. | Must not reveal whether report exists when access is denied. |
| Appointment summary view | Show customer-safe appointment information for a purpose-scoped request. | Confirmed or proposed customer-visible appointment time, service window, safe status summary, customer-facing preparation notes. | Internal dispatch ranking, engineer internal notes, route clustering, internal SLA risk, parts risk, customer complaint internal classification. | Generic safe-deny if unauthorized, invalid, hidden, or unavailable. | Must not reveal whether appointment exists when denied. |
| Completion status view | Show customer-safe completion status or next step. | Customer-facing completion state, safe report availability summary, support/follow-up entry availability. | Raw internal completion state transitions, audit log, internal finalAppointmentId resolution detail, settlement/billing reasons. | Generic safe-deny if unauthorized or unavailable. | Must not reveal internal report/case state beyond authorized projection. |
| Issue/follow-up acknowledgement | Acknowledge a submitted issue or support request. | Generic acknowledgement, support next-step summary, safe reference if already authorized. | Confirmation that a hidden case/report exists, internal support routing, complaint internal category, audit details. | Generic acknowledgement or generic safe-deny. | Acknowledgement is not full case access. |
| Survey/feedback acknowledgement | Acknowledge feedback submission or display customer-safe survey state. | Generic feedback acknowledgement, safe thanks/next-step message. | Internal scoring workflow, AI risk flag, complaint triage details, report raw content. | Generic acknowledgement or generic safe-deny. | Survey/feedback link is not service report access. |

Boundary notes:

- Survey/feedback link does not equal service report access.
- Issue/follow-up acknowledgement does not equal full case access.
- Appointment summary does not equal full report access.
- Completion status does not equal billing/settlement/audit access.

## Always-Forbidden Output Fields

Customer-facing projection must never output:

- internal note,
- audit log,
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
- resolver denial reason.

These fields may appear only as internal policy concepts in design documents or
future internal audit/security models. They must not appear in customer-facing
DTOs or customer-visible fixture output.

## Field Service Report Boundary

Field Service Report invariants remain unchanged:

- One Case can have only one formal Field Service Report.
- One Case can have multiple appointments / dispatch visits.
- Customer-facing service report is a projection, not raw internal report.
- Multiple appointments / dispatch visits must not be projected as multiple
  formal Field Service Reports.
- finalAppointmentId must remain backend/system-inferred or approved override in
  backend business logic.
- Customer-facing projection must not decide finalAppointmentId.
- Customer-facing projection must not modify completion state.
- Customer-facing projection must not reopen, recomplete, or overwrite a
  completed report.

Customer signature, signature exception, remote completion, and dispute context
may be displayed only as customer-visible summary. Projection must not expose
internal review, audit, dispute handling, supervisor notes, or full exception
workflow details.

## Appointment / Completion Boundary

Appointment summary should show only customer-relevant and authorized
information.

Allowed categories may include:

- confirmed or proposed service time,
- safe appointment status summary,
- customer-facing preparation notes,
- service window,
- safe reschedule/support next step.

Forbidden categories include:

- internal dispatch ranking,
- engineer internal comments,
- route clustering,
- parts risk,
- internal SLA risk,
- customer complaint internal classification,
- AI dispatch raw reasoning,
- customer identity binding internals,
- resolver denial reason.

Completion status endpoint must not allow customer-facing access to directly
change completion state. Customer reports of unresolved issue, low score,
negative feedback, or callback request should only form future follow-up /
escalation proposals and must not auto-close, auto-hide, or auto-modify
official records.

## Billing / Charge Visibility Boundary

Customer-facing projection may show billing-related data only when it is
customer-relevant and confirmed.

Allowed categories may include:

- customer-visible charge item,
- amount agreed by customer,
- customer approval summary,
- approval time/channel summary,
- invoice or receipt state,
- payment state if applicable and authorized.

Forbidden categories include:

- settlement internal rule,
- vendor contract logic,
- finance approval internal note,
- reconciliation difference,
- internal cost,
- internal adjustment suggestion,
- vendor payable amount,
- engineer cost,
- settlement exception internal reason,
- AI settlement raw reasoning.

AI must not agree to customer fees, approve official amounts, or modify billing
or settlement outcomes.

## Channel / Identity Boundary

Projection must not use `line_user_id` as global identity.

Rules:

- LINE, SMS, Email, App, and Web Link are channel instances.
- Channel does not equal authorization.
- Provider delivery success does not equal identity verification.
- Customer channel identity must be resolved by resolver/customerAccessContext.
- Projection receives only symbolic or verified context needed to shape output.
- Projection output must not show raw channel identity.
- Projection output must not show binding state unless a future customer-visible
  policy explicitly allows a generic safe status.
- Projection output must not reveal whether a hidden channel identity exists.

## Audit / AI / Observability Boundary

Projection must not contain audit/security event data.

Projection must not output:

- rate-limit category,
- abuse category,
- permission category,
- entitlement category,
- resolver denial category,
- audit/security event detail.

AI may assist with customer-facing summary drafting only when using masked,
minimized, permission-filtered metadata and only under human/system policy
review.

AI must not:

- read raw token,
- read raw provider payload,
- read complete phone number,
- read complete address,
- read internal note full text,
- read audit/security full text,
- directly generate official customer-facing report without policy-controlled
  projection,
- decide authorization,
- decide safe-deny,
- modify official records.

## Future Checklist Before Code

The checklist below is future-only. Task416 does not implement it.

- Define per-route-family allow-list.
- Define forbidden field constants mapping.
- Define fixture policy with synthetic data only.
- Define projection equivalence tests.
- Define safe-deny fallback tests.
- Define customer-visible charge field rules.
- Define appointment/report relationship assertions.
- Define audit/security exclusion assertions.
- Define AI raw context exclusion assertions.
- Define no raw channel identity assertions.
- Define no complete phone/address assertions.
- Define one Case equals one formal Field Service Report assertions.

Each item needs a separate future implementation or test authorization before
code changes begin.

## Explicit Non-goals

Task416 does not:

- modify `src/`,
- modify `admin/src/`,
- modify projection utilities,
- modify forbidden field constants,
- add or modify test files,
- add or modify smoke tests,
- run smoke/browser/API/DB tests,
- modify `package.json`,
- modify localization files or message catalogs,
- implement API / route / controller runtime,
- implement resolver runtime,
- implement repository runtime,
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

Task416 records a future customer-facing projection allow-list checklist only.

Decision summary:

- Projection must be allow-list first.
- Unknown fields and forbidden fields default to deny.
- Projection is not authorization.
- Projection must not mutate Case, Appointment, or Field Service Report state.
- Customer-facing service report remains a projection, not raw internal report.
- Customer-facing output must exclude internal, audit, AI raw, billing,
  settlement, raw token, raw channel id, `line_user_id`, complete phone, complete
  address, permission, entitlement, rate-limit, abuse, and resolver-denial
  details.
- DB/API/runtime/provider/localization/smoke/browser work remains blocked.

## Verification Plan

For Task416 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw channel data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only checklist.

## Redaction Note

This document contains policy terms such as token, secret, raw channel id,
phone, address, provider payload, `DATABASE_URL`, `line_user_id`, and Zeabur
only as examples of data or runtime boundaries that must not be exposed or
touched without authorization. It does not include credentials, database URLs,
access tokens, secrets, complete customer phone numbers, complete customer
addresses, raw channel identifiers, raw provider payloads, verification codes,
or production data details.
