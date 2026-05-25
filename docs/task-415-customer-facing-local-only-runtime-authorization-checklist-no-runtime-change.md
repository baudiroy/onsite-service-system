# Task415 — Customer-Facing Local-Only Runtime Authorization Checklist / No Runtime Change

Task415 defines the authorization checklist required before any future
customer-facing local-only runtime spike can be planned or started.

This task is documentation-only. It is not runtime implementation, not a
runtime kickoff, and not approval to write API, DB, route/controller, resolver,
repository, migration, localization, provider, AI, browser, smoke, or
integration test code.

## Current Baseline

Task415 follows the Task370-414 customer-facing no-runtime baseline.

Already accepted:

- Customer-facing pure utilities.
- Pure utility unit tests.
- Runtime entry gate decision packet.
- Route/controller contract proposal.
- Resolver contract proposal.
- Customer channel identity persistence proposal.
- Token/link lifecycle proposal.
- Audit/security event model proposal.
- Audit/security event permission matrix proposal.
- Generic safe-deny localization/message key proposal.
- Safe-deny test matrix proposal.
- Runtime readiness consolidation cutline.
- Rate-limit / abuse protection proposal.
- Support fallback workflow proposal.

Current state remains:

- no customer-facing runtime,
- no route/controller/API implementation,
- no resolver runtime,
- no repository runtime,
- no DB/schema/migration/index,
- no token/link persistence,
- no customer channel identity persistence,
- no audit/security event persistence,
- no support workflow runtime,
- no link reissue runtime,
- no rate-limit middleware,
- no localization/message catalog runtime,
- no provider sending,
- no AI / RAG / vector DB runtime,
- no smoke/browser/API/integration tests,
- no shared/prod/Zeabur runtime access.

Task415 is an authorization checklist. It is not runtime implementation.

## Required Explicit Authorization Statements

Before any future local-only customer-facing runtime spike begins, the user must
explicitly confirm all applicable boundaries.

Required statements:

- Local-only runtime spike is allowed.
- Shared/prod/Zeabur are not targets.
- A disposable local/test environment is the target.
- Whether API route skeleton is allowed.
- Whether resolver skeleton is allowed.
- Whether local test-only fixtures are allowed.
- Whether API tests are allowed.
- Whether browser tests are allowed.
- Whether smoke tests are allowed.
- Whether DB tests are allowed.
- Whether DB / DDL / migration work is allowed.
- If DB / DDL / migration work is needed, it requires a separate explicit
  authorization packet.

General phrases such as:

- continue,
- go ahead,
- next task,
- keep developing,
- do the next 20 tasks,
- proceed,
- ok,

do not count as authorization for runtime, DB, DDL, migration, provider
sending, AI provider, or shared/prod/Zeabur access.

## Environment Safety Checklist

Before a future local-only runtime spike, these must be confirmed.

Required environment safety conditions:

- No production data.
- No shared/prod/Zeabur DB.
- No printed `DATABASE_URL`.
- No printed secrets.
- No printed tokens.
- No printed LINE channel secrets.
- No printed webhook secrets.
- No printed access tokens.
- No LINE sending.
- No SMS sending.
- No Email sending.
- No App push sending.
- No survey sending.
- No AI provider call.
- No RAG runtime.
- No vector DB runtime.
- No complete phone numbers.
- No complete addresses.
- No raw channel id.
- No raw provider payload.
- No customer personal data in command output, logs, tests, or reports.

If any item is unclear, the workflow must fail closed and remain docs-only.

## Runtime Scope Decision Checklist

A future local-only runtime spike must decide its exact scope before starting.

Each item below requires explicit future approval:

| Runtime scope decision | Future approval required? | Notes |
| --- | --- | --- |
| Route/controller only | Yes | Must not bypass resolver. |
| Resolver skeleton only | Yes | Must use symbolic customerAccessContext. |
| Pure in-memory fixtures only | Yes | Synthetic data only. |
| No DB mode | Yes | Preferred first spike shape if runtime is ever approved. |
| DB-backed mode | Yes, plus separate DB/DDL/migration boundary if schema is needed | Must not target shared/prod/Zeabur. |
| API tests | Yes | Local-only only. |
| Browser tests | Yes | Local-only only. |
| Smoke tests | Yes | Local-only only. |
| Localization/message catalog | Yes | Separate approval if implementation is needed. |
| Audit/security event candidate only | Yes | No persistence unless separately approved. |
| Audit/security event persistence | Yes, plus schema approval | Not included in a minimal no-DB spike. |
| Rate-limit middleware | Yes | Not included unless separately approved. |
| Provider sending | Yes | Excluded by default. |
| AI provider / RAG | Yes | Excluded by default. |

