# Task411 — Customer-Facing Safe-Deny Test Matrix Proposal / No Runtime Change

Task411 proposes the future customer-facing safe-deny test matrix for route,
resolver, token/link, customer channel identity, localization/message key, and
audit/security-event behavior.

This task is documentation-only. It does not add test files, smoke tests,
runtime code, API behavior, localization catalogs, DB access, migrations,
schema, indexes, provider sending, AI runtime, or customer-facing runtime.

## Current Baseline

Task411 follows the Task370-410 customer-facing no-runtime baseline.

Already accepted:

- Customer-facing pure utilities.
- Pure utility unit tests.
- Runtime entry gate decision packet.
- Route/controller contract proposal.
- Resolver contract proposal.
- Customer channel identity persistence proposal.
- Token/link lifecycle proposal.
- Audit/security event model proposal.
- Audit/security event permission matrix proposal.
- Generic safe-deny localization/message key proposal.

Current state remains:

- no customer-facing runtime,
- no route/controller/API implementation,
- no resolver runtime,
- no token/link generation runtime,
- no customer channel identity persistence,
- no localization runtime,
- no message catalog change,
- no audit/security event persistence,
- no repository / DB access,
- no migration / schema / index,
- no provider sending,
- no AI / RAG / vector DB runtime,
- no browser/API/DB/smoke tests,
- no shared/prod/Zeabur runtime access.

Task411 does not authorize runtime, API, DB, localization, provider, AI, or
test implementation.

## Test Matrix Purpose

This document is a future test design, not test code.

Its purpose is to define future safe-deny acceptance criteria before any
customer-facing runtime or integration test branch begins.

This document must not be treated as:

- API implementation approval,
- route/controller implementation approval,
- resolver implementation approval,
- token/link runtime approval,
- customer channel identity persistence approval,
- localization file or message catalog approval,
- audit/security event table approval,
- DB migration approval,
- provider sending approval,
- AI/RAG runtime approval,
- smoke/browser/API test approval.

## Core Safe-Deny Cases

Future tests should cover the denial cases below. All external behavior must
avoid existence leakage.

| Denial case | Internal category candidate | Expected external behavior | Expected response shape rule | No-leakage assertion | Audit/security event candidate |
| --- | --- | --- | --- | --- | --- |
| Missing token | missing_token | Generic safe-deny. | Same envelope as other sensitive token denial cases. | Must not reveal whether a token was required or resource exists. | Future internal event only. |
| Malformed token | malformed_token | Generic safe-deny. | Same envelope as missing/expired/revoked token. | Must not reveal token parsing details. | Future internal event only. |
| Expired token | expired_token | Generic safe-deny. | Same envelope as missing/malformed/revoked token. | Must not reveal that the link was once valid. | Future internal event only. |
| Revoked token | revoked_token | Generic safe-deny. | Same envelope as missing/malformed/expired token. | Must not reveal revocation state. | Future internal event only. |
| Wrong purpose | wrong_purpose | Generic safe-deny. | Same envelope as other token scope denials. | Must not reveal intended route family. | Future internal event only. |
| Wrong organization | wrong_organization | Generic safe-deny. | Same envelope as unauthorized resource. | Must not reveal tenant existence or mismatch. | Future internal event only. |
| Wrong resource | wrong_resource | Generic safe-deny. | Same envelope as hidden/deleted/unauthorized resource. | Must not reveal whether the requested case/report/appointment exists. | Future internal event only. |
| Wrong channel identity | wrong_channel_identity | Generic safe-deny. | Same envelope as unverified/no-consent identity denials. | Must not reveal binding state or raw channel id. | Future internal event only. |
| Unverified identity | unverified_identity | Generic safe-deny or generic verification-required response. | Must not include exact identity state. | Must not reveal whether customer/channel identity exists. | Future internal event only. |
| No consent | no_consent | Generic safe-deny or generic verification-required response. | Must not include consent reason details. | Must not reveal customer or channel identity state. | Future internal event only. |
| Deleted resource | deleted_resource | Generic safe-deny. | Same envelope as hidden/unauthorized/missing resource. | Must not reveal resource lifecycle state. | Future internal event only. |
| Hidden resource | hidden_resource | Generic safe-deny. | Same envelope as deleted/unauthorized/missing resource. | Must not reveal hidden status. | Future internal event only. |
| Unauthorized resource | unauthorized_resource | Generic safe-deny. | Same envelope as hidden/deleted/missing resource. | Must not reveal that a resource exists but is unauthorized. | Future internal event only. |
| Unsupported route family | unsupported_route_family | Generic safe-deny. | Same envelope as route-family purpose denial when sensitive. | Must not reveal supported internal customer-facing route map. | Future internal event only. |
| Ambiguous duplicate identity | ambiguous_duplicate_identity | Generic safe-deny. | Same envelope as identity denial. | Must not reveal duplicate or merge state. | Future internal event only. |
| Repository unavailable | repository_unavailable | Generic try-later or generic safe-deny. | Must not expose DB/provider/repository detail. | Must not reveal whether lookup reached a specific resource. | Future internal event only. |

