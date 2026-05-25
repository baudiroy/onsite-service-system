# Task403 — Customer-Facing Runtime Entry Gate Decision Packet / No Runtime Change

Task403 defines the entry gate for any future customer-facing access runtime
branch. It is documentation-only and does not authorize runtime.

This task does not add code, tests, package changes, runtime behavior, routes,
controllers, repositories, DB access, migrations, schema, indexes,
localization, provider sending, browser automation, or smoke tests.

## Current Accepted Baseline

Task370-402 established the customer-facing access no-runtime baseline.

Completed baseline areas:

- Customer-facing access design documents.
- Customer-visible data classification.
- Response envelope and safe-deny contract.
- Projection DTO and projection service contract.
- Customer access context resolver contract.
- Controller boundary contract.
- Safe-deny and projection scenario matrix.
- Pre-runtime readiness gate and code-only skeleton cutline.
- Pure utility skeleton.
- Pure unit test convention.
- Pure unit test baseline.
- Pure utility coverage closure.
- Pure skeleton branch closure and PM handoff.
- Pure utility consistency review.
- Forbidden field constants consolidation decision, implementation, test, and
  closure.
- Pure utility naming cleanup review.
- Final PM checkpoint for the no-runtime branch.

Accepted pure utilities:

- `src/utils/customerFacingSafeDenyResponse.js`
- `src/utils/customerFacingResponseEnvelope.js`
- `src/utils/customerAccessContext.js`
- `src/utils/customerFacingProjectionDto.js`
- `src/utils/customerFacingProjectionService.js`
- `src/utils/customerFacingForbiddenFields.js`

Accepted pure unit tests:

- `tests/unit/utils/customer-facing/customerFacingSafeDenyResponse.test.js`
- `tests/unit/utils/customer-facing/customerFacingResponseEnvelope.test.js`
- `tests/unit/utils/customer-facing/customerAccessContext.test.js`
- `tests/unit/utils/customer-facing/customerFacingProjectionDto.test.js`
- `tests/unit/utils/customer-facing/customerFacingProjectionService.test.js`
- `tests/unit/utils/customer-facing/customerFacingForbiddenFields.test.js`

Current state remains:

- no-runtime skeleton,
- no controller / route / API,
- no repository / DB access,
- no migration / schema / index,
- no provider sending,
- no browser/API/DB/smoke tests,
- no shared/prod/Zeabur runtime access.

## Runtime Entry Is Not Authorized

Task403 does not authorize:

- API runtime,
- controller runtime,
- route runtime,
- repository access,
- DB access,
- migration or schema work,
- provider sending,
- smoke tests,
- browser tests,
- API tests,
- customer-facing public endpoint exposure.

General continuation language, including "continue", "go ahead", "next", or
"keep developing", must not be interpreted as runtime approval.

If the user wants customer-facing runtime work later, that must be a separate
explicit branch decision with a single bounded task and the required safety
preconditions.

## Future Runtime Gate Checklist

Any future customer-facing runtime branch must satisfy all gate items below
before code execution.

### Authorization and Environment

- Explicit user authorization for the specific runtime scope.
- Disposable local/test runtime confirmation where runtime testing is required.
- Written confirmation that shared/prod/Zeabur is not the target.
- Written confirmation that no production data will be used.
- No DB / DDL / migration / Migration020 dry-run or apply unless separately
  authorized in a dedicated DB task.
- No `DATABASE_URL`, token, secret, credential, raw channel id, complete
  customer contact data, or production payload may be printed.

### Tenant and Organization Isolation

- Organization isolation must be designed before runtime exposure.
- Every future resolver must require organization scope.
- Customer-facing access must not read across organizations, tenants, channels,
  customers, cases, appointments, reports, or documents.
- SaaS-ready organization scope, entitlement, usage, and permission boundaries
  must remain compatible with the future runtime.

### Customer Channel Identity

- Customer channel identity must remain channel-agnostic.
- LINE may be supported, but the model must not become LINE-only.
- Future App, Web, SMS, Email, and other channel identities must remain
  compatible.
