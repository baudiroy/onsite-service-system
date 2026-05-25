# Task400 — Customer-Facing Forbidden Field Consolidation Closure Review / No Runtime Change

Task400 closes the customer-facing forbidden field constants consolidation
mini-branch from Task397-399. It is documentation-only.

This task does not add code, tests, package changes, runtime behavior, routes,
controllers, repositories, DB access, migrations, schema, indexes,
localization, provider sending, browser automation, or smoke tests.

## Current Baseline

- Task370-395 customer-facing branch closure and handoff are complete.
- Task396 pure utility consistency review is complete.
- Task397 forbidden field constants consolidation decision is complete.
- Task398 shared forbidden-field constants module is complete.
- Task399 shared constants module pure unit test is complete.
- Customer-facing runtime has not started.
- No controller, route, or API runtime exists.
- No repository, DB access, migration, schema, or index exists for this branch.
- No provider sending exists.
- No disposable local/test runtime confirmation exists.
- Migration020, survey runtime, shared/prod/Zeabur runtime, DB/DDL/psql, and
  `npm run db:migrate` remain paused.

## Closure Scope

Task400 only reviews and closes the Task397-399 consolidation mini-branch.

It does not:

- add code,
- add tests,
- modify `package.json`,
- authorize runtime,
- authorize DB/API/provider/smoke work,
- authorize customer-facing public endpoint work.

## Artifacts Reviewed

Decision document:

- `docs/task-397-customer-facing-forbidden-field-constants-consolidation-decision-no-runtime-change.md`

Supporting closure and consistency documents:

- `docs/task-396-customer-facing-pure-utility-consistency-review-no-runtime-change.md`
- `docs/task-394-customer-facing-pure-skeleton-branch-closure-next-phase-cutline-no-runtime-change.md`
- `docs/task-395-customer-facing-branch-post-closure-handoff-summary-no-runtime-change.md`

Code artifact:

- `src/utils/customerFacingForbiddenFields.js`

Updated utilities:

- `src/utils/customerFacingResponseEnvelope.js`
- `src/utils/customerFacingProjectionDto.js`

Test artifact:

- `tests/unit/utils/customer-facing/customerFacingForbiddenFields.test.js`

Existing regression tests:

- `tests/unit/utils/customer-facing/customerFacingResponseEnvelope.test.js`
- `tests/unit/utils/customer-facing/customerFacingProjectionDto.test.js`

## Consolidation Result

Task397 selected Option B: add a shared pure forbidden field-name constants
module without creating a shared sanitizer or wiring runtime.

Task398 implemented that decision:

- `src/utils/customerFacingForbiddenFields.js` now owns the shared forbidden
  field-name pattern list and pure helper.
- `src/utils/customerFacingResponseEnvelope.js` imports the shared helper.
- `src/utils/customerFacingProjectionDto.js` imports the shared helper.
- The response envelope utility keeps its own sanitizer behavior.
- The projection DTO utility keeps its own sanitizer behavior.
- This is policy vocabulary centralization, not a shared sanitizer refactor.

Preserved boundaries:

- Response envelope shape did not change.
- DTO shape did not change.
- Projection service did not change.
- Safe-deny helper did not change.
- Customer access context did not change.
- No controller, route, repository, provider, AI, notification, or DB runtime
  was added.

## Coverage Result

Task399 added focused pure unit coverage for the shared constants module:

- `CUSTOMER_FACING_FORBIDDEN_FIELD_NAME_PATTERNS` exists.
- The pattern list is frozen.
- `isCustomerFacingForbiddenFieldName` exists and is a function.
- Representative forbidden field names return true.
- Representative customer-safe display field names return false.
- Malformed values do not throw.
- The tests document that this helper classifies field names only.
- Unknown or malformed field names returning false does not authorize callers
  to echo unknown details.
- Caller utilities must continue using allow-listing and fail-closed projection
  behavior.

Existing regression tests continue to cover:

- response envelope sanitizer behavior,
- projection DTO sanitizer behavior,
- forbidden nested field omission,
- invalid reference omission,
- no raw source/detail pass-through in the tested pure utility paths.

## Safety Invariants Preserved

The consolidation preserves the customer-facing forbidden field policy:

- forbidden fields default deny,
- no arbitrary unknown detail pass-through,
- no internal ids,
- no raw token or token hash,
- no raw channel identity,
- no raw provider payload,
- no full contact or location fields,
- no audit reason,
- no internal denial reason,
- no AI raw payload,
- no billing/settlement internal rules,
- no inventory internals,
- no engineer internal comments,
- no supervisor notes,
- no debug/metadata/raw/source leakage,
- channel-agnostic policy, with LINE remaining one supported channel example
  rather than the hard-coded only channel.

## Remaining Limitations

This closure does not make the customer-facing branch runtime-ready.

Known limitations remain:

- The shared constants module is a guardrail skeleton, not a formal projection
  policy engine.
- Field-name filtering is not a substitute for a future resolver,
  authorization policy, customer-visible data classification, or route-level
  tests.
- Malformed or unknown field names returning false from the helper does not
  make unknown data safe to echo.
- Caller utilities must continue allow-listing output fields.
- No runtime resolver verification exists.
- No controller, route, or API exists.
- No DB-backed token or channel identity runtime exists.
- No localization runtime exists.
- No audit/security persistence exists.
- No rate-limit runtime exists.
- No provider integration exists.
- No customer-facing public endpoint exists.

## Future Task Candidates

Only these low-risk categories remain appropriate without explicit runtime
authorization:

- additional docs closure,
- optional pure utility naming cleanup review,
- optional one-file pure test refinement,
- optional future cutline decision review.

The following remain blocked and not authorized:

- DB/API/runtime/provider work,
- Migration020 dry-run or apply,
- controller/route/API implementation,
- repository-connected projection,
- token/channel identity runtime,
- audit/security event persistence,
- rate-limit runtime,
- provider sending,
- API/DB/browser/smoke tests,
- shared/prod/Zeabur runtime access.

If a future document mentions controller, route, API, DB, or migration work, it
must mark that work as blocked unless the user explicitly grants a new runtime
authorization packet with the required safety preconditions.

## Decision

Task397-399 customer-facing forbidden field constants consolidation mini-branch
can be considered closed.

Closure decision:

- Shared pure forbidden-field constants module: complete.
- Envelope/DTO duplicate forbidden field vocabulary: consolidated.
- Utility-specific sanitizer behavior: preserved.
- Focused constants helper test: complete.
- Existing envelope/DTO regression tests: still the required guardrail.
- No-runtime cutline: still active.
- DB/API/runtime/provider/smoke work: still blocked.

The next PM task should remain docs-only or low-risk pure utility/test
refinement unless the user explicitly authorizes a new runtime branch.

## Non-goals

Task400 does not:

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

For Task400 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw channel data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only closure.

## Redaction Note

This document contains policy terms such as token, secret, raw channel identity,
phone, mobile, address, provider payload, and `DATABASE_URL` only as examples of
data that must not be exposed. It does not include credentials, database URLs,
access tokens, secrets, complete customer phone numbers, complete customer
addresses, raw channel identifiers, raw provider payloads, verification codes,
or production data details.
