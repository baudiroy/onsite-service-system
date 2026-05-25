# Task424 - Customer-Facing Skeleton Chain Integration Review / No Runtime Change

Task424 reviews the customer-facing skeleton chain from Task419 through
Task423 as one end-to-end design boundary.

This task is documentation-only. It does not authorize runtime work, local-only
runtime spike work, DB access, API implementation, tests, fixtures, smoke
changes, utility changes, provider sending, or AI/RAG work.

## Current Baseline

Task424 follows the Task370-423 customer-facing no-runtime baseline.

It especially integrates:

- Task419: route/controller skeleton design.
- Task420: resolver skeleton design.
- Task421: customerAccessContext skeleton design.
- Task422: response envelope / safe-deny skeleton design.
- Task423: projection service skeleton design.

Current state remains:

- no customer-facing runtime,
- no route/controller/API implementation,
- no resolver implementation,
- no customerAccessContext utility modification,
- no projection service implementation,
- no projection utility modification,
- no projection DTO utility modification,
- no forbidden field constants modification,
- no response envelope utility modification,
- no safe-deny utility modification,
- no repository / DB access,
- no migration / schema / index,
- no fixture files added,
- no test files added,
- no scan script or CI added,
- no localization file or message catalog change,
- no token/link persistence,
- no customer channel identity persistence,
- no audit/security event persistence,
- no permission runtime,
- no rate-limit / abuse middleware runtime,
- no support workflow runtime,
- no provider sending,
- no AI / RAG / vector DB runtime,
- no smoke/browser/API/integration tests,
- no shared/prod/Zeabur runtime access.

Task424 is an integration review, not implementation.

## End-to-End Mandatory Flow Review

The future customer-facing chain must remain:

```text
request
-> route/controller
-> resolver
-> customerAccessContext
-> projection DTO / projection service
-> response envelope or generic safe-deny
```

Required integration rules:

- Controller must not bypass resolver.
- Resolver must not bypass customerAccessContext.
- Projection must not bypass customerAccessContext.
- Response envelope must not bypass projection.
- No layer may directly output raw internal data.
- No layer may expand a route family into a broader purpose.
- No layer may convert internal denial detail into customer-visible wording.
- No layer may trigger mutation, provider sending, AI/RAG, or DB/DDL work.

The skeleton chain is intentionally narrow:

- controller orchestrates,
- resolver decides access internally,
- customerAccessContext carries minimized symbolic context,
- projection builds allow-listed customer-facing DTOs,
- response envelope normalizes success or generic safe-deny output.

## Responsibility Boundary Matrix