No runtime scope is implied by Task415.

## Hard Blockers

Hard blockers before runtime:

- Runtime cannot start before disposable local/test runtime is confirmed.
- DB / DDL / migration cannot start before separate DB authorization.
- Table / schema / index creation cannot start before separate schema approval.
- Provider sending cannot start before explicit provider sending approval.
- LINE / SMS / Email / App / survey sending cannot start before explicit
  sending approval.
- AI provider / RAG / vector DB cannot be touched before explicit AI/runtime
  authorization.
- Formal customer/case/report data cannot be queried before organization
  isolation and customer visible data policy are defined for the runtime.
- `line_user_id` cannot be used as global identity.
- Controller cannot directly query protected resources without resolver.
- Resolver cannot bypass customerAccessContext.
- Token/link cannot become customer identity.
- Token/link cannot replace resolver authorization.
- Customer-facing report cannot be output before projection policy exists.
- Customer-facing output cannot include internal note, audit log, AI raw
  payload, raw provider payload, billing/settlement internal data, raw token,
  raw channel id, complete phone number, or complete address.

If any hard blocker is unresolved, runtime remains blocked.

## Allowed Future Local-Only Spike Shape

The following is a possible future option only. It is not authorized by Task415.

A minimal safe local-only spike could be:

- no DB,
- no provider sending,
- no AI provider,
- no RAG,
- no vector DB,
- no real customer data,
- no production-like data,
- in-memory synthetic fixtures only,
- route/controller skeleton calls resolver stub,
- resolver stub creates symbolic access context,
- projection uses existing pure utilities,
- response uses existing envelope / safe-deny utilities,
- all sensitive denial cases collapse to generic output,
- no customer-facing raw internal data,
- no persistent audit/security event writes.

Even this minimal spike requires explicit future approval before implementation.

## Still Excluded Unless Separately Approved

The following remain excluded from any local-only spike unless separately
authorized:

- DB schema,
- migration,
- Migration020 dry-run/apply,
- customer channel identity persistence,
- token persistence,
- audit/security event persistence,
- repository DB access,
- rate-limit middleware,
- abuse detection runtime,
- provider sending,
- LINE sending,
- SMS sending,
- Email sending,
- App push sending,
- survey sending,
- AI provider,
- RAG,
- vector DB,
- production-like data,
- real customer data,
- billing runtime,
- settlement runtime,
- inventory runtime,
- survey runtime,
- support workflow runtime,
- link reissue runtime,
- complaint/follow-up runtime.

## Recommended PM Decision Options

PM may choose one option later. Task415 does not choose runtime automatically.

Options:

1. Pause after Task415.
2. Continue docs-only with a projection allow-list checklist.
3. Continue docs-only with a route/controller skeleton design packet.
4. Ask the user for explicit local-only runtime authorization.
5. Continue docs-only with a resolver skeleton design packet.
6. Continue docs-only with a local-only synthetic fixture policy.

Task415 must not be interpreted as runtime approval.

## Explicit Non-goals

Task415 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify test files,
- add or modify smoke tests,
- run smoke/browser/API/DB tests,
- modify `package.json`,
- modify localization files or message catalogs,
- implement runtime behavior,
- implement API / route / controller runtime,
- implement resolver runtime,
- implement repository runtime,
- implement permission runtime,
- implement audit/security event tables,
- implement audit/security event query runtime,
- implement support workflow runtime,
- implement case runtime,
- implement complaint runtime,
- implement follow-up runtime,
- implement link reissue runtime,
- implement rate-limit middleware,
- implement abuse detection runtime,
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

Task415 records a future local-only customer-facing runtime authorization
checklist only.

Decision summary:

- Runtime remains blocked until explicit local-only runtime authorization is
  provided.
- DB/DDL/migration remains separately blocked.
- Provider sending remains separately blocked.
- AI/RAG/vector DB remains separately blocked.
- Shared/prod/Zeabur remains out of scope without explicit approval.
- A minimal future spike should prefer no DB, no provider, no AI, synthetic
  fixtures, resolver stub, projection helpers, and generic safe-deny only.

## Verification Plan

For Task415 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw channel data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only checklist.

## Redaction Note

This document contains policy terms such as token, secret, raw channel id,
phone, address, provider payload, `DATABASE_URL`, `line_user_id`, and Zeabur
only as examples of data or runtime boundaries that must not be exposed or
touched without authorization. It does not include credentials, database URLs,
access tokens, secrets, complete customer phone numbers, complete customer
addresses, raw channel identifiers, raw provider payloads, verification codes,
or production data details.