Internal categories are future candidates only. They must not be
customer-visible and must not be used directly as external message keys.

## Response Equivalence Assertions

Future tests should verify that sensitive denial causes cannot be distinguished
through response differences.

External responses should not leak through:

- status code,
- message key,
- response body shape,
- field count,
- redirect path,
- headers,
- retry hints,
- next-action wording,
- timing bucket.

Future tests should assert:

- controller code does not map resolver denial reason directly to customer
  message key,
- localization keys remain generic across sensitive denial causes,
- error bodies omit internal denial categories,
- redirects do not reveal token validity, identity state, or resource
  existence,
- retry hints do not reveal expired/revoked/already-used token states,
- support fallback wording does not imply binding state or case existence.

Timing tests should use broad timing buckets only if future runtime introduces
token/resource resolution paths. They should not require brittle millisecond
equality.

## Route Family Coverage

Future customer-facing route family tests should include:

- service report view,
- appointment summary view,
- completion status view,
- issue/follow-up entry point,
- survey/feedback link.

Route boundary assertions:

- Survey/feedback link does not equal service report access.
- Issue/follow-up link does not equal full case access.
- Appointment summary link does not grant full Field Service Report access.
- Completion status view does not expose internal report, billing, settlement,
  audit, AI, or supervisor review data.
- Service report view remains a customer-facing projection and not a raw
  internal Field Service Report.

Field Service Report invariants remain unchanged:

- one Case equals one formal Field Service Report,
- one Case can have multiple appointments / dispatch visits,
- customer-facing tests must not assume one visit equals one formal report,
- finalAppointmentId remains backend/system-resolved and stable after
  completion.

## Channel Coverage

Future tests should cover these channel surfaces:

- LINE,
- SMS,
- Web Link,
- App,
- Email,
- future AI call / phone-assisted flow.

Channel assertions:

- All channels use a channel-agnostic identity model.
- Deny messages are not LINE-only.
- A different channel must not receive wording that reveals binding state.
- Raw channel identifiers must not appear in customer-visible output.
- `line_user_id` must not appear in customer-visible output or test fixture raw
  output.
- Complete phone numbers and complete addresses must not appear in
  customer-visible denial output.
- SMS is a reminder/redirect channel and must not become a permission bypass.
- Web Link is an access surface and must not bypass token, identity, consent,
  or customer visible data policy.
- App and Email must follow the same safe-deny and data-minimization rules.
- AI call / phone-assisted flow must not expose internal denial reason or
  confirm resource existence during fallback.

## Customer-Visible Data Assertions

Future projection and safe-deny tests must assert that customer-visible output
does not contain:

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

Future allowed projection tests should separately define customer-visible
fields. This document only defines deny and leakage test boundaries.

## Audit / Permission / AI Assertions

Future tests may include audit/security event candidates, but Task411 does not
implement them.

Audit and permission assertions:

- audit/security event writes are future candidates only,
- audit/security event query runtime must go through Data Access Control,
- audit/security event output must not be customer-visible,
- audit/security event dashboards/reports/exports must follow permission,
  masking, and usage rules,
- support staff views must not expose raw tokens or raw provider payloads,
- permission-denied audit categories must not become customer-facing message
  keys.

AI assertions:

- AI must not read raw audit/security event full text,
- AI must not read raw token, raw provider payload, complete phone number,
  complete address, or raw channel id,
