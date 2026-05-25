# Task419 — Customer-Facing Route / Controller Skeleton Design Packet / No Runtime Change

Task419 defines the future design boundary for a customer-facing route /
controller skeleton if explicit local-only runtime authorization is granted
later.

This task is documentation-only. It is not a runtime kickoff and does not add
route, controller, API, resolver, repository, fixture, test, DB, provider, or AI
runtime files.

## Current Baseline

Task419 follows the Task370-418 customer-facing no-runtime baseline.

It especially follows:

- Task404: route/controller contract proposal.
- Task405: resolver contract proposal.
- Task411: safe-deny test matrix proposal.
- Task415: local-only runtime authorization checklist.
- Task416: projection allow-list checklist.
- Task417: synthetic fixture policy.
- Task418: fixture sensitive scan checklist.

Current state remains:

- no customer-facing runtime,
- no route/controller/API implementation,
- no resolver runtime,
- no repository / DB access,
- no migration / schema / index,
- no fixture files added,
- no test files added,
- no scan script or CI added,
- no projection utility modification,
- no forbidden field constants modification,
- no token/link persistence,
- no customer channel identity persistence,
- no audit/security event persistence,
- no localization/message catalog runtime,
- no provider sending,
- no AI / RAG / vector DB runtime,
- no smoke/browser/API/integration tests,
- no shared/prod/Zeabur runtime access.

Task419 is a skeleton design packet, not implementation.

## Future Skeleton Purpose

If a future local-only runtime branch is explicitly approved, the
route/controller skeleton should be only an orchestration layer.

Controller must not:

- make the formal authorization decision,
- bypass resolver,
- bypass customerAccessContext,
- directly query DB,
- directly call repository,
- directly produce customer-facing DTO from raw internal data,
- directly send LINE,
- directly send SMS,
- directly send Email,
- directly send App push,
- directly send survey,
- directly call AI provider,
- directly call RAG/vector DB,
- modify Case status,
- modify Appointment status,
- modify Field Service Report status,
- decide finalAppointmentId,
- create, close, or reopen a Case,
- create, close, or resolve a complaint,
- reissue links.

Controller may only coordinate request parsing, resolver invocation, projection
handoff, and response envelope generation under the future approved design.

## Mandatory Future Flow

Future customer-facing route/controller skeleton must follow this flow:

```text
request
-> route/controller
-> resolver
-> customerAccessContext
-> projection DTO / projection service
-> response envelope or generic safe-deny
```

No skeleton design may bypass this path.

Required boundaries:

- Route/controller parses and sanitizes request references.
- Resolver owns access decision.
- customerAccessContext carries symbolic/verified context.
- Projection creates allow-listed customer-visible DTO.
- Response envelope controls generic success/safe-deny shape.
- Safe-deny remains generic and no-existence-leaking.

## Future Route Family Skeleton Proposal

The table below is a future proposal only. Task419 does not add routes.

| Route family | Purpose | Required resolver input category | Required projection category | Safe-deny fallback | Forbidden direct dependency | No-existence-leakage note |
| --- | --- | --- | --- | --- | --- | --- |
| Service report view | Show authorized customer-facing service report projection. | Route family, sanitized token/link ref, symbolic channel/customer context if available. | Customer-facing service report projection. | Generic safe-deny. | DB client, repository, raw Field Service Report, provider client, AI provider. | Denial must not reveal whether report exists. |
| Appointment summary view | Show authorized customer-facing appointment summary. | Route family, sanitized token/link ref, symbolic appointment/case ref, symbolic channel/customer context. | Customer-facing appointment summary projection. | Generic safe-deny. | DB client, repository, raw appointment object, dispatch ranking, route optimizer. | Denial must not reveal whether appointment exists. |
| Completion status view | Show authorized completion status or safe next step. | Route family, sanitized request ref, symbolic case/report context. | Customer-facing completion status projection. | Generic safe-deny. | Raw report state transition logic, case mutation, report mutation. | Denial must not reveal internal report/case status beyond authorized projection. |
| Issue/follow-up acknowledgement | Receive or acknowledge customer issue/follow-up intent. | Route family, sanitized request ref, optional symbolic context. | Generic acknowledgement projection. | Generic acknowledgement or generic safe-deny. | Case creation, complaint closure, raw support workflow, AI decision engine. | Acknowledgement must not confirm case/report/appointment existence. |
| Survey/feedback acknowledgement | Acknowledge customer feedback/survey interaction. | Route family, sanitized request ref, optional symbolic survey/context ref. | Generic feedback acknowledgement projection. | Generic acknowledgement or generic safe-deny. | Survey sending, report access, complaint closure, AI scoring mutation. | Survey/feedback link is not service report access. |

## Controller Dependency Boundary

Future controller may depend on:

- resolver interface,
- customerAccessContext builder,
- projection service,
- response envelope utility,
- safe-deny utility,
- sanitized request reference utility,
- request validation helper that does not expose sensitive values,
- logger that redacts raw token/channel/customer data.

Future controller must not depend on:

- repository,
- DB client,
- raw model object,
- provider client,
- AI provider,
- RAG/vector DB,
- billing / settlement engine,
- audit/security event persistence writer,
- LINE-only identity helper,
- raw token parser that exposes token value to logs,
- customer-facing DTO builder that accepts raw internal records,
- case/appointment/report mutation service,
- provider sending service.

## Request Parsing Boundary

Request parsing may create sanitized or symbolic references only.

Rules:

- Do not log raw token.
- Do not print raw token.
- Do not expose raw channel id.
- Do not expose complete phone number.
- Do not expose complete address.
- Do not expose raw provider payload.
- Do not expose raw `line_user_id`.
- Do not expose exact malformed reason to the customer.
- Missing, malformed, suspicious, or ambiguous input should go to generic
  safe-deny.
- Controller must not translate malformed reason into customer-visible message
  key.
- Request parsing must not query protected resources directly.

If future local-only skeleton uses fixtures, they must follow Task417 synthetic
fixture policy and Task418 sensitive scan checklist.

## Safe-Deny Behavior

Future skeleton must externally collapse sensitive failures to generic
safe-deny where appropriate.

Sensitive cases include:

- missing token,
- malformed token,
- expired token,
- revoked token,
- wrong organization,
- wrong resource,
- wrong channel identity,
- unverified identity,
- no consent,
- deleted resource,
- hidden resource,
- unauthorized resource,
- unsupported route family,
- ambiguous duplicate identity,
- repository unavailable.

Safe-deny must not leak through:

- status code,
- message key,
- response shape,
- redirect path,
- headers,
- retry hints,
- next-action wording,
- timing.

Internal category may exist only as future audit/security event candidate, not
as customer-visible text.

## Projection Handoff Boundary

Controller may pass only resolver result / customerAccessContext to projection.

Projection rules:

- Projection must be allow-list first.
- Unknown fields default deny.
- Forbidden fields default deny.
- Projection must not receive raw internal data without an allow-list boundary.
- Projection must not mutate state.
- Projection must not decide authorization.
- Projection must not decide finalAppointmentId.

Customer-facing report output must not include:

- internal note,
- audit log,
- AI raw payload,
- raw provider payload,
- billing internal data,
- settlement internal data,
- engineer internal comments,
- supervisor review,
- vendor reconciliation rules,
- raw token,
- raw channel id,
- complete phone number,
- complete address.

The one Case equals one formal Field Service Report invariant must not be
changed by route/controller skeleton work.

## Synthetic Local-Only Skeleton Option

This is a future option only. Task419 does not authorize or implement it.

If explicit local-only runtime authorization is granted, the safest initial
shape should prefer:

- no DB,
- no provider sending,
- no AI provider,
- no RAG,
- no vector DB,
- no real customer data,
- no production-like data,
- synthetic in-memory fixtures only,
- sanitized symbolic references only,
- existing pure utilities only,
- route/controller skeleton calls resolver stub,
- resolver stub creates symbolic customerAccessContext,
- projection uses allow-listed DTO helpers,
- response uses existing envelope / safe-deny utilities.

The future option must satisfy:

- Task417 synthetic fixture policy,
- Task418 sensitive scan checklist,
- Task415 local-only runtime authorization checklist,
- no shared/prod/Zeabur access,
- no DB/DDL/migration unless separately authorized.

## Audit / Rate-Limit / Support Fallback Boundary

Future route/controller skeleton may create future event candidates in design,
but must not write audit/security events unless separately approved.

Boundaries:

- Audit/security event persistence remains future-only.
- Rate-limit / abuse remains future-only.
- No middleware is added by Task419.
- Support fallback can only produce generic acknowledgement in future design.
- Support fallback must not create Case automatically.
- Support fallback must not close complaint automatically.
- Support fallback must not close follow-up automatically.
- Link reissue must not be implemented in route/controller skeleton.
- Provider sending must not be triggered by route/controller skeleton.

## Explicit Non-goals

Task419 does not:

- modify `src/`,
- modify `admin/src/`,
- add route files,
- add controller files,
- add API runtime,
- add resolver runtime,
- add repository runtime,
- add fixture files,
- add test files,
- add or modify smoke tests,
- add scan scripts,
- add CI configuration,
- run smoke/browser/API/DB tests,
- modify `package.json`,
- modify localization files or message catalogs,
- modify projection utilities,
- modify forbidden field constants,
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

Task419 records a future route/controller skeleton design packet only.

Decision summary:

- Future route/controller skeleton must be orchestration-only.
- Controller must not bypass resolver/customerAccessContext/projection.
- Controller must not directly call DB/repository/provider/AI/billing/audit
  persistence.
- Controller must not mutate Case, Appointment, or Field Service Report state.
- Safe-deny remains generic across sensitive denial cases.
- Any future local-only skeleton must be separately authorized and should start
  with no DB, no provider, no AI, and synthetic in-memory fixtures only.
- No runtime/API/DB/test/provider/AI work is implemented by Task419.

## Verification Plan

For Task419 completion:

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
