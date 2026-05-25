# Task385 — Customer-Facing Skeleton Integration Guard Review / No Runtime Change

Task385 reviews the Task380-384 customer-facing pure skeleton files against the
Task379 code-only cutline. It is documentation-only. It does not change code,
runtime behavior, tests, migrations, schema, routes, controllers, providers, or
shared runtime state.

## Current Baseline

- Task380-384 completed pure code skeleton files.
- Customer-facing runtime has not started.
- No controller, route, or API runtime has been added.
- No repository, DB access, migration, schema, or index has been added.
- No provider sending has been added.
- No disposable local/test runtime confirmation exists.
- Migration020, survey runtime, shared/prod/Zeabur runtime, DB/DDL/psql, and
  `npm run db:migrate` remain paused.
- No API/DB/browser/smoke tests were introduced for this branch.

## Skeleton Inventory

| Task | File | Purpose | Runtime status |
| --- | --- | --- | --- |
| Task380 | `src/utils/customerFacingSafeDenyResponse.js` | Builds generic customer-safe deny/unavailable responses from symbolic categories. | Pure helper only; not wired. |
| Task381 | `src/utils/customerFacingResponseEnvelope.js` | Builds customer-facing success/unavailable envelope shapes and shared safe reference validation. | Pure utility only; not wired. |
| Task382 | `src/utils/customerAccessContext.js` | Builds internal customer access context skeleton after a future resolver decides access. | Pure utility only; not wired. |
| Task383 | `src/utils/customerFacingProjectionDto.js` | Builds allow-listed customer-facing timeline/service report/unavailable DTO shapes. | Pure utility only; not wired. |
| Task384 | `src/utils/customerFacingProjectionService.js` | Maps already-authorized, already-sanitized source concepts into Task383 DTOs. | Pure projection skeleton only; not wired. |

## Dependency Direction Review

The current dependency direction remains within the Task379 cutline:

- `customerFacingSafeDenyResponse.js` depends on the response envelope utility.
- `customerAccessContext.js` reuses the safe `requestReference` validator from
  the response envelope utility.
- `customerFacingProjectionDto.js` optionally checks the access context helper
  before returning a timeline or service report DTO.
- `customerFacingProjectionService.js` depends on access context and DTO
  utilities.

The skeletons do not depend on:

- controllers,
- routes,
- repositories,
- DB clients,
- migrations,
- config/env,
- provider SDKs,
- AI clients,
- notification services,
- audit persistence,
- browser/smoke infrastructure.

No reverse dependency from route/controller/runtime code into these helpers was
added in this branch because no runtime wiring exists yet.

## Safety Behavior Review

The reviewed skeletons preserve the intended fail-closed behavior:

- Unknown safe-deny category falls back to generic unavailable.
- Unknown verification state falls back to unavailable.
- Unknown surface type falls back to unavailable.
- Unknown projection scope falls back to none.
- Malformed access context fails closed before projection output.
- Non-verified access context forces projection scope to none.
- Timeline projection requires verified context and timeline-allowed scope.
- Service report projection requires verified context and service-report-allowed scope.
- `requestReference` uses a `reqref_...` customer-safe skeleton concept.
- `organizationScopeRef` and `channelScopeRef` use `scope_...` symbolic skeleton
  concepts.
- `messageKey` fallback avoids existence-leaking key patterns.
- `nextActions` remain channel-agnostic and reject hard-coded LINE action types.
- DTO/projection builders use allow-list mapping and do not pass through unknown
  source fields.
- Unavailable and verification-required projections do not include internal
  denial reasons.

## Forbidden Exposure Review

The skeletons are designed not to accept or output the following in customer
responses or projection DTOs:

- raw token or token hash,
- raw LINE id,
- raw provider payload,
- internal organization/customer/case/appointment/report ids,
- full phone,
- full address,
- audit reason,
- AI raw payload,
- internal denial reason,
- repository result raw object,
- billing/settlement internal rules,
- inventory internals,
- engineer internal comments,
- supervisor notes.

Task381 and Task383 include guardrail field-name filters as a defensive
skeleton. These filters are not a replacement for future projection allow-list
review, resolver authorization, data classification, or DTO contract tests.

## Runtime Wiring Review

Task380-384 currently have no:

- controller / route / API exposure,
- repository / DB access,
- env var / credential dependency,
- provider SDK / AI client import,
- audit/security event persistence,
- rate-limit runtime,
- notification sending,
- survey sending,
- customer portal runtime,
- smoke/API/DB/browser test execution.

The helpers are importable by future code, but no external request path can call
them today.

## Known Limitations

- The skeletons do not perform real resolver verification.
- The skeletons do not model DB-backed token or customer channel identity state.
- The skeletons do not include localization files.
- The skeletons do not write runtime audit/security events.
- The skeletons do not include unit test files because the repo does not yet show
  a clear unit test framework/convention for this utility layer.
- The success data sanitizer and DTO sanitizer are guardrail skeletons only.
  They do not replace future formal projection allow-list review.
- The `reqref_...` and `scope_...` formats are skeleton concepts, not a
  production reference generation strategy.
- Future runtime must still prove generic safe-deny behavior through targeted
  tests before any customer-facing route is exposed.

## Future Task Candidates

Allowed low-risk future candidates:

- Pure skeleton unit test convention review.
- Pure unit tests for Task380-384 utilities if a convention is approved.
- Response/envelope/safe-deny consistency documentation review.
- Additional pure helper skeleton only if PM explicitly scopes it.
- Pre-runtime review of customer-facing route/controller boundaries.

Blocked until explicit approval:

- DB / repository work.
- Migration020 dry-run or apply.
- Controller / route / API runtime.
- Customer-facing public route exposure.
- Token storage or channel identity verification runtime.
- Provider sending.
- Survey runtime.
- Audit/security event persistence runtime.
- Browser/API/DB/smoke execution against local/shared/prod runtime.

## Decision

Task380-384 still comply with the Task379 cutline.

The branch may continue with low-risk pure code skeleton review or docs closure.
It may also add pure unit tests only after a unit test convention is explicitly
approved. It must not proceed into DB/API/runtime/provider/smoke work without a
separate explicit approval and runtime boundary decision.

## Non-goals

Task385 does not:

- modify `src/`,
- modify `admin/src/`,
- add test code or smoke tests,
- add helper/service/repository/interface code,
- add controller/route/API runtime,
- modify localization files,
- modify scripts or smoke tests,
- add or modify migration/schema/index,
- execute DB/DDL/psql/`npm run db:migrate`/Migration020 dry-run/apply,
- touch shared/prod/Zeabur runtime,
- trigger LINE/SMS/Email/App/survey/AI provider sending,
- process real token, secret, customer personal data, raw LINE data, or raw
  provider payload.

## Verification Plan

For Task385 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw LINE data, raw provider payload, and production data.

API, DB, browser, and smoke tests should not be run for this docs-only review.

## Redaction Note

This document contains policy terms such as token, raw LINE id, phone, address,
provider payload, secret, and `DATABASE_URL` only as examples of data that must
not be exposed. It does not include credentials, database URLs, access tokens,
secrets, complete customer phone numbers, complete customer addresses, raw
channel identifiers, raw provider payloads, verification codes, or production
data details.
