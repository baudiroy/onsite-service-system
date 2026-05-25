# Task431 - Customer-Facing Local-Only Runtime Spike File Touch Plan / No Runtime Change

Task431 maps future local-only runtime spike candidate tasks to possible future
file touch categories.

This task is documentation-only. It does not authorize runtime work, does not
modify backend `src/`, does not add route/controller/resolver/repository/API
files, does not add fixtures or tests, and does not authorize DB / DDL /
migration / Migration020 work.

## Purpose

The purpose is to make future file touch scope explicit before any
customer-facing local-only runtime spike begins.

Task431 answers:

- which future categories may touch files if separately authorized,
- which path patterns are only examples,
- which file areas remain forbidden,
- which authorization is required before touching each category.

## Non-Authorization Statement

Task431 is not runtime approval.

Task431 does not authorize:

- backend `src/` changes,
- route/controller implementation,
- resolver implementation,
- repository implementation,
- API implementation,
- fixtures,
- tests,
- smoke/browser/API tests,
- DB access,
- DDL,
- migration,
- Migration020 dry-run/apply,
- provider sending,
- AI provider / RAG / vector DB,
- shared/prod/Zeabur access.

All path patterns in this document are future examples only. No files in those
patterns are created or modified by Task431.

## Relationship to Task428-Task430

Task428 closed the customer-facing runtime readiness / no-runtime branch and
defined PM handoff boundaries.

Task429 defined the authorization questions that must be answered before a
runtime spike.

Task430 split a possible future runtime spike into candidate tasks.

Task431 translates those candidate tasks into future file touch categories, but
still does not authorize file changes.

## Mandatory Future Customer-Facing Flow

Any future authorized spike must preserve:

```text
request
-> route/controller
-> resolver
-> customerAccessContext
-> projection DTO / projection service
-> response envelope or generic safe-deny
```

Rules:

- Controller must not bypass resolver.
- Resolver must not bypass customerAccessContext.
- Projection must not bypass customerAccessContext.
- Envelope must not bypass projection.
- No layer may output raw internal data.
- No layer may mutate Case, Appointment, Field Service Report, complaint,
  billing, settlement, identity, token, link, or audit state.
- No provider sending is allowed.
- No AI provider / RAG / vector DB is allowed.

## Future File Touch Categories

All categories are future-only and require explicit authorization.

### Route/Controller Skeleton Future File Category

Future purpose:

- Add local-only orchestration skeleton for customer-facing routes.

Possible future path pattern:

- `src/routes/customerFacing*.js`
- `src/controllers/customerFacing*.js`

Authorization required before touching:

- Explicit backend `src/` authorization.
- Explicit route/controller skeleton authorization.

Forbidden files / directories:

- `admin/src/`
- `migrations/`
- production config files,
- provider sending services,
- existing case/appointment/report mutation services unless separately
  authorized.

DB access allowed:

- No.

Provider sending allowed:

- No.

AI / RAG / vector DB allowed:

- No.

Production data allowed:

- No.

Sensitive data risk:

- Raw token, channel id, and customer identifiers must not be logged or output.

Organization isolation impact:

- Must preserve symbolic organization scope and no-existence leakage.

Customer channel identity impact:

- Must not treat channel identity as global identity.

Entitlement / usage / SaaS impact:

- Must not implement entitlement or usage runtime.

Required completion report items:

- Files touched, route family scope, proof controller does not bypass resolver.

Stop condition:

- Stop if controller needs repository, DB, provider, AI, or mutation service.

### Resolver Skeleton Future File Category

Future purpose:

- Add local-only resolver skeleton/stub for synthetic access outcomes.

Possible future path pattern:

- `src/services/customerFacingResolver*.js`
- `src/utils/customerFacingResolver*.js`

Authorization required before touching:

- Explicit backend `src/` authorization.
- Explicit resolver skeleton authorization.

Forbidden files / directories:

- `migrations/`
- repository files,
- provider services,
- AI/RAG workers,
- shared runtime config.

DB access allowed:

- No by default.

Provider sending allowed:

- No.

AI / RAG / vector DB allowed:

- No.

Production data allowed:

- No.

Sensitive data risk:

- Token/link state, identity state, consent state, and denial reason must remain
  internal-only and synthetic.

Organization isolation impact:

- Must fail closed on wrong organization and cross-tenant references.

Customer channel identity impact:

- Must use symbolic scoped identity references only.

Entitlement / usage / SaaS impact:

- Must not treat entitlement, subscription, seat, or usage state as permission.

Required completion report items:

- Denial cases represented, proof resolver does not emit customer-facing DTO.

Stop condition:

- Stop if resolver needs real persistence, DB, repository, or real identity
  lookup.

