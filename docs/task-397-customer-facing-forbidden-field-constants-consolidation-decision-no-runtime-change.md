# Task397 — Customer-Facing Forbidden Field Constants Consolidation Decision / No Runtime Change

Task397 decides the future direction for consolidating customer-facing forbidden
field-name patterns. It is documentation-only.

This task does not add code, tests, package changes, runtime behavior, routes,
controllers, repositories, DB access, migrations, schema, indexes, localization,
provider sending, browser automation, or smoke tests.

## Current Baseline

- Task370-395 customer-facing branch closure and handoff are complete.
- Task396 consistency review is complete.
- Forbidden field-name pattern duplication exists between the response envelope
  sanitizer and the projection DTO sanitizer.
- Pure utilities exist but are not wired to runtime.
- Customer-facing runtime has not started.
- No controller, route, or API runtime exists.
- No repository, DB access, migration, schema, or index exists for this branch.
- No provider sending exists.
- No disposable local/test runtime confirmation exists.
- Migration020, survey runtime, shared/prod/Zeabur runtime, DB/DDL/psql, and
  `npm run db:migrate` remain paused.

## Decision Scope

Task397 only decides the future consolidation direction.

It does not:

- add code,
- add tests,
- modify `package.json`,
- authorize runtime,
- authorize DB/API/provider/smoke work.

## Problem Statement

The response envelope utility and projection DTO utility both maintain
forbidden field-name patterns to keep unsafe data out of customer-facing output.
This duplicated local policy is acceptable for the current pure skeleton phase,
but it carries future drift risk:

- Envelope sanitizer and DTO sanitizer may gradually diverge.
- Adding a forbidden field pattern may update one layer but miss the other.
- Tests can catch part of the drift, but tests are not a replacement for shared
  policy consistency.
- Future projection/controller work could rely on inconsistent sanitizer
  behavior if the policy remains duplicated for too long.

Current risk is controlled because the utilities are pure, not wired to runtime,
and covered by Task388-392 pure unit tests.

## Consolidation Options

| Option | Description | Benefits | Risks | Allowed scope | Forbidden expansion | Test impact | Fit as next low-risk task |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Option A | Keep duplicated local constants and manage drift through docs/tests. | No code movement; lowest immediate churn. | Drift remains likely as future fields are added. | Docs-only review and targeted tests. | No runtime or DB expansion. | Existing tests continue; may need duplicated assertions. | Acceptable if pausing, but weaker long-term. |
| Option B | Add a shared pure constants module for forbidden field parts and reuse it from envelope and DTO utilities. | Reduces drift while preserving each utility's own sanitizer behavior. | Requires a small pure code refactor; module naming must stay channel-agnostic. | Pure constants/helper file only; no runtime wiring. | No DB, route, controller, provider, env, AI, package, or smoke expansion. | Existing tests should continue; optional focused pure test for constants shape. | Good next low-risk pure code candidate. |
| Option C | Add a shared pure sanitizer helper used by both envelope and DTO utilities. | Strongest consistency; one sanitizer implementation. | Larger refactor; may accidentally couple envelope and DTO behavior before formal projection policy is ready. | Pure helper only if tightly scoped. | No runtime, DB, API, provider, env, package, or smoke expansion. | Existing tests must continue; may need broader one-file pure test. | Possible later, but slightly larger than needed now. |

## Recommended Decision

Chosen option: Option B — add a shared pure constants module in a future task.

Rationale:

- It addresses the drift risk identified in Task396.
- It keeps the refactor smaller than a shared sanitizer implementation.
- It preserves utility-specific sanitizer behavior while centralizing the
  forbidden field policy vocabulary.
- It can be done as a low-risk pure code consolidation task without DB/API
  runtime work.

Option C should wait until the project has a clearer formal projection policy
engine. Option A is acceptable if the branch pauses, but it leaves the known
drift risk in place.

Task397 does not perform this consolidation. It only records the decision.

## Allowed Future Implementation Cutline

If PM authorizes a future consolidation code task, it may only:

- add a pure module such as `src/utils/customerFacingForbiddenFields.js`,
- move shared forbidden field-name parts into that module,
- update `customerFacingResponseEnvelope.js` and
  `customerFacingProjectionDto.js` to import the shared constants/helper,
- keep all existing pure utility behavior unchanged except for policy
  centralization,
- update existing pure unit tests if needed,
- optionally add one focused pure unit test using fake/synthetic data only.

The future task must not:

- add DB/repository access,
- add route/controller/API runtime,
- add provider or AI calls,
- read env or credentials,
- modify `package.json`,
- add a test framework or dependency,
- run smoke/API/DB/browser tests,
- use real data,
- change customer-facing runtime behavior,
- authorize provider sending.

## Required Future Tests If Code Consolidation Happens

At minimum, a future code consolidation task should run:

- `node --check` on any added/modified pure utility files,
- the existing response envelope pure unit test,
- the existing projection DTO pure unit test,
- `git diff --check`,
- `npm run check`,
- `npm run admin:check`,
- sensitive scan on added/modified files.

If a new pure constants test is added, it must be one file, use Node built-ins,
use fake/synthetic data only, and avoid DB/API/provider/env imports.

## Safety Invariants

Any future consolidation must preserve:

- forbidden fields default deny,
- no internal ids,
- no raw token or token hash,
- no raw LINE id,
- no raw provider payload,
- no full phone,
- no full mobile,
- no full address,
- no audit reason,
- no internal denial reason,
- no AI raw payload,
- no billing/settlement internal rules,
- no inventory internals,
- no engineer internal comments,
- no supervisor notes,
- no arbitrary unknown detail pass-through,
- no existence leakage.

## Decision Output

- Chosen option: Option B, future shared pure forbidden-field constants module.
- Task397 does not implement consolidation.
- A future Task398-style task may be a low-risk pure code consolidation only if
  PM explicitly assigns it.
- Required tests for that future task must include existing envelope and DTO
  pure unit tests.
- DB/API/runtime/provider/smoke work remains blocked.

## Blocked Scopes

The following remain blocked:

- DB / DDL / migration / Migration020 dry-run or apply.
- Repository access.
- Route / controller / API runtime.
- Real resolver verification runtime.
- Token storage runtime.
- DB-backed customer channel identity runtime.
- Audit/security event persistence.
- Rate-limit / abuse runtime.
- Localization runtime.
- Provider sending.
- LINE / SMS / Email / App / survey sending.
- AI provider / RAG / vector DB runtime.
- File/photo/signature/document storage runtime.
- Billing/settlement/inventory runtime.
- API/DB/browser/smoke tests.
- Shared/prod/Zeabur runtime.

## Non-goals

Task397 does not:

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

For Task397 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw LINE data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only decision.

## Redaction Note

This document contains policy terms such as token, secret, raw LINE id, phone,
mobile, address, provider payload, and `DATABASE_URL` only as examples of data
that must not be exposed. It does not include credentials, database URLs, access
tokens, secrets, complete customer phone numbers, complete customer addresses,
raw channel identifiers, raw provider payloads, verification codes, or
production data details.
