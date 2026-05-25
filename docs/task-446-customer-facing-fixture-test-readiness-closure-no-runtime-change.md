# Task446 - Customer-Facing Fixture/Test Readiness Closure / No Runtime Change

Task446 closes the Task444-Task445 fixture/test readiness mini-branch for the
customer-facing access surface.

This task is documentation-only. It does not authorize runtime work, fixture
creation, test creation, test execution, API/browser/smoke coverage, DB access,
repository access, migration work, provider sending, AI/RAG work, or any
customer-facing runtime spike.

## Purpose

The purpose of Task446 is to consolidate the accepted fixture/test readiness
position after Task444 and Task445.

Task446 records:

- Task444 defined future synthetic fixture and minimal test design principles.
- Task445 defined the explicit authorization conditions required before any
  fixture/test implementation can begin.
- Current fixture/test implementation status remains `NO-GO`.
- No fixture, test, runtime, API, DB, browser, smoke, provider, AI, RAG, or
  migration work is approved by this closure.

## Non-Authorization Statement

Task446 is not runtime approval.

Task446 does not authorize:

- local-only runtime spike,
- backend `src/` changes,
- admin `src/` changes,
- fixture creation,
- fixture modification,
- test creation,
- test modification,
- test execution,
- API tests,
- browser tests,
- smoke tests,
- DB access,
- repository access,
- DDL,
- migration,
- shared/prod/Zeabur access,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider,
- RAG,
- vector DB,
- customer-facing endpoint implementation.

Task446 only closes the fixture/test readiness review and preserves the
authorization gate defined in Task445.

## Relationship to Task444-Task445

Task444 defined the future synthetic fixture and minimal unit/contract test
specification for the customer-facing skeleton chain.

Task444 confirmed:

- fixtures must be synthetic only,
- production data is forbidden,
- real token/secret values are forbidden,
- full phone/address values are forbidden,
- raw channel ids are forbidden,
- raw provider payloads are forbidden,
- tests should remain pure unit / contract level unless separately authorized,
- DB/network/provider/AI/browser/API/smoke work is not authorized.

Task445 defined the fixture/test implementation authorization spec.

Task445 confirmed:

- PM must ask explicit fixture/test authorization questions before
  implementation,
- unclear authorization means `NO-GO`,
- any conditional approval applies only to the next named single task,
- allowed file paths and commands must be named,
- production data, secrets, DB access, provider sending, AI/RAG/vector DB,
  API/browser/smoke tests, and broad test rewrites remain forbidden unless
  separately authorized.

Task446 closes that mini-branch without changing the status from `NO-GO`.

## Mandatory Future Customer-Facing Flow

Any future authorized fixture/test work must preserve this chain:

```text
request
-> route/controller
-> resolver
-> customerAccessContext
-> projection DTO / projection service
-> response envelope or generic safe-deny
```

Future implementation must not invert, weaken, bypass, or collapse these
boundaries.

## Task444-445 Fixture/Test Readiness Summary

The accepted fixture/test readiness posture is:

- Task444 defines what future fixtures/tests should prove.
- Task445 defines when fixture/test implementation may start.
- Task446 confirms implementation has not started.
- Fixture/test status remains `NO-GO`.
- PM must obtain explicit user authorization before any next fixture/test task.

The future test scope, if later authorized, should remain minimal and focused on
the boundary contracts of the customer-facing skeleton chain.

## Current Status: NO-GO

Current fixture/test implementation status is `NO-GO`.

`NO-GO` means:

- no synthetic fixtures may be created,
- no tests may be created,
- no tests may be modified,
- no test command may be run,
- no fixture generator may be run,
- no API/browser/smoke coverage may be added,
- no DB/repository access may be used,
- no provider sending may be triggered,
- no AI/RAG/vector DB work may be started.

This status remains in effect unless the user explicitly authorizes the next
single fixture/test task using the Task445 authorization prompt or equivalent
clear scope.

## Why Fixture/Test Implementation Remains Not Authorized

Fixture/test implementation remains not authorized because the user has not yet
provided a fixture/test implementation approval packet that names:

- whether fixtures are authorized,
- whether tests are authorized,
- whether existing tests may be modified,
- the exact files that may be created or changed,
- the exact commands that may be run,
- confirmation that all fixture data is synthetic,
- confirmation that production data is forbidden,
- confirmation that real token/secret values are forbidden,
- confirmation that full phone/address values are forbidden,
- confirmation that raw channel ids and raw provider payloads are forbidden,
- confirmation that DB/repository access is prohibited,
- confirmation that provider sending is prohibited,
- confirmation that AI/RAG/vector DB is prohibited,
- confirmation that API/browser/smoke tests remain prohibited unless separately
  named.

Without that packet, implementation must not begin.

## Accepted Future Fixture Principles

If future fixture creation is explicitly authorized, fixtures must be:

- synthetic,
- minimal,
- purpose-built,
- tenant-safe,
- non-sensitive,
- free of production data,
- free of real token/secret values,
- free of complete phone/address values,
- free of raw channel ids,
- free of raw provider payloads,
- free of raw internal payloads,
- small enough for easy review.

Fixtures must preserve:

- token/link is not customer identity,
- `line_user_id` is not global identity,
- same-organization and cross-organization boundaries,
- entitlement-denied boundaries,
- safe-deny equivalence,
- unknown field default deny,
- forbidden field default deny.

## Accepted Future Test Principles

If future tests are explicitly authorized, tests must verify:

- controller does not bypass resolver,
- resolver does not bypass customerAccessContext,
- projection does not bypass customerAccessContext,
- envelope does not bypass projection,
- safe-deny does not leak resource existence,
- response equivalence is preserved,
- projection is allow-list first,
- unknown fields default to deny,
- forbidden fields default to deny,
- token/link is not customer identity,
- `line_user_id` is not global identity,
- raw internal data is never output,
- no Case mutation,
- no Appointment mutation,
- no Field Service Report mutation,
- no complaint mutation,
- no billing mutation,
- no settlement mutation,
- no identity mutation,
- no token/link mutation,
- no audit mutation,
- no DB access,
- no repository access,
- no provider sending,
- no AI provider call,
- no RAG call,
- no vector DB call.

Tests should remain pure unit / contract tests unless a separate task explicitly
authorizes API/browser/smoke coverage.

## Fixture/Test Authorization Readiness

Task445 provides the accepted future authorization path.

PM may ask the user to choose one scoped option:

- continue docs-only,
- authorize synthetic fixtures only,
- authorize minimal unit/contract tests only,
- authorize synthetic fixtures and minimal unit/contract tests,
- pause the customer-facing fixture/test branch.

Any authorization must list exact files and exact commands. Broad statements
such as "continue", "go ahead", or "do the next step" are not enough to start
fixture/test implementation.

## What Remains Unimplemented

The following remain unimplemented:

- customer-facing fixtures,
- customer-facing tests,
- fixture generator,
- test generator,
- route/controller runtime,
- resolver runtime,
- customerAccessContext runtime,
- projection service runtime,
- response envelope runtime,
- generic safe-deny runtime,
- API endpoint,
- browser coverage,
- smoke coverage,
- DB/repository integration,
- provider sending,
- AI/RAG/vector DB integration.

These are not failures. They are intentionally blocked until explicit future
authorization is provided.

## Required Evidence Before Any Fixture/Test Implementation

Before any future fixture/test implementation, PM/Codex must record:

- authorization option selected,
- exact file scope,
- exact command scope,
- synthetic-only fixture statement,
- no-production-data statement,
- no-secret statement,
- no-full-phone/address statement,
- no-raw-channel-id statement,
- no-raw-provider-payload statement,
- no DB/repository access statement,
- no provider sending statement,
- no AI/RAG/vector DB statement,
- API/browser/smoke boundary statement,
- expected verification commands,
- expected sensitive scan pattern,
- stop condition if any scope is unclear.

## Next PM Decision Options

The next PM decision options are:

1. Stay docs-only and continue readiness design.
2. Ask the user for explicit synthetic fixture-only authorization.
3. Ask the user for explicit minimal unit/contract test-only authorization.
4. Ask the user for explicit synthetic fixture and minimal unit/contract test
   authorization.
5. Pause the customer-facing fixture/test branch.

Until the user chooses an authorized implementation option with exact scope,
the branch remains `NO-GO`.

## Security / Privacy / Organization Isolation Boundaries

Future fixture/test work must preserve:

- organization isolation,
- tenant isolation,
- customer visible data policy,
- internal data policy,
- field-level redaction expectations,
- safe-deny equivalence,
- no resource existence leakage,
- no sensitive output,
- no production data,
- no raw provider payload,
- no secrets,
- no full customer identifiers.

No fixture/test work may use shared/prod/Zeabur data.

## Customer Channel Identity Boundary Notes

Future fixture/test work must preserve:

- token/link possession is not customer identity,
- channel identity must be scoped,
- `line_user_id` is not a global identity,
- customer-facing access must not depend on raw LINE id exposure,
- LINE must not be hard-coded into the core access chain,
- other future customer channels must remain compatible.

Fixture/test data must not contain raw LINE user ids or raw provider payloads.

## SaaS / Entitlement / Usage Boundary Notes

Future fixture/test work must preserve:

- entitlement and permission are separate concepts,
- organization feature entitlement does not bypass user permission,
- subscription or entitlement failure must not leak resource existence,
- usage tracking is not implemented in this branch,
- SaaS billing/runtime is not implemented in this branch,
- fixture/test work must not create plan, entitlement, usage, billing, or
  subscription runtime.

## Explicit Non-goals

Task446 does not:

- implement fixtures,
- implement tests,
- implement customer-facing runtime,
- implement route/controller code,
- implement resolver code,
- implement access-context code,
- implement projection code,
- implement envelope code,
- implement safe-deny code,
- add API routes,
- run API/browser/smoke tests,
- touch DB,
- touch repository integration,
- add migration,
- apply migration,
- dry-run migration,
- send notifications,
- call providers,
- call AI,
- call RAG,
- call vector DB,
- change Admin UI,
- change backend runtime behavior.

## Verification Plan

Task446 verification should remain documentation-safe:

- run `git diff --check`,
- run a sensitive scan against this document,
- run `npm run check`,
- run `npm run admin:check`.

Task446 should not run:

- DB command,
- migration command,
- API test,
- browser test,
- smoke test,
- fixture generation,
- test generation,
- provider command,
- AI/RAG command.

## Completion Report Checklist

Task446 completion reporting should include:

- changed files,
- confirmation that only one documentation file changed,
- confirmation that backend `src/` was not touched,
- confirmation that admin `src/` was not touched,
- confirmation that no migration was added,
- confirmation that API was not changed,
- confirmation that smoke tests were not changed,
- confirmation that package files were not changed,
- confirmation that fixture/test implementation status remains `NO-GO`,
- confirmation that no runtime, DB, provider, AI/RAG, or browser/smoke work was
  performed,
- `git diff --check` result,
- sensitive scan result,
- `npm run check` result,
- `npm run admin:check` result.