| Layer | Allowed responsibility | Forbidden responsibility | Allowed input category | Forbidden input category | Allowed output category | Fail-closed trigger | No-existence-leakage requirement |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Route/controller | Parse/sanitize request references, choose symbolic route family, invoke resolver, pass projection result to envelope. | Formal authorization, DB/repository access, raw DTO building, mutation, provider sending, AI/RAG, link reissue, case/complaint/follow-up creation. | Request metadata after minimization, symbolic route family, sanitized request reference. | Raw token, raw provider payload, raw channel id, actual `line_user_id` value, complete phone, complete address, raw DB row. | Resolver invocation result routed to projection/envelope, never raw external output. | Missing/malformed/suspicious input, unsupported route family, resolver failure. | Must not reveal token, resource, route support, identity, consent, or organization state. |
| Resolver | Internal access decision, organization/identity/consent/resource checks, internal denial candidate, customerAccessContext preparation. | Customer-facing DTO creation, envelope wrapping, mutation, provider sending, AI/RAG, quote/settlement/complaint decisions, token rotation or identity merge. | Sanitized request reference, symbolic route family, sanitized token/link reference, organization/channel placeholders. | Raw token, secret, `DATABASE_URL`, raw provider payload, raw channel id, complete phone/address, production customer data, raw AI prompt/model output. | Internal allowed/denied result, customerAccessContext candidate, future audit/security event candidate. | Missing/expired/revoked/wrong-purpose token, wrong organization/resource/channel, unverified identity, no consent, repository unavailable. | Internal denial categories must collapse to generic external safe-deny. |
| customerAccessContext | Sanitized handoff between resolver and projection. | Authorization engine, permission model replacement, DB/repository access, DTO creation, envelope wrapping, mutation, provider sending, AI/RAG. | Resolver decision, organization scope reference, symbolic customer/channel/resource references, route family, projection scope, verification/consent summaries. | Raw token, secret, raw provider payload, actual channel identifier, raw DB row, internal notes, audit/security event full text, AI raw payload, billing/settlement internal data. | Minimal symbolic context for projection or fail-closed result. | Missing/malformed resolver result, denied result, missing scope, unsupported route family, unknown projection scope, unexpected raw field. | Must not expose context internals, resource existence, consent reason, verification reason, or tenant mismatch. |
| Projection service | Build allow-listed customer-visible DTO from customerAccessContext and sanitized resource summary. | Formal authorization, resolver replacement, customerAccessContext replacement, DB/repository access, envelope wrapping, mutation, provider sending, AI/RAG, finalAppointmentId decisions. | customerAccessContext, allow-listed resource summary, symbolic route family, projection scope, sanitized request/correlation references. | Raw token, secret, `DATABASE_URL`, raw provider payload, raw channel id, actual `line_user_id` value, complete phone/address, raw DB row, raw case/report/appointment objects. | Customer-visible DTO only. | Missing/malformed/denied context, missing/unknown scope, mismatched route family, forbidden field candidate, cross-organization candidate. | Must not reveal field presence, internal denial category, permission/entitlement reason, or resource existence. |
| Response envelope / safe-deny | Wrap allow-listed projection DTO or generic safe-deny shape, hold generic message key family and sanitized correlation reference. | Authorization decision, resolver replacement, projection bypass, DB/repository access, mutation, provider sending, AI/RAG, raw denial wording. | Allow-listed projection DTO or generic safe-deny category, sanitized request/correlation reference, symbolic route family if safe. | Raw resolver output, raw customerAccessContext internals, raw token, raw channel identity, raw provider payload, raw DB row, denial detail. | Normalized success envelope or generic safe-deny envelope. | Missing projection, malformed projection DTO, denial result, forbidden output candidate. | Must not leak through status code, message key, body shape, field count, redirect path, headers, retry hints, next-action wording, or timing bucket. |

## Forbidden Dependency Review

The skeleton chain must not directly depend on:

- DB client,
- repository,
- provider client,
- AI provider,
- RAG,
- vector DB,
- billing / settlement engine,
- LINE-only identity helper,
- audit/security event persistence writer,
- case / appointment / report mutation service.

Layer-specific review:

- Route/controller may invoke resolver/projection/envelope interfaces only after
  a future separate runtime approval. It must not reach into repository or
  provider clients.
- Resolver may need a future access-policy interface, but real repository,
  token persistence, customer channel identity persistence, and audit/security
  persistence require separate approval.
- customerAccessContext may be built from resolver output only. It must not
  call DB or identity persistence.
- Projection service may receive only allow-listed summaries. It must not call
  repository, service mutation, provider, AI, or billing/settlement engines.
- Response envelope may wrap projection or safe-deny only. It must not call
  resolver, repository, provider, localization runtime, or AI.

Any future dependency not listed as a pure interface or utility requires a
separate approval packet. Task424 implements none of them.

## Data Boundary Review

Raw sensitive data must not enter the customer-facing chain.

Forbidden chain inputs include:

- raw token,
- secret,
- `DATABASE_URL`,
- raw provider payload,
- raw channel id,
- actual `line_user_id` value,
- complete phone number,
- complete address,
- raw DB row,
- raw service report,
- raw appointment object,
- raw case object,
- internal note full text,
- audit/security event full text,
- AI raw payload,
- billing/settlement internal data.

If a future skeleton needs a resource summary, it must be:

- allow-listed,
- sanitized,
- symbolic where possible,
- minimum necessary,
- scoped to organization,
- scoped to route family,
- scoped to projection purpose,
- safe for customer-visible DTO creation.

The chain must not treat "available internally" as "safe to project."

## Fail-Closed and Safe-Deny Consistency Review

The following sensitive cases must collapse consistently across resolver,
customerAccessContext, projection, and envelope:

| Case | Internal handling | External behavior | Leakage rule |
| --- | --- | --- | --- |
| Missing token | Internal denial candidate only. | Generic safe-deny. | Must not reveal whether token is required or resource exists. |
| Malformed token | Internal denial candidate only. | Generic safe-deny. | Must not reveal parser detail. |
| Expired token | Internal denial candidate only. | Generic safe-deny. | Must not reveal prior validity. |
| Revoked token | Internal denial candidate only. | Generic safe-deny. | Must not reveal revocation state. |
| Wrong purpose | Internal denial candidate only. | Generic safe-deny. | Must not reveal intended route family. |
| Wrong organization | Internal denial candidate only. | Generic safe-deny. | Must not reveal tenant mismatch or tenant existence. |
| Wrong resource | Internal denial candidate only. | Generic safe-deny. | Must not reveal resource existence. |
| Wrong channel identity | Internal denial candidate only. | Generic safe-deny. | Must not reveal binding state. |
| Unverified identity | Internal denial candidate only. | Generic safe-deny or generic verification-required response. | Must not reveal identity existence. |
| No consent | Internal denial candidate only. | Generic safe-deny or generic verification-required response. | Must not reveal consent details. |
| Deleted / hidden / unauthorized resource | Internal denial candidate only. | Generic safe-deny. | Must not reveal lifecycle or authorization state. |
| Unsupported route family | Internal denial candidate only. | Generic safe-deny. | Must not reveal supported route map. |
| Ambiguous duplicate identity | Internal denial candidate only. | Generic safe-deny. | Must not reveal duplicate/merge state. |
| Repository unavailable | Internal denial candidate only. | Generic safe-deny or generic try-later. | Must not reveal lookup or resource state. |
| Missing / malformed customerAccessContext | Fail closed. | Generic safe-deny. | Must not reveal context internals. |
| Malformed projection DTO | Fail closed. | Generic safe-deny. | Must not reveal projection schema. |
| Unexpected forbidden field candidate | Fail closed or future explicit reject. | Generic safe-deny. | Must not reveal forbidden field presence. |

External behavior must not leak through:

- status code,
- message key,
- body shape,
- field count,
- redirect path,
- headers,
- retry hints,
- next-action wording,
- timing bucket.

Any internal category remains a future audit/security event candidate only. It
must not become customer-visible.

## Route Family Scope Consistency

The five route families remain purpose-scoped through all layers.

| Route family | Scope rule | Cross-scope prohibition |
| --- | --- | --- |
| Service report view | Customer-safe service result summary only. | Must not expose raw internal report, audit, settlement, or full case access. |
| Appointment summary view | Customer-safe appointment time/status/preparation summary only. | Appointment summary is not full service report access. |
| Completion status view | Customer-safe completion state or next-step summary only. | Must not expose finalAppointmentId resolution details, internal transitions, or allow completion mutation. |
| Issue/follow-up acknowledgement | Generic acknowledgement or safe next-step only. | Issue/follow-up acknowledgement does not equal full case access. |
| Survey/feedback acknowledgement | Generic feedback acknowledgement only. | Survey/feedback acknowledgement does not equal service report access. |

Explicit scope rules:

- Survey/feedback acknowledgement does not equal service report access.
- Issue/follow-up acknowledgement does not equal full case access.
- Appointment summary does not equal full service report access.
- Completion status does not equal billing/settlement/audit access.
- Projection must not upgrade route family scope based on available data.
- Envelope must not reveal scope mismatch through response shape or wording.

## Field Service Report Invariant Review

Field Service Report invariants remain unchanged:

- One Case can have only one formal Field Service Report.
- One Case can have multiple appointments / dispatch visits.
- Customer-facing report is a projection, not raw internal report.
- Multiple appointments / dispatch visits must not be interpreted as multiple
  formal reports by the skeleton chain.
- finalAppointmentId must not be decided by controller, resolver,
  customerAccessContext, projection, or envelope.
- The skeleton chain must not create, modify, reopen, recomplete, or overwrite
  a formal Field Service Report.
- Signature, exception, remote completion, and customer-facing report data can
  be displayed only as customer-visible summary.
- Internal review, audit, dispute handling, settlement, and supervisor content
  must not be exposed.

## AI / Audit / Provider / Support Boundary Review

AI boundary:

- AI must not read raw skeleton chain data.
- AI must not decide authorization.
- AI must not decide projection.
- AI must not decide safe-deny.
- AI must not decide link reissue.
- AI must not close Case or complaint.
- AI must not approve quote, fee consent, billing, or settlement.
- AI/RAG/vector DB remain out of scope.