### customerAccessContext Skeleton Future File Category

Future purpose:

- Add or use a symbolic access context handoff between resolver and projection.

Possible future path pattern:

- `src/utils/customerAccessContext*.js`

Authorization required before touching:

- Explicit utility/backend `src/` authorization.
- Explicit customerAccessContext scope approval.

Forbidden files / directories:

- repository files,
- migrations,
- provider services,
- AI/RAG files.

DB access allowed:

- No.

Provider sending allowed:

- No.

AI / RAG / vector DB allowed:

- No.

Production data allowed:

- No.

Sensitive data risk:

- Context must not contain raw token, raw channel id, actual `line_user_id`,
  complete phone/address, internal note, or raw DB row.

Organization isolation impact:

- Must include symbolic organization scope and fail closed if missing.

Customer channel identity impact:

- Must preserve channel identity as scoped reference only.

Entitlement / usage / SaaS impact:

- Must not implement billing/usage/entitlement runtime.

Required completion report items:

- Context fields, forbidden field exclusions, fail-closed behavior.

Stop condition:

- Stop if context requires raw records or becomes authorization engine.

### Projection DTO / Projection Service Future File Category

Future purpose:

- Add or use allow-list-first customer-facing DTO/projection shaping.

Possible future path pattern:

- `src/utils/customerFacingProjectionDto*.js`
- `src/utils/customerFacingProjectionService*.js`

Authorization required before touching:

- Explicit utility/backend `src/` authorization.
- Explicit projection skeleton authorization.

Forbidden files / directories:

- repository files,
- mutation services,
- migrations,
- provider services.

DB access allowed:

- No.

Provider sending allowed:

- No.

AI / RAG / vector DB allowed:

- No.

Production data allowed:

- No.

Sensitive data risk:

- Projection must deny internal note, audit log, AI raw payload, raw provider
  payload, billing/settlement internal data, raw channel id, `line_user_id`,
  complete phone, and complete address.

Organization isolation impact:

- Must reject cross-organization resource candidates.

Customer channel identity impact:

- Must not output raw channel identity.

Entitlement / usage / SaaS impact:

- Must not expose internal permission/entitlement reason.

Required completion report items:

- Allow-list fields, forbidden fields, fail-closed behavior.

Stop condition:

- Stop if projection needs raw case/report/appointment rows or decides
  finalAppointmentId.

### Response Envelope / Generic Safe-Deny Future File Category

Future purpose:

- Add or use customer-facing success/safe-deny response envelope utilities.

Possible future path pattern:

- `src/utils/customerFacingResponseEnvelope*.js`
- `src/utils/customerFacingSafeDenyResponse*.js`

Authorization required before touching:

- Explicit utility/backend `src/` authorization.
- Explicit envelope/safe-deny skeleton authorization.

Forbidden files / directories:

- localization/message catalogs unless separately authorized,
- route/controller files unless separately authorized,
- provider services.

DB access allowed:

- No.

Provider sending allowed:

- No.

AI / RAG / vector DB allowed:

- No.

Production data allowed:

- No.

Sensitive data risk:

- Envelope must not include denial reason, resolver raw output, raw context,
  raw token, raw channel id, or raw provider payload.

Organization isolation impact:

- Must preserve no-existence leakage across tenant mismatch cases.

Customer channel identity impact:

- Must not reveal identity, consent, or verification internal reason.

Entitlement / usage / SaaS impact:

- Must not expose permission/entitlement/rate-limit internal reason.

Required completion report items:

- Response shape, safe-deny equivalence, no-leakage notes.

Stop condition:

- Stop if envelope needs reason-specific customer-visible message key.

### Synthetic Fixtures Future File Category

Future purpose:

- Add symbolic fixtures if tests require them.

Possible future path pattern:

- `tests/fixtures/customer-facing/*.js`
- `tests/fixtures/customer-facing/*.json`

Authorization required before touching:

- Explicit fixture authorization.
- Explicit test authorization if fixtures are tied to tests.

Forbidden files / directories:

- production exports,
- provider payload samples,
- raw customer data,
- uploaded files/photos/signatures,
- Inventory docs.

DB access allowed:

- No.

Provider sending allowed:

- No.

AI / RAG / vector DB allowed:

- No.

Production data allowed:

- No.

Sensitive data risk:

- Fixtures must be synthetic and scan-clean.

Organization isolation impact:

- Must include symbolic tenant boundaries if cross-scope behavior is tested.

Customer channel identity impact:

- Must use symbolic channel references only.

Entitlement / usage / SaaS impact:

- May include symbolic entitlement/usage cases only; no runtime.

Required completion report items:

- Fixture list, sensitive scan result, synthetic confirmation.

Stop condition:

- Stop if suspected real sensitive data appears.

