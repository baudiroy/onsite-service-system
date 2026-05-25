# Task405 — Customer-Facing Resolver Contract Proposal / No Runtime Change

Task405 proposes the future customer-facing resolver contract. It is
documentation-only and does not authorize resolver runtime.

This task does not add code, tests, package changes, runtime behavior, routes,
controllers, repositories, DB access, migrations, schema, indexes,
localization, provider sending, browser automation, or smoke tests.

## Current Baseline

Task405 follows the Task370-404 customer-facing no-runtime baseline.

Already accepted:

- Pure customer-facing utilities.
- Pure unit tests.
- Runtime entry gate decision packet.
- Route/controller contract proposal.

Current state remains:

- no customer-facing runtime,
- no resolver runtime,
- no controller / route / API,
- no repository / DB access,
- no migration / schema / index,
- no provider sending,
- no browser/API/DB/smoke tests,
- no shared/prod/Zeabur runtime access.

Task405 does not authorize runtime.

## Resolver Responsibility Boundary

A future customer-facing resolver may be responsible for internal access
resolution only.

Future resolver responsibilities may include:

- request token / link reference parsing,
- token state verification,
- organization scope verification,
- customer channel identity lookup / match,
- verification state check,
- consent state check,
- target resource access eligibility check,
- creating a resolver result that can be converted into
  `customerAccessContext`.

A future resolver must not:

- directly output customer-visible DTOs,
- directly build response envelopes,
- directly send provider notifications,
- directly modify Case status,
- directly modify Appointment status,
- directly modify Field Service Report status,
- directly approve customer charges,
- directly approve quotes,
- directly approve settlement,
- directly close complaints,
- pass internal notes to projection,
- pass audit logs to projection,
- pass AI raw payloads to projection,
- pass settlement internal data to projection,
- pass raw provider payloads to projection.

The resolver is an internal access decision component, not a customer-facing
response builder.

## Future Mandatory Flow

Future runtime must preserve this flow:

```text
request
-> route/controller
-> resolver
-> customerAccessContext
-> projection DTO / projection service
-> response envelope or generic safe-deny
```

The resolver must not be bypassed by:

- controller code,
- projection code,
- repository code,
- provider workers,
- background jobs,
- AI or RAG workers,
- future customer channel handlers.

Projection utilities must only receive already-authorized, already-sanitized
source concepts. They must not call repositories or decide formal access.

## Resolver Input Contract Proposal

This is a future proposal only and is not implemented in Task405.

A future resolver may receive:

- sanitized request reference,
- symbolic route family,
- organization-bound token or link reference,
- channel context placeholder,
- request metadata placeholder,
- desired projection surface,
- customer-facing request surface type.

Input must not include or log:

- raw token,
- secret,
- `DATABASE_URL`,
- raw provider payload,
- raw channel id,
- complete customer phone number,
- complete customer address,
- production customer data,
- unfiltered request body,
- provider webhook raw payload.

The route/controller may parse request shape, but raw sensitive values must not
be printed, surfaced to customer output, or passed deeper than required for the
future resolver's minimal verification work.

## Resolver Output Contract Proposal

This is a future proposal only and is not implemented in Task405.

A future resolver result may contain internal-only fields such as:

- allowed / denied internal decision,
- sanitized denial category for internal handling only,
- organization scope reference,
- symbolic customer identity reference,
- symbolic resource reference,
- verification state summary,
- consent state summary,
- allowed projection scope,
- safe audit metadata placeholder.

The external response must not directly expose resolver denial reason.

The only customer-facing output path should be:

- `customerAccessContext` for access state,
- projection DTO / projection service for allow-listed data,
- response envelope or generic safe-deny for final response shape.

## Fail-closed / Generic Safe-deny Matrix

Future behavior should collapse externally to generic safe-deny where
appropriate.

| Condition | Future internal handling | Future external behavior |
| --- | --- | --- |
| Missing token | Internal denial category only. | Generic safe-deny. |
| Malformed token | Internal denial category only. | Generic safe-deny. |
| Expired token | Internal denial category only. | Generic safe-deny. |
| Revoked token | Internal denial category only. | Generic safe-deny. |
| Token organization mismatch | Internal denial category only. | Generic safe-deny. |
| Channel identity mismatch | Internal denial category only. | Generic safe-deny. |
| Unverified channel identity | Internal denial or verification-required category only. | Generic safe-deny or generic verification-required response. |
| Missing consent | Internal consent-required category only. | Generic safe-deny or generic verification-required response. |
| Missing customer access context | Fail closed. | Generic safe-deny. |
| Deleted resource | Internal denial category only. | Generic safe-deny. |
| Hidden resource | Internal denial category only. | Generic safe-deny. |
| Unauthorized resource | Internal denial category only. | Generic safe-deny. |
| Unsupported route family | Internal unsupported category only. | Generic safe-deny. |
| Repository unavailable | Internal operational category only. | Generic safe-deny or generic try-later response. |
| Ambiguous duplicate identity | Internal security category only. | Generic safe-deny. |

Exact internal state may be useful for future audit/security events, but it must
not become customer-visible.

## No Existence Leakage Rules

Future resolver and controller behavior must not reveal whether a Case,
Appointment, Field Service Report, customer identity, token, or channel binding
exists through:

- status code,
- message key,
- response shape,
- field count,
- route family-specific denial wording,
- timing,
- resolver denial reason,
- next action wording,
- request reference content,
- debug metadata.

Any internal audit/security category requires a separate design and must remain
tenant-scoped, masked, permission-aware, and not customer-visible.

## Channel-agnostic Customer Identity

Future customer identity resolution must remain channel-agnostic.

Requirements:

- Do not make the resolver LINE-only.
- Do not treat `line_user_id` as a global identity.
- Treat SMS, Web Link, App, Email, LINE, and future channels as different
  customer channel identity instances.
- Preserve support for existing case reverse binding and future App identity.

Minimum future identity scope should include:

- `organization_id`,
- channel type,
- channel instance / channel id,
- channel user identity,
- verification state,
- consent state,
- customer identity binding,
- token/link state where applicable.

Raw channel identity must not be returned in customer-facing output.

## Audit / Security Event Boundary

This document only proposes future resolver boundaries.

A future resolver may produce audit/security event candidates, but Task405 does
not add:

- audit tables,
- audit writes,
- security event persistence,
- workers,
- log runtime,
- alerting runtime.

Future audit/security events must be:

- minimized,
- redacted,
- tenant-scoped,
- permission-aware,
- safe for operational review,
- free of raw token, secret, raw channel id, complete customer contact data, and
  raw provider payload.

## Future Task Candidates

These are future candidates only and are not implemented by Task405:

- token/channel identity persistence proposal,
- customer-facing audit/security event model proposal,
- resolver fail-closed test matrix proposal,
- customer-facing localization/message key proposal,
- local-only disposable resolver spike after explicit authorization.

Any future code task must be separately authorized and must remain one bounded
task at a time.

## Explicit Non-goals

Task405 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify tests,
- add or modify smoke tests,
- modify `package.json`,
- add a test framework or dependency,
- add helper/service/repository/interface code,
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

Task405 records a future resolver contract proposal only.

Decision summary:

- Resolver runtime remains unauthorized.
- Resolver should become the future internal access decision boundary.
- Resolver output must not be customer-visible directly.
- Future resolver must preserve organization isolation, channel-agnostic
  customer identity, generic safe-deny, no existence leakage, and the mandatory
  resolver-to-projection-to-envelope flow.
- DB/API/runtime/provider/smoke work remains blocked.

## Verification Plan

For Task405 completion:

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
