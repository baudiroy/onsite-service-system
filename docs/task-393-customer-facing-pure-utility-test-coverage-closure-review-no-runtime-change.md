# Task393 — Customer-Facing Pure Utility Test Coverage Closure Review / No Runtime Change

Task393 reviews the Task388-392 pure unit test baseline for the Task380-384
customer-facing utility skeletons. It is documentation-only.

This task does not add code, tests, runtime behavior, routes, controllers,
repositories, DB access, migrations, schema, indexes, provider sending, browser
automation, smoke tests, or package changes.

## Current Baseline

- Task380-384 completed the customer-facing pure utility skeletons.
- Task388-392 added one-file Node built-in pure unit tests for those skeletons.
- Customer-facing runtime has not started.
- No customer-facing controller, route, or API runtime exists.
- No repository, DB access, migration, schema, or index has been added for this
  customer-facing branch.
- No provider sending exists.
- No disposable local/test runtime confirmation exists for API/DB/browser/smoke
  testing.
- Migration020, survey runtime, shared/prod/Zeabur runtime, DB/DDL/psql, and
  `npm run db:migrate` remain paused.

## Test Inventory

| Task | Test file | Covered utility | Runtime status |
| --- | --- | --- | --- |
| Task388 | `tests/unit/utils/customer-facing/customerFacingSafeDenyResponse.test.js` | `src/utils/customerFacingSafeDenyResponse.js` | Pure unit test only; no runtime. |
| Task389 | `tests/unit/utils/customer-facing/customerFacingResponseEnvelope.test.js` | `src/utils/customerFacingResponseEnvelope.js` | Pure unit test only; no runtime. |
| Task390 | `tests/unit/utils/customer-facing/customerAccessContext.test.js` | `src/utils/customerAccessContext.js` | Pure unit test only; no runtime. |
| Task391 | `tests/unit/utils/customer-facing/customerFacingProjectionDto.test.js` | `src/utils/customerFacingProjectionDto.js` | Pure unit test only; no runtime. |
| Task392 | `tests/unit/utils/customer-facing/customerFacingProjectionService.test.js` | `src/utils/customerFacingProjectionService.js` | Pure unit test only; no runtime. |

All tests use Node's built-in `node:test` and `node:assert/strict`. They use
fake/synthetic data only and are executed as one-file commands, not as a new
package script.

## Coverage Matrix

| Safety behavior | Coverage status | Evidence |
| --- | --- | --- |
| Known category / success path | Covered | Task388 covers known safe-deny categories. Task389 covers success/unavailable envelopes. Task392 covers timeline and service report projection success paths. |
| Unknown / malformed input fail-closed | Covered | Task388 covers unknown category fallback. Task390 covers unknown access state/surface/scope. Task391 covers missing/malformed/non-verified DTO access context. Task392 covers missing/malformed/non-verified projection access context. |
| Request reference validation | Covered | Task388 covers `reqref_...` behavior. Task389 covers shared request reference validation. Task390 covers requestReference in access context. |
| Scope ref validation | Covered | Task390 covers sanitized `scope_...` refs and rejects unsafe scope refs. |
| MessageKey safety | Covered | Task388 and Task389 cover safe messageKey fallback behavior. |
| Channel-agnostic nextActions | Covered | Task388 covers safe-deny nextActions. Task389 covers envelope nextActions sanitization. |
| DTO allowlist | Covered | Task391 covers timeline/service report DTO allowlisted output. |
| Forbidden field filtering | Covered | Task389, Task391, and Task392 cover unknown and forbidden field omission, including nested fake fields. |
| Non-verified access denied | Covered | Task390 forces non-verified projection scope to none. Task391 and Task392 return unavailable DTOs for non-verified context. |
| Projection scope allow / deny | Covered | Task392 covers timeline scope, service report scope, combined scope, and cross-scope denial. |
| Unavailable DTO minimal shape | Covered | Task391 and Task392 cover minimal unavailable output without internal reason or ids. |
| No response envelope in DTO/projection service | Covered | Task391 and Task392 cover absence of response envelope fields in DTO/projection output. |
| No arbitrary detail pass-through | Covered | Task388, Task389, Task391, and Task392 cover no arbitrary `details`, metadata, raw, source, or forbidden field pass-through. |
| Localization runtime | Future gap | Tests cover message key shape only. No localization files or runtime lookup exist in this branch. |
| Runtime resolver verification | Future gap | Access contexts are fake/synthetic. No DB-backed resolver or token verification runtime exists. |
| Audit/security event persistence | Future gap | No persistence runtime exists. Tests do not write audit/security events. |
| Rate-limit runtime | Future gap | Safe envelope behavior is covered; no runtime counter, abuse guard, or storage exists. |
| Controller / route / API behavior | Future gap | No customer-facing route/controller/API exists. Tests intentionally do not hit API. |