### Minimal Unit / Contract Tests Future File Category

Future purpose:

- Add local-only pure/synthetic tests if explicitly authorized.

Possible future path pattern:

- `tests/customer-facing/*.test.js`
- `tests/customer-facing/*.spec.js`

Authorization required before touching:

- Explicit test authorization.
- Explicit fixture authorization if fixtures are needed.

Forbidden files / directories:

- browser smoke files,
- API smoke files,
- production config,
- DB scripts.

DB access allowed:

- No by default.

Provider sending allowed:

- No.

AI / RAG / vector DB allowed:

- No.

Production data allowed:

- No.

Sensitive data risk:

- Expected outputs must not contain forbidden fields or real sensitive data.

Organization isolation impact:

- Tests may assert symbolic cross-tenant fail-closed behavior only.

Customer channel identity impact:

- Tests may assert scoped identity behavior only.

Entitlement / usage / SaaS impact:

- Tests may assert permission != entitlement only if symbolic.

Required completion report items:

- Test files, commands, pass/fail, sensitive scan result.

Stop condition:

- Stop if tests require API server, DB, provider, browser, or smoke runtime.

### API / Browser / Smoke Tests Future File Category

Future purpose:

- Future local-only end-to-end verification only after separate approval.

Possible future path pattern:

- `scripts/smoke/customer-facing*.js`
- `scripts/smoke/browser/customer-facing*.js`

Authorization required before touching:

- Explicit API/browser/smoke authorization.
- Explicit local-only environment confirmation.

Forbidden files / directories:

- shared/prod/Zeabur runtime configs,
- provider sending scripts,
- production data exports.

DB access allowed:

- No unless separately approved.

Provider sending allowed:

- No.

AI / RAG / vector DB allowed:

- No.

Production data allowed:

- No.

Sensitive data risk:

- Logs must not output token, secret, channel id, phone, address, or production
  data.

Organization isolation impact:

- Must assert no cross-tenant leakage if authorized.

Customer channel identity impact:

- Must use synthetic identity data only.

Entitlement / usage / SaaS impact:

- Must not create usage or billing events unless separately authorized.

Required completion report items:

- Commands, local-only target confirmation, pass/fail summary.

Stop condition:

- Stop if tests require shared runtime, production data, provider credentials,
  or DB access without authorization.

### DB / Migration / Persistence Future File Category

Future purpose:

- Explicitly separate future persistence work from local-only runtime spike.

Possible future path pattern:

- `migrations/*.sql`
- `src/repositories/customerFacing*.js`

Authorization required before touching:

- Separate DB/DDL/migration authorization.
- Disposable local/test DB confirmation.
- Explicit exclusion of shared/prod/Zeabur.

Forbidden files / directories by default:

- `migrations/`,
- repository files,
- DB scripts.

DB access allowed:

- Not in Task431. Only in a separate DB-authorized task.

Provider sending allowed:

- No.

AI / RAG / vector DB allowed:

- No.

Production data allowed:

- No.

Sensitive data risk:

- Must never print credentials, connection strings, secrets, or production data.

Organization isolation impact:

- Future schema must preserve organization scope.

Customer channel identity impact:

- Future persistence must preserve scoped identity, not global `line_user_id`.

Entitlement / usage / SaaS impact:

- Future schema must not confuse permission with entitlement or usage.

Required completion report items:

- Explicit DB target category, no credentials, commands run, no shared/prod
  confirmation.

Stop condition:

- Stop unless DB work is explicit and separate.

## Allowed Only After Explicit Authorization Matrix

| Future category | Example future path pattern | Requires backend `src/` authorization | Requires fixture/test authorization | Requires API/browser/smoke authorization | Requires DB/migration authorization | Default status now |
| --- | --- | --- | --- | --- | --- | --- |
| Route/controller skeleton | `src/routes/customerFacing*.js`, `src/controllers/customerFacing*.js` | Yes | No | No | No | Not authorized in Task431 |
| Resolver skeleton | `src/services/customerFacingResolver*.js`, `src/utils/customerFacingResolver*.js` | Yes | No | No | No | Not authorized in Task431 |
| customerAccessContext skeleton | `src/utils/customerAccessContext*.js` | Yes | No | No | No | Not authorized in Task431 |
| Projection DTO / service | `src/utils/customerFacingProjection*.js` | Yes | No | No | No | Not authorized in Task431 |
| Response envelope / safe-deny | `src/utils/customerFacingResponse*.js`, `src/utils/customerFacingSafeDeny*.js` | Yes | No | No | No | Not authorized in Task431 |
| Synthetic fixtures | `tests/fixtures/customer-facing/*` | No | Yes | No | No | Not authorized in Task431 |
| Unit / contract tests | `tests/customer-facing/*` | No unless importing new runtime code | Yes | No | No | Not authorized in Task431 |
| API / browser / smoke tests | `scripts/smoke/customer-facing*.js`, `scripts/smoke/browser/customer-facing*.js` | Possibly | Yes | Yes | Possibly | Not authorized in Task431 |
| DB / migration / persistence | `migrations/*.sql`, `src/repositories/customerFacing*.js` | Yes for repository | Possibly | Possibly | Yes | Not authorized in Task431 |

