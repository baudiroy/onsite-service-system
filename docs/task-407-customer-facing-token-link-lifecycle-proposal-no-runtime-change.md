# Task407 — Customer-Facing Token / Link Lifecycle Proposal / No Runtime Change

Task407 proposes the future customer-facing token/link lifecycle boundary. It is
documentation-only and does not authorize token/link runtime.

This task does not add code, tests, package changes, runtime behavior, routes,
controllers, repositories, DB access, migrations, schema, indexes,
localization, provider sending, browser automation, or smoke tests.

## Current Baseline

Task407 follows the Task370-406 customer-facing no-runtime baseline.

Already accepted:

- Pure customer-facing utilities.
- Pure unit tests.
- Runtime entry gate decision packet.
- Route/controller contract proposal.
- Resolver contract proposal.
- Customer channel identity persistence proposal.

Current state remains:

- no customer-facing runtime,
- no token/link generation runtime,
- no customer channel identity persistence,
- no resolver runtime,
- no controller / route / API,
- no repository / DB access,
- no migration / schema / index,
- no provider sending,
- no browser/API/DB/smoke tests,
- no shared/prod/Zeabur runtime access.

Task407 does not authorize DB, migration, token/link implementation, runtime, or
provider sending.

## Token / Link Principles

Future customer-facing tokens and links must follow these principles:

- A token/link is only a scoped access reference, not customer identity.
- A token/link must not replace the resolver.
- A Web Link token must not bypass customer channel identity, organization
  isolation, or projection policy.
- A token/link must be scoped to route family, purpose, organization scope,
  resource scope, expiry, and revocation state.
- A token/link must not include raw customer personal data, raw channel id,
  internal notes, audit payloads, AI raw payloads, billing internal data, or
  settlement internal data.
- A token/link must not leak through logs, analytics events, browser referrer,
  error messages, screenshots, or customer-visible reports.
- A token/link must be usable only through the approved resolver flow.

## Future Conceptual Lifecycle

This is a future proposal only and is not implemented in Task407.

Future lifecycle stages may include:

1. Issue / create candidate.
   - Future only.
   - Must be bound to a purpose and organization scope before use.

2. Bind to organization scope.
   - Future only.
   - The token/link must not be valid outside that organization.

3. Bind to route family / purpose.
   - Future only.
   - The token/link must not become a universal customer portal key.

4. Bind to symbolic resource reference.
   - Future only.
   - The token/link should reference allowed resources symbolically and safely.

5. Bind to customer channel identity reference.
   - Future only.
   - The token/link must remain compatible with channel-agnostic identity.

6. Deliver via allowed channel candidate.
   - Future only.
   - Delivery requires separate provider/notification authorization.

7. Verify.
   - Future only.
   - Resolver must verify token/link state and access purpose.

8. Use.
   - Future only.
   - Use must go through route/controller -> resolver -> access context ->
     projection -> envelope/safe-deny.

9. Expire.
   - Future only.
   - Expired links must not disclose that they used to be valid.

10. Revoke.
    - Future only.
    - Revoked links must not disclose that they used to be valid.

11. Rotate / reissue.
    - Future only.
    - Reissue must not silently keep unsafe old links alive unless future
      policy explicitly allows it and records audit evidence.

12. Audit/security event candidate.
    - Future only.
    - Must be masked, tenant-scoped, and separately authorized.

## Purpose / Route Family Scoping

A future token/link must not be a universal customer portal key.

Different purposes should be separable:

- service report view,
- appointment summary view,
- completion status view,
- issue / follow-up entry point,
- survey / feedback link.

Scope decisions:

- Survey / feedback link must not automatically equal service report access.
- Issue/follow-up link must not automatically equal full case access.
- Appointment summary link must not automatically grant service report access.
- Service report view link must not automatically grant issue submission unless
  explicitly scoped.
- Completion status link must not expose internal completion report data.

Route family and purpose must be checked by the future resolver before any
projection is built.

