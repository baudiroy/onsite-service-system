# Task420 — Customer-Facing Resolver Skeleton Design Packet / No Runtime Change

Task420 defines the future design boundary for a customer-facing resolver
skeleton if explicit local-only runtime authorization is granted later.

This task is documentation-only. It is not a runtime kickoff and does not add
resolver, repository, DB, API, fixture, test, provider, or AI runtime files.

## Current Baseline

Task420 follows the Task370-419 customer-facing no-runtime baseline.

It especially follows:

- Task405: resolver contract proposal.
- Task406: customer channel identity persistence proposal.
- Task407: token/link lifecycle proposal.
- Task411: safe-deny test matrix proposal.
- Task415: local-only runtime authorization checklist.
- Task417: synthetic fixture policy.
- Task418: fixture sensitive scan checklist.
- Task419: route/controller skeleton design packet.

Current state remains:

- no customer-facing runtime,
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

Task420 is a resolver skeleton design packet, not implementation.

## Future Resolver Skeleton Purpose

If a future local-only runtime branch is explicitly approved, the resolver
skeleton should prepare internal access decisions and customerAccessContext.

Resolver skeleton may conceptually:

- receive sanitized request references,
- evaluate symbolic route family,
- evaluate sanitized token/link reference,
- evaluate organization scope,
- evaluate symbolic channel identity context,
- prepare an internal allowed/denied result,
- prepare a customerAccessContext,
- prepare internal-only denial category,
- prepare future audit/security event candidate.

Resolver skeleton must not:

- directly create customer-facing DTO,
- directly wrap response envelope,
- directly send LINE,
- directly send SMS,
- directly send Email,
- directly send App push,
- directly send survey,
- directly modify Case status,
- directly modify Appointment status,
- directly modify Field Service Report status,
- approve fees,
- approve quote,
- approve settlement,
- close complaint,
- reissue link,
- revoke link,
- rotate token,
- merge identity,
- unlink identity,
- call AI provider,
- call RAG/vector DB.

Resolver prepares access context; it does not produce customer-facing output or
perform mutations.

## Mandatory Future Flow

Future customer-facing resolver work must remain inside this flow:

```text
request
-> route/controller
-> resolver
-> customerAccessContext
-> projection DTO / projection service
-> response envelope or generic safe-deny
```

Resolver skeleton must not be bypassed by:

- controller,
- projection,
- repository,
- provider worker,
- support fallback,
- audit/security event writer,
- notification sender,
- AI worker.

Controller cannot query protected resources directly. Projection cannot decide
authorization. Repository cannot emit customer-facing DTO.

## Resolver Input Skeleton Proposal

The following input categories are future proposal only. Task420 does not
implement them.

Resolver skeleton may receive:

- sanitized request reference,
- symbolic route family,
- sanitized token/link reference,
- organization scope placeholder,
- channel context placeholder,
- request metadata placeholder,
- symbolic correlation reference,
- symbolic fixture reference in local-only synthetic mode.

Resolver skeleton must not receive or record:

- raw token,
- secret,
- `DATABASE_URL`,
- raw provider payload,
- raw channel id,
- actual `line_user_id` value,
- complete phone number,
- complete address,
- production customer data,
- raw customer document,
- raw signature/photo/file content,
- raw AI prompt,
- raw model response.

Request metadata must be minimized and sanitized. If a value is not needed for
access context, it should not enter resolver input.

## Resolver Output Skeleton Proposal

The following output categories are future proposal only. Task420 does not
implement them.

Resolver result may include:

- allowed / denied internal decision,
- internal-only denial category,
- organization scope reference,
- symbolic customer identity reference,
- symbolic channel identity reference,
- symbolic resource reference,
- verification state summary,
- consent state summary,
- requested route family,
- customerAccessContext,
- safe audit/security event candidate placeholder.

Resolver result must not be directly exposed externally.

External response must not include:

- internal denial category,
- raw resolver output,
- resource lookup result,
- token state,
- identity state,
- consent reason,
- organization mismatch reason,
- repository lookup detail,
- audit/security event candidate detail.

Controller must convert resolver outcomes through generic safe-deny or
allow-listed projection, not raw resolver output.

## Fail-Closed Skeleton Matrix

Future resolver behavior should fail closed for sensitive cases.

| Case | Internal category candidate | External behavior | No-existence-leakage assertion | Audit/security event candidate |
| --- | --- | --- | --- | --- |
| Missing token | missing_token | Generic safe-deny. | Must not reveal whether token or resource exists. | Future only. |
| Malformed token | malformed_token | Generic safe-deny. | Must not reveal parser detail. | Future only. |
| Expired token | expired_token | Generic safe-deny. | Must not reveal that token was once valid. | Future only. |
| Revoked token | revoked_token | Generic safe-deny. | Must not reveal revocation state. | Future only. |
| Wrong purpose | wrong_purpose | Generic safe-deny. | Must not reveal intended route family. | Future only. |
| Wrong organization | wrong_organization | Generic safe-deny. | Must not reveal tenant mismatch or tenant existence. | Future only. |
| Wrong resource | wrong_resource | Generic safe-deny. | Must not reveal resource existence. | Future only. |
| Wrong channel identity | wrong_channel_identity | Generic safe-deny. | Must not reveal binding state. | Future only. |
| Unverified identity | unverified_identity | Generic safe-deny or generic verification-required response. | Must not reveal identity existence. | Future only. |
| No consent | no_consent | Generic safe-deny or generic verification-required response. | Must not reveal consent state details. | Future only. |
| Deleted resource | deleted_resource | Generic safe-deny. | Must not reveal lifecycle state. | Future only. |
| Hidden resource | hidden_resource | Generic safe-deny. | Must not reveal hidden state. | Future only. |
| Unauthorized resource | unauthorized_resource | Generic safe-deny. | Must not reveal resource exists but is unauthorized. | Future only. |
| Unsupported route family | unsupported_route_family | Generic safe-deny. | Must not reveal supported internal route map. | Future only. |
| Ambiguous duplicate identity | ambiguous_duplicate_identity | Generic safe-deny. | Must not reveal duplicate/merge state. | Future only. |
| Repository unavailable | repository_unavailable | Generic safe-deny or generic try-later. | Must not reveal lookup or resource state. | Future only. |
| Customer channel identity unavailable | channel_identity_unavailable | Generic safe-deny. | Must not reveal channel identity state. | Future only. |

