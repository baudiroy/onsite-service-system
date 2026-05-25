# Task387 — Customer-Facing Pure Unit Test Convention Decision / No Runtime Change

Task387 records the future unit test convention decision for the Task380-384
customer-facing pure utility skeletons. It is documentation-only. It does not
add tests, modify `package.json`, add a framework, change code, or run new test
commands.

## Current Baseline

- Task380-384 pure skeleton files are complete.
- Task385 confirmed the skeletons comply with the Task379 cutline.
- Task386 confirmed the repo does not currently have a clear backend
  `src/utils/*` unit test convention.
- Customer-facing runtime has not started.
- No controller, route, or API runtime exists for these skeletons.
- No DB, repository, migration, schema, or index changes exist for this branch.
- No provider sending exists.
- No disposable local/test runtime confirmation exists.
- Migration020, survey runtime, shared/prod/Zeabur runtime, DB/DDL/psql, and
  `npm run db:migrate` remain paused.

## Decision Scope

Task387 only decides a future pure unit test convention.

It does not:

- add tests,
- modify `package.json`,
- add Jest, Vitest, Mocha, or any dependency,
- run a new unit test command,
- change runtime behavior,
- create a test pipeline.

## Chosen Future Test Location

Chosen proposal:

```text
tests/unit/utils/customer-facing/*.test.js
```

Rationale:

- Keeps pure unit tests separate from `scripts/smoke/`, which is runtime/API
  oriented.
- Keeps tests outside `src/` so production source directories do not accumulate
  test-only files unless the project later chooses that style.
- Makes the customer-facing utility scope explicit.
- Keeps future test imports focused on pure utility modules.
- Avoids mixing unit tests with browser, API, DB, or smoke tests.

Alternative not chosen for now:

```text
src/utils/__tests__/*.test.js
```

Reason: colocated tests may be acceptable later, but this repo does not yet use
that convention. A separate `tests/unit/...` tree is clearer for a first minimal
convention.

## Chosen Future Execution Style

Chosen proposal:

- Use Node's built-in `node:test` module for the first pure utility test file.
- Execute the first test directly with a one-file command during the future
  task, for example:

```text
node --test tests/unit/utils/customer-facing/customerFacingSafeDenyResponse.test.js
```

This is only a future proposal. Task387 does not create the file or run the
command.

Package script status:

- Do not modify `package.json` for the first pure utility test.
- Do not add a new framework or dependency.
- Consider a package script only after the first one-file test pattern is proven
  and explicitly approved.

## Fixture / Data Convention

Future tests must use fake/synthetic data only.

Allowed fake examples:

- `reqref_fake_123`
- `scope_fakeTenant`
- `Fake Service Title`
- `Customer-safe status text`
- `Fake appointment window`

Forbidden data:

- real token or token hash,
- raw LINE id,
- raw provider payload,
- real customer name,
- real phone,
- real address,
- production organization/customer/case/appointment/report ids,
- credentials,
- `DATABASE_URL`,
- env secrets,
- AI raw payload,
- shared/prod/Zeabur data.

## Allowed Assertion Categories

Future tests may cover:

| Utility area | Allowed assertions | Runtime boundary |
| --- | --- | --- |
| Safe-deny helper | Known category output and unknown category fallback. | No DB/API/provider/env. |
| Response envelope | Safe messageKey fallback and no arbitrary detail pass-through. | No DB/API/provider/env. |
| Request reference validation | Valid fake `reqref_...` accepted, unsafe values omitted. | No DB/API/provider/env. |
| Access context | Unknown state/surface/scope fail closed. | No DB/API/provider/env. |
| DTO utility | Allow-list output and forbidden field filtering. | No DB/API/provider/env. |
| Projection service | Verified + scope allowed returns DTO; denied scope returns unavailable. | No DB/API/provider/env. |

## Forbidden Test Boundaries

Future pure unit tests must not:

- connect to DB,
- import repositories,
- import controllers/routes/API runtime,
- run browser tests,
- run smoke tests,
- call provider SDKs,
- call AI providers,
- read env secrets,
- execute migrations/schema/DDL,
- write audit/security persistence,
- send notifications,
- touch shared/prod/Zeabur runtime,
- make external network requests.

## Future First Test Task Recommendation

If Task387 is accepted and PM wants a code task, the next future code task may
be a single pure unit test file only after explicit approval.

Recommended first utility under test:

```text
src/utils/customerFacingSafeDenyResponse.js
```

Reason:

- It is the smallest customer-facing helper.
- It has clear fail-closed behavior.
- It can be tested with fake category strings and fake `reqref_...` values.
- It does not require DB/API/provider/runtime setup.

Alternative first target:

```text
src/utils/customerFacingResponseEnvelope.js
```

This is also low risk but has broader sanitizer behavior, so it is better as a
second test after the safe-deny helper pattern is proven.

The first test task must not test all utilities at once.

## Decision Output

- Chosen future test location: `tests/unit/utils/customer-facing/*.test.js`
- Chosen future execution style: direct one-file `node --test ...` command using
  Node's built-in test runner.
- `package.json` status: unchanged for Task387 and should remain unchanged for
  the first one-file test unless explicitly approved.
- Recommended first utility under test:
  `src/utils/customerFacingSafeDenyResponse.js`
- Blocked scopes: DB, API, route/controller, repository, provider, AI provider,
  migration/schema/DDL, smoke/browser, shared/prod/Zeabur runtime.

Task387 does not claim tests have been added or enabled.

## Non-goals

Task387 does not:

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

For Task387 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw LINE data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only decision.

## Redaction Note

This document contains policy terms such as token, raw LINE id, phone, address,
provider payload, secret, and `DATABASE_URL` only as examples of data that must
not be exposed. It does not include credentials, database URLs, access tokens,
secrets, complete customer phone numbers, complete customer addresses, raw
channel identifiers, raw provider payloads, verification codes, or production
data details.