## Forbidden File / Directory Boundaries

Task431 does not permit touching:

- `src/`,
- `admin/src/`,
- `tests/`,
- `scripts/smoke/`,
- `migrations/`,
- `package.json`,
- localization files,
- message catalogs,
- Inventory docs,
- provider sending services,
- AI/RAG/vector DB workers,
- shared/prod/Zeabur config or runtime.

## Data / Security / Privacy Boundaries

Future file touches must preserve:

- no raw token,
- no secret,
- no actual `DATABASE_URL`,
- no raw channel id,
- no actual `line_user_id`,
- no complete phone number,
- no complete address,
- no production data,
- no raw provider payload,
- no internal note exposure,
- no audit log exposure,
- no AI raw payload exposure,
- no billing/settlement internal data exposure.

## Organization Isolation / Customer Channel Identity Boundaries

Future files must preserve:

- organization scope,
- channel-agnostic customer identity,
- `line_user_id` scoped by organization and channel, never global,
- token/link as access reference, not identity,
- no cross-tenant resource projection,
- fail-closed default for organization mismatch.

## SaaS / Entitlement / Usage Boundary Notes

Future files must preserve:

- permission is not entitlement,
- entitlement is not permission,
- subscription/seat/usage limits do not replace access decision,
- AI add-on does not bypass organization isolation,
- Enterprise SSO does not bypass organization isolation,
- no usage/billing event runtime without separate authorization.

## Stop Conditions

Stop if:

- authorization is missing or ambiguous,
- a path outside the approved category is needed,
- DB/DDL/migration is needed,
- shared/prod/Zeabur access is needed,
- provider sending is needed,
- AI provider/RAG/vector DB is needed,
- production data is needed,
- real sensitive data appears in fixtures, tests, logs, or output,
- safe-deny equivalence cannot be preserved,
- organization isolation cannot be preserved,
- finalAppointmentId would be decided by customer-facing chain,
- Field Service Report invariant would be weakened.

## Explicit Non-goals

Task431 does not:

- modify `src/`,
- modify `admin/src/`,
- modify utilities,
- modify projection utilities,
- modify projection DTO utilities,
- modify forbidden field constants,
- modify response envelope utilities,
- modify safe-deny utilities,
- modify customerAccessContext utilities,
- add route files,
- add controller files,
- add API runtime,
- add resolver files,
- add repository runtime,
- add or modify fixture files,
- add or modify test files,
- add or modify smoke tests,
- add browser tests,
- add scan scripts,
- add CI configuration,
- modify localization files or message catalogs,
- modify `package.json`,
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
- modify Inventory docs,
- process real token, secret, `DATABASE_URL`, raw channel id, complete customer
  phone number, complete customer address, raw provider payload, or production
  data,
- claim runtime has been authorized.

## Verification Plan

For Task431 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- sensitive scan on this document for actual credentials, tokens, complete
  customer personal data, raw channel identifiers, raw provider payloads, and
  production data.

Do not run:

- DB commands,
- API tests,
- browser tests,
- smoke tests,
- migration commands,
- `psql`,
- `npm run db:migrate`.

## Completion Report Checklist

Completion report must include:

- modified files,
- whether the task was docs-only,
- summary of implemented documentation,
- what was not implemented,
- verification results,
- whether `docs/PROJECT_GUARDRAILS.md` was violated,
- whether data tables were added or modified,
- whether API was added or modified,
- whether permission logic was added or modified,
- whether audit log was added or modified,
- whether smoke tests were added or modified,
- whether sensitive data, token, secret, personal data, or LINE-related logic
  was touched,
- whether customer channel identity, organization isolation, SaaS-ready,
  entitlement, seat billing, usage billing, AI add-on, or Enterprise SSO were
  affected,
- future tasks, listed only and not implemented.

## Redaction Note

This document contains policy terms such as token, secret, raw channel id,
phone, address, provider payload, `DATABASE_URL`, `line_user_id`, and Zeabur
only as examples of data or runtime boundaries that must not be exposed or
touched without authorization. It does not include credentials, database URLs,
access tokens, secrets, complete customer phone numbers, complete customer
addresses, raw channel identifiers, raw provider payloads, verification codes,
or production data details.