- Raw channel identifiers must not be exposed in customer-facing output,
  logs, errors, documents, prompts, or PM handoffs.

### Safe-deny and Existence Leakage

- Generic safe-deny must remain the default.
- Customer-facing errors must not reveal whether an organization, customer,
  case, appointment, report, token, channel binding, or resource exists.
- Exact internal denial reasons must not be returned to customers.
- Exact token failure states, such as expired, revoked, already used, wrong
  user, wrong case, disabled organization, or mismatch, must be mapped to safe
  customer-facing responses.

### Required Flow Boundary

Future runtime must not bypass this flow:

```text
resolver -> customerAccessContext -> projection -> envelope / safe-deny
```

The resolver must decide access. Projection utilities must only shape
already-authorized data. Envelope/safe-deny utilities must only return
customer-safe response structures.

Controllers must remain orchestration-only and must not directly expose raw
records, denial reasons, tokens, channel identity internals, audit/security
reasons, provider payloads, AI output, or unfiltered source objects.

### Audit, Rate-limit, and Abuse Controls

- Audit/security event persistence requires a separate design and explicit
  authorization.
- Rate-limit and abuse protection require a separate design and explicit
  authorization.
- Until those exist, runtime exposure remains blocked.
- Internal abuse signals must not be exposed as customer-visible exact reasons.

### Provider Sending and AI Boundary

- Provider sending remains prohibited until separately authorized.
- No LINE, SMS, Email, App, survey, or notification sending may happen from a
  customer-facing access runtime branch unless explicitly scoped.
- No AI provider, RAG, vector DB, prompt, worker, or model runtime is authorized.
- AI output must not be used to decide access or expose customer-facing records.

## First Runtime Candidate Sequencing

The following are future candidates only. They are not authorized by Task403.

1. Route/controller contract proposal.
   - Future task only.
   - Should define endpoint shape, safe-deny response mapping, request
     reference behavior, and no-existence-leakage requirements.
   - Must not implement runtime without later explicit approval.

2. Resolver contract proposal.
   - Future task only.
   - Should define organization scope, customer channel identity lookup,
     allowed projection scope, denial categories, and safe internal state
     mapping.
   - Must not query DB without later explicit approval.

3. Token/channel identity persistence proposal.
   - Future task only.
   - Should define token lifecycle, channel identity scope, storage,
     redaction, expiry, one-time-use behavior, and audit requirements.
   - Must not add migration or schema without later explicit approval.

4. Audit/security event model proposal.
   - Future task only.
   - Should define event types, masked summaries, retention, access control,
     and no sensitive payload storage.
   - Must not add audit persistence without later explicit approval.

5. Local-only disposable runtime spike.
   - Future task only.
   - Requires explicit user authorization and disposable local/test runtime
     confirmation.
   - Must not target shared/prod/Zeabur.
   - Must not print secrets, credentials, raw channel ids, complete customer
     data, or production payloads.

Each candidate must remain one bounded task at a time.

## Explicit Non-goals

Task403 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify tests,
- add or modify smoke tests,
- modify `package.json`,
- add a test framework or dependency,
- add helper/service/repository/interface code,
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

Task403 establishes a future runtime entry gate only.

Decision summary:

- Customer-facing runtime remains unauthorized.
- Current branch remains no-runtime / no-DB / no-provider / no-API / no-smoke.
- Future runtime requires explicit authorization and disposable local/test
  runtime confirmation.
- Future runtime must preserve organization isolation, channel-agnostic
  customer identity, generic safe-deny, no existence leakage, forbidden field
  default deny, and the resolver-to-projection-to-envelope flow.
- DB/API/runtime/provider/smoke work remains blocked.

## Verification Plan

For Task403 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw channel data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only decision packet.

## Redaction Note

This document contains policy terms such as token, secret, raw channel identity,
phone, mobile, address, provider payload, and `DATABASE_URL` only as examples of
data that must not be exposed. It does not include credentials, database URLs,
access tokens, secrets, complete customer phone numbers, complete customer
addresses, raw channel identifiers, raw provider payloads, verification codes,
or production data details.
