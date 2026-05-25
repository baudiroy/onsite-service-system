# Task396 — Customer-Facing Pure Utility Consistency Review / No Runtime Change

Task396 reviews the accepted customer-facing pure utilities and pure unit tests
for consistency. It is documentation-only.

This task does not modify code, tests, package configuration, runtime behavior,
routes, controllers, repositories, DB access, migrations, schema, indexes,
localization, provider sending, browser automation, or smoke tests.

## Current Baseline

- Task370-395 customer-facing branch closure and handoff are complete.
- Pure utilities exist but are not wired to runtime.
- Pure unit tests exist but do not imply runtime readiness.
- Customer-facing runtime has not started.
- No controller, route, or API runtime exists.
- No repository, DB access, migration, schema, or index exists for this branch.
- No provider sending exists.
- No disposable local/test runtime confirmation exists.
- Migration020, survey runtime, shared/prod/Zeabur runtime, DB/DDL/psql, and
  `npm run db:migrate` remain paused.

## Consistency Review Scope

This review checks naming, fail-closed behavior, forbidden field filtering,
request reference validation, scope reference validation, DTO/envelope/projection
boundaries, and test consistency.

It does not:

- change code,
- add tests,
- modify `package.json`,
- authorize runtime,
- evaluate DB/API integration readiness.

## Utility Consistency Matrix

| Utility | Purpose | Exported API | Fail-closed behavior | Forbidden input/output policy | Dependency direction | Test coverage | Cutline fit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Safe-deny helper | Maps symbolic denial/unavailable categories to generic customer-safe unavailable responses. | `CUSTOMER_FACING_SAFE_DENY_CATEGORIES`, `buildCustomerFacingSafeDenyResponse` | Unknown category falls back to generic unavailable. Rate limit extras only appear for rate-limited responses. | Does not echo caller details; delegates envelope sanitization. | Depends only on response envelope utility. | `customerFacingSafeDenyResponse.test.js` | Fits Task394/395 no-runtime cutline. |
| Response envelope utility | Builds success/unavailable response envelope shapes and validates request references. | `CUSTOMER_FACING_RESPONSE_STATUS`, `buildCustomerFacingSuccessEnvelope`, `buildCustomerFacingUnavailableEnvelope`, `isCustomerSafeRequestReference` | Unsafe message keys fallback to generic safe keys. Invalid request references are omitted. Invalid retry hints are omitted. | Sanitizes forbidden fields from data, display hints, and next actions; filters channel-specific next action types. | Lowest shared utility layer; no runtime imports. | `customerFacingResponseEnvelope.test.js` | Fits Task394/395 no-runtime cutline. |
| Customer access context utility | Creates internal customer access context skeleton for future resolver output. | `CUSTOMER_ACCESS_VERIFICATION_STATE`, `CUSTOMER_ACCESS_SURFACE_TYPE`, `CUSTOMER_ACCESS_PROJECTION_SCOPE`, `buildCustomerAccessContext`, `isVerifiedCustomerAccessContext` | Unknown state/surface/scope normalize to unavailable/none. Non-verified context gets projection scope none. | Only accepts safe `reqref_...` and symbolic `scope_...` refs; does not include DTO/envelope data. | Depends only on response envelope request reference validator. | `customerAccessContext.test.js` | Fits Task394/395 no-runtime cutline. |
| Projection DTO utility | Builds allow-listed customer-facing timeline, service report, and unavailable DTOs. | `CUSTOMER_FACING_DTO_TYPE`, `buildCustomerTimelineProjectionDto`, `buildCustomerServiceReportProjectionDto`, `buildCustomerUnavailableProjectionDto` | Missing, malformed, or non-verified access context returns unavailable for timeline/service report DTOs. | Allow-list output only; recursively removes forbidden field names. | Depends only on access context verification. | `customerFacingProjectionDto.test.js` | Fits Task394/395 no-runtime cutline. |
| Projection service pure skeleton | Maps already-authorized and already-sanitized source concepts to DTO builders. | `buildTimelineProjection`, `buildServiceReportProjection`, `buildAccessUnavailableProjection`, `buildVerificationRequiredProjection` | Missing, malformed, non-verified, or wrong-scope context returns unavailable. | Maps only configured source fields and relies on DTO sanitizer for nested forbidden fields. | Depends on access context and DTO utilities only. | `customerFacingProjectionService.test.js` | Fits Task394/395 no-runtime cutline. |

## Naming and Category Consistency

Current naming remains consistent with the cutline:

- Category names are symbolic and customer-safe.
- Status values are generic: `ok`, `unavailable`, `verification_required`, and
  `rate_limited`.