## Production Hardening From Tests

Task389 found that the response envelope sanitizer could allow fields with an
`internal...` naming pattern to pass through. The implementation was minimally
hardened by adding the `internal` field-name pattern to the forbidden filter.
This change only tightened a pure utility sanitizer and did not add runtime
wiring, DB access, API behavior, provider sending, package dependencies, or
external exposure.

Task391 found that DTO builders could ignore missing or malformed
`accessContext` input instead of failing closed. The implementation was minimally
hardened so timeline and service report DTO builders now require an explicit
verified access context. Missing, malformed, or non-verified access contexts now
return an unavailable DTO. This change only tightened pure utility behavior and
did not add runtime wiring, DB access, API behavior, provider sending, package
dependencies, or external exposure.

## Remaining Gaps

The following gaps remain intentionally open and must not be implemented in this
Task393 review:

- No runtime resolver verification.
- No DB-backed token state.
- No DB-backed customer channel identity state.
- No localization tests.
- No controller boundary tests.
- No route/API tests.
- No repository/DB integration tests.
- No audit/security event persistence tests.
- No rate-limit runtime tests.
- No provider sending tests.
- No API/DB/browser/smoke tests.
- No shared/prod/Zeabur runtime verification.

These gaps are future-only or blocked. They require explicit PM/user scoping and
the appropriate runtime boundary decision before work starts.

## Guardrail Review

- Tests use fake/synthetic data only.
- `package.json` remains unchanged.
- No test framework or dependency was added.
- No DB/API/browser/smoke tests were introduced.
- No provider, AI, notification, survey, LINE, SMS, Email, or App sending was
  introduced.
- No real token, secret, customer personal data, raw LINE id, raw provider
  payload, or production/customer data was used.
- The customer-facing utility skeletons remain channel-agnostic and do not
  hard-code LINE as the only channel.
- The utilities remain pure and side-effect-free.

## Future Task Recommendations

Allowed future candidates, if PM explicitly scopes them:

- Pure utility consistency refactor review.
- Customer-facing pure skeleton closure summary.
- Optional additional pure test for one specific utility if a concrete gap is
  identified.
- Documentation-only runtime readiness review for future resolver/controller
  planning.

Blocked as direct next steps without explicit runtime approval:

- DB / DDL / migration work.
- Migration020 dry-run or apply.
- Customer-facing routes/controllers/API runtime.
- Repository-connected projection service runtime.
- Token storage or channel identity verification runtime.
- Audit/security event persistence runtime.
- Rate-limit runtime.
- Provider sending.
- Survey runtime.
- API/DB/browser/smoke tests.
- Shared/prod/Zeabur runtime access.

## Decision

Task380-384 now have a basic pure unit coverage baseline:

- safe-deny helper,
- response envelope utility,
- customer access context utility,
- projection DTO utility,
- projection service pure skeleton.

The pure skeleton + pure unit test baseline can be considered closed for the
current low-risk code-only branch.

This closure does not authorize DB/API/runtime/provider/smoke work. The project
must not proceed into customer-facing runtime, DB, routes/controllers, provider
sending, or API/DB/browser/smoke testing unless a future task grants explicit
scope and disposable local/test runtime confirmation where required.

## Non-goals

Task393 does not:

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

For Task393 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw LINE data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only review.

## Redaction Note

This document contains policy terms such as token, secret, raw LINE id, phone,
address, provider payload, and `DATABASE_URL` only as examples of data that must
not be exposed. It does not include credentials, database URLs, access tokens,
secrets, complete customer phone numbers, complete customer addresses, raw
channel identifiers, raw provider payloads, verification codes, or production
data details.
