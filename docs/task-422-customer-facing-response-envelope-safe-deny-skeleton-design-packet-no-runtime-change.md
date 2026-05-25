# Task422 — Customer-Facing Response Envelope / Safe-Deny Skeleton Design Packet / No Runtime Change

Task422 defines the future design boundary for customer-facing response envelope
and generic safe-deny skeleton behavior if explicit local-only runtime
authorization is granted later.

This task is documentation-only. It does not modify response envelope utilities,
safe-deny utilities, API, routes, controllers, resolver, projection utilities,
DB, fixtures, tests, provider sending, or AI runtime.

## Current Baseline

Task422 follows the Task370-421 customer-facing no-runtime baseline.

It especially follows:

- Task391: projection DTO safety hardening.
- Task398: forbidden field constants consolidation.
- Task404: route/controller contract proposal.
- Task410: generic safe-deny localization/message key proposal.
- Task411: safe-deny test matrix proposal.
- Task416: projection allow-list checklist.
- Task419: route/controller skeleton design packet.
- Task420: resolver skeleton design packet.
- Task421: customerAccessContext skeleton design packet.

Current state remains:

- no customer-facing runtime,
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

Task422 is a response envelope / safe-deny skeleton design packet, not
implementation.

## Response Envelope Purpose

Response envelope is the customer-facing output boundary.

It may conceptually:

- wrap allow-listed projection output,
- wrap generic safe-deny output,
- hold sanitized correlation reference,
- hold generic message key family,
- normalize customer-facing response shape.

Response envelope must not:

- make authorization decision,
- bypass resolver,
- bypass customerAccessContext,
- bypass projection,
- query DB,
- call repository,
- accept raw token,
- accept raw channel identity,
- accept raw DB row,
- modify Case status,
- modify Appointment status,
- modify Field Service Report status,
- decide finalAppointmentId,
- trigger provider sending,
- decide link reissue,
- decide complaint close,
- decide case close,
- call AI provider,
- generate customer-visible text from raw denial reason.

## Mandatory Future Flow

Future customer-facing response envelope must remain inside this flow:

```text
request
-> route/controller
-> resolver
-> customerAccessContext
-> projection DTO / projection service
-> response envelope or generic safe-deny
```

Response envelope must not bypass projection or directly wrap:

- raw resolver output,
- raw customerAccessContext internals,
- raw repository rows,
- raw service report objects,
- raw appointment objects,
- raw customer objects,
- raw provider payloads,
- raw token values,
- raw channel identities.

## Envelope Input Skeleton Proposal

The following input categories are future proposal only. Task422 does not
implement them.

Success envelope future input may include:

- allow-listed projection DTO,
- sanitized request reference,
- symbolic route family,
- correlation reference,
- generic message key family.

Safe-deny envelope future input may include:

- generic safe-deny category only,
- sanitized request reference,
- symbolic route family if safe,
- correlation reference.

Envelope must not receive or record:

- raw token,
- secret,
- `DATABASE_URL`,
- raw provider payload,
- raw channel id,
- actual `line_user_id` value,
- complete phone number,
- complete address,
- raw DB row,
- resolver denial reason,
- internal note full text,
- audit/security event full text,
- AI raw payload,
- billing internal data,
- settlement internal data,
- raw customer document,
- raw signature/photo/file content.

## Envelope Output Skeleton Proposal

The following output categories are future proposal only. Task422 does not
implement them.

Success response:

- may output only customer-visible projection DTO,
- may include generic success message key family,
- may include sanitized correlation reference if safe,
- must not add fields outside projection.

Safe-deny response:

- must be generic,
- may include generic safe-deny message key family,
- may include sanitized correlation reference if safe,
- must not include internal denial category,
- must not include raw resolver result,
- must not include raw token state,
- must not include identity state,
- must not include consent reason,
- must not include verification reason,
- must not include organization mismatch,
- must not include resource existence,
- must not include permission/entitlement internal reason,
- must not include rate-limit/abuse internal reason.

RequestReference and correlation references must be sanitized and must not allow
customer, channel, token, or resource inference.

## Response Equivalence Rules

Future generic safe-deny responses must not leak the reason through:

- status code,
- message key,
- response body shape,
- field count,
- redirect path,
- headers,
- retry hints,
- next-action wording,
- timing bucket.

Rules:

- Controller must not map resolver denial category directly to external message
  key.
- Localization/message key must remain generic.
- Safe-deny response shape should be equivalent across sensitive denial causes.
- Retry hints must not reveal token, identity, consent, resource, or binding
  state.
- Redirect path must not reveal supported route family or resource existence.
- Timing checks should use broad buckets if future tests are authorized.

## Safe-Deny Collapse Matrix

Future safe-deny envelope should collapse the cases below.

