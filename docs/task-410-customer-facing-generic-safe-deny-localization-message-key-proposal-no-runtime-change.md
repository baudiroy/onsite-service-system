# Task410 — Customer-Facing Generic Safe-Deny Localization / Message Key Proposal / No Runtime Change

Task410 proposes the future customer-facing generic safe-deny localization and
message key boundary. It is documentation-only and does not authorize
localization runtime, message catalog changes, API, DB, provider sending, or
runtime work.

This task does not add code, tests, package changes, localization files,
runtime behavior, routes, controllers, repositories, DB access, migrations,
schema, indexes, provider sending, browser automation, or smoke tests.

## Current Baseline

Task410 follows the Task370-409 customer-facing no-runtime baseline.

Already accepted:

- Customer-facing pure utilities.
- Pure unit tests.
- Runtime entry gate decision packet.
- Route/controller contract proposal.
- Resolver contract proposal.
- Customer channel identity persistence proposal.
- Token/link lifecycle proposal.
- Audit/security event model proposal.
- Audit/security event permission matrix proposal.

Current state remains:

- no customer-facing runtime,
- no localization runtime,
- no message catalog changes,
- no audit/security event persistence,
- no token/link generation runtime,
- no customer channel identity persistence,
- no resolver runtime,
- no controller / route / API,
- no repository / DB access,
- no migration / schema / index,
- no provider sending,
- no browser/API/DB/smoke tests,
- no shared/prod/Zeabur runtime access.

Task410 does not authorize localization runtime, API, DB, or provider sending.

## Message Key Principles

Future external customer-facing deny messages must be generic.

Principles:

- Message keys must not reveal internal resolver denial reason.
- Message keys must not reveal whether a token exists.
- Message keys must not reveal whether a token expired, was revoked, was
  already used, or was previously valid.
- Message keys must not reveal whether a customer, case, appointment, report,
  or channel identity exists.
- Route family must not use different denial text that creates existence
  leakage.
- Localization text must not include internal notes, audit details, AI raw
  payloads, billing internal reasons, settlement internal reasons, raw channel
  identifiers, or raw provider payloads.
- Controller code must not map resolver denial reason directly to external
  message key.

## Allowed External Message Key Families

These are future proposals only and are not implemented in Task410.

| Message key family | Customer-visible purpose | Must not include | Applicable route families | No-leakage note |
| --- | --- | --- | --- | --- |
| Generic access unavailable | Tell the customer the requested content cannot be shown right now. | Exact token, channel, resource, identity, or permission reason. | Service report, appointment summary, completion status, issue/follow-up, survey. | Should be usable for missing, invalid, expired, revoked, unauthorized, hidden, or unavailable cases. |
| Generic request cannot be processed | Tell the customer the request cannot be handled at this moment. | Internal failure details, repository details, provider errors. | All route families. | Should cover malformed request and temporary internal unavailability without revealing resource state. |
| Generic link unavailable | Tell the customer a link cannot currently be used. | Expired/revoked/not-found/already-used/wrong-user details. | Link-based access surfaces. | Must not reveal whether the link was once valid. |
| Generic contact support fallback | Offer a safe human support path. | Binding state, case existence, token state, internal reason. | All route families. | Support fallback must not imply the system found or did not find a resource. |
| Generic issue submitted acknowledgement | Acknowledge a customer submitted an issue/follow-up request. | Confirmation that a specific case/report exists unless already authorized by projection policy. | Issue/follow-up entry point. | Acknowledgement must not grant broader access or confirm hidden resources. |

## Forbidden Message Key Patterns

Future external message keys and customer-visible text must not contain exact
reason patterns such as:

- token expired,
- token revoked,
- token not found,
- token already used,
- case not found,
- report not found,
- appointment not found,
- customer not found,
- LINE not bound,
- phone not registered,
- wrong organization,
- duplicate identity,
- no consent,
- permission denied because of internal rule,
- settlement internal rule reason,
- billing internal rule reason.

These concepts may exist only as internal audit/security category candidates
under a future permission design. They must not be customer-visible.

## Collapse Matrix

Future behavior should externally collapse sensitive failures to generic
safe-deny.

| Condition | External collapse behavior | Internal category allowed? |
| --- | --- | --- |
| Missing token | Generic safe-deny. | Future internal category only. |
| Malformed token | Generic safe-deny. | Future internal category only. |
| Expired token | Generic safe-deny. | Future internal category only. |
| Revoked token | Generic safe-deny. | Future internal category only. |
| Wrong purpose | Generic safe-deny. | Future internal category only. |
| Wrong organization | Generic safe-deny. | Future internal category only. |
| Wrong resource | Generic safe-deny. | Future internal category only. |
| Wrong channel identity | Generic safe-deny. | Future internal category only. |
| Unverified identity | Generic safe-deny or generic verification-required response. | Future internal category only. |
| No consent | Generic safe-deny or generic verification-required response. | Future internal category only. |
| Deleted resource | Generic safe-deny. | Future internal category only. |
| Hidden resource | Generic safe-deny. | Future internal category only. |
| Unauthorized resource | Generic safe-deny. | Future internal category only. |
| Unsupported route family | Generic safe-deny. | Future internal category only. |
| Ambiguous duplicate identity | Generic safe-deny. | Future internal category only. |
| Repository unavailable | Generic try-later or generic safe-deny. | Future internal category only. |

