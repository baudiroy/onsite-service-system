# Task386 — Customer-Facing Pure Skeleton Unit Test Convention Review / No Runtime Change

Task386 reviews whether the repository currently has a clear unit test
convention suitable for the Task380-384 pure customer-facing utility skeletons.
It is documentation-only. It does not add tests, modify package scripts, add a
test framework, change code, or run API/DB/browser/smoke tests.

## Current Baseline

- Task380-384 pure skeleton files are complete.
- Task385 confirmed the skeletons still comply with the Task379 cutline.
- No unit tests have been added for Task380-384.
- Customer-facing runtime has not started.
- No controller, route, or API runtime exists for these skeletons.
- No DB, repository, migration, schema, or index changes exist for this branch.
- No provider sending exists.
- No disposable local/test runtime confirmation exists.
- Migration020, survey runtime, shared/prod/Zeabur runtime, DB/DDL/psql, and
  `npm run db:migrate` remain paused.

## Existing Test Convention Review

Observed package scripts:

- Root `npm run check` runs syntax checks over `src/**/*.js` using `node --check`.
- Root smoke scripts exist for API/browser/runtime flows, such as smoke 027e,
  028, 029, 046, 047, and 071 browser.
- `npm run admin:check` delegates to the Admin TypeScript check.
- Admin `npm run check` runs `tsc --noEmit`.

Observed repository structure:

- No `test/`, `tests/`, or `__tests__/` directory was found.
- No clear `*.test.js` or `*.spec.js` convention was found.
- No Jest/Vitest/Mocha package script was observed.
- Existing smoke scripts define local `test(...)` helpers, but they are
  runtime/API/browser-oriented scripts, not a reusable unit test convention for
  pure `src/utils/*` helpers.

Decision: the repo does not currently have a clear unit test convention for
pure backend utility modules. Future work should not add a new test framework
or package as a side effect of a customer-facing skeleton task.

## Future Unit Test Scope For Task380-384

If a unit test convention is explicitly approved later, future tests should be
pure, single-purpose, and fake-data only.

| Candidate | Fake input only | No DB/API/provider/runtime | Expected safety assertion |
| --- | --- | --- | --- |
| Safe-deny known category output | Yes | Yes | Known category returns safe status/messageKey/actions. |
| Safe-deny unknown category fallback | Yes | Yes | Unknown category returns generic unavailable. |
| Envelope messageKey fallback | Yes | Yes | Unsafe key patterns fall back to safe keys. |
| Request reference validation | Yes | Yes | Only `reqref_...` skeleton references are accepted. |
| Access context unknown state/scope | Yes | Yes | Unknown state/surface/scope fail closed. |
| DTO allow-list behavior | Yes | Yes | Unknown fields are not included in output. |
| DTO forbidden field filtering | Yes | Yes | Nested unsafe field names are dropped. |
| Projection verified + scope allowed | Yes | Yes | Timeline/report DTO is returned only for matching scope. |
| Projection scope denied | Yes | Yes | Projection fails closed to unavailable DTO. |
| Projection malformed context | Yes | Yes | Malformed context fails closed without throwing sensitive details. |

## Forbidden Test Data

Future tests must not use:

- real token or token hash,
- raw LINE id,
- raw provider payload,
- real customer name,
- real phone,
- real address,
- organization/customer/case/appointment/report ids from real data,
- credentials,
- `DATABASE_URL`,
- env secrets,
- AI raw payload,
- production/shared/Zeabur data.

Synthetic examples may use clearly fake placeholders, such as:

- `reqref_example123`,
- `scope_exampleTenant`,
- `Fake Service Title`,
- `Customer-safe status text`.

## Forbidden Test Behavior

Future tests must not add or execute:

- DB tests,
- repository tests,
- API/controller/route tests,
- browser tests,
- smoke tests,
- provider integration tests,
- AI provider tests,
- migration/schema/DDL tests,
- external network requests,
- tests that touch shared/prod/Zeabur runtime.

Future test work must not:

- modify `package.json` unless a separate explicit convention task approves it,
- add a test framework or dependency as a hidden side effect,
- import controller/route/DB/repository/provider/config/env modules,
- use real customer/channel/provider data.

## Recommended Future Test File Boundary

Because no clear unit test convention exists today, Task386 does not recommend
writing tests immediately.

Recommended next step, if the PM wants tests:

1. Run a dedicated test convention decision task.
2. Decide whether to use Node's built-in test runner or another existing
   project-approved pattern.
3. Add only one minimal pure utility test file first.
4. Use fake/synthetic inputs only.
5. Keep tests limited to `src/utils/customer-facing` style pure utilities.

Possible future file pattern, proposal only:

- `tests/unit/utils/customerFacingSafeDenyResponse.test.js`, or
- `src/utils/__tests__/customerFacingSafeDenyResponse.test.js`.

No such file is created by Task386.

## Assertion Checklist

Future pure unit tests should assert:

- no forbidden fields in output,
- unknown inputs fail closed,
- arbitrary detail is not passed through,
- message keys do not reveal resource existence or internal state,
- next actions are not LINE-only,
- non-verified access context cannot project timeline or service report data,
- projection scope cannot be expanded by the projection service,
- unavailable DTO does not contain internal reason or ids,
- response envelopes do not echo caller-provided raw details,
- customer-facing output remains channel-agnostic.

## Decision

Current decision: do not proceed directly into unit test implementation until a
minimal test convention is explicitly chosen.

If a future test task is approved, it should be limited to one pure utility, one
test file, fake data only, and no package/framework change unless that change is
explicitly scoped.

The branch must not proceed into DB/API/runtime/provider/smoke work as the next
step.

## Non-goals

Task386 does not:

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

For Task386 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw LINE data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only review.

## Redaction Note

This document contains policy terms such as token, raw LINE id, phone, address,
provider payload, secret, and `DATABASE_URL` only as examples of data that must
not be exposed. It does not include credentials, database URLs, access tokens,
secrets, complete customer phone numbers, complete customer addresses, raw
channel identifiers, raw provider payloads, verification codes, or production
data details.
