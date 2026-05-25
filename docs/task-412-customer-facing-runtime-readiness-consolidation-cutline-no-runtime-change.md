# Task412 — Customer-Facing Runtime Readiness Consolidation Cutline / No Runtime Change

Task412 consolidates the Task403-411 customer-facing runtime readiness
proposals into a no-runtime cutline. It answers what is conceptually ready,
what is still missing, and which conditions must be satisfied before any future
customer-facing runtime branch begins.

This task is documentation-only. It is a consolidation cutline, not a runtime
kickoff.

This task does not add code, tests, smoke tests, localization files, message
catalogs, routes, controllers, resolvers, repositories, DB access, migrations,
schema, indexes, provider sending, AI runtime, browser/API tests, or customer
facing runtime.

## Current Accepted Scope

Task412 follows the Task370-411 customer-facing no-runtime baseline.

Task403-411 accepted proposals:

- Task403: customer-facing runtime entry gate decision packet.
- Task404: customer-facing route/controller contract proposal.
- Task405: customer-facing resolver contract proposal.
- Task406: customer channel identity persistence proposal.
- Task407: customer-facing token/link lifecycle proposal.
- Task408: customer-facing audit/security event model proposal.
- Task409: customer-facing audit/security event permission matrix proposal.
- Task410: customer-facing generic safe-deny localization/message key proposal.
- Task411: customer-facing safe-deny test matrix proposal.

Task412 consolidates these documents only. It does not authorize:

- runtime implementation,
- API implementation,
- DB/schema/migration/index work,
- localization runtime,
- audit/security event persistence,
- token/link persistence,
- customer channel identity persistence,
- provider sending,
- AI/RAG runtime,
- tests or smoke tests.

## What Is Ready Conceptually

The following boundaries are conceptually defined enough to guide a future
implementation branch after explicit authorization.

### Route / Controller Orchestration Boundary

Future customer-facing route/controller work should:

- remain thin,
- build a customer access context,
- call the resolver,
- use projection helpers for customer-visible output,
- return generic safe-deny responses,
- avoid mapping internal denial reasons directly to external message keys,
- avoid exposing raw internal records.

Route/controller design is conceptually ready, but not implemented.

### Resolver Access Decision Boundary

Future resolver work should own customer-facing access decisions.

It should consider:

- token/link scope,
- channel identity scope,
- organization scope,
- customer visible data policy,
- consent / verification state,
- resource authorization,
- route family purpose,
- safe-deny outcome.

Resolver design is conceptually ready, but not implemented.

### Channel-Agnostic Identity Principles

Future customer identity should remain channel-agnostic.

Principles:

- LINE is a major current channel, not the only channel.
- `line_user_id` is not a global identity.
- Identity must be scoped by organization and channel.
- SMS, Web Link, App, Email, LINE, and future phone-assisted flows should fit
  the same customer access model.
- Customer-facing output must not expose raw channel identifiers.

The principle is ready, but persistence is not implemented.

### Scoped Token / Link Lifecycle Principles

Future token/link access should be scoped and purpose-bound.

Principles:

- token/link is not customer identity,
- token/link does not replace resolver authorization,
- tokens should be purpose-scoped, resource-scoped, organization-scoped, and
  time-bound,
- token states must not be customer-visible,
- expired/revoked/malformed/missing/wrong-purpose tokens should collapse to
  generic safe-deny.

The lifecycle concept is ready, but persistence is not implemented.

### Generic Safe-Deny and No-Existence-Leakage Policy

Future external denial behavior is conceptually defined:

- denial messages must be generic,
- status codes and response shapes must not leak internal cause,
- redirects, headers, retry hints, next-action wording, and timing must be
  reviewed for leakage,
- internal categories may exist for audit/security only,
- customer-visible text must not reveal token, resource, identity, consent, or
  binding state.

The policy is ready, but runtime and localization catalogs are not implemented.

### Customer-Visible Data Policy

Future customer-facing responses should be projections, not raw internal
records.