Internal categories require separate audit/security event design and must not be
customer-visible.

## Status Code / Response Shape Boundary

Safe-deny cannot rely only on message keys. Status code and response shape can
also leak information.

Future runtime must avoid leakage through:

- status code differences,
- message key differences,
- field count differences,
- route-specific response bodies,
- redirect paths,
- headers,
- timing,
- retry hints,
- next action wording.

The safe-deny envelope should remain consistent across sensitive denial cases.
Controller code must not directly translate resolver denial reasons into
external message keys or response shapes.

## Channel-specific Wording Boundary

Future localization must remain channel-agnostic.

Rules:

- Do not make denial wording LINE-only.
- Do not use different denial wording for LINE, SMS, Email, App, or Web Link
  that reveals binding state.
- Do not show raw channel identifiers.
- Do not show `line_user_id`.
- Do not show phone number or email in denial messages.
- Channel-specific fallback wording may be designed later only if it does not
  reveal identity state, consent state, token state, or resource existence.

## Customer Support Fallback Wording

Generic support fallback is allowed as a future proposal.

Safe wording should:

- invite the customer to contact support,
- avoid saying the link expired,
- avoid saying the case does or does not exist,
- avoid saying the customer is not bound,
- avoid saying the phone/email/channel is not registered,
- avoid saying a token was wrong, revoked, or already used.

If human support is needed, it should enter a future support workflow proposal.
It must not automatically create, close, reopen, or modify a Case or complaint.

Issue/follow-up acknowledgement must not equal confirmation that a case/report
exists unless the future projection policy has already authorized that context.

## AI / Localization Boundary

AI may assist with drafting future customer-safe wording, but must remain
human-reviewed.

AI must not:

- decide official message keys,
- generate customer-visible denial text from raw resolver denial reason,
- read raw tokens,
- read raw provider payloads,
- read complete phone numbers,
- read complete addresses,
- read internal audit details,
- read internal notes,
- bypass localization review.

Localization keys must be deterministic product artifacts, not ad hoc AI output
generated from sensitive runtime context.

## Future Task Candidates

These are future candidates only and are not implemented by Task410:

- customer-facing message key catalog proposal,
- safe-deny response shape test matrix proposal,
- localization review checklist proposal,
- support fallback wording proposal,
- channel-specific wording risk review,
- local-only disposable message-key runtime spike after explicit authorization.

Any future localization/runtime task must be separately authorized and must not
target shared/prod/Zeabur without explicit approval.

## Explicit Non-goals

Task410 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify tests,
- add or modify smoke tests,
- modify `package.json`,
- modify localization files or message catalogs,
- add a test framework or dependency,
- add permission runtime,
- add audit/security event query runtime,
- add audit/security event tables,
- add audit writes,
- add log runtime,
- add workers,
- add token/link generation runtime,
- add customer channel identity tables,
- add resolver runtime,
- add controller/route/API runtime,
- add repository access,
- add DB access,
- add or modify migration/schema/index,
- execute DB/DDL/psql/`npm run db:migrate`/Migration020 dry-run/apply,
- touch shared/prod/Zeabur runtime,
- trigger LINE/SMS/Email/App/survey/provider sending,
- call AI provider, RAG, vector DB, prompt, worker, or model runtime,
- add file/photo/signature/document storage runtime,
- add billing/settlement/inventory runtime,
- process real token, secret, customer personal data, raw channel data, or raw
  provider payload.

## Decision

Task410 records a future generic safe-deny localization/message key proposal
only.

Decision summary:

- Customer-facing denial messages must remain generic.
- Message keys, status codes, response shapes, redirects, timing, and
  next-action wording must not create existence leakage.
- Channel-specific wording must not reveal binding state.
- AI may draft wording only under human review and without raw sensitive
  context.
- DB/API/runtime/provider/smoke work remains blocked.

## Verification Plan

For Task410 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw channel data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only proposal.

## Redaction Note

This document contains policy terms such as token, secret, raw channel identity,
phone, mobile, address, provider payload, and `DATABASE_URL` only as examples of
data that must not be exposed. It does not include credentials, database URLs,
access tokens, secrets, complete customer phone numbers, complete customer
addresses, raw channel identifiers, raw provider payloads, verification codes,
or production data details.