- DTO types are generic: `timeline`, `service_report`, and `unavailable`.
- Projection scopes are generic and channel-agnostic.
- Request references use a symbolic `reqref_...` shape.
- Scope references use symbolic `scope_...` shapes.
- No exported API hard-codes LINE as the only channel.
- Message key names stay under customer-facing generic families and avoid
  existence-leaking names.

Future risk to watch: some forbidden field-name patterns exist in both response
envelope and DTO utility layers. That duplication is acceptable for a skeleton,
but a future pure utility consistency task may consider a shared constants
review if it can be done without widening runtime scope.

## Validation Consistency

| Validation item | Current behavior | Consistency decision |
| --- | --- | --- |
| `reqref_...` requestReference | Accepted only by response envelope validator and reused by access context. Invalid refs are omitted. | Consistent. |
| `scope_...` symbolic refs | Accepted only in access context when matching the safe scope pattern. Invalid refs are omitted. | Consistent. |
| Unknown safe-deny category | Falls back to generic unavailable. | Consistent. |
| Unknown access state/surface/scope | Normalizes to unavailable or none. | Consistent. |
| Missing/malformed access context | DTO/projection paths fail closed to unavailable. | Consistent after Task391 hardening. |
| Invalid retry hints | Omitted unless positive integer on rate-limited envelope. | Consistent. |

No code change is needed from this review.

## Forbidden Field Consistency

The current utilities and tests consistently treat the following as forbidden
customer-facing output:

- raw token or token hash,
- raw LINE id,
- raw provider payload,
- internal organization id,
- customer id,
- case id,
- appointment id,
- report id,
- full phone,
- full mobile,
- full address,
- audit reason,
- AI raw payload,
- internal denial reason,
- billing/settlement internal rules,
- inventory internals,
- engineer internal comments,
- supervisor notes.

The tests use fake values for these field categories to prove omission. They do
not include real tokens, credentials, raw channel ids, complete customer data, or
production data.

Future risk to watch: forbidden-field filtering is a guardrail skeleton. It is
not a replacement for a future formal projection policy engine, resolver
authorization, customer-visible data classification, or route/controller tests.

## Boundary Consistency

Current boundaries remain consistent:

- DTO utility does not build response envelopes.
- Projection service does not build final response envelopes.
- Projection service does not expand `accessContext.allowedProjectionScope`.
- Safe-deny and envelope utilities do not expose raw internal denial reasons.
- Access context does not contain customer-facing DTO data.
- Controller, route, API, resolver runtime, token runtime, localization runtime,
  audit persistence, rate-limit runtime, provider sending, and DB integration do
  not exist for this branch.

Future runtime must preserve:

```text
resolver -> customerAccessContext -> projection -> envelope / safe-deny
```

## Test Consistency

Task388-392 tests remain consistent with Task387:

- fake/synthetic data only,
- one utility per file,
- direct one-file `node --test` execution,
- no package script,
- no test framework or dependency,
- no DB/API/provider/env imports,
- no browser/smoke execution,
- no shared/prod/Zeabur runtime access.

This Task396 review does not add or execute new unit tests.

## Future Task Recommendations

Allowed future candidates only if PM explicitly scopes one:

- Optional pure utility naming cleanup task.
- Optional forbidden-field constants consolidation review.
- Optional one-file pure test refinement for one specific utility.
- Additional docs closure.

Blocked and not authorized as direct next steps:

- DB/API/runtime/provider work.
- Migration020 dry-run or apply.
- Controller / route / API implementation.
- Repository-connected projection.
- Token/channel identity runtime.
- Audit/security event persistence.
- Rate-limit runtime.
- Provider sending.
- API/DB/browser/smoke tests.

## Decision

The current pure utilities and pure tests are consistent enough for the
Task394/Task395 no-runtime cutline.

They preserve:

- fail-closed behavior,
- no existence leakage,
- customer-safe symbolic references,
- forbidden field default deny,
- channel-agnostic response/action naming,
- DTO/envelope/projection separation,
- no DB/API/provider/smoke boundary crossing.

Next work should remain docs-only or low-risk pure utility/test refinement.
DB/API/runtime/provider/smoke work remains blocked until a future explicit
authorization and the necessary disposable local/test runtime confirmation.

## Non-goals

Task396 does not:

- modify `src/`,
- modify `admin/src/`,
- add test code,
- add smoke tests,
- modify `package.json`,
- add a test framework or dependency,
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

For Task396 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw LINE data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only review.

## Redaction Note

This document contains policy terms such as token, secret, raw LINE id, phone,
mobile, address, provider payload, and `DATABASE_URL` only as examples of data
that must not be exposed. It does not include credentials, database URLs, access
tokens, secrets, complete customer phone numbers, complete customer addresses,
raw channel identifiers, raw provider payloads, verification codes, or
production data details.