## Expiry / Revoke / Reissue Boundary

Future token/link design must support expiry and revocation.

Rules:

- Expiry must be enforced by the resolver.
- Revocation must be enforced by the resolver.
- Revoked links must not reveal that they were previously valid.
- Expired links must not reveal that they were previously valid.
- Reissued links should invalidate older links unless future policy explicitly
  allows multiple active links with audit evidence.
- Link reissue must verify channel identity, consent, purpose, and abuse/rate
  limits.
- A customer request alone must not automatically justify reissuing a link.

The following conditions should externally collapse to generic safe-deny where
appropriate:

- expired token/link,
- revoked token/link,
- malformed token/link,
- wrong purpose,
- wrong organization,
- wrong resource,
- wrong channel identity,
- no consent,
- ambiguous identity,
- unsupported route family.

## Delivery Channel Boundary

LINE, SMS, Email, App push, and Web Link are delivery or access channels. They
are not authorization by themselves.

Rules:

- LINE must not be hard-coded as the only channel.
- Provider sending requires separate authorization.
- Task407 does not add any provider sending.
- Sending a link requires future checks for consent, notification purpose,
  rate-limit, abuse protection, and audit/outbox policy.
- A delivered link must still be verified by the resolver at access time.

Delivery failure, provider response, or customer click behavior must not expose
raw provider payloads or raw channel identifiers.

## No Existence Leakage / Enumeration Protection

Customer-facing endpoints must not reveal:

- whether a token ever existed,
- whether a token expired,
- whether a token was revoked,
- whether a customer exists,
- whether a case exists,
- whether an appointment exists,
- whether a service report exists,
- whether a channel identity is bound,
- whether a customer has consent for a channel.

Leakage must be avoided through:

- status code,
- message key,
- response body,
- field shape,
- redirect path,
- timing,
- next action wording,
- request reference content,
- analytics/debug metadata.

Future audit/security categories may record internal outcomes, but they must
not be customer-visible.

## Logging / Analytics / Observability Boundary

Future token/link runtime must not:

- log raw token,
- store raw token in analytics events,
- place token in browser referrer-sensitive paths without a mitigation design,
- send token to error tracking messages,
- expose token in customer-visible reports,
- expose token in support screenshots or handoff summaries,
- send token to AI providers.

Future observability must use sanitized token references and masked summaries.
It must remain tenant-scoped, minimum necessary, permission-aware, and
redacted.

## AI Boundary

AI must not:

- generate official tokens,
- approve token reissue,
- read raw tokens,
- receive raw tokens,
- receive raw channel identifiers,
- receive complete phone numbers,
- receive complete addresses,
- receive raw provider payloads,
- decide whether a token is authorized.

AI may help summarize suspicious patterns or delivery failures only if it uses
masked, minimized metadata and remains within data access, tenant isolation,
and audit boundaries.

## Future Task Candidates

These are future candidates only and are not implemented by Task407:

- token/link schema design proposal,
- token/link audit/security event proposal,
- token/link reissue policy proposal,
- token/link localization/message key proposal,
- token/link resolver test matrix proposal,
- local-only disposable token/link spike after explicit authorization.

Any future DB/migration/schema task must be separately authorized and must not
target shared/prod/Zeabur without explicit approval.

## Explicit Non-goals

Task407 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify tests,
- add or modify smoke tests,
- modify `package.json`,
- add a test framework or dependency,
- add helper/service/repository/interface code,
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

Task407 records a future token/link lifecycle proposal only.

Decision summary:

- Token/link is a scoped access reference, not identity.
- Token/link must not replace resolver verification.
- Purpose/route family scoping is required.
- Expiry, revocation, reissue, delivery, logging, observability, and AI
  boundaries must be designed before runtime.
- Provider sending remains separately blocked.
- DB/API/runtime/provider/smoke work remains blocked.

## Verification Plan

For Task407 completion:

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