Audit/security boundary:

- Audit/security event detail is future candidate only.
- Task424 writes no audit/security events.
- Internal denial categories must not be externally visible.
- Future audit persistence requires separate approval.

Provider boundary:

- Provider sending remains forbidden.
- No LINE/SMS/Email/App/survey sending is authorized.
- No raw provider payload may enter projection or envelope.

Support boundary:

- Support fallback remains a generic future proposal only.
- The skeleton chain must not automatically create Case, complaint, follow-up,
  escalation, or support ticket.
- Issue/follow-up acknowledgement must not confirm resource existence.

Rate-limit / abuse boundary:

- Rate-limit and abuse middleware remain future only.
- Internal rate-limit/abuse reasons must not become customer-visible.
- External response should remain generic and no-existence-leaking.

## Integration Risks and Unresolved Gaps

The following gaps remain future-only:

- no runtime authorization,
- no real resolver,
- no real customer verification,
- no token/link persistence,
- no customer channel identity persistence,
- no API route/controller,
- no DB schema for customer-facing access,
- no audit/security persistence,
- no rate-limit runtime,
- no localization runtime,
- no integration tests,
- no local-only synthetic runtime approval,
- no safe-deny timing test implementation,
- no customer-facing resource repository,
- no provider delivery integration,
- no AI/RAG integration.

These gaps are intentionally unresolved in Task424. They must not be treated as
implicit approval to implement runtime code.

## Recommended Next PM Options

Task424 does not choose the next branch automatically.

PM options:

- pause,
- docs-only branch closure summary,
- docs-only runtime spike minimum scope packet,
- ask user explicit local-only runtime authorization,
- continue docs-only with contract-to-test traceability matrix.

Task424 must not be treated as runtime approval.

## Explicit Non-goals

Task424 does not:

- modify `src/`,
- modify `admin/src/`,
- modify utilities,
- modify projection utilities,
- modify projection DTO utilities,
- modify forbidden field constants,
- modify response envelope utilities,
- modify safe-deny utilities,
- modify customerAccessContext utilities,
- add or modify fixture files,
- add or modify test files,
- add or modify smoke tests,
- add scan scripts,
- add CI configuration,
- modify localization files or message catalogs,
- add route files,
- add controller files,
- add API runtime,
- add resolver files,
- add repository runtime,
- add permission runtime,
- add audit/security event query runtime,
- add audit/security event tables,
- add support workflow runtime,
- add case runtime,
- add complaint runtime,
- add follow-up runtime,
- add link reissue runtime,
- add middleware,
- add rate-limit runtime,
- add DB access,
- add or modify migration/schema/index,
- execute DB/DDL/psql/`npm run db:migrate`/Migration020 dry-run/apply,
- touch shared/prod/Zeabur runtime,
- trigger provider sending,
- trigger LINE/SMS/Email/App/survey sending,
- call AI provider,
- call RAG,
- call vector DB,
- process real token, secret, `DATABASE_URL`, raw channel id, complete customer
  phone number, complete customer address, raw provider payload, or production
  data.

## Decision

Task424 confirms the Task419-423 skeleton chain is consistent as a docs-only
design sequence when read with the required boundaries:

- route/controller orchestrates only,
- resolver owns internal access decision,
- customerAccessContext is a sanitized symbolic handoff,
- projection service builds allow-listed customer-facing DTOs only,
- response envelope / safe-deny normalizes external output,
- no layer bypasses the previous layer,
- no layer exposes raw internal data,
- no layer performs mutation, provider sending, DB/DDL, AI/RAG, or support
  workflow side effects.

The chain remains no-runtime and future-only until the user explicitly approves
a separate local-only runtime authorization packet.

## Verification Plan

For Task424 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual credentials, tokens, complete
  customer personal data, raw channel identifiers, raw provider payloads, and
  production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only integration review.

## Redaction Note

This document contains policy terms such as token, secret, raw channel id,
phone, address, provider payload, `DATABASE_URL`, `line_user_id`, and Zeabur
only as examples of data or runtime boundaries that must not be exposed or
touched without authorization. It does not include credentials, database URLs,
access tokens, secrets, complete customer phone numbers, complete customer
addresses, raw channel identifiers, raw provider payloads, verification codes,
or production data details.
