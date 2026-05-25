# Task406 — Customer Channel Identity Persistence Proposal / No Runtime Change

Task406 proposes the future customer channel identity persistence boundary for
customer-facing access. It is documentation-only and does not authorize DB,
migration, repository, resolver, API, provider, or runtime work.

This task does not add code, tests, package changes, runtime behavior, routes,
controllers, repositories, DB access, migrations, schema, indexes,
localization, provider sending, browser automation, or smoke tests.

## Current Baseline

Task406 follows the Task370-405 customer-facing no-runtime baseline.

Already accepted:

- Pure customer-facing utilities.
- Pure unit tests.
- Runtime entry gate decision packet.
- Route/controller contract proposal.
- Resolver contract proposal.

Current state remains:

- no customer-facing runtime,
- no customer channel identity persistence,
- no resolver runtime,
- no controller / route / API,
- no repository / DB access,
- no migration / schema / index,
- no provider sending,
- no browser/API/DB/smoke tests,
- no shared/prod/Zeabur runtime access.

Task406 does not authorize DB, migration, table creation, repository, resolver,
API, or runtime.

## Identity Model Principles

Future customer channel identity persistence must follow these principles:

- `line_user_id` must not be treated as a global identity.
- LINE is a supported channel, not the only channel.
- Customer identity and channel identity must remain separate concepts.
- Customer channel identity must be tenant-scoped.
- Different organizations must not infer or reuse each other's channel
  identities.
- Different channel instances must not infer or reuse each other's channel user
  identities.
- An unverified identity must not be treated as authorized customer access.
- Verification state and consent state must remain separate.
- A customer may have multiple channel identities.
- A channel identity may require revocation, disablement, re-verification, or
  consent changes without deleting the customer.

## Future Conceptual Fields

This is a future proposal only and is not implemented in Task406.

A future customer channel identity record may conceptually include:

- organization scope reference,
- customer reference,
- channel type,
- channel instance reference,
- channel user identity reference,
- verification state,
- consent state,
- binding source,
- last verified at,
- revoked / disabled state,
- audit metadata placeholder.

These fields must use symbolic or sanitized wording in design documents and
handoffs. Do not include real raw channel identifiers, complete customer phone
numbers, complete addresses, tokens, credentials, or production data.

## Channel Coverage

Each channel identity must be treated as a scoped identity instance, not a
global customer identity.

| Channel | Future identity stance |
| --- | --- |
| LINE | Supported channel. `line_user_id` is scoped by organization and channel instance; it is not global customer identity. |
| SMS | Phone-based contact can help verification or notification, but a phone value alone is not global customer identity or blanket consent. |
| Web Link | Link/token access must remain scoped, expiring, and resolver-checked; it must not bypass the resolver. |
| App | App identity may become a strong owned-channel identity, but it still needs organization scope, verification state, consent state, and permissions. |
| Email | Email can be a contact and verification channel, but it is not proof of all access or consent by itself. |
| Future AI call / phone-assisted flow | AI or phone-assisted intake may collect evidence or verification inputs, but it must not create authorized identity without deterministic checks and human-safe policy boundaries. |

Future channel support must not make one channel the model that all other
channels are forced to mimic.

## Verification and Consent Separation

Verification answers:

```text
Has this channel identity been proven to represent a specific customer or
authorized contact method for this organization and purpose?
```

Consent answers:

```text
Is this channel identity allowed to receive a specific type of notification or
use a specific customer-facing access purpose?
```

The system must not assume:

- bound identity means consent to all notifications,
- having a phone number means messages can be sent,
- having a LINE user id means the customer can be queried across organizations,
- having a Web Link token means the resolver can be skipped,
- successful identity lookup means all customer-facing surfaces are allowed,
- App login means all organization data is visible.

Verification and consent may change over time and must be auditable in future
runtime.

## Resolver Lookup Boundary

A future resolver may use customer channel identity persistence to look up a
scoped identity. That lookup must be constrained by:

- organization scope,
- channel type,
- channel instance,
- symbolic channel user identity,
- verification state,
- consent/access purpose,
- requested route family,
- allowed projection scope.

Resolver lookup failure must externally collapse to generic safe-deny where
appropriate. The resolver must not expose raw denial reasons to customer-facing
responses.

The lookup must not return raw provider payloads, complete contact data, audit
logs, internal notes, settlement data, AI raw payloads, or unfiltered customer
records to projection.

## Enumeration Protection

Customer-facing endpoints must not allow enumeration of:

- whether a phone number exists,
- whether a LINE user is bound,
- whether an email is registered,
- whether a customer exists,
- whether a case exists,
- whether an appointment exists,
- whether a service report exists,
- whether a token was expired, revoked, already used, or mismatched,
- whether a specific organization or channel instance is enabled.

The following conditions should externally collapse to generic safe-deny where
appropriate:

- mismatch,
- not found,
- revoked,
- disabled,
- unverified,
- no consent,
- duplicate ambiguous identity,
- unsupported channel,
- organization mismatch,
- hidden or unavailable resource.

Internal audit/security categories may exist in future, but they must not be
customer-visible.

## Duplicate and Merge Boundary

Future customer identity workflows must handle duplicates cautiously:

- The same customer may have multiple channel identities.
- The same channel identity must not be automatically merged across
  organizations.
- Duplicate candidate does not equal confirmed duplicate.
- Similar phone, email, name, address, device, or channel data is only a signal.
- AI may suggest duplicate candidates, but must not automatically merge,
  overwrite, unlink, revoke, or replace formal customer identity.
- Merge, unlink, revoke, disable, and rebind actions require future permission,
  audit, and review design.

Future runtime must preserve traceability for identity changes and must not
silently rewrite historical case/customer/channel context.

## SaaS / Entitlement Boundary

Customer channel identity persistence must be SaaS-ready.

Principles:

- Permission, entitlement, seat, usage, and subscription are different
  concepts.
- Customer channel identity lookup must not bypass organization isolation.
- Customer channel identity lookup must not bypass feature entitlement.
- Customer channel identity lookup must not bypass user permission.
- Customer channel identity lookup must not bypass subscription status where
  applicable.
- AI add-on, Enterprise SSO, plan entitlement, seat billing, and usage billing
  must remain compatible.
- Cross-tenant lookup must fail closed.

Future identity features such as multi-channel binding, self-service access,
App identity, SMS verification, Email verification, or LINE binding may be
controlled by plan/entitlement later, but entitlement does not replace
permission or resolver verification.

## Future Task Candidates

These are future candidates only and are not implemented by Task406:

- customer channel identity schema design proposal,
- token/link lifecycle proposal,
- customer identity merge/unlink/revoke proposal,
- channel identity audit/security event model proposal,
- resolver lookup test matrix proposal,
- local-only disposable identity lookup spike after explicit authorization.

Any future DB/migration/schema task must be separately authorized and must not
target shared/prod/Zeabur without explicit approval.

## Explicit Non-goals

Task406 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify tests,
- add or modify smoke tests,
- modify `package.json`,
- add a test framework or dependency,
- add helper/service/repository/interface code,
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

Task406 records a future customer channel identity persistence proposal only.

Decision summary:

- Customer identity and channel identity must remain separate.
- Channel identity must be scoped by organization and channel instance.
- LINE support must not become LINE-only design.
- Verification state and consent state must remain separate.
- Resolver lookup must be organization-scoped, channel-scoped, purpose-aware,
  and fail-closed.
- Enumeration protection is mandatory.
- DB/API/runtime/provider/smoke work remains blocked.

## Verification Plan

For Task406 completion:

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