- AI must not decide block/unblock/revoke/reissue,
- AI must not decide merge/unlink of customer/channel identities,
- AI must not close a Case,
- AI must not close a complaint,
- AI must not convert an issue/follow-up into an official outcome without
  human review or deterministic business logic.

Reporting assertions:

- export/reporting/dashboard/scheduled report flows must share Data Access
  Control,
- scheduled reports are automation and not a permission bypass,
- customer-facing data must remain separate from internal data,
- data minimization applies to reports, dashboards, exports, AI insights, and
  scheduled reports.

## Future Test Layering Proposal

The layers below are future-only. Task411 does not add or modify tests.

| Future layer | Purpose | Scope boundary |
| --- | --- | --- |
| Pure utility unit tests | Verify pure customer-facing helpers, forbidden-field guards, and deterministic data-shaping helpers. | No DB/API/provider/runtime. |
| Resolver contract tests | Verify denial category handling, projection policy, token scope, channel identity, and resource authorization contracts. | Future local-only runtime authorization required. |
| Route/controller contract tests | Verify safe-deny envelope, status/message/shape equivalence, and no raw denial reason exposure. | Future API/runtime authorization required. |
| Projection policy tests | Verify customer-visible field allow-list and forbidden-field exclusion. | No internal raw report/customer payload leakage. |
| Localization/message key equivalence tests | Verify multiple denial causes collapse to generic external keys. | No localization runtime until separately authorized. |
| Audit/security event candidate tests | Verify internal event candidates are safe, minimal, and not customer-visible. | No event table/write runtime until separately authorized. |
| Permission matrix tests | Verify audit query/report/export access follows Data Access Control. | No permission runtime until separately authorized. |
| Local-only integration tests | Verify combined route/resolver/token/channel/projection safe-deny behavior. | Requires explicit local-only disposable runtime authorization. |

No browser/API/DB/smoke/integration tests should be added by this task.

## Future Acceptance Criteria Checklist

Future runtime/test branches should be blocked until they can answer yes to
these questions:

- Does every sensitive denial collapse to a generic external response?
- Are internal denial categories excluded from external message keys?
- Are status codes, response shapes, redirects, headers, retry hints, and
  next-action wording reviewed for leakage?
- Are customer-visible projections allow-listed?
- Are forbidden customer-facing fields covered?
- Are route families separated by least privilege?
- Does survey/feedback access remain separate from service report access?
- Does issue/follow-up access remain separate from full case access?
- Do all channel surfaces use the same identity and safe-deny model?
- Is `line_user_id` excluded from customer-visible output and fixture output?
- Are complete phone numbers and addresses excluded from customer-visible
  denial output?
- Is AI blocked from raw sensitive context and autonomous high-risk decisions?
- Are future audit/security events internal-only and permission-controlled?
- Are report/export/dashboard/scheduled-report paths covered by Data Access
  Control?
- Does the test plan preserve one Case equals one formal Field Service Report?

## Explicit Non-goals

Task411 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify test files,
- add or modify smoke tests,
- run smoke/browser/API/DB tests,
- modify `package.json`,
- modify localization files or message catalogs,
- implement message key catalog runtime,
- implement API / route / controller runtime,
- implement resolver runtime,
- implement permission runtime,
- implement audit/security event tables,
- implement audit/security event query runtime,
- implement repository access,
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

Task411 records a future safe-deny test matrix proposal only.

Decision summary:

- Future customer-facing tests must verify generic safe-deny equivalence across
  token, identity, resource, route, repository, channel, localization, and
  audit/security-event boundaries.
- Future tests must assert that customer-facing output excludes internal,
  sensitive, billing/settlement, audit, AI raw, raw token, raw channel, complete
  phone, and complete address data.
- Future test layers are proposed, but no tests are created now.
- DB/API/runtime/provider/localization/smoke/browser work remains blocked.

## Verification Plan

For Task411 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw channel data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only proposal.

## Redaction Note

This document contains policy terms such as token, secret, raw channel id,
phone, address, provider payload, `DATABASE_URL`, and `line_user_id` only as
examples of data that must not be exposed. It does not include credentials,
database URLs, access tokens, secrets, complete customer phone numbers, complete
customer addresses, raw channel identifiers, raw provider payloads,
verification codes, or production data details.