Internal category candidates may be used only for future audit/security event
design. They must not become customer-visible.

## Customer Channel Identity Boundary

Resolver skeleton must not use `line_user_id` as global identity.

Channel identity is a scoped identity instance, not a global customer identity.

Future matching must consider:

- organization scope,
- channel type,
- channel instance reference,
- symbolic channel user reference,
- verification state,
- consent state,
- customer identity reference,
- route family / purpose.

Supported channel concepts should include:

- LINE,
- SMS,
- Email,
- App,
- Web Link,
- future phone-assisted flow.

Rules:

- LINE must not be hard-coded as the only channel.
- Raw channel id must not enter customer-facing output.
- Unverified identity must fail closed.
- Revoked identity must fail closed.
- No consent must fail closed or use generic verification-required response.
- Ambiguous identity must fail closed.
- Wrong channel identity must fail closed.

## Token / Link Boundary

Token/link is a scoped access reference, not customer identity.

Rules:

- Token/link does not replace resolver.
- Token/link does not replace customerAccessContext.
- Resolver skeleton must not log raw token.
- Resolver skeleton must not print raw token.
- Resolver skeleton must not expose raw token to projection.
- Resolver skeleton must not expose token state externally.
- Expired token must be generic externally.
- Revoked token must be generic externally.
- Wrong purpose must be generic externally.
- Wrong organization must be generic externally.
- Wrong resource must be generic externally.
- Wrong channel identity must be generic externally.
- Reissue, rotate, revoke, and link lifecycle mutation require separate future
  workflow and must not be implemented in resolver skeleton.

## Repository / DB Boundary

Task420 does not add repository or DB access.

Future local-only resolver skeleton should prefer synthetic in-memory symbolic
fixtures if runtime is ever authorized.

Rules:

- Do not depend on production data.
- Do not connect to shared/prod/Zeabur DB.
- Do not run DB/DDL/migration without separate authorization.
- Do not use repository in no-DB skeleton.
- Repository unavailable and not found must not create distinguishable external
  responses.
- DB/schema/index work remains independently blocked.

If a future DB-backed resolver is proposed, it must have a separate DB and
schema authorization packet.

## Audit / Rate-Limit / AI Boundary

Resolver skeleton may prepare future audit/security event candidate metadata,
but must not write it unless separately approved.

Boundaries:

- Audit/security event table is not added.
- Audit/security event write runtime is not added.
- Rate-limit / abuse remains future-only.
- No middleware is added.
- AI cannot decide allowed / denied.
- AI cannot decide reissue / revoke.
- AI cannot decide merge / unlink.
- AI cannot decide case close.
- AI cannot decide complaint close.
- AI cannot read raw token.
- AI cannot read raw provider payload.
- AI cannot read complete phone number.
- AI cannot read complete address.
- AI cannot read internal note full text.
- AI cannot read audit/security event full text.

## Synthetic Local-Only Skeleton Option

This is a future option only. Task420 does not authorize or implement it.

If explicit local-only runtime authorization is granted, the safest initial
resolver skeleton should prefer:

- no DB,
- no provider sending,
- no AI provider,
- no RAG,
- no vector DB,
- synthetic in-memory fixtures only,
- sanitized symbolic references only,
- fail-closed default,
- existing customerAccessContext utility only,
- existing pure helpers only,
- no persistent audit/security event writes.

The future option must satisfy:

- Task415 local-only runtime authorization checklist,
- Task417 synthetic fixture policy,
- Task418 sensitive scan checklist,
- Task419 route/controller skeleton design packet.

## Explicit Non-goals

Task420 does not:

- modify `src/`,
- modify `admin/src/`,
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

Task420 records a future customer-facing resolver skeleton design packet only.

Decision summary:

- Resolver skeleton prepares internal access decision and customerAccessContext.
- Resolver does not generate customer-facing DTO or response envelope.
- Resolver does not mutate Case, Appointment, Field Service Report, billing,
  settlement, token/link, identity, complaint, or support state.
- Resolver fails closed across token, resource, organization, channel identity,
  consent, verification, and repository uncertainty.
- Token/link is scoped access reference, not customer identity.
- `line_user_id` is not global identity.
- No resolver/runtime/API/DB/test/provider/AI work is implemented by Task420.

## Verification Plan

For Task420 completion:

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