| Case | External behavior | Response shape | No-existence-leakage assertion | Audit/security event candidate |
| --- | --- | --- | --- | --- |
| Missing token | Generic safe-deny. | Equivalent. | Must not reveal whether token/resource exists. | Future only. |
| Malformed token | Generic safe-deny. | Equivalent. | Must not reveal parser detail. | Future only. |
| Expired token | Generic safe-deny. | Equivalent. | Must not reveal prior validity. | Future only. |
| Revoked token | Generic safe-deny. | Equivalent. | Must not reveal revocation state. | Future only. |
| Wrong purpose | Generic safe-deny. | Equivalent. | Must not reveal intended route family. | Future only. |
| Wrong organization | Generic safe-deny. | Equivalent. | Must not reveal tenant state. | Future only. |
| Wrong resource | Generic safe-deny. | Equivalent. | Must not reveal resource existence. | Future only. |
| Wrong channel identity | Generic safe-deny. | Equivalent. | Must not reveal binding state. | Future only. |
| Unverified identity | Generic safe-deny or generic verification-required response. | Equivalent within verification family. | Must not reveal identity existence. | Future only. |
| No consent | Generic safe-deny or generic verification-required response. | Equivalent within verification family. | Must not reveal consent details. | Future only. |
| Deleted resource | Generic safe-deny. | Equivalent. | Must not reveal lifecycle state. | Future only. |
| Hidden resource | Generic safe-deny. | Equivalent. | Must not reveal hidden state. | Future only. |
| Unauthorized resource | Generic safe-deny. | Equivalent. | Must not reveal resource exists but is unauthorized. | Future only. |
| Unsupported route family | Generic safe-deny. | Equivalent. | Must not reveal supported route map. | Future only. |
| Ambiguous duplicate identity | Generic safe-deny. | Equivalent. | Must not reveal duplicate/merge state. | Future only. |
| Repository unavailable | Generic safe-deny or generic try-later. | Equivalent within try-later family. | Must not reveal lookup/resource state. | Future only. |
| Missing customerAccessContext | Generic safe-deny. | Equivalent. | Must not reveal context internals. | Future only. |
| Malformed projection DTO | Generic safe-deny. | Equivalent. | Must not reveal projection internals. | Future only. |
| Unexpected forbidden field candidate | Generic safe-deny or internal fail-closed. | Equivalent. | Must not reveal forbidden field presence. | Future only. |

Internal categories are future-only and must not be customer-visible.

## Success Response Boundary

Success response must be built only from allow-listed projection DTO.

Success response must not include:

- internal note,
- audit log,
- AI raw payload,
- raw provider payload,
- billing internal data,
- settlement internal data,
- vendor reconciliation rules,
- engineer internal comments,
- supervisor review,
- raw token,
- raw channel id,
- `line_user_id`,
- complete phone number,
- complete address,
- permission internal reason,
- entitlement internal reason,
- rate-limit internal reason,
- abuse internal reason,
- resolver denial reason.

Envelope stage must not add missing fields, supplement data from raw records, or
expand projection scope.

## Route Family Response Boundary

Route families must keep distinct purpose scopes:

- service report view,
- appointment summary view,
- completion status view,
- issue/follow-up acknowledgement,
- survey/feedback acknowledgement.

Rules:

- Survey/feedback acknowledgement does not equal service report access.
- Issue/follow-up acknowledgement does not equal full case access.
- Appointment summary does not equal full service report access.
- Completion status does not equal billing/settlement/audit access.
- Route family must not use distinct denial wording that reveals resource
  existence.
- Response envelope must not upgrade one route family into another route family.

## Field Service Report Invariant

Response envelope must not alter Field Service Report invariants.

Rules:

- One Case can have only one formal Field Service Report.
- One Case can have multiple appointments / dispatch visits.
- Response envelope must not create Field Service Report.
- Response envelope must not modify Field Service Report.
- Response envelope must not decide finalAppointmentId.
- Multiple appointments / dispatch visits must not be represented as multiple
  formal reports.
- Customer-facing service report is projection output, not raw internal report.

## Audit / Support / AI Boundary

Response envelope may include sanitized correlation reference if safe, but must
not include audit/security event detail.

Support fallback message:

- must be generic,
- must not reveal expired/revoked/missing token,
- must not reveal case/report/appointment/customer/channel existence,
- must not create Case,
- must not create complaint,
- must not close complaint,
- must not trigger link reissue.

AI boundary:

- AI must not generate customer-visible text from raw denial reason.
- AI must not read raw token.
- AI must not read raw provider payload.
- AI must not read complete phone number.
- AI must not read complete address.
- AI must not read internal note full text.
- AI must not read audit/security event full text.
- AI must not decide response safe-deny category.

## Synthetic Local-Only Envelope Option

This is a future option only. Task422 does not authorize or implement it.

If explicit local-only runtime authorization is granted, the safest initial
response envelope skeleton should prefer:

- no DB,
- no provider sending,
- no AI provider,
- no RAG,
- no vector DB,
- synthetic in-memory fixtures only,
- sanitized symbolic references only,
- fail-closed default,
- existing pure utilities only,
- no persistent audit/security event writes.

The future option must satisfy:

- Task415 local-only runtime authorization checklist,
- Task417 synthetic fixture policy,
- Task418 sensitive scan checklist,
- Task419 route/controller skeleton design packet,
- Task420 resolver skeleton design packet,
- Task421 customerAccessContext skeleton design packet.

## Explicit Non-goals

Task422 does not:

- modify `src/`,
- modify `admin/src/`,
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

Task422 records a future customer-facing response envelope / safe-deny skeleton
design packet only.

Decision summary:

- Response envelope is customer-facing output boundary.
- Response envelope does not authorize, query DB, mutate records, send
  providers, or call AI/RAG.
- Success response must come only from allow-listed projection DTO.
- Safe-deny response must be generic and response-equivalent across sensitive
  denial cases.
- Response envelope must not expose token state, identity state, consent
  reason, resource existence, resolver denial reason, permission/entitlement
  reason, or rate-limit/abuse reason.
- No response envelope/runtime/API/DB/test/provider/AI work is implemented by
  Task422.

## Verification Plan

For Task422 completion:

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
