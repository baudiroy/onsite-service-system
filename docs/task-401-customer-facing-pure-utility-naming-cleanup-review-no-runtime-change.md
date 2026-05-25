# Task401 — Customer-Facing Pure Utility Naming Cleanup Review / No Runtime Change

Task401 reviews naming consistency across the customer-facing pure utilities,
tests, and closure documents. It is documentation-only.

This task does not add code, tests, package changes, runtime behavior, routes,
controllers, repositories, DB access, migrations, schema, indexes,
localization, provider sending, browser automation, or smoke tests.

## Current Baseline

- Task370-395 customer-facing branch closure and handoff are complete.
- Task396 pure utility consistency review is complete.
- Task397-400 forbidden field consolidation mini-branch is closed.
- Pure utilities and pure unit tests exist but are not wired to runtime.
- Customer-facing runtime has not started.
- No controller, route, or API runtime exists.
- No repository, DB access, migration, schema, or index exists for this branch.
- No provider sending exists.
- No disposable local/test runtime confirmation exists.
- Migration020, survey runtime, shared/prod/Zeabur runtime, DB/DDL/psql, and
  `npm run db:migrate` remain paused.

## Review Scope

Task401 only reviews naming.

It does not:

- change code,
- add tests,
- modify `package.json`,
- authorize runtime,
- evaluate DB/API integration readiness.

The review checks whether current names remain:

- clear about their pure utility purpose,
- customer-safe,
- channel-agnostic,
- unlikely to leak resource existence,
- unlikely to be confused with route/controller/API/runtime behavior.

## Naming Inventory

| Area | Current naming | Purpose clarity | Customer-facing safety | Channel-agnostic | Existence-leakage risk | Cleanup needed |
| --- | --- | --- | --- | --- | --- | --- |
| Safe-deny | `customerFacingSafeDenyResponse`, `CUSTOMER_FACING_SAFE_DENY_CATEGORIES`, `buildCustomerFacingSafeDenyResponse` | Clear: builds customer-safe deny/unavailable response shapes. | Good: categories are symbolic and messages are generic. | Good: no channel is the only supported path. | Low: category names do not disclose whether a specific resource exists. | No immediate cleanup. |
| Response envelope | `customerFacingResponseEnvelope`, `CUSTOMER_FACING_RESPONSE_STATUS`, `buildCustomerFacingSuccessEnvelope`, `buildCustomerFacingUnavailableEnvelope` | Clear: envelope builder, not controller/runtime. | Good: message key fallback and sanitizer preserve generic output. | Good: channel-specific next action filtering remains generic. | Low: forbidden message key parts block obvious existence-leaking names. | No immediate cleanup. |
| Access context | `customerAccessContext`, `CUSTOMER_ACCESS_VERIFICATION_STATE`, `CUSTOMER_ACCESS_SURFACE_TYPE`, `CUSTOMER_ACCESS_PROJECTION_SCOPE`, `buildCustomerAccessContext`, `isVerifiedCustomerAccessContext` | Clear enough: internal resolver output skeleton. | Good if kept internal; not a customer DTO. | Good: uses channel scope refs but not a single channel. | Medium if internal states such as `abuse_suspected` or `unsupported_channel` are ever surfaced directly. | No immediate cleanup; future runtime must map states to safe customer messages. |
| Projection DTO | `customerFacingProjectionDto`, `CUSTOMER_FACING_DTO_TYPE`, `buildCustomerTimelineProjectionDto`, `buildCustomerServiceReportProjectionDto`, `buildCustomerUnavailableProjectionDto` | Clear: DTO builder for customer-facing projection output. | Good: allow-listed fields and sanitizer keep output narrow. | Good: no LINE-only naming. | Low: DTO types do not disclose missing resource details. | No immediate cleanup. |
| Projection service | `customerFacingProjectionService`, `buildTimelineProjection`, `buildServiceReportProjection`, `buildAccessUnavailableProjection`, `buildVerificationRequiredProjection` | Mostly clear, but `Service` could be mistaken for runtime service by future contributors. | Good: still pure skeleton mapping already-authorized source concepts. | Good: no channel-specific names. | Low if kept pure; risk rises only if future code treats it as runtime resolver. | Future-only optional naming clarification may be useful; no immediate code rename. |
| Forbidden fields | `customerFacingForbiddenFields`, `CUSTOMER_FACING_FORBIDDEN_FIELD_NAME_PATTERNS`, `isCustomerFacingForbiddenFieldName` | Clear: shared field-name vocabulary guardrail. | Good: helper name does not imply full sanitizer/policy engine. | Good: includes channel examples without making one channel the model. | Low: helper classifies names only and does not reveal existence. | No immediate cleanup. |

## Message Key, Category, and Status Naming Review

Safe-deny categories:

- `generic_unavailable`
- `verification_required`
- `verification_failed`
- `link_unavailable`
- `rate_limited`
- `try_again_later`
- `contact_support`