Customer-facing output must exclude:

- internal note,
- audit log,
- AI raw payload,
- raw provider payload,
- billing internal data,
- settlement internal data,
- engineer internal comments,
- supervisor review,
- vendor reconciliation rules,
- raw token,
- raw channel id,
- complete phone number,
- complete address.

The policy is ready, but route/runtime projection is not implemented.

### Audit / Security Event Candidate Model

Future audit/security events have a conceptual model:

- internal-only,
- safe/minimal,
- permission-controlled,
- scoped by organization,
- never used directly as customer-facing message keys,
- not exposed to customer-facing output,
- not available to AI as raw full text.

The model is ready, but no table, write path, query path, or runtime exists.

### Permission Matrix Proposal

Future audit/security event and customer-facing operational access should follow
Data Access Control.

The permission matrix concept covers:

- support,
- supervisor,
- admin,
- security/audit,
- AI,
- reporting/export,
- scheduled reports.

The concept is ready, but permission runtime is not implemented.

### Future Test Matrix Acceptance Criteria

Future tests have conceptual acceptance criteria for:

- token denial cases,
- resource denial cases,
- channel identity denial cases,
- consent/verification cases,
- response equivalence,
- route family coverage,
- channel coverage,
- customer-visible forbidden-field assertions,
- audit/permission/AI assertions,
- future test layering.

The matrix is ready, but no tests are implemented by Task412.

## What Is Still Not Implemented

The following items remain not implemented:

- no real customer verification,
- no token/link persistence,
- no customer channel identity persistence,
- no resolver runtime,
- no API route/controller,
- no DB schema/table/index,
- no audit/security event persistence,
- no rate-limit / abuse runtime,
- no localization/message catalog runtime,
- no provider sending,
- no integration tests,
- no smoke tests,
- no browser tests,
- no API tests,
- no customer-facing UI,
- no customer-facing service report delivery,
- no survey/customer feedback runtime,
- no support fallback workflow runtime,
- no issue/follow-up runtime,
- no customer-facing notification runtime.

The current branch remains a design and proposal branch only.

## Runtime Authorization Still Missing

Before any customer-facing runtime branch can begin, the following explicit
authorization is still missing:

- explicit user approval to start runtime implementation,
- confirmation of a disposable local/test runtime when runtime verification is
  needed,
- confirmation that shared/prod/Zeabur are not targets,
- permission to run API commands if needed,
- permission to run browser commands if needed,
- permission to run smoke tests if needed,
- permission to access a local/test DB if needed,
- a separate DB/DDL/migration authorization packet for any schema work.

Important boundaries:

- Migration020 remains paused.
- Survey runtime remains paused.
- No DB/DDL/migration dry-run or apply is authorized by this cutline.
- General phrases such as continue, go ahead, or do the next task do not count
  as DB/DDL/migration/runtime authorization.

## Mandatory Future Runtime Sequence

The following is a future-only sequence. Each item needs explicit approval and
does not happen in Task412.

1. Local-only runtime authorization checkpoint.
2. Route/controller skeleton proposal or implementation task.
3. Resolver skeleton proposal or implementation task.
4. Token/link lifecycle schema proposal.
5. Customer channel identity schema proposal.
6. Audit/security event schema proposal.
7. Rate-limit / abuse proposal.
8. Localization/message catalog implementation proposal.
9. Local-only integration test plan.

Each future step must restate:

- whether it is docs-only or runtime,
- whether it touches `src/`,
- whether it touches `admin/src/`,
- whether it touches tests/smoke,
- whether it touches localization catalogs,
- whether it touches DB/migration/schema/index,
- whether it runs API/DB/browser/smoke commands,
- whether it touches provider sending or AI runtime,
- whether shared/prod/Zeabur are out of scope.

## Hard Blockers Before Runtime

Runtime must not start until these blockers are explicitly resolved.

Architecture blockers:

- Controller must not bypass resolver.
- Resolver must not bypass customerAccessContext.
- Projection must not receive raw internal data without an allow-list boundary.
- Token/link must not be treated as customer identity.
- Token/link must not replace resolver authorization.
- Customer channel identity must not be LINE-only.
- `line_user_id` must not be treated as global identity.
- LINE must not be hard-coded as the only customer channel.

Security and privacy blockers:

- External denial must remain generic.
- Internal denial reason must not become customer message key.
- Customer-facing output must not contain internal note, audit log, AI raw
  payload, raw provider payload, billing/settlement internal data, engineer
  internal comments, supervisor review, vendor reconciliation rules, raw token,
  raw channel id, complete phone number, or complete address.
- Future audit/security events must be internal-only and permission-controlled.
- AI must not read raw audit/security event full text.
- AI must not decide block/unblock/revoke/reissue/merge/unlink/case close or
  complaint close.

Product invariant blockers:

- One Case equals one formal Field Service Report must remain unchanged.
- Multiple appointments / visits per Case remain allowed.
- Customer-facing access must not create appointment-level formal reports.
- finalAppointmentId must remain backend/system-determined and stable after
  completion.
- Survey/feedback link must not equal full service report access.
- Issue/follow-up link must not equal full case access.

Operational blockers:

- No shared/prod/Zeabur runtime access without explicit authorization.
- No provider sending without separate explicit authorization.
- No DB/DDL/migration work without separate explicit authorization.
- No smoke/browser/API/integration tests without explicit runtime/test
  authorization.

## Recommended Next Options

These are options only. Task412 does not choose runtime automatically.

1. Pause and await explicit customer-facing runtime authorization.
2. Continue docs-only with a rate-limit / abuse proposal.
3. Continue docs-only with a support fallback workflow proposal.
4. Continue docs-only with a local-only runtime authorization checklist.
5. Continue docs-only with a localization/message catalog implementation
   checklist.
6. Continue docs-only with a customer-facing projection allow-list checklist.

No option should be interpreted as approval to implement runtime, DB, API,
provider sending, AI runtime, or tests.

## Explicit Non-goals

Task412 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify test files,
- add or modify smoke tests,
- run smoke/browser/API/DB tests,
- modify `package.json`,
- modify localization files or message catalogs,
- implement localization runtime,
- implement message key catalog runtime,
- implement API / route / controller runtime,
- implement resolver runtime,
- implement permission runtime,
- implement audit/security event tables,
- implement audit/security event query runtime,
- implement repository access,
- add DB access,
- add or modify migration/schema/index,
- execute DB/DDL/psql/`npm run db:migrate`/Migration020 dry-run/apply,
- touch shared/prod/Zeabur runtime,
- add audit write / log runtime / worker,
- trigger LINE/SMS/Email/App/survey/provider sending,
- call AI provider, RAG, vector DB, prompt, worker, or model runtime,
- add file/photo/signature/document storage runtime,
- add billing/settlement/inventory runtime,
- process real token, secret, customer personal data, raw channel data, or raw
  provider payload.

## Decision

Task412 records a customer-facing runtime readiness consolidation cutline only.

Decision summary:

- Task403-411 establish a coherent conceptual package.
- The package is not runtime-ready without explicit authorization.
- Runtime, DB/schema, localization, token/link persistence, customer channel
  identity persistence, audit persistence, tests, provider sending, and AI
  runtime remain blocked.
- Future runtime must start with an explicit local-only authorization
  checkpoint, not by implication.

## Verification Plan

For Task412 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw channel data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only cutline.

## Redaction Note

This document contains policy terms such as token, secret, raw channel id,
phone, address, provider payload, `DATABASE_URL`, `line_user_id`, and Zeabur
only as examples of data or runtime boundaries that must not be exposed or
touched without authorization. It does not include credentials, database URLs,
access tokens, secrets, complete customer phone numbers, complete customer
addresses, raw channel identifiers, raw provider payloads, verification codes,
or production data details.