These names are acceptable for the current pure baseline. They are generic,
customer-safe, and do not reveal whether a specific organization, customer,
case, appointment, report, token, or channel binding exists.

Response statuses:

- `ok`
- `unavailable`
- `verification_required`
- `rate_limited`

These are acceptable because they describe response posture without revealing
internal denial reasons.

Message key family:

- `customerAccess.available`
- `customerAccess.genericUnavailable`
- `customerAccess.verificationRequired`
- `customerAccess.verificationFailed`
- `customerAccess.linkUnavailable`
- `customerAccess.rateLimited`
- `customerAccess.tryAgainLater`

These are acceptable for the skeleton. `linkUnavailable` is intentionally
generic and must not be expanded in future runtime into exact reasons such as
expired, revoked, already used, wrong user, wrong case, disabled organization,
or resource missing.

Access states:

- `verified`
- `verification_required`
- `verification_failed`
- `unavailable`
- `rate_limited`
- `abuse_suspected`
- `unsupported_channel`

These are internal access context states. They are acceptable only while they
remain internal and are mapped to generic customer-facing responses. Future
runtime must not expose `abuse_suspected`, exact unsupported channel reasons, or
similar internal enforcement details to the customer.

Surface and projection scope names:

- `timeline`
- `service_report`
- `access_verification`
- `unavailable`
- `none`
- `timeline_and_service_report`

These are acceptable. They describe allowed projection surfaces without
confirming resource existence.

DTO type names:

- `timeline`
- `service_report`
- `unavailable`

These are acceptable because they describe the projection type and do not expose
missing-resource reasons.

## File and Module Naming Review

Current file names are consistent with the pure utility baseline:

- `customerFacingSafeDenyResponse.js`
- `customerFacingResponseEnvelope.js`
- `customerAccessContext.js`
- `customerFacingProjectionDto.js`
- `customerFacingProjectionService.js`
- `customerFacingForbiddenFields.js`

The only future naming risk is `customerFacingProjectionService.js`. The word
`Service` may be interpreted by a future developer as an application service
that can perform DB access, authorization, or runtime orchestration. In the
current branch it is explicitly a pure projection skeleton and must remain
runtime-free.

No rename is required now. A future docs or pure code cleanup task may consider
a clearer name such as `customerFacingProjectionMapper` or
`customerFacingProjectionBuilder`, but that would be a separate explicit task
and must include import/test updates only. It must not become runtime wiring.

## Test Naming Review

Current test file names match the Task387 convention:

- `customerFacingSafeDenyResponse.test.js`
- `customerFacingResponseEnvelope.test.js`
- `customerAccessContext.test.js`
- `customerFacingProjectionDto.test.js`
- `customerFacingProjectionService.test.js`
- `customerFacingForbiddenFields.test.js`

The test names clearly emphasize pure behavior:

- known categories return safe response shapes,
- unknown categories fall back,
- invalid references are omitted,
- unsafe details do not pass through,
- missing or malformed context fails closed,
- forbidden fields are omitted,
- response envelope fields and raw source pass-through are absent,
- malformed forbidden field names do not throw.

The tests use fake/synthetic data. Task401 does not add or execute new unit
test commands.

## Naming Risks and Future Cleanup Candidates

No immediate cleanup is required.

Future-only candidates:

- Consider renaming `customerFacingProjectionService.js` if future contributors
  repeatedly confuse it with a runtime service.
- Consider adding a short module-level comment in that file to state it is a
  pure projection skeleton, if a future pure code cleanup task is authorized.
- Consider keeping `abuse_suspected` and `unsupported_channel` explicitly
  documented as internal-only access states if runtime work ever begins.
- Consider a future message key naming review before localization/runtime is
  authorized, especially to ensure exact link/token/channel failure reasons
  never become customer-visible.

These are future candidates only. They do not authorize code changes in
Task401.

## Decision

Current naming is sufficient for the no-runtime pure utility baseline.

Decision summary:

- Utility names are generally clear and customer-facing safe.
- Category, status, message key, state, scope, and DTO names remain
  channel-agnostic.
- Current names do not directly reveal resource existence.
- No immediate cleanup is required.
- Any future cleanup must be a separately scoped low-risk docs or pure
  utility/test task.
- DB/API/runtime/provider/smoke work remains blocked.

## Non-goals

Task401 does not:

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
- process real token, secret, customer personal data, raw channel data, or raw
  provider payload.

## Verification Plan

For Task401 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw channel data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only review.

## Redaction Note

This document contains policy terms such as token, secret, raw channel identity,
phone, mobile, address, provider payload, and `DATABASE_URL` only as examples of
data that must not be exposed. It does not include credentials, database URLs,
access tokens, secrets, complete customer phone numbers, complete customer
addresses, raw channel identifiers, raw provider payloads, verification codes,
or production data details.
